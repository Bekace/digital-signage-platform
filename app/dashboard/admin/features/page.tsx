"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Tag, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useToast } from "@/hooks/use-toast"

interface Feature {
  id: number
  feature_name: string
  description: string
  category: string
  is_active: boolean
  created_at: string
}

const defaultFeature = {
  feature_name: "",
  description: "",
  category: "general",
  is_active: true,
}

const categories = [
  { value: "media", label: "Media Management" },
  { value: "storage", label: "Storage" },
  { value: "support", label: "Support" },
  { value: "analytics", label: "Analytics" },
  { value: "design", label: "Design & Branding" },
  { value: "integration", label: "Integrations" },
  { value: "community", label: "Community" },
  { value: "general", label: "General" },
]

export default function FeaturesAdminPage() {
  const [features, setFeatures] = useState<Feature[]>([])
  const [groupedFeatures, setGroupedFeatures] = useState<Record<string, Feature[]>>({})
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [newFeature, setNewFeature] = useState(defaultFeature)
  const { toast } = useToast()

  const loadFeatures = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/features")
      const data = await response.json()

      if (response.ok) {
        setFeatures(data.features || [])
        setGroupedFeatures(data.groupedFeatures || {})
        setError(null)
      } else {
        setError(data.message || "Failed to load features")
        toast({
          title: "Error",
          description: data.message || "Failed to load features",
          variant: "destructive",
        })
      }
    } catch (err) {
      setError("Failed to load features")
      console.error("Error loading features:", err)
      toast({
        title: "Error",
        description: "Failed to load features",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFeatures()
  }, [])

  const validateFeature = (feature: typeof defaultFeature): string | null => {
    if (!feature.feature_name.trim()) return "Feature name is required"
    if (!feature.description.trim()) return "Feature description is required"
    if (!feature.category.trim()) return "Category is required"
    return null
  }

  const handleCreateFeature = async () => {
    const validationError = validateFeature(newFeature)
    if (validationError) {
      toast({
        title: "Validation Error",
        description: validationError,
        variant: "destructive",
      })
      return
    }

    try {
      setCreating(true)
      const response = await fetch("/api/admin/features", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newFeature),
      })

      const data = await response.json()

      if (response.ok) {
        await loadFeatures() // Reload to get updated grouping
        setIsCreateDialogOpen(false)
        setNewFeature(defaultFeature)
        toast({
          title: "Success",
          description: "Feature created successfully",
        })
      } else {
        setError(data.message || "Failed to create feature")
        toast({
          title: "Error",
          description: data.message || "Failed to create feature",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Error creating feature:", err)
      setError("Failed to create feature")
      toast({
        title: "Error",
        description: "Failed to create feature",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const handleEditFeature = (feature: Feature) => {
    setEditingFeature({ ...feature })
    setIsEditDialogOpen(true)
  }

  const handleUpdateFeature = async () => {
    if (!editingFeature) return

    const validationError = validateFeature(editingFeature)
    if (validationError) {
      toast({
        title: "Validation Error",
        description: validationError,
        variant: "destructive",
      })
      return
    }

    try {
      setUpdating(editingFeature.id)
      const response = await fetch(`/api/admin/features/${editingFeature.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editingFeature),
      })

      const data = await response.json()

      if (response.ok) {
        await loadFeatures() // Reload to get updated grouping
        setEditingFeature(null)
        setIsEditDialogOpen(false)
        toast({
          title: "Success",
          description: "Feature updated successfully",
        })
      } else {
        setError(data.message || "Failed to update feature")
        toast({
          title: "Error",
          description: data.message || "Failed to update feature",
          variant: "destructive",
        })
      }
    } catch (err) {
      setError("Failed to update feature")
      console.error("Error updating feature:", err)
      toast({
        title: "Error",
        description: "Failed to update feature",
        variant: "destructive",
      })
    } finally {
      setUpdating(null)
    }
  }

  const handleDeleteFeature = async (featureId: number) => {
    if (!confirm("Are you sure you want to delete this feature? This action cannot be undone.")) return

    try {
      const response = await fetch(`/api/admin/features/${featureId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (response.ok) {
        await loadFeatures()
        toast({
          title: "Success",
          description: "Feature deleted successfully",
        })
      } else {
        setError(data.message || "Failed to delete feature")
        toast({
          title: "Error",
          description: data.message || "Failed to delete feature",
          variant: "destructive",
        })
      }
    } catch (err) {
      setError("Failed to delete feature")
      console.error("Error deleting feature:", err)
      toast({
        title: "Error",
        description: "Failed to delete feature",
        variant: "destructive",
      })
    }
  }

  const FeatureForm = ({ feature, setFeature }: { feature: any; setFeature: any }) => (
    <div className="grid gap-4 py-4">
      <div>
        <Label htmlFor="feature_name">Feature Name *</Label>
        <Input
          id="feature_name"
          value={feature.feature_name}
          onChange={(e) => setFeature({ ...feature, feature_name: e.target.value })}
          placeholder="e.g., Advanced Analytics"
          required
        />
      </div>
      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={feature.description}
          onChange={(e) => setFeature({ ...feature, description: e.target.value })}
          placeholder="Describe what this feature provides..."
          required
        />
      </div>
      <div>
        <Label htmlFor="category">Category *</Label>
        <Select value={feature.category} onValueChange={(value) => setFeature({ ...feature, category: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={feature.is_active}
          onCheckedChange={(checked) => setFeature({ ...feature, is_active: checked })}
        />
        <Label htmlFor="is_active">Active</Label>
      </div>
    </div>
  )

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">Loading features...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Feature Management</h1>
            <p className="text-muted-foreground">Manage features that can be included in subscription plans</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Feature
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Feature</DialogTitle>
                <DialogDescription>Add a new feature that can be included in subscription plans</DialogDescription>
              </DialogHeader>
              <FeatureForm feature={newFeature} setFeature={setNewFeature} />
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={creating}>
                  Cancel
                </Button>
                <Button onClick={handleCreateFeature} disabled={creating}>
                  {creating ? "Creating..." : "Create Feature"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Feature Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Feature</DialogTitle>
              <DialogDescription>Modify the feature details</DialogDescription>
            </DialogHeader>
            {editingFeature && <FeatureForm feature={editingFeature} setFeature={setEditingFeature} />}
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false)
                  setEditingFeature(null)
                }}
                disabled={updating !== null}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateFeature} disabled={updating !== null}>
                {updating !== null ? "Updating..." : "Update Feature"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <p>{error}</p>
          </div>
        )}

        {/* Features Overview Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Features</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{features.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Features</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{features.filter((f) => f.is_active).length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(groupedFeatures).length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Most Used Category</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.keys(groupedFeatures).length > 0
                  ? Object.entries(groupedFeatures).sort(([, a], [, b]) => b.length - a.length)[0][0]
                  : "None"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features by Category */}
        {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="capitalize">
                {categories.find((c) => c.value === category)?.label || category} Features
              </CardTitle>
              <CardDescription>Features in the {category} category</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Feature</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryFeatures.map((feature) => (
                    <TableRow key={feature.id}>
                      <TableCell>
                        <div className="font-medium">{feature.feature_name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground max-w-md">{feature.description}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={feature.is_active ? "default" : "secondary"}>
                          {feature.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditFeature(feature)}
                            disabled={updating === feature.id}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteFeature(feature.id)}
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
        ))}

        {features.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                No features created yet. Create your first feature to get started.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
