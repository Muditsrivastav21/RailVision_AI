'use client'

import { usePathname } from 'next/navigation'
import { CameraSelectorCompact } from './CameraSelector'
import { Bell } from 'lucide-react'

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/': {
    title: 'Command Center',
    subtitle: 'System Overview',
  },
  '/dashboard': {
    title: 'Command Center',
    subtitle: 'System Overview',
  },
  '/video-intelligence': {
    title: 'Blur Mitigation',
    subtitle: 'Image Enhancement Pipeline',
  },
  '/damage-analytics': {
    title: 'Damage Control',
    subtitle: 'Automated Defect Detection',
  },
  '/wagon-ocr': {
    title: 'Wagon Identification',
    subtitle: 'OCR & Tracking Log',
  },
}

export function Header() {
  const pathname = usePathname()
  const current = pageTitles[pathname] || {
    title: 'RailVision',
    subtitle: 'AI Platform',
  }

  return (
    <header className="glass-panel w-full h-20 rounded-[28px] flex items-center justify-between px-8 shadow-sm">
      {/* Left: Branding / Breadcrumbs */}
      <div className="flex flex-col justify-center">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">
          {current.title}
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-1 tracking-wide">
          {current.subtitle}
        </p>
      </div>

      {/* Center: Camera Selector Float */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <CameraSelectorCompact />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        <button className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:shadow-md transition-all">
          <Bell size={18} />
        </button>

        <div className="flex items-center gap-3 px-4 py-2 bg-slate-900 text-white rounded-full shadow-lg shadow-slate-900/10">
          <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
          <span className="text-xs font-bold tracking-wide">LIVE FEED</span>
        </div>
      </div>
    </header>
  )
}
