'use client'

import { useEffect, useState } from 'react'

type DetectionType = 'damage' | 'ocr' | 'bogie' | 'cargo' | 'door_full' | 'door_simple'

interface Detection {
  class: string
  confidence: number
  bbox: number[]
  type: DetectionType
  text?: string  // OCR extracted text for wagon numbers
}

interface FramePayload {
  image: string
  original_image?: string
  enhanced_image?: string
  metadata: {
    frame_id: number
    filename: string
    timestamp: number
    detections?: Detection[]
    lighting_condition?: string
    quality?: {
      blur_before: number
      blur_after: number
      brightness_before: number
      brightness_after: number
      blur_improvement: number
    }
  }
}

interface DetectionFeedProps {
  mode: DetectionType | 'combined'
}

const typeLabels: Record<DetectionType, string> = {
  damage: 'Damage',
  ocr: 'OCR',
  bogie: 'Bogie',
  cargo: 'Cargo',
  door_full: 'Door (Full)',
  door_simple: 'Door',
}

const typeColors: Record<DetectionType, string> = {
  damage: 'bg-red-100 text-red-700',
  ocr: 'bg-emerald-100 text-emerald-700',
  bogie: 'bg-violet-100 text-violet-700',
  cargo: 'bg-blue-100 text-blue-700',
  door_full: 'bg-amber-100 text-amber-700',
  door_simple: 'bg-orange-100 text-orange-700',
}

export function DetectionFeed({ mode }: DetectionFeedProps) {
  const [frame, setFrame] = useState<FramePayload | null>(null)
  const [status, setStatus] = useState<'connecting' | 'open' | 'closed'>('connecting')
  const [lastError, setLastError] = useState<string | null>(null)

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/feed')

    ws.onopen = () => {
      setStatus('open')
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as FramePayload
        setFrame(data)
        setLastError(null)
      } catch {
        setLastError('Received malformed frame payload from backend')
      }
    }

    ws.onerror = () => {
      setLastError('WebSocket error while reading live feed')
    }

    ws.onclose = () => {
      setStatus('closed')
    }

    return () => {
      ws.close()
    }
  }, [])

  const detections = frame?.metadata.detections ?? []

  const filtered =
    mode === 'combined' ? detections : detections.filter((d) => d.type === mode)

  const getModeLabel = () => {
    if (mode === 'combined') return 'All detections'
    return `${typeLabels[mode]} detections`
  }

  return (
    <div className="space-y-4">
      {/* Top: original feed and detection feed with markings */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col">
          <p className="mb-2 text-xs font-medium text-slate-600">Original feed</p>
          <div className="flex-1 flex items-center justify-center min-h-[220px]">
            {frame && frame.original_image ? (
              <img
                src={frame.original_image}
                alt="Original wagon frame"
                className="max-h-[320px] w-auto rounded-lg border border-slate-200"
              />
            ) : frame ? (
              <img
                src={frame.image}
                alt="Original wagon frame"
                className="max-h-[320px] w-auto rounded-lg border border-slate-200"
              />
            ) : (
              <p className="text-sm text-slate-500">Waiting for live frames from backend…</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col">
          <p className="mb-2 text-xs font-medium text-slate-600">Detection feed (with markings)</p>
          <div className="flex-1 flex items-center justify-center min-h-[220px]">
            {frame ? (
              <img
                src={frame.image}
                alt="Detection feed frame"
                className="max-h-[320px] w-auto rounded-lg border border-slate-200"
              />
            ) : (
              <p className="text-sm text-slate-500">Waiting for live frames from backend…</p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom: all detections list */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-slate-700">{getModeLabel()}</p>
            {frame && (
              <div className="flex flex-col gap-1 mt-1">
                <p className="text-xs text-slate-500">
                  Frame #{frame.metadata.frame_id} · {frame.metadata.filename}
                </p>
                {frame.metadata.lighting_condition && (
                  <span
                    className={`inline-flex items-center w-fit px-2 py-0.5 rounded text-[10px] font-medium border ${
                      frame.metadata.lighting_condition === 'Daylight'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    }`}
                  >
                    {frame.metadata.lighting_condition === 'Daylight' ? '☀️' : '🌙'}{' '}
                    {frame.metadata.lighting_condition}
                  </span>
                )}
              </div>
            )}
          </div>
          <span className="text-xs text-slate-500">{filtered.length} active</span>
        </div>

        <div className="flex-1 overflow-auto border-t border-slate-100 pt-3 space-y-2 max-h-[280px]">
          {filtered.length === 0 && (
            <p className="text-xs text-slate-500">No detections on this frame.</p>
          )}

          {filtered.map((det, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2"
            >
              <div className="space-y-0.5 flex-1">
                <p className="text-xs font-medium text-slate-700">
                  {det.class}
                  {det.text && det.type === 'ocr' && (
                    <span className="ml-2 text-emerald-600 font-semibold">
                      → {det.text}
                    </span>
                  )}
                </p>
                <span
                  className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${typeColors[det.type] || 'bg-slate-100 text-slate-600'
                    }`}
                >
                  {typeLabels[det.type] || det.type}
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                {(det.confidence * 100).toFixed(1)}%
              </p>
            </div>
          ))}
        </div>

        <div className="mt-3 border-t border-slate-100 pt-2 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">
            {status === 'connecting' && 'Connecting to backend feed…'}
            {status === 'open' && 'Live feed connected.'}
            {status === 'closed' && 'Feed connection closed.'}
          </p>
          {lastError && <p className="text-[11px] text-red-400">{lastError}</p>}
        </div>
      </div>
    </div>
  )
}
