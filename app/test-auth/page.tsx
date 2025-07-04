"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react"

interface TestResult {
  name: string
  status: "success" | "error" | "loading"
  message: string
  data?: any
}

export default function TestAuthPage() {
  const [tests, setTests] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const updateTest = (name: string, status: "success" | "error" | "loading", message: string, data?: any) => {
    setTests((prev) => {
      const existing = prev.find((t) => t.name === name)
      if (existing) {
        existing.status = status
        existing.message = message
        existing.data = data
        return [...prev]
      } else {
        return [...prev, { name, status, message, data }]
      }
    })
  }

  const runTest = async (name: string, testFn: () => Promise<void>) => {
    updateTest(name, "loading", "Running...")
    try {
      await testFn()
    } catch (error) {
      updateTest(name, "error", error instanceof Error ? error.message : "Unknown error")
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    setTests([])

    // Test 1: Check if we're in browser
    await runTest("Browser Environment", async () => {
      if (typeof window === "undefined") {
        throw new Error("Not in browser environment")
      }
      updateTest("Browser Environment", "success", "Running in browser")
    })

    // Test 2: Check cookies
    await runTest("Cookie Check", async () => {
      const cookies = document.cookie
      const authToken = cookies.split(";").find((c) => c.trim().startsWith("auth-token="))
      if (authToken) {
        updateTest("Cookie Check", "success", `Auth token found: ${authToken.substring(0, 50)}...`)
      } else {
        updateTest("Cookie Check", "error", "No auth-token cookie found")
      }
    })

    // Test 3: Test auth check API
    await runTest("Auth Check API", async () => {
      const response = await fetch("/api/auth/check", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.ok) {
        updateTest("Auth Check API", "success", `Status: ${response.status}`, data)
      } else {
        updateTest("Auth Check API", "error", `Status: ${response.status} - ${data.error || "Unknown error"}`, data)
      }
    })

    // Test 4: Test database connection
    await runTest("Database Connection", async () => {
      const response = await fetch("/api/debug/test-db", {
        method: "GET",
        credentials: "include",
      })

      const data = await response.json()

      if (response.ok) {
        updateTest("Database Connection", "success", `Database connected`, data)
      } else {
        updateTest("Database Connection", "error", `Database error: ${data.error}`, data)
      }
    })

    // Test 5: Test devices API
    await runTest("Devices API", async () => {
      const response = await fetch("/api/devices", {
        method: "GET",
        credentials: "include",
      })

      const data = await response.json()

      if (response.ok) {
        updateTest("Devices API", "success", `Devices loaded: ${data.devices?.length || 0} devices`, data)
      } else {
        updateTest("Devices API", "error", `Devices API error: ${data.error}`, data)
      }
    })

    // Test 6: Test generate code API
    await runTest("Generate Code API", async () => {
      const response = await fetch("/api/devices/generate-code", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Test Device",
          type: "web",
        }),
      })

      const data = await response.json()

      if (response.ok) {
        updateTest("Generate Code API", "success", `Code generated: ${data.code}`, data)
      } else {
        updateTest("Generate Code API", "error", `Generate code error: ${data.error}`, data)
      }
    })

    setIsRunning(false)
  }

  const getStatusIcon = (status: "success" | "error" | "loading") => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "loading":
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
    }
  }

  const getStatusBadge = (status: "success" | "error" | "loading") => {
    switch (status) {
      case "success":
        return (
          <Badge variant="default" className="bg-green-500">
            Success
          </Badge>
        )
      case "error":
        return <Badge variant="destructive">Error</Badge>
      case "loading":
        return <Badge variant="secondary">Loading</Badge>
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Authentication & API Test Dashboard</h1>
        <p className="text-gray-600">Comprehensive testing of authentication and API endpoints</p>
      </div>

      <div className="mb-6">
        <Button onClick={runAllTests} disabled={isRunning} className="w-full">
          {isRunning ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Running Tests...
            </>
          ) : (
            "Run All Tests"
          )}
        </Button>
      </div>

      <div className="space-y-4">
        {tests.map((test, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(test.status)}
                  {test.name}
                </div>
                {getStatusBadge(test.status)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-2">{test.message}</p>
              {test.data && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm font-medium">View Raw Data</summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                    {JSON.stringify(test.data, null, 2)}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {tests.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Click "Run All Tests" to start diagnosing authentication and API issues.</AlertDescription>
        </Alert>
      )}

      <div className="mt-8 p-4 bg-gray-50 rounded">
        <h3 className="font-semibold mb-2">Quick Manual Tests:</h3>
        <ul className="text-sm space-y-1">
          <li>
            • Check if you can access{" "}
            <a href="/dashboard" className="text-blue-600 underline">
              /dashboard
            </a>
          </li>
          <li>
            • Try opening{" "}
            <a href="/dashboard/screens" className="text-blue-600 underline">
              /dashboard/screens
            </a>
          </li>
          <li>• Test the Add Screen button functionality</li>
          <li>• Check browser console for any JavaScript errors</li>
        </ul>
      </div>
    </div>
  )
}
