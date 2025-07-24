"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, Database, Plus, Trash2, Edit, CheckCircle, AlertCircle, Wifi, WifiOff } from "lucide-react"

interface TestRecord {
  id: number
  name: string
  email: string
  created_at: string
}

interface ConnectionStatus {
  connected: boolean
  database: string
  host: string
  timestamp: string
}

export default function DatabaseTestFormPage() {
  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState<TestRecord[]>([])
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)

  useEffect(() => {
    checkConnection()
    fetchRecords()
  }, [])

  const checkConnection = async () => {
    try {
      const response = await fetch("/api/database-test-form/connection")
      const data = await response.json()
      setConnectionStatus(data)
    } catch (err) {
      console.error("Connection check failed:", err)
      setConnectionStatus({
        connected: false,
        database: "Unknown",
        host: "Unknown",
        timestamp: new Date().toISOString(),
      })
    }
  }

  const fetchRecords = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/database-test-form")
      const data = await response.json()

      if (response.ok) {
        setRecords(data.records || [])
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
    if (!name.trim() || !email.trim()) {
      setError("Name and email are required")
      return
    }

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
        body: JSON.stringify({ name, email }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(editingId ? "Record updated successfully!" : "Record created successfully!")
        setName("")
        setEmail("")
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
    setName(record.name)
    setEmail(record.email)
    setEditingId(record.id)
    setError(null)
    setSuccess(null)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this record?")) return

    setLoading(true)
    setError(null)
    setSuccess(null)

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
    setName("")
    setEmail("")
    setEditingId(null)
    setError(null)
    setSuccess(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Database className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Database Test Form</h1>
          </div>
          <p className="text-gray-600">Test database connectivity and CRUD operations</p>
        </div>

        {/* Connection Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              {connectionStatus?.connected ? (
                <Wifi className="h-5 w-5 text-green-600 mr-2" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-600 mr-2" />
              )}
              Database Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {connectionStatus ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge variant={connectionStatus.connected ? "default" : "destructive"}>
                    {connectionStatus.connected ? "Connected" : "Disconnected"}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    Last checked: {new Date(connectionStatus.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="text-sm space-y-1">
                  <p>
                    <strong>Database:</strong> {connectionStatus.database}
                  </p>
                  <p>
                    <strong>Host:</strong> {connectionStatus.host}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Checking connection...
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="h-5 w-5 mr-2" />
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
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email"
                    required
                  />
                </div>
                <div className="flex space-x-2">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? (
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
                </div>
              </form>

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="mt-4">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Records List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Test Records
                </div>
                <Badge variant="secondary">{records.length} records</Badge>
              </CardTitle>
              <CardDescription>All test records in the database</CardDescription>
            </CardHeader>
            <CardContent>
              {loading && records.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Loading records...
                </div>
              ) : records.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No records found. Create your first test record!</div>
              ) : (
                <div className="space-y-3">
                  {records.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{record.name}</div>
                        <div className="text-sm text-gray-600">{record.email}</div>
                        <div className="text-xs text-gray-400">
                          ID: {record.id} • Created: {new Date(record.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(record)} disabled={loading}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(record.id)} disabled={loading}>
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

        {/* Test Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Test Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">What This Tests</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>
                    • <strong>Database Connection:</strong> Verifies your DATABASE_URL is working
                  </li>
                  <li>
                    • <strong>Table Creation:</strong> Creates a test_records table if it doesn't exist
                  </li>
                  <li>
                    • <strong>CRUD Operations:</strong> Create, Read, Update, Delete functionality
                  </li>
                  <li>
                    • <strong>Real-time Updates:</strong> Form updates the list immediately
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Success Indicators</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Connection status shows "Connected"</li>
                  <li>• You can create new records</li>
                  <li>• Records appear in the list immediately</li>
                  <li>• You can edit and delete records</li>
                  <li>• Check your Neon dashboard to see the test_records table</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
