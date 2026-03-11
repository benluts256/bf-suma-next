'use client'

export default function OfflinePage() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728M5.636 18.364a9 9 0 010-12.728M12 9v4m0 4h.01" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">You&apos;re Offline</h1>
        <p className="text-gray-600 mb-6">
          It looks like you&apos;ve lost your internet connection. Some features may be unavailable.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
