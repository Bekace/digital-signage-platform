"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  Monitor,
  Wifi,
  WifiOff,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Eye,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react"

interface DeviceInfo {
  id?: string
  name: string
  deviceType: string
  platform: string
  screenResolution: string
  capabilities: string[]
  status?: string
  assignedPlaylistId?: number
  playlistName?: string
}

interface PlaylistItem {
  id: number
  media_id: number
  duration: number
  order_index: number
  media: {
    id: number
    name: string
    type: string
    url: string
    thumbnail_url?: string
  }
}

interface ConnectionState {
  connected: boolean
  deviceId?: string
  pairingCode?: string
  device?: DeviceInfo
  error?: string
}

export default function DevicePlayerPage() {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    connected: false,
  })
  const [pairingCode, setPairingCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([])
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(50)

  // Generate device info
  const generateDeviceInfo = useCallback((): DeviceInfo => {
    const deviceId = Math.random().toString(36).substring(2, 15)
    return {
      name: `Device Player ${deviceId}`,
      deviceType: "web_browser",
      platform: navigator.platform || "Web",
      screenResolution: `${screen.width}x${screen.height}`,
      capabilities: ["video", "image", "audio", "web", "slides", "pdf", "office", "text"],
    }
  }, [])

  // Check for existing connection on load
  useEffect(() => {
    const checkExistingConnection = async () => {
      console.log("🔗 [DEVICE PLAYER] Checking for existing connection...")

      const savedDeviceId = localStorage.getItem("deviceId")
      const savedPairingCode = localStorage.getItem("devicePairingCode")

      if (savedDeviceId) {
        console.log("🔗 [DEVICE PLAYER] Found saved device ID:", savedDeviceId)

        try {
          // Verify the device actually exists in the database
          const response = await fetch(`/api/devices/${savedDeviceId}`)
          const data = await response.json()

          if (data.success && data.device) {
            console.log("🔗 [DEVICE PLAYER] Verified real device connection:", data.device)
            setConnectionState({
              connected: true,
              deviceId: savedDeviceId,
              pairingCode: savedPairingCode || undefined,
              device: data.device,
            })
            loadPlaylist(savedDeviceId)
          } else {
            console.log("🔗 [DEVICE PLAYER] Device not found in database, clearing fake connection")
            localStorage.removeItem("deviceId")
            localStorage.removeItem("devicePairingCode")
            setConnectionState({ connected: false })
          }
        } catch (error) {
          console.error("🔗 [DEVICE PLAYER] Error verifying connection:", error)
          localStorage.removeItem("deviceId")
          localStorage.removeItem("devicePairingCode")
          setConnectionState({ connected: false })
        }
      } else {
        console.log("🔗 [DEVICE PLAYER] No saved connection found")
      }
    }

    checkExistingConnection()
  }, [])

  // Load playlist for device
  const loadPlaylist = async (deviceId: string) => {
    try {
      console.log("🎵 [DEVICE PLAYER] Loading playlist for device:", deviceId)

      const response = await fetch(`/api/devices/${deviceId}/playlist`)
      const data = await response.json()

      if (data.success && data.playlist) {
        console.log("🎵 [DEVICE PLAYER] Playlist loaded:", data.playlist)
        setPlaylist(data.playlist.items || [])
      } else {
        console.log("🎵 [DEVICE PLAYER] No playlist assigned")
        setPlaylist([])
      }
    } catch (error) {
      console.error("🎵 [DEVICE PLAYER] Error loading playlist:", error)
      setPlaylist([])
    }
  }

  // Connect with pairing code
  const handleConnect = async () => {
    if (!pairingCode.trim()) {
      toast.error("Please enter a pairing code")
      return
    }

    setLoading(true)
    console.log("🔗 [DEVICE PLAYER] Attempting registration with pairing code:", pairingCode)

    try {
      const deviceInfo = generateDeviceInfo()
      console.log("🔗 [DEVICE PLAYER] Generated device info:", deviceInfo)

      const response = await fetch("/api/devices/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pairingCode: pairingCode.trim(),
          deviceInfo,
        }),
      })

      const data = await response.json()
      console.log("🔗 [DEVICE PLAYER] Registration response:", data)

      if (data.success && data.device) {
        // Verify the device was actually created by fetching it back
        const verifyResponse = await fetch(`/api/devices/${data.device.id}`)
        const verifyData = await verifyResponse.json()

        if (verifyData.success && verifyData.device) {
          console.log("🔗 [DEVICE PLAYER] Device registration verified:", verifyData.device)

          // Store connection info
          localStorage.setItem("deviceId", data.device.id.toString())
          localStorage.setItem("devicePairingCode", pairingCode.trim())

          setConnectionState({
            connected: true,
            deviceId: data.device.id.toString(),
            pairingCode: pairingCode.trim(),
            device: verifyData.device,
          })

          // Load playlist
          loadPlaylist(data.device.id.toString())

          toast.success("Device connected successfully!")
          setPairingCode("")
        } else {
          throw new Error("Device registration could not be verified")
        }
      } else {
        throw new Error(data.error || "Registration failed")
      }
    } catch (error) {
      console.error("🔗 [DEVICE PLAYER] Registration error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to connect device"
      setConnectionState({
        connected: false,
        error: errorMessage,
      })
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Disconnect device
  const handleDisconnect = () => {
    console.log("🔗 [DEVICE PLAYER] Disconnecting device")

    localStorage.removeItem("deviceId")
    localStorage.removeItem("devicePairingCode")

    setConnectionState({ connected: false })
    setPlaylist([])
    setPreviewMode(false)
    setIsPlaying(false)

    toast.success("Device disconnected")
  }

  // Send heartbeat
  useEffect(() => {
    if (!connectionState.connected || !connectionState.deviceId) return

    const sendHeartbeat = async () => {
      try {
        await fetch(`/api/devices/${connectionState.deviceId}/heartbeat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: previewMode ? "playing" : "idle",
            currentItem: previewMode ? currentItemIndex : null,
          }),
        })
      } catch (error) {
        console.error("💓 [DEVICE PLAYER] Heartbeat error:", error)
      }
    }

    // Send heartbeat immediately
    sendHeartbeat()

    // Then send every 30 seconds
    const interval = setInterval(sendHeartbeat, 30000)
    return () => clearInterval(interval)
  }, [connectionState.connected, connectionState.deviceId, previewMode, currentItemIndex])

  // Auto-refresh playlist
  useEffect(() => {
    if (!connectionState.connected || !connectionState.deviceId) return

    const refreshPlaylist = () => {
      loadPlaylist(connectionState.deviceId!)
    }

    // Refresh playlist every 60 seconds
    const interval = setInterval(refreshPlaylist, 60000)
    return () => clearInterval(interval)
  }, [connectionState.connected, connectionState.deviceId])

  // Preview mode controls
  const togglePreview = () => {
    if (playlist.length === 0) {
      toast.error("No playlist assigned to preview")
      return
    }
    setPreviewMode(!previewMode)
    setIsPlaying(!previewMode)
  }

  const nextItem = () => {
    if (playlist.length === 0) return
    setCurrentItemIndex((prev) => (prev + 1) % playlist.length)
  }

  const previousItem = () => {
    if (playlist.length === 0) return
    setCurrentItemIndex((prev) => (prev - 1 + playlist.length) % playlist.length)
  }

  const currentItem = playlist[currentItemIndex]

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Monitor className="h-8 w-8" />
            Device Player
          </h1>
          <p className="text-gray-600 mt-2">Connect your device to the digital signage platform</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Connection Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {connectionState.connected ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <WifiOff className="h-5 w-5 text-gray-400" />
                )}
                Device Connection
              </CardTitle>
              <CardDescription>
                {connectionState.connected
                  ? "Your device is connected to the platform"
                  : "Enter a pairing code to connect your device"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {connectionState.connected ? (
                <div className="space-y-4">
                  <Badge variant="default" className="bg-green-500">
                    <Wifi className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Device ID:</span>
                      <span className="font-mono">{connectionState.deviceId}</span>
                    </div>
                    {connectionState.pairingCode && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pairing Code:</span>
                        <span className="font-mono">{connectionState.pairingCode}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="capitalize">{connectionState.device?.status || "idle"}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleDisconnect} variant="outline" size="sm">
                      Disconnect
                    </Button>
                    <Button onClick={togglePreview} variant="default" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      {previewMode ? "Exit Preview" : "Preview Mode"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {connectionState.error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{connectionState.error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="pairingCode">Pairing Code</Label>
                    <Input
                      id="pairingCode"
                      placeholder="Enter 6-character pairing code"
                      value={pairingCode}
                      onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
                      maxLength={6}
                      className="font-mono text-center text-lg tracking-wider"
                    />
                  </div>

                  <Button onClick={handleConnect} disabled={loading || !pairingCode.trim()} className="w-full">
                    {loading ? (
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
              )}
            </CardContent>
          </Card>

          {/* Device Information */}
          <Card>
            <CardHeader>
              <CardTitle>Device Information</CardTitle>
              <CardDescription>Technical details about this device</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {connectionState.device ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{connectionState.device.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="capitalize">{connectionState.device.deviceType?.replace("_", " ")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Platform:</span>
                    <span>{connectionState.device.platform}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Resolution:</span>
                    <span>{connectionState.device.screenResolution}</span>
                  </div>

                  <Separator />

                  <div>
                    <span className="text-gray-600 text-sm">Capabilities</span>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {connectionState.device.capabilities?.map((capability) => (
                        <Badge key={capability} variant="secondary" className="text-xs capitalize">
                          {capability}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Connect your device to view information</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Current Playlist */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Current Playlist
            </CardTitle>
            <CardDescription>Content assigned to this device</CardDescription>
          </CardHeader>
          <CardContent>
            {playlist.length > 0 ? (
              <div className="space-y-4">
                {/* Playlist Controls */}
                {previewMode && (
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-4">
                      <Button onClick={previousItem} variant="outline" size="sm">
                        <SkipBack className="h-4 w-4" />
                      </Button>
                      <Button onClick={() => setIsPlaying(!isPlaying)} variant="outline" size="sm">
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button onClick={nextItem} variant="outline" size="sm">
                        <SkipForward className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4" />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        className="w-20"
                      />
                      <span className="text-sm w-8">{volume}%</span>
                    </div>
                  </div>
                )}

                {/* Current Item Display */}
                {currentItem && previewMode && (
                  <div className="p-6 bg-black rounded-lg text-white text-center">
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold">{currentItem.media.name}</h3>
                      <Badge variant="secondary" className="bg-white/20 text-white">
                        {currentItem.media.type.toUpperCase()}
                      </Badge>
                      <p className="text-sm opacity-75">
                        Duration: {currentItem.duration}s | Item {currentItemIndex + 1} of {playlist.length}
                      </p>
                      {isPlaying && (
                        <div className="flex items-center justify-center gap-2 text-green-400">
                          <Play className="h-4 w-4" />
                          <span className="text-sm">Playing</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Playlist Items */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-600">Playlist Items ({playlist.length})</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {playlist.map((item, index) => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          index === currentItemIndex && previewMode
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-mono text-gray-500 w-6">{index + 1}</span>
                          <div>
                            <p className="font-medium text-sm">{item.media.name}</p>
                            <p className="text-xs text-gray-500 capitalize">{item.media.type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{item.duration}s</p>
                          {index === currentItemIndex && previewMode && (
                            <Badge variant="default" className="text-xs">
                              Current
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">No playlist assigned to this device</h3>
                <p className="text-gray-500 text-sm">
                  {connectionState.connected
                    ? "Ask your administrator to assign a playlist to this device"
                    : "Connect your device to check for assigned playlists"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
