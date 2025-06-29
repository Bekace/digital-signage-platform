"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Monitor, Wifi, WifiOff, Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Device {
  id: number
  name: string
  status: string
}

interface MediaItem {
  id: number
  order_index: number
  duration: number
  media: {
    id: number
    filename: string
    file_type: string
    url: string
    thumbnail_url?: string
    metadata?: any
  }
}

interface Playlist {
  id: number
  name: string
  description: string
  settings: {
    loop: boolean
    shuffle: boolean
    transitionDuration: number
    backgroundColor?: string
    textColor?: string
  }
  items: MediaItem[]
}

export default function DevicePlayer() {
  const [pairingCode, setPairingCode] = useState("")
  const [device, setDevice] = useState<Device | null>(null)
  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected")
  const [performanceMetrics, setPerformanceMetrics] = useState({
    mediaLoadTime: 0,
    playbackErrors: 0,
    successfulTransitions: 0,
    totalItemsPlayed: 0,
  })

  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null)
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null)
  const playlistInterval = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  const connectDevice = async () => {
    if (!pairingCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a pairing code",
        variant: "destructive",
      })
      return
    }

    setIsConnecting(true)
    setConnectionStatus("connecting")

    try {
      const response = await fetch("/api/devices/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: pairingCode.trim().toUpperCase(),
          deviceName: `Web Player ${new Date().toLocaleString()}`,
          deviceType: "web-player",
          platform: navigator.userAgent,
          capabilities: ["video", "audio", "image", "slides"],
          screenResolution: `${window.screen.width}x${window.screen.height}`,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setDevice(data.device)
        setConnectionStatus("connected")

        // Start heartbeat
        startHeartbeat(data.device.id)

        // Start playlist polling
        startPlaylistPolling(data.device.id)

        toast({
          title: "Connected!",
          description: `Device "${data.device.name}" registered successfully`,
        })
      } else {
        throw new Error(data.error || "Failed to register device")
      }
    } catch (error) {
      console.error("Connection error:", error)
      setConnectionStatus("disconnected")
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to register device",
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const startHeartbeat = (deviceId: number) => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current)
    }

    const sendHeartbeat = async () => {
      try {
        await fetch(`/api/devices/${deviceId}/heartbeat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: isPlaying ? "playing" : "idle",
            currentItem: playlist?.items[currentItemIndex]?.id || null,
            progress: progress,
            performanceMetrics: performanceMetrics,
          }),
        })
      } catch (error) {
        console.error("Heartbeat error:", error)
      }
    }

    // Send initial heartbeat
    sendHeartbeat()

    // Set up interval for every 15 seconds
    heartbeatInterval.current = setInterval(sendHeartbeat, 15000)
  }

  const startPlaylistPolling = (deviceId: number) => {
    if (playlistInterval.current) {
      clearInterval(playlistInterval.current)
    }

    const fetchPlaylist = async () => {
      try {
        const response = await fetch(`/api/devices/${deviceId}/playlist`)
        const data = await response.json()

        if (data.playlist && data.playlist.items.length > 0) {
          setPlaylist(data.playlist)

          // Start playing if not already playing
          if (!isPlaying && data.playlist.items.length > 0) {
            setIsPlaying(true)
            playCurrentItem(data.playlist.items[0])
          }
        }
      } catch (error) {
        console.error("Playlist fetch error:", error)
      }
    }

    // Fetch initial playlist
    fetchPlaylist()

    // Set up polling every 5 seconds
    playlistInterval.current = setInterval(fetchPlaylist, 5000)
  }

  const playCurrentItem = (item: MediaItem) => {
    const startTime = Date.now()

    // Update performance metrics
    setPerformanceMetrics((prev) => ({
      ...prev,
      totalItemsPlayed: prev.totalItemsPlayed + 1,
    }))

    // Simulate media loading
    setTimeout(
      () => {
        const loadTime = Date.now() - startTime
        setPerformanceMetrics((prev) => ({
          ...prev,
          mediaLoadTime: loadTime,
        }))
      },
      Math.random() * 1000 + 500,
    ) // Random load time between 500-1500ms
  }

  const nextItem = () => {
    if (!playlist || playlist.items.length === 0) return

    let nextIndex = currentItemIndex + 1

    if (nextIndex >= playlist.items.length) {
      if (playlist.settings.loop) {
        nextIndex = 0
      } else {
        setIsPlaying(false)
        return
      }
    }

    setCurrentItemIndex(nextIndex)
    setProgress(0)
    playCurrentItem(playlist.items[nextIndex])

    setPerformanceMetrics((prev) => ({
      ...prev,
      successfulTransitions: prev.successfulTransitions + 1,
    }))
  }

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const renderMedia = (item: MediaItem) => {
    const { media } = item

    if (media.file_type.startsWith("video/")) {
      return (
        <video
          ref={mediaRef as React.RefObject<HTMLVideoElement>}
          src={media.url}
          className="w-full h-full object-contain"
          autoPlay={isPlaying}
          muted={isMuted}
          onEnded={nextItem}
          onTimeUpdate={(e) => {
            const video = e.target as HTMLVideoElement
            setProgress((video.currentTime / video.duration) * 100)
          }}
        />
      )
    }

    if (media.file_type.startsWith("audio/")) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-purple-900 to-blue-900 text-white">
          <audio
            ref={mediaRef as React.RefObject<HTMLAudioElement>}
            src={media.url}
            autoPlay={isPlaying}
            muted={isMuted}
            onEnded={nextItem}
            onTimeUpdate={(e) => {
              const audio = e.target as HTMLAudioElement
              setProgress((audio.currentTime / audio.duration) * 100)
            }}
          />
          <div className="text-center">
            <Volume2 className="w-24 h-24 mb-4 mx-auto" />
            <h2 className="text-2xl font-bold mb-2">{media.filename}</h2>
            <p className="text-lg opacity-75">Now Playing</p>
          </div>
        </div>
      )
    }

    if (media.file_type.startsWith("image/")) {
      return (
        <img
          src={media.url || "/placeholder.svg"}
          alt={media.filename}
          className="w-full h-full object-contain"
          onLoad={() => {
            // Auto-advance after duration
            setTimeout(nextItem, item.duration * 1000)
          }}
        />
      )
    }

    if (media.url.includes("docs.google.com/presentation")) {
      return (
        <iframe
          src={media.url}
          className="w-full h-full border-0"
          title={media.filename}
          onLoad={() => {
            // Auto-advance after duration
            setTimeout(nextItem, item.duration * 1000)
          }}
        />
      )
    }

    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <p className="text-gray-500">Unsupported media type: {media.file_type}</p>
      </div>
    )
  }

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current)
      }
      if (playlistInterval.current) {
        clearInterval(playlistInterval.current)
      }
    }
  }, [])

  if (connectionStatus === "disconnected") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Monitor className="w-12 h-12 mx-auto mb-4 text-blue-600" />
            <CardTitle>Digital Signage Player</CardTitle>
            <CardDescription>Enter your pairing code to connect this device to your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="pairing-code" className="block text-sm font-medium mb-2">
                Pairing Code
              </label>
              <Input
                id="pairing-code"
                type="text"
                placeholder="Enter 6-character code"
                value={pairingCode}
                onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="text-center text-lg font-mono tracking-wider"
              />
            </div>
            <Button onClick={connectDevice} disabled={isConnecting || !pairingCode.trim()} className="w-full">
              {isConnecting ? "Connecting..." : "Connect Device"}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Status Bar */}
      <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2 z-50 flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            {connectionStatus === "connected" ? (
              <Wifi className="w-4 h-4 text-green-500 mr-1" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500 mr-1" />
            )}
            <span>{device?.name}</span>
          </div>
          {playlist && (
            <div>
              <span>{playlist.name}</span>
              <span className="ml-2 text-gray-400">
                ({currentItemIndex + 1}/{playlist.items.length})
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-xs">
            Load: {performanceMetrics.mediaLoadTime}ms | Errors: {performanceMetrics.playbackErrors} | Played:{" "}
            {performanceMetrics.totalItemsPlayed}
          </div>
          <Badge variant={isPlaying ? "default" : "secondary"}>{isPlaying ? "Playing" : "Paused"}</Badge>
        </div>
      </div>

      {/* Media Display */}
      <div className="w-full h-screen pt-12">
        {playlist && playlist.items.length > 0 ? (
          renderMedia(playlist.items[currentItemIndex])
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Monitor className="w-24 h-24 mx-auto mb-4 text-gray-600" />
              <h2 className="text-2xl font-bold mb-2">Waiting for Content</h2>
              <p className="text-gray-400">No playlist assigned to this device</p>
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {isPlaying && (
        <div className="absolute bottom-0 left-0 right-0">
          <Progress value={progress} className="h-1" />
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-4 right-4 flex space-x-2">
        <Button size="sm" variant="secondary" onClick={togglePlayPause} className="bg-black bg-opacity-75">
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        <Button size="sm" variant="secondary" onClick={toggleMute} className="bg-black bg-opacity-75">
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </Button>
        <Button size="sm" variant="secondary" onClick={toggleFullscreen} className="bg-black bg-opacity-75">
          <Maximize className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => window.location.reload()}
          className="bg-black bg-opacity-75"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
