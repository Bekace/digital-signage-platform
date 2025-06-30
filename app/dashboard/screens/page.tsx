"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Monitor, Smartphone, Tv, Globe, Play, Pause, Square, RotateCcw, Plus, Wifi, WifiOff } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AddScreenDialog } from "@/components/add-screen-dialog"

interface Device {
  id: number
  name: string
  deviceType: string
  status: "online" | "offline"
  lastSeen: string
  assignedPlaylistId: number | null
  playlistStatus: string
  lastControlAction: string | null
  lastControlTime: string | null
  createdAt: string
  updatedAt: string
  playlist: {
    id: number
    name: string
    itemCount: number
  } | null
}

interface Playlist {
  id: number
  name: string
  itemCount: number
}

interface DeviceStats {
  total: number
  online: number
  offline: number
  playing: number
}

export default function ScreensPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [stats, setStats] = useState<DeviceStats>({ total: 0, online: 0, offline: 0, playing: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [controlLoading, setControlLoading] = useState<number | null>(null)
  const [assignLoading, setAssignLoading] = useState<number | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)

  const fetchDevices = async () => {
    try {
      const response = await fetch("/api/devices", {
        method: "GET",
        credentials: "include",
      })

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/login"
          return
        }
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setDevices(data.devices || [])
        setStats(data.stats || { total: 0, online: 0, offline: 0, playing: 0 })
        setError(null)
      } else {
        setError(data.error || "Failed to fetch devices")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      setError(errorMessage)
    }
  }

  const fetchPlaylists = async () => {
    try {
      const response = await fetch("/api/playlists", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setPlaylists(data.playlists || [])
        }
      }
    } catch (error) {
      console.error("Error fetching playlists:", error)
    }
  }

  const assignPlaylist = async (deviceId: number, playlistId: string) => {
    try {
      setAssignLoading(deviceId)

      const response = await fetch(`/api/devices/${deviceId}/assign-playlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          playlistId: playlistId === "none" ? null : Number.parseInt(playlistId),
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        await fetchDevices()
      } else {
        toast.error(data.error || "Failed to assign playlist")
      }
    } catch (error) {
      toast.error("Failed to assign playlist")
    } finally {
      setAssignLoading(null)
    }
  }

  const controlDevice = async (deviceId: number, action: string) => {
    try {
      setControlLoading(deviceId)

      const response = await fetch(`/api/devices/${deviceId}/control`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ action }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        await fetchDevices()
      } else {
        toast.error(data.error || "Failed to control device")
      }
    } catch (error) {
      toast.error("Failed to control device")
    } finally {
      setControlLoading(null)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchDevices(), fetchPlaylists()])
      setLoading(false)
    }
    loadData()
  }, [])

  const getDeviceIcon = (deviceType: string) => {
    // Add null check to prevent toLowerCase error
    if (!deviceType) return <Monitor className="h-4 w-4" />

    switch (deviceType.toLowerCase()) {
      case "fire_tv":
      case "android_tv":
        return <Tv className="h-4 w-4" />
      case "android":
      case "ios":
        return <Smartphone className="h-4 w-4" />
      case "web":
      case "web_browser":
        return <Globe className="h-4 w-4" />
      default:
        return <Monitor className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    return status === "online" ? (
      <Badge className="bg-green-500">
        <Wifi className="h-3 w-3 mr-1" />
        Online
      </Badge>
    ) : (
      <Badge variant="secondary">
        <WifiOff className="h-3 w-3 mr-1" />
        Offline
      </Badge>
    )
  }

  const getPlaylistStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      playing: "default",
      paused: "secondary",
      stopped: "destructive",
      assigned: "outline",
      none: "secondary",
    }

    const icons: Record<string, React.ReactNode> = {
      playing: <Play className="h-3 w-3 mr-1" />,
      paused: <Pause className="h-3 w-3 mr-1" />,
      stopped: <Square className="h-3 w-3 mr-1" />,
      assigned: <Monitor className="h-3 w-3 mr-1" />,
      none: null,
    }

    return (
      <Badge variant={variants[status] || "secondary"}>
        {icons[status]}
        {status === "none" ? "No Playlist" : status}
      </Badge>
    )
  }

  const canControl = (device: Device) => {
    return device.status === "online" && device.assignedPlaylistId
  }

  const formatLastSeen = (lastSeen: string) => {
    if (!lastSeen) return "Never"

    const date = new Date(lastSeen)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return `${Math.floor(diffMins / 1440)}d ago`
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading screens...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Screens</h1>
            <p className="text-muted-foreground">Manage your digital signage displays and control playback</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Screen
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800">Error Loading Screens</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700 mb-4">{error}</p>
              <Button onClick={fetchDevices} variant="outline">
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Screens</CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Online</CardTitle>
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.online}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Offline</CardTitle>
              <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.offline}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Playing</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.playing}</div>
            </CardContent>
          </Card>
        </div>

        {/* Devices List */}
        <div className="space-y-4">
          {devices.length === 0 && !error ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Monitor className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No screens found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Get started by adding your first digital signage screen
                </p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Screen
                </Button>
              </CardContent>
            </Card>
          ) : (
            devices.map((device) => (
              <Card key={device.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getDeviceIcon(device.deviceType)}
                      <div>
                        <CardTitle className="text-lg">{device.name}</CardTitle>
                        <CardDescription>
                          {device.deviceType ? device.deviceType.replace("_", " ").toUpperCase() : "UNKNOWN"} • Last
                          seen {formatLastSeen(device.lastSeen)}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(device.status)}
                      {getPlaylistStatusBadge(device.playlistStatus)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Playlist Assignment */}
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <label className="text-sm font-medium mb-2 block">Assigned Playlist</label>
                        <Select
                          value={device.assignedPlaylistId?.toString() || "none"}
                          onValueChange={(value) => assignPlaylist(device.id, value)}
                          disabled={assignLoading === device.id}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select playlist..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Playlist</SelectItem>
                            {playlists.map((playlist) => (
                              <SelectItem key={playlist.id} value={playlist.id.toString()}>
                                {playlist.name} ({playlist.itemCount} items)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {device.playlist && (
                        <div className="text-sm text-muted-foreground">
                          <p className="font-medium">{device.playlist.name}</p>
                          <p>{device.playlist.itemCount} items</p>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Control Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant={device.playlistStatus === "playing" ? "secondary" : "default"}
                          onClick={() =>
                            controlDevice(device.id, device.playlistStatus === "playing" ? "pause" : "play")
                          }
                          disabled={!canControl(device) || controlLoading === device.id}
                        >
                          {device.playlistStatus === "playing" ? (
                            <Pause className="h-4 w-4 mr-1" />
                          ) : (
                            <Play className="h-4 w-4 mr-1" />
                          )}
                          {device.playlistStatus === "playing" ? "Pause" : "Play"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => controlDevice(device.id, "stop")}
                          disabled={!canControl(device) || controlLoading === device.id}
                        >
                          <Square className="h-4 w-4 mr-1" />
                          Stop
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => controlDevice(device.id, "restart")}
                          disabled={!canControl(device) || controlLoading === device.id}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Restart
                        </Button>
                      </div>
                      {device.lastControlAction && device.lastControlTime && (
                        <div className="text-sm text-muted-foreground">
                          Last action: {device.lastControlAction} • {new Date(device.lastControlTime).toLocaleString()}
                        </div>
                      )}
                    </div>

                    {/* Status Messages */}
                    {device.status === "offline" && (
                      <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                        Device is offline. Controls will be available when the device comes online.
                      </div>
                    )}

                    {device.status === "online" && !device.assignedPlaylistId && (
                      <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                        Assign a playlist to start controlling playback on this device.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <AddScreenDialog open={showAddDialog} onOpenChange={setShowAddDialog} onScreenAdded={fetchDevices} />
    </DashboardLayout>
  )
}
