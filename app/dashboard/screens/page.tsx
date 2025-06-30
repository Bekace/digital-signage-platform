"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Monitor, Smartphone, Tv, Wifi, WifiOff, Play, Pause, RotateCcw } from "lucide-react"
import { AddScreenDialog } from "@/components/add-screen-dialog"

interface Device {
  id: number
  name: string
  device_type: string
  status: string
  playlist_status?: string
  assigned_playlist_id?: number
  last_seen?: string
  created_at: string
  updated_at?: string
}

export default function ScreensPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)

  const fetchDevices = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/devices", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/login"
          return
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        setDevices(data.devices || [])
      } else {
        setError(data.message || "Failed to fetch devices")
      }
    } catch (err) {
      console.error("Fetch devices error:", err)
      setError(err.message || "Failed to fetch devices")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDevices()
  }, [])

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case "fire_tv":
      case "android_tv":
        return <Tv className="h-5 w-5" />
      case "mobile":
        return <Smartphone className="h-5 w-5" />
      default:
        return <Monitor className="h-5 w-5" />
    }
  }

  const getStatusBadge = (status: string) => {
    const isOnline = status === "online"
    return (
      <Badge variant={isOnline ? "default" : "secondary"} className="flex items-center gap-1">
        {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
        {status}
      </Badge>
    )
  }

  const getPlaylistStatusBadge = (playlistStatus?: string) => {
    if (!playlistStatus || playlistStatus === "none") {
      return <Badge variant="outline">No Playlist</Badge>
    }

    switch (playlistStatus) {
      case "playing":
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <Play className="h-3 w-3" />
            Playing
          </Badge>
        )
      case "paused":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Pause className="h-3 w-3" />
            Paused
          </Badge>
        )
      default:
        return <Badge variant="outline">{playlistStatus}</Badge>
    }
  }

  const handleDeviceAdded = () => {
    setShowAddDialog(false)
    fetchDevices() // Refresh the list
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RotateCcw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading screens...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Screens</h1>
          <p className="text-muted-foreground">Manage your digital signage displays</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Screen
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            <div className="flex justify-between items-center">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={fetchDevices}>
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {devices.length === 0 && !error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Monitor className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No screens found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Get started by adding your first digital signage screen
            </p>
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
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {getDeviceIcon(device.device_type)}
                  {device.name}
                </CardTitle>
                {getStatusBadge(device.status)}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="capitalize">{device.device_type.replace("_", " ")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Playlist:</span>
                    {getPlaylistStatusBadge(device.playlist_status)}
                  </div>
                  {device.last_seen && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last seen:</span>
                      <span>{new Date(device.last_seen).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Added:</span>
                    <span>{new Date(device.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddScreenDialog open={showAddDialog} onOpenChange={setShowAddDialog} onDeviceAdded={handleDeviceAdded} />
    </div>
  )
}
