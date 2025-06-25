"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Crown, Upload, Monitor, HardDrive, Zap, RefreshCw } from "lucide-react"
import { formatBytes, formatNumber, getUsagePercentage, PLAN_NAMES } from "@/lib/plans"

interface PlanData {
  usage: {
    media_files_count: number
    storage_used_bytes: number
    screens_count: number
    plan_type: string
  }
  limits: {
    plan_type: string
    max_media_files: number
    max_storage_bytes: number
    max_screens: number
    price_monthly: number
    features: string[]
  }
  plan_expires_at?: string
}

interface UsageDashboardProps {
  refreshTrigger?: number
}

export function UsageDashboard({ refreshTrigger }: UsageDashboardProps) {
  const [planData, setPlanData] = useState<PlanData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPlanData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("🔄 Fetching real plan data...")
      const response = await fetch("/api/user/plan")

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("📊 Real plan data received:", data)

      if (data.error) {
        throw new Error(data.error)
      }

      setPlanData(data)
    } catch (error) {
      console.error("❌ Error fetching plan data:", error)
      setError(error instanceof Error ? error.message : "Failed to load plan data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlanData()
  }, [refreshTrigger])

  const handleRefresh = () => {
    fetchPlanData()
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-3">
              <div className="h-2 bg-gray-200 rounded"></div>
              <div className="h-2 bg-gray-200 rounded w-3/4"></div>
              <div className="h-2 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-red-900">Failed to Load Plan Data</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!planData) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500">No plan data available</p>
        </CardContent>
      </Card>
    )
  }

  const { usage, limits } = planData
  const isPro = usage.plan_type === "pro"
  const isEnterprise = usage.plan_type === "enterprise"
  const isFree = usage.plan_type === "free"

  // Calculate usage percentages
  const mediaUsagePercent = getUsagePercentage(usage.media_files_count, limits.max_media_files)
  const storageUsagePercent = getUsagePercentage(usage.storage_used_bytes, limits.max_storage_bytes)
  const screensUsagePercent = getUsagePercentage(usage.screens_count, limits.max_screens)

  return (
    <div className="space-y-6">
      {/* Plan Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`p-2 rounded-lg ${isEnterprise ? "bg-purple-100" : isPro ? "bg-blue-100" : "bg-gray-100"}`}
              >
                <Crown
                  className={`h-5 w-5 ${isEnterprise ? "text-purple-600" : isPro ? "text-blue-600" : "text-gray-600"}`}
                />
              </div>
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <span>{PLAN_NAMES[usage.plan_type as keyof typeof PLAN_NAMES]} Plan</span>
                  <Badge variant={isFree ? "secondary" : "default"}>
                    {isFree ? "Free" : `$${limits.price_monthly}/month`}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-gray-600">{limits.features.join(" • ")}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              {isFree && (
                <Button>
                  <Zap className="h-4 w-4 mr-2" />
                  Upgrade Plan
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Real Usage Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Media Files - Real Data */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Upload className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Media Files</p>
                  <p className="text-sm text-gray-600">
                    {formatNumber(usage.media_files_count)} / {formatNumber(limits.max_media_files)}
                  </p>
                </div>
                <Progress
                  value={mediaUsagePercent}
                  className={`mt-2 ${mediaUsagePercent > 80 ? "bg-red-100" : mediaUsagePercent > 60 ? "bg-yellow-100" : ""}`}
                />
                {mediaUsagePercent > 80 && <p className="text-xs text-red-600 mt-1">Running low on media files</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Storage - Real Data */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <HardDrive className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Storage</p>
                  <p className="text-sm text-gray-600">
                    {formatBytes(usage.storage_used_bytes)} / {formatBytes(limits.max_storage_bytes)}
                  </p>
                </div>
                <Progress
                  value={storageUsagePercent}
                  className={`mt-2 ${storageUsagePercent > 80 ? "bg-red-100" : storageUsagePercent > 60 ? "bg-yellow-100" : ""}`}
                />
                {storageUsagePercent > 80 && <p className="text-xs text-red-600 mt-1">Running low on storage</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Screens - Real Data */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Monitor className="h-4 w-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Screens</p>
                  <p className="text-sm text-gray-600">
                    {formatNumber(usage.screens_count)} / {formatNumber(limits.max_screens)}
                  </p>
                </div>
                <Progress
                  value={screensUsagePercent}
                  className={`mt-2 ${screensUsagePercent > 80 ? "bg-red-100" : screensUsagePercent > 60 ? "bg-yellow-100" : ""}`}
                />
                {screensUsagePercent > 80 && <p className="text-xs text-red-600 mt-1">Running low on screen slots</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upgrade Prompt for Free Users */}
      {isFree && (usage.media_files_count >= 3 || storageUsagePercent > 80) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-orange-900">You're running low on space!</h3>
                <p className="text-sm text-orange-700">
                  Upgrade to Pro for {formatNumber(500)} media files and {formatBytes(5 * 1024 * 1024 * 1024)} storage.
                </p>
              </div>
              <Button variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100">
                Upgrade Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === "development" && (
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="p-4">
            <details>
              <summary className="text-sm font-medium cursor-pointer">Debug: Raw Plan Data</summary>
              <pre className="text-xs mt-2 overflow-auto">{JSON.stringify(planData, null, 2)}</pre>
            </details>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
