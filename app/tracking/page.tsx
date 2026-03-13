// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS v6.0 — ORDER TRACKING PAGE
// File: app/tracking/page.tsx
// Public order tracking page with real Supabase integration
// ═══════════════════════════════════════════════════════════════════════════════

"use client";

import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import type { ApiResult } from "@/lib/api/result";
import { orderTrackSchema, type OrderTrackInput } from "@/lib/schemas/orders";

interface OrderData {
  id: string;
  status: string;
  estimated_delivery: string | null;
  created_at: string;
  total_amount: number;
  items_count: number;
  shipping_address: string | null;
}

export default function TrackingPage() {
  const form = useForm<OrderTrackInput>({
    resolver: zodResolver(orderTrackSchema),
    defaultValues: { orderId: "" },
  });
  const orderIdValue = useWatch({ control: form.control, name: "orderId" });

  const trackMutation = useMutation({
    mutationFn: async (input: OrderTrackInput) => {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = (await res.json()) as ApiResult<{ order: OrderData }>;
      return { res, json };
    },
    onSuccess: ({ res, json }) => {
      if (!res.ok || json.ok === false) {
        if (json.ok === false && json.error.code === "VALIDATION_ERROR" && json.error.fieldErrors?.orderId?.[0]) {
          form.setError("orderId", { type: "server", message: json.error.fieldErrors.orderId[0] });
          return;
        }
        form.setError("orderId", { type: "server", message: json.ok === false ? json.error.message : "Unable to track order" });
      }
    },
    onError: () => {
      form.setError("orderId", { type: "server", message: "An unexpected error occurred. Please try again later." });
    },
  });

  const result = useMemo(() => {
    const json = trackMutation.data?.json;
    if (!json) return { order: null as OrderData | null, error: null as string | null };
    if (json.ok === false) return { order: null, error: json.error.message };
    return { order: json.data.order, error: null };
  }, [trackMutation.data]);

  const handleTrack = form.handleSubmit(async (values) => {
    await trackMutation.mutateAsync(values);
  });

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === "delivered") return "bg-green-100 text-green-800";
    if (statusLower === "shipped") return "bg-blue-100 text-blue-800";
    if (statusLower === "processing") return "bg-amber-100 text-amber-800";
    if (statusLower === "cancelled") return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-UG", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    } catch {
      return dateString;
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX"
    }).format(amount);
  };

  return (
    <main className="min-h-screen bg-[#fafaf9] py-20 px-6">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#1a3a1a] mb-2">
            Track Your Order
          </h1>
          <p className="text-zinc-500 text-sm">
            Enter your order ID to check the status
          </p>
        </div>

        <form onSubmit={handleTrack} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              {...form.register("orderId")}
              placeholder="e.g., ORD-12345"
              className="flex-1 h-12 px-4 rounded-xl border border-zinc-300 focus:border-[#228B22] focus:outline-none"
              disabled={trackMutation.isPending}
            />
            <button
              type="submit"
              disabled={trackMutation.isPending || !orderIdValue?.trim()}
              className="h-12 px-6 bg-[#228B22] text-white font-semibold rounded-xl hover:bg-[#1a6b1a] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {trackMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Tracking...
                </span>
              ) : "Track"}
            </button>
          </div>
          {form.formState.errors.orderId?.message && (
            <p className="mt-2 text-sm text-red-700">{form.formState.errors.orderId.message}</p>
          )}
        </form>

        {/* Error Message */}
        {result.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="text-red-500 text-xl">⚠</span>
              <div>
                <p className="text-red-800 font-medium">Unable to find order</p>
                <p className="text-red-600 text-sm">{result.error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Order Details */}
        {result.order && (
          <div className="bg-white rounded-xl border border-zinc-200 p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-zinc-500">Order ID</p>
                <p className="font-mono font-semibold text-[#1a3a1a] text-lg">{result.order.id}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(result.order.status)}`}>
                {result.order.status}
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-zinc-100">
                <span className="text-sm text-zinc-500">Order Date</span>
                <span className="text-sm font-medium text-[#1a3a1a]">{formatDate(result.order.created_at)}</span>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b border-zinc-100">
                <span className="text-sm text-zinc-500">Total Amount</span>
                <span className="text-sm font-bold text-[#228B22]">{formatAmount(result.order.total_amount)}</span>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b border-zinc-100">
                <span className="text-sm text-zinc-500">Items</span>
                <span className="text-sm font-medium text-[#1a3a1a]">{result.order.items_count} product(s)</span>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b border-zinc-100">
                <span className="text-sm text-zinc-500">Estimated Delivery</span>
                <span className="text-sm font-medium text-[#1a3a1a]">
                  {result.order.estimated_delivery 
                    ? formatDate(result.order.estimated_delivery) 
                    : "2-3 business days"}
                </span>
              </div>

              {result.order.shipping_address && (
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-zinc-500">Shipping Address</span>
                  <span className="text-sm font-medium text-[#1a3a1a] max-w-[200px] text-right">
                    {result.order.shipping_address}
                  </span>
                </div>
              )}
            </div>

            {/* Progress indicator */}
            <div className="mt-6 pt-6 border-t border-zinc-100">
              <p className="text-xs text-zinc-400 uppercase tracking-wide mb-3">Order Progress</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-green-500 rounded-full" />
                <div className={`flex-1 h-2 rounded-full ${["shipped", "delivered"].includes(result.order.status.toLowerCase()) ? "bg-green-500" : "bg-zinc-200"}`} />
                <div className={`flex-1 h-2 rounded-full ${result.order.status.toLowerCase() === "delivered" ? "bg-green-500" : "bg-zinc-200"}`} />
              </div>
              <div className="flex justify-between mt-2 text-xs text-zinc-400">
                <span>Placed</span>
                <span>Shipped</span>
                <span>Delivered</span>
              </div>
            </div>
          </div>
        )}

        {/* Help text */}
        {!result.order && !result.error && !trackMutation.isPending && (
          <div className="text-center mt-8 text-sm text-zinc-400">
            <p>Don&apos;t know your order ID?</p>
            <p className="mt-1">Check your confirmation email for the order details.</p>
          </div>
        )}
      </div>
    </main>
  );
}
