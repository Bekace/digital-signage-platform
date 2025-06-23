"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Crown, Upload, Monitor, HardDrive, Zap } from "lucide-react"
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

export function UsageDashboard() {
  const [planData, setPlanData] = useState<PlanData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPlanData()
  }, [])

  const fetchPlanData = async () => {
    try {
      const response = await fetch("/api/user/plan")
      if (response.ok) {
        const data = await response.json()
        setPlanData(data)
      }
    } catch (error) {
      console.error("Error fetching plan data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
            <div className="h-2 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!planData) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500">Unable to load plan information</p>
        </CardContent>
      </Card>
    )
  }

  const { usage, limits } = planData
  const isPro = usage.plan_type === "pro"
  const isEnterprise = usage.plan_type === "enterprise"
  const isFree = usage.plan_type === "free"

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
            {isFree && (
              <Button>
                <Zap className="h-4 w-4 mr-2" />
                Upgrade Plan
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Usage Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Media Files */}
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
                  value={getUsagePercentage(usage.media_files_count, limits.max_media_files)}
                  className="mt-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Storage */}
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
                  value={getUsagePercentage(usage.storage_used_bytes, limits.max_storage_bytes)}
                  className="mt-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Screens */}
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
                <Progress value={getUsagePercentage(usage.screens_count, limits.max_screens)} className="mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upgrade Prompt for Free Users */}
      {isFree && (usage.media_files_count >= 3 || usage.storage_used_bytes > limits.max_storage_bytes * 0.8) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-orange-900">You're running low on space!</h3>
                <p className="text-sm text-orange-700">Upgrade to Pro for 500 media files and 5GB storage.</p>
              </div>
              <Button variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100">
                Upgrade Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
