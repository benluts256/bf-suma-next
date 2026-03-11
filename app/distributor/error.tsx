'use client'

import { useEffect } from 'react'

export default function DistributorError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Distributor error:', error)
  }, [error])

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-md">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Something Went Wrong</h2>
        <p className="text-sm text-gray-600 mb-6">
          We couldn&apos;t load the distributor panel. Please try again.
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors text-sm font-medium"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
