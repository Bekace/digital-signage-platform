"use client"

import { useState, useEffect } from "react"
import { Users, BarChart3, Crown, Edit, Save, X } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DashboardLayout } from "@/components/dashboard-layout"
import { formatBytes, formatNumber, PLAN_NAMES } from "@/lib/plans"

interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  company_name: string
  plan_type: string
  media_files_count: number
  storage_used_bytes: number
  screens_count: number
  created_at: string
  last_login: string
  is_admin: boolean
  max_media_files: number
  max_storage_bytes: number
  max_screens: number
  price_monthly: number
}

interface Plan {
  plan_type: string
  max_media_files: number
  max_storage_bytes: number
  max_screens: number
  price_monthly: number
  features: string[]
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newPlanType, setNewPlanType] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [usersRes, plansRes] = await Promise.all([fetch("/api/admin/users"), fetch("/api/admin/plans")])

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.users)
      }

      if (plansRes.ok) {
        const plansData = await plansRes.json()
        setPlans(plansData.plans)
      }
    } catch (error) {
      console.error("Error fetching admin data:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateUserPlan = async (userId: number, planType: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/plan`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_type: planType }),
      })

      if (response.ok) {
        fetchData() // Refresh data
        setSelectedUser(null)
      }
    } catch (error) {
      console.error("Error updating user plan:", error)
    }
  }

  const updatePlan = async (plan: Plan) => {
    try {
      const response = await fetch("/api/admin/plans", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(plan),
      })

      if (response.ok) {
        fetchData() // Refresh data
        setEditingPlan(null)
      }
    } catch (error) {
      console.error("Error updating plan:", error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getPlanBadgeColor = (planType: string) => {
    switch (planType) {
      case "enterprise":
        return "bg-purple-100 text-purple-800"
      case "pro":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users, plans, and system settings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">
                {users.filter((u) => u.plan_type !== "free").length} paid users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Storage Used</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatBytes(users.reduce((sum, user) => sum + (user.storage_used_bytes || 0), 0))}
              </div>
              <p className="text-xs text-muted-foreground">
                {users.reduce((sum, user) => sum + (user.media_files_count || 0), 0)} total files
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <Crown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${users.reduce((sum, user) => sum + (user.price_monthly || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground">Estimated monthly</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="plans">Plans</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage user accounts and their plans</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {user.first_name} {user.last_name}
                              {user.is_admin && (
                                <Badge className="ml-2" variant="secondary">
                                  Admin
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{user.company_name || "—"}</TableCell>
                        <TableCell>
                          <Badge className={getPlanBadgeColor(user.plan_type)}>
                            {PLAN_NAMES[user.plan_type as keyof typeof PLAN_NAMES]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>
                              {user.media_files_count || 0} / {formatNumber(user.max_media_files)} files
                            </div>
                            <div className="text-gray-500">
                              {formatBytes(user.storage_used_bytes || 0)} / {formatBytes(user.max_storage_bytes)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(user.created_at)}</TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setSelectedUser(user)}>
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit User Plan</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>User</Label>
                                  <p className="text-sm text-gray-600">
                                    {user.first_name} {user.last_name} ({user.email})
                                  </p>
                                </div>
                                <div>
                                  <Label htmlFor="plan">Plan Type</Label>
                                  <Select value={newPlanType || user.plan_type} onValueChange={setNewPlanType}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="free">Free</SelectItem>
                                      <SelectItem value="pro">Pro</SelectItem>
                                      <SelectItem value="enterprise">Enterprise</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedUser(null)
                                      setNewPlanType("")
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button onClick={() => updateUserPlan(user.id, newPlanType || user.plan_type)}>
                                    Update Plan
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plans" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Plan Management</CardTitle>
                <CardDescription>Configure plan limits and pricing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {plans.map((plan) => (
                    <Card key={plan.plan_type}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="capitalize">
                            {PLAN_NAMES[plan.plan_type as keyof typeof PLAN_NAMES]} Plan
                          </CardTitle>
                          <Button variant="outline" size="sm" onClick={() => setEditingPlan(plan)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                        <CardDescription>${plan.price_monthly}/month</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="text-sm">
                          <div>Media Files: {formatNumber(plan.max_media_files)}</div>
                          <div>Storage: {formatBytes(plan.max_storage_bytes)}</div>
                          <div>Screens: {formatNumber(plan.max_screens)}</div>
                        </div>
                        <div className="text-xs text-gray-500">Features: {plan.features.join(", ")}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Plan Dialog */}
        {editingPlan && (
          <Dialog open={!!editingPlan} onOpenChange={() => setEditingPlan(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Edit {PLAN_NAMES[editingPlan.plan_type as keyof typeof PLAN_NAMES]} Plan</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="media_files">Max Media Files</Label>
                  <Input
                    id="media_files"
                    type="number"
                    value={editingPlan.max_media_files}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        max_media_files: Number.parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="storage">Max Storage (bytes)</Label>
                  <Input
                    id="storage"
                    type="number"
                    value={editingPlan.max_storage_bytes}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        max_storage_bytes: Number.parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="screens">Max Screens</Label>
                  <Input
                    id="screens"
                    type="number"
                    value={editingPlan.max_screens}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        max_screens: Number.parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="price">Monthly Price</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={editingPlan.price_monthly}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        price_monthly: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setEditingPlan(null)}>
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button onClick={() => updatePlan(editingPlan)}>
                    <Save className="h-4 w-4 mr-1" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  )
}
