"use client"

import { useState, useEffect } from "react"
import { Plus, Settings, MoreHorizontal, Play, Pause, RotateCcw, List } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AddScreenDialog } from "@/components/add-screen-dialog"
import { ScreenSettingsDialog } from "@/components/screen-settings-dialog"
import { AssignPlaylistDialog } from "@/components/assign-playlist-dialog"
import { toast } from "@/hooks/use-toast"

interface Device {
  id: string
  name: string
  type: string
  status: string
  location?: string
  resolution?: string
  lastSeen: string
  current_playlist?: {
    id: string
    name: string
    items: number
  }
}

export default function ScreensPage() {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDevices = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("🖥️ Fetching devices...")

      const response = await fetch("/api/devices", {
        credentials: "include",
      })

      const data = await response.json()
      console.log("🖥️ Devices API response:", data)

      if (data.success) {
        setDevices(data.devices || [])
      } else {
        throw new Error(data.error || "Failed to fetch devices")
      }
    } catch (error) {
      console.error("🖥️ Failed to fetch devices:", error)
      setError(error instanceof Error ? error.message : "Failed to load devices")
      toast({
        title: "Error",
        description: "Failed to load devices",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDevices()
  }, [])

  const handleDeviceAdded = () => {
    fetchDevices()
    setShowAddDialog(false)
  }

  const handleSettingsClick = (device: Device) => {
    setSelectedDevice(device)
    setShowSettingsDialog(true)
  }

  const handleAssignClick = (device: Device) => {
    setSelectedDevice(device)
    setShowAssignDialog(true)
  }

  const handleSettingsUpdated = () => {
    fetchDevices()
    setShowSettingsDialog(false)
    setSelectedDevice(null)
  }

  const handleAssignmentComplete = () => {
    fetchDevices()
    setShowAssignDialog(false)
    setSelectedDevice(null)
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

      if (response.ok) {
        toast({
          title: "Success",
          description: `Playback ${action}d successfully`,
        })
        fetchDevices()
      } else {
        throw new Error(`Failed to ${action} playback`)
      }
    } catch (error) {
      console.error("Playback control error:", error)
      toast({
        title: "Error",
        description: `Failed to ${action} playback`,
        variant: "destructive",
      })
    }
  }

  const handleRestart = async (deviceId: string) => {
    try {
      const response = await fetch(`/api/devices/${deviceId}/restart`, {
        method: "POST",
        credentials: "include",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Device restart initiated",
        })
        fetchDevices()
      } else {
        throw new Error("Failed to restart device")
      }
    } catch (error) {
      console.error("Restart error:", error)
      toast({
        title: "Error",
        description: "Failed to restart device",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-100 text-green-800"
      case "playing":
        return "bg-blue-100 text-blue-800"
      case "paused":
        return "bg-yellow-100 text-yellow-800"
      case "offline":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="text-center">Loading screens...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="text-center text-red-600">
            <p>Error: {error}</p>
            <Button onClick={fetchDevices} className="mt-2">
              Retry
            </Button>
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
            <p className="text-gray-600">Manage your digital signage displays</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.open("/debug-screens", "_blank")}>
              Debug Screens
            </Button>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Screen
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Screens</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{devices.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Online</CardTitle>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
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
                {devices.filter((d) => d.status === "playing").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">With Playlists</CardTitle>
              <List className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {devices.filter((d) => d.current_playlist).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Screens Grid */}
        {devices.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <div className="text-gray-400 mb-4">📺</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No screens yet</h3>
              <p className="text-gray-500 mb-4">Add your first screen to get started</p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Screen
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {devices.map((device) => (
              <Card key={device.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center space-x-2">
                    <div className="text-2xl">📺</div>
                    <CardTitle className="text-lg">{device.name || "Unnamed Device"}</CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleSettingsClick(device)}>
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAssignClick(device)}>
                        <List className="h-4 w-4 mr-2" />
                        Assign Playlist
                      </DropdownMenuItem>
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
                      <DropdownMenuItem onClick={() => handleRestart(device.id)}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restart
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Badge className={getStatusColor(device.status)}>{device.status}</Badge>
                    <Badge variant="outline">{device.type}</Badge>
                  </div>

                  {device.current_playlist && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-sm font-medium text-blue-900">Currently Playing:</div>
                      <div className="text-sm text-blue-700">{device.current_playlist.name}</div>
                      <div className="text-xs text-blue-600">{device.current_playlist.items} items</div>
                    </div>
                  )}

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span>{device.location || "Not set"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Resolution:</span>
                      <span>{device.resolution || "1920x1080"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Seen:</span>
                      <span>{new Date(device.lastSeen).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent"
                      onClick={() => handleSettingsClick(device)}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Settings
                    </Button>
                    <Button size="sm" className="flex-1" onClick={() => handleAssignClick(device)}>
                      <List className="h-4 w-4 mr-1" />
                      Assign
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <AddScreenDialog open={showAddDialog} onOpenChange={setShowAddDialog} onDeviceAdded={handleDeviceAdded} />

        {selectedDevice && (
          <ScreenSettingsDialog
            device={selectedDevice}
            open={showSettingsDialog}
            onOpenChange={setShowSettingsDialog}
            onSettingsUpdated={handleSettingsUpdated}
          />
        )}

        {selectedDevice && (
          <AssignPlaylistDialog
            device={selectedDevice}
            open={showAssignDialog}
            onOpenChange={setShowAssignDialog}
            onAssignmentComplete={handleAssignmentComplete}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
