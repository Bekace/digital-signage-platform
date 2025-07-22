"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import {
  Monitor,
  Wifi,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RefreshCw,
  AlertCircle,
  Eye,
  Link2,
  CheckCircle,
} from "lucide-react"

interface DeviceInfo {
  id?: string
  name: string
  deviceType: string
  platform: string
  screenResolution: string
  capabilities: string[]
}

interface PlaylistItem {
  id: string
  name: string
  type: string
  url: string
  duration: number
}

interface Playlist {
  id: string
  name: string
  items: PlaylistItem[]
}

export default function DevicePlayerPage() {
  const [isConnected, setIsConnected] = useState(false)
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null)
  const [pairingCode, setPairingCode] = useState("")
  const [isRegistering, setIsRegistering] = useState(false)
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null)
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [connectionError, setConnectionError] = useState("")

  // Generate device info
  const generateDeviceInfo = useCallback((): DeviceInfo => {
    const deviceId = Math.random().toString(36).substring(2, 15)
    return {
      name: `Device Player ${deviceId}`,
      deviceType: "web_browser",
      platform: navigator.platform || "Unknown",
      screenResolution: `${screen.width}x${screen.height}`,
      capabilities: ["video", "image", "audio", "web", "slides", "pdf", "office", "text"],
    }
  }, [])

  // Check for existing connection on load
  useEffect(() => {
    const checkExistingConnection = async () => {
      const savedDeviceId = localStorage.getItem("deviceId")
      const savedPairingCode = localStorage.getItem("devicePairingCode")

      if (savedDeviceId && savedPairingCode) {
        console.log("🔗 [DEVICE PLAYER] Checking existing connection:", {
          deviceId: savedDeviceId,
          pairingCode: savedPairingCode,
        })

        try {
          // Verify the device actually exists in the database
          const response = await fetch(`/api/devices/${savedDeviceId}`, {
            credentials: "include",
          })

          if (response.ok) {
            const data = await response.json()
            if (data.success && data.device) {
              console.log("🔗 [DEVICE PLAYER] Verified real device connection:", data.device)
              setDeviceInfo({
                id: data.device.id,
                name: data.device.name,
                deviceType: data.device.deviceType,
                platform: data.device.platform || "Unknown",
                screenResolution: data.device.screenResolution || "Unknown",
                capabilities: data.device.capabilities || [],
              })
              setIsConnected(true)
              loadPlaylist(savedDeviceId)
              return
            }
          }

          // If we get here, the saved connection is fake/invalid
          console.log("🔗 [DEVICE PLAYER] Saved connection is invalid, clearing fake data")
          localStorage.removeItem("deviceId")
          localStorage.removeItem("devicePairingCode")
          setConnectionError("Previous connection was invalid and has been cleared")
        } catch (error) {
          console.error("🔗 [DEVICE PLAYER] Error verifying connection:", error)
          localStorage.removeItem("deviceId")
          localStorage.removeItem("devicePairingCode")
        }
      }

      console.log("🔗 [DEVICE PLAYER] No valid existing connection found")
    }

    checkExistingConnection()
  }, [])

  // Load playlist for device
  const loadPlaylist = async (deviceId: string) => {
    try {
      const response = await fetch(`/api/devices/${deviceId}/playlist`, {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.playlist) {
          console.log("🔗 [DEVICE PLAYER] Loaded playlist:", data.playlist)
          setCurrentPlaylist(data.playlist)
        } else {
          console.log("🔗 [DEVICE PLAYER] No playlist assigned")
          setCurrentPlaylist(null)
        }
      }
    } catch (error) {
      console.error("🔗 [DEVICE PLAYER] Error loading playlist:", error)
    }
  }

  // Register device with pairing code
  const handleRegister = async () => {
    if (!pairingCode.trim()) {
      toast.error("Please enter a pairing code")
      return
    }

    setIsRegistering(true)
    setConnectionError("")

    try {
      console.log("🔗 [DEVICE PLAYER] Attempting registration with pairing code:", pairingCode)

      const deviceInfo = generateDeviceInfo()
      console.log("🔗 [DEVICE PLAYER] Generated device info:", deviceInfo)

      const response = await fetch("/api/devices/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pairingCode: pairingCode.toUpperCase(),
          deviceInfo,
        }),
      })

      const data = await response.json()
      console.log("🔗 [DEVICE PLAYER] Registration response:", data)

      if (data.success && data.device) {
        // Verify the device was actually created by fetching it back
        const verifyResponse = await fetch(`/api/devices/${data.device.id}`, {
          credentials: "include",
        })

        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json()
          if (verifyData.success && verifyData.device) {
            console.log("🔗 [DEVICE PLAYER] Device registration verified:", verifyData.device)

            // Store ONLY real device data
            localStorage.setItem("deviceId", data.device.id.toString())
            localStorage.setItem("devicePairingCode", pairingCode.toUpperCase())

            setDeviceInfo({
              id: data.device.id,
              name: data.device.name,
              deviceType: data.device.deviceType,
              platform: data.device.platform || deviceInfo.platform,
              screenResolution: data.device.screenResolution || deviceInfo.screenResolution,
              capabilities: deviceInfo.capabilities,
            })

            setIsConnected(true)
            setPairingCode("")
            toast.success("Device registered successfully!")

            // Load playlist
            loadPlaylist(data.device.id.toString())
            return
          }
        }

        throw new Error("Device registration could not be verified")
      } else {
        throw new Error(data.error || "Registration failed")
      }
    } catch (error) {
      console.error("🔗 [DEVICE PLAYER] Registration error:", error)
      setConnectionError(error instanceof Error ? error.message : "Registration failed")
      toast.error("Failed to register device")
    } finally {
      setIsRegistering(false)
    }
  }

  // Disconnect device
  const handleDisconnect = () => {
    localStorage.removeItem("deviceId")
    localStorage.removeItem("devicePairingCode")
    setIsConnected(false)
    setDeviceInfo(null)
    setCurrentPlaylist(null)
    setIsPlaying(false)
    setIsPreviewMode(false)
    setConnectionError("")
    toast.success("Device disconnected")
  }

  // Toggle preview mode
  const handlePreviewMode = () => {
    setIsPreviewMode(!isPreviewMode)
    if (!isPreviewMode) {
      toast.success("Preview mode enabled")
    } else {
      toast.success("Preview mode disabled")
    }
  }

  // Media controls
  const handlePlay = () => {
    setIsPlaying(true)
    toast.success("Playback started")
  }

  const handlePause = () => {
    setIsPlaying(false)
    toast.success("Playback paused")
  }

  const handleNext = () => {
    if (currentPlaylist && currentItemIndex < currentPlaylist.items.length - 1) {
      setCurrentItemIndex(currentItemIndex + 1)
      toast.success("Next item")
    }
  }

  const handlePrevious = () => {
    if (currentItemIndex > 0) {
      setCurrentItemIndex(currentItemIndex - 1)
      toast.success("Previous item")
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Monitor className="h-12 w-12 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Device Player</CardTitle>
            <CardDescription>Connect your device to the digital signage platform</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {connectionError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{connectionError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="pairingCode">Pairing Code</Label>
              <Input
                id="pairingCode"
                type="text"
                placeholder="Enter pairing code"
                value={pairingCode}
                onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
                className="text-center text-lg font-mono"
                maxLength={6}
              />
            </div>

            <Button onClick={handleRegister} disabled={isRegistering} className="w-full">
              {isRegistering ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-2" />
                  Connect Device
                </>
              )}
            </Button>

            <div className="text-center text-sm text-gray-600">
              <p>Get a pairing code from your dashboard</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Monitor className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Device Player</h1>
          </div>
          <Button onClick={handleDisconnect} variant="outline">
            Disconnect
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Device Connection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Device Connection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                <Badge variant="default" className="bg-green-500">
                  <Wifi className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Device ID:</span>
                  <span className="font-mono">{deviceInfo?.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pairing Code:</span>
                  <span className="font-mono">{localStorage.getItem("devicePairingCode")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span>idle</span>
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <Button onClick={handlePreviewMode} className="w-full" variant={isPreviewMode ? "default" : "outline"}>
                  <Eye className="h-4 w-4 mr-2" />
                  {isPreviewMode ? "Exit Preview" : "Preview Mode"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Device Information */}
          <Card>
            <CardHeader>
              <CardTitle>Device Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span>{deviceInfo?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="capitalize">{deviceInfo?.deviceType?.replace("_", " ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Platform:</span>
                  <span>{deviceInfo?.platform}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Resolution:</span>
                  <span>{deviceInfo?.screenResolution}</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium text-gray-600">Capabilities</span>
                <div className="flex flex-wrap gap-2">
                  {deviceInfo?.capabilities?.map((capability) => (
                    <Badge key={capability} variant="secondary" className="text-xs capitalize">
                      {capability}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Playlist */}
        <Card>
          <CardHeader>
            <CardTitle>Current Playlist</CardTitle>
          </CardHeader>
          <CardContent>
            {currentPlaylist ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{currentPlaylist.name}</h3>
                  <Badge variant="outline">{currentPlaylist.items.length} items</Badge>
                </div>

                {/* Media Controls */}
                <div className="flex items-center justify-center gap-4 py-4">
                  <Button onClick={handlePrevious} variant="outline" size="sm" disabled={currentItemIndex === 0}>
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  <Button onClick={isPlaying ? handlePause : handlePlay} size="sm">
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button
                    onClick={handleNext}
                    variant="outline"
                    size="sm"
                    disabled={currentItemIndex === currentPlaylist.items.length - 1}
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>

                {/* Current Item */}
                {currentPlaylist.items[currentItemIndex] && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Now Playing:</span>
                      <Badge variant="secondary">{currentPlaylist.items[currentItemIndex].type}</Badge>
                    </div>
                    <h4 className="font-medium">{currentPlaylist.items[currentItemIndex].name}</h4>
                    <p className="text-sm text-gray-600">
                      Duration: {currentPlaylist.items[currentItemIndex].duration}s
                    </p>
                  </div>
                )}

                {/* Playlist Items */}
                <div className="space-y-2">
                  <h4 className="font-medium">Playlist Items:</h4>
                  <div className="space-y-1">
                    {currentPlaylist.items.map((item, index) => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-2 rounded ${
                          index === currentItemIndex ? "bg-blue-50 border border-blue-200" : "bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">#{index + 1}</span>
                          <span className="text-sm">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {item.type}
                          </Badge>
                          <span className="text-xs text-gray-500">{item.duration}s</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No playlist assigned to this device</h3>
                <p className="text-gray-600">Assign a playlist from your dashboard to start displaying content</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
