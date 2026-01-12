'use client'

import { DetectionFeed } from '@/components/DetectionFeed'
import { Container, CircleDot, DoorOpen } from 'lucide-react'

export default function WagonIntelligencePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-800">Wagon Intelligence</h2>
        <p className="mt-1 text-sm text-slate-500">
          Monitor bogie conditions, door states, and cargo status in real-time.
        </p>
      </div>

      {/* Detection Type Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-violet-50 flex items-center justify-center">
              <CircleDot size={18} className="text-violet-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Bogie Detection</p>
              <p className="text-xs text-slate-500">Bogie type classification</p>
            </div>
          </div>
          <p className="text-xs text-violet-600">Model: bogie_detect_v1</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <DoorOpen size={18} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Door Detection</p>
              <p className="text-xs text-slate-500">Open/Closed/Damage states</p>
            </div>
          </div>
          <p className="text-xs text-amber-600">Models: door_full + door_simple</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Container size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Cargo Detection</p>
              <p className="text-xs text-slate-500">Container and debris</p>
            </div>
          </div>
          <p className="text-xs text-emerald-600">Model: cargo_container_v12</p>
        </div>
      </div>

      {/* Live Feed with Combined Wagon-related Detections */}
      <DetectionFeed mode="combined" />
    </div>
  )
}
