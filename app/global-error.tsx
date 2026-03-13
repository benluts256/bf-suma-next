"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global application error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-[100dvh] flex items-center justify-center bg-zinc-50 p-4">
        <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg border border-zinc-200">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-zinc-900 mb-2">
              Something went wrong
            </h2>

            <p className="text-zinc-600 mb-6">
              An unexpected error occurred. Please try again or contact support if
              the problem persists.
            </p>

            {error.digest && (
              <p className="text-xs text-zinc-400 mb-4">
                Error ID: {error.digest}
              </p>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={reset}
                className="px-6 py-2 bg-[#228B22] text-white rounded-lg font-medium hover:bg-[#1a6b1a] transition-colors"
              >
                Try again
              </button>
              <Link
                href="/"
                className="px-6 py-2 bg-zinc-100 text-zinc-700 rounded-lg font-medium hover:bg-zinc-200 transition-colors"
              >
                Go home
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

