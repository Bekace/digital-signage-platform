"use client"

import { useEffect, useState, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, Wifi, WifiOff, Play, Pause, SkipForward, SkipBack } from "lucide-react"

interface DeviceInfo {
  name: string
  platform: string
  capabilities: string[]
  screenResolution: string
}

interface PlaylistItem {
  id: number
  media_id: number
  duration: number
  order_index: number
  media: {
    id: number
    filename: string
    original_filename: string
    file_type: string
    file_size: number
    url: string
    thumbnail_url?: string
  }
}

interface Playlist {
  id: number
  name: string
  description?: string
  items: PlaylistItem[]
  loop_playlist: boolean
  shuffle_items: boolean
  transition_effect: string
}

export default function DevicePlayerPage() {
  const searchParams = useSearchParams()
  const [pairingCode, setPairingCode] = useState(searchParams?.get("code") || "")
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "playing" | "error">("idle")
  const [message, setMessage] = useState("")
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null)
  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [deviceId, setDeviceId] = useState<number | null>(null)
  const [screenDimensions, setScreenDimensions] = useState({ width: 0, height: 0 })

  // Get device info safely
  const getDeviceInfo = useCallback((): DeviceInfo => {
    if (typeof window === "undefined") {
      return {
        name: "Server Device",
        platform: "server",
        capabilities: [],
        screenResolution: "0x0",
      }
    }

    const capabilities = []

    // Check for various capabilities
    if ("serviceWorker" in navigator) capabilities.push("service-worker")
    if ("webkitRequestFullscreen" in document.documentElement) capabilities.push("fullscreen")
    if (window.DeviceOrientationEvent) capabilities.push("orientation")
    if (navigator.onLine !== undefined) capabilities.push("online-detection")

    const screenWidth = window.screen?.width || window.innerWidth || 0
    const screenHeight = window.screen?.height || window.innerHeight || 0

    return {
      name: `Web Browser - ${navigator.userAgent.split(" ")[0]}`,
      platform: navigator.platform || "unknown",
      capabilities,
      screenResolution: `${screenWidth}x${screenHeight}`,
    }
  }, [])

  // Update screen dimensions
  useEffect(() => {
    if (typeof window !== "undefined") {
      const updateDimensions = () => {
        setScreenDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        })
      }

      updateDimensions()
      window.addEventListener("resize", updateDimensions)
      return () => window.removeEventListener("resize", updateDimensions)
    }
  }, [])

  // Auto-connect if pairing code is provided
  useEffect(() => {
    if (pairingCode && status === "idle") {
      handleConnect()
    }
  }, [pairingCode])

  const handleConnect = async () => {
    if (!pairingCode.trim()) {
      setMessage("Please enter a pairing code")
      return
    }

    setStatus("connecting")
    setMessage("Connecting to server...")

    try {
      // Get device info
      const deviceInfo = getDeviceInfo()
      setDeviceInfo(deviceInfo)

      // Register device
      const registerResponse = await fetch("/api/devices/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pairingCode: pairingCode.trim().toUpperCase(),
          deviceInfo,
        }),
      })

      const registerData = await registerResponse.json()

      if (!registerData.success) {
        throw new Error(registerData.error || "Failed to register device")
      }

      setDeviceId(registerData.device.id)
      setStatus("connected")
      setMessage(`Connected as: ${registerData.pairingInfo.screenName}`)

      // Start heartbeat
      startHeartbeat(registerData.device.id)

      // Check for assigned playlist
      await checkForPlaylist(registerData.device.id)
    } catch (error) {
      console.error("Connection error:", error)
      setStatus("error")
      setMessage(error instanceof Error ? error.message : "Connection failed")
    }
  }

  const startHeartbeat = (deviceId: number) => {
    const sendHeartbeat = async () => {
      try {
        await fetch(`/api/devices/${deviceId}/heartbeat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: isPlaying ? "playing" : "idle",
            currentItemId: playlist?.items[currentItemIndex]?.id || null,
            progress,
            performanceMetrics: {
              screenWidth: screenDimensions.width,
              screenHeight: screenDimensions.height,
              timestamp: Date.now(),
            },
          }),
        })
      } catch (error) {
        console.error("Heartbeat error:", error)
      }
    }

    // Send heartbeat every 30 seconds
    const interval = setInterval(sendHeartbeat, 30000)

    // Send initial heartbeat
    sendHeartbeat()

    return () => clearInterval(interval)
  }

  const checkForPlaylist = async (deviceId: number) => {
    try {
      const response = await fetch(`/api/devices/${deviceId}/playlist`)
      const data = await response.json()

      if (data.success && data.playlist) {
        setPlaylist(data.playlist)
        setMessage(`Playlist loaded: ${data.playlist.name}`)

        if (data.playlist.items.length > 0) {
          setStatus("playing")
          setIsPlaying(true)
        }
      }
    } catch (error) {
      console.error("Playlist check error:", error)
    }
  }

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleNext = () => {
    if (playlist && playlist.items.length > 0) {
      const nextIndex = (currentItemIndex + 1) % playlist.items.length
      setCurrentItemIndex(nextIndex)
      setProgress(0)
    }
  }

  const handlePrevious = () => {
    if (playlist && playlist.items.length > 0) {
      const prevIndex = currentItemIndex === 0 ? playlist.items.length - 1 : currentItemIndex - 1
      setCurrentItemIndex(prevIndex)
      setProgress(0)
    }
  }

  const renderMediaContent = () => {
    if (!playlist || !playlist.items[currentItemIndex]) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
          <p className="text-gray-500">No content to display</p>
        </div>
      )
    }

    const currentItem = playlist.items[currentItemIndex]
    const media = currentItem.media

    switch (media.file_type) {
      case "image":
        return (
          <img
            src={media.url || "/placeholder.svg"}
            alt={media.original_filename}
            className="w-full h-auto max-h-96 object-contain rounded-lg"
            crossOrigin="anonymous"
          />
        )
      case "video":
        return (
          <video
            src={media.url}
            controls={!isPlaying}
            autoPlay={isPlaying}
            loop={false}
            className="w-full h-auto max-h-96 rounded-lg"
            crossOrigin="anonymous"
            onEnded={handleNext}
          />
        )
      case "slides":
        return (
          <iframe
            src={media.url}
            className="w-full h-96 rounded-lg border"
            title={media.original_filename}
            allowFullScreen
          />
        )
      default:
        return (
          <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
            <div className="text-center">
              <p className="text-gray-700 font-medium">{media.original_filename}</p>
              <p className="text-gray-500 text-sm">{media.file_type}</p>
            </div>
          </div>
        )
    }
  }

  if (status === "idle" || status === "connecting") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Digital Signage Player</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pairing-code">Pairing Code</Label>
              <Input
                id="pairing-code"
                value={pairingCode}
                onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-digit code"
                maxLength={6}
                className="text-center text-lg font-mono"
              />
            </div>

            <Button
              onClick={handleConnect}
              disabled={status === "connecting" || !pairingCode.trim()}
              className="w-full"
            >
              {status === "connecting" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect"
              )}
            </Button>

            {message && <p className="text-sm text-center text-gray-600">{message}</p>}

            {deviceInfo && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-sm mb-2">Device Info</h3>
                <div className="space-y-1 text-xs text-gray-600">
                  <p>
                    <strong>Name:</strong> {deviceInfo.name}
                  </p>
                  <p>
                    <strong>Platform:</strong> {deviceInfo.platform}
                  </p>
                  <p>
                    <strong>Resolution:</strong> {deviceInfo.screenResolution}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {deviceInfo.capabilities.map((cap) => (
                      <Badge key={cap} variant="secondary" className="text-xs">
                        {cap}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Connection Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-gray-600">{message}</p>
            <Button
              onClick={() => {
                setStatus("idle")
                setMessage("")
                setPairingCode("")
              }}
              className="w-full"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Status Bar */}
      <div className="bg-gray-900 p-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {status === "connected" ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
          <span className="text-sm">{message}</span>
        </div>

        <div className="flex items-center space-x-2 text-sm">
          {playlist && (
            <span>
              {currentItemIndex + 1} / {playlist.items.length}
            </span>
          )}
          <span>
            {screenDimensions.width}x{screenDimensions.height}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-4">{renderMediaContent()}</div>

      {/* Control Bar */}
      {playlist && playlist.items.length > 0 && (
        <div className="bg-gray-900 p-4">
          <div className="flex items-center justify-center space-x-4">
            <Button variant="ghost" size="sm" onClick={handlePrevious} className="text-white hover:bg-gray-800">
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button variant="ghost" size="sm" onClick={handlePlayPause} className="text-white hover:bg-gray-800">
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>

            <Button variant="ghost" size="sm" onClick={handleNext} className="text-white hover:bg-gray-800">
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-2 text-center text-sm text-gray-400">
            {playlist.items[currentItemIndex]?.media.original_filename}
          </div>
        </div>
      )}
    </div>
  )
}
