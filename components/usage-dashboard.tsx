"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Crown, Upload, Monitor, HardDrive, Zap, RefreshCw, AlertTriangle } from "lucide-react"
import { formatBytes, formatNumber, getUsagePercentage, PLAN_NAMES } from "@/lib/plans"
import { usePlanStore } from "@/lib/plan-store"

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
  debug?: {
    user_table_media_count: number
    actual_media_count: number
    user_table_storage: number
    actual_storage: number
    plan_type: string
    timestamp: string
  }
}

interface UsageDashboardProps {
  refreshTrigger?: number
}

export function UsageDashboard({ refreshTrigger }: UsageDashboardProps) {
  const { planData: globalPlanData, setPlanData: setGlobalPlanData, shouldRefresh } = usePlanStore()
  const [planData, setPlanData] = useState<PlanData | null>(globalPlanData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<string>("")

  const fetchPlanData = async (force = false) => {
    try {
      setLoading(true)
      setError(null)

      console.log("🔄 [USAGE DASHBOARD] Fetching plan data...", { force, refreshTrigger })

      // Add cache busting and force refresh headers
      const response = await fetch("/api/user/plan", {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        // Add timestamp to force new request
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("📊 [USAGE DASHBOARD] Plan data received:", data)

      if (data.error) {
        throw new Error(data.error)
      }

      setPlanData(data)
      setGlobalPlanData(data) // Update global store
      setLastRefresh(new Date().toLocaleTimeString())
    } catch (error) {
      console.error("❌ [USAGE DASHBOARD] Error:", error)
      setError(error instanceof Error ? error.message : "Failed to load plan data")
    } finally {
      setLoading(false)
    }
  }

  // Add this after the existing fetchPlanData function
  const forceRefresh = async () => {
    console.log("🔄 Force refreshing plan data...")
    await fetchPlanData(true)
  }

  // Update the useEffect to also listen for plan changes
  useEffect(() => {
    // Always fetch fresh data when refreshTrigger changes
    console.log("📊 Usage dashboard refresh triggered:", refreshTrigger)
    fetchPlanData(true)
  }, [refreshTrigger])

  // Also refresh if global store indicates we should
  useEffect(() => {
    if (shouldRefresh()) {
      console.log("🔄 Global store indicates refresh needed")
      fetchPlanData(true)
    }
  }, [shouldRefresh])

  // Add a second useEffect to periodically check for updates
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("⏰ Periodic refresh of usage data")
      fetchPlanData(true)
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const handleRefresh = () => {
    fetchPlanData(true)
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
              {lastRefresh && <p className="text-xs text-red-600 mt-1">Last successful refresh: {lastRefresh}</p>}
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
          <div className="flex items-center justify-between">
            <p className="text-gray-500">No plan data available</p>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { usage, limits, debug } = planData
  const isPro = usage.plan_type === "pro"
  const isEnterprise = usage.plan_type === "enterprise"
  const isFree = usage.plan_type === "free"

  // Calculate usage percentages
  const mediaUsagePercent = getUsagePercentage(usage.media_files_count, limits.max_media_files)
  const storageUsagePercent = getUsagePercentage(usage.storage_used_bytes, limits.max_storage_bytes)
  const screensUsagePercent = getUsagePercentage(usage.screens_count, limits.max_screens)

  // Check for over-limit situations
  const mediaOverLimit = usage.media_files_count > limits.max_media_files
  const storageOverLimit = usage.storage_used_bytes > limits.max_storage_bytes
  const screensOverLimit = usage.screens_count > limits.max_screens

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
                {lastRefresh && <p className="text-xs text-gray-500 mt-1">Last updated: {lastRefresh}</p>}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={forceRefresh}>
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

      {/* Over-limit Warning */}
      {(mediaOverLimit || storageOverLimit || screensOverLimit) && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="font-medium text-red-900">Plan Limits Exceeded</h3>
                <p className="text-sm text-red-700">
                  You've exceeded your plan limits. Please upgrade or remove some content.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Real Usage Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Media Files - Real Data */}
        <Card className={mediaOverLimit ? "border-red-200" : ""}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${mediaOverLimit ? "bg-red-100" : "bg-green-100"}`}>
                <Upload className={`h-4 w-4 ${mediaOverLimit ? "text-red-600" : "text-green-600"}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Media Files</p>
                  <p className={`text-sm ${mediaOverLimit ? "text-red-600 font-semibold" : "text-gray-600"}`}>
                    {formatNumber(usage.media_files_count)} / {formatNumber(limits.max_media_files)}
                  </p>
                </div>
                <Progress
                  value={Math.min(mediaUsagePercent, 100)}
                  className={`mt-2 ${mediaOverLimit ? "bg-red-100" : mediaUsagePercent > 80 ? "bg-yellow-100" : ""}`}
                />
                {mediaOverLimit && <p className="text-xs text-red-600 mt-1">Over limit! Remove files or upgrade</p>}
                {!mediaOverLimit && mediaUsagePercent > 80 && (
                  <p className="text-xs text-yellow-600 mt-1">Running low on media files</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Storage - Real Data */}
        <Card className={storageOverLimit ? "border-red-200" : ""}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${storageOverLimit ? "bg-red-100" : "bg-blue-100"}`}>
                <HardDrive className={`h-4 w-4 ${storageOverLimit ? "text-red-600" : "text-blue-600"}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Storage</p>
                  <p className={`text-sm ${storageOverLimit ? "text-red-600 font-semibold" : "text-gray-600"}`}>
                    {formatBytes(usage.storage_used_bytes)} / {formatBytes(limits.max_storage_bytes)}
                  </p>
                </div>
                <Progress
                  value={Math.min(storageUsagePercent, 100)}
                  className={`mt-2 ${storageOverLimit ? "bg-red-100" : storageUsagePercent > 80 ? "bg-yellow-100" : ""}`}
                />
                {storageOverLimit && <p className="text-xs text-red-600 mt-1">Over limit! Remove files or upgrade</p>}
                {!storageOverLimit && storageUsagePercent > 80 && (
                  <p className="text-xs text-yellow-600 mt-1">Running low on storage</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Screens - Real Data */}
        <Card className={screensOverLimit ? "border-red-200" : ""}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${screensOverLimit ? "bg-red-100" : "bg-purple-100"}`}>
                <Monitor className={`h-4 w-4 ${screensOverLimit ? "text-red-600" : "text-purple-600"}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Screens</p>
                  <p className={`text-sm ${screensOverLimit ? "text-red-600 font-semibold" : "text-gray-600"}`}>
                    {formatNumber(usage.screens_count)} / {formatNumber(limits.max_screens)}
                  </p>
                </div>
                <Progress
                  value={Math.min(screensUsagePercent, 100)}
                  className={`mt-2 ${screensOverLimit ? "bg-red-100" : screensUsagePercent > 80 ? "bg-yellow-100" : ""}`}
                />
                {screensOverLimit && <p className="text-xs text-red-600 mt-1">Over limit! Remove screens or upgrade</p>}
                {!screensOverLimit && screensUsagePercent > 80 && (
                  <p className="text-xs text-yellow-600 mt-1">Running low on screen slots</p>
                )}
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
      {debug && process.env.NODE_ENV === "development" && (
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="p-4">
            <details>
              <summary className="text-sm font-medium cursor-pointer">Debug: Plan Data Sync</summary>
              <div className="text-xs mt-2 space-y-1">
                <div>User Table Media Count: {debug.user_table_media_count}</div>
                <div>Actual Media Count: {debug.actual_media_count}</div>
                <div>User Table Storage: {formatBytes(debug.user_table_storage)}</div>
                <div>Actual Storage: {formatBytes(debug.actual_storage)}</div>
                <div>Plan Type: {debug.plan_type}</div>
                <div>Timestamp: {debug.timestamp}</div>
              </div>
            </details>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
