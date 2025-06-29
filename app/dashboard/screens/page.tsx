"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import { AddScreenDialog } from "@/components/add-screen-dialog"
import { Monitor, Play, Pause, Square, RotateCcw, Wifi, WifiOff, Clock, List, Activity } from "lucide-react"

interface Device {
  id: number
  name: string
  deviceType: string
  status: "online" | "offline"
  lastSeen: string
  createdAt: string
  assignedPlaylistId: number | null
  playlistStatus: string
  lastControlAction: string | null
  lastControlTime: string | null
  updatedAt: string | null
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
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>("")
  const [controlLoading, setControlLoading] = useState<number | null>(null)

  const fetchDevices = async () => {
    try {
      console.log("📱 [SCREENS PAGE] Fetching devices...")
      const response = await fetch("/api/devices")
      const data = await response.json()

      if (data.success) {
        console.log("✅ [SCREENS PAGE] Devices loaded:", data.devices.length)
        setDevices(data.devices)
        setStats(data.stats)
      } else {
        console.error("❌ [SCREENS PAGE] Failed to fetch devices:", data.error)
        toast({
          title: "Error",
          description: "Failed to load devices",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("💥 [SCREENS PAGE] Error fetching devices:", error)
      toast({
        title: "Error",
        description: "Failed to load devices",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchPlaylists = async () => {
    try {
      console.log("📋 [SCREENS PAGE] Fetching playlists...")
      const response = await fetch("/api/playlists")
      const data = await response.json()

      if (data.success) {
        console.log("✅ [SCREENS PAGE] Playlists loaded:", data.playlists.length)
        setPlaylists(
          data.playlists.map((p: any) => ({
            id: p.id,
            name: p.name,
            itemCount: p.itemCount || 0,
          })),
        )
      } else {
        console.error("❌ [SCREENS PAGE] Failed to fetch playlists:", data.error)
      }
    } catch (error) {
      console.error("💥 [SCREENS PAGE] Error fetching playlists:", error)
    }
  }

  const handleAssignPlaylist = async () => {
    if (!selectedDevice || !selectedPlaylistId) return

    try {
      console.log("🎬 [SCREENS PAGE] Assigning playlist:", selectedPlaylistId, "to device:", selectedDevice.id)

      const response = await fetch(`/api/devices/${selectedDevice.id}/assign-playlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playlistId: Number.parseInt(selectedPlaylistId),
        }),
      })

      const data = await response.json()

      if (data.success) {
        console.log("✅ [SCREENS PAGE] Playlist assigned successfully")
        toast({
          title: "Success",
          description: data.message,
        })
        setAssignDialogOpen(false)
        setSelectedDevice(null)
        setSelectedPlaylistId("")
        fetchDevices() // Refresh devices list
      } else {
        console.error("❌ [SCREENS PAGE] Failed to assign playlist:", data.error)
        toast({
          title: "Error",
          description: data.error || "Failed to assign playlist",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("💥 [SCREENS PAGE] Error assigning playlist:", error)
      toast({
        title: "Error",
        description: "Failed to assign playlist",
        variant: "destructive",
      })
    }
  }

  const handleUnassignPlaylist = async (device: Device) => {
    try {
      console.log("🗑️ [SCREENS PAGE] Unassigning playlist from device:", device.id)

      const response = await fetch(`/api/devices/${device.id}/assign-playlist`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        console.log("✅ [SCREENS PAGE] Playlist unassigned successfully")
        toast({
          title: "Success",
          description: data.message,
        })
        fetchDevices() // Refresh devices list
      } else {
        console.error("❌ [SCREENS PAGE] Failed to unassign playlist:", data.error)
        toast({
          title: "Error",
          description: data.error || "Failed to unassign playlist",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("💥 [SCREENS PAGE] Error unassigning playlist:", error)
      toast({
        title: "Error",
        description: "Failed to unassign playlist",
        variant: "destructive",
      })
    }
  }

  const handleControlDevice = async (device: Device, action: string) => {
    if (device.status !== "online") {
      toast({
        title: "Error",
        description: "Device must be online to control playback",
        variant: "destructive",
      })
      return
    }

    if ((action === "play" || action === "restart") && !device.assignedPlaylistId) {
      toast({
        title: "Error",
        description: "No playlist assigned to device. Assign a playlist first.",
        variant: "destructive",
      })
      return
    }

    setControlLoading(device.id)

    try {
      console.log("🎮 [SCREENS PAGE] Sending control action:", action, "to device:", device.id)

      const response = await fetch(`/api/devices/${device.id}/control`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      })

      const data = await response.json()

      if (data.success) {
        console.log("✅ [SCREENS PAGE] Control action sent successfully")
        toast({
          title: "Success",
          description: data.message,
        })
        fetchDevices() // Refresh devices list to show updated status
      } else {
        console.error("❌ [SCREENS PAGE] Failed to send control action:", data.error)
        toast({
          title: "Error",
          description: data.error || "Failed to control device",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("💥 [SCREENS PAGE] Error controlling device:", error)
      toast({
        title: "Error",
        description: "Failed to control device",
        variant: "destructive",
      })
    } finally {
      setControlLoading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "online":
        return (
          <Badge variant="default" className="bg-green-500">
            <Wifi className="w-3 h-3 mr-1" />
            Online
          </Badge>
        )
      case "offline":
        return (
          <Badge variant="secondary">
            <WifiOff className="w-3 h-3 mr-1" />
            Offline
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPlaylistStatusBadge = (status: string) => {
    switch (status) {
      case "playing":
        return (
          <Badge variant="default" className="bg-blue-500">
            <Play className="w-3 h-3 mr-1" />
            Playing
          </Badge>
        )
      case "paused":
        return (
          <Badge variant="secondary">
            <Pause className="w-3 h-3 mr-1" />
            Paused
          </Badge>
        )
      case "stopped":
        return (
          <Badge variant="outline">
            <Square className="w-3 h-3 mr-1" />
            Stopped
          </Badge>
        )
      case "assigned":
        return (
          <Badge variant="outline">
            <List className="w-3 h-3 mr-1" />
            Assigned
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatLastSeen = (lastSeen: string) => {
    const date = new Date(lastSeen)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return `${Math.floor(diffMins / 1440)}d ago`
  }

  useEffect(() => {
    fetchDevices()
    fetchPlaylists()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Screens</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Screens</h1>
        <AddScreenDialog onDeviceAdded={fetchDevices} />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Screens</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Registered devices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
            <Wifi className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.online}</div>
            <p className="text-xs text-muted-foreground">Connected devices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
            <WifiOff className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.offline}</div>
            <p className="text-xs text-muted-foreground">Disconnected devices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Playing</CardTitle>
            <Play className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.playing}</div>
            <p className="text-xs text-muted-foreground">Active playback</p>
          </CardContent>
        </Card>
      </div>

      {/* Devices List */}
      <div className="grid gap-4">
        {devices.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Monitor className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No screens registered</h3>
              <p className="text-muted-foreground text-center mb-4">
                Add your first screen to start displaying content
              </p>
              <AddScreenDialog onDeviceAdded={fetchDevices} />
            </CardContent>
          </Card>
        ) : (
          devices.map((device) => (
            <Card key={device.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Monitor className="h-5 w-5" />
                    <div>
                      <CardTitle className="text-lg">{device.name}</CardTitle>
                      <CardDescription>
                        {device.deviceType} • Created {new Date(device.createdAt).toLocaleDateString()}
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
                  {/* Device Info */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Last seen: {formatLastSeen(device.lastSeen)}</span>
                      </div>
                      {device.lastControlAction && device.lastControlTime && (
                        <div className="flex items-center space-x-1">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Last action: {device.lastControlAction} ({formatLastSeen(device.lastControlTime)})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Playlist Assignment */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Assigned Playlist</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDevice(device)
                          setAssignDialogOpen(true)
                        }}
                      >
                        <List className="h-4 w-4 mr-2" />
                        {device.playlist ? "Change" : "Assign"}
                      </Button>
                    </div>

                    {device.playlist ? (
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium">{device.playlist.name}</p>
                          <p className="text-sm text-muted-foreground">{device.playlist.itemCount} items</p>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              Remove
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove playlist assignment?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will unassign the playlist from "{device.name}" and stop any current playback.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleUnassignPlaylist(device)}>
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ) : (
                      <div className="p-3 bg-muted rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">No playlist assigned</p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Playback Controls */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Playback Controls</h4>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleControlDevice(device, "play")}
                        disabled={
                          device.status !== "online" || !device.assignedPlaylistId || controlLoading === device.id
                        }
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Play
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleControlDevice(device, "pause")}
                        disabled={device.status !== "online" || controlLoading === device.id}
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleControlDevice(device, "stop")}
                        disabled={device.status !== "online" || controlLoading === device.id}
                      >
                        <Square className="h-4 w-4 mr-2" />
                        Stop
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleControlDevice(device, "restart")}
                        disabled={
                          device.status !== "online" || !device.assignedPlaylistId || controlLoading === device.id
                        }
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restart
                      </Button>
                    </div>
                    {device.status !== "online" && (
                      <p className="text-xs text-muted-foreground">Device must be online to control playback</p>
                    )}
                    {device.status === "online" && !device.assignedPlaylistId && (
                      <p className="text-xs text-muted-foreground">Assign a playlist to enable play/restart controls</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Assign Playlist Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Playlist</DialogTitle>
            <DialogDescription>Choose a playlist to assign to "{selectedDevice?.name}"</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedPlaylistId} onValueChange={setSelectedPlaylistId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a playlist" />
              </SelectTrigger>
              <SelectContent>
                {playlists.map((playlist) => (
                  <SelectItem key={playlist.id} value={playlist.id.toString()}>
                    {playlist.name} ({playlist.itemCount} items)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {playlists.length === 0 && (
              <p className="text-sm text-muted-foreground">No playlists available. Create a playlist first.</p>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignPlaylist} disabled={!selectedPlaylistId || playlists.length === 0}>
              Assign Playlist
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
