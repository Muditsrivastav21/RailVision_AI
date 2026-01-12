'use client'

import { useEffect, useState } from 'react'
import {
  Activity,
  Server,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Hash,
  Sparkles,
  Eye,
  Cpu,
  ArrowUpRight
} from 'lucide-react'
import { CameraSelector } from '@/components/CameraSelector'
import Link from 'next/link'

interface HealthStatus {
  status: string
  multi_camera?: boolean
  cameras_available?: number
}

interface Stats {
  frames: number
  detections: number
  damages: number
  ocr_reads: number
}

function StatCard({ icon: Icon, label, value, subtext, color }: any) {
  const colorStyles = {
    blue: 'text-blue-600 bg-blue-50',
    red: 'text-red-600 bg-red-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    violet: 'text-violet-600 bg-violet-50'
  }[color as string] || 'text-slate-600 bg-slate-50'

  return (
    <div className="card-fluid p-6 flex flex-col justify-between h-full min-h-[160px] relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/0 to-white/40 rounded-full translate-x-10 translate-y-[-10px] group-hover:scale-110 transition-transform duration-500 ease-in-out" />

      <div className="flex justify-between items-start z-10">
        <div className={`p-3 rounded-2xl ${colorStyles}`}>
          <Icon size={24} />
        </div>
        {subtext && (
          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-white/60 text-slate-500 border border-slate-100/50">
            {subtext}
          </span>
        )}
      </div>

      <div className="mt-4 z-10">
        <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{value}</h3>
        <p className="text-sm font-medium text-slate-500 mt-1">{label}</p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [stats, setStats] = useState<Stats>({ frames: 0, detections: 0, damages: 0, ocr_reads: 0 })

  useEffect(() => {
    // Check backend health
    fetch('http://localhost:8000/health')
      .then((res) => res.json())
      .then((data: HealthStatus) => {
        setBackendStatus(data.status === 'healthy' ? 'online' : 'offline')
      })
      .catch(() => setBackendStatus('offline'))

    // Connect to WebSocket for live stats
    const ws = new WebSocket('ws://localhost:8000/ws/feed')

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        const dets = data.metadata?.detections ?? []
        const damages = dets.filter((d: any) => d.type === 'damage').length
        const ocr = dets.filter((d: any) => d.type === 'ocr' && d.text).length

        setStats((prev) => ({
          frames: prev.frames + 1,
          detections: prev.detections + dets.length,
          damages: prev.damages + damages,
          ocr_reads: prev.ocr_reads + ocr,
        }))
      } catch { /* ignore */ }
    }

    return () => ws.close()
  }, [])

  return (
    <div className="space-y-8">
      {/* Top Section: Camera & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera Selector takes 2 columns */}
        <div className="lg:col-span-2">
          <CameraSelector />
        </div>

        {/* System Health Card */}
        <div className="card-fluid p-6 flex flex-col justify-center gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">System Status</h3>
            <div className={`px-3 py-1 rounded-full flex items-center gap-2 text-xs font-bold ${backendStatus === 'online' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
              <div className={`w-2 h-2 rounded-full ${backendStatus === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
              {backendStatus.toUpperCase()}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-100">
              <span className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Server size={14} /> Backend API
              </span>
              <CheckCircle2 size={16} className="text-emerald-500" />
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-100">
              <span className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Cpu size={14} /> AI Processing
              </span>
              <span className="text-xs font-bold text-blue-600">ACTIVE</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-100">
              <span className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Activity size={14} /> Latency
              </span>
              <span className="text-xs font-bold text-slate-600">~24ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Eye}
          label="Frames Analyzed"
          value={stats.frames.toLocaleString()}
          color="blue"
          subtext="SESSION TOTAL"
        />
        <StatCard
          icon={AlertTriangle}
          label="Damages Detected"
          value={stats.damages.toLocaleString()}
          color="red"
          subtext="CRITICAL"
        />
        <StatCard
          icon={Hash}
          label="Wagons Identified"
          value={stats.ocr_reads.toLocaleString()}
          color="emerald"
          subtext="OCR SUCCESS"
        />
        <StatCard
          icon={Sparkles}
          label="Total Detections"
          value={stats.detections.toLocaleString()}
          color="violet"
          subtext="ALL EVENTS"
        />
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { href: '/video-intelligence', title: 'Blur Mitigation', desc: 'Enhanced view', color: 'bg-violet-500' },
          { href: '/damage-analytics', title: 'Damage Control', desc: 'Defect Analysis', color: 'bg-red-500' },
          { href: '/wagon-ocr', title: 'Wagon Log', desc: 'OCR History', color: 'bg-emerald-500' }
        ].map(item => (
          <Link key={item.href} href={item.href} className="group card-fluid p-6 flex items-center justify-between hover:scale-[1.02] transition-transform">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl ${item.color} shadow-lg shadow-${item.color}/30 flex items-center justify-center text-white`}>
                <ArrowUpRight size={24} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900">{item.title}</h4>
                <p className="text-sm text-slate-500">{item.desc}</p>
              </div>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400">
              <ArrowUpRight size={20} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
