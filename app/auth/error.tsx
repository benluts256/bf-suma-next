'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Auth error:', error)
  }, [error])

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-md">
        <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Authentication Error</h2>
        <p className="text-sm text-gray-600 mb-6">
          There was a problem with authentication. Please try signing in again.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
          >
            Try Again
          </button>
          <Link
            href="/auth"
            className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors text-sm font-medium"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
