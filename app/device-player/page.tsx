"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  Play,
  Pause,
  VolumeX,
  Volume2,
  SkipForward,
  SkipBack,
  Wifi,
  WifiOff,
  Monitor,
  Clock,
  Music,
  ImageIcon,
  Video,
  FileText,
  ExternalLink,
  Maximize,
  Minimize,
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface MediaFile {
  id: number
  filename: string
  original_name: string
  file_type: string
  url: string
  thumbnail_url?: string
  mime_type?: string
  dimensions?: string
  duration?: number
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
  description?: string
  status: string
  loop_enabled: boolean
  shuffle: boolean
  items: PlaylistItem[]
  background_color?: string
  text_overlay?: boolean
  scale_image?: string
  scale_video?: string
}

export default function DevicePlayerPage() {
  // Connection state
  const [deviceCode, setDeviceCode] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected" | "error">(
    "disconnected",
  )
  const [error, setError] = useState<string | null>(null)

  // Playlist state
  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [mediaLoading, setMediaLoading] = useState(false)
  const [mediaError, setMediaError] = useState<string | null>(null)

  // Performance metrics
  const [performanceMetrics, setPerformanceMetrics] = useState({
    mediaLoadTime: 0,
    playbackErrors: 0,
    successfulTransitions: 0,
    totalItemsPlayed: 0,
  })

  // Media refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const imageTimerRef = useRef<NodeJS.Timeout | null>(null)
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)
  const playlistPollRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const loadStartTimeRef = useRef<number>(0)

  // Load saved connection
  useEffect(() => {
    const savedDeviceId = localStorage.getItem("deviceId")
    const savedDeviceCode = localStorage.getItem("deviceCode")

    if (savedDeviceId && savedDeviceCode) {
      setDeviceId(savedDeviceId)
      setDeviceCode(savedDeviceCode)
      setIsConnected(true)
      setConnectionStatus("connected")
      startHeartbeat(savedDeviceId)
      startPlaylistPolling(savedDeviceId)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current)
      if (playlistPollRef.current) clearInterval(playlistPollRef.current)
      if (imageTimerRef.current) clearTimeout(imageTimerRef.current)
    }
  }, [])

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  const connectDevice = async () => {
    if (!deviceCode.trim()) {
      setError("Please enter a device code")
      return
    }

    setConnectionStatus("connecting")
    setError(null)

    try {
      const response = await fetch("/api/devices/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceCode: deviceCode.trim(),
          deviceType: "web_browser",
          deviceName: `Web Browser - ${navigator.userAgent.split(" ")[0]}`,
          capabilities: ["video", "audio", "image", "web", "pdf"],
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          userAgent: navigator.userAgent,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setDeviceId(data.device.id)
        setIsConnected(true)
        setConnectionStatus("connected")

        // Save to localStorage
        localStorage.setItem("deviceId", data.device.id)
        localStorage.setItem("deviceCode", deviceCode.trim())

        // Start heartbeat and playlist polling
        startHeartbeat(data.device.id)
        startPlaylistPolling(data.device.id)

        console.log("Device connected successfully:", data.device)
      } else {
        throw new Error(data.message || "Failed to connect device")
      }
    } catch (err) {
      console.error("Connection error:", err)
      setError(err instanceof Error ? err.message : "Failed to connect")
      setConnectionStatus("error")
    }
  }

  const startHeartbeat = (deviceId: string) => {
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
            timestamp: new Date().toISOString(),
          }),
        })
      } catch (error) {
        console.error("Heartbeat failed:", error)
      }
    }

    // Send initial heartbeat
    sendHeartbeat()

    // Set up interval
    heartbeatRef.current = setInterval(sendHeartbeat, 15000) // Every 15 seconds for testing
  }

  const startPlaylistPolling = (deviceId: string) => {
    const pollPlaylist = async () => {
      try {
        const response = await fetch(`/api/devices/${deviceId}/playlist`)
        const data = await response.json()

        if (response.ok && data.playlist) {
          const newPlaylist = data.playlist

          // Check if playlist changed
          if (!playlist || playlist.id !== newPlaylist.id) {
            setPlaylist(newPlaylist)
            setCurrentItemIndex(0)
            setProgress(0)

            // Auto-start playback if playlist is assigned and we're not already playing
            if (newPlaylist.items.length > 0) {
              setIsPlaying(true)
            }
          }
        }
      } catch (error) {
        console.error("Playlist polling failed:", error)
      }
    }

    // Poll immediately
    pollPlaylist()

    // Set up interval
    playlistPollRef.current = setInterval(pollPlaylist, 5000) // Every 5 seconds for testing
  }

  const playCurrentItem = useCallback(() => {
    if (!playlist || !playlist.items.length) return

    const currentItem = playlist.items[currentItemIndex]
    if (!currentItem) return

    const media = currentItem.media
    console.log("Playing item:", media.original_name, "Type:", media.mime_type || media.file_type)

    setMediaLoading(true)
    setMediaError(null)
    loadStartTimeRef.current = Date.now()

    // Clear any existing timers
    if (imageTimerRef.current) {
      clearTimeout(imageTimerRef.current)
      imageTimerRef.current = null
    }

    // Reset progress
    setProgress(0)
    setCurrentTime(0)

    if (isVideoFile(media.mime_type || media.file_type)) {
      playVideo(media, currentItem.duration)
    } else if (isAudioFile(media.mime_type || media.file_type)) {
      playAudio(media, currentItem.duration)
    } else if (media.media_source === "google_slides") {
      playSlides(media, currentItem.duration)
    } else if (isPDFFile(media.mime_type || media.file_type)) {
      playPDF(media, currentItem.duration)
    } else {
      playImage(media, currentItem.duration)
    }
  }, [playlist, currentItemIndex, isPlaying, isMuted])

  const playVideo = (media: MediaFile, duration: number) => {
    const video = videoRef.current
    if (video) {
      video.src = media.url
      video.muted = isMuted
      video.load()

      video.onloadedmetadata = () => {
        const loadTime = Date.now() - loadStartTimeRef.current
        setPerformanceMetrics((prev) => ({ ...prev, mediaLoadTime: loadTime }))

        setTotalTime(video.duration)
        setMediaLoading(false)
        if (isPlaying) {
          video.play().catch((err) => {
            console.error("Video play error:", err)
            handleMediaError("Failed to play video: " + err.message)
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

  const playAudio = (media: MediaFile, duration: number) => {
    const audio = audioRef.current
    if (audio) {
      audio.src = media.url
      audio.muted = isMuted
      audio.load()

      audio.onloadedmetadata = () => {
        const loadTime = Date.now() - loadStartTimeRef.current
        setPerformanceMetrics((prev) => ({ ...prev, mediaLoadTime: loadTime }))

        setTotalTime(audio.duration)
        setMediaLoading(false)
        if (isPlaying) {
          audio.play().catch((err) => {
            console.error("Audio play error:", err)
            handleMediaError("Failed to play audio: " + err.message)
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

  const playImage = (media: MediaFile, duration: number) => {
    const itemDuration = duration || 8 // Default 8 seconds
    setTotalTime(itemDuration)

    // Preload image to check for errors
    const img = new Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      const loadTime = Date.now() - loadStartTimeRef.current
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

  const playSlides = (media: MediaFile, duration: number) => {
    const itemDuration = duration || 60 // Default 60 seconds for slides
    setTotalTime(itemDuration)

    // For slides, we'll simulate loading time
    setTimeout(() => {
      const loadTime = Date.now() - loadStartTimeRef.current
      setPerformanceMetrics((prev) => ({ ...prev, mediaLoadTime: loadTime }))
      setMediaLoading(false)

      if (isPlaying) {
        startImageTimer(itemDuration)
      }
    }, 1000)
  }

  const playPDF = (media: MediaFile, duration: number) => {
    const itemDuration = duration || 30 // Default 30 seconds for PDFs
    setTotalTime(itemDuration)

    // For PDFs, we'll simulate loading time
    setTimeout(() => {
      const loadTime = Date.now() - loadStartTimeRef.current
      setPerformanceMetrics((prev) => ({ ...prev, mediaLoadTime: loadTime }))
      setMediaLoading(false)

      if (isPlaying) {
        startImageTimer(itemDuration)
      }
    }, 1500)
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

    // Auto-advance to next item after 3 seconds
    setTimeout(() => {
      nextItem()
    }, 3000)
  }

  const isVideoFile = (fileType: string) => {
    return (
      fileType?.startsWith("video/") ||
      fileType?.includes("mp4") ||
      fileType?.includes("webm") ||
      fileType?.includes("ogg") ||
      fileType?.includes("avi") ||
      fileType?.includes("mov")
    )
  }

  const isAudioFile = (fileType: string) => {
    return (
      fileType?.startsWith("audio/") ||
      fileType?.includes("mp3") ||
      fileType?.includes("wav") ||
      fileType?.includes("ogg") ||
      fileType?.includes("aac")
    )
  }

  const isImageFile = (fileType: string) => {
    return (
      fileType?.startsWith("image/") ||
      fileType?.includes("jpg") ||
      fileType?.includes("jpeg") ||
      fileType?.includes("png") ||
      fileType?.includes("gif") ||
      fileType?.includes("webp") ||
      fileType?.includes("svg")
    )
  }

  const isPDFFile = (fileType: string) => {
    return fileType?.includes("pdf") || fileType === "application/pdf"
  }

  const nextItem = () => {
    if (!playlist || !playlist.items.length) return

    let nextIndex = currentItemIndex + 1

    if (playlist.shuffle) {
      // Random next item (excluding current)
      const availableIndices = playlist.items.map((_, i) => i).filter((i) => i !== currentItemIndex)
      nextIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)]
    } else if (nextIndex >= playlist.items.length) {
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

  const toggleFullscreen = async () => {
    if (!containerRef.current) return

    try {
      if (!isFullscreen) {
        await containerRef.current.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch (error) {
      console.error("Fullscreen error:", error)
    }
  }

  // Play current item when it changes
  useEffect(() => {
    if (isPlaying && playlist) {
      playCurrentItem()
    }
  }, [currentItemIndex, playCurrentItem])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getMediaIcon = (media: MediaFile) => {
    if (isVideoFile(media.mime_type || media.file_type)) return <Video className="h-4 w-4" />
    if (isAudioFile(media.mime_type || media.file_type)) return <Music className="h-4 w-4" />
    if (media.media_source === "google_slides") return <ExternalLink className="h-4 w-4" />
    if (isImageFile(media.mime_type || media.file_type)) return <ImageIcon className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  const getCleanPresentationUrl = (url: string) => {
    if (!url) return url

    if (url.includes("docs.google.com/presentation")) {
      try {
        if (url.includes("/embed")) {
          return url
        }

        if (url.includes("/d/")) {
          const presentationId = url.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1]
          if (presentationId) {
            return `https://docs.google.com/presentation/d/${presentationId}/embed?start=false&loop=false&delayms=3000&rm=minimal`
          }
        }

        const urlObj = new URL(url)
        urlObj.searchParams.set("rm", "minimal")
        urlObj.searchParams.set("embedded", "true")
        return urlObj.toString()
      } catch (error) {
        console.error("Error processing Google Slides URL:", error)
        return url
      }
    }

    return url
  }

  const renderCurrentMedia = () => {
    if (!playlist || !playlist.items.length) {
      return (
        <div className="flex-1 flex items-center justify-center bg-black text-white">
          <div className="text-center">
            <Monitor className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h2 className="text-2xl font-semibold mb-2">No Content Assigned</h2>
            <p className="text-gray-400">Waiting for playlist assignment...</p>
            <div className="mt-4 text-sm text-gray-500">
              <p>Device ID: {deviceId}</p>
              <p>Status: Connected and ready</p>
            </div>
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
            <div className="mt-2 text-sm text-gray-500">Load time: {Date.now() - loadStartTimeRef.current}ms</div>
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
            <p className="text-sm text-gray-500 mb-4">{media.original_name}</p>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => playCurrentItem()}
                className="text-white border-white hover:bg-white hover:text-black"
              >
                Retry
              </Button>
              <div className="text-xs text-gray-600">Auto-advancing in 3 seconds...</div>
            </div>
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
              <Music className="h-16 w-16" />
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
          <iframe
            src={getCleanPresentationUrl(media.external_url)}
            className="w-full h-full border-0"
            allow="fullscreen"
            onLoad={() => setMediaLoading(false)}
            onError={() => {
              handleMediaError("Failed to load Google Slides")
            }}
          />
        </div>
      )
    }

    if (isPDFFile(media.mime_type || media.file_type)) {
      return (
        <div className="flex-1" style={{ backgroundColor }}>
          <iframe
            src={media.url}
            className="w-full h-full border-0"
            title={media.original_name}
            onLoad={() => setMediaLoading(false)}
            onError={() => {
              handleMediaError("Failed to load PDF")
            }}
          />
        </div>
      )
    }

    // Default to image display
    const scaleClass =
      playlist.scale_image === "fill"
        ? "object-cover"
        : playlist.scale_image === "fit"
          ? "object-contain"
          : "object-scale-down"

    return (
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor }}>
        <img
          src={media.url || "/placeholder.svg"}
          alt={media.original_name}
          className={`max-w-full max-h-full ${scaleClass}`}
          onLoad={() => setMediaLoading(false)}
          onError={(e) => {
            console.error("Image load error:", e)
            handleMediaError("Failed to load image")
          }}
        />
        {playlist.text_overlay && (
          <div className="absolute bottom-4 left-4 bg-black/70 text-white p-3 rounded-lg backdrop-blur-sm">
            <h4 className="font-medium">{media.original_name}</h4>
            <p className="text-sm text-gray-300">{formatTime(totalTime - currentTime)} remaining</p>
          </div>
        )}
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 space-y-6">
            <div className="text-center">
              <Monitor className="h-12 w-12 mx-auto mb-4 text-blue-500" />
              <h1 className="text-2xl font-bold mb-2">Device Player</h1>
              <p className="text-gray-600">Connect this device to your digital signage platform</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Device Pairing Code</label>
                <Input
                  type="text"
                  placeholder="Enter pairing code..."
                  value={deviceCode}
                  onChange={(e) => setDeviceCode(e.target.value.toUpperCase())}
                  disabled={connectionStatus === "connecting"}
                  className="text-center text-lg font-mono"
                />
              </div>

              {error && (
                <Alert>
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button onClick={connectDevice} disabled={connectionStatus === "connecting"} className="w-full">
                {connectionStatus === "connecting" ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wifi className="h-4 w-4 mr-2" />
                    Connect Device
                  </>
                )}
              </Button>
            </div>

            <div className="text-center text-sm text-gray-500 space-y-2">
              <p>Get your pairing code from the dashboard:</p>
              <p className="font-mono bg-gray-100 px-2 py-1 rounded">Dashboard → Screens → Add Screen</p>
              <p>
                Or use the test page: <code>/test-device-player</code>
              </p>
            </div>

            <div className="text-xs text-gray-400 space-y-1">
              <p className="font-semibold">Supported Media Types:</p>
              <div className="grid grid-cols-2 gap-1">
                <span>• Images (JPG, PNG, GIF)</span>
                <span>• Videos (MP4, WebM)</span>
                <span>• Audio (MP3, WAV)</span>
                <span>• Google Slides</span>
                <span>• PDF Documents</span>
                <span>• Mixed Playlists</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-black flex flex-col">
      {/* Status Bar */}
      <div className="bg-gray-900 text-white px-4 py-2 flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {connectionStatus === "connected" ? (
              <Wifi className="h-4 w-4 text-green-400" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-400" />
            )}
            <span>Device ID: {deviceId}</span>
          </div>

          {playlist && (
            <div className="flex items-center space-x-2">
              <Play className="h-4 w-4" />
              <span>{playlist.name}</span>
              <Badge variant="secondary" className="text-xs">
                {currentItemIndex + 1} / {playlist.items.length}
              </Badge>
              {playlist.loop_enabled && (
                <Badge variant="outline" className="text-xs border-green-500 text-green-400">
                  Loop
                </Badge>
              )}
              {playlist.shuffle && (
                <Badge variant="outline" className="text-xs border-blue-500 text-blue-400">
                  Shuffle
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>
              {formatTime(currentTime)} / {formatTime(totalTime)}
            </span>
          </div>

          {/* Performance Metrics */}
          <div className="flex items-center space-x-2 text-xs">
            <Badge variant="outline" className="text-green-400 border-green-500">
              <CheckCircle className="h-3 w-3 mr-1" />
              {performanceMetrics.successfulTransitions}
            </Badge>
            <Badge variant="outline" className="text-red-400 border-red-500">
              <XCircle className="h-3 w-3 mr-1" />
              {performanceMetrics.playbackErrors}
            </Badge>
          </div>

          <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="text-white hover:bg-gray-800">
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      {renderCurrentMedia()}

      {/* Control Bar */}
      <div className="bg-gray-900 text-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {playlist && playlist.items[currentItemIndex] && (
              <div className="flex items-center space-x-2">
                {getMediaIcon(playlist.items[currentItemIndex].media)}
                <span className="text-sm truncate max-w-48">
                  {playlist.items[currentItemIndex].media.original_name}
                </span>
                <Badge variant="outline" className="text-xs">
                  {playlist.items[currentItemIndex].duration}s
                </Badge>
                {mediaLoading && <Loader2 className="h-3 w-3 animate-spin" />}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={previousItem}
              disabled={!playlist || playlist.items.length <= 1}
              className="text-white hover:bg-gray-800"
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlayPause}
              disabled={!playlist || playlist.items.length === 0}
              className="text-white hover:bg-gray-800"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={nextItem}
              disabled={!playlist || playlist.items.length <= 1}
              className="text-white hover:bg-gray-800"
            >
              <SkipForward className="h-4 w-4" />
            </Button>

            <Button variant="ghost" size="sm" onClick={toggleMute} className="text-white hover:bg-gray-800">
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          </div>

          <div className="w-48">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs mt-1 text-gray-400">
              <span>Load: {performanceMetrics.mediaLoadTime}ms</span>
              <span>Items: {performanceMetrics.totalItemsPlayed}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
