"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Monitor, Wifi, WifiOff, Play, Pause, Settings } from "lucide-react"
import { AddScreenDialog } from "@/components/add-screen-dialog"

interface Device {
  id: number
  name: string
  deviceType: string
  status: string
  lastSeen: string
  assignedPlaylistId?: number | null
  playlistStatus: string
  lastControlAction?: string | null
  lastControlTime?: string | null
  createdAt: string
  updatedAt: string
  playlist?: any
}

interface DevicesResponse {
  success: boolean
  devices: Device[]
  stats: {
    total: number
    online: number
    offline: number
    playing: number
  }
  error?: string
  details?: string
}

export default function ScreensPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [stats, setStats] = useState({ total: 0, online: 0, offline: 0, playing: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)

  const fetchDevices = async () => {
    try {
      console.log("📱 [SCREENS PAGE] Fetching devices...")
      setLoading(true)
      setError(null)

      // Get token from localStorage
      const token = localStorage.getItem("token")
      console.log("📱 [SCREENS PAGE] Token found:", !!token)

      if (!token) {
        throw new Error("No authentication token found. Please log in again.")
      }

      const response = await fetch("/api/devices", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      console.log("📱 [SCREENS PAGE] API response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("📱 [SCREENS PAGE] API error response:", errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data: DevicesResponse = await response.json()
      console.log("📱 [SCREENS PAGE] API response data:", data)

      if (data.success) {
        console.log(`📱 [SCREENS PAGE] Successfully loaded ${data.devices.length} devices`)
        setDevices(data.devices)
        setStats(data.stats)
      } else {
        console.error("📱 [SCREENS PAGE] API returned error:", data.error)
        throw new Error(data.error || "Failed to fetch devices")
      }
    } catch (err) {
      console.error("📱 [SCREENS PAGE] Error fetching devices:", err)
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    console.log("📱 [SCREENS PAGE] Component mounted, fetching devices...")
    fetchDevices()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "online":
        return <Wifi className="h-4 w-4 text-green-500" />
      case "playing":
        return <Play className="h-4 w-4 text-blue-500" />
      case "paused":
        return <Pause className="h-4 w-4 text-yellow-500" />
      default:
        return <WifiOff className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "online":
        return (
          <Badge variant="default" className="bg-green-500">
            Online
          </Badge>
        )
      case "playing":
        return (
          <Badge variant="default" className="bg-blue-500">
            Playing
          </Badge>
        )
      case "paused":
        return <Badge variant="secondary">Paused</Badge>
      default:
        return <Badge variant="outline">Offline</Badge>
    }
  }

  const handleScreenAdded = () => {
    console.log("📱 [SCREENS PAGE] Screen added, refreshing devices...")
    fetchDevices()
    setShowAddDialog(false)
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Screens</h1>
            <p className="text-muted-foreground">Manage your digital signage displays</p>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading screens...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Screens</h1>
          <p className="text-muted-foreground">Manage your digital signage displays</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Screen
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
            <Wifi className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.online}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
            <WifiOff className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.offline}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Playing</CardTitle>
            <Play className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.playing}</div>
          </CardContent>
        </Card>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50 mb-6">
          <CardHeader>
            <CardTitle className="text-red-800">Error Loading Screens</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={fetchDevices} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Devices List */}
      {devices.length === 0 && !error ? (
        <Card>
          <CardHeader>
            <CardTitle>No Screens Found</CardTitle>
            <CardDescription>You haven't added any screens yet. Click "Add Screen" to get started.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Screen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((device) => (
            <Card key={device.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {getStatusIcon(device.status)}
                    {device.name}
                  </CardTitle>
                  {getStatusBadge(device.status)}
                </div>
                <CardDescription>
                  {device.deviceType} • ID: {device.id}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Last Seen:</span>
                    <span>{new Date(device.lastSeen).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Playlist:</span>
                    <span>{device.playlist?.name || "None assigned"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{new Date(device.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                    <Settings className="h-4 w-4 mr-1" />
                    Settings
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                    Assign Playlist
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Screen Dialog */}
      <AddScreenDialog open={showAddDialog} onOpenChange={setShowAddDialog} onScreenAdded={handleScreenAdded} />
    </div>
  )
}
