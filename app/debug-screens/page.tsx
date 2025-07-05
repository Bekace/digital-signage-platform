"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Database, Monitor } from "lucide-react"

interface Device {
  id: number
  name: string
  device_id: string
  type: string
  status: string
  location: string
  last_seen: string
  current_playlist?: string
}

export default function DebugScreensPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(false)
  const [rawData, setRawData] = useState<any>(null)

  const fetchDevices = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/devices", {
        credentials: "include",
      })

      const data = await response.json()
      setRawData(data)

      if (data.success) {
        setDevices(data.devices || [])
      } else {
        console.error("API Error:", data.error)
      }
    } catch (error) {
      console.error("Fetch error:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDevices()
  }, [])

  const onlineDevices = devices.filter((d) => d.status === "online")
  const offlineDevices = devices.filter((d) => d.status === "offline")
  const devicesWithPlaylists = devices.filter((d) => d.current_playlist)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Debug Screens</h1>
        <Button onClick={fetchDevices} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{devices.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Online</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{onlineDevices.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Offline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{offlineDevices.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">With Playlists</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{devicesWithPlaylists.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* All Devices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            All Devices
          </CardTitle>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No devices found</p>
          ) : (
            <div className="space-y-3">
              {devices.map((device) => (
                <div key={device.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{device.name || "Unnamed Device"}</h3>
                      <p className="text-sm text-gray-600">{device.location || "No location"}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        <span>ID: {device.id}</span>
                        <span>Device ID: {device.device_id}</span>
                        <span>Type: {device.type}</span>
                        <span>Last Seen: {device.last_seen || "Never"}</span>
                      </div>
                      {device.current_playlist && (
                        <div className="text-xs text-blue-600 mt-1">Playlist: {device.current_playlist}</div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        className={
                          device.status === "online" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }
                      >
                        {device.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Raw API Response */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Raw API Response
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-60">
            {JSON.stringify(rawData, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
