"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Plus, Monitor, Smartphone, Tv, Globe, Wifi, WifiOff, Play, Pause, Square, MoreHorizontal } from "lucide-react"
import { AddScreenDialog } from "@/components/add-screen-dialog"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Device {
  id: number
  name: string
  deviceType: string
  status: string
  lastSeen?: string
  assignedPlaylistId?: number
  playlistStatus?: string
  lastControlAction?: string
  lastControlTime?: string
  createdAt: string
  updatedAt?: string
}

export default function ScreensPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [addScreenOpen, setAddScreenOpen] = useState(false)

  const fetchDevices = async () => {
    try {
      setLoading(true)
      console.log("📱 [SCREENS] Fetching devices...")

      const token = localStorage.getItem("token")
      if (!token) {
        toast.error("Please log in to view screens")
        return
      }

      const response = await fetch("/api/devices", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      console.log("📱 [SCREENS] Devices response:", data)

      if (data.success) {
        setDevices(data.devices || [])
      } else {
        toast.error(data.error || "Failed to fetch devices")
      }
    } catch (error) {
      console.error("❌ [SCREENS] Error fetching devices:", error)
      toast.error("Failed to fetch devices")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDevices()
  }, [])

  const getDeviceIcon = (deviceType: string) => {
    if (!deviceType) return Monitor

    switch (deviceType.toLowerCase()) {
      case "fire_tv":
      case "android_tv":
        return Tv
      case "android":
      case "ios":
        return Smartphone
      case "web":
        return Globe
      default:
        return Monitor
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "online":
        return "bg-green-500"
      case "offline":
        return "bg-red-500"
      case "connecting":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "online":
        return <Wifi className="h-4 w-4" />
      case "offline":
        return <WifiOff className="h-4 w-4" />
      default:
        return <WifiOff className="h-4 w-4" />
    }
  }

  const formatDeviceType = (deviceType: string) => {
    if (!deviceType) return "Unknown"

    switch (deviceType.toLowerCase()) {
      case "fire_tv":
        return "Fire TV"
      case "android_tv":
        return "Android TV"
      case "android":
        return "Android"
      case "ios":
        return "iOS"
      case "web":
        return "Web Browser"
      default:
        return deviceType
    }
  }

  const formatLastSeen = (lastSeen: string | undefined) => {
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
      return "Unknown"
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Screens</h1>
            <p className="text-muted-foreground">Manage your digital signage displays and monitor their status</p>
          </div>
          <Button onClick={() => setAddScreenOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Screen
          </Button>
        </div>

        <Separator />

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : devices.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Monitor className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No screens found</h3>
              <p className="text-muted-foreground text-center mb-4">
                Get started by adding your first digital signage display
              </p>
              <Button onClick={() => setAddScreenOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Screen
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {devices.map((device) => {
              const DeviceIcon = getDeviceIcon(device.deviceType)
              return (
                <Card key={device.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DeviceIcon className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-lg">{device.name}</CardTitle>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Play className="h-4 w-4 mr-2" />
                            Play Content
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Pause className="h-4 w-4 mr-2" />
                            Pause
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Square className="h-4 w-4 mr-2" />
                            Stop
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardDescription>{formatDeviceType(device.deviceType)}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(device.status)}
                        <span className="text-sm font-medium">
                          {device.status?.charAt(0).toUpperCase() + device.status?.slice(1) || "Unknown"}
                        </span>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(device.status)}`} />
                    </div>

                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Last seen:</span>
                        <span>{formatLastSeen(device.lastSeen)}</span>
                      </div>
                      {device.playlistStatus && device.playlistStatus !== "none" && (
                        <div className="flex justify-between">
                          <span>Playlist:</span>
                          <Badge variant="outline" className="text-xs">
                            {device.playlistStatus}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        <AddScreenDialog open={addScreenOpen} onOpenChange={setAddScreenOpen} onScreenAdded={fetchDevices} />
      </div>
    </DashboardLayout>
  )
}
