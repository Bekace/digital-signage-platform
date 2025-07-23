"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Database, Plus, Trash2, Edit, CheckCircle, XCircle } from "lucide-react"

interface TestRecord {
  id: string
  name: string
  description: string
  test_data: string
  created_at: string
}

export default function DatabaseTestFormPage() {
  const [records, setRecords] = useState<TestRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    test_data: "",
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<"unknown" | "connected" | "error">("unknown")

  // Test database connection on load
  useEffect(() => {
    testConnection()
    loadRecords()
  }, [])

  const testConnection = async () => {
    try {
      const response = await fetch("/api/database-test-form/connection", {
        method: "GET",
        credentials: "include",
      })

      const data = await response.json()

      if (data.success) {
        setConnectionStatus("connected")
        console.log("✅ Database connection test successful")
      } else {
        setConnectionStatus("error")
        console.error("❌ Database connection test failed:", data.error)
      }
    } catch (error) {
      setConnectionStatus("error")
      console.error("❌ Database connection test error:", error)
    }
  }

  const loadRecords = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/database-test-form", {
        method: "GET",
        credentials: "include",
      })

      const data = await response.json()

      if (data.success) {
        setRecords(data.records)
        console.log("📋 Loaded records:", data.records.length)
      } else {
        toast.error(data.error || "Failed to load records")
      }
    } catch (error) {
      console.error("Error loading records:", error)
      toast.error("Failed to load records")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error("Name is required")
      return
    }

    setLoading(true)

    try {
      const url = editingId ? `/api/database-test-form/${editingId}` : "/api/database-test-form"

      const method = editingId ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(editingId ? "Record updated successfully" : "Record created successfully")
        setFormData({ name: "", description: "", test_data: "" })
        setEditingId(null)
        loadRecords()
      } else {
        toast.error(data.error || "Failed to save record")
      }
    } catch (error) {
      console.error("Error saving record:", error)
      toast.error("Failed to save record")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (record: TestRecord) => {
    setFormData({
      name: record.name,
      description: record.description || "",
      test_data: record.test_data || "",
    })
    setEditingId(record.id)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/database-test-form/${id}`, {
        method: "DELETE",
        credentials: "include",
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Record deleted successfully")
        loadRecords()
      } else {
        toast.error(data.error || "Failed to delete record")
      }
    } catch (error) {
      console.error("Error deleting record:", error)
      toast.error("Failed to delete record")
    }
  }

  const cancelEdit = () => {
    setFormData({ name: "", description: "", test_data: "" })
    setEditingId(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Database className="h-8 w-8" />
            Database Test Form
          </h1>
          <p className="text-gray-600 mt-2">Test database connectivity with a simple CRUD form</p>
        </div>

        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {connectionStatus === "connected" && <CheckCircle className="h-5 w-5 text-green-500" />}
              {connectionStatus === "error" && <XCircle className="h-5 w-5 text-red-500" />}
              Database Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span>Connection Status:</span>
              <Badge
                variant={
                  connectionStatus === "connected"
                    ? "default"
                    : connectionStatus === "error"
                      ? "destructive"
                      : "secondary"
                }
              >
                {connectionStatus === "connected" ? "Connected" : connectionStatus === "error" ? "Error" : "Testing..."}
              </Badge>
            </div>
            <Button onClick={testConnection} variant="outline" size="sm" className="mt-3 bg-transparent">
              Test Connection Again
            </Button>
          </CardContent>
        </Card>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              {editingId ? "Edit Test Record" : "Add Test Record"}
            </CardTitle>
            <CardDescription>
              {editingId ? "Update the existing record" : "Create a new test record in the database"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter a name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  type="text"
                  placeholder="Enter a description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="test_data">Test Data</Label>
                <Textarea
                  id="test_data"
                  placeholder="Enter some test data"
                  value={formData.test_data}
                  onChange={(e) => setFormData({ ...formData, test_data: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : editingId ? "Update Record" : "Create Record"}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={cancelEdit}>
                    Cancel Edit
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Records List */}
        <Card>
          <CardHeader>
            <CardTitle>Test Records</CardTitle>
            <CardDescription>Records stored in the database ({records.length} total)</CardDescription>
          </CardHeader>
          <CardContent>
            {loading && records.length === 0 ? (
              <div className="text-center py-8">Loading records...</div>
            ) : records.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No records found. Create your first test record above.
              </div>
            ) : (
              <div className="space-y-3">
                {records.map((record) => (
                  <div key={record.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{record.name}</h3>
                        {record.description && <p className="text-gray-600 mt-1">{record.description}</p>}
                        {record.test_data && (
                          <div className="mt-2">
                            <span className="text-sm font-medium text-gray-500">Test Data:</span>
                            <p className="text-sm bg-gray-50 p-2 rounded mt-1">{record.test_data}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                          <span>ID: {record.id}</span>
                          <span>Created: {new Date(record.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button onClick={() => handleEdit(record)} variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(record.id, record.name)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Alert>
          <AlertDescription>
            <strong>Purpose:</strong> This page tests basic database connectivity by creating a simple test table and
            performing CRUD operations. If this works, we know the database connection is solid and we can proceed with
            the environment variable cleanup and structure fixes.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
