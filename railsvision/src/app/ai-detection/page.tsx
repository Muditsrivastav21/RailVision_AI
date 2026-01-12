'use client'

import { useEffect, useState } from 'react'
import { DetectionFeed } from '@/components/DetectionFeed'
import { CameraSelector } from '@/components/CameraSelector'
import { WagonCounter } from '@/components/WagonCounter'
import { Cpu, Zap, Activity, Shield, Sparkles } from 'lucide-react'

interface Detection {
  class: string
  type: string
  confidence: number
  text?: string
}

export default function AIDetectionPage() {
  const [currentDetections, setCurrentDetections] = useState<Detection[]>([])
  const [activeCamera, setActiveCamera] = useState('cam_1')

  // We'll listen to detections from the WebSocket in the DetectionFeed
  // For now, we'll pass detections up when possible

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-800">AI Detection Engine</h2>
        <p className="mt-1 text-sm text-slate-500">
          Real-time multi-model inference: damage, OCR, bogie, cargo, and door detection.
        </p>
      </div>

      {/* Camera Selector */}
      <CameraSelector />

      {/* Model Status Cards */}
      <div className="grid grid-cols-5 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
              <Zap size={18} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Damage Model</p>
              <p className="text-xs text-green-600">Active · v13</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Activity size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">OCR Model</p>
              <p className="text-xs text-blue-600">Active · PaddleOCR</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-violet-50 flex items-center justify-center">
              <Cpu size={18} className="text-violet-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Bogie Model</p>
              <p className="text-xs text-violet-600">Active · v1</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Shield size={18} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Door Model</p>
              <p className="text-xs text-amber-600">Active · v12</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <Sparkles size={18} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Deblur</p>
              <p className="text-xs text-purple-600">Enhanced</p>
            </div>
          </div>
        </div>
      </div>

      {/* Wagon Counter */}
      <WagonCounter detections={currentDetections} />

      {/* Combined Detection Feed */}
      <DetectionFeed mode="combined" />
    </div>
  )
}
