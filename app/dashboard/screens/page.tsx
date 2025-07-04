"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { AddScreenDialog } from "@/components/add-screen-dialog"
import { Monitor, Smartphone, Tv, MoreHorizontal, Trash2, Settings, AlertCircle } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

interface Device {
  id: string
  name: string
  type: string
  status: string
  location?: string
  lastSeen: string
  resolution?: string
}

export default function ScreensPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const { toast } = useToast()

  const fetchDevices = async () => {
    try {
      console.log("Fetching devices...")
      const response = await fetch("/api/devices", {
        credentials: "include",
      })

      const data = await response.json()
      console.log("Devices response:", data)

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      if (data.success) {
        setDevices(data.devices || [])
        setError("")
      } else {
        throw new Error(data.error || "Failed to fetch devices")
      }
    } catch (error) {
      console.error("Fetch devices error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to load devices"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const deleteDevice = async (deviceId: string, deviceName: string) => {
    try {
      const response = await fetch(`/api/devices/${deviceId}`, {
        method: "DELETE",
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      if (data.success) {
        setDevices((prev) => prev.filter((device) => device.id !== deviceId))
        toast({
          title: "Device deleted",
          description: `${deviceName} has been removed`,
        })
      } else {
        throw new Error(data.error || "Failed to delete device")
      }
    } catch (error) {
      console.error("Delete device error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to delete device"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchDevices()
  }, [])

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "android":
        return Smartphone
      case "tv":
        return Tv
      default:
        return Monitor
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500"
      case "offline":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const stats = {
    total: devices.length,
    online: devices.filter((d) => d.status === "online").length,
    offline: devices.filter((d) => d.status === "offline").length,
    playing: devices.filter((d) => d.status === "playing").length,
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Screens</h1>
            <p className="text-gray-600">Manage your digital signage displays</p>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Screens</h1>
          <p className="text-gray-600">Manage your digital signage displays</p>
        </div>
        <AddScreenDialog onDeviceAdded={fetchDevices} />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <div className="h-2 w-2 bg-red-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.offline}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Playing</CardTitle>
            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.playing}</div>
          </CardContent>
        </Card>
      </div>

      {devices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Monitor className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No screens found</h3>
            <p className="text-gray-600 text-center mb-4">Get started by adding your first digital signage screen</p>
            <AddScreenDialog onDeviceAdded={fetchDevices} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((device) => {
            const Icon = getDeviceIcon(device.type)
            return (
              <Card key={device.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center space-x-2">
                    <Icon className="h-5 w-5" />
                    <div>
                      <CardTitle className="text-base">{device.name}</CardTitle>
                      <CardDescription>{device.location || "No location set"}</CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600" onClick={() => deleteDevice(device.id, device.name)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant={device.status === "online" ? "default" : "secondary"}>
                      <div className={`h-2 w-2 rounded-full mr-2 ${getStatusColor(device.status)}`}></div>
                      {device.status}
                    </Badge>
                    <span className="text-sm text-gray-500">{device.resolution || "1920x1080"}</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Last seen: {new Date(device.lastSeen).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
