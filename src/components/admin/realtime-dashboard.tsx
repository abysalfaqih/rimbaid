'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Image from 'next/image'
import { Eye, Download, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { TrafficChart, type TrafficPoint } from './traffic-chart'

type AppRow = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  is_published: boolean
  total_views: number
  total_downloads: number
}

type EventRow = {
  id: string
  event_type: 'view' | 'download'
  created_at: string
  apps: { name: string; slug: string } | null
}

export function RealtimeDashboard({
  initialApps,
  initialEvents,
  initialTraffic,
}: {
  initialApps: AppRow[]
  initialEvents: EventRow[]
  initialTraffic: TrafficPoint[]
}) {
  const [apps, setApps] = useState(initialApps)
  const [events, setEvents] = useState(initialEvents)
  const [traffic, setTraffic] = useState(initialTraffic)
  const [isLive, setIsLive] = useState(false)

  const appsRef = useRef(apps)
  useEffect(() => {
    appsRef.current = apps
  }, [apps])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'apps' }, (payload) => {
        const updated = payload.new as AppRow
        setApps((prev) => prev.map((app) => (app.id === updated.id ? { ...app, ...updated } : app)))
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'app_events' }, (payload) => {
        const row = payload.new as { id: string; app_id: string; event_type: 'view' | 'download'; created_at: string }
        const appMatch = appsRef.current.find((a) => a.id === row.app_id)

        setEvents((prev) =>
          [
            {
              id: row.id,
              event_type: row.event_type,
              created_at: row.created_at,
              apps: appMatch ? { name: appMatch.name, slug: appMatch.slug } : null,
            },
            ...prev,
          ].slice(0, 20)
        )

        // Naikkan titik "hari ini" di grafik (tanggal dihitung dalam WIB,
        // sama dengan cara fungsi SQL get_daily_traffic mengelompokkan hari)
        const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date())
        setTraffic((prev) =>
          prev.map((point) =>
            point.day === today
              ? {
                  ...point,
                  views: point.views + (row.event_type === 'view' ? 1 : 0),
                  downloads: point.downloads + (row.event_type === 'download' ? 1 : 0),
                }
              : point
          )
        )
      })
      .subscribe((status) => setIsLive(status === 'SUBSCRIBED'))

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const totalViews = apps.reduce((sum, a) => sum + a.total_views, 0)
  const totalDownloads = apps.reduce((sum, a) => sum + a.total_downloads, 0)
  const conversionRate = totalViews > 0 ? ((totalDownloads / totalViews) * 100).toFixed(1) : '0'
  const sortedApps = [...apps].sort((a, b) => b.total_views - a.total_views)

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Dashboard</h1>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className={`size-2 rounded-full ${isLive ? 'bg-green-500' : 'bg-muted-foreground/40'}`} />
          {isLive ? 'Live' : 'Menghubungkan...'}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<Eye className="size-5" />} label="Total Views" value={totalViews} />
        <StatCard icon={<Download className="size-5" />} label="Total Downloads" value={totalDownloads} />
        <StatCard icon={<TrendingUp className="size-5" />} label="Conversion Rate" value={`${conversionRate}%`} />
      </div>

      <TrafficChart data={traffic} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="overflow-hidden rounded-xl border border-border lg:col-span-2">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3">Aplikasi</th>
                <th className="p-3 text-right">Views</th>
                <th className="p-3 text-right">Downloads</th>
              </tr>
            </thead>
            <tbody>
              {sortedApps.map((app) => (
                <tr key={app.id} className="border-t border-border">
                  <td className="flex items-center gap-3 p-3">
                    <div className="relative size-8 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                      {app.logo_url && <Image src={app.logo_url} alt={app.name} fill className="object-cover" sizes="32px" />}
                    </div>
                    <span className="font-medium">{app.name}</span>
                    {!app.is_published && <span className="text-xs text-muted-foreground">(draft)</span>}
                  </td>
                  <td className="p-3 text-right tabular-nums">{app.total_views}</td>
                  <td className="p-3 text-right tabular-nums">{app.total_downloads}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-border p-4">
          <h2 className="mb-3 text-sm font-semibold">Aktivitas Terbaru</h2>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada aktivitas.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {events.map((event) => (
                <li key={event.id} className="flex items-center gap-2 text-muted-foreground">
                  {event.event_type === 'view' ? (
                    <Eye className="size-3.5 shrink-0" />
                  ) : (
                    <Download className="size-3.5 shrink-0 text-primary" />
                  )}
                  <span className="truncate">
                    {event.event_type === 'view' ? 'Dilihat' : 'Diunduh'} — {event.apps?.name ?? 'Aplikasi'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="font-display text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  )
}