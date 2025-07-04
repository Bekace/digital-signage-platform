"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Monitor, Play, Pause, Volume2, AlertCircle } from "lucide-react"

interface PlaylistItem {
  id: string
  name: string
  type: "image" | "video" | "url"
  url: string
  duration: number
  order: number
}

interface Playlist {
  id: string
  name: string
  description?: string
  items: PlaylistItem[]
  loop: boolean
}

interface DeviceInfo {
  id: string
  name: string
  status: string
  location?: string
  brightness?: number
  volume?: number
}

export default function DevicePlayerPage() {
  const params = useParams()
  const deviceId = params.deviceId as string

  const [device, setDevice] = useState<DeviceInfo | null>(null)
  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [lastHeartbeat, setLastHeartbeat] = useState<Date>(new Date())

  useEffect(() => {
    if (deviceId) {
      fetchDeviceInfo()
      fetchPlaylist()
      startHeartbeat()
    }
  }, [deviceId])

  useEffect(() => {
    if (playlist && playlist.items.length > 0 && isPlaying) {
      const currentItem = playlist.items[currentItemIndex]
      if (currentItem && currentItem.type === "image") {
        const timer = setTimeout(() => {
          nextItem()
        }, currentItem.duration * 1000)

        return () => clearTimeout(timer)
      }
    }
  }, [currentItemIndex, isPlaying, playlist])

  const fetchDeviceInfo = async () => {
    try {
      const response = await fetch(`/api/devices/${deviceId}`, {
        credentials: "include",
      })

      const data = await response.json()

      if (data.success && data.device) {
        setDevice(data.device)
      } else {
        throw new Error(data.error || "Device not found")
      }
    } catch (error) {
      console.error("Fetch device error:", error)
      setError("Failed to load device information")
    }
  }

  const fetchPlaylist = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/devices/${deviceId}/playlist`, {
        credentials: "include",
      })

      const data = await response.json()

      if (data.success) {
        if (data.playlist) {
          // Fetch full playlist details with items
          const playlistResponse = await fetch(`/api/playlists/${data.playlist.id}`, {
            credentials: "include",
          })

          const playlistData = await playlistResponse.json()

          if (playlistData.success) {
            setPlaylist(playlistData.playlist)
            setIsPlaying(true)
          }
        } else {
          setPlaylist(null)
        }
      } else {
        throw new Error(data.error || "Failed to fetch playlist")
      }
    } catch (error) {
      console.error("Fetch playlist error:", error)
      setError("Failed to load playlist")
    } finally {
      setIsLoading(false)
    }
  }

  const startHeartbeat = () => {
    const sendHeartbeat = async () => {
      try {
        await fetch(`/api/devices/${deviceId}/heartbeat`, {
          method: "POST",
          credentials: "include",
        })
        setLastHeartbeat(new Date())
      } catch (error) {
        console.error("Heartbeat error:", error)
      }
    }

    // Send initial heartbeat
    sendHeartbeat()

    // Send heartbeat every 30 seconds
    const interval = setInterval(sendHeartbeat, 30000)

    return () => clearInterval(interval)
  }

  const nextItem = () => {
    if (!playlist || playlist.items.length === 0) return

    const nextIndex = (currentItemIndex + 1) % playlist.items.length
    setCurrentItemIndex(nextIndex)
  }

  const previousItem = () => {
    if (!playlist || playlist.items.length === 0) return

    const prevIndex = currentItemIndex === 0 ? playlist.items.length - 1 : currentItemIndex - 1
    setCurrentItemIndex(prevIndex)
  }

  const togglePlayback = () => {
    setIsPlaying(!isPlaying)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading player...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="bg-red-900 border-red-700">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-100 mb-2">Player Error</h2>
            <p className="text-red-200">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!playlist || playlist.items.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-8 text-center">
            <Monitor className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No Content</h2>
            <p className="text-gray-300 mb-4">No playlist is assigned to this device</p>
            <div className="text-sm text-gray-400">
              <p>Device: {device?.name}</p>
              <p>ID: {deviceId}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentItem = playlist.items[currentItemIndex]

  return (
    <div className="min-h-screen bg-black relative">
      {/* Main Content Display */}
      <div className="absolute inset-0 flex items-center justify-center">
        {currentItem && isPlaying && (
          <>
            {currentItem.type === "image" && (
              <img
                src={currentItem.url || "/placeholder.svg"}
                alt={currentItem.name}
                className="max-w-full max-h-full object-contain"
                style={{ filter: `brightness(${device?.brightness || 100}%)` }}
              />
            )}
            {currentItem.type === "video" && (
              <video
                src={currentItem.url}
                autoPlay
                muted
                loop={playlist.loop}
                className="max-w-full max-h-full object-contain"
                style={{ filter: `brightness(${device?.brightness || 100}%)` }}
                onEnded={nextItem}
              />
            )}
            {currentItem.type === "url" && (
              <iframe
                src={currentItem.url}
                className="w-full h-full border-0"
                style={{ filter: `brightness(${device?.brightness || 100}%)` }}
              />
            )}
          </>
        )}

        {!isPlaying && (
          <div className="text-center text-white">
            <Pause className="h-24 w-24 mx-auto mb-4 opacity-50" />
            <h2 className="text-2xl font-bold mb-2">Playback Paused</h2>
            <p className="text-gray-300">Content playback is currently paused</p>
          </div>
        )}
      </div>

      {/* Control Overlay (hidden by default, shown on hover/touch) */}
      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end">
        <div className="w-full p-4">
          <Card className="bg-black bg-opacity-75 border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="sm" onClick={previousItem} className="text-white hover:bg-gray-700">
                    ⏮
                  </Button>
                  <Button variant="ghost" size="sm" onClick={togglePlayback} className="text-white hover:bg-gray-700">
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={nextItem} className="text-white hover:bg-gray-700">
                    ⏭
                  </Button>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    <span>{device?.name}</span>
                  </div>
                  {device?.volume && (
                    <div className="flex items-center gap-1">
                      <Volume2 className="h-4 w-4" />
                      <span>{device.volume}%</span>
                    </div>
                  )}
                  <Badge variant="outline" className="text-white border-white">
                    {currentItemIndex + 1} / {playlist.items.length}
                  </Badge>
                </div>
              </div>

              <div className="mt-2 text-sm text-gray-300">
                <p className="font-medium">{currentItem?.name}</p>
                <p>Playlist: {playlist.name}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="absolute top-4 right-4">
        <div className="flex items-center gap-2 bg-black bg-opacity-75 px-3 py-2 rounded-lg text-white text-sm">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Live</span>
        </div>
      </div>
    </div>
  )
}
