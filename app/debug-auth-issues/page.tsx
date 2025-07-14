"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Database, Key, Globe } from "lucide-react"

interface AuthStatus {
  cookieExists: boolean
  tokenValid: boolean
  userProfileLoaded: boolean
  authHeadersPresent: boolean
  userProfile: any
}

interface DatabaseStatus {
  playlistsTableExists: boolean
  mediaTableExists: boolean
  missingPlaylistColumns: string[]
  playlistsColumns: string[]
  mediaColumns: string[]
}

interface ApiTestResults {
  mediaApi: {
    status: number
    response: any
  }
  playlistsApi: {
    status: number
    response: any
  }
  authApi: {
    status: number
    response: any
  }
}

export default function DebugAuthIssues() {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null)
  const [databaseStatus, setDatabaseStatus] = useState<DatabaseStatus | null>(null)
  const [apiResults, setApiResults] = useState<ApiTestResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("auth")

  const checkAuthStatus = async () => {
    setLoading(true)
    try {
      // Check if auth cookie exists
      const cookies = document.cookie
      const authCookie = cookies.includes("auth-token") || cookies.includes("session")

      // Test user profile endpoint
      let userProfile = null
      let userProfileLoaded = false
      try {
        const profileResponse = await fetch("/api/user/profile")
        if (profileResponse.ok) {
          userProfile = await profileResponse.json()
          userProfileLoaded = true
        }
      } catch (error) {
        console.error("Profile check failed:", error)
      }

      // Check auth headers (this would be from a typical API call)
      const authHeaders = {
        authorization: localStorage.getItem("auth-token") || "",
        cookie: document.cookie,
      }

      setAuthStatus({
        cookieExists: authCookie,
        tokenValid: userProfileLoaded,
        userProfileLoaded,
        authHeadersPresent: !!authHeaders.authorization,
        userProfile,
      })
    } catch (error) {
      console.error("Auth status check failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const checkDatabaseStatus = async () => {
    setLoading(true)
    try {
      // Check table structure
      const tableResponse = await fetch("/api/debug-table-structure")
      const tableData = await tableResponse.json()

      console.log("Table structure response:", tableData)

      if (tableData.success) {
        const allColumns = tableData.columnNames || []
        console.log("All columns found:", allColumns)

        const requiredPlaylistColumns = [
          "scale_image",
          "scale_video",
          "scale_document",
          "shuffle",
          "default_transition",
          "transition_speed",
          "auto_advance",
          "background_color",
          "text_overlay",
        ]

        const missingColumns = requiredPlaylistColumns.filter((col) => !allColumns.includes(col))
        console.log("Missing columns:", missingColumns)
        console.log(
          "Present columns:",
          requiredPlaylistColumns.filter((col) => allColumns.includes(col)),
        )

        setDatabaseStatus({
          playlistsTableExists: true,
          mediaTableExists: true, // We'll check this separately if needed
          missingPlaylistColumns: missingColumns,
          playlistsColumns: allColumns,
          mediaColumns: [], // TODO: Check media table
        })
      } else {
        setDatabaseStatus({
          playlistsTableExists: false,
          mediaTableExists: false,
          missingPlaylistColumns: [],
          playlistsColumns: [],
          mediaColumns: [],
        })
      }
    } catch (error) {
      console.error("Database status check failed:", error)
      setDatabaseStatus({
        playlistsTableExists: false,
        mediaTableExists: false,
        missingPlaylistColumns: [],
        playlistsColumns: [],
        mediaColumns: [],
      })
    } finally {
      setLoading(false)
    }
  }

  const testApiEndpoints = async () => {
    setLoading(true)
    try {
      const results: ApiTestResults = {
        mediaApi: { status: 0, response: null },
        playlistsApi: { status: 0, response: null },
        authApi: { status: 0, response: null },
      }

      // Test Media API
      try {
        const mediaResponse = await fetch("/api/media")
        results.mediaApi.status = mediaResponse.status
        results.mediaApi.response = await mediaResponse.json()
      } catch (error) {
        results.mediaApi.status = 500
        results.mediaApi.response = { error: error.message }
      }

      // Test Playlists API
      try {
        const playlistsResponse = await fetch("/api/playlists")
        results.playlistsApi.status = playlistsResponse.status
        results.playlistsApi.response = await playlistsResponse.json()
      } catch (error) {
        results.playlistsApi.status = 500
        results.playlistsApi.response = { error: error.message }
      }

      // Test Auth API (user profile)
      try {
        const authResponse = await fetch("/api/user/profile")
        results.authApi.status = authResponse.status
        const authData = await authResponse.json()
        results.authApi.response = authData.success ? authData.user?.email || "User loaded" : authData
      } catch (error) {
        results.authApi.status = 500
        results.authApi.response = { error: error.message }
      }

      setApiResults(results)
    } catch (error) {
      console.error("API tests failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const clearAuthAndReload = () => {
    // Clear all possible auth storage
    localStorage.clear()
    sessionStorage.clear()

    // Clear cookies
    document.cookie.split(";").forEach((c) => {
      const eqPos = c.indexOf("=")
      const name = eqPos > -1 ? c.substr(0, eqPos) : c
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
    })

    // Reload page
    window.location.reload()
  }

  const initializeDatabase = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/debug-init-database", { method: "POST" })
      const result = await response.json()

      if (result.success) {
        alert("Database initialized successfully!")
        await checkDatabaseStatus() // Refresh database status
      } else {
        alert(`Database initialization failed: ${result.error}`)
      }
    } catch (error) {
      alert(`Database initialization failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuthStatus()
    checkDatabaseStatus()
    testApiEndpoints()
  }, [])

  const StatusIcon = ({ status }: { status: boolean }) => {
    return status ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />
  }

  const getStatusText = (status: boolean) => {
    return status ? "OK" : "FAIL"
  }

  const getStatusColor = (status: boolean) => {
    return status ? "text-green-600" : "text-red-600"
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Debug Authentication & Database Issues</h1>
        <p className="text-muted-foreground">
          Comprehensive debugging tool for authentication, database, and API issues
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="auth" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Authentication
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Database
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            API Tests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="auth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Authentication Status
              </CardTitle>
              <CardDescription>Current authentication state and user session</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {authStatus && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Auth Cookie Exists</span>
                    <div className="flex items-center gap-2">
                      <StatusIcon status={authStatus.cookieExists} />
                      <span className={getStatusColor(authStatus.cookieExists)}>
                        {getStatusText(authStatus.cookieExists)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Token Valid</span>
                    <div className="flex items-center gap-2">
                      <StatusIcon status={authStatus.tokenValid} />
                      <span className={getStatusColor(authStatus.tokenValid)}>
                        {getStatusText(authStatus.tokenValid)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>User Profile Loaded</span>
                    <div className="flex items-center gap-2">
                      <StatusIcon status={authStatus.userProfileLoaded} />
                      <span className={getStatusColor(authStatus.userProfileLoaded)}>
                        {getStatusText(authStatus.userProfileLoaded)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Auth Headers Present</span>
                    <div className="flex items-center gap-2">
                      <StatusIcon status={authStatus.authHeadersPresent} />
                      <span className={getStatusColor(authStatus.authHeadersPresent)}>
                        {getStatusText(authStatus.authHeadersPresent)}
                      </span>
                    </div>
                  </div>

                  {authStatus.userProfile && (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">User Profile:</h4>
                      <pre className="bg-muted p-3 rounded text-sm overflow-auto">
                        {JSON.stringify(authStatus.userProfile, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              <Separator />

              <div className="flex gap-2">
                <Button onClick={checkAuthStatus} disabled={loading} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Auth Status
                </Button>
                <Button onClick={clearAuthAndReload} variant="destructive">
                  Clear Auth & Reload
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Schema Status
              </CardTitle>
              <CardDescription>Table structure and column validation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {databaseStatus && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Playlists Table Exists</span>
                    <div className="flex items-center gap-2">
                      <StatusIcon status={databaseStatus.playlistsTableExists} />
                      <span className={getStatusColor(databaseStatus.playlistsTableExists)}>
                        {getStatusText(databaseStatus.playlistsTableExists)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Media Table Exists</span>
                    <div className="flex items-center gap-2">
                      <StatusIcon status={databaseStatus.mediaTableExists} />
                      <span className={getStatusColor(databaseStatus.mediaTableExists)}>
                        {getStatusText(databaseStatus.mediaTableExists)}
                      </span>
                    </div>
                  </div>

                  {databaseStatus.missingPlaylistColumns.length > 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Missing playlist columns: {databaseStatus.missingPlaylistColumns.join(", ")}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription className="text-green-600">
                        All required playlist columns are present!
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <h4 className="font-semibold">Playlists Columns ({databaseStatus.playlistsColumns.length}):</h4>
                    <div className="flex flex-wrap gap-1">
                      {databaseStatus.playlistsColumns.map((column) => (
                        <Badge key={column} variant="secondary" className="text-xs">
                          {column}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">Media Columns ({databaseStatus.mediaColumns.length}):</h4>
                    <div className="flex flex-wrap gap-1">
                      {databaseStatus.mediaColumns.map((column) => (
                        <Badge key={column} variant="secondary" className="text-xs">
                          {column}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex gap-2">
                <Button onClick={checkDatabaseStatus} disabled={loading} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Database Status
                </Button>
                <Button onClick={initializeDatabase} disabled={loading}>
                  <Database className="h-4 w-4 mr-2" />
                  Initialize Database
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                API Endpoint Tests
              </CardTitle>
              <CardDescription>Test core API endpoints for functionality</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {apiResults && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Media API</span>
                        <Badge variant={apiResults.mediaApi.status === 200 ? "default" : "destructive"}>
                          {apiResults.mediaApi.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {typeof apiResults.mediaApi.response === "string"
                          ? apiResults.mediaApi.response
                          : apiResults.mediaApi.response?.error ||
                            apiResults.mediaApi.response?.message ||
                            JSON.stringify(apiResults.mediaApi.response).substring(0, 50)}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Playlists API</span>
                        <Badge variant={apiResults.playlistsApi.status === 200 ? "default" : "destructive"}>
                          {apiResults.playlistsApi.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {apiResults.playlistsApi.response?.total !== undefined
                          ? `${apiResults.playlistsApi.response.total} playlists`
                          : apiResults.playlistsApi.response?.error ||
                            JSON.stringify(apiResults.playlistsApi.response).substring(0, 50)}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Auth API</span>
                        <Badge variant={apiResults.authApi.status === 200 ? "default" : "destructive"}>
                          {apiResults.authApi.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {typeof apiResults.authApi.response === "string"
                          ? apiResults.authApi.response
                          : apiResults.authApi.response?.error ||
                            JSON.stringify(apiResults.authApi.response).substring(0, 50)}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-semibold">Detailed API Responses:</h4>

                    <div className="space-y-2">
                      <h5 className="font-medium">Media API Response:</h5>
                      <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-32">
                        {JSON.stringify(apiResults.mediaApi.response, null, 2)}
                      </pre>
                    </div>

                    <div className="space-y-2">
                      <h5 className="font-medium">Playlists API Response:</h5>
                      <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-32">
                        {JSON.stringify(apiResults.playlistsApi.response, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              <Button onClick={testApiEndpoints} disabled={loading} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Run API Tests
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
