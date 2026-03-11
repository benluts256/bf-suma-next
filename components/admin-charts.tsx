"use client";
// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS — ADMIN CHARTS (Lazy-loaded recharts wrapper)
// File: components/admin-charts.tsx
// Extracted from admin-command-center.tsx to enable code-splitting of recharts
// ═══════════════════════════════════════════════════════════════════════════════

import React from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Tooltip, ResponsiveContainer,
  CartesianGrid, XAxis, YAxis,
} from "recharts";
import { Cell } from "recharts";
import { formatUGX } from "@/lib/supabase-config";

// ── Types ─────────────────────────────────────────────────────────────────────
interface TooltipPayloadItem {
  dataKey: string;
  name: string;
  value: number;
  color?: string;
  stroke?: string;
}

interface ChartTipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

interface SalesTrendItem {
  date: string;
  ugx: number;
  orders: number;
}

interface PieDataItem {
  name: string;
  value: number;
  color: string;
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────
function ChartTip({ active, payload, label }: ChartTipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f2410] border border-white/10 rounded-xl px-4 py-3 text-xs shadow-2xl">
      <p className="text-white/50 mb-1">{label}</p>
      {payload.map((p) => (
        <p
          key={p.dataKey}
          className="font-bold [color:var(--tip-color)]"
          style={{ "--tip-color": p.color ?? p.stroke } as React.CSSProperties}
        >
          {p.name}: {p.value > 10000 ? formatUGX(p.value, true) : p.value}
        </p>
      ))}
    </div>
  );
}

// ── Commission data accessor ───────────────────────────────────────────────────
function getCommission(d: { ugx: number }): number {
  return Math.round(d.ugx * 0.15);
}

// ═══════════════════════════════════════════════════════════════════════════════
// OVERVIEW CHARTS
// ═══════════════════════════════════════════════════════════════════════════════

export function SalesTrendChart({ data }: { data: SalesTrendItem[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#228B22" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#228B22" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickLine={false} axisLine={false} interval={6} />
        <YAxis tickFormatter={(v: number) => formatUGX(v, true)} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickLine={false} axisLine={false} />
        <Tooltip content={<ChartTip />} />
        <Area type="monotone" dataKey="ugx" name="Revenue" stroke="#228B22" strokeWidth={2} fill="url(#sg)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ProductMixChart({ data }: { data: PieDataItem[] }) {
  return (
    <ResponsiveContainer width="100%" height={130}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={38} outerRadius={60} dataKey="value" paddingAngle={2}>
          {data.map((e, i) => <Cell key={i} fill={e.color} />)}
        </Pie>
        <Tooltip
          formatter={(v) => [`${v}%`]}
          contentStyle={{ background: "#0f2410", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANALYTICS CHARTS
// ═══════════════════════════════════════════════════════════════════════════════

export function OrderVolumeChart({ data }: { data: SalesTrendItem[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickLine={false} axisLine={false} />
        <Tooltip content={<ChartTip />} />
        <Bar dataKey="orders" name="Orders" fill="#228B22" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RevenueCommissionChart({ data }: { data: SalesTrendItem[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis tickFormatter={(v: number) => formatUGX(v, true)} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickLine={false} axisLine={false} />
        <Tooltip content={<ChartTip />} />
        <Line type="monotone" dataKey="ugx"           name="Revenue"    stroke="#228B22" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey={getCommission} name="Commission" stroke="#D4AF37" strokeWidth={2} strokeDasharray="5 3" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
