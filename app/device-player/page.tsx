"use client"

import { useState, useEffect, useCallback, useRef } from "react"

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
        <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg\
