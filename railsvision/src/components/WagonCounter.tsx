'use client'

import { useEffect, useState } from 'react'
import { Train, TrendingUp, BarChart3 } from 'lucide-react'

interface WagonStats {
    total_wagons: number
    damage_detected: number
    ocr_success: number
}

interface WagonCounterProps {
    detections: Array<{
        class: string
        type: string
        text?: string
    }>
}

export function WagonCounter({ detections }: WagonCounterProps) {
    const [stats, setStats] = useState<WagonStats>({
        total_wagons: 0,
        damage_detected: 0,
        ocr_success: 0,
    })

    // Track unique wagons by OCR text
    const [seenWagons, setSeenWagons] = useState<Set<string>>(new Set())

    useEffect(() => {
        if (!detections || detections.length === 0) return

        // Count damage detections
        const damageCount = detections.filter(d => d.type === 'damage').length

        // Count successful OCR (has text)
        const ocrWithText = detections.filter(d => d.type === 'ocr' && d.text && d.text !== 'Unable to read')

        // Track unique wagons
        const newWagons = new Set(seenWagons)
        ocrWithText.forEach(d => {
            if (d.text) {
                newWagons.add(d.text)
            }
        })

        if (newWagons.size !== seenWagons.size) {
            setSeenWagons(newWagons)
        }

        setStats(prev => ({
            total_wagons: newWagons.size,
            damage_detected: prev.damage_detected + (damageCount > 0 ? 1 : 0),
            ocr_success: prev.ocr_success + ocrWithText.length,
        }))
    }, [detections])

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Train size={16} className="text-emerald-600" />
                </div>
                <div>
                    <h3 className="text-sm font-medium text-slate-700">Wagon Counter</h3>
                    <p className="text-[10px] text-slate-500">Unique wagons detected</p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-emerald-50 rounded-lg">
                    <p className="text-2xl font-bold text-emerald-700">{stats.total_wagons}</p>
                    <p className="text-[10px] text-emerald-600 mt-0.5">Wagons</p>
                </div>

                <div className="text-center p-3 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-700">{stats.damage_detected}</p>
                    <p className="text-[10px] text-red-600 mt-0.5">Damage Events</p>
                </div>

                <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-700">{stats.ocr_success}</p>
                    <p className="text-[10px] text-blue-600 mt-0.5">IDs Read</p>
                </div>
            </div>

            {seenWagons.size > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-[10px] text-slate-500 mb-1.5">Recent Wagon IDs:</p>
                    <div className="flex flex-wrap gap-1">
                        {Array.from(seenWagons).slice(-6).map((id, i) => (
                            <span
                                key={i}
                                className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] rounded font-mono"
                            >
                                {id}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
