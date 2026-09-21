import React from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export const InquiryChart = ({ data }: { data: { date: string; inquiries: number }[] }) => <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 1, height: 1 }}>
  <AreaChart data={data} margin={{ left: -25, right: 12, top: 10, bottom: 0 }}>
    <defs><linearGradient id="inquiry-chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.25} /><stop offset="100%" stopColor="#10b981" stopOpacity={0.02} /></linearGradient></defs>
    <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 4" />
    <XAxis dataKey="date" tickFormatter={value => value.slice(5)} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={32} />
    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
    <Tooltip position={{ x: 12, y: 0 }} wrapperStyle={{ maxWidth: 'calc(100% - 24px)' }} content={({ active, label, payload }) => active && payload?.length ? <div data-testid="overview-chart-tooltip" className="rounded-md border border-slate-200 bg-white p-3 text-xs shadow-sm"><p>{label}</p><p className="mt-1 font-medium text-emerald-700">Inquiries: {payload[0].value}</p></div> : null} />
    <Area type="monotone" dataKey="inquiries" name="Inquiries" stroke="#059669" strokeWidth={2.5} fill="url(#inquiry-chart-fill)" isAnimationActive={false} />
  </AreaChart>
</ResponsiveContainer>;