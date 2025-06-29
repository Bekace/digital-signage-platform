"use client"

import { useState, useEffect } from "react"
import {
  MoreHorizontal,
  Plus,
  Monitor,
  Wifi,
  WifiOff,
  Settings,
  Trash2,
  Eye,
  RefreshCw,
  Play,
  Pause,
  RotateCcw,
  List,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AddScreenDialog } from "@/components/add-screen-dialog"

interface Device {
  id: string
  screenName: string
  deviceType: string
  platform: string
  status: string
  location: string
  resolution: string
  lastSeen: string
  registeredAt: string
  currentPlaylist?: {
    id: number
    name: string
    status: "playing" | "paused" | "stopped"
    currentItem?: string
  }
}

interface Playlist {
  id: number
  name: string
  itemCount: number
}

export default function ScreensPage() {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [devices, setDevices] = useState<Device[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [assigningDevice, setAssigningDevice] = useState<string | null>(null)
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>("")

  const fetchDevices = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setError("Please log in to view devices")
        return
      }

      const response = await fetch("/api/devices", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        setDevices(data.devices)
      } else {
        setError(data.message || "Failed to fetch devices")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    }
  }

  const fetchPlaylists = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await fetch("/api/playlists", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (data.success) {
        setPlaylists(data.playlists)
      }
    } catch (error) {
      console.error("Failed to fetch playlists:", error)
    }
  }

  const assignPlaylist = async (deviceId: string, playlistId: string) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await fetch(`/api/devices/${deviceId}/assign-playlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ playlistId: Number.parseInt(playlistId) }),
      })

      const data = await response.json()
      if (data.success) {
        setAssigningDevice(null)
        setSelectedPlaylist("")
        fetchDevices() // Refresh devices to show updated assignment
      } else {
        setError(data.message || "Failed to assign playlist")
      }
    } catch (error) {
      setError("Failed to assign playlist")
    }
  }

  const controlDevice = async (deviceId: string, action: "play" | "pause" | "stop" | "restart") => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await fetch(`/api/devices/${deviceId}/control`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      })

      const data = await response.json()
      if (data.success) {
        fetchDevices() // Refresh to show updated status
      } else {
        setError(data.message || `Failed to ${action} device`)
      }
    } catch (error) {
      setError(`Failed to ${action} device`)
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

  const handleRefresh = () => {
    setLoading(true)
    Promise.all([fetchDevices(), fetchPlaylists()]).finally(() => setLoading(false))
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Loading devices...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Screens</h1>
            <p className="text-gray-600">Manage your digital displays and control their content</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Screen
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Screens</CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{devices.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Online</CardTitle>
              <Wifi className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {devices.filter((d) => d.status === "online").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Playing</CardTitle>
              <Play className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {devices.filter((d) => d.currentPlaylist?.status === "playing").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Offline</CardTitle>
              <WifiOff className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {devices.filter((d) => d.status === "offline").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Devices Grid */}
        {devices.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Monitor className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No screens connected</h3>
              <p className="text-gray-600 mb-4">Get started by adding your first display device</p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Screen
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {devices.map((device) => (
              <Card key={device.id} className="relative">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center space-x-2">
                    <Monitor className="h-5 w-5" />
                    <CardTitle className="text-lg">{device.screenName}</CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="h-4 w-4 mr-2" />
                        View Screen
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Status</span>
                      <Badge variant={device.status === "online" ? "default" : "destructive"}>
                        {device.status === "online" ? (
                          <>
                            <Wifi className="h-3 w-3 mr-1" />
                            Online
                          </>
                        ) : (
                          <>
                            <WifiOff className="h-3 w-3 mr-1" />
                            Offline
                          </>
                        )}
                      </Badge>
                    </div>

                    {/* Current Playlist */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Playlist</span>
                      <div className="flex items-center space-x-1">
                        {device.currentPlaylist ? (
                          <>
                            <Badge variant="outline" className="text-xs">
                              {device.currentPlaylist.name}
                            </Badge>
                            <Badge
                              variant={
                                device.currentPlaylist.status === "playing"
                                  ? "default"
                                  : device.currentPlaylist.status === "paused"
                                    ? "secondary"
                                    : "destructive"
                              }
                              className="text-xs"
                            >
                              {device.currentPlaylist.status}
                            </Badge>
                          </>
                        ) : (
                          <span className="text-xs text-gray-500">None assigned</span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Device Type</span>
                      <span className="text-sm capitalize">{device.deviceType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Location</span>
                      <span className="text-sm">{device.location || "Not set"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Resolution</span>
                      <span className="text-sm">{device.resolution}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Last Seen</span>
                      <span className="text-sm">{new Date(device.lastSeen).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Control Buttons */}
                  <div className="space-y-2">
                    {/* Playlist Assignment */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full bg-transparent">
                          <List className="h-4 w-4 mr-2" />
                          {device.currentPlaylist ? "Change Playlist" : "Assign Playlist"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Assign Playlist to {device.screenName}</DialogTitle>
                          <DialogDescription>Select a playlist to display on this screen</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="playlist">Playlist</Label>
                            <Select value={selectedPlaylist} onValueChange={setSelectedPlaylist}>
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
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setSelectedPlaylist("")}>
                              Cancel
                            </Button>
                            <Button
                              onClick={() => assignPlaylist(device.id, selectedPlaylist)}
                              disabled={!selectedPlaylist}
                            >
                              Assign Playlist
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Playback Controls */}
                    {device.currentPlaylist && device.status === "online" && (
                      <div className="flex space-x-1">
                        {device.currentPlaylist.status === "playing" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 bg-transparent"
                            onClick={() => controlDevice(device.id, "pause")}
                          >
                            <Pause className="h-4 w-4 mr-1" />
                            Pause
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 bg-transparent"
                            onClick={() => controlDevice(device.id, "play")}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Play
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-transparent"
                          onClick={() => controlDevice(device.id, "restart")}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Restart
                        </Button>
                      </div>
                    )}

                    {/* View Live Button */}
                    <Button size="sm" className="w-full" disabled={device.status === "offline"}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Live
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <AddScreenDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
      </div>
    </DashboardLayout>
  )
}
