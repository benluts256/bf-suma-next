// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS — Input Validation Utilities
// lib/utils/validation.ts
// ═══════════════════════════════════════════════════════════════════════════════

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[\d\s-]{10,15}$/;

export function validateEmail(email: string): string | undefined {
  if (!email.trim()) return 'Email is required';
  if (!EMAIL_REGEX.test(email)) return 'Please enter a valid email address';
  return undefined;
}

export function validatePassword(password: string, isSignup = false): string | undefined {
  if (!password) return 'Password is required';
  if (isSignup && password.length < 8) return 'Password must be at least 8 characters';
  if (isSignup && !/[A-Z]/.test(password)) return 'Password must contain an uppercase letter';
  if (isSignup && !/[0-9]/.test(password)) return 'Password must contain a number';
  return undefined;
}

export function validatePhone(phone: string): string | undefined {
  if (!phone.trim()) return undefined; // Phone is optional
  if (!PHONE_REGEX.test(phone)) return 'Please enter a valid phone number';
  return undefined;
}

export function validateRequired(value: string, fieldName: string): string | undefined {
  if (!value.trim()) return `${fieldName} is required`;
  return undefined;
}

export interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
}

export function getPasswordStrength(password: string): PasswordStrength {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const labels: Record<number, { label: string; color: string }> = {
    0: { label: 'Very Weak', color: '#ef4444' },
    1: { label: 'Weak', color: '#f97316' },
    2: { label: 'Fair', color: '#eab308' },
    3: { label: 'Strong', color: '#22c55e' },
    4: { label: 'Very Strong', color: '#16a34a' },
  };

  const capped = Math.min(score, 4);
  return { score: capped, ...labels[capped] };
}

/** Sanitize user input to prevent XSS */
export function sanitize(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
