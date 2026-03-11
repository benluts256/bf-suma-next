// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS v6.0 — LOADING STATE
// File: app/loading.tsx
// Loading skeleton for route transitions
// ═══════════════════════════════════════════════════════════════════════════════

export default function Loading() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-zinc-50">
      <div className="text-center">
        {/* Loading Spinner */}
        <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
          <div className="w-12 h-12 border-4 border-[#228B22] border-t-transparent rounded-full animate-spin"></div>
        </div>
        
        {/* Loading Text */}
        <p className="text-zinc-600 font-medium">Loading...</p>
      </div>
    </div>
  );
}
