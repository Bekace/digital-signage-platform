"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Database, Key, User, Clock, Server, Globe } from "lucide-react"

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

interface AuthTest {
  name: string
  status: "pending" | "success" | "error" | "warning"
  message: string
  details?: any
}

export default function DebugAuthSessionPage() {
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [cookieInfo, setCookieInfo] = useState<any>(null)
  const [authTests, setAuthTests] = useState<AuthTest[]>([])
  const [apiTests, setApiTests] = useState<AuthTest[]>([])
  const [loading, setLoading] = useState(false)

  const analyzeToken = () => {
    try {
      const token = localStorage.getItem("token")

      if (!token) {
        setTokenInfo({
          valid: false,
          exists: false,
          length: 0,
          parts: 0,
          error: "No token found in localStorage",
        })
        return
      }

      const parts = token.split(".")
      const info: TokenInfo = {
        valid: false,
        exists: true,
        length: token.length,
        parts: parts.length,
      }

      if (parts.length !== 3) {
        info.error = `Invalid JWT format (${parts.length} parts instead of 3)`
        setTokenInfo(info)
        return
      }

      try {
        // Decode JWT payload
        const payload = JSON.parse(atob(parts[1]))
        info.userId = payload.userId
        info.email = payload.email
        info.expires = payload.exp

        const now = Math.floor(Date.now() / 1000)
        if (payload.exp && payload.exp < now) {
          info.error = "Token is expired"
        } else if (payload.exp) {
          const timeLeft = payload.exp - now
          const hours = Math.floor(timeLeft / 3600)
          const minutes = Math.floor((timeLeft % 3600) / 60)
          info.timeUntilExpiry = `${hours}h ${minutes}m`
          info.valid = true
        }
      } catch (decodeError) {
        info.error = `Failed to decode token: ${decodeError}`
      }

      setTokenInfo(info)
    } catch (error) {
      setTokenInfo({
        valid: false,
        exists: false,
        length: 0,
        parts: 0,
        error: `Analysis failed: ${error}`,
      })
    }
  }

  const analyzeCookies = () => {
    const cookies = document.cookie.split(";").reduce(
      (acc, cookie) => {
        const [name, value] = cookie.trim().split("=")
        acc[name] = value
        return acc
      },
      {} as Record<string, string>,
    )

    setCookieInfo({
      all: cookies,
      authToken: cookies["auth-token"] || null,
      count: Object.keys(cookies).length,
    })
  }

  const runAuthTests = async () => {
    const tests: AuthTest[] = []

    // Test 1: LocalStorage token
    const token = localStorage.getItem("token")
    tests.push({
      name: "LocalStorage Token",
      status: token ? "success" : "error",
      message: token ? `Token exists (${token.length} chars)` : "No token in localStorage",
      details: token ? token.substring(0, 50) + "..." : null,
    })

    // Test 2: Cookie auth-token
    const authCookie = document.cookie.split(";").find((c) => c.trim().startsWith("auth-token="))
    tests.push({
      name: "Auth Cookie",
      status: authCookie ? "success" : "warning",
      message: authCookie ? "Auth cookie exists" : "No auth-token cookie found",
      details: authCookie ? authCookie.substring(0, 50) + "..." : null,
    })

    // Test 3: Token format validation
    if (token) {
      const parts = token.split(".")
      tests.push({
        name: "Token Format",
        status: parts.length === 3 ? "success" : "error",
        message: `JWT has ${parts.length} parts (should be 3)`,
        details: parts.map((part, i) => `Part ${i + 1}: ${part.length} chars`),
      })

      // Test 4: Token expiration
      try {
        const payload = JSON.parse(atob(parts[1]))
        const now = Math.floor(Date.now() / 1000)
        const isExpired = payload.exp && payload.exp < now

        tests.push({
          name: "Token Expiration",
          status: isExpired ? "error" : "success",
          message: isExpired ? "Token is expired" : "Token is valid",
          details: {
            expires: payload.exp ? new Date(payload.exp * 1000).toISOString() : "No expiration",
            userId: payload.userId,
            email: payload.email,
          },
        })
      } catch (e) {
        tests.push({
          name: "Token Decode",
          status: "error",
          message: "Failed to decode token payload",
          details: e,
        })
      }
    }

    setAuthTests(tests)
  }

  const runApiTests = async () => {
    setLoading(true)
    const tests: AuthTest[] = []

    // Test auth headers function
    try {
      const { getAuthHeaders } = await import("@/lib/auth-utils")
      const headers = getAuthHeaders()

      tests.push({
        name: "Auth Headers Generation",
        status: headers ? "success" : "error",
        message: headers ? "Headers generated successfully" : "Failed to generate auth headers",
        details: headers,
      })

      // Test API calls with different endpoints
      const endpoints = [
        { name: "User Profile", url: "/api/user/profile" },
        { name: "Media API", url: "/api/media" },
        { name: "Playlists API", url: "/api/playlists" },
      ]

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint.url, {
            headers: headers || {},
          })

          const data = await response.json()

          tests.push({
            name: `${endpoint.name} API`,
            status: response.ok ? "success" : "error",
            message: `${response.status} ${response.statusText}`,
            details: {
              status: response.status,
              headers: Object.fromEntries(response.headers.entries()),
              data: data,
            },
          })
        } catch (error) {
          tests.push({
            name: `${endpoint.name} API`,
            status: "error",
            message: `Network error: ${error}`,
            details: error,
          })
        }
      }
    } catch (importError) {
      tests.push({
        name: "Auth Utils Import",
        status: "error",
        message: `Failed to import auth-utils: ${importError}`,
        details: importError,
      })
    }

    setApiTests(tests)
    setLoading(false)
  }

  const clearAuth = () => {
    localStorage.removeItem("token")
    document.cookie = "auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    window.location.reload()
  }

  const testMediaPage = () => {
    window.open("/dashboard/media", "_blank")
  }

  const testPlaylistPage = () => {
    window.open("/dashboard/playlists", "_blank")
  }

  useEffect(() => {
    analyzeToken()
    analyzeCookies()
    runAuthTests()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800"
      case "error":
        return "bg-red-100 text-red-800"
      case "warning":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Authentication Session Debug</h1>
          <p className="text-gray-600">Diagnose session handling issues for Media and Playlist pages</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              runAuthTests()
              runApiTests()
            }}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh Tests
          </Button>
          <Button variant="destructive" onClick={clearAuth}>
            Clear Auth
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="token">Token Analysis</TabsTrigger>
          <TabsTrigger value="cookies">Cookies</TabsTrigger>
          <TabsTrigger value="api">API Tests</TabsTrigger>
          <TabsTrigger value="pages">Page Tests</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Token Status</CardTitle>
                <Key className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tokenInfo?.valid ? "Valid" : "Invalid"}</div>
                <p className="text-xs text-muted-foreground">{tokenInfo?.error || "Token is working correctly"}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Auth Tests</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {authTests.filter((t) => t.status === "success").length}/{authTests.length}
                </div>
                <p className="text-xs text-muted-foreground">Tests passing</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">API Tests</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {apiTests.filter((t) => t.status === "success").length}/{apiTests.length}
                </div>
                <p className="text-xs text-muted-foreground">API calls successful</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Diagnosis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {!tokenInfo?.exists && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>No authentication token found. User needs to log in.</AlertDescription>
                </Alert>
              )}

              {tokenInfo?.exists && !tokenInfo?.valid && (
                <Alert>
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>Token exists but is invalid: {tokenInfo.error}</AlertDescription>
                </Alert>
              )}

              {tokenInfo?.valid && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Authentication token is valid. Expires in {tokenInfo.timeUntilExpiry}.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="token" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Token Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tokenInfo && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Exists</label>
                    <div className="flex items-center gap-2">
                      {tokenInfo.exists ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span>{tokenInfo.exists ? "Yes" : "No"}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Valid</label>
                    <div className="flex items-center gap-2">
                      {tokenInfo.valid ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span>{tokenInfo.valid ? "Yes" : "No"}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Length</label>
                    <div>{tokenInfo.length} characters</div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Parts</label>
                    <div>{tokenInfo.parts} (should be 3)</div>
                  </div>

                  {tokenInfo.userId && (
                    <div>
                      <label className="text-sm font-medium">User ID</label>
                      <div>{tokenInfo.userId}</div>
                    </div>
                  )}

                  {tokenInfo.email && (
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <div>{tokenInfo.email}</div>
                    </div>
                  )}

                  {tokenInfo.timeUntilExpiry && (
                    <div>
                      <label className="text-sm font-medium">Expires In</label>
                      <div>{tokenInfo.timeUntilExpiry}</div>
                    </div>
                  )}

                  {tokenInfo.error && (
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-red-600">Error</label>
                      <div className="text-red-600">{tokenInfo.error}</div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cookies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Browser Cookies</CardTitle>
            </CardHeader>
            <CardContent>
              {cookieInfo && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Total Cookies</label>
                    <div>{cookieInfo.count}</div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Auth Token Cookie</label>
                    <div className="flex items-center gap-2">
                      {cookieInfo.authToken ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span>{cookieInfo.authToken ? "Present" : "Missing"}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">All Cookies</label>
                    <div className="bg-gray-100 p-2 rounded text-sm font-mono">
                      {Object.entries(cookieInfo.all).map(([name, value]) => (
                        <div key={name}>
                          {name}: {value}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">API Authentication Tests</h3>
            <Button onClick={runApiTests} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Run API Tests
            </Button>
          </div>

          <div className="space-y-2">
            {apiTests.map((test, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(test.status)}
                      <span className="font-medium">{test.name}</span>
                    </div>
                    <Badge className={getStatusColor(test.status)}>{test.status}</Badge>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">{test.message}</div>
                  {test.details && (
                    <details className="mt-2">
                      <summary className="text-sm cursor-pointer">Details</summary>
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                        {JSON.stringify(test.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Page Access Tests</CardTitle>
              <p className="text-sm text-gray-600">Test access to problematic pages</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={testMediaPage} variant="outline" className="h-20 bg-transparent">
                  <div className="text-center">
                    <Database className="h-6 w-6 mx-auto mb-2" />
                    <div>Test Media Page</div>
                    <div className="text-xs text-gray-500">Opens in new tab</div>
                  </div>
                </Button>

                <Button onClick={testPlaylistPage} variant="outline" className="h-20 bg-transparent">
                  <div className="text-center">
                    <Globe className="h-6 w-6 mx-auto mb-2" />
                    <div>Test Playlist Page</div>
                    <div className="text-xs text-gray-500">Opens in new tab</div>
                  </div>
                </Button>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  If these pages redirect to login, check the console logs in the new tabs for specific error messages.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Authentication Flow Tests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {authTests.map((test, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(test.status)}
                    <span className="font-medium">{test.name}</span>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(test.status)}>{test.status}</Badge>
                    <div className="text-xs text-gray-600">{test.message}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
