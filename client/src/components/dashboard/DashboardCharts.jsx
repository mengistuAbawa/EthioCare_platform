import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const chartColors = ["#087e8b", "#3568b8", "#7258a8", "#b85c4b", "#9a7413", "#16794a"];

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="dashboard-chart-tooltip">
      <span>{label}</span>
      <strong>{payload[0].value}</strong>
    </div>
  );
}

export function TrendAreaChart({ data = [], dataKey = "count", color = "#087e8b", height = 220 }) {
  if (!data.length) return null;
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={`trend-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "var(--color-text-secondary)", fontSize: 11 }} />
          <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "var(--color-text-secondary)", fontSize: 11 }} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: color, strokeOpacity: 0.2 }} />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={3}
            fill={`url(#trend-${dataKey})`}
            activeDot={{ r: 5, strokeWidth: 2, fill: "var(--color-surface)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DistributionChart({ data = [], height = 220 }) {
  const total = data.reduce((sum, item) => sum + Number(item.value || 0), 0);
  if (!total) return null;
  return (
    <div className="grid items-center gap-2 sm:grid-cols-[minmax(160px,0.8fr)_1fr]" style={{ minHeight: height }}>
      <div className="relative h-[210px]">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={82} paddingAngle={3} stroke="none">
              {data.map((item, index) => (
                <Cell key={item.name} fill={chartColors[index % chartColors.length]} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
          <strong className="text-2xl text-text-primary">{total}</strong>
          <span className="text-xs text-text-secondary">total</span>
        </div>
      </div>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm">
            <span className="flex min-w-0 items-center gap-2 text-text-secondary">
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: chartColors[index % chartColors.length] }} />
              <span className="truncate capitalize">{item.name}</span>
            </span>
            <strong className="text-text-primary">{item.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MetricBarChart({ data = [], height = 180, color = "#087e8b" }) {
  if (!data.length) return null;
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "var(--color-text-secondary)", fontSize: 11 }} />
          <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "var(--color-text-secondary)", fontSize: 11 }} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-page)" }} />
          <Bar dataKey="value" fill={color} radius={[8, 8, 2, 2]} maxBarSize={44} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
