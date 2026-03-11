"use client";
// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS v6.0 — ADMIN SETTINGS
// File: app/admin/settings/page.tsx
// Sections: Profile · Security/MFA · Platform · Role Management · Notifications
//           Branch Config · Audit Log · Danger Zone
// ═══════════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { usePathname } from "next/navigation";
import MobileNav from "@/components/mobile-nav";

// ── Types ─────────────────────────────────────────────────────────────────────

type SettingsTab =
  | "profile"
  | "security"
  | "platform"
  | "roles"
  | "notifications"
  | "branches"
  | "audit"
  | "danger";

interface ManagerProfile {
  auth_user_id: string;
  full_name:    string;
  email:        string;
  access_level: 1 | 2 | 3;
  mfa_enabled:  boolean;
  mfa_verified_at: string | null;
  last_login_at:   string | null;
  is_active:    boolean;
}

interface AuditEntry {
  id:         string;
  action:     string;
  target:     string;
  actor:      string;
  ip:         string;
  created_at: string;
  severity:   "low" | "medium" | "high";
}

interface RoleUser {
  id:          string;
  full_name:   string;
  email:       string;
  role:        "manager" | "distributor" | "client";
  is_active:   boolean;
  granted_at:  string;
  last_login?: string;
}

interface Branch {
  id:          string;
  name:        string;
  address:     string;
  phone:       string;
  whatsapp:    string;
  lat:         number;
  lng:         number;
  is_primary:  boolean;
  is_active:   boolean;
  hours:       string;
  rating:      number;
}

interface AdminSettingsProps {
  user: {
    id:          string;
    email:       string;
    fullName:    string;
    accessLevel: 1 | 2 | 3;
  };
  onClose?: () => void;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_PROFILE: ManagerProfile = {
  auth_user_id:    "mgr-001",
  full_name:       "Nathan Okello",
  email:           "nathan@bfsuma.co.ug",
  access_level:    3,
  mfa_enabled:     true,
  mfa_verified_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  last_login_at:   new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  is_active:       true,
};

const MOCK_AUDIT: AuditEntry[] = [
  { id:"a1", action:"Approved custom product", target:"Moringa Power Blend",     actor:"Nathan Okello",   ip:"197.157.x.x", created_at: new Date(Date.now()-3600000*1).toISOString(),  severity:"low" },
  { id:"a2", action:"Shadow session started",  target:"Grace Nantume (dist-004)", actor:"Nathan Okello",   ip:"197.157.x.x", created_at: new Date(Date.now()-3600000*3).toISOString(),  severity:"medium" },
  { id:"a3", action:"Role granted",            target:"samuel@nexus.ug → manager",actor:"System",          ip:"—",           created_at: new Date(Date.now()-3600000*8).toISOString(),  severity:"high" },
  { id:"a4", action:"Product rejected",        target:"Baobab Vitamin C",         actor:"Nathan Okello",   ip:"197.157.x.x", created_at: new Date(Date.now()-3600000*24).toISOString(), severity:"low" },
  { id:"a5", action:"MFA verified",            target:"Nathan Okello",            actor:"Nathan Okello",   ip:"197.157.x.x", created_at: new Date(Date.now()-3600000*26).toISOString(), severity:"low" },
  { id:"a6", action:"Platform setting changed",target:"Commission rate → 15%",    actor:"Nathan Okello",   ip:"197.157.x.x", created_at: new Date(Date.now()-86400000*2).toISOString(), severity:"medium" },
  { id:"a7", action:"User deactivated",        target:"david@nexus.ug",           actor:"Nathan Okello",   ip:"197.157.x.x", created_at: new Date(Date.now()-86400000*3).toISOString(), severity:"high" },
  { id:"a8", action:"Branch config updated",   target:"Kampala Boulevard hours",  actor:"Nathan Okello",   ip:"197.157.x.x", created_at: new Date(Date.now()-86400000*4).toISOString(), severity:"low" },
];

const MOCK_ROLES: RoleUser[] = [
  { id:"u1", full_name:"Nathan Okello",   email:"nathan@bfsuma.co.ug",  role:"manager",     is_active:true,  granted_at: new Date(Date.now()-86400000*180).toISOString(), last_login: new Date(Date.now()-1800000).toISOString() },
  { id:"u2", full_name:"Grace Nantume",   email:"grace@nexus.ug",       role:"distributor", is_active:true,  granted_at: new Date(Date.now()-86400000*90).toISOString(),  last_login: new Date(Date.now()-3600000).toISOString() },
  { id:"u3", full_name:"Moses Kiggundu",  email:"moses@nexus.ug",       role:"distributor", is_active:true,  granted_at: new Date(Date.now()-86400000*60).toISOString(),  last_login: new Date(Date.now()-7200000).toISOString() },
  { id:"u4", full_name:"Amara Kato",      email:"amara@mail.ug",        role:"client",      is_active:true,  granted_at: new Date(Date.now()-86400000*30).toISOString(),  last_login: new Date(Date.now()-86400000).toISOString() },
  { id:"u5", full_name:"David Ssemanda",  email:"david@nexus.ug",       role:"distributor", is_active:false, granted_at: new Date(Date.now()-86400000*45).toISOString() },
];

const MOCK_BRANCHES: Branch[] = [
  { id:"b1", name:"Kampala Boulevard", address:"Plot 17/19 Kampala Road, Kampala", phone:"+256 700 000001", whatsapp:"256700000001", lat:0.31580, lng:32.58120, is_primary:true,  is_active:true,  hours:"Mon–Fri 8AM–6PM", rating:4.3 },
  { id:"b2", name:"Burton Street",     address:"12 Burton Street, Kamwokya",       phone:"+256 700 000002", whatsapp:"256700000002", lat:0.33600, lng:32.58900, is_primary:false, is_active:true,  hours:"Mon–Sat 9AM–5PM", rating:4.1 },
];

// ── Utilities ─────────────────────────────────────────────────────────────────

const fmtTime = (iso: string) => {
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  if (diff < 60000)    return "just now";
  if (diff < 3600000)  return `${Math.floor(diff/60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;
  return d.toLocaleDateString("en-UG", { day:"numeric", month:"short", year:"numeric" });
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-UG", { day:"numeric", month:"short", year:"numeric" });

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ title, desc }: { title: string; desc?: string }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: "white", margin: 0, letterSpacing: "-0.01em" }}>{title}</h3>
      {desc && <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 5, lineHeight: 1.6 }}>{desc}</p>}
    </div>
  );
}

function SettingRow({
  label, desc, children, danger
}: { label: string; desc?: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,0.05)",
      gap: 24,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: danger ? "#f87171" : "white", margin: 0 }}>{label}</p>
        {desc && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 3, lineHeight: 1.55 }}>{desc}</p>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function Toggle({ on, onChange, disabled, label }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean; label?: string }) {
  return (
    <button 
      type="button"
      onClick={() => !disabled && onChange(!on)}
      disabled={disabled}
      aria-checked={on}
      aria-label={label ?? (on ? "Enabled" : "Disabled")}
      role="switch"
      style={{
        width: 44, height: 24, borderRadius: 99, border: "none", cursor: disabled ? "not-allowed" : "pointer",
        background: on ? "linear-gradient(135deg,#228B22,#1a6b1a)" : "rgba(255,255,255,0.12)",
        position: "relative", transition: "background 0.22s", opacity: disabled ? 0.5 : 1,
        boxShadow: on ? "0 0 0 3px rgba(34,139,34,0.25)" : "none",
        flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute", top: 3, left: on ? 23 : 3, width: 18, height: 18,
        borderRadius: "50%", background: "white", transition: "left 0.22s cubic-bezier(0.16,1,0.3,1)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
      }} />
    </button>
  );
}

interface PrimaryBtnProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  danger?: boolean;
  type?: "button" | "submit" | "reset";
  style?: React.CSSProperties;
}

function PrimaryBtn({ children, onClick, loading, disabled, danger }: PrimaryBtnProps) {
  return (
    <button 
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      style={{
        height: 38, padding: "0 18px", borderRadius: 10, border: "none",
        background: danger
          ? "linear-gradient(135deg,#ef4444,#b91c1c)"
          : "linear-gradient(135deg,#D4AF37,#b8941f)",
        color: danger ? "white" : "#1a1202",
        fontSize: 13, fontWeight: 700, cursor: loading || disabled ? "not-allowed" : "pointer",
        opacity: loading || disabled ? 0.6 : 1,
        display: "flex", alignItems: "center", gap: 7, transition: "all 0.15s",
      }}
    >
      {loading && <span style={{ width: 13, height: 13, border: "2px solid rgba(0,0,0,0.25)", borderTopColor: danger ? "white" : "#1a1202", borderRadius: "50%", animation: "spin 0.6s linear infinite", display: "inline-block" }} />}
      {children}
    </button>
  );
}

interface SecondaryBtnProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  style?: React.CSSProperties;
}

function SecondaryBtn({ children, onClick, disabled }: SecondaryBtnProps) {
  return (
    <button 
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 38, padding: "0 16px", borderRadius: 10,
        border: "1.5px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.05)",
        color: "rgba(255,255,255,0.7)",
        fontSize: 13, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        display: "flex", alignItems: "center", gap: 7, transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}

interface FieldInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
  mono?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
}

function FieldInput({ label, value, onChange, type = "text", placeholder, hint, mono }: FieldInputProps) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.45)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 7 }}>{label}</label>}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", height: 44, borderRadius: 11,
          border: "1.5px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.04)",
          color: "white", fontSize: 13.5,
          padding: "0 14px", outline: "none",
          fontFamily: mono ? "'JetBrains Mono', monospace" : "inherit",
          transition: "border-color 0.15s",
        }}
        onFocus={e => e.target.style.borderColor = "#228B22"}
        onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
      />
      {hint && <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.3)", marginTop: 5 }}>{hint}</p>}
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.035)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 16, padding: "20px 22px",
      ...style,
    }}>
      {children}
    </div>
  );
}

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  const MAP: Record<string, { bg: string; text: string }> = {
    green:  { bg: "rgba(34,139,34,0.2)",  text: "#4ade80" },
    gold:   { bg: "rgba(212,175,55,0.2)", text: "#D4AF37" },
    red:    { bg: "rgba(239,68,68,0.18)", text: "#f87171" },
    blue:   { bg: "rgba(96,165,250,0.18)",text: "#93c5fd" },
    gray:   { bg: "rgba(255,255,255,0.08)", text: "rgba(255,255,255,0.45)" },
    orange: { bg: "rgba(251,146,60,0.18)", text: "#fb923c" },
  };
  const s = MAP[color] ?? MAP.gray;
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase",
      padding: "3px 9px", borderRadius: 99, background: s.bg, color: s.text,
    }}>
      {children}
    </span>
  );
}

// ── SECTION: Profile ──────────────────────────────────────────────────────────

function ProfileSection({ profile, onSave }: { profile: ManagerProfile; onSave: (p: Partial<ManagerProfile>) => Promise<void> }) {
  const [form, setForm] = useState({ full_name: profile.full_name, email: profile.email });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  const upd = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const [mfaAge] = useState(() => profile.mfa_verified_at
    ? Math.floor((Date.now() - new Date(profile.mfa_verified_at).getTime()) / 3600000)
    : null);

  return (
    <div>
      <SectionHeader title="Manager Profile" desc="Update your display name and contact details. Email changes require re-verification." />

      {/* Avatar + identity card */}
      <Card style={{ marginBottom: 24, display: "flex", gap: 20, alignItems: "center" }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18, flexShrink: 0,
          background: "linear-gradient(135deg,#228B22,#1a6b1a)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 26, fontWeight: 800, color: "white",
          boxShadow: "0 4px 20px rgba(34,139,34,0.4)",
        }}>
          {profile.full_name.split(" ").map(w => w[0]).slice(0, 2).join("")}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: "white", margin: 0 }}>{profile.full_name}</p>
            <Badge color="gold">Level {profile.access_level} Manager</Badge>
            {profile.mfa_enabled && <Badge color="green">MFA Active</Badge>}
          </div>
          <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{profile.email}</p>
          <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
            Last login: {profile.last_login_at ? fmtTime(profile.last_login_at) : "—"}
            {mfaAge !== null && ` · MFA verified ${mfaAge}h ago`}
          </p>
        </div>
      </Card>

      {/* Form */}
      <FieldInput label="Full Name" value={form.full_name} onChange={upd("full_name")} placeholder="Your full name" />
      <FieldInput label="Email Address" value={form.email} onChange={upd("email")} type="email" placeholder="you@bfsuma.co.ug" hint="A confirmation will be sent to your new email." />

      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <PrimaryBtn onClick={handleSave} loading={saving}>
          {saved ? "✓ Saved" : "Save Changes"}
        </PrimaryBtn>
        <SecondaryBtn onClick={() => setForm({ full_name: profile.full_name, email: profile.email })}>
          Discard
        </SecondaryBtn>
      </div>

      {/* Access level info */}
      <div style={{ marginTop: 28 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 14 }}>Access Level Permissions</p>
        {[
          { level: 1, label: "Analyst", perms: ["View dashboards", "View distributor data", "View orders"] },
          { level: 2, label: "Operator", perms: ["Level 1 +", "Approve/reject products", "Shadow sessions", "Manage platform settings"] },
          { level: 3, label: "Super Admin", perms: ["Level 2 +", "Grant/revoke roles", "Deactivate users", "Danger zone actions"] },
        ].map(({ level, label, perms }) => (
          <div key={level} style={{
            display: "flex", gap: 14, alignItems: "flex-start", padding: "12px 16px",
            borderRadius: 12, marginBottom: 8,
            background: profile.access_level === level ? "rgba(34,139,34,0.12)" : "rgba(255,255,255,0.025)",
            border: `1px solid ${profile.access_level === level ? "rgba(34,139,34,0.3)" : "rgba(255,255,255,0.06)"}`,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
              background: profile.access_level === level ? "rgba(34,139,34,0.3)" : "rgba(255,255,255,0.06)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 800,
              color: profile.access_level === level ? "#4ade80" : "rgba(255,255,255,0.3)",
            }}>
              {level}
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: profile.access_level === level ? "white" : "rgba(255,255,255,0.4)", margin: 0 }}>
                {label} {profile.access_level === level && "← You"}
              </p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>{perms.join(" · ")}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SECTION: Security ─────────────────────────────────────────────────────────

function SecuritySection({ profile }: { profile: ManagerProfile }) {
  const [sessions, setSessions]   = useState(3);
  const [mfaWindow, setMfaWindow] = useState(8);
  const [qrVisible, setQrVisible] = useState(false);
  const [verifyCode, setVerify]   = useState("");

  const [now] = useState(() => Date.now());
  const mfaHoursLeft = profile.mfa_verified_at
    ? Math.max(0, mfaWindow - Math.floor((now - new Date(profile.mfa_verified_at).getTime()) / 3600000))
    : 0;

  return (
    <div>
      <SectionHeader title="Security Settings" desc="Manage MFA, active sessions, and password policy for your manager account." />

      {/* MFA status */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "white", margin: 0 }}>
              🔐 TOTP Authenticator
            </p>
            <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.4)", marginTop: 4, lineHeight: 1.55 }}>
              Required for all manager logins. Compatible with Google Authenticator, Authy, and 1Password.
            </p>
            {profile.mfa_enabled && profile.mfa_verified_at && (
              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                <Badge color="green">Verified</Badge>
                <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.35)", alignSelf: "center" }}>
                  Session expires in {mfaHoursLeft}h · Re-verify after {mfaWindow}h
                </span>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            {!profile.mfa_enabled
              ? <PrimaryBtn onClick={() => setQrVisible(true)}>Enable MFA</PrimaryBtn>
              : <SecondaryBtn onClick={() => alert("PRODUCTION: supabase.auth.mfa.unenroll(factorId)")}>Revoke</SecondaryBtn>
            }
          </div>
        </div>

        {/* QR enroll mockup */}
        {qrVisible && (
          <div style={{ marginTop: 18, padding: "16px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.5)", marginBottom: 12 }}>
              Scan this QR code with your authenticator app, then enter the 6-digit code to confirm.
            </p>
            <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
              {/* QR placeholder */}
              <div style={{
                width: 96, height: 96, borderRadius: 10, background: "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, fontSize: 11, color: "#666", textAlign: "center", padding: 6,
              }}>
                QR code<br/>(production)
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>
                  Manual entry key: <code style={{ fontFamily: "monospace", color: "#D4AF37", fontSize: 12 }}>BFSU-MXXX-XXXX</code>
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={verifyCode}
                    onChange={e => setVerify(e.target.value.replace(/\D/g,"").slice(0,6))}
                    placeholder="000000"
                    maxLength={6}
                    style={{
                      width: 110, height: 38, borderRadius: 9, border: "1.5px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.05)", color: "white",
                      fontSize: 18, fontWeight: 700, letterSpacing: "0.2em", textAlign: "center",
                      fontFamily: "monospace", outline: "none",
                    }}
                  />
                  <PrimaryBtn
                    onClick={() => { setQrVisible(false); setSessions(s => s); }}
                    disabled={verifyCode.length !== 6}
                  >
                    Confirm
                  </PrimaryBtn>
                  <SecondaryBtn onClick={() => setQrVisible(false)}>Cancel</SecondaryBtn>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* MFA window setting */}
      <SettingRow label="MFA Session Window" desc="How long a verified MFA session stays active before requiring re-verification.">
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {[4, 8, 12, 24].map(h => (
            <button type="button" key={h}
              onClick={() => setMfaWindow(h)}
              style={{
                height: 32, minWidth: 44, borderRadius: 8, border: "1.5px solid",
                borderColor: mfaWindow === h ? "#228B22" : "rgba(255,255,255,0.1)",
                background: mfaWindow === h ? "rgba(34,139,34,0.2)" : "rgba(255,255,255,0.04)",
                color: mfaWindow === h ? "#4ade80" : "rgba(255,255,255,0.5)",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
              }}
            >
              {h}h
            </button>
          ))}
        </div>
      </SettingRow>

      {/* Password */}
      <SettingRow label="Password" desc="Change the password for your Nexus account.">
        <SecondaryBtn onClick={() => alert("PRODUCTION: supabase.auth.updateUser({ password: newPassword })")}>
          Change Password
        </SecondaryBtn>
      </SettingRow>

      {/* Active sessions */}
      <div style={{ marginTop: 24 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 14 }}>
          Active Sessions ({sessions})
        </p>
        {[
          { device: "Chrome · macOS", ip: "197.157.x.x", location: "Kampala, UG", current: true,  seen: "now" },
          { device: "Safari · iPhone", ip: "197.158.x.x", location: "Kampala, UG", current: false, seen: "2h ago" },
          { device: "Firefox · Windows", ip: "41.210.x.x", location: "Entebbe, UG", current: false, seen: "yesterday" },
        ].map((s, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 16px", borderRadius: 12, marginBottom: 8,
            background: s.current ? "rgba(34,139,34,0.1)" : "rgba(255,255,255,0.025)",
            border: `1px solid ${s.current ? "rgba(34,139,34,0.25)" : "rgba(255,255,255,0.06)"}`,
          }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ fontSize: 20 }}>{s.device.includes("iPhone") ? "📱" : "💻"}</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "white", margin: 0 }}>
                  {s.device} {s.current && <Badge color="green">Current</Badge>}
                </p>
                <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                  {s.ip} · {s.location} · {s.seen}
                </p>
              </div>
            </div>
            {!s.current && (
              <SecondaryBtn onClick={() => setSessions(n => n - 1)}>Revoke</SecondaryBtn>
            )}
          </div>
        ))}
        {sessions > 1 && (
<button type="button"
            onClick={() => setSessions(1)}
            style={{ marginTop: 8, fontSize: 12, color: "#f87171", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
          >
            Revoke all other sessions
          </button>
        )}
      </div>
    </div>
  );
}

// ── SECTION: Platform ─────────────────────────────────────────────────────────

function PlatformSection() {
  const [settings, setSettings] = useState({
    commission_pct:     15,
    vip_threshold_ugx:  5_000_000,
    welcome_bonus_ugx:  50_000,
    checklist_days:     90,
    require_invite:     true,
    auto_approve_bronze:false,
    maintenance_mode:   false,
    sumi_ai_enabled:    true,
    realtime_chat:      true,
    max_custom_products:5,
    min_product_price:  5_000,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  const upd = (k: keyof typeof settings) => (v: string | number | boolean) =>
    setSettings(s => ({ ...s, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 900));
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div>
      <SectionHeader title="Platform Configuration" desc="Global settings that affect all users across the Nexus platform." />

      <Card style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 }}>Commission & Rewards</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <FieldInput label="Distributor Commission (%)" value={String(settings.commission_pct)} onChange={(v: string) => upd("commission_pct")(Number(v))} type="number" hint="Applied to all confirmed orders" />
          <FieldInput label="VIP Threshold (UGX)" value={String(settings.vip_threshold_ugx)} onChange={(v: string) => upd("vip_threshold_ugx")(Number(v))} type="number" mono hint="Total spend to earn VIP status" />
          <FieldInput label="Welcome Bonus (UGX)" value={String(settings.welcome_bonus_ugx)} onChange={(v: string) => upd("welcome_bonus_ugx")(Number(v))} type="number" mono />
          <FieldInput label="Custom Product Min Price (UGX)" value={String(settings.min_product_price)} onChange={(v: string) => upd("min_product_price")(Number(v))} type="number" mono />
        </div>
      </Card>

      <Card style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Wellness Program</p>
        <SettingRow label="90-Day Checklist Length" desc="Number of days in the client wellness journey.">
          <div style={{ display: "flex", gap: 6 }}>
            {[30, 60, 90].map(d => (
              <button type="button" key={d} onClick={() => upd("checklist_days")(d)} style={{
                height: 32, minWidth: 44, borderRadius: 8, border: "1.5px solid",
                borderColor: settings.checklist_days === d ? "#228B22" : "rgba(255,255,255,0.1)",
                background: settings.checklist_days === d ? "rgba(34,139,34,0.2)" : "rgba(255,255,255,0.04)",
                color: settings.checklist_days === d ? "#4ade80" : "rgba(255,255,255,0.5)",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
              }}>{d}d</button>
            ))}
          </div>
        </SettingRow>
        <SettingRow label="Max Custom Products per Distributor">
          <input
            type="number" value={settings.max_custom_products}
            onChange={e => upd("max_custom_products")(Number(e.target.value))}
            min={1} max={20}
            aria-label="Max custom products per distributor"
            title="Max custom products per distributor"
            style={{ width: 70, height: 36, borderRadius: 9, border: "1.5px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "white", fontSize: 14, textAlign: "center", outline: "none" }}
          />
        </SettingRow>
      </Card>

      <Card style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Features & Access</p>
        <SettingRow label="Require Invite Code for Distributors" desc="New distributor signups must have a valid referral code.">
          <Toggle on={settings.require_invite} onChange={upd("require_invite")} />
        </SettingRow>
        <SettingRow label="Auto-approve Bronze distributor products" desc="Skip manual review for Bronze-tier distributors.">
          <Toggle on={settings.auto_approve_bronze} onChange={upd("auto_approve_bronze")} />
        </SettingRow>
        <SettingRow label="Sumi AI Assistant" desc="Enable the AI wellness advisor for all client accounts.">
          <Toggle on={settings.sumi_ai_enabled} onChange={upd("sumi_ai_enabled")} />
        </SettingRow>
        <SettingRow label="Real-time Chat" desc="Allow distributors and clients to message each other via Supabase Realtime.">
          <Toggle on={settings.realtime_chat} onChange={upd("realtime_chat")} />
        </SettingRow>
      </Card>

      {/* Maintenance mode */}
      <Card style={{ marginBottom: 20, border: settings.maintenance_mode ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(255,255,255,0.07)", background: settings.maintenance_mode ? "rgba(239,68,68,0.07)" : undefined }}>
        <SettingRow
          label="🚧 Maintenance Mode"
          desc="Blocks all non-manager logins and shows a maintenance banner to users."
          danger
        >
          <Toggle on={settings.maintenance_mode} onChange={upd("maintenance_mode")} />
        </SettingRow>
        {settings.maintenance_mode && (
          <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(239,68,68,0.12)", marginTop: 8 }}>
            <p style={{ fontSize: 12.5, color: "#f87171", margin: 0 }}>⚠ Platform is currently in maintenance mode. All non-manager users are locked out.</p>
          </div>
        )}
      </Card>

      <PrimaryBtn onClick={handleSave} loading={saving}>
        {saved ? "✓ Settings Saved" : "Save Platform Settings"}
      </PrimaryBtn>
    </div>
  );
}

// ── SECTION: Role Management ──────────────────────────────────────────────────

function RolesSection({ users, accessLevel }: { users: RoleUser[]; accessLevel: number }) {
  const [list, setList]         = useState(users);
  const [search, setSearch]     = useState("");
  const [filterRole, setFilter] = useState<string>("all");
  const [loading, setLoading]   = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole]   = useState<"distributor" | "manager">("distributor");

  const filtered = list.filter(u => {
    const matchSearch = u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole   = filterRole === "all" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const toggleActive = async (id: string) => {
    setLoading(id);
    await new Promise(r => setTimeout(r, 700));
    setList(l => l.map(u => u.id === id ? { ...u, is_active: !u.is_active } : u));
    setLoading(null);
  };

  const ROLE_COLOR: Record<string, string> = {
    manager: "gold", distributor: "green", client: "blue",
  };

  return (
    <div>
      <SectionHeader title="Role Management" desc="View, activate, and manage user access. Level 3 required to grant manager roles." />

      {/* Invite */}
      <Card style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 14 }}>Invite User</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            placeholder="colleague@bfsuma.co.ug"
            type="email"
            style={{
              flex: 1, minWidth: 200, height: 40, borderRadius: 10,
              border: "1.5px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)",
              color: "white", fontSize: 13, padding: "0 14px", outline: "none",
            }}
            onFocus={e => e.target.style.borderColor = "#228B22"}
            onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
          />
          <div style={{ display: "flex", gap: 6 }}>
            {(["distributor", "manager"] as const).map(r => (
              <button type="button" key={r} onClick={() => setInviteRole(r)} style={{
                height: 40, padding: "0 14px", borderRadius: 10, border: "1.5px solid",
                borderColor: inviteRole === r ? "#228B22" : "rgba(255,255,255,0.1)",
                background: inviteRole === r ? "rgba(34,139,34,0.2)" : "rgba(255,255,255,0.04)",
                color: inviteRole === r ? "#4ade80" : "rgba(255,255,255,0.5)",
                fontSize: 12, fontWeight: 700, cursor: "pointer", textTransform: "capitalize",
              }}>{r}</button>
            ))}
          </div>
          <PrimaryBtn
            onClick={() => alert(`PRODUCTION: Send invite email to ${inviteEmail} with role=${inviteRole}`)}
            disabled={!inviteEmail || accessLevel < 2}
          >
            Send Invite
          </PrimaryBtn>
        </div>
        {accessLevel < 2 && <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.3)", marginTop: 8 }}>Requires Level 2+ access.</p>}
      </Card>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search users…"
          style={{
            flex: 1, minWidth: 160, height: 38, borderRadius: 10,
            border: "1.5px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)",
            color: "white", fontSize: 13, padding: "0 12px", outline: "none",
          }}
          onFocus={e => e.target.style.borderColor = "#228B22"}
          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
        />
        {["all", "manager", "distributor", "client"].map(r => (
          <button type="button" key={r} onClick={() => setFilter(r)} style={{
            height: 38, padding: "0 14px", borderRadius: 10, border: "1.5px solid",
            borderColor: filterRole === r ? "#228B22" : "rgba(255,255,255,0.1)",
            background: filterRole === r ? "rgba(34,139,34,0.2)" : "rgba(255,255,255,0.04)",
            color: filterRole === r ? "#4ade80" : "rgba(255,255,255,0.5)",
            fontSize: 12, fontWeight: 700, cursor: "pointer", textTransform: "capitalize",
          }}>{r}</button>
        ))}
      </div>

      {/* User list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map(u => (
          <div key={u.id} style={{
            display: "flex", alignItems: "center", gap: 14, padding: "13px 16px",
            borderRadius: 13, background: "rgba(255,255,255,0.03)",
            border: `1px solid ${!u.is_active ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.06)"}`,
            opacity: u.is_active ? 1 : 0.55,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 11, flexShrink: 0,
              background: u.is_active ? "rgba(34,139,34,0.2)" : "rgba(255,255,255,0.06)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 800, color: u.is_active ? "#4ade80" : "rgba(255,255,255,0.3)",
            }}>
              {u.full_name.split(" ").map(w => w[0]).slice(0, 2).join("")}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: "white" }}>{u.full_name}</span>
                <Badge color={ROLE_COLOR[u.role] ?? "gray"}>{u.role}</Badge>
                {!u.is_active && <Badge color="red">Inactive</Badge>}
              </div>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
                {u.email} · Joined {fmtDate(u.granted_at)}
                {u.last_login && ` · Last active ${fmtTime(u.last_login)}`}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              {loading === u.id ? (
                <span style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.6s linear infinite", display: "inline-block" }} />
              ) : (
                <SecondaryBtn
                  onClick={() => toggleActive(u.id)}
                  disabled={accessLevel < 3 || u.id === "u1"}
                >
                  {u.is_active ? "Deactivate" : "Reactivate"}
                </SecondaryBtn>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", padding: "32px 0", fontSize: 13 }}>No users match your search.</p>
        )}
      </div>
    </div>
  );
}

// ── SECTION: Notifications ────────────────────────────────────────────────────

function NotificationsSection() {
  const [prefs, setPrefs] = useState({
    new_order_email:    true,
    new_order_push:     true,
    product_pending_email: true,
    product_pending_push:  false,
    low_stock_email:    false,
    low_stock_push:     true,
    new_distributor_email: true,
    new_distributor_push:  false,
    weekly_summary_email:  true,
    system_alerts_email:   true,
    system_alerts_push:    true,
  });

  const upd = (k: keyof typeof prefs) => (v: boolean) =>
    setPrefs(p => ({ ...p, [k]: v }));

  const groups = [
    {
      label: "Orders",
      items: [
        { key: "new_order_email", push_key: "new_order_push", label: "New order placed", desc: "When a client places an order" },
      ],
    },
    {
      label: "Products",
      items: [
        { key: "product_pending_email", push_key: "product_pending_push", label: "Product awaiting review", desc: "When a distributor submits a custom product" },
        { key: "low_stock_email", push_key: "low_stock_push", label: "Low stock alert", desc: "When product inventory drops below threshold" },
      ],
    },
    {
      label: "Team",
      items: [
        { key: "new_distributor_email", push_key: "new_distributor_push", label: "New distributor registered", desc: "When a distributor completes sign-up" },
      ],
    },
    {
      label: "Reports",
      items: [
        { key: "weekly_summary_email", push_key: null, label: "Weekly performance summary", desc: "Sent every Monday at 8 AM EAT" },
        { key: "system_alerts_email", push_key: "system_alerts_push", label: "System alerts", desc: "Critical errors and security events" },
      ],
    },
  ];

  return (
    <div>
      <SectionHeader title="Notification Preferences" desc="Configure which events notify you by email and push." />

      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 24, paddingBottom: 10, marginBottom: 4 }}>
        {["Email", "Push"].map(ch => (
          <span key={ch} style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", textTransform: "uppercase", width: 44, textAlign: "center" }}>{ch}</span>
        ))}
      </div>

      {groups.map(g => (
        <div key={g.label} style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>{g.label}</p>
          <Card style={{ padding: "4px 22px" }}>
            {g.items.map((item, i) => (
              <div key={item.key} style={{
                display: "flex", alignItems: "center",
                padding: "14px 0",
                borderBottom: i < g.items.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13.5, fontWeight: 600, color: "white", margin: 0 }}>{item.label}</p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>{item.desc}</p>
                </div>
                <div style={{ display: "flex", gap: 24, flexShrink: 0 }}>
                  <div style={{ width: 44, display: "flex", justifyContent: "center" }}>
                    <Toggle on={prefs[item.key as keyof typeof prefs]} onChange={upd(item.key as keyof typeof prefs)} />
                  </div>
                  <div style={{ width: 44, display: "flex", justifyContent: "center" }}>
                    {item.push_key
                      ? <Toggle on={prefs[item.push_key as keyof typeof prefs]} onChange={upd(item.push_key as keyof typeof prefs)} />
                      : <span style={{ fontSize: 16, opacity: 0.2 }}>—</span>
                    }
                  </div>
                </div>
              </div>
            ))}
          </Card>
        </div>
      ))}

      <div style={{ display: "flex", gap: 10 }}>
        <PrimaryBtn onClick={() => alert("PRODUCTION: Save notification preferences to user_preferences table")}>Save Preferences</PrimaryBtn>
        <SecondaryBtn onClick={() => alert("PRODUCTION: Send test notification")}>Send Test</SecondaryBtn>
      </div>
    </div>
  );
}

// ── SECTION: Branches ─────────────────────────────────────────────────────────

function BranchesSection({ branches }: { branches: Branch[] }) {
  const [list, setList]   = useState(branches);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving]   = useState<string | null>(null);

  const upd = (id: string, k: keyof Branch) => (v: string | number | boolean) =>
    setList(l => l.map(b => b.id === id ? { ...b, [k]: v } : b));

  const handleSave = async (id: string) => {
    setSaving(id);
    await new Promise(r => setTimeout(r, 800));
    setSaving(null); setEditing(null);
  };

  return (
    <div>
      <SectionHeader title="Branch Configuration" desc="Manage Nexus branch locations, hours, and contact details." />

      {list.map(b => (
        <Card key={b.id} style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: editing === b.id ? 18 : 0 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <span style={{ fontSize: 28 }}>📍</span>
              <div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "white", margin: 0 }}>{b.name}</p>
                  {b.is_primary && <Badge color="gold">Primary</Badge>}
                  {b.is_active ? <Badge color="green">Active</Badge> : <Badge color="red">Inactive</Badge>}
                </div>
                <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>
                  {b.address} · ★ {b.rating} · {b.hours}
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <Toggle on={b.is_active} onChange={v => upd(b.id, "is_active")(v)} />
              <SecondaryBtn onClick={() => setEditing(editing === b.id ? null : b.id)}>
                {editing === b.id ? "Cancel" : "Edit"}
              </SecondaryBtn>
            </div>
          </div>

          {editing === b.id && (
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 18 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <FieldInput label="Branch Name"    value={b.name}     onChange={(v: string) => upd(b.id, "name")(v)} />
                <FieldInput label="Address"        value={b.address}  onChange={(v: string) => upd(b.id, "address")(v)} />
                <FieldInput label="Phone"          value={b.phone}    onChange={(v: string) => upd(b.id, "phone")(v)} />
                <FieldInput label="WhatsApp"       value={b.whatsapp} onChange={(v: string) => upd(b.id, "whatsapp")(v)} mono />
                <FieldInput label="Hours"          value={b.hours}    onChange={(v: string) => upd(b.id, "hours")(v)} />
                <FieldInput label="Rating (0–5)"   value={String(b.rating)} onChange={(v: string) => upd(b.id, "rating")(parseFloat(v))} type="number" />
                <FieldInput label="Latitude"       value={String(b.lat)} onChange={(v: string) => upd(b.id, "lat")(parseFloat(v))} type="number" mono />
                <FieldInput label="Longitude"      value={String(b.lng)} onChange={(v: string) => upd(b.id, "lng")(parseFloat(v))} type="number" mono />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <PrimaryBtn onClick={() => handleSave(b.id)} loading={saving === b.id}>Save Branch</PrimaryBtn>
              </div>
            </div>
          )}
        </Card>
      ))}

      <SecondaryBtn onClick={() => alert("PRODUCTION: Open new branch modal / insert branches row")}>
        + Add Branch
      </SecondaryBtn>
    </div>
  );
}

// ── SECTION: Audit Log ────────────────────────────────────────────────────────

function AuditSection({ entries }: { entries: AuditEntry[] }) {
  const [filter, setFilter] = useState<"all" | "low" | "medium" | "high">("all");
  const [search, setSearch] = useState("");

  const filtered = entries.filter(e => {
    const matchSev    = filter === "all" || e.severity === filter;
    const matchSearch = e.action.toLowerCase().includes(search.toLowerCase()) ||
                        e.target.toLowerCase().includes(search.toLowerCase()) ||
                        e.actor.toLowerCase().includes(search.toLowerCase());
    return matchSev && matchSearch;
  });

  const SEV_COLOR: Record<string, string> = { low: "green", medium: "orange", high: "red" };

  return (
    <div>
      <SectionHeader title="Audit Log" desc="Immutable record of all privileged actions taken on the Nexus platform." />

      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search actions…"
          style={{
            flex: 1, minWidth: 160, height: 38, borderRadius: 10,
            border: "1.5px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)",
            color: "white", fontSize: 13, padding: "0 12px", outline: "none",
          }}
          onFocus={e => e.target.style.borderColor = "#228B22"}
          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
        />
        {(["all", "low", "medium", "high"] as const).map(s => (
          <button type="button" key={s} onClick={() => setFilter(s)} style={{
            height: 38, padding: "0 14px", borderRadius: 10, border: "1.5px solid",
            borderColor: filter === s ? "#228B22" : "rgba(255,255,255,0.1)",
            background: filter === s ? "rgba(34,139,34,0.2)" : "rgba(255,255,255,0.04)",
            color: filter === s ? "#4ade80" : "rgba(255,255,255,0.5)",
            fontSize: 12, fontWeight: 700, cursor: "pointer", textTransform: "capitalize",
          }}>{s}</button>
        ))}
        <SecondaryBtn onClick={() => alert("PRODUCTION: Export audit log as CSV")}>Export CSV</SecondaryBtn>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {filtered.map(e => (
          <div key={e.id} style={{
            display: "flex", alignItems: "center", gap: 14, padding: "12px 16px",
            borderRadius: 12, background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.055)",
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
              background: e.severity === "high" ? "#f87171" : e.severity === "medium" ? "#fb923c" : "#4ade80",
              boxShadow: `0 0 6px ${e.severity === "high" ? "rgba(248,113,113,0.6)" : e.severity === "medium" ? "rgba(251,146,60,0.6)" : "rgba(74,222,128,0.4)"}`,
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: "white" }}>{e.action}</span>
                <Badge color={SEV_COLOR[e.severity]}>{e.severity}</Badge>
              </div>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
                Target: <span style={{ color: "rgba(255,255,255,0.55)" }}>{e.target}</span>
                {" · "}Actor: <span style={{ color: "rgba(255,255,255,0.55)" }}>{e.actor}</span>
                {" · "}{e.ip}
              </p>
            </div>
            <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.3)", flexShrink: 0 }}>{fmtTime(e.created_at)}</span>
          </div>
        ))}
        {filtered.length === 0 && (
          <p style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", padding: "32px 0", fontSize: 13 }}>No log entries match your filters.</p>
        )}
      </div>
    </div>
  );
}

// ── SECTION: Danger Zone ──────────────────────────────────────────────────────

function DangerSection({ accessLevel }: { accessLevel: number }) {
  const [confirm, setConfirm] = useState<string | null>(null);
  const [input, setInput]     = useState("");

  const ACTIONS = [
    {
      id: "reset_commissions",
      label: "Reset All Commission Balances",
      desc: "Zeroes out all distributor commission_ugx values. Cannot be undone.",
      confirm_word: "RESET",
      level: 3,
    },
    {
      id: "purge_inactive",
      label: "Purge Inactive Users",
      desc: "Permanently deletes all user accounts inactive for 365+ days. This removes their auth record from Supabase.",
      confirm_word: "PURGE",
      level: 3,
    },
    {
      id: "wipe_checklist",
      label: "Wipe All Checklist Data",
      desc: "Deletes all checklist_entries rows across all clients. Use with extreme caution.",
      confirm_word: "WIPE CHECKLISTS",
      level: 3,
    },
    {
      id: "export_all",
      label: "Export Full Platform Data",
      desc: "Generates a complete data export of all user, order, and transaction data as a password-protected ZIP.",
      confirm_word: "EXPORT",
      level: 2,
    },
  ];

  return (
    <div>
      <SectionHeader title="Danger Zone" desc="Irreversible actions that affect the entire platform. Level 3 access required for destructive operations." />

      <div style={{ padding: "14px 16px", borderRadius: 13, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: "#f87171", margin: 0, lineHeight: 1.6 }}>
          ⚠ Actions in this section are <strong>irreversible</strong>. Each requires typing a confirmation word. All actions are recorded in the audit log.
        </p>
      </div>

      {ACTIONS.map(action => {
        const locked = accessLevel < action.level;
        const isConfirming = confirm === action.id;

        return (
          <Card key={action.id} style={{ marginBottom: 12, border: "1px solid rgba(239,68,68,0.15)", opacity: locked ? 0.5 : 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#f87171", margin: 0 }}>{action.label}</p>
                <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.4)", marginTop: 5, lineHeight: 1.55 }}>{action.desc}</p>
                {locked && <p style={{ fontSize: 11.5, color: "rgba(239,68,68,0.6)", marginTop: 4 }}>Requires Level {action.level} access</p>}
              </div>
              {!isConfirming && (
                <button 
                  type="button"
                  onClick={() => { setConfirm(action.id); setInput(""); }}
                  disabled={locked}
                  style={{
                    height: 36, padding: "0 16px", borderRadius: 9,
                    border: "1.5px solid rgba(239,68,68,0.4)",
                    background: "rgba(239,68,68,0.1)", color: "#f87171",
                    fontSize: 12, fontWeight: 700, cursor: locked ? "not-allowed" : "pointer",
                    flexShrink: 0,
                  }}
                >
                  {action.id === "export_all" ? "Export →" : "Proceed →"}
                </button>
              )}
            </div>

            {isConfirming && (
              <div style={{ marginTop: 16, padding: "14px 16px", borderRadius: 11, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <p style={{ fontSize: 12.5, color: "#f87171", marginBottom: 10 }}>
                  Type <strong style={{ fontFamily: "monospace" }}>{action.confirm_word}</strong> to confirm:
                </p>
                <div style={{ display: "flex", gap: 10 }}>
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={action.confirm_word}
                    autoFocus
                    style={{
                      flex: 1, height: 40, borderRadius: 9,
                      border: `1.5px solid ${input === action.confirm_word ? "rgba(239,68,68,0.6)" : "rgba(255,255,255,0.1)"}`,
                      background: "rgba(255,255,255,0.04)", color: "white",
                      fontSize: 13, fontFamily: "monospace", padding: "0 12px", outline: "none",
                    }}
                  />
                  <PrimaryBtn
                    onClick={() => { setConfirm(null); setInput(""); alert(`PRODUCTION: Execute ${action.id}`); }}
                    disabled={input !== action.confirm_word}
                    danger
                  >
                    Execute
                  </PrimaryBtn>
                  <SecondaryBtn onClick={() => { setConfirm(null); setInput(""); }}>Cancel</SecondaryBtn>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN: ADMIN SETTINGS
// ═══════════════════════════════════════════════════════════════════════════════

// ── Standalone page wrapper ───────────────────────────────────────────────────
// As a Next.js page, this component receives no custom props.
// It uses MOCK_PROFILE as data source; replace with server-side data fetch in production.
export default function AdminSettingsPage() {
  const user = {
    id:          MOCK_PROFILE.auth_user_id,
    email:       MOCK_PROFILE.email,
    fullName:    MOCK_PROFILE.full_name,
    accessLevel: MOCK_PROFILE.access_level,
  };
  return <AdminSettings user={user} />;
}

function AdminSettings({ user, onClose }: AdminSettingsProps) {
  const pathname = usePathname();
  const [tab, setTab] = useState<SettingsTab>("profile");
  const [profile]     = useState<ManagerProfile>({ ...MOCK_PROFILE, full_name: user.fullName, email: user.email, access_level: user.accessLevel, auth_user_id: user.id });

  const NAV_ITEMS: { id: SettingsTab; icon: string; label: string; badge?: string }[] = [
    { id: "profile",       icon: "👤", label: "Profile" },
    { id: "security",      icon: "🔐", label: "Security",      badge: profile.mfa_enabled ? undefined : "!" },
    { id: "platform",      icon: "⚙️",  label: "Platform" },
    { id: "roles",         icon: "🛡️",  label: "Roles" },
    { id: "notifications", icon: "🔔", label: "Notifications" },
    { id: "branches",      icon: "📍", label: "Branches" },
    { id: "audit",         icon: "📋", label: "Audit Log" },
    { id: "danger",        icon: "⚠️",  label: "Danger Zone" },
  ];

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100dvh", width: "100%",
      background: "linear-gradient(160deg,#0f2410 0%,#081608 60%,#050e05 100%)",
      fontFamily: "'Outfit', 'DM Sans', sans-serif",
      overflow: "hidden",
    }}>
      {/* Mobile Navigation */}
      <MobileNav role="admin" currentPath={pathname} />

      {/* Mobile Tab Selector (visible only on mobile) */}
      <div className="settings-mobile-tabs" style={{ display: "none" }}>
        <div style={{
          padding: "12px 16px 0", paddingTop: 56,
          overflowX: "auto", WebkitOverflowScrolling: "touch",
        }}>
          <div style={{ display: "flex", gap: 6, minWidth: "max-content" }}>
            {NAV_ITEMS.map(item => (
              <button 
                type="button"
                key={item.id}
                onClick={() => setTab(item.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 14px", borderRadius: 10, border: "none",
                  cursor: "pointer", whiteSpace: "nowrap",
                  background: tab === item.id ? "rgba(34,139,34,0.2)" : "rgba(255,255,255,0.04)",
                  color: tab === item.id ? "#228B22" : "rgba(255,255,255,0.5)",
                  fontSize: 12, fontWeight: 600, minHeight: 36,
                }}
              >
                <span>{item.icon}</span>
                {item.label}
                {item.badge && (
                  <span style={{
                    fontSize: 10, fontWeight: 800, color: "#f87171",
                    background: "rgba(239,68,68,0.2)", borderRadius: 99, padding: "1px 6px",
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; }
        input::placeholder { color: rgba(255,255,255,0.2); }
        button:hover:not(:disabled) { filter: brightness(1.08); }
        @media (max-width: 767px) {
          .settings-sidebar { display: none !important; }
          .settings-main { padding: 20px 16px 80px 16px !important; }
          .settings-mobile-tabs { display: block !important; }
        }
      `}</style>

      {/* ── Sidebar (hidden on mobile via CSS) ─────────────────────────────── */}
      <div className="settings-sidebar" style={{
        width: 220, flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.07)",
        display: "flex", flexDirection: "column", padding: "24px 12px",
        background: "rgba(0,0,0,0.2)",
      }}>
        {/* Header */}
        <div style={{ padding: "0 8px", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 800, color: "white", margin: 0, letterSpacing: "-0.02em" }}>Settings</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>Admin · Level {user.accessLevel}</p>
            </div>
            {onClose && (
              <button type="button" onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 4 }}>✕</button>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV_ITEMS.map(item => (
            <button 
              type="button"
              key={item.id}
              onClick={() => setTab(item.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                borderRadius: 11, border: "none", cursor: "pointer", textAlign: "left",
                background: tab === item.id ? "rgba(34,139,34,0.2)" : "transparent",
                color: tab === item.id ? "white" : "rgba(255,255,255,0.45)",
                fontSize: 13, fontWeight: tab === item.id ? 700 : 500,
                transition: "all 0.15s",
                position: "relative",
              }}
            >
              <span style={{ fontSize: 15, lineHeight: 1 }}>{item.icon}</span>
              {item.label}
              {item.badge && (
                <span style={{
                  marginLeft: "auto", fontSize: 10, fontWeight: 800, color: "#f87171",
                  background: "rgba(239,68,68,0.2)", borderRadius: 99, padding: "1px 6px",
                }}>
                  {item.badge}
                </span>
              )}
              {tab === item.id && (
                <span style={{
                  position: "absolute", left: 0, top: "25%", bottom: "25%",
                  width: 3, borderRadius: 99, background: "#228B22",
                }} />
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: "0 8px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16 }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", lineHeight: 1.5 }}>
            BF Suma Nexus v6.0<br />
            🔒 Supabase RLS · All actions logged
          </p>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div className="settings-main" style={{ flex: 1, overflowY: "auto", padding: "36px 40px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", animation: "fadeUp 0.3s ease both", width: "100%" }} key={tab}>

          {tab === "profile" && (
            <ProfileSection
              profile={profile}
              onSave={async () => { await new Promise(r => setTimeout(r, 800)); }}
            />
          )}

          {tab === "security" && <SecuritySection profile={profile} />}

          {tab === "platform" && <PlatformSection />}

          {tab === "roles" && (
            <RolesSection users={MOCK_ROLES} accessLevel={user.accessLevel} />
          )}

          {tab === "notifications" && <NotificationsSection />}

          {tab === "branches" && <BranchesSection branches={MOCK_BRANCHES} />}

          {tab === "audit" && <AuditSection entries={MOCK_AUDIT} />}

          {tab === "danger" && <DangerSection accessLevel={user.accessLevel} />}
        </div>
      </div>
      </div>
    </div>
  );
}




