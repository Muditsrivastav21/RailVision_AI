'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, ShieldAlert, Activity, CheckCircle, FileWarning } from 'lucide-react'
import { useCameraWebSocket } from '@/components/useCameraWebSocket'
import { useCameras } from '@/components/CameraSelector'

export default function DamageAnalyticsPage() {
  const { frame, status } = useCameraWebSocket()
  const { activeCamera } = useCameras()
  const [damageCount, setDamageCount] = useState(0)
  const [recentDamages, setRecentDamages] = useState<Array<{ class: string, confidence: number, frame_id: number, timestamp: string }>>([])

  // Track damage detections
  useEffect(() => {
    if (!frame) return
    const damages = frame.metadata.detections?.filter(d => d.type === 'damage') || []
    if (damages.length > 0) {
      setDamageCount(prev => prev + damages.length)
      setRecentDamages(prev => [
        ...damages.map(d => ({
          class: d.class,
          confidence: d.confidence,
          frame_id: frame.metadata.frame_id,
          timestamp: new Date().toLocaleTimeString()
        })),
        ...prev
      ].slice(0, 50))
    }
  }, [frame])

  const damageDetections = frame?.metadata.detections?.filter(d => d.type === 'damage') || []

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Defect Detection Feed</h2>
        <div className="flex gap-2">
          <div className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-bold animate-pulse">
            LIVE MONITORING
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-[600px]">
        {/* Center Feed */}
        <div className="xl:col-span-2 flex flex-col gap-6 h-full">
          <div className="glass-panel rounded-[32px] flex-1 overflow-hidden relative border-2 border-red-500/10 shadow-2xl shadow-red-500/5">
            {frame?.image ? (
              <img src={frame.image} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-400">
                System Offline
              </div>
            )}

            {/* Live Overlay */}
            <div className="absolute top-4 left-4">
              <div className="bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-lg flex items-center gap-2">
                <Activity size={12} className="animate-pulse" />
                AI MODEL ACTIVE
              </div>
            </div>

            {/* Detection Bounding Box Overlay (Simulated via SVG if needed, but YOLO draws it on frame) */}
          </div>

          {/* Live Indicators */}
          <div className="h-32 grid grid-cols-2 gap-4">
            <div className="glass-panel p-4 rounded-2xl flex items-center gap-4 border-l-4 border-red-500">
              <div className="p-3 bg-red-50 rounded-xl text-red-600">
                <AlertTriangle size={24} />
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900">{damageCount}</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Defects</div>
              </div>
            </div>
            <div className="glass-panel p-4 rounded-2xl flex items-center gap-4 border-l-4 border-amber-500">
              <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                <Activity size={24} />
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900">{damageDetections.length}</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Current Frame</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Incident Log */}
        <div className="glass-panel rounded-[32px] flex flex-col overflow-hidden h-full">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileWarning size={20} className="text-slate-400" />
              Incident Log
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {recentDamages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-sm gap-2">
                <CheckCircle size={32} className="text-emerald-200" />
                <span>No defects recently detected</span>
              </div>
            ) : (
              recentDamages.map((d, i) => (
                <div key={i} className="p-4 rounded-xl bg-white border border-red-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-slate-800 text-sm">{d.class}</span>
                    <span className="text-[10px] font-mono text-slate-400">{d.timestamp}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Frame #{d.frame_id}</span>
                    <span className="px-2 py-0.5 bg-red-50 text-red-700 text-[10px] font-bold rounded-full">
                      {(d.confidence * 100).toFixed(0)}% CONFIDENCE
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
