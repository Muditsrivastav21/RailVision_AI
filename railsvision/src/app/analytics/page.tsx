'use client'

import { useEffect, useState } from 'react'
import {
    BarChart3,
    TrendingUp,
    AlertTriangle,
    Train,
    Camera,
    Activity,
    Eye,
    Zap
} from 'lucide-react'

interface AnalyticsData {
    frames_processed: number
    total_detections: number
    damage_events: number
    wagons_detected: number
    ocr_success_rate: number
    avg_blur_improvement: number
    detections_by_type: Record<string, number>
    recent_damages: Array<{
        class: string
        confidence: number
        frame_id: number
        timestamp: number
    }>
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData>({
        frames_processed: 0,
        total_detections: 0,
        damage_events: 0,
        wagons_detected: 0,
        ocr_success_rate: 0,
        avg_blur_improvement: 0,
        detections_by_type: {},
        recent_damages: [],
    })
    const [connected, setConnected] = useState(false)

    useEffect(() => {
        // Connect to WebSocket to accumulate analytics
        const ws = new WebSocket('ws://localhost:8000/ws/feed')

        ws.onopen = () => setConnected(true)
        ws.onclose = () => setConnected(false)

        ws.onmessage = (event) => {
            try {
                const frame = JSON.parse(event.data)
                const detections = frame.metadata?.detections || []
                const quality = frame.metadata?.quality || {}

                setData(prev => {
                    // Update detection counts by type
                    const byType = { ...prev.detections_by_type }
                    detections.forEach((d: any) => {
                        byType[d.type] = (byType[d.type] || 0) + 1
                    })

                    // Track damage events
                    const newDamages = detections.filter((d: any) => d.type === 'damage')
                    const recentDamages = [
                        ...newDamages.map((d: any) => ({
                            class: d.class,
                            confidence: d.confidence,
                            frame_id: frame.metadata.frame_id,
                            timestamp: frame.metadata.timestamp,
                        })),
                        ...prev.recent_damages,
                    ].slice(0, 20)

                    // Count OCR successes
                    const ocrWithText = detections.filter((d: any) =>
                        d.type === 'ocr' && d.text && d.text !== 'Unable to read'
                    )

                    return {
                        frames_processed: prev.frames_processed + 1,
                        total_detections: prev.total_detections + detections.length,
                        damage_events: prev.damage_events + newDamages.length,
                        wagons_detected: prev.wagons_detected + ocrWithText.length,
                        ocr_success_rate: ocrWithText.length > 0 ?
                            ((prev.wagons_detected + ocrWithText.length) /
                                Math.max(1, prev.frames_processed + 1)) * 100 : prev.ocr_success_rate,
                        avg_blur_improvement: ((prev.avg_blur_improvement * prev.frames_processed) +
                            (quality.blur_improvement || 0)) / (prev.frames_processed + 1),
                        detections_by_type: byType,
                        recent_damages: recentDamages,
                    }
                })
            } catch (e) {
                // ignore
            }
        }

        return () => ws.close()
    }, [])

    const detectionTypes = [
        { key: 'damage', label: 'Damage', color: 'red' },
        { key: 'ocr', label: 'OCR', color: 'emerald' },
        { key: 'bogie', label: 'Bogie', color: 'violet' },
        { key: 'cargo', label: 'Cargo', color: 'blue' },
        { key: 'door_full', label: 'Door Full', color: 'amber' },
        { key: 'door_simple', label: 'Door Simple', color: 'orange' },
    ]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold text-slate-800">Analytics Dashboard</h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Post-operation analytics and detection statistics.
                    </p>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs ${connected ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                    <Activity size={12} />
                    {connected ? 'Live' : 'Disconnected'}
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-4 gap-4">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center">
                            <Eye size={22} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">Frames Processed</p>
                            <p className="text-2xl font-bold text-slate-800">
                                {data.frames_processed.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-violet-50 flex items-center justify-center">
                            <Zap size={22} className="text-violet-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">Total Detections</p>
                            <p className="text-2xl font-bold text-slate-800">
                                {data.total_detections.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-red-50 flex items-center justify-center">
                            <AlertTriangle size={22} className="text-red-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">Damage Events</p>
                            <p className="text-2xl font-bold text-slate-800">
                                {data.damage_events.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-green-50 flex items-center justify-center">
                            <TrendingUp size={22} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">Avg Blur Improvement</p>
                            <p className="text-2xl font-bold text-slate-800">
                                {data.avg_blur_improvement.toFixed(1)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detection Breakdown */}
            <div className="grid grid-cols-2 gap-6">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="text-sm font-medium text-slate-700 mb-4 flex items-center gap-2">
                        <BarChart3 size={16} />
                        Detections by Type
                    </h3>
                    <div className="space-y-3">
                        {detectionTypes.map(type => {
                            const count = data.detections_by_type[type.key] || 0
                            const maxCount = Math.max(...Object.values(data.detections_by_type), 1)
                            const percentage = (count / maxCount) * 100

                            return (
                                <div key={type.key}>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-600">{type.label}</span>
                                        <span className="font-medium text-slate-800">{count}</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full bg-${type.color}-500 rounded-full transition-all duration-300`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="text-sm font-medium text-slate-700 mb-4 flex items-center gap-2">
                        <AlertTriangle size={16} />
                        Recent Damage Detections
                    </h3>
                    <div className="max-h-[250px] overflow-auto space-y-2">
                        {data.recent_damages.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-4">
                                No damage detected yet
                            </p>
                        ) : (
                            data.recent_damages.map((damage, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between p-2 bg-red-50 rounded-lg"
                                >
                                    <div>
                                        <p className="text-xs font-medium text-red-700">{damage.class}</p>
                                        <p className="text-[10px] text-red-500">
                                            Frame #{damage.frame_id}
                                        </p>
                                    </div>
                                    <span className="text-xs text-red-600 font-medium">
                                        {(damage.confidence * 100).toFixed(0)}%
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-medium text-slate-700 mb-4">Session Summary</h3>
                <div className="grid grid-cols-4 gap-4 text-center">
                    <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500">Detection Rate</p>
                        <p className="text-lg font-semibold text-slate-800">
                            {data.frames_processed > 0
                                ? (data.total_detections / data.frames_processed).toFixed(1)
                                : '0'} /frame
                        </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500">Damage Rate</p>
                        <p className="text-lg font-semibold text-slate-800">
                            {data.frames_processed > 0
                                ? ((data.damage_events / data.frames_processed) * 100).toFixed(1)
                                : '0'}%
                        </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500">Wagons Identified</p>
                        <p className="text-lg font-semibold text-slate-800">
                            {data.wagons_detected}
                        </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500">Avg Sharpness Gain</p>
                        <p className="text-lg font-semibold text-green-600">
                            +{data.avg_blur_improvement.toFixed(1)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
