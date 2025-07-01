"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Monitor, Wifi, WifiOff, Play, Pause, SkipForward } from "lucide-react"

interface DeviceInfo {
  name: string
  type: string
  platform: string
  userAgent: string
  screenResolution: string
  capabilities: string[]
}

interface PlaylistItem {
  id: string
  type: "image" | "video" | "web" | "slides"
  url: string
  duration: number
  name: string
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
  const [error, setError] = useState("")
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null)
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackStatus, setPlaybackStatus] = useState("idle")

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
  }, [generateDeviceInfo])

  // Connect to pairing code
  const connectDevice = async () => {
    if (!pairingCode.trim() || !deviceInfo) {
      setError("Please enter a pairing code")
      return
    }

    setIsConnecting(true)
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
        setIsConnected(true)
        setError("")

        // Start checking for playlist assignments
        startPlaylistPolling()
      } else {
        setError(result.error || "Failed to connect device")
      }
    } catch (err) {
      console.error("Connection error:", err)
      setError("Failed to connect to server")
    } finally {
      setIsConnecting(false)
    }
  }

  // Poll for playlist assignments
  const startPlaylistPolling = useCallback(() => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/devices/${pairingCode}/playlist`)
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
    }, 5000) // Check every 5 seconds

    return () => clearInterval(pollInterval)
  }, [pairingCode, isPlaying])

  // Handle media playback
  const playCurrentItem = () => {
    if (!currentPlaylist || currentPlaylist.items.length === 0) return

    const currentItem = currentPlaylist.items[currentItemIndex]
    setPlaybackStatus(`playing: ${currentItem.name}`)

    // Auto-advance after duration
    setTimeout(() => {
      nextItem()
    }, currentItem.duration * 1000)
  }

  const nextItem = () => {
    if (!currentPlaylist) return

    const nextIndex = (currentItemIndex + 1) % currentPlaylist.items.length
    setCurrentItemIndex(nextIndex)
  }

  const togglePlayback = () => {
    setIsPlaying(!isPlaying)
    setPlaybackStatus(isPlaying ? "paused" : "playing")
  }

  // Start playback when playlist changes
  useEffect(() => {
    if (currentPlaylist && isPlaying) {
      playCurrentItem()
    }
  }, [currentPlaylist, currentItemIndex, isPlaying])

  // Render current media
  const renderCurrentMedia = () => {
    if (!currentPlaylist || !isPlaying) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
          <div className="text-center">
            <Monitor className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Waiting for content...</p>
          </div>
        </div>
      )
    }

    const currentItem = currentPlaylist.items[currentItemIndex]

    switch (currentItem.type) {
      case "image":
        return (
          <div className="relative h-64 bg-black rounded-lg overflow-hidden">
            <img
              src={currentItem.url || "/placeholder.svg"}
              alt={currentItem.name}
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg?height=300&width=400&text=Image+Error"
              }}
            />
          </div>
        )

      case "video":
        return (
          <div className="relative h-64 bg-black rounded-lg overflow-hidden">
            <video
              src={currentItem.url}
              className="w-full h-full object-contain"
              autoPlay
              muted
              controls={false}
              onError={() => console.error("Video playback error")}
            />
          </div>
        )

      case "web":
        return (
          <div className="relative h-64 bg-white rounded-lg overflow-hidden border">
            <iframe
              src={currentItem.url}
              className="w-full h-full"
              title={currentItem.name}
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        )

      case "slides":
        return (
          <div className="relative h-64 bg-white rounded-lg overflow-hidden border">
            <iframe
              src={currentItem.url}
              className="w-full h-full"
              title={currentItem.name}
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        )

      default:
        return (
          <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
            <p className="text-gray-600">Unsupported media type: {currentItem.type}</p>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-6 w-6" />
              Digital Signage Player
              {isConnected ? (
                <Badge variant="default" className="ml-auto">
                  <Wifi className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="secondary" className="ml-auto">
                  <WifiOff className="h-3 w-3 mr-1" />
                  Disconnected
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!isConnected ? (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter pairing code (e.g., ABC123)"
                    value={pairingCode}
                    onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
                    className="flex-1"
                    maxLength={6}
                  />
                  <Button onClick={connectDevice} disabled={isConnecting}>
                    {isConnecting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      "Connect"
                    )}
                  </Button>
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Device:</strong> {deviceInfo?.name}
                  </div>
                  <div>
                    <strong>Type:</strong> {deviceInfo?.type}
                  </div>
                  <div>
                    <strong>Platform:</strong> {deviceInfo?.platform}
                  </div>
                  <div>
                    <strong>Resolution:</strong> {deviceInfo?.screenResolution}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={togglePlayback} variant="outline" size="sm">
                    {isPlaying ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Play
                      </>
                    )}
                  </Button>
                  <Button onClick={nextItem} variant="outline" size="sm" disabled={!currentPlaylist}>
                    <SkipForward className="h-4 w-4 mr-2" />
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Media Display */}
        <Card>
          <CardHeader>
            <CardTitle>
              Display
              {currentPlaylist && (
                <Badge variant="outline" className="ml-2">
                  {currentPlaylist.name}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>{renderCurrentMedia()}</CardContent>
        </Card>

        {/* Playlist Info */}
        {currentPlaylist && (
          <Card>
            <CardHeader>
              <CardTitle>Current Playlist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{currentPlaylist.name}</span>
                  <Badge>{currentPlaylist.items.length} items</Badge>
                </div>
                <div className="text-sm text-gray-600">
                  Status: {playbackStatus} | Item {currentItemIndex + 1} of {currentPlaylist.items.length}
                </div>
                {currentPlaylist.items.length > 0 && (
                  <div className="text-sm">
                    <strong>Current:</strong> {currentPlaylist.items[currentItemIndex]?.name}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Device Capabilities */}
        {deviceInfo && (
          <Card>
            <CardHeader>
              <CardTitle>Device Capabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {deviceInfo.capabilities.map((capability) => (
                  <Badge key={capability} variant="secondary">
                    {capability}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
