"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Monitor, Smartphone, Tv, Globe, Play, Pause, Square, RotateCcw, Plus } from "lucide-react"
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
  const [controlLoading, setControlLoading] = useState<number | null>(null)
  const [assignLoading, setAssignLoading] = useState<number | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)

  const fetchDevices = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        toast.error("Please log in to view devices")
        return
      }

      console.log("📱 [SCREENS PAGE] Fetching devices...")
      const response = await fetch("/api/devices", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch devices")
      }

      const data = await response.json()
      console.log("📱 [SCREENS PAGE] Devices response:", data)

      if (data.success) {
        setDevices(data.devices || [])
        setStats(data.stats || { total: 0, online: 0, offline: 0, playing: 0 })
      }
    } catch (error) {
      console.error("❌ [SCREENS PAGE] Error fetching devices:", error)
      toast.error("Failed to load devices")
    }
  }

  const fetchPlaylists = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      console.log("🎬 [SCREENS PAGE] Fetching playlists...")
      const response = await fetch("/api/playlists", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch playlists")
      }

      const data = await response.json()
      console.log("🎬 [SCREENS PAGE] Playlists response:", data)

      if (data.success) {
        setPlaylists(data.playlists || [])
      }
    } catch (error) {
      console.error("❌ [SCREENS PAGE] Error fetching playlists:", error)
    }
  }

  const assignPlaylist = async (deviceId: number, playlistId: string) => {
    try {
      setAssignLoading(deviceId)
      const token = localStorage.getItem("token")
      if (!token) {
        toast.error("Please log in to assign playlists")
        return
      }

      console.log("🎬 [SCREENS PAGE] Assigning playlist", playlistId, "to device", deviceId)

      const response = await fetch(`/api/devices/${deviceId}/assign-playlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          playlistId: playlistId === "none" ? null : Number.parseInt(playlistId),
        }),
      })

      const data = await response.json()
      console.log("🎬 [SCREENS PAGE] Assign playlist response:", data)

      if (data.success) {
        toast.success(data.message)
        await fetchDevices() // Refresh devices list
      } else {
        toast.error(data.error || "Failed to assign playlist")
      }
    } catch (error) {
      console.error("❌ [SCREENS PAGE] Error assigning playlist:", error)
      toast.error("Failed to assign playlist")
    } finally {
      setAssignLoading(null)
    }
  }

  const controlDevice = async (deviceId: number, action: string) => {
    try {
      setControlLoading(deviceId)
      const token = localStorage.getItem("token")
      if (!token) {
        toast.error("Please log in to control devices")
        return
      }

      console.log("🎮 [SCREENS PAGE] Sending control action", action, "to device", deviceId)

      const response = await fetch(`/api/devices/${deviceId}/control`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      })

      const data = await response.json()
      console.log("🎮 [SCREENS PAGE] Control response:", data)

      if (data.success) {
        toast.success(data.message)
        await fetchDevices() // Refresh devices list
      } else {
        toast.error(data.error || "Failed to control device")
      }
    } catch (error) {
      console.error("❌ [SCREENS PAGE] Error controlling device:", error)
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
    switch (deviceType.toLowerCase()) {
      case "fire_tv":
      case "android_tv":
        return <Tv className="h-4 w-4" />
      case "android":
      case "ios":
        return <Smartphone className="h-4 w-4" />
      case "web":
        return <Globe className="h-4 w-4" />
      default:
        return <Monitor className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    return <Badge variant={status === "online" ? "default" : "secondary"}>{status}</Badge>
  }

  const getPlaylistStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      playing: "default",
      paused: "secondary",
      stopped: "destructive",
      assigned: "outline",
      none: "secondary",
    }

    return <Badge variant={variants[status] || "secondary"}>{status === "none" ? "No Playlist" : status}</Badge>
  }

  const canControl = (device: Device) => {
    return device.status === "online" && device.assignedPlaylistId
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
          {devices.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Monitor className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No screens found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Get started by adding your first digital signage screen
                </p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Screen
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
                          {device.deviceType.replace("_", " ").toUpperCase()} • Last seen:{" "}
                          {new Date(device.lastSeen).toLocaleString()}
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
                      {device.lastControlAction && (
                        <div className="text-sm text-muted-foreground">
                          Last action: {device.lastControlAction} • {new Date(device.lastControlTime!).toLocaleString()}
                        </div>
                      )}
                    </div>
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
