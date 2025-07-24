"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, Database, Plus, Trash2, Edit, CheckCircle, AlertCircle, RefreshCw, Wifi, WifiOff } from "lucide-react"

interface TestRecord {
  id: number
  name: string
  description: string | null
  test_data: string | null
  created_at: string
  updated_at?: string
}

interface ConnectionStatus {
  success: boolean
  status: string
  database?: string
  user?: string
  tableCount?: number
  timestamp: string
}

export default function DatabaseTestFormPage() {
  const [records, setRecords] = useState<TestRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    test_data: "",
  })

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null)

  const fetchConnectionStatus = async () => {
    try {
      const response = await fetch("/api/database-test-form/connection")
      const data = await response.json()
      setConnectionStatus(data)
    } catch (err) {
      console.error("Connection test failed:", err)
      setConnectionStatus({
        success: false,
        status: "error",
        timestamp: new Date().toISOString(),
      })
    }
  }

  const fetchRecords = async () => {
    try {
      const response = await fetch("/api/database-test-form")
      const data = await response.json()

      if (response.ok) {
        setRecords(data.records || [])
        setError(null)
      } else {
        setError(data.error || "Failed to fetch records")
      }
    } catch (err) {
      setError("Network error: Failed to fetch records")
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      setError("Name is required")
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const url = editingId ? `/api/database-test-form/${editingId}` : "/api/database-test-form"

      const method = editingId ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(data.message)
        setFormData({ name: "", description: "", test_data: "" })
        setEditingId(null)
        fetchRecords()
      } else {
        setError(data.error || "Failed to save record")
      }
    } catch (err) {
      setError("Network error: Failed to save record")
      console.error("Error:", err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (record: TestRecord) => {
    setFormData({
      name: record.name,
      description: record.description || "",
      test_data: record.test_data || "",
    })
    setEditingId(record.id)
    setError(null)
    setSuccess(null)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this record?")) return

    try {
      const response = await fetch(`/api/database-test-form/${id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(data.message)
        fetchRecords()
      } else {
        setError(data.error || "Failed to delete record")
      }
    } catch (err) {
      setError("Network error: Failed to delete record")
      console.error("Error:", err)
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setFormData({ name: "", description: "", test_data: "" })
    setError(null)
    setSuccess(null)
  }

  useEffect(() => {
    fetchConnectionStatus()
    fetchRecords()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Database className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Database Test Form</h1>
          </div>
          <p className="text-gray-600">Test database connectivity and CRUD operations</p>
        </div>

        {/* Connection Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              {connectionStatus?.success ? (
                <Wifi className="h-5 w-5 text-green-600 mr-2" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-600 mr-2" />
              )}
              Database Connection
            </CardTitle>
          </CardHeader>
          <CardContent>
            {connectionStatus ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge variant={connectionStatus.success ? "default" : "destructive"}>
                    {connectionStatus.status}
                  </Badge>
                  {connectionStatus.database && <Badge variant="outline">DB: {connectionStatus.database}</Badge>}
                  {connectionStatus.tableCount && <Badge variant="outline">{connectionStatus.tableCount} tables</Badge>}
                </div>
                <p className="text-sm text-gray-500">
                  Last checked: {new Date(connectionStatus.timestamp).toLocaleString()}
                </p>
              </div>
            ) : (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Testing connection...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              {editingId ? "Edit Record" : "Create Test Record"}
            </CardTitle>
            <CardDescription>
              {editingId ? "Update the existing record" : "Add a new test record to the database"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  Name *
                </label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter a name"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1">
                  Description
                </label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter a description (optional)"
                  rows={3}
                />
              </div>

              <div>
                <label htmlFor="test_data" className="block text-sm font-medium mb-1">
                  Test Data
                </label>
                <Textarea
                  id="test_data"
                  value={formData.test_data}
                  onChange={(e) => setFormData({ ...formData, test_data: e.target.value })}
                  placeholder="Enter any test data (optional)"
                  rows={3}
                />
              </div>

              <div className="flex space-x-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {editingId ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      {editingId ? <Edit className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                      {editingId ? "Update Record" : "Create Record"}
                    </>
                  )}
                </Button>

                {editingId && (
                  <Button type="button" variant="outline" onClick={cancelEdit}>
                    Cancel
                  </Button>
                )}

                <Button type="button" variant="outline" onClick={fetchRecords}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Records List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Test Records ({records.length})</span>
              <Button variant="outline" size="sm" onClick={fetchRecords} disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </CardTitle>
            <CardDescription>All test records in the database</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Loading records...
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No test records found. Create one above to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {records.map((record) => (
                  <div
                    key={record.id}
                    className={`p-4 border rounded-lg ${
                      editingId === record.id ? "border-blue-300 bg-blue-50" : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium">{record.name}</h3>
                          <Badge variant="outline">ID: {record.id}</Badge>
                        </div>

                        {record.description && <p className="text-gray-600 mb-2">{record.description}</p>}

                        {record.test_data && (
                          <div className="mb-2">
                            <label className="text-xs font-medium text-gray-500">Test Data:</label>
                            <p className="text-sm bg-gray-100 p-2 rounded mt-1">{record.test_data}</p>
                          </div>
                        )}

                        <div className="text-xs text-gray-500">
                          Created: {new Date(record.created_at).toLocaleString()}
                          {record.updated_at && record.updated_at !== record.created_at && (
                            <span className="ml-4">Updated: {new Date(record.updated_at).toLocaleString()}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(record)}
                          disabled={editingId === record.id}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(record.id)}>
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
      </div>
    </div>
  )
}
