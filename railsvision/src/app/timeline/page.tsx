'use client'

import { useEffect, useState } from 'react'
import { Clock, AlertTriangle, Hash, CircleDot, Container, DoorOpen } from 'lucide-react'

interface Detection {
  class: string
  confidence: number
  type: string
}

interface TimelineEvent {
  frame_id: number
  timestamp: number
  detections: Detection[]
}

const typeIcons: Record<string, typeof AlertTriangle> = {
  damage: AlertTriangle,
  ocr: Hash,
  bogie: CircleDot,
  cargo: Container,
  door_full: DoorOpen,
  door_simple: DoorOpen,
}

const typeColors: Record<string, string> = {
  damage: 'text-red-600 bg-red-50',
  ocr: 'text-emerald-600 bg-emerald-50',
  bogie: 'text-violet-600 bg-violet-50',
  cargo: 'text-blue-600 bg-blue-50',
  door_full: 'text-amber-600 bg-amber-50',
  door_simple: 'text-amber-600 bg-amber-50',
}

export default function TimelinePage() {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [status, setStatus] = useState<'connecting' | 'open' | 'closed'>('connecting')

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/feed')

    ws.onopen = () => setStatus('open')
    ws.onclose = () => setStatus('closed')

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        const detections = data.metadata?.detections ?? []
        if (detections.length > 0) {
          setEvents((prev) => [
            {
              frame_id: data.metadata.frame_id,
              timestamp: data.metadata.timestamp,
              detections,
            },
            ...prev.slice(0, 49), // Keep last 50 events
          ])
        }
      } catch {
        // ignore
      }
    }

    return () => ws.close()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">Timeline View</h2>
          <p className="mt-1 text-sm text-slate-500">
            Chronological log of all detection events.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock size={14} />
          <span>
            {status === 'connecting' && 'Connecting...'}
            {status === 'open' && 'Live'}
            {status === 'closed' && 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="max-h-[600px] overflow-auto">
          {events.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              Waiting for detection events...
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Frame</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Time</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Detections</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.map((ev, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-700 font-medium">#{ev.frame_id}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(ev.timestamp * 1000).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {ev.detections.slice(0, 5).map((det, i) => {
                          const Icon = typeIcons[det.type] ?? AlertTriangle
                          const color = typeColors[det.type] ?? 'text-slate-600 bg-slate-50'
                          return (
                            <span
                              key={i}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${color}`}
                            >
                              <Icon size={12} />
                              {det.class} ({(det.confidence * 100).toFixed(0)}%)
                            </span>
                          )
                        })}
                        {ev.detections.length > 5 && (
                          <span className="text-xs text-slate-400">
                            +{ev.detections.length - 5} more
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
