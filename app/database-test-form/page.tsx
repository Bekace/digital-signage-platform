"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, Database, Plus, Trash2, Edit, CheckCircle, AlertCircle, RefreshCw } from "lucide-react"

interface TestRecord {
  id: number
  name: string
  email: string
  created_at: string
}

export default function DatabaseTestFormPage() {
  const [loading, setLoading] = useState(false)
  const [connectionLoading, setConnectionLoading] = useState(false)
  const [records, setRecords] = useState<TestRecord[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<string>("unknown")
  const [connectionDetails, setConnectionDetails] = useState<any>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  })
  const [editingId, setEditingId] = useState<number | null>(null)

  const testConnection = async () => {
    setConnectionLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/database-test-form/connection")
      const data = await response.json()

      if (response.ok) {
        setConnectionStatus("connected")
        setConnectionDetails(data)
        setSuccess("Database connection successful!")
      } else {
        setConnectionStatus("error")
        setError(data.error || "Connection test failed")
      }
    } catch (err) {
      setConnectionStatus("error")
      setError("Network error: Failed to test connection")
      console.error("Error:", err)
    } finally {
      setConnectionLoading(false)
    }
  }

  const fetchRecords = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/database-test-form")
      const data = await response.json()

      if (response.ok) {
        setRecords(data.records)
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
    setLoading(true)
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
        setSuccess(editingId ? "Record updated successfully!" : "Record created successfully!")
        setFormData({ name: "", email: "" })
        setEditingId(null)
        fetchRecords()
      } else {
        setError(data.error || "Failed to save record")
      }
    } catch (err) {
      setError("Network error: Failed to save record")
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (record: TestRecord) => {
    setFormData({
      name: record.name,
      email: record.email,
    })
    setEditingId(record.id)
    setError(null)
    setSuccess(null)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this record?")) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/database-test-form/${id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Record deleted successfully!")
        fetchRecords()
      } else {
        setError(data.error || "Failed to delete record")
      }
    } catch (err) {
      setError("Network error: Failed to delete record")
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const cancelEdit = () => {
    setFormData({ name: "", email: "" })
    setEditingId(null)
    setError(null)
    setSuccess(null)
  }

  useEffect(() => {
    testConnection()
    fetchRecords()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Database className="h-8 w-8 mr-3 text-blue-600" />
            Database Test Form
          </h1>
          <p className="text-gray-600 mt-2">Test database connectivity and CRUD operations</p>
        </div>

        {/* Connection Status */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Connection Status
              </CardTitle>
              <Button onClick={testConnection} disabled={connectionLoading} variant="outline" size="sm">
                {connectionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Test Connection
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {connectionStatus === "connected" ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : connectionStatus === "error" ? (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                ) : (
                  <Database className="h-5 w-5 text-gray-400" />
                )}
                <Badge
                  variant={
                    connectionStatus === "connected"
                      ? "default"
                      : connectionStatus === "error"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {connectionStatus === "connected" ? "Connected" : connectionStatus === "error" ? "Error" : "Unknown"}
                </Badge>
              </div>
              {connectionDetails && (
                <div className="text-sm text-gray-600">
                  <span>Test query executed at: {new Date(connectionDetails.timestamp).toLocaleString()}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {editingId ? <Edit className="h-5 w-5 mr-2" /> : <Plus className="h-5 w-5 mr-2" />}
                {editingId ? "Edit Record" : "Create New Record"}
              </CardTitle>
              <CardDescription>
                {editingId ? "Update the existing test record" : "Add a new test record to the database"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email"
                    required
                  />
                </div>
                <div className="flex space-x-2">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : editingId ? (
                      <Edit className="h-4 w-4 mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    {editingId ? "Update Record" : "Create Record"}
                  </Button>
                  {editingId && (
                    <Button type="button" onClick={cancelEdit} variant="outline">
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Records List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Test Records
                </CardTitle>
                <Button onClick={fetchRecords} disabled={loading} variant="outline" size="sm">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Refresh
                </Button>
              </div>
              <CardDescription>Records stored in the test_records table</CardDescription>
            </CardHeader>
            <CardContent>
              {loading && records.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="ml-2">Loading records...</span>
                </div>
              ) : records.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No records found. Create your first test record!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {records.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{record.name}</p>
                        <p className="text-sm text-gray-600">{record.email}</p>
                        <p className="text-xs text-gray-400">Created: {new Date(record.created_at).toLocaleString()}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button onClick={() => handleEdit(record)} size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => handleDelete(record.id)} size="sm" variant="destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Status Messages */}
        {error && (
          <Alert variant="destructive" className="mt-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mt-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
