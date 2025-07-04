"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AddScreenDialog } from "@/components/add-screen-dialog"
import { ScreenSettingsDialog } from "@/components/screen-settings-dialog"
import { AssignPlaylistDialog } from "@/components/assign-playlist-dialog"
import { Monitor, Plus, MoreVertical, Settings, Play, Pause, List, MapPin, Wifi, Battery, Clock } from "lucide-react"

interface Device {
  id: string
  name: string
  location?: string
  notes?: string
  status: "online" | "offline" | "playing" | "paused"
  type: string
  orientation?: "landscape" | "portrait"
  brightness?: number
  volume?: number
  auto_restart?: boolean
  restart_time?: string
  last_seen?: string
  ip_address?: string
  battery_level?: number
  wifi_strength?: number
  code?: string
  created_at?: string
  current_playlist?: {
    id: string
    name: string
    items: number
  }
}

export default function ScreensPage() {
  const { toast } = useToast()
  const [devices, setDevices] = useState<Device[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [showPlaylistDialog, setShowPlaylistDialog] = useState(false)

  useEffect(() => {
    fetchDevices()
  }, [])

  const fetchDevices = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/devices", {
        credentials: "include",
      })

      const data = await response.json()

      if (data.success) {
        setDevices(data.devices || [])
      } else {
        throw new Error(data.error || "Failed to fetch devices")
      }
    } catch (error) {
      console.error("Fetch devices error:", error)
      toast({
        title: "Error",
        description: "Failed to load devices. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeviceAdded = (newDevice: Device) => {
    setDevices([...devices, newDevice])
    setShowAddDialog(false)
  }

  const handleDeviceUpdate = (updatedDevice: Device) => {
    setDevices(devices.map((device) => (device.id === updatedDevice.id ? updatedDevice : device)))
  }

  const handlePlaybackControl = async (deviceId: string, action: "play" | "pause") => {
    try {
      const response = await fetch(`/api/devices/${deviceId}/playback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ action }),
      })

      const data = await response.json()

      if (data.success) {
        // Update device status locally
        setDevices(
          devices.map((device) =>
            device.id === deviceId ? { ...device, status: action === "play" ? "playing" : "paused" } : device,
          ),
        )

        toast({
          title: action === "play" ? "Playback started" : "Playback paused",
          description: `Device ${action === "play" ? "resumed" : "paused"} successfully.`,
        })
      } else {
        throw new Error(data.error || `Failed to ${action} device`)
      }
    } catch (error) {
      console.error(`${action} error:`, error)
      toast({
        title: "Error",
        description: `Failed to ${action} device. Please try again.`,
        variant: "destructive",
      })
    }
  }

  const openSettings = (device: Device) => {
    setSelectedDevice(device)
    setShowSettingsDialog(true)
  }

  const openPlaylistAssignment = (device: Device) => {
    setSelectedDevice(device)
    setShowPlaylistDialog(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
      case "playing":
        return "bg-green-500"
      case "paused":
        return "bg-yellow-500"
      case "offline":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "online":
        return "Online"
      case "playing":
        return "Playing"
      case "paused":
        return "Paused"
      case "offline":
        return "Offline"
      default:
        return "Unknown"
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Screens</h1>
            <p className="text-gray-600">Manage your digital signage displays</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Screen
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {devices.filter((d) => d.status === "online" || d.status === "playing").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Playing</CardTitle>
              <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{devices.filter((d) => d.status === "playing").length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">With Playlists</CardTitle>
              <List className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{devices.filter((d) => d.current_playlist).length}</div>
            </CardContent>
          </Card>
        </div>

        {devices.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Monitor className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No screens found</h3>
              <p className="text-gray-600 text-center mb-4">Get started by adding your first digital signage screen</p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Screen
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {devices.map((device) => (
              <Card key={device.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-5 w-5" />
                      <CardTitle className="text-lg">{device.name || "Unnamed Device"}</CardTitle>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openPlaylistAssignment(device)}>
                          <List className="h-4 w-4 mr-2" />
                          Assign Playlist
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {device.status === "playing" ? (
                          <DropdownMenuItem onClick={() => handlePlaybackControl(device.id, "pause")}>
                            <Pause className="h-4 w-4 mr-2" />
                            Pause
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handlePlaybackControl(device.id, "play")}>
                            <Play className="h-4 w-4 mr-2" />
                            Play
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openSettings(device)}>
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(device.status)}>{getStatusText(device.status)}</Badge>
                    <span className="text-sm text-gray-500">{device.type || "Unknown"}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {device.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      {device.location}
                    </div>
                  )}

                  {/* Current Playlist */}
                  {device.current_playlist ? (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-sm">
                        <List className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-900">{device.current_playlist.name}</span>
                      </div>
                      <p className="text-xs text-blue-700 mt-1">{device.current_playlist.items} items</p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <List className="h-4 w-4" />
                        <span>No playlist assigned</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Last seen:</span>
                    <span>{device.last_seen ? new Date(device.last_seen).toLocaleDateString() : "Never"}</span>
                  </div>

                  {device.orientation && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Orientation:</span>
                      <span className="capitalize">{device.orientation}</span>
                    </div>
                  )}

                  {(device.battery_level !== undefined || device.wifi_strength !== undefined) && (
                    <div className="flex items-center gap-4 text-sm">
                      {device.battery_level !== undefined && (
                        <div className="flex items-center gap-1">
                          <Battery className="h-4 w-4" />
                          <span>{device.battery_level}%</span>
                        </div>
                      )}
                      {device.wifi_strength !== undefined && (
                        <div className="flex items-center gap-1">
                          <Wifi className="h-4 w-4" />
                          <span>{device.wifi_strength}%</span>
                        </div>
                      )}
                    </div>
                  )}

                  {device.auto_restart && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <Clock className="h-4 w-4" />
                      Auto restart at {device.restart_time || "02:00"}
                    </div>
                  )}

                  {device.notes && <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{device.notes}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <AddScreenDialog open={showAddDialog} onOpenChange={setShowAddDialog} onDeviceAdded={handleDeviceAdded} />

        <ScreenSettingsDialog
          device={selectedDevice}
          open={showSettingsDialog}
          onOpenChange={setShowSettingsDialog}
          onDeviceUpdate={handleDeviceUpdate}
        />

        <AssignPlaylistDialog
          device={selectedDevice}
          open={showPlaylistDialog}
          onOpenChange={setShowPlaylistDialog}
          onAssignmentComplete={fetchDevices}
        />
      </div>
    </DashboardLayout>
  )
}
