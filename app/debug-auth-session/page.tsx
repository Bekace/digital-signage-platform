"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  Database,
  Key,
  Cookie,
  Globe,
  User,
  FileText,
  Music,
  ExternalLink,
} from "lucide-react"

interface TokenInfo {
  valid: boolean
  exists: boolean
  length: number
  parts: number
  userId?: number
  email?: string
  expires?: number
  timeUntilExpiry?: string
  error?: string
}

interface ApiTestResult {
  endpoint: string
  status: number
  success: boolean
  data?: any
  error?: string
  headers?: any
}

interface AuthTest {
  name: string
  status: "success" | "error" | "warning"
  message: string
  details?: any
}

export default function DebugAuthSessionPage() {
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [cookies, setCookies] = useState<string[]>([])
  const [authTests, setAuthTests] = useState<AuthTest[]>([])
  const [apiTests, setApiTests] = useState<ApiTestResult[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    runInitialTests()
  }, [])

  const getTokenInfo = (token?: string): TokenInfo => {
    try {
      const actualToken = token || (typeof window !== "undefined" ? localStorage.getItem("token") : null)

      if (!actualToken) {
        return {
          valid: false,
          exists: false,
          length: 0,
          parts: 0,
          error: "No token found in localStorage",
        }
      }

      const parts = actualToken.split(".")
      const info: TokenInfo = {
        valid: false,
        exists: true,
        length: actualToken.length,
        parts: parts.length,
      }

      if (parts.length !== 3) {
        info.error = `Token format is invalid (${parts.length} parts instead of 3)`
        return info
      }

      try {
        const payload = JSON.parse(atob(parts[1]))
        info.userId = payload.userId
        info.email = payload.email
        info.expires = payload.exp

        const now = Math.floor(Date.now() / 1000)
        if (payload.exp && payload.exp < now) {
          info.error = "Token is expired"
          return info
        }

        if (payload.exp) {
          const timeLeft = payload.exp - now
          if (timeLeft > 0) {
            const hours = Math.floor(timeLeft / 3600)
            const minutes = Math.floor((timeLeft % 3600) / 60)
            info.timeUntilExpiry = `${hours}h ${minutes}m`
          }
        }

        info.valid = true
      } catch (decodeError) {
        info.error = `Token decode failed: ${decodeError instanceof Error ? decodeError.message : "Unknown error"}`
      }

      return info
    } catch (error) {
      return {
        valid: false,
        exists: false,
        length: 0,
        parts: 0,
        error: `Analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      }
    }
  }

  const runInitialTests = async () => {
    console.log("🔍 [DEBUG] Starting authentication debugging...")

    // Test 1: Check localStorage token
    const token = localStorage.getItem("token")
    const tokenInfo = getTokenInfo(token)
    setTokenInfo(tokenInfo)

    // Test 2: Check cookies
    const allCookies = document.cookie
      .split(";")
      .map((c) => c.trim())
      .filter((c) => c.length > 0)
    setCookies(allCookies)

    // Test 3: Basic auth tests
    const tests: AuthTest[] = []

    if (tokenInfo.exists) {
      tests.push({
        name: "Token Exists",
        status: "success",
        message: "Authentication token found in localStorage",
      })
    } else {
      tests.push({
        name: "Token Exists",
        status: "error",
        message: "No authentication token found in localStorage",
      })
    }

    if (tokenInfo.valid) {
      tests.push({
        name: "Token Valid",
        status: "success",
        message: "Token is valid and not expired",
      })
    } else {
      tests.push({
        name: "Token Valid",
        status: "error",
        message: tokenInfo.error || "Token is invalid",
      })
    }

    setAuthTests(tests)
  }

  const runApiTests = async () => {
    setLoading(true)
    const results: ApiTestResult[] = []

    try {
      // Test auth headers generation
      const token = localStorage.getItem("token")
      let authHeaders = null
      let authHeadersError = null

      try {
        if (token) {
          authHeaders = {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        } else {
          authHeadersError = "No token available"
        }
      } catch (error) {
        authHeadersError = error instanceof Error ? error.message : "Unknown error"
      }

      results.push({
        endpoint: "Auth Headers Generation",
        status: authHeaders ? 200 : 400,
        success: !!authHeaders,
        error: authHeadersError,
        data: authHeaders,
      })

      // Test user profile API
      try {
        const profileResponse = await fetch("/api/user/profile", {
          headers: authHeaders || {},
        })
        const profileData = await profileResponse.json()

        results.push({
          endpoint: "User Profile API",
          status: profileResponse.status,
          success: profileResponse.ok,
          data: profileData,
          error: profileResponse.ok ? undefined : profileData.error,
        })
      } catch (error) {
        results.push({
          endpoint: "User Profile API",
          status: 0,
          success: false,
          error: error instanceof Error ? error.message : "Network error",
        })
      }

      // Test media API
      try {
        const mediaResponse = await fetch("/api/media", {
          headers: authHeaders || {},
        })
        const mediaData = await mediaResponse.json()

        results.push({
          endpoint: "Media API",
          status: mediaResponse.status,
          success: mediaResponse.ok,
          data: mediaData,
          error: mediaResponse.ok ? undefined : mediaData.error,
        })
      } catch (error) {
        results.push({
          endpoint: "Media API",
          status: 0,
          success: false,
          error: error instanceof Error ? error.message : "Network error",
        })
      }

      // Test playlists API
      try {
        const playlistsResponse = await fetch("/api/playlists", {
          headers: authHeaders || {},
        })
        const playlistsData = await playlistsResponse.json()

        results.push({
          endpoint: "Playlists API",
          status: playlistsResponse.status,
          success: playlistsResponse.ok,
          data: playlistsData,
          error: playlistsResponse.ok ? undefined : playlistsData.error,
        })
      } catch (error) {
        results.push({
          endpoint: "Playlists API",
          status: 0,
          success: false,
          error: error instanceof Error ? error.message : "Network error",
        })
      }
    } catch (error) {
      console.error("Error running API tests:", error)
    }

    setApiTests(results)
    setLoading(false)
  }

  const refreshTests = async () => {
    setRefreshing(true)
    await runInitialTests()
    setRefreshing(false)
  }

  const clearToken = () => {
    localStorage.removeItem("token")
    runInitialTests()
  }

  const testPageAccess = (page: string) => {
    window.open(`/dashboard/${page}`, "_blank")
  }

  const getStatusIcon = (status: "success" | "error" | "warning") => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status: "success" | "error" | "warning") => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800"
      case "error":
        return "bg-red-100 text-red-800"
      case "warning":
        return "bg-yellow-100 text-yellow-800"
    }
  }

  const successfulTests = authTests.filter((t) => t.status === "success").length
  const successfulApiCalls = apiTests.filter((t) => t.success).length

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Authentication Session Debug</h1>
          <p className="text-gray-600">Diagnose authentication issues with Media and Playlist pages</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshTests} disabled={refreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh Tests
          </Button>
          <Button onClick={clearToken} variant="destructive">
            Clear Token
          </Button>
        </div>
      </div>

      {/* Quick Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Key className="h-4 w-4 mr-2" />
              Token Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tokenInfo?.valid ? "Valid" : "Invalid"}</div>
            <p className="text-xs text-gray-500">{tokenInfo?.error || "Token is working correctly"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Auth Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {successfulTests}/{authTests.length}
            </div>
            <p className="text-xs text-gray-500">Tests passing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Globe className="h-4 w-4 mr-2" />
              API Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {successfulApiCalls}/{apiTests.length}
            </div>
            <p className="text-xs text-gray-500">API calls successful</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Quick Diagnosis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {!tokenInfo?.exists
                ? "No authentication token found. User needs to log in."
                : !tokenInfo?.valid
                  ? "Token is invalid or expired. Re-authentication required."
                  : successfulApiCalls < apiTests.length
                    ? "API authentication failing. Check server logs."
                    : "Authentication appears to be working correctly."}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="token" className="space-y-4">
        <TabsList>
          <TabsTrigger value="token">Token Information</TabsTrigger>
          <TabsTrigger value="cookies">Browser Cookies</TabsTrigger>
          <TabsTrigger value="api">API Tests</TabsTrigger>
          <TabsTrigger value="pages">Page Access</TabsTrigger>
          <TabsTrigger value="flow">Auth Flow</TabsTrigger>
        </TabsList>

        <TabsContent value="token" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="h-5 w-5 mr-2" />
                Token Information
              </CardTitle>
              <CardDescription>Detailed analysis of the authentication token</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium">Exists</label>
                  <div className="flex items-center mt-1">
                    {tokenInfo?.exists ? (
                      <Badge className="bg-green-100 text-green-800">Yes</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800">No</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Valid</label>
                  <div className="flex items-center mt-1">
                    {tokenInfo?.valid ? (
                      <Badge className="bg-green-100 text-green-800">Yes</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800">No</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Length</label>
                  <div className="mt-1 text-sm">{tokenInfo?.length || 0} characters</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Parts</label>
                  <div className="mt-1 text-sm">{tokenInfo?.parts || 0} (should be 3)</div>
                </div>
              </div>

              {tokenInfo?.userId && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">User ID</label>
                    <div className="mt-1 text-sm">{tokenInfo.userId}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <div className="mt-1 text-sm">{tokenInfo.email}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Expires In</label>
                    <div className="mt-1 text-sm">{tokenInfo.timeUntilExpiry || "Unknown"}</div>
                  </div>
                </div>
              )}

              {tokenInfo?.error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Error:</strong> {tokenInfo.error}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cookies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Cookie className="h-5 w-5 mr-2" />
                Browser Cookies
              </CardTitle>
              <CardDescription>Analysis of browser cookies and auth-token presence</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Total Cookies</label>
                  <div className="mt-1 text-2xl font-bold">{cookies.length}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Auth Token Cookie</label>
                  <div className="mt-1">
                    {cookies.some((c) => c.startsWith("auth-token=")) ? (
                      <Badge className="bg-green-100 text-green-800">Present</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800">Missing</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">All Cookies:</label>
                <div className="mt-2 space-y-1">
                  {cookies.length > 0 ? (
                    cookies.map((cookie, index) => (
                      <div key={index} className="text-sm font-mono bg-gray-100 p-2 rounded">
                        {cookie}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">No cookies found</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                API Authentication Tests
              </CardTitle>
              <CardDescription>Test authentication against various API endpoints</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={runApiTests} disabled={loading}>
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  "Run API Tests"
                )}
              </Button>

              {apiTests.length > 0 && (
                <div className="space-y-3">
                  {apiTests.map((test, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{test.endpoint}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge className={test.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            {test.success ? "success" : "error"}
                          </Badge>
                          <Badge variant="outline">{test.status}</Badge>
                        </div>
                      </div>

                      {test.error && (
                        <Alert variant="destructive" className="mb-2">
                          <AlertDescription>
                            <strong>Details:</strong> {test.error}
                          </AlertDescription>
                        </Alert>
                      )}

                      {test.data && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm text-gray-600">View Response Data</summary>
                          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                            {JSON.stringify(test.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                Page Access Tests
              </CardTitle>
              <CardDescription>Test access to problematic pages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={() => testPageAccess("media")}
                  variant="outline"
                  className="flex items-center justify-center"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Test Media Page
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
                <Button
                  onClick={() => testPageAccess("playlists")}
                  variant="outline"
                  className="flex items-center justify-center"
                >
                  <Music className="h-4 w-4 mr-2" />
                  Test Playlist Page
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </div>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Opens in new tab:</strong> If these pages redirect to login, check the console logs in the new
                  tabs for specific error messages.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Authentication Flow Tests
              </CardTitle>
              <CardDescription>Step-by-step authentication validation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {authTests.map((test, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(test.status)}
                      <div>
                        <div className="font-medium">{test.name}</div>
                        <div className="text-sm text-gray-600">{test.message}</div>
                      </div>
                    </div>
                    <Badge className={getStatusColor(test.status)}>{test.status}</Badge>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-3">
                <h4 className="font-medium">Additional Checks:</h4>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {localStorage.getItem("token") ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <div>
                      <div className="font-medium">LocalStorage Token</div>
                      <div className="text-sm text-gray-600">
                        {localStorage.getItem("token") ? "Token present in localStorage" : "No token in localStorage"}
                      </div>
                    </div>
                  </div>
                  <Badge
                    className={
                      localStorage.getItem("token") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }
                  >
                    {localStorage.getItem("token") ? "success" : "error"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {cookies.some((c) => c.startsWith("auth-token=")) ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    )}
                    <div>
                      <div className="font-medium">Auth Cookie</div>
                      <div className="text-sm text-gray-600">
                        {cookies.some((c) => c.startsWith("auth-token="))
                          ? "Auth cookie found"
                          : "No auth-token cookie found"}
                      </div>
                    </div>
                  </div>
                  <Badge
                    className={
                      cookies.some((c) => c.startsWith("auth-token="))
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }
                  >
                    {cookies.some((c) => c.startsWith("auth-token=")) ? "success" : "warning"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
