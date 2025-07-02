"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, CreditCard, Settings, TrendingUp } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { toast } from "@/hooks/use-toast"

interface Plan {
  id: number
  name: string
  description: string
  price_monthly: number
  price_yearly: number
  media_files_limit: number
  storage_limit_mb: number
  screens_limit: number
  playlists_limit: number
  features: string[]
}

interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  company_name: string
  created_at: string
  media_files_count: number
  storage_used_bytes: number
  plan_name: string
  price_monthly: number
}

export default function AdminPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [plansResponse, usersResponse] = await Promise.all([fetch("/api/admin/plans"), fetch("/api/admin/users")])

      if (plansResponse.ok) {
        const plansData = await plansResponse.json()
        setPlans(plansData.plans || [])
      }

      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData.users || [])
      }
    } catch (error) {
      console.error("Failed to fetch admin data:", error)
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="text-center">Loading admin dashboard...</div>
        </div>
      </DashboardLayout>
    )
  }

  const totalRevenue = users.reduce((sum, user) => sum + (user.price_monthly || 0), 0)
  const totalUsers = users.length
  const activeUsers = users.filter((user) => user.plan_name !== "Free").length

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600">Manage subscription plans and users</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <CreditCard className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">${totalRevenue}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Plans</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{plans.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Subscription Plans */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Plans</CardTitle>
            <CardDescription>Manage pricing plans and features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <Card key={plan.id} className="border-2">
                  <CardHeader>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="text-2xl font-bold">${plan.price_monthly}/mo</div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm">
                      <strong>Limits:</strong>
                    </div>
                    <ul className="text-sm space-y-1">
                      <li>• {plan.media_files_limit} media files</li>
                      <li>• {plan.storage_limit_mb}MB storage</li>
                      <li>• {plan.screens_limit} screens</li>
                      <li>• {plan.playlists_limit} playlists</li>
                    </ul>
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      Edit Plan
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Users */}
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>Manage user accounts and subscriptions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.slice(0, 10).map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">
                      {user.first_name} {user.last_name}
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                    <div className="text-sm text-gray-500">{user.company_name}</div>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge variant={user.plan_name === "Free" ? "secondary" : "default"}>
                      {user.plan_name || "Free"}
                    </Badge>
                    <div className="text-sm text-gray-500">{user.media_files_count} files</div>
                    <div className="text-sm text-gray-500">
                      {Math.round(user.storage_used_bytes / (1024 * 1024))}MB used
                    </div>
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
