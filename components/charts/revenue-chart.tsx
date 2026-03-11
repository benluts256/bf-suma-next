'use client';

import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  CartesianGrid, XAxis, YAxis, Legend,
} from 'recharts';
import { formatUGX } from '@/lib/utils/format';

// ── Types ─────────────────────────────────────────────────────────────────────

interface TooltipPayloadItem {
  dataKey: string;
  name: string;
  value: number;
  color?: string;
  stroke?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-xs shadow-xl">
      <p className="text-zinc-400 mb-2 font-medium">{label}</p>
      {payload.map((p) => (
        <p
          key={p.dataKey}
          className="font-bold"
          style={{ color: p.color ?? p.stroke }}
        >
          {p.name}: {p.value > 10000 ? formatUGX(p.value, true) : p.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

// ── Revenue Trend Chart ────────────────────────────────────────────────────────

interface RevenueTrendData {
  date: string;
  revenue: number;
  orders: number;
}

export function RevenueTrendChart({ data }: { data: RevenueTrendData[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(0,0,0,0.05)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: '#9ca3af', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={(v: number) => formatUGX(v, true)}
          tick={{ fill: '#9ca3af', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          width={60}
        />
        <Tooltip content={<ChartTooltip />} />
        <Area
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke="#10b981"
          strokeWidth={2}
          fill="url(#revenueGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Orders Bar Chart ───────────────────────────────────────────────────────────

export function OrdersBarChart({ data }: { data: RevenueTrendData[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
        <CartesianGrid stroke="rgba(0,0,0,0.05)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: '#9ca3af', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fill: '#9ca3af', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="orders" name="Orders" fill="#10b981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Revenue vs Commission Line Chart ──────────────────────────────────────────

export function RevenueCommissionChart({ data }: { data: RevenueTrendData[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
        <CartesianGrid stroke="rgba(0,0,0,0.05)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: '#9ca3af', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={(v: number) => formatUGX(v, true)}
          tick={{ fill: '#9ca3af', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          width={60}
        />
        <Tooltip content={<ChartTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke="#10b981"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey={(d: RevenueTrendData) => Math.round(d.revenue * 0.15)}
          name="Commission"
          stroke="#f59e0b"
          strokeWidth={2}
          strokeDasharray="5 3"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Role Distribution Pie Chart ────────────────────────────────────────────────

interface PieDataItem {
  name: string;
  value: number;
  color: string;
}

export function RoleDistributionChart({ data }: { data: PieDataItem[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={45}
          outerRadius={70}
          dataKey="value"
          paddingAngle={3}
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v) => [`${v}`, '']}
          contentStyle={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            fontSize: 12,
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 11 }}
          formatter={(value) => (
            <span style={{ color: '#6b7280' }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
