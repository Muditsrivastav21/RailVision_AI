import { DetectionFeed } from '@/components/DetectionFeed'

export default function DamageDetectionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-800">Damage Detection Pipeline</h2>
        <p className="mt-1 text-sm text-slate-500">
          Monitor wagon body, door, and bogie damage detected by the AI models.
        </p>
      </div>

      <DetectionFeed mode="damage" />
    </div>
  )
}
