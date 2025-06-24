"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, DollarSign, HardDrive, Monitor, FileImage } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { DashboardLayout } from "@/components/dashboard-layout"
import { formatBytes, formatNumber } from "@/lib/plans"

interface Plan {
  id: number
  plan_type: string
  name: string
  description: string
  max_media_files: number
  max_storage_bytes: number
  max_screens: number
  price_monthly: number
  price_yearly: number
  features: string[]
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

interface Feature {
  id: number
  name: string
  description: string
  category: string
  is_active: boolean
}

const defaultPlan: Omit<Plan, "id" | "created_at" | "updated_at"> = {
  plan_type: "",
  name: "",
  description: "",
  max_media_files: 5,
  max_storage_bytes: 104857600, // 100MB
  max_screens: 1,
  price_monthly: 0,
  price_yearly: 0,
  features: [],
  is_active: true,
  sort_order: 0,
}

export default function PlansAdminPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [features, setFeatures] = useState<Feature[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newPlan, setNewPlan] = useState<Omit<Plan, "id" | "created_at" | "updated_at">>(defaultPlan)

  const loadPlans = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/plans")
      const data = await response.json()

      if (response.ok) {
        setPlans(data.plans || [])
        setError(null)
      } else {
        setError(data.message || "Failed to load plans")
      }
    } catch (err) {
      setError("Failed to load plans")
      console.error("Error loading plans:", err)
    } finally {
      setLoading(false)
    }
  }

  const loadFeatures = async () => {
    try {
      const response = await fetch("/api/admin/features")
      const data = await response.json()

      if (response.ok) {
        setFeatures(data.features || [])
      }
    } catch (err) {
      console.error("Error loading features:", err)
    }
  }

  useEffect(() => {
    loadPlans()
    loadFeatures()
  }, [])

  const handleCreatePlan = async () => {
    try {
      const response = await fetch("/api/admin/plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newPlan),
      })

      const data = await response.json()

      if (response.ok) {
        setPlans([...plans, data.plan])
        setIsCreateDialogOpen(false)
        setNewPlan(defaultPlan)
      } else {
        setError(data.message || "Failed to create plan")
      }
    } catch (err) {
      setError("Failed to create plan")
      console.error("Error creating plan:", err)
    }
  }

  const handleUpdatePlan = async (planId: number, updatedPlan: Partial<Plan>) => {
    try {
      const response = await fetch(`/api/admin/plans/${planId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedPlan),
      })

      const data = await response.json()

      if (response.ok) {
        setPlans(plans.map((plan) => (plan.id === planId ? data.plan : plan)))
        setEditingPlan(null)
      } else {
        setError(data.message || "Failed to update plan")
      }
    } catch (err) {
      setError("Failed to update plan")
      console.error("Error updating plan:", err)
    }
  }

  const handleDeletePlan = async (planId: number) => {
    if (!confirm("Are you sure you want to delete this plan?")) return

    try {
      const response = await fetch(`/api/admin/plans/${planId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (response.ok) {
        setPlans(plans.filter((plan) => plan.id !== planId))
      } else {
        setError(data.message || "Failed to delete plan")
      }
    } catch (err) {
      setError("Failed to delete plan")
      console.error("Error deleting plan:", err)
    }
  }

  const formatStorageInput = (bytes: number): string => {
    if (bytes === -1) return "unlimited"
    return (bytes / (1024 * 1024)).toString() // Convert to MB
  }

  const parseStorageInput = (value: string): number => {
    if (value.toLowerCase() === "unlimited" || value === "-1") return -1
    const mb = Number.parseFloat(value)
    return isNaN(mb) ? 0 : mb * 1024 * 1024 // Convert MB to bytes
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">Loading plans...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Plan Management</h1>
            <p className="text-muted-foreground">Manage subscription plans and pricing</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Plan</DialogTitle>
                <DialogDescription>Create a new subscription plan with custom limits and pricing</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="plan_type">Plan Type</Label>
                    <Input
                      id="plan_type"
                      value={newPlan.plan_type}
                      onChange={(e) => setNewPlan({ ...newPlan, plan_type: e.target.value })}
                      placeholder="e.g., premium"
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Plan Name</Label>
                    <Input
                      id="name"
                      value={newPlan.name}
                      onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                      placeholder="e.g., Premium Plan"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newPlan.description}
                    onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                    placeholder="Plan description..."
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="max_media_files">Media Files Limit</Label>
                    <Input
                      id="max_media_files"
                      type="number"
                      value={newPlan.max_media_files === -1 ? "unlimited" : newPlan.max_media_files}
                      onChange={(e) =>
                        setNewPlan({
                          ...newPlan,
                          max_media_files: e.target.value === "unlimited" ? -1 : Number.parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_storage">Storage Limit (MB)</Label>
                    <Input
                      id="max_storage"
                      value={formatStorageInput(newPlan.max_storage_bytes)}
                      onChange={(e) => setNewPlan({ ...newPlan, max_storage_bytes: parseStorageInput(e.target.value) })}
                      placeholder="100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_screens">Screens Limit</Label>
                    <Input
                      id="max_screens"
                      type="number"
                      value={newPlan.max_screens === -1 ? "unlimited" : newPlan.max_screens}
                      onChange={(e) =>
                        setNewPlan({
                          ...newPlan,
                          max_screens: e.target.value === "unlimited" ? -1 : Number.parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price_monthly">Monthly Price ($)</Label>
                    <Input
                      id="price_monthly"
                      type="number"
                      step="0.01"
                      value={newPlan.price_monthly}
                      onChange={(e) =>
                        setNewPlan({ ...newPlan, price_monthly: Number.parseFloat(e.target.value) || 0 })
                      }
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="price_yearly">Yearly Price ($)</Label>
                    <Input
                      id="price_yearly"
                      type="number"
                      step="0.01"
                      value={newPlan.price_yearly}
                      onChange={(e) => setNewPlan({ ...newPlan, price_yearly: Number.parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <Label>Features</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
                    {features.map((feature) => (
                      <div key={feature.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`feature-${feature.id}`}
                          checked={newPlan.features.includes(feature.name)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setNewPlan({ ...newPlan, features: [...newPlan.features, feature.name] })
                            } else {
                              setNewPlan({
                                ...newPlan,
                                features: newPlan.features.filter((f) => f !== feature.name),
                              })
                            }
                          }}
                        />
                        <Label htmlFor={`feature-${feature.id}`} className="text-sm">
                          {feature.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={newPlan.is_active}
                    onCheckedChange={(checked) => setNewPlan({ ...newPlan, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePlan}>Create Plan</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <p>{error}</p>
          </div>
        )}

        {/* Plans Overview Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{plans.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{plans.filter((p) => p.is_active).length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Monthly Price</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(plans.reduce((sum, p) => sum + p.price_monthly, 0) / plans.length || 0).toFixed(2)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Features Available</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{features.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Plans Table */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Plans</CardTitle>
            <CardDescription>Manage plan limits, pricing, and features</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Limits</TableHead>
                  <TableHead>Pricing</TableHead>
                  <TableHead>Features</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{plan.name}</div>
                        <div className="text-sm text-muted-foreground">{plan.description}</div>
                        <Badge variant="outline" className="mt-1">
                          {plan.plan_type}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center">
                          <FileImage className="h-3 w-3 mr-1" />
                          {formatNumber(plan.max_media_files)} files
                        </div>
                        <div className="flex items-center">
                          <HardDrive className="h-3 w-3 mr-1" />
                          {formatBytes(plan.max_storage_bytes)}
                        </div>
                        <div className="flex items-center">
                          <Monitor className="h-3 w-3 mr-1" />
                          {formatNumber(plan.max_screens)} screens
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div>${plan.price_monthly}/month</div>
                        <div className="text-muted-foreground">${plan.price_yearly}/year</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {plan.features.slice(0, 3).map((feature, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                          {plan.features.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{plan.features.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={plan.is_active ? "default" : "secondary"}>
                        {plan.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => setEditingPlan(plan)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePlan(plan.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
