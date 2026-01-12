'use client'

import { useEffect, useState } from 'react'
import { Sparkles, Eye, Sun, TrendingUp, RefreshCw, X, ArrowRight } from 'lucide-react'
import { useCameraWebSocket } from '@/components/useCameraWebSocket'
import { useCameras } from '@/components/CameraSelector'

interface TopFrame {
  score: number
  frame_id: number
  quality: {
    blur_before: number
    blur_after: number
    brightness_before: number
    brightness_after: number
    blur_improvement: number
  }
  original_image: string
  enhanced_image: string
}

export default function VideoIntelligencePage() {
  const { frame, status } = useCameraWebSocket()
  const { activeCamera } = useCameras()
  const [topFrames, setTopFrames] = useState<TopFrame[]>([])
  const [selectedComparison, setSelectedComparison] = useState<TopFrame | null>(null)

  const fetchTopFrames = async () => {
    try {
      const res = await fetch('http://localhost:8000/top-frames?limit=10')
      const data = await res.json()
      setTopFrames(data)
    } catch (e) {
      console.error('Failed to fetch top frames')
    }
  }

  useEffect(() => {
    fetchTopFrames()
    const interval = setInterval(fetchTopFrames, 5000)
    return () => clearInterval(interval)
  }, [])

  const quality = frame?.metadata.quality

  // Render metric card
  const Metric = ({ icon: Icon, label, value, subValue, color }: any) => (
    <div className="card-fluid-sm p-4 flex flex-col items-center justify-center text-center gap-2">
      <div className={`p-2 rounded-lg ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
        <Icon size={18} />
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <div className="text-[10px] uppercase font-bold text-slate-400">{label}</div>
      </div>
      {subValue && <div className="text-xs font-semibold text-emerald-600">{subValue}</div>}
    </div>
  )

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Image Enhancement Pipeline</h2>
        <div className="flex gap-2">
          <div className="px-3 py-1 bg-white rounded-full text-xs font-bold text-slate-500 border border-slate-200">
            Model: Real-ESRGAN x2
          </div>
          <div className="px-3 py-1 bg-white rounded-full text-xs font-bold text-slate-500 border border-slate-200">
            Latency: ~120ms
          </div>
        </div>
      </div>

      {/* Main Studio View */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

        {/* Left Panel: Metrics & Controls */}
        <div className="xl:col-span-1 space-y-4">
          <div className="glass-panel rounded-3xl p-6 flex flex-col gap-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Live Metrics</h3>

            <Metric
              icon={Eye}
              label="Blur Score"
              value={quality ? quality.blur_before.toFixed(0) : '-'}
              color="bg-red-500"
            />

            <div className="flex items-center justify-center text-slate-300">
              <ArrowRight size={20} className="transform rotate-90 xl:rotate-0" />
            </div>

            <Metric
              icon={Sparkles}
              label="Enhanced Score"
              value={quality ? quality.blur_after.toFixed(0) : '-'}
              subValue={quality ? `+${quality.blur_improvement.toFixed(0)} Improvement` : ''}
              color="bg-violet-500"
            />
          </div>
        </div>

        {/* Center: Live Comparison */}
        <div className="xl:col-span-3 grid grid-cols-2 gap-4 h-[500px]">
          <div className="relative glass-panel rounded-3xl overflow-hidden group">
            <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase border border-white/20">
              Original Feed
            </div>
            {frame?.original_image ? (
              <img src={frame.original_image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-100/50 text-slate-400 font-medium">No Signal</div>
            )}
          </div>

          <div className="relative glass-panel rounded-3xl overflow-hidden group border-2 border-violet-500/20 shadow-2xl shadow-violet-500/10">
            <div className="absolute top-4 left-4 z-10 bg-violet-600/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase shadow-lg">
              Enhanced Output
            </div>
            {frame?.enhanced_image ? (
              <img src={frame.enhanced_image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-100/50 text-slate-400 font-medium">Processing...</div>
            )}
          </div>
        </div>
      </div>

      {/* Filmstrip: Top Corrections */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="text-lg font-bold text-slate-800">Top Correction Events</h3>
          <button onClick={fetchTopFrames} className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
            Refresh List
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-6 scroll-smooth snap-x">
          {topFrames.length === 0 ? (
            [1, 2, 3, 4].map(i => (
              <div key={i} className="min-w-[200px] h-[140px] rounded-2xl bg-slate-100/50 animate-pulse border border-slate-200" />
            ))
          ) : (
            topFrames.map((f, i) => (
              <div
                key={i}
                onClick={() => setSelectedComparison(f)}
                className="min-w-[240px] glass-panel p-3 rounded-2xl cursor-pointer hover:scale-[1.02] transition-transform snap-start"
              >
                <div className="relative h-32 rounded-xl overflow-hidden mb-3">
                  <img src={f.enhanced_image} className="w-full h-full object-cover" />
                  <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold text-white">
                    Frame {f.frame_id}
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Improvement</div>
                    <div className="text-lg font-bold text-emerald-600">+{f.score.toFixed(0)}</div>
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded-lg">
                    Click to Compare
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Comparison Modal */}
      {selectedComparison && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setSelectedComparison(null)}>
          <div className="bg-white rounded-[32px] overflow-hidden max-w-5xl w-full shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Analysis: Frame #{selectedComparison.frame_id}</h3>
                <p className="text-sm text-slate-500">Manual review of enhancement quality</p>
              </div>
              <button onClick={() => setSelectedComparison(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={24} className="text-slate-400" />
              </button>
            </div>

            <div className="p-8 grid grid-cols-2 gap-8 bg-slate-50/50">
              <div className="space-y-3">
                <div className="flex justify-between items-center px-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Original Source</span>
                  <span className="text-xs font-mono bg-red-100 text-red-600 px-2 py-0.5 rounded">Blur: {selectedComparison.quality.blur_before.toFixed(0)}</span>
                </div>
                <img src={selectedComparison.original_image} className="w-full rounded-2xl shadow-lg border border-white/50" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center px-2">
                  <span className="text-xs font-bold text-violet-600 uppercase">Enhanced Result</span>
                  <span className="text-xs font-mono bg-green-100 text-green-600 px-2 py-0.5 rounded">Blur: {selectedComparison.quality.blur_after.toFixed(0)}</span>
                </div>
                <img src={selectedComparison.enhanced_image} className="w-full rounded-2xl shadow-lg border border-violet-200 ring-2 ring-violet-500/10" />
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
