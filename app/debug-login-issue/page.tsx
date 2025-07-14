"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface DebugResult {
  step: string
  status: "success" | "error" | "info"
  message: string
  data?: any
}

export default function DebugLoginIssuePage() {
  const [results, setResults] = useState<DebugResult[]>([])
  const [loading, setLoading] = useState(false)
  const [testEmail, setTestEmail] = useState("demo@signagecloud.com")
  const [testPassword, setTestPassword] = useState("password123")

  const addResult = (step: string, status: "success" | "error" | "info", message: string, data?: any) => {
    setResults((prev) => [...prev, { step, status, message, data }])
  }

  const clearResults = () => {
    setResults([])
  }

  const runFullDiagnostic = async () => {
    setLoading(true)
    clearResults()

    try {
      // Step 1: Check database connection
      addResult("Database Connection", "info", "Testing database connectivity...")
      const dbResponse = await fetch("/api/test-db")
      const dbData = await dbResponse.json()

      if (dbData.success) {
        addResult("Database Connection", "success", "Database connected successfully", dbData)
      } else {
        addResult("Database Connection", "error", "Database connection failed", dbData)
        return
      }

      // Step 2: Check users table structure
      addResult("Users Table", "info", "Checking users table structure...")
      const tableResponse = await fetch("/api/debug-login-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check_table_structure" }),
      })
      const tableData = await tableResponse.json()
      addResult("Users Table", tableData.success ? "success" : "error", tableData.message, tableData.data)

      // Step 3: Check if demo user exists
      addResult("Demo User Check", "info", "Checking if demo user exists...")
      const userResponse = await fetch("/api/debug-login-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check_demo_user", email: testEmail }),
      })
      const userData = await userResponse.json()
      addResult("Demo User Check", userData.success ? "success" : "error", userData.message, userData.data)

      // Step 4: Test password hashing
      addResult("Password Hash Test", "info", "Testing password hashing...")
      const hashResponse = await fetch("/api/debug-login-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test_password_hash", email: testEmail, password: testPassword }),
      })
      const hashData = await hashResponse.json()
      addResult("Password Hash Test", hashData.success ? "success" : "error", hashData.message, hashData.data)

      // Step 5: Test JWT token generation
      addResult("JWT Token Test", "info", "Testing JWT token generation...")
      const jwtResponse = await fetch("/api/debug-login-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test_jwt", userId: 1, email: testEmail }),
      })
      const jwtData = await jwtResponse.json()
      addResult("JWT Token Test", jwtData.success ? "success" : "error", jwtData.message, jwtData.data)

      // Step 6: Test full login flow
      addResult("Login Flow Test", "info", "Testing complete login flow...")
      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail, password: testPassword }),
      })
      const loginData = await loginResponse.json()
      addResult(
        "Login Flow Test",
        loginData.success ? "success" : "error",
        loginData.message || "Login attempt completed",
        loginData,
      )
    } catch (error) {
      addResult(
        "Diagnostic Error",
        "error",
        `Unexpected error: ${error instanceof Error ? error.message : "Unknown error"}`,
      )
    } finally {
      setLoading(false)
    }
  }

  const testSpecificUser = async () => {
    if (!testEmail || !testPassword) {
      addResult("Input Validation", "error", "Please provide both email and password")
      return
    }

    setLoading(true)
    clearResults()

    try {
      addResult("Custom User Test", "info", `Testing login for: ${testEmail}`)

      const response = await fetch("/api/debug-login-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test_specific_user",
          email: testEmail,
          password: testPassword,
        }),
      })

      const data = await response.json()
      addResult("Custom User Test", data.success ? "success" : "error", data.message, data.data)
    } catch (error) {
      addResult("Custom User Test", "error", `Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  const createDemoUser = async () => {
    setLoading(true)
    addResult("Demo User Creation", "info", "Creating demo user...")

    try {
      const response = await fetch("/api/debug-login-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_demo_user" }),
      })

      const data = await response.json()
      addResult("Demo User Creation", data.success ? "success" : "error", data.message, data.data)
    } catch (error) {
      addResult("Demo User Creation", "error", `Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800 border-green-200"
      case "error":
        return "bg-red-100 text-red-800 border-red-200"
      case "info":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Login Issue Diagnostic Tool</h1>
        <p className="text-gray-600">Comprehensive debugging for authentication issues</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Control Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Diagnostic Controls</CardTitle>
              <CardDescription>Run tests to identify login issues</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={runFullDiagnostic} disabled={loading} className="w-full" size="lg">
                {loading ? "Running Diagnostics..." : "Run Full Diagnostic"}
              </Button>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="test-email">Test Email</Label>
                <Input
                  id="test-email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Enter email to test"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="test-password">Test Password</Label>
                <Input
                  id="test-password"
                  type="password"
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                  placeholder="Enter password to test"
                />
              </div>

              <Button onClick={testSpecificUser} disabled={loading} variant="outline" className="w-full bg-transparent">
                Test Specific User
              </Button>

              <Separator />

              <Button onClick={createDemoUser} disabled={loading} variant="secondary" className="w-full">
                Create/Reset Demo User
              </Button>

              <Button onClick={clearResults} variant="ghost" className="w-full">
                Clear Results
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Diagnostic Results</CardTitle>
              <CardDescription>
                {results.length > 0 ? `${results.length} test results` : "No tests run yet"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {results.length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      Click "Run Full Diagnostic" to start testing the authentication system.
                    </AlertDescription>
                  </Alert>
                ) : (
                  results.map((result, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{result.step}</h4>
                        <Badge className={getStatusColor(result.status)}>{result.status.toUpperCase()}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{result.message}</p>
                      {result.data && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-blue-600 hover:text-blue-800">View Details</summary>
                          <pre className="mt-2 p-2 bg-gray-50 rounded overflow-x-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Expected Demo User Credentials</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Email</Label>
              <p className="font-mono text-sm bg-gray-100 p-2 rounded">demo@signagecloud.com</p>
            </div>
            <div>
              <Label>Password</Label>
              <p className="font-mono text-sm bg-gray-100 p-2 rounded">password123</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
