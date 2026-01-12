'use client'

import { useEffect, useState } from 'react'
import { Sparkles, RefreshCw, TrendingUp, Image } from 'lucide-react'

interface TopFrame {
  score: number
  frame_id: number
  camera_id?: string
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

export default function BlurMitigationPage() {
  const [topFrames, setTopFrames] = useState<TopFrame[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFrame, setSelectedFrame] = useState<TopFrame | null>(null)
  const [limit, setLimit] = useState(10)

  const fetchTopFrames = async () => {
    setLoading(true)
    try {
      const res = await fetch(`http://localhost:8000/top-frames?limit=${limit}`)
      const data = await res.json()
      setTopFrames(data)
    } catch (e) {
      console.error('Failed to fetch top frames:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTopFrames()
    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchTopFrames, 5000)
    return () => clearInterval(interval)
  }, [limit])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">Blur Mitigation Analysis</h2>
          <p className="mt-1 text-sm text-slate-500">
            Top frames with highest blur correction applied.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
          >
            <option value={5}>Top 5</option>
            <option value={10}>Top 10</option>
            <option value={20}>Top 20</option>
            <option value={50}>Top 50</option>
          </select>

          <button
            onClick={fetchTopFrames}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-violet-50 flex items-center justify-center">
              <Sparkles size={18} className="text-violet-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Analyzed</p>
              <p className="text-xl font-semibold text-slate-800">{topFrames.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
              <TrendingUp size={18} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Best Improvement</p>
              <p className="text-xl font-semibold text-slate-800">
                {topFrames.length > 0 ? topFrames[0].score.toFixed(1) : '—'}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Image size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Avg Improvement</p>
              <p className="text-xl font-semibold text-slate-800">
                {topFrames.length > 0
                  ? (topFrames.reduce((s, f) => s + f.score, 0) / topFrames.length).toFixed(1)
                  : '—'}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Sparkles size={18} className="text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Avg Sharpness After</p>
              <p className="text-xl font-semibold text-slate-800">
                {topFrames.length > 0
                  ? (topFrames.reduce((s, f) => s + f.quality.blur_after, 0) / topFrames.length).toFixed(0)
                  : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Frame Comparison */}
      {selectedFrame && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-slate-800">
              Frame #{selectedFrame.frame_id} Comparison
            </h3>
            <button
              onClick={() => setSelectedFrame(null)}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-2">Original (Blurred)</p>
              <img
                src={selectedFrame.original_image}
                alt="Original"
                className="w-full rounded-lg border border-slate-200"
              />
              <p className="text-xs text-slate-600 mt-1">
                Sharpness: {selectedFrame.quality.blur_before.toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-2">Enhanced (Deblurred)</p>
              <img
                src={selectedFrame.enhanced_image}
                alt="Enhanced"
                className="w-full rounded-lg border border-slate-200"
              />
              <p className="text-xs text-slate-600 mt-1">
                Sharpness: {selectedFrame.quality.blur_after.toFixed(1)}
                <span className="text-green-600 ml-1">
                  (+{selectedFrame.score.toFixed(1)} improvement)
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top Frames Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-sm font-medium text-slate-700">
            Top {limit} Frames with Highest Blur Correction
          </h3>
        </div>

        <div className="max-h-[500px] overflow-auto">
          {loading && topFrames.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              Loading top frames...
            </div>
          ) : topFrames.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              No frames processed yet. Start the video feed to see blur corrections.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Rank</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Frame</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Blur Before</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Blur After</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Improvement</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topFrames.map((frame, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-700">#{idx + 1}</td>
                    <td className="px-4 py-3 text-slate-600">Frame {frame.frame_id}</td>
                    <td className="px-4 py-3 text-red-600">{frame.quality.blur_before.toFixed(1)}</td>
                    <td className="px-4 py-3 text-green-600">{frame.quality.blur_after.toFixed(1)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs">
                        <TrendingUp size={10} />
                        +{frame.score.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedFrame(frame)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        Compare
                      </button>
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
