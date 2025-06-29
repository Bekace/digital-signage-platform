"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Monitor, ImageIcon, Play, HardDrive, Plus, Activity, Clock } from "lucide-react"
import Link from "next/link"
import DashboardLayout from "@/components/dashboard-layout"

interface DashboardStats {
  devices: number
  media: number
  playlists: number
  storage: string
}

interface RecentActivity {
  id: number
  type: string
  description: string
  timestamp: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    devices: 0,
    media: 0,
    playlists: 0,
    storage: "0 MB",
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [devicesResponse, mediaResponse, playlistsResponse] = await Promise.all([
          fetch("/api/devices"),
          fetch("/api/media"),
          fetch("/api/playlists"),
        ])

        const devicesData = await devicesResponse.json()
        const mediaData = await mediaResponse.json()
        const playlistsData = await playlistsResponse.json()

        const devicesCount = devicesData.success ? devicesData.devices.length : 0
        const mediaCount = mediaData.success ? mediaData.media.length : 0
        const playlistsCount = playlistsData.success ? playlistsData.playlists.length : 0

        const storageUsed = mediaCount * 2.5
        const storageString =
          storageUsed > 1024 ? `${(storageUsed / 1024).toFixed(1)} GB` : `${storageUsed.toFixed(0)} MB`

        setStats({
          devices: devicesCount,
          media: mediaCount,
          playlists: playlistsCount,
          storage: storageString,
        })

        setRecentActivity([
          {
            id: 1,
            type: "device",
            description: "System initialized successfully",
            timestamp: "Just now",
          },
          {
            id: 2,
            type: "media",
            description: `${mediaCount} media files available`,
            timestamp: "1 minute ago",
          },
          {
            id: 3,
            type: "playlist",
            description: `${playlistsCount} playlists created`,
            timestamp: "2 minutes ago",
          },
        ])
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Loading your digital signage control center...</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome to your digital signage control center</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connected Screens</CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.devices}</div>
              <p className="text-xs text-muted-foreground">Active displays</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Media Files</CardTitle>
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.media}</div>
              <p className="text-xs text-muted-foreground">Total uploaded files</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Playlists</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.playlists}</div>
              <p className="text-xs text-muted-foreground">Content sequences</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.storage}</div>
              <p className="text-xs text-muted-foreground">Of available space</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Screen
              </CardTitle>
              <CardDescription>Connect a new display to your signage network</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/dashboard/screens">Add Screen</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Upload Media
              </CardTitle>
              <CardDescription>Add new images, videos, or presentations</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/dashboard/media">Upload Files</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Create Playlist
              </CardTitle>
              <CardDescription>Organize your content into playlists</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/dashboard/playlists">Create Playlist</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest updates from your signage network</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {activity.type === "device" && <Monitor className="h-4 w-4 text-blue-500" />}
                    {activity.type === "media" && <ImageIcon className="h-4 w-4 text-green-500" />}
                    {activity.type === "playlist" && <Play className="h-4 w-4 text-purple-500" />}
                    <div>
                      <p className="text-sm font-medium">{activity.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {activity.timestamp}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
