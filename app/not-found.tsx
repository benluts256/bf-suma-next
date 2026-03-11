// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS v6.0 — NOT FOUND PAGE
// File: app/not-found.tsx
// Custom 404 page for undefined routes
// ═══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-zinc-50 p-4">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg border border-zinc-200">
        <div className="text-center">
          {/* 404 Icon */}
          <div className="mx-auto w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mb-6">
            <span className="text-4xl font-bold text-zinc-400">404</span>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-zinc-900 mb-2">
            Page not found
          </h2>

          {/* Description */}
          <p className="text-zinc-600 mb-6">
            The page you are looking for does not exist or has been moved.
          </p>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            <Link
              href="/"
              className="px-6 py-2 bg-[#228B22] text-white rounded-lg font-medium hover:bg-[#1a6b1a] transition-colors"
            >
              Go home
            </Link>
            <Link
              href="/auth"
              className="px-6 py-2 bg-zinc-100 text-zinc-700 rounded-lg font-medium hover:bg-zinc-200 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
