"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { FileText, HardDrive, Monitor, Play } from "lucide-react"

interface UsageData {
  mediaFiles: { current: number; limit: number }
  storage: { current: number; limit: number }
  screens: { current: number; limit: number }
  playlists: { current: number; limit: number }
  planName: string
}

interface UsageDashboardProps {
  refreshTrigger?: number
}

export function UsageDashboard({ refreshTrigger }: UsageDashboardProps) {
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUsage = async () => {
    try {
      const response = await fetch("/api/user/usage")
      if (response.ok) {
        const data = await response.json()
        setUsage(data)
      }
    } catch (error) {
      console.error("Failed to fetch usage:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsage()
  }, [refreshTrigger])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usage & Limits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">Loading usage data...</div>
        </CardContent>
      </Card>
    )
  }

  if (!usage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usage & Limits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">Failed to load usage data</div>
        </CardContent>
      </Card>
    )
  }

  const getProgressColor = (current: number, limit: number) => {
    const percentage = (current / limit) * 100
    if (percentage >= 90) return "bg-red-500"
    if (percentage >= 75) return "bg-yellow-500"
    return "bg-blue-500"
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Usage & Limits</CardTitle>
        <Badge variant="outline">{usage.planName} Plan</Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Media Files */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span className="text-sm font-medium">Media Files</span>
            </div>
            <span className="text-sm text-gray-600">
              {usage.mediaFiles.current} / {usage.mediaFiles.limit}
            </span>
          </div>
          <Progress value={(usage.mediaFiles.current / usage.mediaFiles.limit) * 100} className="h-2" />
        </div>

        {/* Storage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <HardDrive className="h-4 w-4" />
              <span className="text-sm font-medium">Storage</span>
            </div>
            <span className="text-sm text-gray-600">
              {usage.storage.current}MB / {usage.storage.limit}MB
            </span>
          </div>
          <Progress value={(usage.storage.current / usage.storage.limit) * 100} className="h-2" />
        </div>

        {/* Screens */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Monitor className="h-4 w-4" />
              <span className="text-sm font-medium">Screens</span>
            </div>
            <span className="text-sm text-gray-600">
              {usage.screens.current} / {usage.screens.limit}
            </span>
          </div>
          <Progress value={(usage.screens.current / usage.screens.limit) * 100} className="h-2" />
        </div>

        {/* Playlists */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Play className="h-4 w-4" />
              <span className="text-sm font-medium">Playlists</span>
            </div>
            <span className="text-sm text-gray-600">
              {usage.playlists.current} / {usage.playlists.limit}
            </span>
          </div>
          <Progress value={(usage.playlists.current / usage.playlists.limit) * 100} className="h-2" />
        </div>
      </CardContent>
    </Card>
  )
}
