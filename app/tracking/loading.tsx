export default function TrackingLoading() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-green-200 border-t-green-700 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-500">Loading order tracking...</p>
      </div>
    </div>
  )
}
