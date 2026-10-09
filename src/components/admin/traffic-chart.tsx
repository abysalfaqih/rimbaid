'use client'

import { useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export type TrafficPoint = { day: string; views: number; downloads: number }

const RANGES = [7, 14, 30] as const

function formatDay(day: string) {
  return new Date(`${day}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

export function TrafficChart({ data }: { data: TrafficPoint[] }) {
  const [range, setRange] = useState<(typeof RANGES)[number]>(14)
  const visible = data.slice(-range)

  const totalViews = visible.reduce((sum, p) => sum + p.views, 0)
  const totalDownloads = visible.reduce((sum, p) => sum + p.downloads, 0)

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold">Traffic</h2>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-primary" />
              {totalViews} views
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-foreground" />
              {totalDownloads} downloads
            </span>
          </div>
        </div>

        <div className="inline-flex rounded-lg border border-border p-0.5">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`rounded-md px-3 py-1 text-sm transition-colors ${
                range === r ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {r} hari
            </button>
          ))}
        </div>
      </div>

      <div className="h-64 w-full" role="img" aria-label={`Grafik views dan downloads ${range} hari terakhir`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={visible} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="day"
              tickFormatter={formatDay}
              tickLine={false}
              axisLine={false}
              minTickGap={24}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              width={44}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            />
            <Tooltip
              cursor={{ stroke: 'var(--border)' }}
              labelFormatter={(label) => formatDay(String(label))}
              contentStyle={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                fontSize: 13,
                color: 'var(--foreground)',
              }}
            />
            <Area
              type="monotone"
              dataKey="views"
              name="Views"
              stroke="var(--primary)"
              strokeWidth={2}
              fill="var(--primary)"
              fillOpacity={0.12}
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="downloads"
              name="Downloads"
              stroke="var(--foreground)"
              strokeWidth={2}
              fill="var(--foreground)"
              fillOpacity={0.06}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}