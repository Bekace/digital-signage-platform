"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Monitor, Smartphone, Tv, Globe, MoreVertical, Play, Pause, Square } from "lucide-react"
import { AddScreenDialog } from "@/components/add-screen-dialog"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Device {
  id: number
  name: string
  deviceType: string
  status: string
  playlistStatus?: string
  assignedPlaylistId?: number
  lastControlAction?: string
  lastControlTime?: string
  createdAt: string
  updatedAt?: string
}

const getDeviceIcon = (deviceType: string) => {
  const type = deviceType?.toLowerCase() || "unknown"
  switch (type) {
    case "fire_tv":
    case "firetv":
      return <Tv className="h-5 w-5" />
    case "web_browser":
    case "web":
      return <Globe className="h-5 w-5" />
    case "android":
    case "mobile":
      return <Smartphone className="h-5 w-5" />
    default:
      return <Monitor className="h-5 w-5" />
  }
}

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "online":
      return "bg-green-500"
    case "offline":
      return "bg-gray-500"
    case "error":
      return "bg-red-500"
    default:
      return "bg-gray-500"
  }
}

const getPlaylistStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "playing":
      return "bg-green-100 text-green-800"
    case "paused":
      return "bg-yellow-100 text-yellow-800"
    case "stopped":
      return "bg-red-100 text-red-800"
    case "none":
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export default function ScreensPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)

  const fetchDevices = async () => {
    try {
      console.log("🔄 [SCREENS] Fetching devices...")
      setLoading(true)
      setError(null)

      const response = await fetch("/api/devices", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      console.log("🔄 [SCREENS] Response status:", response.status)

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/login"
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("🔄 [SCREENS] Response data:", data)

      if (data.success && Array.isArray(data.devices)) {
        setDevices(data.devices)
        console.log("🔄 [SCREENS] Devices loaded:", data.devices.length)
      } else {
        console.error("🔄 [SCREENS] Invalid response format:", data)
        setError("Invalid response format")
      }
    } catch (error) {
      console.error("🔄 [SCREENS] Error fetching devices:", error)
      setError("Failed to load devices")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDevices()
  }, [])

  const handleDeviceAdded = () => {
    console.log("🔄 [SCREENS] Device added, refreshing list...")
    fetchDevices()
    setShowAddDialog(false)
  }

  const handleControlDevice = async (deviceId: number, action: string) => {
    try {
      console.log(`🎮 [SCREENS] Controlling device ${deviceId} with action: ${action}`)

      const response = await fetch(`/api/devices/${deviceId}/control`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        console.log(`🎮 [SCREENS] Control action ${action} sent successfully`)
        fetchDevices() // Refresh to show updated status
      } else {
        console.error(`🎮 [SCREENS] Control action failed:`, response.status)
      }
    } catch (error) {
      console.error(`🎮 [SCREENS] Error controlling device:`, error)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading screens...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchDevices} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Screens</h1>
            <p className="text-muted-foreground">Manage your digital signage displays</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Screen
          </Button>
        </div>

        {devices.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Monitor className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No screens yet</h3>
              <p className="text-gray-600 text-center mb-4">Get started by adding your first digital signage screen</p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
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
                    {getDeviceIcon(device.deviceType)}
                    <CardTitle className="text-lg">{device.name}</CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleControlDevice(device.id, "play")}>
                        <Play className="mr-2 h-4 w-4" />
                        Play
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleControlDevice(device.id, "pause")}>
                        <Pause className="mr-2 h-4 w-4" />
                        Pause
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleControlDevice(device.id, "stop")}>
                        <Square className="mr-2 h-4 w-4" />
                        Stop
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(device.status)}`}></div>
                        <Badge variant="outline" className="capitalize">
                          {device.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Device Type</span>
                      <Badge variant="secondary" className="capitalize">
                        {device.deviceType?.replace("_", " ") || "Unknown"}
                      </Badge>
                    </div>

                    {device.playlistStatus && device.playlistStatus !== "none" && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Playlist</span>
                        <Badge className={getPlaylistStatusColor(device.playlistStatus)}>{device.playlistStatus}</Badge>
                      </div>
                    )}

                    <div className="pt-2 border-t">
                      <CardDescription className="text-xs">
                        Added {new Date(device.createdAt).toLocaleDateString()}
                      </CardDescription>
                      {device.updatedAt && (
                        <CardDescription className="text-xs">
                          Last updated {new Date(device.updatedAt).toLocaleDateString()}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <AddScreenDialog open={showAddDialog} onOpenChange={setShowAddDialog} onDeviceAdded={handleDeviceAdded} />
      </div>
    </DashboardLayout>
  )
}
