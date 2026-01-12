'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useCameras } from './CameraSelector'

interface FrameData {
    image: string
    original_image: string
    enhanced_image: string
    metadata: {
        frame_id: number
        filename: string
        camera_id?: string
        camera_name?: string
        location?: string
        timestamp: number
        detections?: Array<{
            class: string
            confidence: number
            bbox: number[]
            type: string
            text?: string
        }>
        quality?: {
            blur_before: number
            blur_after: number
            brightness_before: number
            brightness_after: number
            blur_improvement: number
        }
    }
}

interface UseWebSocketReturn {
    frame: FrameData | null
    status: 'connecting' | 'open' | 'closed'
    reconnect: () => void
}

export function useCameraWebSocket(): UseWebSocketReturn {
    const { activeCamera } = useCameras()
    const [frame, setFrame] = useState<FrameData | null>(null)
    const [status, setStatus] = useState<'connecting' | 'open' | 'closed'>('connecting')
    const wsRef = useRef<WebSocket | null>(null)
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const connect = useCallback(() => {
        // Close existing connection
        if (wsRef.current) {
            wsRef.current.close()
        }

        // Clear any pending reconnect
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
        }

        setStatus('connecting')

        // Connect with camera query parameter
        const wsUrl = `ws://localhost:8000/ws/feed?camera=${activeCamera}`
        console.log(`[WebSocket] Connecting to ${wsUrl}`)

        const ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onopen = () => {
            console.log(`[WebSocket] Connected to camera: ${activeCamera}`)
            setStatus('open')
        }

        ws.onclose = () => {
            console.log('[WebSocket] Disconnected')
            setStatus('closed')
        }

        ws.onerror = (error) => {
            console.error('[WebSocket] Error:', error)
        }

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data) as FrameData
                setFrame(data)
            } catch (e) {
                // ignore parse errors
            }
        }
    }, [activeCamera])

    // Reconnect whenever activeCamera changes
    useEffect(() => {
        connect()

        return () => {
            if (wsRef.current) {
                wsRef.current.close()
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current)
            }
        }
    }, [connect])

    const reconnect = useCallback(() => {
        connect()
    }, [connect])

    return { frame, status, reconnect }
}
