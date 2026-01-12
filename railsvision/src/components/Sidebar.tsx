'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Train,
  Sparkles,
  AlertTriangle,
  Hash,
  LayoutGrid,
  Search,
} from 'lucide-react'

// Simplified navigation - 4 core features only
const navItems = [
  { href: '/dashboard', icon: LayoutGrid, label: 'Dashboard' },
  { href: '/ai-detection', icon: Search, label: 'AI Detection' },
  { href: '/video-intelligence', icon: Sparkles, label: 'Blur Mitigation' },
  { href: '/damage-analytics', icon: AlertTriangle, label: 'Damage Detection' },
  { href: '/wagon-ocr', icon: Hash, label: 'Wagon OCR' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="glass-panel h-full rounded-[32px] flex flex-col p-6 shadow-xl shadow-slate-200/50">
      {/* Brand */}
      <div className="flex items-center gap-3 px-2 pb-8 pt-2">
        <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-slate-950 rounded-xl flex items-center justify-center shadow-lg shadow-slate-900/20">
          <Train size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900 leading-tight">
            RailVision
          </h1>
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
            GovTech AI
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 ease-out border
                ${isActive
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 border-slate-900 scale-[1.02]'
                  : 'bg-transparent text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-md hover:border-white/50 border-transparent'
                }`}
            >
              <item.icon
                size={20}
                className={`transition-colors duration-300 ${isActive ? 'text-blue-200' : 'text-slate-400 group-hover:text-blue-500'}`}
              />
              <span className="tracking-tight">{item.label}</span>

              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* System Status / Footer */}
      <div className="mt-auto pt-6 border-t border-slate-200/60">
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100/80">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-700">System Online</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed text-balance">
            Connected to secure gov network. v2.4.0
          </p>
        </div>
      </div>
    </aside>
  )
}
