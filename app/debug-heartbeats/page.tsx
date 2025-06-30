"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  Heart,
  Monitor,
  Activity,
  Clock,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Database,
} from "lucide-react"

interface HeartbeatData {
  id: number
  device_id: number
  device_name: string
  device_type: string
  status: string
  current_item_id: number | null
  progress: number
  performance_metrics: any
  created_at: string
  updated_at: string
  device_last_seen: string
  device_status: string
}

interface HeartbeatStats {
  total_heartbeats: number
  active_devices: number
  avg_progress: number
  online_count: number
  offline_count: number
  recent_heartbeats: number
}

interface ActivityData {
  hour: string
  heartbeat_count: number
  unique_devices: number
}

interface DeviceWithoutHeartbeat {
  id: number
  name: string
  device_type: string
  status: string
  last_seen: string
  created_at: string
}

export default function DebugHeartbeatsPage() {
  const [data, setData] = useState<{
    heartbeats: HeartbeatData[]
    statistics: HeartbeatStats
    recentActivity: ActivityData[]
    devicesWithoutHeartbeats: DeviceWithoutHeartbeat[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(false)

  const fetchHeartbeatData = async () => {
    try {
      console.log("🔍 Fetching heartbeat debug data...")
      const response = await fetch("/api/debug-heartbeats")
      const result = await response.json()

      if (result.success) {
        setData(result.data)
        console.log("✅ Heartbeat data loaded:", result.data)
      } else {
        toast.error("Failed to load heartbeat data")
        console.error("❌ Heartbeat data error:", result.error)
      }
    } catch (error) {
      console.error("❌ Error fetching heartbeat data:", error)
      toast.error("Failed to fetch heartbeat data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHeartbeatData()
  }, [])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchHeartbeatData, 10000) // Refresh every 10 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const getTimeSince = (timestamp: string) => {
    const now = new Date()
    const then = new Date(timestamp)
    const diffMs = now.getTime() - then.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return `${Math.floor(diffMins / 1440)}d ago`
  }

  const getStatusBadge = (status: string) => {
    return status === "online" ? (
      <Badge className="bg-green-500">
        <Wifi className="h-3 w-3 mr-1" />
        Online
      </Badge>
    ) : (
      <Badge variant="secondary">
        <WifiOff className="h-3 w-3 mr-1" />
        Offline
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading heartbeat data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to load heartbeat data</h3>
            <Button onClick={fetchHeartbeatData}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Heart className="h-8 w-8 mr-3 text-red-500" />
            Device Heartbeats Debug
          </h1>
          <p className="text-muted-foreground">Monitor device heartbeat activity and system health</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant={autoRefresh ? "default" : "outline"} onClick={() => setAutoRefresh(!autoRefresh)}>
            <Activity className="h-4 w-4 mr-2" />
            {autoRefresh ? "Auto Refresh ON" : "Auto Refresh OFF"}
          </Button>
          <Button onClick={fetchHeartbeatData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Heartbeats</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.statistics.total_heartbeats || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.statistics.active_devices || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.statistics.online_count || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
            <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.statistics.offline_count || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent (5min)</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.statistics.recent_heartbeats || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.statistics.avg_progress ? `${Math.round(data.statistics.avg_progress)}%` : "0%"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Devices Without Heartbeats */}
      {data.devicesWithoutHeartbeats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
              Devices Without Heartbeats ({data.devicesWithoutHeartbeats.length})
            </CardTitle>
            <CardDescription>These devices exist but have never sent a heartbeat</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.devicesWithoutHeartbeats.map((device) => (
                <div key={device.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{device.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {device.device_type} • Created {getTimeSince(device.created_at)}
                    </p>
                  </div>
                  {getStatusBadge(device.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity (Last 24 Hours)</CardTitle>
          <CardDescription>Heartbeat activity by hour</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.recentActivity.length > 0 ? (
              data.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">
                    {new Date(activity.hour).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                    })}
                  </span>
                  <div className="flex items-center space-x-4 text-sm">
                    <span>{activity.heartbeat_count} heartbeats</span>
                    <span>{activity.unique_devices} devices</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No recent activity</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Latest Heartbeats */}
      <Card>
        <CardHeader>
          <CardTitle>Latest Heartbeats</CardTitle>
          <CardDescription>Most recent heartbeat records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.heartbeats.length > 0 ? (
              data.heartbeats.map((heartbeat) => (
                <div key={heartbeat.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <Monitor className="h-4 w-4" />
                      <div>
                        <p className="font-medium">{heartbeat.device_name || `Device ${heartbeat.device_id}`}</p>
                        <p className="text-sm text-muted-foreground">{heartbeat.device_type}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(heartbeat.status)}
                      <Badge variant="outline">{heartbeat.progress}% progress</Badge>
                    </div>
                  </div>

                  <Separator className="my-2" />

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Last Heartbeat</p>
                      <p>{getTimeSince(heartbeat.updated_at)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Device Last Seen</p>
                      <p>{getTimeSince(heartbeat.device_last_seen)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Current Item</p>
                      <p>{heartbeat.current_item_id || "None"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Performance</p>
                      <p className="text-xs">
                        {heartbeat.performance_metrics && Object.keys(heartbeat.performance_metrics).length > 0
                          ? JSON.stringify(heartbeat.performance_metrics)
                          : "No data"}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No heartbeats recorded yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
