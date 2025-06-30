"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Play, Pause, SkipForward, SkipBack, Volume2, Wifi, WifiOff } from "lucide-react"

interface MediaItem {
  id: number
  name: string
  type: string
  url: string
  duration: number
  thumbnail?: string
}

interface PlaylistItem {
  id: number
  media: MediaItem
  duration: number
  order: number
}

interface Playlist {
  id: number
  name: string
  items: PlaylistItem[]
  loop: boolean
  shuffle: boolean
}

export default function DevicePlayerPage() {
  const [deviceCode, setDeviceCode] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [deviceInfo, setDeviceInfo] = useState<any>(null)
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null)
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState(100)
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected")
  const [error, setError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null)
  const playlistInterval = useRef<NodeJS.Timeout | null>(null)

  // Get device information
  const getDeviceInfo = () => {
    return {
      name: `Device Player ${Math.random().toString(36).substr(2, 9)}`,
      type: "web_browser",
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      capabilities: ["video", "image", "audio", "web"],
      deviceType: "web_browser",
    }
  }

  // Connect device with pairing code
  const connectDevice = async () => {
    if (!deviceCode.trim()) {
      setError("Please enter a device code")
      return
    }

    setConnectionStatus("connecting")
    setError(null)

    try {
      const deviceInfo = getDeviceInfo()

      console.log("[DEVICE PLAYER] Connecting with:", {
        deviceCode,
        ...deviceInfo,
      })

      const response = await fetch("/api/devices/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceCode: deviceCode.trim(),
          deviceName: deviceInfo.name,
          deviceType: deviceInfo.type,
          capabilities: deviceInfo.capabilities,
          screenResolution: deviceInfo.screenResolution,
          userAgent: deviceInfo.userAgent,
          deviceInfo: deviceInfo,
        }),
      })

      const data = await response.json()
      console.log("[DEVICE PLAYER] Registration response:", data)

      if (data.success) {
        setIsConnected(true)
        setDeviceInfo(data.device)
        setConnectionStatus("connected")
        setError(null)

        // Start heartbeat and playlist polling
        startHeartbeat(data.device.id)
        startPlaylistPolling(data.device.id)

        console.log("[DEVICE PLAYER] Connected successfully:", data.device)
      } else {
        setError(data.error || "Failed to connect device")
        setConnectionStatus("disconnected")
      }
    } catch (error) {
      console.error("Connection error:", error)
      setError("Failed to connect device")
      setConnectionStatus("disconnected")
    }
  }

  // Start heartbeat to keep connection alive
  const startHeartbeat = (deviceId: number) => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current)
    }

    const sendHeartbeat = async () => {
      try {
        const status = {
          status: "online",
          currentItemId: currentPlaylist?.items[currentItemIndex]?.id || null,
          progress: progress,
          isPlaying: isPlaying,
          volume: volume,
          timestamp: new Date().toISOString(),
        }

        await fetch(`/api/devices/${deviceId}/heartbeat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(status),
        })
      } catch (error) {
        console.error("Heartbeat error:", error)
      }
    }

    // Send initial heartbeat
    sendHeartbeat()

    // Send heartbeat every 30 seconds
    heartbeatInterval.current = setInterval(sendHeartbeat, 30000)
  }

  // Start polling for playlist updates
  const startPlaylistPolling = (deviceId: number) => {
    if (playlistInterval.current) {
      clearInterval(playlistInterval.current)
    }

    const fetchPlaylist = async () => {
      try {
        const response = await fetch(`/api/devices/${deviceId}/playlist`)
        if (response.ok) {
          const data = await response.json()
          if (data.playlist) {
            setCurrentPlaylist(data.playlist)
            console.log("[DEVICE PLAYER] Updated playlist:", data.playlist)
          }
        }
      } catch (error) {
        console.error("Playlist fetch error:", error)
      }
    }

    // Fetch playlist every 60 seconds
    playlistInterval.current = setInterval(fetchPlaylist, 60000)

    // Fetch initial playlist
    fetchPlaylist()
  }

  // Play current media item
  const playCurrentItem = () => {
    if (!currentPlaylist || currentPlaylist.items.length === 0) return

    const currentItem = currentPlaylist.items[currentItemIndex]
    if (!currentItem) return

    const media = currentItem.media

    if (media.type === "video") {
      if (videoRef.current) {
        videoRef.current.src = media.url
        videoRef.current.play()
        setIsPlaying(true)
      }
    } else if (media.type === "image") {
      if (imageRef.current) {
        imageRef.current.src = media.url
        setIsPlaying(true)

        // Auto-advance after duration
        setTimeout(() => {
          nextItem()
        }, currentItem.duration * 1000)
      }
    }
  }

  // Next item
  const nextItem = () => {
    if (!currentPlaylist) return

    let nextIndex = currentItemIndex + 1
    if (nextIndex >= currentPlaylist.items.length) {
      if (currentPlaylist.loop) {
        nextIndex = 0
      } else {
        setIsPlaying(false)
        return
      }
    }

    setCurrentItemIndex(nextIndex)
    setProgress(0)
  }

  // Previous item
  const previousItem = () => {
    if (!currentPlaylist) return

    let prevIndex = currentItemIndex - 1
    if (prevIndex < 0) {
      if (currentPlaylist.loop) {
        prevIndex = currentPlaylist.items.length - 1
      } else {
        prevIndex = 0
      }
    }

    setCurrentItemIndex(prevIndex)
    setProgress(0)
  }

  // Toggle play/pause
  const togglePlayPause = () => {
    if (isPlaying) {
      if (videoRef.current) {
        videoRef.current.pause()
      }
      setIsPlaying(false)
    } else {
      playCurrentItem()
    }
  }

  // Handle video events
  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100
      setProgress(progress)
    }
  }

  const handleVideoEnded = () => {
    nextItem()
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

  // Auto-play when playlist or current item changes
  useEffect(() => {
    if (currentPlaylist && isConnected) {
      playCurrentItem()
    }
  }, [currentPlaylist, currentItemIndex, isConnected])

  const currentItem = currentPlaylist?.items[currentItemIndex]

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Digital Signage Player</h1>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Badge variant="default" className="bg-green-600">
                <Wifi className="w-4 h-4 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="destructive">
                <WifiOff className="w-4 h-4 mr-1" />
                Disconnected
              </Badge>
            )}
          </div>
        </div>

        {!isConnected ? (
          /* Connection Form */
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Connect Device</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Enter Device Code</label>
                <Input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={deviceCode}
                  onChange={(e) => setDeviceCode(e.target.value)}
                  maxLength={10}
                  className="text-center text-lg tracking-widest"
                />
              </div>

              {error && <div className="text-red-500 text-sm">{error}</div>}

              <Button onClick={connectDevice} disabled={connectionStatus === "connecting"} className="w-full">
                {connectionStatus === "connecting" ? "Connecting..." : "Connect"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Player Interface */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Media Display */}
            <div className="lg:col-span-2">
              <Card className="bg-gray-900 border-gray-700">
                <CardContent className="p-0">
                  <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                    {currentItem ? (
                      <>
                        {currentItem.media.type === "video" && (
                          <video
                            ref={videoRef}
                            className="w-full h-full object-cover"
                            onTimeUpdate={handleVideoTimeUpdate}
                            onEnded={handleVideoEnded}
                            controls={false}
                          />
                        )}

                        {currentItem.media.type === "image" && (
                          <img ref={imageRef} className="w-full h-full object-cover" alt={currentItem.media.name} />
                        )}

                        {/* Progress Bar */}
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-4">
                          <div className="flex items-center justify-between text-white text-sm mb-2">
                            <span>{currentItem.media.name}</span>
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <div className="w-full bg-gray-600 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <div className="text-center">
                          <div className="text-6xl mb-4">📺</div>
                          <div>No content assigned</div>
                          <div className="text-sm">Waiting for playlist...</div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Controls & Info */}
            <div className="space-y-6">
              {/* Device Info */}
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg">Device Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Name:</span>
                    <span>{deviceInfo?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Type:</span>
                    <span>{deviceInfo?.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <Badge variant={deviceInfo?.status === "online" ? "default" : "secondary"}>
                      {deviceInfo?.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Playback Controls */}
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg">Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-center gap-2">
                    <Button variant="outline" size="icon" onClick={previousItem} disabled={!currentPlaylist}>
                      <SkipBack className="w-4 h-4" />
                    </Button>

                    <Button variant="outline" size="icon" onClick={togglePlayPause} disabled={!currentPlaylist}>
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>

                    <Button variant="outline" size="icon" onClick={nextItem} disabled={!currentPlaylist}>
                      <SkipForward className="w-4 h-4" />
                    </Button>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4" />
                      <span className="text-sm">Volume: {volume}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Playlist Info */}
              {currentPlaylist && (
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-lg">Current Playlist</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Name:</span>
                      <span>{currentPlaylist.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Items:</span>
                      <span>{currentPlaylist.items.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Current:</span>
                      <span>
                        {currentItemIndex + 1} of {currentPlaylist.items.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Loop:</span>
                      <Badge variant={currentPlaylist.loop ? "default" : "secondary"}>
                        {currentPlaylist.loop ? "On" : "Off"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
