'use client'

import { useState, useEffect } from 'react'
import { Hash, Train, Eye, CheckCircle, XCircle, Search } from 'lucide-react'
import { useCameraWebSocket } from '@/components/useCameraWebSocket'
import { useCameras } from '@/components/CameraSelector'

export default function WagonOcrPage() {
  const { frame, status } = useCameraWebSocket()
  const { activeCamera } = useCameras()
  const [wagonIds, setWagonIds] = useState<Set<string>>(new Set())
  const [ocrHistory, setOcrHistory] = useState<Array<{ text: string, confidence: number, frame_id: number }>>([])

  // Track OCR detections
  useEffect(() => {
    if (!frame) return

    const ocrDets = frame.metadata.detections?.filter(
      d => d.type === 'ocr' && d.text && d.text.trim().length > 0
    ) || []

    if (ocrDets.length > 0) {
      setWagonIds(prev => {
        const updated = new Set(prev)
        ocrDets.forEach(d => {
          if (d.text) updated.add(d.text.trim())
        })
        return updated
      })

      setOcrHistory(prev => [
        ...ocrDets.map(d => ({
          text: d.text || '',
          confidence: d.confidence,
          frame_id: frame.metadata.frame_id
        })),
        ...prev
      ].slice(0, 100))
    }
  }, [frame])

  const ocrDetections = frame?.metadata.detections?.filter(d => d.type === 'ocr') || []
  const successfulReads = ocrDetections.filter(d => d.text && d.text.trim().length > 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
          Real-Time Identification
        </h2>
        <div className={`px-4 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold border ${stateColor(status)}`}>
          <div className={`w-2 h-2 rounded-full animate-pulse ${status === 'open' ? 'bg-green-500' : 'bg-red-500'}`} />
          {status === 'open' ? 'OCV ENGINE ONLINE' : 'DISCONNECTED'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Left Column: Feed & Live Results */}
        <div className="lg:col-span-2 flex flex-col gap-6 h-full">
          {/* Live Feed Player */}
          <div className="glass-panel flex-1 rounded-[32px] overflow-hidden relative group">
            {frame?.enhanced_image ? (
              <img
                src={frame.enhanced_image}
                alt="OCR Feed"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-slate-100/50">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-slate-800 animate-spin" />
                  <span className="text-xs font-bold text-slate-400 tracking-widest">AWAITING SIGNAL...</span>
                </div>
              </div>
            )}

            {/* Overlay Info */}
            <div className="absolute top-4 left-4 flex gap-2">
              <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-mono text-white/90">
                CAM: {activeCamera}
              </div>
              <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-mono text-white/90">
                FPS: 24.0
              </div>
            </div>
          </div>

          {/* Current Frame Results */}
          <div className="h-48 glass-panel rounded-[24px] p-4 flex flex-col">
            <h3 className="text-sm font-bold text-slate-500 mb-3 flex items-center gap-2">
              <Search size={14} /> CURRENT FRAME READS
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {successfulReads.length > 0 ? (
                successfulReads.map((det, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 hover:bg-emerald-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                        <CheckCircle size={16} />
                      </div>
                      <div>
                        <div className="font-mono text-lg font-bold text-slate-800 tracking-wider">
                          {det.text}
                        </div>
                        <div className="text-[10px] text-emerald-600 font-bold">CONFIRMED READ</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-emerald-600">
                        {(det.confidence * 100).toFixed(0)}<span className="text-xs">%</span>
                      </div>
                      <div className="text-[10px] text-slate-400">CONFIDENCE</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-2 border-2 border-dashed border-slate-100 rounded-xl">
                  <Search size={24} />
                  <span className="text-xs font-medium">Scanning Frame...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: History Log */}
        <div className="glass-panel rounded-[32px] p-0 flex flex-col overflow-hidden h-full">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900">Scan Log</h3>
            <p className="text-xs text-slate-500">Recent identifications</p>

            <div className="mt-6 flex gap-4">
              <div className="flex-1 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-2xl font-bold text-slate-900">{ocrHistory.length}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Scans</div>
              </div>
              <div className="flex-1 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-2xl font-bold text-emerald-600">{wagonIds.size}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unique Wagons</div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white z-10 text-[10px] uppercase text-slate-400 font-bold">
                <tr>
                  <th className="p-3 pl-4">Wagon ID</th>
                  <th className="p-3">Conf</th>
                  <th className="p-3 pr-4 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {ocrHistory.slice(0, 50).map((log, i) => (
                  <tr key={i} className="group hover:bg-slate-50/80 transition-colors border-b border-slate-50 last:border-0 rounded-lg">
                    <td className="p-3 pl-4 font-mono font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                      {log.text}
                    </td>
                    <td className="p-3">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${log.confidence * 100}%` }}
                        />
                      </div>
                    </td>
                    <td className="p-3 pr-4 text-right text-xs text-slate-400 font-mono">
                      {new Date().toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function stateColor(status: string) {
  return status === 'open'
    ? 'bg-green-50 border-green-200 text-green-700'
    : 'bg-red-50 border-red-200 text-red-700'
}
