// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS v6.0 — AUTH PAGE
// File: app/auth/page.tsx
// Includes role selection, welcome message, and signup confirmation flow
// ═══════════════════════════════════════════════════════════════════════════════

"use client";

import { useState, Suspense, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-config";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

type AuthMode = "login" | "signup" | "confirmation";
type UserRole = "distributor" | "client" | "manager";

interface PasswordStrength {
  score: number; // 0-4
  label: string;
}

interface RoleOption {
  id: UserRole;
  title: string;
  description: string;
  icon: string;
  benefits: string[];
}

interface SignupData {
  email: string;
  role: UserRole;
  invite_token?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════════

const PASSWORD_MIN_LENGTH = 8;

const ROLE_OPTIONS: RoleOption[] = [
  {
    id: "distributor",
    title: "Distributor",
    description: "Sell BF Suma products and earn commissions",
    icon: "📦",
    benefits: ["Earn up to 30% commission", "Access wholesale pricing", "Real-time sales tracking"]
  },
  {
    id: "client",
    title: "Client",
    description: "Purchase wellness products for personal use",
    icon: "🌿",
    benefits: ["Exclusive member discounts", "Wellness analytics", "Order history & tracking"]
  },
  {
    id: "manager",
    title: "Manager",
    description: "Manage team and oversee operations",
    icon: "⚙️",
    benefits: ["Team management tools", "Analytics dashboard", "Admin controls"]
  }
];

// ═══════════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════════

const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const signupSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`),
});

function calculatePasswordStrength(password: string): PasswordStrength {
  let score = 0;
  
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score++;
  
  const labels = ["Weak", "Fair", "Good", "Strong"];
  return { score: Math.min(score, 4), label: labels[Math.min(score - 1, 3)] || "" };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Components
// ═══════════════════════════════════════════════════════════════════════════════

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URL params
  const rawNext = searchParams.get("next");
  const next = (rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//')) ? rawNext : "/";
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const inviteToken = searchParams.get("invite");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(errorDescription || null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [confirmedEmail, setConfirmedEmail] = useState<string>("");

  // Create Supabase client once with useMemo
  const supabase = useMemo(() => createBrowserClient(), []);

  const schema = mode === "login" ? loginSchema : signupSchema;
  const form = useForm<{ email: string; password: string }>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
    mode: "onSubmit",
  });
  const password = useWatch({ control: form.control, name: "password" });

  // Derived state
  const isSignup = mode === "signup";
  const isConfirmation = mode === "confirmation";
  const passwordStrength = useMemo(
    () => (isSignup && password ? calculatePasswordStrength(password) : null),
    [isSignup, password]
  );

  // Get selected role details
  const selectedRoleDetails = useMemo(() => {
    return ROLE_OPTIONS.find(role => role.id === selectedRole);
  }, [selectedRole]);

  // Subtitle based on mode
  const subtitleText = useMemo(() => {
    if (isConfirmation) return "Your account has been created successfully";
    if (isSignup && inviteToken) return "Complete your client account setup";
    if (isSignup) return "Select how you want to use BF Suma Nexus";
    return "Enter your credentials to access your account";
  }, [isSignup, isConfirmation, inviteToken]);

  const hasErrors = !!form.formState.errors.email || !!form.formState.errors.password;

  // ═══════════════════════════════════════════════════════════════════════════════
  // Event Handlers (memoized with useCallback)
  // ═══════════════════════════════════════════════════════════════════════════════

  const handleSubmit = form.handleSubmit(async (values) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (mode === "login") {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: values.email.trim(),
          password: values.password,
        });

        if (signInErr) {
          switch (signInErr.message) {
            case "Invalid login credentials":
              setError("Invalid email or password. Please try again.");
              break;
            case "Email not confirmed":
              setError("Please confirm your email address before signing in.");
              break;
            default:
              setError(signInErr.message);
          }
          return;
        }

        router.push(next);
        router.refresh();
      } else {
        // Sign up with role
        const signupData: SignupData = {
          email: values.email.trim(),
          role: selectedRole || 'client'
        };

        // If invite token is present, force role to client and include token
        if (inviteToken) {
          signupData.role = 'client';
          signupData.invite_token = inviteToken;
        }

        const { error: signUpErr, data } = await supabase.auth.signUp({
          email: values.email.trim(),
          password: values.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: signupData
          },
        });

        if (signUpErr) {
          switch (signUpErr.message) {
            case "User already registered":
              setError("An account with this email already exists. Try signing in.");
              break;
            case "Password must be at least 6 characters":
              setError("Password must be at least 6 characters.");
              break;
            default:
              setError(signUpErr.message);
          }
          return;
        }

        if (data.user && !data.session) {
          // Store email for confirmation screen
          setConfirmedEmail(values.email.trim());
          // Show success message
          setSuccessMessage("Check your email for a confirmation link to complete sign-up.");
          form.setValue("password", "");
          // Switch to confirmation mode to show personalized welcome
          setMode("confirmation");
        } else if (data.session) {
          // Role will be provisioned server-side via the auth callback route
          router.push(next);
          router.refresh();
        }
      }
    } catch (err: unknown) {
      console.error("Auth error:", err);
      setError("An unexpected error occurred. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  });

  const toggleMode = useCallback(() => {
    setMode(prev => prev === "login" ? "signup" : "login");
    setError(null);
    setSuccessMessage(null);
    setSelectedRole(null);
    form.reset({ email: "", password: "" });
  }, [form]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const handleRoleSelect = useCallback((role: UserRole) => {
    setSelectedRole(role);
    setError(null);
  }, []);

  const handleProceedToSignup = useCallback(() => {
    if (!selectedRole) {
      setError("Please select a role to continue");
      return;
    }
    setMode("signup");
  }, [selectedRole]);

  const handleBackToRoleSelection = useCallback(() => {
    setMode("signup");
    setSelectedRole(null);
    setSuccessMessage(null);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════════════════

  // Render role selection screen (shown during signup before form)
  const renderRoleSelection = () => (
    <div className="role-selection-container">
      <div className="role-selection-grid">
        {ROLE_OPTIONS.map((role) => (
          <button
            key={role.id}
            type="button"
            onClick={() => handleRoleSelect(role.id)}
            className={`role-card ${selectedRole === role.id ? 'role-card-selected' : ''}`}
          >
            <div className="role-icon">{role.icon}</div>
            <h3 className="role-title">{role.title}</h3>
            <p className="role-description">{role.description}</p>
            <ul className="role-benefits">
              {role.benefits.map((benefit, index) => (
                <li key={index} className="role-benefit">{benefit}</li>
              ))}
            </ul>
            {selectedRole === role.id && (
              <div className="role-checkmark">✓</div>
            )}
          </button>
        ))}
      </div>
      {error && (
        <div className="auth-error mt-4">
          <p role="alert">{error}</p>
        </div>
      )}
      <button
        type="button"
        onClick={handleProceedToSignup}
        disabled={!selectedRole || loading}
        className="auth-button mt-6 w-full"
      >
        Continue with {selectedRole ? selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1) : 'Selected Role'} →
      </button>
    </div>
  );

  // Render confirmation/welcome screen
  const renderConfirmation = () => {
    const roleDetails = selectedRoleDetails;
    return (
      <div className="confirmation-container">
        <div className="confirmation-icon">
          <span style={{ fontSize: '48px' }}>{roleDetails?.icon || '👋'}</span>
        </div>
        
        <h2 className="confirmation-title">
          Welcome, {roleDetails?.title}!
        </h2>
        
        <p className="confirmation-subtitle">
          Your account has been created successfully as a <strong>{roleDetails?.title}</strong>.
        </p>
        
        <div className="confirmation-role-badge">
          <span className="role-badge-icon">{roleDetails?.icon}</span>
          <span className="role-badge-text">{roleDetails?.title}</span>
        </div>
        
        <div className="confirmation-next-steps">
          <h3 className="next-steps-title">What&apos;s Next?</h3>
          <ul className="next-steps-list">
            {roleDetails?.benefits.map((benefit, index) => (
              <li key={index} className="next-step-item">
                <span className="next-step-check">✓</span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="confirmation-email-note">
          <p>We&apos;ve sent a confirmation email to <strong>{confirmedEmail}</strong></p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Please check your inbox and click the confirmation link to activate your account.
          </p>
        </div>
        
        <div className="confirmation-actions">
          <button
            type="button"
            onClick={handleBackToRoleSelection}
            className="confirmation-secondary-button"
          >
            ← Change Role
          </button>
          <button
            type="button"
            onClick={() => router.push('/auth')}
            className="auth-button"
          >
            Go to Sign In →
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] p-6 font-['Outfit',sans-serif]">
      <div className="auth-card">
        {/* Logo & Header */}
        <div className="text-center mb-7">
          <div className="auth-logo">⬡</div>
          <h1 className="text-[22px] font-bold text-[var(--color-text)] mb-1.5">
            BF Suma Nexus
          </h1>
          <p className="text-[13.5px] text-[var(--color-text-muted)] leading-relaxed">
            {isConfirmation ? subtitleText : (isSignup ? "Select your role to get started" : "Sign in to your account")}
          </p>
        </div>

        {/* URL Error Alert */}
        {errorParam === "profile_not_found" && (
          <div className="auth-error mb-4">
            <p>Profile not found. Contact your administrator.</p>
          </div>
        )}

        {/* Render based on mode */}
        {isConfirmation ? (
          renderConfirmation()
        ) : isSignup && !selectedRole && !inviteToken ? (
          renderRoleSelection()
        ) : (
          <>
            {/* Success Message */}
            {successMessage && (
              <div className="auth-success mb-4">
                <p>{successMessage}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* Email Field */}
          <div>
            <label 
              htmlFor="email" 
              className="block text-[12px] font-bold text-[#444440] mb-1.5 uppercase tracking-wider"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              {...form.register("email")}
              required
              autoComplete="email"
              placeholder="you@example.com"
              className={`auth-input ${form.formState.errors.email ? "border-red-400 focus:border-red-500" : ""}`}
            />
            {form.formState.errors.email?.message && (
              <p id="email-error" className="text-[11px] text-red-500 mt-1" role="alert">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label 
              htmlFor="password" 
              className="block text-[12px] font-bold text-[#444440] mb-1.5 uppercase tracking-wider"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                {...form.register("password")}
                required
                minLength={PASSWORD_MIN_LENGTH}
                autoComplete={isSignup ? "new-password" : "current-password"}
                placeholder="••••••••"
                className={`auth-input pr-10 ${form.formState.errors.password ? "border-red-400 focus:border-red-500" : ""}`}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
            
            {/* Password Strength Indicator (signup only) */}
            {isSignup && password && passwordStrength && (
              <div className="mt-2">
                <div className="password-strength">
                  <div className={`password-strength-bar ${passwordStrength.score >= 1 ? (passwordStrength.score === 1 ? "weak" : passwordStrength.score === 2 ? "fair" : passwordStrength.score === 3 ? "good" : "strong") : ""}`} />
                  <div className={`password-strength-bar ${passwordStrength.score >= 2 ? (passwordStrength.score === 2 ? "fair" : passwordStrength.score === 3 ? "good" : "strong") : ""}`} />
                  <div className={`password-strength-bar ${passwordStrength.score >= 3 ? (passwordStrength.score === 3 ? "good" : "strong") : ""}`} />
                  <div className={`password-strength-bar ${passwordStrength.score >= 4 ? "strong" : ""}`} />
                </div>
                <p className="password-strength-text">
                  Password strength: {passwordStrength.label}
                </p>
              </div>
            )}
            
            {form.formState.errors.password?.message && (
              <p id="password-error" className="text-[11px] text-red-500 mt-1" role="alert">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          {/* Error Alert */}
          {error && !successMessage && (
            <div className="auth-error">
              <p role="alert">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || hasErrors}
            className="auth-button mt-1 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="spinner" />
                <span>Please wait…</span>
              </>
            ) : (
              <span>{isSignup ? "Create Account →" : "Sign In →"}</span>
            )}
          </button>
        </form>

        {/* Mode Toggle */}
        <p className="text-center mt-[18px] text-[13px] text-[var(--color-text-muted)]">
          {isSignup ? "Already have an account? " : "Don't have an account? "}
          <button
            type="button"
            onClick={toggleMode}
            className="auth-link"
            disabled={loading}
          >
            {isSignup ? "Sign in" : "Sign up"}
          </button>
        </p>
        </>
      )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Loading Component
// ═══════════════════════════════════════════════════════════════════════════════

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
      <div className="flex flex-col items-center gap-3">
        <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
        <p className="text-[14px] text-[var(--color-text-muted)]">Loading...</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Export
// ═══════════════════════════════════════════════════════════════════════════════

export default function AuthPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AuthPageContent />
    </Suspense>
  );
}
