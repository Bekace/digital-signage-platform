"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Monitor, Smartphone, Tv, Globe, Wifi, WifiOff, Play, Pause, Settings, Trash2, RefreshCw } from "lucide-react"
import { AddScreenDialog } from "@/components/add-screen-dialog"
import { toast } from "sonner"

interface Device {
  id: number
  name: string
  type: string
  platform: string
  capabilities: string[]
  screenResolution: string
  status: string
  lastSeen: string
  assignedPlaylist: {
    id: number
    name: string
  } | null
  createdAt: string
}

export default function ScreensPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDevices = async () => {
    try {
      const response = await fetch("/api/devices")
      const data = await response.json()

      if (data.success) {
        setDevices(data.devices)
      } else {
        throw new Error(data.error || "Failed to fetch devices")
      }
    } catch (error) {
      console.error("Error fetching devices:", error)
      toast.error("Failed to load devices")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDevices()
  }, [])

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "android":
      case "ios":
        return <Smartphone className="h-5 w-5" />
      case "fire_tv":
      case "android_tv":
        return <Tv className="h-5 w-5" />
      case "web-player":
      case "web_browser":
        return <Globe className="h-5 w-5" />
      default:
        return <Monitor className="h-5 w-5" />
    }
  }

  const getStatusBadge = (status: string, lastSeen: string) => {
    const lastSeenDate = new Date(lastSeen)
    const now = new Date()
    const diffMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60)

    if (status === "online" && diffMinutes < 2) {
      return (
        <Badge className="bg-green-500">
          <Wifi className="h-3 w-3 mr-1" />
          Online
        </Badge>
      )
    } else if (diffMinutes < 10) {
      return (
        <Badge variant="secondary">
          <Wifi className="h-3 w-3 mr-1" />
          Recently Active
        </Badge>
      )
    } else {
      return (
        <Badge variant="destructive">
          <WifiOff className="h-3 w-3 mr-1" />
          Offline
        </Badge>
      )
    }
  }

  const formatLastSeen = (lastSeen: string) => {
    const date = new Date(lastSeen)
    const now = new Date()
    const diffMinutes = (now.getTime() - date.getTime()) / (1000 * 60)

    if (diffMinutes < 1) {
      return "Just now"
    } else if (diffMinutes < 60) {
      return `${Math.floor(diffMinutes)} minutes ago`
    } else if (diffMinutes < 1440) {
      return `${Math.floor(diffMinutes / 60)} hours ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Screens</h1>
            <p className="text-muted-foreground">Manage your digital signage displays</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Screens</h1>
          <p className="text-muted-foreground">Manage your digital signage displays</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchDevices}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <AddScreenDialog />
        </div>
      </div>

      {devices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Monitor className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No screens connected</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add your first digital signage display to get started
            </p>
            <AddScreenDialog />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {devices.map((device) => (
            <Card key={device.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getDeviceIcon(device.type)}
                    <CardTitle className="text-lg">{device.name}</CardTitle>
                  </div>
                  {getStatusBadge(device.status, device.lastSeen)}
                </div>
                <CardDescription>
                  {device.platform} • {device.screenResolution}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium mb-2">Assigned Playlist</div>
                  {device.assignedPlaylist ? (
                    <div className="flex items-center gap-2">
                      <Play className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{device.assignedPlaylist.name}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Pause className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-muted-foreground">No playlist assigned</span>
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">Capabilities</div>
                  <div className="flex flex-wrap gap-1">
                    {device.capabilities.map((capability) => (
                      <Badge key={capability} variant="outline" className="text-xs">
                        {capability}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">Last seen: {formatLastSeen(device.lastSeen)}</div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                    <Settings className="h-4 w-4 mr-1" />
                    Settings
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 bg-transparent">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
