"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Loader2,
  Monitor,
  WifiOff,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Eye,
  Maximize,
  Volume2,
  ExternalLink,
  FileText,
} from "lucide-react"

interface DeviceInfo {
  name: string
  type: string
  platform: string
  userAgent: string
  screenResolution: string
  capabilities: string[]
}

interface MediaFile {
  id: number
  filename: string
  original_name?: string
  original_filename?: string
  file_type: string
  file_size: number
  url: string
  thumbnail_url?: string
  mime_type?: string
  dimensions?: string
  duration?: number
  media_source?: string
  external_url?: string
  embed_settings?: string | object
  created_at: string
}

interface PlaylistItem {
  id: string
  type: "image" | "video" | "web" | "slides"
  url: string
  duration: number
  name: string
  media?: MediaFile
  media_file?: MediaFile
}

interface Playlist {
  id: string
  name: string
  items: PlaylistItem[]
  settings: {
    loop: boolean
    shuffle: boolean
    transitionDuration: number
  }
}

export default function DevicePlayerPage() {
  const [pairingCode, setPairingCode] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null)
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected" | "reconnecting"
  >("disconnected")

  // Playlist and playback state
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null)
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackStatus, setPlaybackStatus] = useState("idle")
  const [lastHeartbeat, setLastHeartbeat] = useState<Date | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Media state
  const [iframeError, setIframeError] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Reconnection state
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const [maxReconnectAttempts] = useState(5)
  const [reconnectDelay, setReconnectDelay] = useState(5000) // Start with 5 seconds

  // Refs for intervals
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null)
  const playlistPollInterval = useRef<NodeJS.Timeout | null>(null)
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null)
  const itemTimer = useRef<NodeJS.Timeout | null>(null)

  // Generate device info
  const generateDeviceInfo = useCallback((): DeviceInfo => {
    const deviceId = Math.random().toString(36).substring(2, 15)

    // Safe access to browser APIs
    const getScreenResolution = () => {
      if (typeof window !== "undefined" && window.screen) {
        return `${window.screen.width}x${window.screen.height}`
      }
      return "1920x1080"
    }

    const getPlatform = () => {
      if (typeof navigator !== "undefined" && navigator.platform) {
        return navigator.platform
      }
      return "Web"
    }

    const getUserAgent = () => {
      if (typeof navigator !== "undefined" && navigator.userAgent) {
        return navigator.userAgent
      }
      return "Unknown Browser"
    }

    return {
      name: `Device Player ${deviceId}`,
      type: "web_browser",
      platform: getPlatform(),
      userAgent: getUserAgent(),
      screenResolution: getScreenResolution(),
      capabilities: ["video", "image", "audio", "web", "slides", "pdf", "office", "text"],
    }
  }, [])

  // Initialize device info
  useEffect(() => {
    setDeviceInfo(generateDeviceInfo())

    // Check for saved connection
    const savedPairingCode = localStorage.getItem("devicePairingCode")
    const savedDeviceId = localStorage.getItem("deviceId")

    if (savedPairingCode && savedDeviceId) {
      setPairingCode(savedPairingCode)
      setDeviceId(savedDeviceId)
      setIsConnected(true)
      setConnectionStatus("connected")
      startHeartbeat()
      startPlaylistPolling()
    }
  }, [generateDeviceInfo])

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (heartbeatInterval.current) clearInterval(heartbeatInterval.current)
      if (playlistPollInterval.current) clearInterval(playlistPollInterval.current)
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current)
      if (itemTimer.current) clearTimeout(itemTimer.current)
    }
  }, [])

  // Connect to pairing code
  const connectDevice = async () => {
    if (!pairingCode.trim() || !deviceInfo) {
      setError("Please enter a pairing code")
      return
    }

    setIsConnecting(true)
    setConnectionStatus("connecting")
    setError("")

    try {
      console.log("[DEVICE PLAYER] Connecting with:", {
        deviceCode: pairingCode.toUpperCase(),
        ...deviceInfo,
      })

      const response = await fetch("/api/devices/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceCode: pairingCode.toUpperCase(),
          name: deviceInfo.name,
          deviceType: deviceInfo.type,
          platform: deviceInfo.platform,
          userAgent: deviceInfo.userAgent,
          screenResolution: deviceInfo.screenResolution,
          capabilities: deviceInfo.capabilities,
        }),
      })

      const result = await response.json()
      console.log("[DEVICE PLAYER] Registration response:", result)

      if (result.success) {
        setDeviceId(result.device.id)
        setIsConnected(true)
        setConnectionStatus("connected")
        setError("")
        setReconnectAttempts(0)
        setReconnectDelay(5000)

        // Save connection info
        localStorage.setItem("devicePairingCode", pairingCode.toUpperCase())
        localStorage.setItem("deviceId", result.device.id)

        // Start monitoring
        startHeartbeat()
        startPlaylistPolling()
      } else {
        setError(result.error || "Failed to connect device")
        setConnectionStatus("disconnected")
      }
    } catch (err) {
      console.error("Connection error:", err)
      setError("Failed to connect to server")
      setConnectionStatus("disconnected")
    } finally {
      setIsConnecting(false)
    }
  }

  // Disconnect device
  const disconnectDevice = () => {
    // Clear intervals
    if (heartbeatInterval.current) clearInterval(heartbeatInterval.current)
    if (playlistPollInterval.current) clearInterval(playlistPollInterval.current)
    if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current)
    if (itemTimer.current) clearTimeout(itemTimer.current)

    // Clear state
    setIsConnected(false)
    setConnectionStatus("disconnected")
    setDeviceId(null)
    setCurrentPlaylist(null)
    setIsPlaying(false)
    setReconnectAttempts(0)
    setShowPreview(false)

    // Clear saved connection
    localStorage.removeItem("devicePairingCode")
    localStorage.removeItem("deviceId")
  }

  // Attempt to reconnect
  const attemptReconnect = useCallback(async () => {
    if (reconnectAttempts >= maxReconnectAttempts) {
      setError("Maximum reconnection attempts reached. Please reconnect manually.")
      setConnectionStatus("disconnected")
      return
    }

    setConnectionStatus("reconnecting")
    setReconnectAttempts((prev) => prev + 1)

    try {
      // Try to re-register with the same pairing code
      await connectDevice()
    } catch (error) {
      console.error("Reconnection failed:", error)

      // Exponential backoff
      const delay = Math.min(reconnectDelay * Math.pow(2, reconnectAttempts), 60000) // Max 1 minute
      setReconnectDelay(delay)

      reconnectTimeout.current = setTimeout(() => {
        attemptReconnect()
      }, delay)
    }
  }, [reconnectAttempts, maxReconnectAttempts, reconnectDelay])

  // Start heartbeat monitoring
  const startHeartbeat = useCallback(() => {
    if (heartbeatInterval.current) clearInterval(heartbeatInterval.current)

    const sendHeartbeat = async () => {
      if (!deviceId) return

      try {
        const response = await fetch(`/api/devices/${deviceId}/heartbeat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: isPlaying ? "playing" : "idle",
            currentItemId: currentPlaylist?.items[currentItemIndex]?.id || null,
            performanceMetrics: {
              timestamp: Date.now(),
              playbackStatus,
              reconnectAttempts,
            },
          }),
        })

        if (response.ok) {
          setLastHeartbeat(new Date())
          setConnectionStatus("connected")
        } else {
          throw new Error("Heartbeat failed")
        }
      } catch (error) {
        console.error("Heartbeat error:", error)
        if (isConnected) {
          attemptReconnect()
        }
      }
    }

    // Send initial heartbeat
    sendHeartbeat()

    // Set up interval (every 30 seconds)
    heartbeatInterval.current = setInterval(sendHeartbeat, 30000)
  }, [
    deviceId,
    isPlaying,
    currentPlaylist,
    currentItemIndex,
    playbackStatus,
    reconnectAttempts,
    isConnected,
    attemptReconnect,
  ])

  // Start playlist polling
  const startPlaylistPolling = useCallback(() => {
    if (playlistPollInterval.current) clearInterval(playlistPollInterval.current)

    const pollPlaylist = async () => {
      if (!deviceId) return

      try {
        const response = await fetch(`/api/devices/${deviceId}/playlist`)
        if (response.ok) {
          const data = await response.json()
          if (data.playlist) {
            setCurrentPlaylist(data.playlist)
            if (data.playlist.items.length > 0 && !isPlaying) {
              setIsPlaying(true)
              setPlaybackStatus("playing")
            }
          }
        }
      } catch (error) {
        console.error("Failed to check for playlist:", error)
      }
    }

    // Poll immediately
    pollPlaylist()

    // Set up interval (every 10 seconds)
    playlistPollInterval.current = setInterval(pollPlaylist, 10000)
  }, [deviceId, isPlaying])

  // Handle media playback
  const playCurrentItem = useCallback(() => {
    if (!currentPlaylist || currentPlaylist.items.length === 0) return

    const currentItem = currentPlaylist.items[currentItemIndex]
    setPlaybackStatus(`playing: ${currentItem.name}`)

    // Clear existing timer
    if (itemTimer.current) clearTimeout(itemTimer.current)

    // Auto-advance after duration
    itemTimer.current = setTimeout(() => {
      nextItem()
    }, currentItem.duration * 1000)
  }, [currentPlaylist, currentItemIndex])

  const nextItem = useCallback(() => {
    if (!currentPlaylist) return

    const nextIndex = (currentItemIndex + 1) % currentPlaylist.items.length
    setCurrentItemIndex(nextIndex)
  }, [currentPlaylist, currentItemIndex])

  const previousItem = useCallback(() => {
    if (!currentPlaylist) return

    const prevIndex = currentItemIndex === 0 ? currentPlaylist.items.length - 1 : currentItemIndex - 1
    setCurrentItemIndex(prevIndex)
  }, [currentPlaylist, currentItemIndex])

  const togglePlayback = () => {
    setIsPlaying(!isPlaying)
    setPlaybackStatus(isPlaying ? "paused" : "playing")

    if (itemTimer.current) {
      clearTimeout(itemTimer.current)
    }
  }

  const togglePreview = () => {
    setShowPreview(!showPreview)
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  // Start playback when playlist changes
  useEffect(() => {
    if (currentPlaylist && isPlaying) {
      playCurrentItem()
    }
  }, [currentPlaylist, currentItemIndex, isPlaying, playCurrentItem])

  // Media file helpers
  const getCurrentMediaFile = () => {
    if (!currentPlaylist || !currentPlaylist.items[currentItemIndex]) return null
    const currentItem = currentPlaylist.items[currentItemIndex]
    return currentItem.media || currentItem.media_file || null
  }

  const isSlidesFile = (file: MediaFile | null) => {
    if (!file) return false
    return file.media_source === "google_slides" || file.file_type === "presentation" || file.mime_type === "text/html"
  }

  const isVideoFile = (file: MediaFile | null) => {
    if (!file) return false
    return file.file_type?.startsWith("video/") || file.mime_type?.startsWith("video/")
  }

  const isImageFile = (file: MediaFile | null) => {
    if (!file) return false
    return file.file_type?.startsWith("image/") || file.mime_type?.startsWith("image/")
  }

  const isAudioFile = (file: MediaFile | null) => {
    if (!file) return false
    return file.file_type?.startsWith("audio/") || file.mime_type?.startsWith("audio/")
  }

  const isPDFFile = (file: MediaFile | null) => {
    if (!file) return false
    return file.file_type?.includes("pdf") || file.mime_type?.includes("pdf")
  }

  const getEmbedUrl = (url: string) => {
    if (!url) return url

    try {
      // Handle different Google Slides URL formats
      if (url.includes("/presentation/d/")) {
        // Extract the presentation ID
        const match = url.match(/\/presentation\/d\/([a-zA-Z0-9-_]+)/)
        if (match) {
          const presentationId = match[1]
          // Return embed URL with autoplay
          return `https://docs.google.com/presentation/d/${presentationId}/embed?start=true&loop=true&delayms=5000`
        }
      }

      // If it's already an embed URL, return as is
      if (url.includes("/embed")) {
        return url
      }

      // Fallback: try to convert any Google Slides URL
      return url.replace("/edit", "/embed?start=true&loop=true&delayms=5000")
    } catch (error) {
      console.error("Error converting URL to embed format:", error)
      return url
    }
  }

  // Render current media
  const renderCurrentMedia = () => {
    if (!currentPlaylist || !isPlaying) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
          <div className="text-center text-gray-500">
            <Monitor className="h-12 w-12 mx-auto mb-2" />
            <p>No content playing</p>
          </div>
        </div>
      )
    }

    if (currentPlaylist.items.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
          <div className="text-center text-gray-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-2" />
            <p>Playlist has no items</p>
          </div>
        </div>
      )
    }

    const mediaFile = getCurrentMediaFile()
    if (!mediaFile) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
          <div className="text-center text-gray-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-2" />
            <p>Media file not found</p>
          </div>
        </div>
      )
    }

    if (isSlidesFile(mediaFile)) {
      return (
        <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
          {!iframeError ? (
            <iframe
              src={getEmbedUrl(mediaFile.external_url || mediaFile.url)}
              className="w-full h-full border-0"
              frameBorder="0"
              allowFullScreen
              title={mediaFile.original_name || mediaFile.filename}
              onError={() => setIframeError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-blue-50 border border-blue-200 text-gray-600">
              <FileText className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Google Slides Presentation</h3>
              <p className="text-gray-600 mb-4">Unable to embed presentation</p>
              <Button
                onClick={() => {
                  window.open(mediaFile.external_url || mediaFile.url, "_blank")
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in Google Slides
              </Button>
            </div>
          )}
        </div>
      )
    } else if (isImageFile(mediaFile)) {
      return (
        <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
          {!imageError ? (
            <img
              src={mediaFile.url || "/placeholder.svg"}
              alt={mediaFile.original_name || mediaFile.filename}
              className="w-full h-full object-contain"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-red-50 border border-red-200">
              <div className="text-center text-gray-600">
                <FileText className="h-16 w-16 mx-auto mb-4 text-red-400" />
                <h3 className="text-lg font-medium text-red-900 mb-2">Image Load Error</h3>
                <p className="text-red-700 mb-4">Unable to load image</p>
                <p className="text-sm mt-2">{mediaFile.original_name || mediaFile.filename}</p>
              </div>
            </div>
          )}
        </div>
      )
    } else if (isVideoFile(mediaFile)) {
      return (
        <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
          {!videoError ? (
            <video
              src={mediaFile.url}
              className="w-full h-full object-contain"
              controls
              autoPlay
              onEnded={nextItem}
              onError={() => setVideoError(true)}
            >
              Your browser does not support video playback.
            </video>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-red-50 border border-red-200">
              <div className="text-center text-gray-600">
                <FileText className="h-16 w-16 mx-auto mb-4 text-red-400" />
                <h3 className="text-lg font-medium text-red-900 mb-2">Video Load Error</h3>
                <p className="text-red-700 mb-4">Unable to load video</p>
                <p className="text-sm mt-2">{mediaFile.original_name || mediaFile.filename}</p>
              </div>
            </div>
          )}
        </div>
      )
    } else if (isAudioFile(mediaFile)) {
      return (
        <div className="w-full aspect-video bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
          <div className="text-center text-white">
            <Volume2 className="h-16 w-16 mx-auto mb-4" />
            <h3 className="text-lg font-medium">{mediaFile.original_name || mediaFile.filename}</h3>
            <audio src={mediaFile.url} controls autoPlay className="mt-4" onEnded={nextItem} />
          </div>
        </div>
      )
    } else if (isPDFFile(mediaFile)) {
      return (
        <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
          <iframe
            src={`${mediaFile.url}#toolbar=0&navpanes=0&scrollbar=0`}
            className="w-full h-full border-0"
            title={mediaFile.original_name || mediaFile.filename}
          />
        </div>
      )
    } else {
      return (
        <div className="w-full aspect-video bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
          <div className="text-center text-gray-600">
            <FileText className="h-16 w-16 mx-auto mb-4" />
            <h3 className="text-lg font-medium">{mediaFile.original_name || mediaFile.filename}</h3>
            <p className="text-sm mt-2">Unsupported file type</p>
          </div>
        </div>
      )
    }
  }

  // Render preview mode
  const renderPreviewMode = () => {
    if (!showPreview) return null

    return (
      <div className={`fixed inset-0 z-50 bg-black ${isFullscreen ? "" : "p-4"}`}>
        <div className="absolute top-4 right-4 z-10 flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="bg-black/50 text-white border-white/20"
          >
            <Maximize className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={togglePreview}
            className="bg-black/50 text-white border-white/20"
          >
            Close
          </Button>
        </div>

        <div className="h-full flex flex-col">
          {/* Media Container */}
          <div className="flex-1 flex items-center justify-center">{renderCurrentMedia()}</div>

          {/* Controls */}
          {!isFullscreen && (
            <div className="mt-4 bg-black/80 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={previousItem}>
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={togglePlayback}>
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={nextItem}>
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>

                <div className="text-white text-sm">
                  {currentPlaylist && (
                    <span>
                      {currentItemIndex + 1} / {currentPlaylist.items.length}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 flex items-center">
        <Monitor className="mr-2 h-8 w-8" />
        Device Player
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Connection Card */}
        <Card>
          <CardHeader>
            <CardTitle>Device Connection</CardTitle>
          </CardHeader>
          <CardContent>
            {!isConnected ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="pairingCode" className="text-sm font-medium">
                    Enter Pairing Code
                  </label>
                  <Input
                    id="pairingCode"
                    placeholder="Enter 6-digit code"
                    value={pairingCode}
                    onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="text-center text-lg font-mono tracking-widest"
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

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
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {connectionStatus === "connected" ? (
                      <Badge className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    ) : connectionStatus === "reconnecting" ? (
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        Reconnecting...
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <WifiOff className="h-3 w-3 mr-1" />
                        Disconnected
                      </Badge>
                    )}
                  </div>

                  <div className="text-sm text-gray-500">
                    {lastHeartbeat && `Last heartbeat: ${lastHeartbeat.toLocaleTimeString()}`}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Device ID:</span>
                    <span className="font-mono">{deviceId}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Pairing Code:</span>
                    <span className="font-mono">{pairingCode}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Status:</span>
                    <span>{playbackStatus}</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" onClick={disconnectDevice} className="flex-1 bg-transparent">
                    Disconnect
                  </Button>
                  <Button onClick={togglePreview} className="flex-1">
                    <Eye className="h-4 w-4 mr-2" />
                    {showPreview ? "Exit Preview" : "Preview Mode"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Device Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Device Information</CardTitle>
          </CardHeader>
          <CardContent>
            {deviceInfo && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Name:</span>
                    <span>{deviceInfo.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Type:</span>
                    <span>{deviceInfo.type.replace("_", " ")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Platform:</span>
                    <span>{deviceInfo.platform}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Resolution:</span>
                    <span>{deviceInfo.screenResolution}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Capabilities</h4>
                  <div className="flex flex-wrap gap-2">
                    {deviceInfo.capabilities.map((cap) => (
                      <Badge key={cap} variant="outline" className="capitalize">
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

      {/* Playlist Preview */}
      {isConnected && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Current Playlist</CardTitle>
          </CardHeader>
          <CardContent>
            {!currentPlaylist ? (
              <div className="text-center py-8">
                <div className="text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-2" />
                  <p>No playlist assigned to this device</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">{currentPlaylist.name}</h3>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      {currentPlaylist.items.length} {currentPlaylist.items.length === 1 ? "item" : "items"}
                    </Badge>
                    {currentPlaylist.settings?.loop && <Badge variant="outline">Loop</Badge>}
                    {currentPlaylist.settings?.shuffle && <Badge variant="outline">Shuffle</Badge>}
                  </div>
                </div>

                {/* Media Preview */}
                <div className="border rounded-lg overflow-hidden">{renderCurrentMedia()}</div>

                {/* Playback Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={previousItem}>
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={togglePlayback}>
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button variant="outline" size="sm" onClick={nextItem}>
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="text-sm text-gray-500">
                    {currentPlaylist.items.length > 0 && (
                      <span>
                        {currentItemIndex + 1} of {currentPlaylist.items.length}
                      </span>
                    )}
                  </div>
                </div>

                {/* Item List */}
                {currentPlaylist.items.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Playlist Items</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {currentPlaylist.items.map((item, index) => (
                        <div
                          key={item.id}
                          className={`flex items-center p-2 rounded-md ${
                            index === currentItemIndex ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"
                          }`}
                          onClick={() => setCurrentItemIndex(index)}
                        >
                          <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center mr-3 flex-shrink-0">
                            {index === currentItemIndex && isPlaying ? (
                              <Play className="h-4 w-4 text-blue-600" />
                            ) : (
                              <span className="text-xs text-gray-500">{index + 1}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.name}</p>
                            <p className="text-xs text-gray-500">
                              {item.type} • {item.duration}s
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Preview Mode */}
      {renderPreviewMode()}
    </div>
  )
}
