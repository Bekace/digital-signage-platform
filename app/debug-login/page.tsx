"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bug, Database, User, Key, CheckCircle, XCircle, RefreshCw, Eye, EyeOff } from "lucide-react"

interface DebugData {
  database: {
    connection: string
    tableStructure: Array<{
      column_name: string
      data_type: string
      is_nullable: string
      column_default: string | null
    }>
    userCount: number
    users: Array<{
      id: number
      email: string
      first_name: string
      last_name: string
      company: string | null
      plan: string
      is_admin: boolean
      created_at: string
      password_status: string
    }>
  }
  demoUser: any
  environment: {
    DATABASE_URL: boolean
    JWT_SECRET: boolean
    NODE_ENV: string
  }
  timestamp: string
}

export default function DebugLoginPage() {
  const [debugData, setDebugData] = useState<DebugData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [testEmail, setTestEmail] = useState("demo@signagecloud.com")
  const [testPassword, setTestPassword] = useState("password123")
  const [showPassword, setShowPassword] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const [actionResult, setActionResult] = useState<any>(null)

  const fetchDebugData = async () => {
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/debug-login")
      const data = await response.json()

      if (data.success) {
        setDebugData(data.debug)
      } else {
        setError(data.error || "Failed to fetch debug data")
      }
    } catch (err) {
      setError("Network error: " + (err instanceof Error ? err.message : "Unknown error"))
    } finally {
      setLoading(false)
    }
  }

  const createDemoUser = async () => {
    setLoading(true)
    setActionResult(null)
    try {
      const response = await fetch("/api/debug-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_demo_user" }),
      })
      const data = await response.json()
      setActionResult(data)
      if (data.success) {
        fetchDebugData() // Refresh data
      }
    } catch (err) {
      setActionResult({
        success: false,
        message: "Network error: " + (err instanceof Error ? err.message : "Unknown error"),
      })
    } finally {
      setLoading(false)
    }
  }

  const testLogin = async () => {
    setLoading(true)
    setTestResult(null)
    try {
      const response = await fetch("/api/debug-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test_login",
          email: testEmail,
          password: testPassword,
        }),
      })
      const data = await response.json()
      setTestResult(data)
    } catch (err) {
      setTestResult({
        success: false,
        message: "Network error: " + (err instanceof Error ? err.message : "Unknown error"),
      })
    } finally {
      setLoading(false)
    }
  }

  const testActualLogin = async () => {
    setLoading(true)
    setTestResult(null)
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      })
      const data = await response.json()
      setTestResult({
        success: data.success,
        message: data.message,
        debug: {
          actualLoginAPI: true,
          user: data.user,
          hasToken: !!data.token,
        },
      })
    } catch (err) {
      setTestResult({
        success: false,
        message: "Network error: " + (err instanceof Error ? err.message : "Unknown error"),
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDebugData()
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Bug className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Login Debug Dashboard</h1>
        <Button variant="outline" size="sm" onClick={fetchDebugData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="test">Test Login</TabsTrigger>
          <TabsTrigger value="fix">Quick Fix</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Database</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  {debugData?.database?.connection === "OK" ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm">{debugData?.database?.connection || "Unknown"}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Users</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{debugData?.database?.userCount || 0}</div>
                <p className="text-xs text-muted-foreground">Total users in database</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Demo User</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  {debugData?.demoUser && debugData.demoUser !== "NOT_FOUND" ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm">
                    {debugData?.demoUser && debugData.demoUser !== "NOT_FOUND" ? "Exists" : "Missing"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Environment</CardTitle>
                <Key className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    {debugData?.environment?.DATABASE_URL ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-500" />
                    )}
                    <span className="text-xs">DB URL</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {debugData?.environment?.JWT_SECRET ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-500" />
                    )}
                    <span className="text-xs">JWT Secret</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Table Structure</CardTitle>
              <CardDescription>Users table schema and configuration</CardDescription>
            </CardHeader>
            <CardContent>
              {debugData?.database?.tableStructure ? (
                <div className="space-y-2">
                  {debugData.database.tableStructure.map((column, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{column.column_name}</Badge>
                        <span className="text-sm text-muted-foreground">{column.data_type}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {column.is_nullable === "YES" && <Badge variant="secondary">Nullable</Badge>}
                        {column.column_default && <Badge variant="outline">Default: {column.column_default}</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No table structure data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Users in Database</CardTitle>
              <CardDescription>Current users and their status</CardDescription>
            </CardHeader>
            <CardContent>
              {debugData?.database?.users && debugData.database.users.length > 0 ? (
                <div className="space-y-2">
                  {debugData.database.users.map((user, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="space-y-1">
                        <div className="font-medium">{user.email}</div>
                        <div className="text-sm text-muted-foreground">
                          {user.first_name} {user.last_name} • {user.plan}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={user.password_status === "HAS_PASSWORD" ? "default" : "destructive"}>
                          {user.password_status}
                        </Badge>
                        {user.is_admin && <Badge variant="secondary">Admin</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No users found in database</p>
              )}
            </CardContent>
          </Card>

          {debugData?.demoUser && debugData.demoUser !== "NOT_FOUND" && (
            <Card>
              <CardHeader>
                <CardTitle>Demo User Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <strong>Email:</strong> {debugData.demoUser.email}
                  </div>
                  <div>
                    <strong>Name:</strong> {debugData.demoUser.first_name} {debugData.demoUser.last_name}
                  </div>
                  <div>
                    <strong>Plan:</strong> {debugData.demoUser.plan}
                  </div>
                  <div>
                    <strong>Password Status:</strong> {debugData.demoUser.password_status}
                  </div>
                  <div>
                    <strong>Password Length:</strong> {debugData.demoUser.password_length || 0} characters
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Login Functionality</CardTitle>
              <CardDescription>Test login with different credentials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="test-email">Email</Label>
                  <Input
                    id="test-email"
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="test-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="test-password"
                      type={showPassword ? "text" : "password"}
                      value={testPassword}
                      onChange={(e) => setTestPassword(e.target.value)}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button onClick={testLogin} disabled={loading}>
                  Test Login (Debug)
                </Button>
                <Button onClick={testActualLogin} disabled={loading} variant="outline">
                  Test Actual Login API
                </Button>
              </div>

              {testResult && (
                <Alert variant={testResult.success ? "default" : "destructive"}>
                  <div className="flex items-center space-x-2">
                    {testResult.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    <AlertDescription>
                      <div className="space-y-2">
                        <div>
                          <strong>Result:</strong> {testResult.message}
                        </div>
                        {testResult.debug && (
                          <div className="text-sm">
                            <strong>Debug Info:</strong>
                            <pre className="mt-1 text-xs bg-muted p-2 rounded">
                              {JSON.stringify(testResult.debug, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </div>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fix" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Fix Actions</CardTitle>
              <CardDescription>Common fixes for login issues</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Button onClick={createDemoUser} disabled={loading} className="w-full">
                  Create/Update Demo User
                </Button>
                <p className="text-sm text-muted-foreground">
                  Creates or updates the demo user (demo@signagecloud.com) with proper password hashing
                </p>
              </div>

              {actionResult && (
                <Alert variant={actionResult.success ? "default" : "destructive"}>
                  <div className="flex items-center space-x-2">
                    {actionResult.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    <AlertDescription>{actionResult.message}</AlertDescription>
                  </div>
                </Alert>
              )}

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium">Common Issues & Solutions:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>
                    • <strong>User not found:</strong> Create demo user above
                  </li>
                  <li>
                    • <strong>Invalid password:</strong> Password might not be properly hashed
                  </li>
                  <li>
                    • <strong>Database connection:</strong> Check DATABASE_URL environment variable
                  </li>
                  <li>
                    • <strong>JWT errors:</strong> Check JWT_SECRET environment variable
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {debugData && (
        <Card>
          <CardHeader>
            <CardTitle>Raw Debug Data</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(debugData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
