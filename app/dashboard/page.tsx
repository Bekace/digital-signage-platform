"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Monitor, ImageIcon, Play, Activity } from "lucide-react"
import Link from "next/link"
import DashboardLayout from "@/components/dashboard-layout"

interface DashboardStats {
  totalDevices: number
  activeDevices: number
  totalMedia: number
  totalPlaylists: number
  storageUsed: number
  storageLimit: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalDevices: 0,
    activeDevices: 0,
    totalMedia: 0,
    totalPlaylists: 0,
    storageUsed: 0,
    storageLimit: 1000,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch devices
        const devicesResponse = await fetch("/api/devices")
        const devicesData = await devicesResponse.json()
        const devices = devicesData.devices || []

        // Fetch media
        const mediaResponse = await fetch("/api/media")
        const mediaData = await mediaResponse.json()
        const media = mediaData.media || []

        // Fetch playlists
        const playlistsResponse = await fetch("/api/playlists")
        const playlistsData = await playlistsResponse.json()
        const playlists = playlistsData.playlists || []

        // Calculate active devices (last seen within 10 minutes)
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
        const activeDevices = devices.filter(
          (device: any) => device.lastSeen && new Date(device.lastSeen) > tenMinutesAgo,
        ).length

        // Calculate storage used (in MB)
        const storageUsed =
          media.reduce((total: number, item: any) => {
            return total + (item.fileSize || 0)
          }, 0) /
          (1024 * 1024) // Convert to MB

        setStats({
          totalDevices: devices.length,
          activeDevices,
          totalMedia: media.length,
          totalPlaylists: playlists.length,
          storageUsed: Math.round(storageUsed),
          storageLimit: 1000,
        })
      } catch (error) {
        console.error("Error fetching dashboard stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const storagePercentage = (stats.storageUsed / stats.storageLimit) * 100

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome to your digital signage control center</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Screens</CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stats.totalDevices}</div>
              <p className="text-xs text-muted-foreground">{loading ? "..." : stats.activeDevices} currently active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Media Files</CardTitle>
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stats.totalMedia}</div>
              <p className="text-xs text-muted-foreground">
                {loading ? "..." : stats.storageUsed}MB of {stats.storageLimit}MB used
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Playlists</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stats.totalPlaylists}</div>
              <p className="text-xs text-muted-foreground">Content collections</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage Usage</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : Math.round(storagePercentage)}%</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Monitor className="mr-2 h-5 w-5" />
                Manage Screens
              </CardTitle>
              <CardDescription>Add new screens, monitor status, and assign content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-gray-600">
                    {stats.activeDevices} of {stats.totalDevices} online
                  </div>
                </div>
                <Button asChild>
                  <Link href="/dashboard/screens">Manage</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ImageIcon className="mr-2 h-5 w-5" />
                Upload Media
              </CardTitle>
              <CardDescription>Add images, videos, and presentations to your library</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-gray-600">{stats.totalMedia} files uploaded</div>
                </div>
                <Button asChild>
                  <Link href="/dashboard/media">Upload</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Play className="mr-2 h-5 w-5" />
                Create Playlist
              </CardTitle>
              <CardDescription>Organize your content into playlists for your screens</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-gray-600">{stats.totalPlaylists} playlists created</div>
                </div>
                <Button asChild>
                  <Link href="/dashboard/playlists">Create</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates from your digital signage network</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <div className="flex-1">
                  <p className="text-sm font-medium">System initialized successfully</p>
                  <p className="text-xs text-gray-500">Ready to add screens and content</p>
                </div>
                <Badge variant="secondary">System</Badge>
              </div>

              {stats.totalDevices > 0 && (
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{stats.totalDevices} screen(s) connected</p>
                    <p className="text-xs text-gray-500">{stats.activeDevices} currently active</p>
                  </div>
                  <Badge variant="secondary">Devices</Badge>
                </div>
              )}

              {stats.totalMedia > 0 && (
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{stats.totalMedia} media file(s) uploaded</p>
                    <p className="text-xs text-gray-500">{stats.storageUsed}MB storage used</p>
                  </div>
                  <Badge variant="secondary">Media</Badge>
                </div>
              )}

              {stats.totalPlaylists > 0 && (
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-orange-500 rounded-full" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{stats.totalPlaylists} playlist(s) created</p>
                    <p className="text-xs text-gray-500">Content ready for deployment</p>
                  </div>
                  <Badge variant="secondary">Playlists</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
