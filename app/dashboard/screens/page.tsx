"use client"

import { useState, useEffect } from "react"
import { MoreHorizontal, Plus, Monitor, Wifi, WifiOff, Settings, Trash2, Eye, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AddScreenDialog } from "@/components/add-screen-dialog"

interface Device {
  id: string
  screenName: string
  deviceType: string
  location?: string
  status: string
  resolution: string
  lastSeen: string
}

export default function ScreensPage() {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchDevices = async () => {
    try {
      setError("")
      console.log("[SCREENS] Fetching devices...")

      const response = await fetch("/api/devices", {
        method: "GET",
        credentials: "include",
      })

      const data = await response.json()
      console.log("[SCREENS] Devices response:", data)

      if (data.success) {
        setDevices(data.devices || [])
        console.log(`[SCREENS] Loaded ${data.devices?.length || 0} devices`)
      } else {
        setError(data.message || "Failed to fetch devices")
        console.error("[SCREENS] Failed to fetch devices:", data.message)
      }
    } catch (error) {
      console.error("[SCREENS] Network error:", error)
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDevices()
  }, [])

  const handleRefresh = () => {
    setLoading(true)
    fetchDevices()
  }

  const handleDeviceAdded = () => {
    console.log("[SCREENS] Device added, refreshing list...")
    fetchDevices()
  }

  const handleDeleteDevice = async (deviceId: string) => {
    try {
      const response = await fetch(`/api/devices/${deviceId}`, {
        method: "DELETE",
        credentials: "include",
      })

      const data = await response.json()

      if (data.success) {
        setDevices(devices.filter((d) => d.id !== deviceId))
      } else {
        setError(data.message || "Failed to delete device")
      }
    } catch (error) {
      console.error("Failed to delete device:", error)
      setError("Failed to delete device")
    }
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
            <p className="text-gray-600">Manage your digital displays and monitor their status</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
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
        <div className="grid gap-4 md:grid-cols-3">
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
              <Card key={device.id}>
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
                      <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteDevice(device.id)}>
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
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Device Type</span>
                      <span className="text-sm capitalize">{device.deviceType.replace("_", " ")}</span>
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
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                      Configure
                    </Button>
                    <Button size="sm" className="flex-1">
                      View Live
                    </Button>
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
