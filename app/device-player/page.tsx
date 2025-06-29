"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Monitor,
  Wifi,
  WifiOff,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  RotateCcw,
  SkipForward,
  SkipBack,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { toast } from "sonner"

interface Device {
  id: number
  name: string
  status: string
}

interface MediaFile {
  id: number
  filename: string
  original_name: string
  file_type: string
  url: string
  thumbnail_url?: string
  mime_type?: string
  media_source?: string
  external_url?: string
}

interface PlaylistItem {
  id: number
  media_id: number
  position: number
  duration: number
  transition_type: string
  media: MediaFile
}

interface Playlist {
  id: number
  name: string
  description: string
  loop_enabled: boolean
  shuffle: boolean
  background_color?: string
  items: PlaylistItem[]
}

export default function DevicePlayer() {
  const [pairingCode, setPairingCode] = useState("")
  const [device, setDevice] = useState<Device | null>(null)
  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected")
  const [mediaLoading, setMediaLoading] = useState(false)
  const [mediaError, setMediaError] = useState<string | null>(null)
  const [performanceMetrics, setPerformanceMetrics] = useState({
    mediaLoadTime: 0,
    playbackErrors: 0,
    successfulTransitions: 0,
    totalItemsPlayed: 0,
  })

  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const imageTimerRef = useRef<NodeJS.Timeout | null>(null)
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null)
  const playlistInterval = useRef<NodeJS.Timeout | null>(null)

  const connectDevice = async () => {
    if (!pairingCode.trim()) {
      toast.error("Please enter a pairing code")
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
          deviceCode: pairingCode.trim().toUpperCase(),
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

        toast.success(`Connected! Device: ${data.device.name}`)
      } else {
        throw new Error(data.error || "Failed to register device")
      }
    } catch (error) {
      console.error("Connection error:", error)
      setConnectionStatus("disconnected")
      toast.error(error instanceof Error ? error.message : "Failed to register device")
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
            playCurrentItem()
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

  const playCurrentItem = useCallback(() => {
    if (!playlist || !playlist.items.length) return

    const currentItem = playlist.items[currentItemIndex]
    if (!currentItem) return

    const media = currentItem.media
    console.log("Playing item:", media.original_name, "Type:", media.mime_type || media.file_type)

    setMediaLoading(true)
    setMediaError(null)

    // Clear any existing timers
    if (imageTimerRef.current) {
      clearTimeout(imageTimerRef.current)
      imageTimerRef.current = null
    }

    // Reset progress
    setProgress(0)
    setCurrentTime(0)

    const startTime = Date.now()

    if (isVideoFile(media.mime_type || media.file_type)) {
      playVideo(media, currentItem.duration, startTime)
    } else if (isAudioFile(media.mime_type || media.file_type)) {
      playAudio(media, currentItem.duration, startTime)
    } else if (media.media_source === "google_slides") {
      playSlides(media, currentItem.duration, startTime)
    } else {
      playImage(media, currentItem.duration, startTime)
    }
  }, [playlist, currentItemIndex, isPlaying, isMuted])

  const playVideo = (media: MediaFile, duration: number, startTime: number) => {
    const video = videoRef.current
    if (video) {
      video.src = media.url
      video.muted = isMuted
      video.load()

      video.onloadedmetadata = () => {
        const loadTime = Date.now() - startTime
        setPerformanceMetrics((prev) => ({ ...prev, mediaLoadTime: loadTime }))
        setTotalTime(video.duration)
        setMediaLoading(false)

        if (isPlaying) {
          video.play().catch((err) => {
            console.error("Video play error:", err)
            handleMediaError("Failed to play video")
          })
        }
      }

      video.ontimeupdate = () => {
        setCurrentTime(video.currentTime)
        setProgress((video.currentTime / video.duration) * 100)
      }

      video.onended = () => {
        setPerformanceMetrics((prev) => ({
          ...prev,
          successfulTransitions: prev.successfulTransitions + 1,
          totalItemsPlayed: prev.totalItemsPlayed + 1,
        }))
        nextItem()
      }

      video.onerror = () => {
        handleMediaError("Failed to load video")
      }
    }
  }

  const playAudio = (media: MediaFile, duration: number, startTime: number) => {
    const audio = audioRef.current
    if (audio) {
      audio.src = media.url
      audio.muted = isMuted
      audio.load()

      audio.onloadedmetadata = () => {
        const loadTime = Date.now() - startTime
        setPerformanceMetrics((prev) => ({ ...prev, mediaLoadTime: loadTime }))
        setTotalTime(audio.duration)
        setMediaLoading(false)

        if (isPlaying) {
          audio.play().catch((err) => {
            console.error("Audio play error:", err)
            handleMediaError("Failed to play audio")
          })
        }
      }

      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime)
        setProgress((audio.currentTime / audio.duration) * 100)
      }

      audio.onended = () => {
        setPerformanceMetrics((prev) => ({
          ...prev,
          successfulTransitions: prev.successfulTransitions + 1,
          totalItemsPlayed: prev.totalItemsPlayed + 1,
        }))
        nextItem()
      }

      audio.onerror = () => {
        handleMediaError("Failed to load audio")
      }
    }
  }

  const playImage = (media: MediaFile, duration: number, startTime: number) => {
    const itemDuration = duration || 8
    setTotalTime(itemDuration)

    // Preload image
    const img = new Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      const loadTime = Date.now() - startTime
      setPerformanceMetrics((prev) => ({ ...prev, mediaLoadTime: loadTime }))
      setMediaLoading(false)

      if (isPlaying) {
        startImageTimer(itemDuration)
      }
    }

    img.onerror = () => {
      handleMediaError("Failed to load image")
    }

    img.src = media.url
  }

  const playSlides = (media: MediaFile, duration: number, startTime: number) => {
    const itemDuration = duration || 60
    setTotalTime(itemDuration)

    setTimeout(() => {
      const loadTime = Date.now() - startTime
      setPerformanceMetrics((prev) => ({ ...prev, mediaLoadTime: loadTime }))
      setMediaLoading(false)

      if (isPlaying) {
        startImageTimer(itemDuration)
      }
    }, 1000)
  }

  const startImageTimer = (duration: number) => {
    const startTime = Date.now()

    const updateProgress = () => {
      const elapsed = (Date.now() - startTime) / 1000
      setCurrentTime(elapsed)
      setProgress((elapsed / duration) * 100)

      if (elapsed >= duration) {
        setPerformanceMetrics((prev) => ({
          ...prev,
          successfulTransitions: prev.successfulTransitions + 1,
          totalItemsPlayed: prev.totalItemsPlayed + 1,
        }))
        nextItem()
      } else {
        imageTimerRef.current = setTimeout(updateProgress, 100)
      }
    }

    updateProgress()
  }

  const handleMediaError = (errorMessage: string) => {
    setMediaLoading(false)
    setMediaError(errorMessage)
    setIsPlaying(false)
    setPerformanceMetrics((prev) => ({ ...prev, playbackErrors: prev.playbackErrors + 1 }))

    // Auto-advance after 3 seconds
    setTimeout(() => {
      nextItem()
    }, 3000)
  }

  const isVideoFile = (fileType: string) => {
    return (
      fileType?.startsWith("video/") ||
      fileType?.includes("mp4") ||
      fileType?.includes("webm") ||
      fileType?.includes("ogg")
    )
  }

  const isAudioFile = (fileType: string) => {
    return (
      fileType?.startsWith("audio/") ||
      fileType?.includes("mp3") ||
      fileType?.includes("wav") ||
      fileType?.includes("ogg")
    )
  }

  const nextItem = () => {
    if (!playlist || !playlist.items.length) return

    let nextIndex = currentItemIndex + 1

    if (nextIndex >= playlist.items.length) {
      if (playlist.loop_enabled) {
        nextIndex = 0
      } else {
        setIsPlaying(false)
        return
      }
    }

    setCurrentItemIndex(nextIndex)
  }

  const previousItem = () => {
    if (!playlist || !playlist.items.length) return

    const prevIndex = currentItemIndex - 1
    if (prevIndex < 0) {
      if (playlist.loop_enabled) {
        setCurrentItemIndex(playlist.items.length - 1)
      } else {
        setCurrentItemIndex(0)
      }
    } else {
      setCurrentItemIndex(prevIndex)
    }
  }

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)

    const video = videoRef.current
    const audio = audioRef.current

    if (!isPlaying) {
      // Resume
      if (video && !video.paused) video.play()
      if (audio && !audio.paused) audio.play()
      playCurrentItem()
    } else {
      // Pause
      if (video) video.pause()
      if (audio) audio.pause()
      if (imageTimerRef.current) {
        clearTimeout(imageTimerRef.current)
        imageTimerRef.current = null
      }
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)

    const video = videoRef.current
    const audio = audioRef.current

    if (video) video.muted = !isMuted
    if (audio) audio.muted = !isMuted
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const renderCurrentMedia = () => {
    if (!playlist || !playlist.items.length) {
      return (
        <div className="flex-1 flex items-center justify-center bg-black text-white">
          <div className="text-center">
            <Monitor className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h2 className="text-2xl font-semibold mb-2">No Content Assigned</h2>
            <p className="text-gray-400">Waiting for playlist assignment...</p>
          </div>
        </div>
      )
    }

    const currentItem = playlist.items[currentItemIndex]
    if (!currentItem) return null

    const media = currentItem.media

    if (mediaLoading) {
      return (
        <div className="flex-1 bg-black flex items-center justify-center text-white">
          <div className="text-center">
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin" />
            <h3 className="text-xl font-semibold mb-2">Loading Media</h3>
            <p className="text-gray-400">{media.original_name}</p>
          </div>
        </div>
      )
    }

    if (mediaError) {
      return (
        <div className="flex-1 bg-black flex items-center justify-center text-white">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <h3 className="text-xl font-semibold mb-2">Media Error</h3>
            <p className="text-gray-400 mb-2">{mediaError}</p>
            <p className="text-sm text-gray-500">{media.original_name}</p>
            <div className="text-xs text-gray-600 mt-2">Auto-advancing in 3 seconds...</div>
          </div>
        </div>
      )
    }

    const backgroundColor = playlist.background_color || "#000000"

    if (isVideoFile(media.mime_type || media.file_type)) {
      return (
        <div className="flex-1 flex items-center justify-center" style={{ backgroundColor }}>
          <video
            ref={videoRef}
            className="max-w-full max-h-full object-contain"
            controls={false}
            muted={isMuted}
            playsInline
          />
        </div>
      )
    }

    if (isAudioFile(media.mime_type || media.file_type)) {
      return (
        <div className="flex-1 bg-gradient-to-br from-purple-900 to-blue-900 flex items-center justify-center text-white">
          <audio ref={audioRef} className="hidden" />
          <div className="text-center space-y-6">
            <div className="w-32 h-32 mx-auto bg-white/20 rounded-full flex items-center justify-center">
              <Volume2 className="h-16 w-16" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold mb-2">{media.original_name}</h2>
              <div className="w-64 mx-auto">
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between text-sm mt-2 opacity-75">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(totalTime)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (media.media_source === "google_slides" && media.external_url) {
      return (
        <div className="flex-1" style={{ backgroundColor }}>
          <iframe src={media.external_url} className="w-full h-full border-0" allow="fullscreen" />
        </div>
      )
    }

    // Default to image display
    return (
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor }}>
        <img
          src={media.url || "/placeholder.svg"}
          alt={media.original_name}
          className="max-w-full max-h-full object-contain"
        />
      </div>
    )
  }

  // Play current item when it changes
  useEffect(() => {
    if (isPlaying && playlist) {
      playCurrentItem()
    }
  }, [currentItemIndex, playCurrentItem])

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current)
      }
      if (playlistInterval.current) {
        clearInterval(playlistInterval.current)
      }
      if (imageTimerRef.current) {
        clearTimeout(imageTimerRef.current)
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
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect Device"
              )}
            </Button>
            <div className="text-center text-sm text-gray-500">
              <p>Get your pairing code from:</p>
              <p className="font-mono bg-gray-100 px-2 py-1 rounded mt-1">Dashboard → Screens → Add Screen</p>
            </div>
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
              <Badge variant="secondary" className="ml-2 text-xs">
                {currentItemIndex + 1}/{playlist.items.length}
              </Badge>
              {playlist.loop_enabled && (
                <Badge variant="outline" className="ml-1 text-xs border-green-500 text-green-400">
                  Loop
                </Badge>
              )}
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
      <div className="w-full h-screen pt-12">{renderCurrentMedia()}</div>

      {/* Progress Bar */}
      {isPlaying && (
        <div className="absolute bottom-16 left-0 right-0 px-4">
          <Progress value={progress} className="h-1" />
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-4 left-0 right-0 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {playlist && playlist.items[currentItemIndex] && (
              <span className="text-sm truncate max-w-48">{playlist.items[currentItemIndex].media.original_name}</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={previousItem}
              disabled={!playlist || playlist.items.length <= 1}
              className="bg-black bg-opacity-75"
            >
              <SkipBack className="w-4 h-4" />
            </Button>

            <Button
              size="sm"
              variant="secondary"
              onClick={togglePlayPause}
              disabled={!playlist || playlist.items.length === 0}
              className="bg-black bg-opacity-75"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>

            <Button
              size="sm"
              variant="secondary"
              onClick={nextItem}
              disabled={!playlist || playlist.items.length <= 1}
              className="bg-black bg-opacity-75"
            >
              <SkipForward className="w-4 h-4" />
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

          <div className="text-xs text-gray-400">
            {formatTime(currentTime)} / {formatTime(totalTime)}
          </div>
        </div>
      </div>
    </div>
  )
}
