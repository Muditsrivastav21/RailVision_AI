'use client'

import { useEffect, useState, createContext, useContext } from 'react'
import { Camera, Check, Video, MapPin } from 'lucide-react'

/* --- Logic Context Provider (Kept same logic, new visual exports) --- */

interface CameraInfo {
    id: string
    name: string
    location?: string
    active: boolean
}

interface CameraContextType {
    cameras: CameraInfo[]
    activeCamera: string
    switchCamera: (id: string) => Promise<void>
    loading: boolean
}

const CameraContext = createContext<CameraContextType | null>(null)

export function useCameras() {
    const ctx = useContext(CameraContext)
    if (!ctx) {
        return { cameras: [], activeCamera: 'cam_1', switchCamera: async () => { }, loading: false }
    }
    return ctx
}

export function CameraProvider({ children }: { children: React.ReactNode }) {
    const [cameras, setCameras] = useState<CameraInfo[]>([
        { id: 'cam_1', name: 'Camera 1', location: 'Entry Gate', active: true },
        { id: 'cam_2', name: 'Camera 2', location: 'Main Crossing', active: false },
        { id: 'cam_3', name: 'Camera 3', location: 'Exit Depot', active: false },
    ])
    const [activeCamera, setActiveCamera] = useState('cam_1')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        fetch('http://localhost:8000/cameras')
            .then(res => res.json())
            .then(data => {
                if (data.cameras && data.cameras.length > 0) {
                    setCameras(data.cameras)
                    setActiveCamera(data.active || 'cam_1')
                }
            })
            .catch(() => {
                // Keep default cameras if fetch fails
                console.log('Using default camera configuration')
            })
    }, [])

    const switchCamera = async (cameraId: string) => {
        if (cameraId === activeCamera || loading) return
        setLoading(true)
        try {
            const res = await fetch(`http://localhost:8000/cameras/${cameraId}/activate`, { method: 'POST' })
            const data = await res.json()
            if (data.success) {
                setActiveCamera(data.active)
                setCameras(prev => prev.map(c => ({ ...c, active: c.id === data.active })))
            }
        } catch (e) {
            console.error('Failed to switch camera')
        } finally {
            setLoading(false)
        }
    }

    return (
        <CameraContext.Provider value={{ cameras, activeCamera, switchCamera, loading }}>
            {children}
        </CameraContext.Provider>
    )
}

/* --- Components --- */

export function CameraSelector() {
    const { cameras, activeCamera, switchCamera, loading } = useCameras()

    if (cameras.length === 0) return null

    return (
        <div className="glass-panel p-6 rounded-[24px]">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Video className="text-blue-600" size={20} />
                </div>
                <div>
                    <h3 className="text-base font-bold text-slate-900">Feed Sources</h3>
                    <p className="text-xs text-slate-500 font-medium">Select active input stream</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {cameras.map((cam) => {
                    const isActive = cam.id === activeCamera
                    return (
                        <button
                            key={cam.id}
                            onClick={() => switchCamera(cam.id)}
                            disabled={loading}
                            className={`relative text-left p-4 rounded-2xl transition-all duration-300 group
                                ${isActive
                                    ? 'bg-blue-600 shadow-xl shadow-blue-500/20 text-white translate-y-[-2px]'
                                    : 'bg-slate-50 hover:bg-white border border-slate-100 shadow-sm hover:shadow-md text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className={`p-2 rounded-lg ${isActive ? 'bg-white/20' : 'bg-white shadow-sm'}`}>
                                    <Camera size={16} />
                                </div>
                                {isActive && <div className="animate-pulse w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,1)]" />}
                            </div>

                            <p className="font-bold text-sm tracking-tight mb-1">
                                {cam.name}
                            </p>

                            <div className="flex items-center gap-1.5 opacity-80">
                                <MapPin size={10} />
                                <span className="text-[10px] font-semibold tracking-wide uppercase">
                                    {cam.location || 'Unknown Location'}
                                </span>
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

// Compact version for headers - "Segmented Control" style
export function CameraSelectorCompact() {
    const { cameras, activeCamera, switchCamera, loading } = useCameras()

    if (cameras.length === 0) return null

    return (
        <div className="flex items-center bg-white/50 backdrop-blur-md border border-white/60 p-1.5 rounded-full shadow-sm">
            {cameras.map((cam) => {
                const isActive = cam.id === activeCamera
                return (
                    <button
                        key={cam.id}
                        onClick={() => switchCamera(cam.id)}
                        disabled={loading}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-300
                            ${isActive
                                ? 'bg-slate-900 text-white shadow-md'
                                : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                            }`}
                    >
                        {cam.id.replace('cam_', 'CAM ')}
                    </button>
                )
            })}
        </div>
    )
}
