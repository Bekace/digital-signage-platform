"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Monitor, Wifi, WifiOff, Loader2, Play, Pause, SkipForward } from "lucide-react"

interface MediaItem {
  id: string
  name: string
  type: string
  url: string
  duration?: number
  thumbnail?: string
}

interface Playlist {
  id: string
  name: string
  items: MediaItem[]
  options: {
    shuffle: boolean
    loop: boolean
    transitionDuration: number
  }
}

export default function DevicePlayerPage() {
  const [step, setStep] = useState<"pairing" | "connected" | "playing">("pairing")
  const [pairingCode, setPairingCode] = useState("")
  const [deviceInfo, setDeviceInfo] = useState<any>(null)
  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected")
  const [screenInfo, setScreenInfo] = useState({ width: 1920, height: 1080 })

  // Generate a unique device identifier
  const [deviceId] = useState(() => {
    if (typeof window !== "undefined") {
      let id = localStorage.getItem("device-id")
      if (!id) {
        id = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        localStorage.setItem("device-id", id)
      }
      return id
    }
    return `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  })

  // Get screen info safely on client side
  useEffect(() => {
    if (typeof window !== "undefined" && window.screen) {
      setScreenInfo({
        width: window.screen.width,
        height: window.screen.height,
      })
    }
  }, [])

  // Connect to dashboard with pairing code
  const connectToDashboard = async () => {
    if (!pairingCode.trim()) {
      toast.error("Please enter a pairing code")
      return
    }

    try {
      setLoading(true)
      setConnectionStatus("connecting")
      console.log("🔗 [DEVICE PLAYER] Connecting with code:", pairingCode)

      const response = await fetch("/api/devices/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pairingCode: pairingCode.toUpperCase(),
          deviceId,
          deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screenResolution: `${screenInfo.width}x${screenInfo.height}`,
            timestamp: new Date().toISOString(),
          },
        }),
      })

      const data = await response.json()
      console.log("🔗 [DEVICE PLAYER] Registration response:", data)

      if (data.success) {
        setDeviceInfo(data.device)
        setConnectionStatus("connected")
        setStep("connected")
        toast.success("Connected to dashboard successfully!")

        // Start checking for playlist updates
        startPlaylistPolling()
      } else {
        setConnectionStatus("disconnected")
        toast.error(data.error || "Failed to connect to dashboard")
      }
    } catch (error) {
      console.error("🔗 [DEVICE PLAYER] Connection error:", error)
      setConnectionStatus("disconnected")
      toast.error("Failed to connect to dashboard")
    } finally {
      setLoading(false)
    }
  }

  // Poll for playlist updates
  const startPlaylistPolling = () => {
    const pollPlaylist = async () => {
      try {
        const response = await fetch(`/api/devices/${deviceId}/playlist`)
        const data = await response.json()

        if (data.success && data.playlist) {
          console.log("📺 [DEVICE PLAYER] Received playlist:", data.playlist)
          setPlaylist(data.playlist)

          if (data.playlist.items.length > 0 && step !== "playing") {
            setStep("playing")
            setIsPlaying(true)
          }
        }
      } catch (error) {
        console.error("📺 [DEVICE PLAYER] Playlist polling error:", error)
      }
    }

    // Poll every 30 seconds
    const interval = setInterval(pollPlaylist, 30000)

    // Initial poll
    pollPlaylist()

    return () => clearInterval(interval)
  }

  // Send heartbeat to dashboard
  useEffect(() => {
    if (connectionStatus === "connected" && deviceInfo) {
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
              timestamp: new Date().toISOString(),
            }),
          })
        } catch (error) {
          console.error("💓 [DEVICE PLAYER] Heartbeat error:", error)
        }
      }

      // Send heartbeat every 60 seconds
      const interval = setInterval(sendHeartbeat, 60000)

      // Initial heartbeat
      sendHeartbeat()

      return () => clearInterval(interval)
    }
  }, [connectionStatus, deviceInfo, deviceId, isPlaying, playlist, currentItemIndex])

  // Handle media playback
  const playNextItem = () => {
    if (!playlist || playlist.items.length === 0) return

    const nextIndex = (currentItemIndex + 1) % playlist.items.length
    setCurrentItemIndex(nextIndex)
  }

  const togglePlayback = () => {
    setIsPlaying(!isPlaying)
  }

  const currentItem = playlist?.items[currentItemIndex]

  if (step === "pairing") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
              <Monitor className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Digital Signage Player</CardTitle>
            <CardDescription>Connect this device to your dashboard using a pairing code</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pairingCode">Pairing Code</Label>
              <Input
                id="pairingCode"
                placeholder="Enter 6-character code"
                value={pairingCode}
                onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="text-center text-lg font-mono tracking-wider"
              />
            </div>

            <Button onClick={connectToDashboard} disabled={loading || !pairingCode.trim()} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wifi className="h-4 w-4 mr-2" />
                  Connect to Dashboard
                </>
              )}
            </Button>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                {connectionStatus === "connecting" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : connectionStatus === "connected" ? (
                  <>
                    <Wifi className="h-4 w-4 text-green-500" />
                    Connected
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4" />
                    Disconnected
                  </>
                )}
              </div>
            </div>

            <Separator />

            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                <strong>Device ID:</strong> {deviceId}
              </p>
              <p>
                <strong>Screen:</strong> {screenInfo.width}x{screenInfo.height}
              </p>
              <p>
                <strong>Platform:</strong> {typeof navigator !== "undefined" ? navigator.platform : "Unknown"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === "connected") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
              <Wifi className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-700">Connected Successfully!</CardTitle>
            <CardDescription>This device is now connected to your dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Screen Name:</span>
                <span className="font-medium">{deviceInfo?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Device Type:</span>
                <span className="font-medium">{deviceInfo?.deviceType}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  {deviceInfo?.status}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="text-center text-sm text-muted-foreground">
              <p>Waiting for content from your dashboard...</p>
              <p className="mt-2">This screen will automatically start playing when content is assigned.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === "playing") {
    return (
      <div className="min-h-screen bg-black text-white relative">
        {/* Media Display Area */}
        <div className="absolute inset-0 flex items-center justify-center">
          {currentItem ? (
            <div className="w-full h-full flex items-center justify-center">
              {currentItem.type.startsWith("image/") ? (
                <img
                  src={currentItem.url || "/placeholder.svg"}
                  alt={currentItem.name}
                  className="max-w-full max-h-full object-contain"
                />
              ) : currentItem.type.startsWith("video/") ? (
                <video
                  src={currentItem.url}
                  autoPlay
                  muted
                  className="max-w-full max-h-full object-contain"
                  onEnded={playNextItem}
                />
              ) : currentItem.type === "text/html" ||
                currentItem.type === "application/vnd.google-apps.presentation" ? (
                <iframe src={currentItem.url} className="w-full h-full border-0" title={currentItem.name} />
              ) : (
                <div className="text-center">
                  <div className="text-6xl mb-4">📄</div>
                  <h2 className="text-2xl font-bold mb-2">{currentItem.name}</h2>
                  <p className="text-muted-foreground">Unsupported media type: {currentItem.type}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <div className="text-6xl mb-4">📺</div>
              <h2 className="text-2xl font-bold mb-2">No Content</h2>
              <p className="text-muted-foreground">Waiting for content to be assigned...</p>
            </div>
          )}
        </div>

        {/* Control Overlay (hidden by default, shown on hover) */}
        <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-4 opacity-0 hover:opacity-100 transition-opacity">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={togglePlayback}>
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={playNextItem}>
                <SkipForward className="h-4 w-4" />
              </Button>
              <div className="text-sm">
                {currentItem ? (
                  <span>
                    {currentItemIndex + 1} of {playlist?.items.length} - {currentItem.name}
                  </span>
                ) : (
                  <span>No content</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{deviceInfo?.name}</Badge>
              <div className="flex items-center gap-1 text-green-400">
                <Wifi className="h-4 w-4" />
                <span className="text-xs">Connected</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
