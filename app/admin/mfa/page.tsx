// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS v6.0 — MANAGER MFA PAGE
// File: app/admin/mfa/page.tsx
// TOTP verification step before accessing the admin dashboard.
// Writes mfa_verified_at to manager_profiles on success.
// ═══════════════════════════════════════════════════════════════════════════════

"use client";

import { useState, useCallback, useEffect, useMemo, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-config";
import type { AuthError } from "@supabase/supabase-js";

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS & TYPES
// ═══════════════════════════════════════════════════════════════════════════════

const MFA_CODE_LENGTH = 6;

type MFAStep = "idle" | "verifying" | "updatingProfile" | "redirecting";

interface MFAErrors {
  /** Predefined error messages for common failure scenarios */
  readonly INVALID_CODE: string;
  readonly NO_MFA_ENROLLED: string;
  readonly VERIFICATION_FAILED: string;
  readonly NETWORK_ERROR: string;
  readonly SESSION_EXPIRED: string;
}

const ERROR_MESSAGES: MFAErrors = {
  INVALID_CODE: "Please enter the 6-digit code from your authenticator app.",
  NO_MFA_ENROLLED: "No MFA factor enrolled. Contact your administrator.",
  VERIFICATION_FAILED: "Verification failed. Please check your code and try again.",
  NETWORK_ERROR: "Network error. Please check your connection and try again.",
  SESSION_EXPIRED: "Your session has expired. Please sign in again.",
};

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM HOOK: MFA VERIFICATION LOGIC
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Custom hook encapsulating MFA verification business logic
 * Separates concerns: UI remains focused on presentation while this handles
 * authentication flow, state management, and error handling.
 */
function useMFAVerification() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const router = useRouter();

  const [code, setCode] = useState("");
  const [step, setStep] = useState<MFAStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [lastVerifiedAt, setLastVerifiedAt] = useState<Date | null>(null);

  // Clear error when code changes (helps user retry after error)
  useEffect(() => {
    if (error) setError(null);
  }, [code, error]);

  /**
   * Validates the MFA code input before attempting verification
   */
  const validateCode = useCallback((input: string): boolean => {
    const cleanCode = input.replace(/\D/g, "");
    if (cleanCode.length !== MFA_CODE_LENGTH) {
      setError(ERROR_MESSAGES.INVALID_CODE);
      return false;
    }
    return true;
  }, []);

  /**
   * Attempts to verify the TOTP code with Supabase Auth
   */
  const verifyCode = useCallback(async (): Promise<boolean> => {
    if (!validateCode(code)) return false;

    setStep("verifying");
    setError(null);
    setAttempts((prev) => prev + 1);

    try {
      // ── Step 1: List TOTP factors and get the first one ──
      const { data: factorsData, error: listError } = await supabase.auth.mfa.listFactors();

      if (listError) throw listError;

      const totpFactors = factorsData?.all?.filter(
        (f) => f.factor_type === "totp"
      ) ?? [];

      if (!totpFactors.length) {
        throw new Error(ERROR_MESSAGES.NO_MFA_ENROLLED);
      }

      const factorId = totpFactors[0].id;

      // ── Step 2: Verify TOTP code with Supabase ──
      const { error: mfaError } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: code.replace(/\D/g, ""),
      });

      if (mfaError) {
        // Provide more specific error messages based on error type
        if ((mfaError as AuthError).status === 401) {
          throw new Error("Invalid code. Please check your authenticator app.");
        }
        throw mfaError;
      }

      // ── Step 3: Update manager profile with verification timestamp ──
      setStep("updatingProfile");

      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        throw new Error(ERROR_MESSAGES.SESSION_EXPIRED);
      }

      try {
        await fetch("/api/admin/mfa/verified", { method: "POST" });
      } catch (updateError) {
        // Log but don't block - verification succeeded
        console.error("Failed to update MFA timestamp:", updateError);
      }

      setLastVerifiedAt(new Date());
      setStep("redirecting");

      // ── Step 4: Redirect to dashboard ──
      // Small delay for visual feedback
      await new Promise((resolve) => setTimeout(resolve, 500));
      router.push("/admin/dashboard");

      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error
        ? err.message
        : ERROR_MESSAGES.VERIFICATION_FAILED;

      // Don't expose internal errors to users
      setError(errorMessage.includes("MFA") || errorMessage.includes("factor")
        ? ERROR_MESSAGES.NO_MFA_ENROLLED
        : errorMessage);

      setStep("idle");
      return false;
    }
  }, [code, router, supabase, validateCode]);

  /**
   * Signs out the user and redirects to auth page
   */
  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  }, [router, supabase]);

  /**
   * Resets the form to initial state
   */
  const resetForm = useCallback(() => {
    setCode("");
    setError(null);
    setStep("idle");
  }, []);

  return {
    // State
    code,
    setCode,
    step,
    error,
    attempts,
    lastVerifiedAt,
    // Computed
    isLoading: step === "verifying" || step === "updatingProfile" || step === "redirecting",
    isDisabled: step !== "idle" || code.length !== MFA_CODE_LENGTH,
    // Actions
    verifyCode,
    handleSignOut,
    resetForm,
  };
}

// ═════════════════════════════════════════════════════════════════════════════──
// COMPONENT: MFA PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function MFAPage() {
  const {
    code,
    setCode,
    step,
    error,
    attempts,
    isLoading,
    isDisabled,
    verifyCode,
    handleSignOut,
  } = useMFAVerification();

  /**
   * Handle form submission - prevents default and triggers verification
   */
  const handleSubmit = useCallback((e: FormEvent) => {
    e.preventDefault();
    verifyCode();
  }, [verifyCode]);

  /**
   * Handle input change - only allows numeric characters
   */
  const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, MFA_CODE_LENGTH);
    setCode(value);
  }, [setCode]);

  /**
   * Handle Enter key press on input
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && code.length === MFA_CODE_LENGTH) {
      verifyCode();
    }
  }, [code.length, verifyCode]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] p-6">
      <div
        className="w-full max-w-md bg-[var(--color-surface)] rounded-[var(--radius-xl)] 
                   p-9 shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-[var(--color-border)]"
      >
        {/* ═══════════════════════════════════════════════════════
            HEADER: Logo & Title
        ═══════════════════════════════════════════════════════════ */}
        <header className="text-center mb-7">
          <div
            className="w-13 h-13 rounded-[var(--radius-md)] bg-gradient-to-br from-green-600 to-green-800
                       flex items-center justify-center text-2xl mx-auto mb-3.5
                       shadow-[0_4px_20px_rgba(34,139,34,0.35)]"
            aria-hidden="true"
          >
            ⬡
          </div>
          <h1 className="text-[22px] font-bold text-[var(--color-text)] mb-1.5">
            Manager Verification
          </h1>
          <p className="text-[13.5px] text-[var(--color-text-muted)] leading-relaxed">
            Enter the 6-digit code from your authenticator app to access the admin dashboard.
          </p>
        </header>

        {/* ═══════════════════════════════════════════════════════
            FORM: MFA Code Input
        ═══════════════════════════════════════════════════════════ */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="mfa-code"
              className="block text-[12.5px] font-bold text-[#444440] mb-2"
            >
              Authenticator Code
            </label>
            <input
              id="mfa-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={MFA_CODE_LENGTH}
              value={code}
              onChange={handleCodeChange}
              onKeyDown={handleKeyDown}
              placeholder="000000"
              disabled={isLoading}
              autoComplete="one-time-code"
              aria-describedby={error ? "mfa-error" : undefined}
              className={`w-full h-14 rounded-[var(--radius-md)] border-2 text-center text-2xl font-bold tracking-[0.3em] outline-none font-['JetBrains_Mono',monospace] transition-colors duration-150 ${error ? "border-red-500 bg-red-50 text-[var(--color-text)]" : "border-[var(--color-border)] bg-white text-[var(--color-text)]"} ${isLoading ? "opacity-50 cursor-not-allowed" : "focus:border-[var(--color-green-primary)]"} disabled:opacity-50 disabled:cursor-not-allowed`}
            />
            {error && (
              <p
                id="mfa-error"
                role="alert"
                className="text-xs text-red-500 mt-1.5 flex items-center gap-1"
              >
                <span aria-hidden="true">⚠</span>
                {error}
              </p>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════
              ACTION: Verify Button
          ═══════════════════════════════════════════════════════════ */}
          <button
            type="submit"
            disabled={isDisabled}
            className={`w-full h-12.5 rounded-[var(--radius-md)] border-none bg-gradient-to-r from-[var(--color-gold)] to-[var(--color-gold-dark)] text-[#1a1202] text-[15px] font-bold cursor-pointer flex items-center justify-center gap-2 transition-all duration-150 ${isDisabled ? "opacity-65 cursor-not-allowed" : "hover:opacity-90 active:scale-[0.98]"}`}
          >
            {isLoading ? (
              <>
                <SpinnerIcon />
                {step === "verifying" && "Verifying..."}
                {step === "updatingProfile" && "Updating..."}
                {step === "redirecting" && "Redirecting..."}
              </>
            ) : (
              <>
                Verify & Enter Dashboard
                <span aria-hidden="true">→</span>
              </>
            )}
          </button>
        </form>

        {/* ═══════════════════════════════════════════════════════
            FOOTER: Sign Out Link & Attempts Info
        ═══════════════════════════════════════════════════════════ */}
        <footer className="mt-5 text-center">
          {attempts > 0 && (
            <p className="text-[11px] text-[var(--color-text-muted)] mb-3">
              Attempt {attempts} {attempts === 1 ? "try" : "tries"}
            </p>
          )}
          <p className="text-[12px] text-[var(--color-text-muted)]">
            Wrong account?{" "}
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isLoading}
              className="text-[var(--color-text-muted)] bg-none border-none cursor-pointer 
                         text-xs underline hover:text-[var(--color-text)] transition-colors
                         disabled:opacity-50"
            >
              Sign out
            </button>
          </p>
        </footer>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ICONS: Spinner
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Animated spinner icon for loading states
 * Uses CSS animation defined in global styles
 */
function SpinnerIcon() {
  return (
    <span
      className="w-4.5 h-4.5 border-2 border-[rgba(26,18,2,0.25)] border-t-[#1a1202] 
                 rounded-full inline-block animate-spin"
      aria-hidden="true"
    />
  );
}
