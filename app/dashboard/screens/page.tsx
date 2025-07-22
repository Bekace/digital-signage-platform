"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AddScreenDialog } from "@/components/add-screen-dialog"
import { AssignPlaylistDialog } from "@/components/assign-playlist-dialog"
import { RepairScreenDialog } from "@/components/repair-screen-dialog"
import { ScreenPreviewModal } from "@/components/screen-preview-modal"
import { DashboardLayout } from "@/components/dashboard-layout"
import { toast } from "sonner"
import {
  Plus,
  Monitor,
  MoreVertical,
  Wifi,
  WifiOff,
  Play,
  Settings,
  Trash2,
  PlayCircle,
  RefreshCw,
  AlertCircle,
  Clock,
  Link,
  Eye,
} from "lucide-react"

interface Device {
  id: string
  name: string
  device_type: string
  status: string
  last_seen?: string
  created_at: string
  assigned_playlist_id?: number
  assigned_playlist_name?: string
  playlist_status?: string
  platform?: string
  screen_resolution?: string
  capabilities?: string[]
  user_id?: number
}

const getDeviceIcon = (deviceType: string) => {
  const type = deviceType?.toLowerCase() || "unknown"
  switch (type) {
    case "fire_tv":
    case "firetv":
      return <Monitor className="h-5 w-5" />
    case "web_browser":
    case "web":
      return <Monitor className="h-5 w-5" />
    case "android":
    case "mobile":
      return <Monitor className="h-5 w-5" />
    default:
      return <Monitor className="h-5 w-5" />
  }
}

export default function ScreensPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [showRepairDialog, setShowRepairDialog] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)

  useEffect(() => {
    loadDevices()
  }, [])

  const loadDevices = async () => {
    try {
      setLoading(true)
      setError("")

      console.log("📱 [SCREENS PAGE] Loading devices from database...")

      const response = await fetch("/api/devices", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("📱 [SCREENS PAGE] API response status:", response.status)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("📱 [SCREENS PAGE] API response data:", data)

      if (data.success) {
        // ONLY use real database data - NO MOCK DATA EVER
        const realDevices = data.devices || []
        console.log("📱 [SCREENS PAGE] Setting ONLY real database devices:", realDevices)
        console.log("📱 [SCREENS PAGE] Device count from database:", realDevices.length)

        // Log each device for debugging
        realDevices.forEach((device: Device, index: number) => {
          console.log(`📱 [SCREENS PAGE] Real Device ${index + 1}:`, {
            id: device.id,
            name: device.name,
            device_type: device.device_type,
            status: device.status,
            user_id: device.user_id,
            created_at: device.created_at,
          })
        })

        setDevices(realDevices)
      } else {
        console.error("📱 [SCREENS PAGE] API returned error:", data.error)
        setError(data.error || "Failed to load devices")
      }
    } catch (err) {
      console.error("📱 [SCREENS PAGE] Error loading devices:", err)
      setError("Failed to connect to server")
    } finally {
      setLoading(false)
    }
  }

  const handleDeviceAdded = () => {
    console.log("📱 [SCREENS PAGE] Device added, reloading...")
    loadDevices()
    toast.success("Screen added successfully!")
  }

  const handlePlaylistAssigned = () => {
    loadDevices()
    setSelectedDevice(null)
    setShowAssignDialog(false)
  }

  const handleRepairCompleted = () => {
    loadDevices()
    setSelectedDevice(null)
    setShowRepairDialog(false)
  }

  const handleAssignPlaylist = (device: Device) => {
    setSelectedDevice(device)
    setShowAssignDialog(true)
  }

  const handleRepairScreen = (device: Device) => {
    setSelectedDevice(device)
    setShowRepairDialog(true)
  }

  const handlePreviewScreen = (device: Device) => {
    setSelectedDevice(device)
    setShowPreviewModal(true)
  }

  const handleDeleteDevice = async (deviceId: string, deviceName: string) => {
    if (!confirm(`Are you sure you want to delete "${deviceName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/devices/${deviceId}`, {
        method: "DELETE",
        credentials: "include",
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Screen deleted successfully")
        loadDevices()
      } else {
        toast.error(data.error || "Failed to delete screen")
      }
    } catch (error) {
      console.error("Error deleting device:", error)
      toast.error("Failed to delete screen")
    }
  }

  const getStatusIcon = (device: Device) => {
    switch (device.status) {
      case "online":
        return <Wifi className="h-4 w-4 text-green-500" />
      case "offline":
        return <WifiOff className="h-4 w-4 text-red-500" />
      case "idle":
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (device: Device) => {
    const variant = device.status === "online" ? "default" : device.status === "offline" ? "destructive" : "secondary"

    return (
      <Badge variant={variant} className="capitalize">
        {device.status || "Unknown"}
      </Badge>
    )
  }

  const getPlaylistStatus = (device: Device) => {
    if (!device.assigned_playlist_id) {
      return (
        <div className="flex items-center gap-2 text-gray-500">
          <PlayCircle className="h-4 w-4" />
          <span className="text-sm">No playlist assigned</span>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2 text-green-600">
        <Play className="h-4 w-4" />
        <span className="text-sm font-medium">{device.assigned_playlist_name || "Unnamed Playlist"}</span>
        <Badge variant="outline" className="text-xs">
          {device.playlist_status || "assigned"}
        </Badge>
      </div>
    )
  }

  const formatLastSeen = (lastSeen?: string) => {
    if (!lastSeen) return "Never"

    try {
      const date = new Date(lastSeen)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / (1000 * 60))

      if (diffMins < 1) return "Just now"
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
      return `${Math.floor(diffMins / 1440)}d ago`
    } catch {
      return "Never"
    }
  }

  const formatCreatedAt = (createdAt?: string) => {
    if (!createdAt) return "Unknown"

    try {
      return new Date(createdAt).toLocaleDateString()
    } catch {
      return "Unknown"
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Screens</h1>
              <p className="text-gray-600">Manage your digital signage displays</p>
            </div>
          </div>
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading screens from database...</span>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Screens</h1>
              <p className="text-gray-600">Manage your digital signage displays</p>
            </div>
            <Button onClick={loadDevices} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <br />
              <Button onClick={loadDevices} variant="outline" size="sm" className="mt-2 bg-transparent">
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
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
            <h1 className="text-3xl font-bold">Screens</h1>
            <p className="text-gray-600">Manage your digital signage displays</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Screen
          </Button>
        </div>

        {/* Debug Info */}
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          Database devices found: {devices.length} | Last loaded: {new Date().toLocaleTimeString()}
        </div>

        {/* Devices Grid - ONLY REAL DATABASE DATA */}
        {devices.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Monitor className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No screens found in database</h3>
              <p className="text-gray-600 mb-4">Get started by adding your first digital signage display</p>
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
                      {getDeviceIcon(device.device_type)}
                      <CardTitle className="text-lg">{device.name}</CardTitle>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handlePreviewScreen(device)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Preview Screen
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleAssignPlaylist(device)}>
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Assign Playlist
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRepairScreen(device)}>
                          <Link className="h-4 w-4 mr-2" />
                          Re-pair Device
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled>
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteDevice(device.id, device.name)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardDescription className="capitalize">
                    {device.device_type?.replace("_", " ") || "Unknown Device"} •{" "}
                    {device.platform || "Unknown Platform"}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(device)}
                      <span className="text-sm font-medium">Status</span>
                    </div>
                    {getStatusBadge(device)}
                  </div>

                  {/* Playlist Status */}
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Playlist</span>
                    {getPlaylistStatus(device)}
                  </div>

                  {/* Device Info */}
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Resolution:</span>
                      <span>{device.screen_resolution || "Unknown"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last seen:</span>
                      <span>{formatLastSeen(device.last_seen)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Added:</span>
                      <span>{formatCreatedAt(device.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>DB ID:</span>
                      <span className="font-mono text-xs">{device.id}</span>
                    </div>
                  </div>

                  {/* Device Type */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Type</span>
                    <Badge variant="secondary" className="capitalize">
                      {device.device_type?.replace("_", " ") || "Unknown"}
                    </Badge>
                  </div>

                  {/* Preview Button */}
                  <div className="pt-2">
                    <Button
                      onClick={() => handlePreviewScreen(device)}
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={!device.assigned_playlist_id}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {device.assigned_playlist_id ? "Preview Screen" : "No Content to Preview"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add Screen Dialog */}
        <AddScreenDialog open={showAddDialog} onOpenChange={setShowAddDialog} onDeviceAdded={handleDeviceAdded} />

        {/* Assign Playlist Dialog */}
        {selectedDevice && (
          <AssignPlaylistDialog
            open={showAssignDialog}
            onOpenChange={setShowAssignDialog}
            deviceId={selectedDevice.id}
            deviceName={selectedDevice.name}
            currentPlaylistId={selectedDevice.assigned_playlist_id}
            currentPlaylistName={selectedDevice.assigned_playlist_name}
            onPlaylistAssigned={handlePlaylistAssigned}
          />
        )}

        {/* Re-pair Screen Dialog */}
        {selectedDevice && (
          <RepairScreenDialog
            open={showRepairDialog}
            onOpenChange={setShowRepairDialog}
            device={selectedDevice}
            onRepairCompleted={handleRepairCompleted}
          />
        )}

        {/* Screen Preview Modal */}
        {selectedDevice && (
          <ScreenPreviewModal open={showPreviewModal} onOpenChange={setShowPreviewModal} device={selectedDevice} />
        )}
      </div>
    </DashboardLayout>
  )
}
