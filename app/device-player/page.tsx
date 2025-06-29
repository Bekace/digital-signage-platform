"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Wifi, WifiOff, Play, Pause, Volume2, VolumeX } from "lucide-react"

interface PlaylistItem {
  id: string
  media_id: string
  duration: number
  position: number
  media: {
    id: string
    filename: string
    file_type: string
    file_url: string
    thumbnail_url?: string
  }
}

interface DeviceStatus {
  deviceId: string
  apiKey: string
  isConnected: boolean
  assignedPlaylist: any
  playlistItems: PlaylistItem[]
  currentItemIndex: number
  isPlaying: boolean
  isMuted: boolean
}

export default function DevicePlayer() {
  const [deviceCode, setDeviceCode] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [status, setStatus] = useState<DeviceStatus>({
    deviceId: "",
    apiKey: "",
    isConnected: false,
    assignedPlaylist: null,
    playlistItems: [],
    currentItemIndex: 0,
    isPlaying: false,
    isMuted: false,
  })
  const [currentTime, setCurrentTime] = useState(0)
  const [error, setError] = useState("")

  const mediaRef = useRef<HTMLVideoElement | HTMLImageElement>(null)
  const intervalRef = useRef<NodeJS.Timeout>()
  const heartbeatRef = useRef<NodeJS.Timeout>()

  // Connect device with pairing code
  const connectDevice = async () => {
    if (!deviceCode.trim()) {
      setError("Please enter a device code")
      return
    }

    setIsConnecting(true)
    setError("")

    try {
      const response = await fetch("/api/devices/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceCode: deviceCode.trim(),
          deviceType: "web-browser",
          platform: "web",
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setStatus((prev) => ({
          ...prev,
          deviceId: data.deviceId,
          apiKey: data.apiKey,
          isConnected: true,
        }))

        // Start heartbeat and playlist polling
        startHeartbeat(data.deviceId, data.apiKey)
        pollForPlaylist(data.deviceId, data.apiKey)

        // Store credentials in localStorage for reconnection
        localStorage.setItem(
          "deviceCredentials",
          JSON.stringify({
            deviceId: data.deviceId,
            apiKey: data.apiKey,
          }),
        )
      } else {
        setError(data.message || "Failed to connect device")
      }
    } catch (err) {
      setError("Connection failed. Please try again.")
    } finally {
      setIsConnecting(false)
    }
  }

  // Start heartbeat to keep connection alive
  const startHeartbeat = (deviceId: string, apiKey: string) => {
    heartbeatRef.current = setInterval(async () => {
      try {
        await fetch(`/api/devices/${deviceId}/heartbeat`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: status.isPlaying ? "playing" : "idle",
            currentItem: status.currentItemIndex,
            timestamp: new Date().toISOString(),
          }),
        })
      } catch (err) {
        console.error("Heartbeat failed:", err)
      }
    }, 30000) // Every 30 seconds
  }

  // Poll for playlist updates
  const pollForPlaylist = async (deviceId: string, apiKey: string) => {
    try {
      const response = await fetch(`/api/devices/${deviceId}/playlist`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.playlist) {
          setStatus((prev) => ({
            ...prev,
            assignedPlaylist: data.playlist,
            playlistItems: data.playlist.items || [],
            currentItemIndex: 0,
          }))

          // Auto-start playback if playlist is assigned
          if (data.playlist.items && data.playlist.items.length > 0) {
            setTimeout(() => startPlayback(), 1000)
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch playlist:", err)
    }

    // Poll again in 60 seconds
    setTimeout(() => pollForPlaylist(deviceId, apiKey), 60000)
  }

  // Start playlist playback
  const startPlayback = () => {
    if (status.playlistItems.length === 0) return

    setStatus((prev) => ({ ...prev, isPlaying: true, currentItemIndex: 0 }))
    playCurrentItem()
  }

  // Play current playlist item
  const playCurrentItem = () => {
    const currentItem = status.playlistItems[status.currentItemIndex]
    if (!currentItem) return

    const duration = currentItem.duration * 1000 // Convert to milliseconds

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // For images, set a timer to move to next item
    if (currentItem.media.file_type.startsWith("image/")) {
      intervalRef.current = setTimeout(() => {
        nextItem()
      }, duration)
    }

    setCurrentTime(0)
  }

  // Move to next playlist item
  const nextItem = () => {
    if (status.playlistItems.length === 0) return

    const nextIndex = (status.currentItemIndex + 1) % status.playlistItems.length
    setStatus((prev) => ({ ...prev, currentItemIndex: nextIndex }))

    setTimeout(() => playCurrentItem(), 100)
  }

  // Toggle play/pause
  const togglePlayback = () => {
    setStatus((prev) => ({ ...prev, isPlaying: !prev.isPlaying }))

    if (mediaRef.current && "play" in mediaRef.current) {
      if (status.isPlaying) {
        ;(mediaRef.current as HTMLVideoElement).pause()
      } else {
        ;(mediaRef.current as HTMLVideoElement).play()
      }
    }
  }

  // Toggle mute
  const toggleMute = () => {
    setStatus((prev) => ({ ...prev, isMuted: !prev.isMuted }))

    if (mediaRef.current && "muted" in mediaRef.current) {
      ;(mediaRef.current as HTMLVideoElement).muted = !status.isMuted
    }
  }

  // Try to reconnect on page load
  useEffect(() => {
    const stored = localStorage.getItem("deviceCredentials")
    if (stored) {
      try {
        const credentials = JSON.parse(stored)
        setStatus((prev) => ({
          ...prev,
          deviceId: credentials.deviceId,
          apiKey: credentials.apiKey,
          isConnected: true,
        }))

        startHeartbeat(credentials.deviceId, credentials.apiKey)
        pollForPlaylist(credentials.deviceId, credentials.apiKey)
      } catch (err) {
        localStorage.removeItem("deviceCredentials")
      }
    }
  }, [])

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (heartbeatRef.current) clearInterval(heartbeatRef.current)
    }
  }, [])

  // Handle video events
  const handleVideoEnded = () => {
    nextItem()
  }

  const handleVideoTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget
    setCurrentTime(video.currentTime)
  }

  const currentItem = status.playlistItems[status.currentItemIndex]

  if (!status.isConnected) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 space-y-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-2">Digital Signage Player</h1>
              <p className="text-muted-foreground mb-4">
                Enter the device code from your dashboard to connect this screen
              </p>
            </div>

            <div className="space-y-4">
              <Input
                placeholder="Enter device code (e.g., ABC123)"
                value={deviceCode}
                onChange={(e) => setDeviceCode(e.target.value.toUpperCase())}
                className="text-center text-lg font-mono"
                maxLength={6}
              />

              <Button
                onClick={connectDevice}
                disabled={isConnecting || !deviceCode.trim()}
                className="w-full"
                size="lg"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect Device"
                )}
              </Button>

              {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            </div>

            <div className="text-xs text-muted-foreground text-center">
              <p>This device will appear in your dashboard once connected.</p>
              <p>Make sure this browser stays open and connected to the internet.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Status Bar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Badge variant={status.isConnected ? "default" : "destructive"}>
            {status.isConnected ? (
              <>
                <Wifi className="w-3 h-3 mr-1" />
                Connected
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 mr-1" />
                Disconnected
              </>
            )}
          </Badge>

          {status.assignedPlaylist && <Badge variant="outline">{status.assignedPlaylist.name}</Badge>}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={toggleMute} className="text-white hover:bg-white/20">
            {status.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>

          <Button variant="ghost" size="sm" onClick={togglePlayback} className="text-white hover:bg-white/20">
            {status.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Media Display */}
      <div className="w-full h-screen flex items-center justify-center">
        {!status.assignedPlaylist ? (
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Waiting for Content</h2>
            <p className="text-xl text-gray-400">No playlist assigned. Please assign a playlist from your dashboard.</p>
          </div>
        ) : status.playlistItems.length === 0 ? (
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Empty Playlist</h2>
            <p className="text-xl text-gray-400">
              The assigned playlist "{status.assignedPlaylist.name}" has no items.
            </p>
          </div>
        ) : currentItem ? (
          <div className="w-full h-full flex items-center justify-center">
            {currentItem.media.file_type.startsWith("image/") ? (
              <img
                ref={mediaRef as React.RefObject<HTMLImageElement>}
                src={currentItem.media.file_url || "/placeholder.svg"}
                alt={currentItem.media.filename}
                className="max-w-full max-h-full object-contain"
                style={{ display: status.isPlaying ? "block" : "none" }}
              />
            ) : currentItem.media.file_type.startsWith("video/") ? (
              <video
                ref={mediaRef as React.RefObject<HTMLVideoElement>}
                src={currentItem.media.file_url}
                className="max-w-full max-h-full object-contain"
                autoPlay={status.isPlaying}
                muted={status.isMuted}
                onEnded={handleVideoEnded}
                onTimeUpdate={handleVideoTimeUpdate}
                style={{ display: status.isPlaying ? "block" : "none" }}
              />
            ) : (
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">{currentItem.media.filename}</h3>
                <p className="text-gray-400">Unsupported media type</p>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Progress Bar */}
      {currentItem && status.isPlaying && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-white/20 rounded-full h-1">
            <div
              className="bg-white rounded-full h-1 transition-all duration-1000"
              style={{
                width: currentItem.media.file_type.startsWith("video/")
                  ? `${(currentTime / currentItem.duration) * 100}%`
                  : `${((Date.now() % (currentItem.duration * 1000)) / (currentItem.duration * 1000)) * 100}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>
              {status.currentItemIndex + 1} of {status.playlistItems.length}
            </span>
            <span>{currentItem.media.filename}</span>
          </div>
        </div>
      )}
    </div>
  )
}
