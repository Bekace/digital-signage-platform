"use client"

import { useState, useEffect } from "react"
import { Users, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardLayout } from "@/components/dashboard-layout"
import { formatBytes, formatNumber } from "@/lib/plans"

interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  company: string
  plan: string
  createdAt: string
  isAdmin: boolean
  mediaCount: number
  storageUsed: number
}

interface Plan {
  id: number
  plan_type: string
  name: string
  max_media_files: number
  max_storage_bytes: number
  max_screens: number
  price_monthly: number
  is_active: boolean
}

export default function UsersAdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingUser, setUpdatingUser] = useState<number | null>(null)

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/users")
      const data = await response.json()

      if (response.ok) {
        setUsers(data.users || [])
        setError(null)
      } else {
        setError(data.message || "Failed to load users")
      }
    } catch (err) {
      setError("Failed to load users")
      console.error("Error loading users:", err)
    } finally {
      setLoading(false)
    }
  }

  const loadPlans = async () => {
    try {
      const response = await fetch("/api/admin/plans")
      const data = await response.json()

      if (response.ok) {
        setPlans(data.plans || [])
      }
    } catch (err) {
      console.error("Error loading plans:", err)
    }
  }

  useEffect(() => {
    loadUsers()
    loadPlans()
  }, [])

  const updateUserPlan = async (userId: number, newPlan: string) => {
    try {
      setUpdatingUser(userId)
      const response = await fetch(`/api/admin/users/${userId}/plan`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan: newPlan }),
      })

      const data = await response.json()

      if (response.ok) {
        setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, plan: newPlan } : user)))
      } else {
        setError(data.message || "Failed to update user plan")
      }
    } catch (err) {
      setError("Failed to update user plan")
      console.error("Error updating user plan:", err)
    } finally {
      setUpdatingUser(null)
    }
  }

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case "free":
        return "bg-gray-100 text-gray-800"
      case "pro":
        return "bg-blue-100 text-blue-800"
      case "enterprise":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-green-100 text-green-800"
    }
  }

  const getPlanLimits = (planType: string) => {
    const plan = plans.find((p) => p.plan_type === planType)
    return plan || { max_media_files: 5, max_storage_bytes: 104857600, max_screens: 1 }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading users...</span>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadUsers} variant="outline">
            Try Again
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Users className="h-6 w-6" />
          <h1 className="text-3xl font-bold">User Management</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          {plans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{plan.name} Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.filter((u) => u.plan === plan.plan_type).length}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage user accounts and subscription plans</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const limits = getPlanLimits(user.plan)
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{user.company || "N/A"}</TableCell>
                      <TableCell>
                        <Badge className={getPlanBadgeColor(user.plan)}>{user.plan}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>
                            Files: {user.mediaCount}/{formatNumber(limits.max_media_files)}
                          </div>
                          <div>
                            Storage: {formatBytes(user.storageUsed)}/{formatBytes(limits.max_storage_bytes)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.isAdmin && <Badge variant="secondary">Admin</Badge>}</TableCell>
                      <TableCell>
                        <Select
                          value={user.plan}
                          onValueChange={(newPlan) => updateUserPlan(user.id, newPlan)}
                          disabled={updatingUser === user.id}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {plans
                              .filter((plan) => plan.is_active)
                              .map((plan) => (
                                <SelectItem key={plan.plan_type} value={plan.plan_type}>
                                  {plan.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
