"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, XCircle, AlertTriangle, Database, Key, Server, RefreshCw, Bug, Settings } from "lucide-react"

interface AuthDebugInfo {
  cookieToken: string | null
  cookieExists: boolean
  tokenValid: boolean
  tokenDecoded: any
  userProfile: any
  authHeaders: any
}

interface DatabaseDebugInfo {
  playlistsTableExists: boolean
  playlistsColumns: string[]
  missingColumns: string[]
  mediaTableExists: boolean
  mediaColumns: string[]
  sampleData: any
  tables: any
}

interface APIDebugInfo {
  mediaApiStatus: number
  mediaApiResponse: any
  playlistsApiStatus: number
  playlistsApiResponse: any
  authApiStatus: number
  authApiResponse: any
}

export default function DebugAuthIssuesPage() {
  const [authDebug, setAuthDebug] = useState<AuthDebugInfo | null>(null)
  const [dbDebug, setDbDebug] = useState<DatabaseDebugInfo | null>(null)
  const [apiDebug, setApiDebug] = useState<APIDebugInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("auth")

  const runAuthDiagnostics = async () => {
    setLoading(true)
    try {
      // Check client-side auth state
      const cookieToken =
        document.cookie
          .split("; ")
          .find((row) => row.startsWith("auth-token="))
          ?.split("=")[1] || null

      let tokenDecoded = null
      let tokenValid = false

      if (cookieToken) {
        try {
          // Basic token validation (check if it's JWT format)
          const parts = cookieToken.split(".")
          if (parts.length === 3) {
            tokenDecoded = JSON.parse(atob(parts[1]))
            tokenValid = tokenDecoded.exp > Date.now() / 1000
          }
        } catch (e) {
          console.error("Token decode error:", e)
        }
      }

      // Test auth headers
      const authHeaders = cookieToken
        ? {
            Authorization: `Bearer ${cookieToken}`,
            "Content-Type": "application/json",
          }
        : null

      // Test user profile endpoint
      let userProfile = null
      try {
        const response = await fetch("/api/user/profile", {
          headers: authHeaders || {},
        })
        if (response.ok) {
          userProfile = await response.json()
        }
      } catch (e) {
        console.error("Profile fetch error:", e)
      }

      setAuthDebug({
        cookieToken,
        cookieExists: !!cookieToken,
        tokenValid,
        tokenDecoded,
        userProfile,
        authHeaders,
      })
    } catch (error) {
      console.error("Auth diagnostics error:", error)
    } finally {
      setLoading(false)
    }
  }

  const runDatabaseDiagnostics = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/debug-table-structure")
      const data = await response.json()

      const playlistsColumns = data.tables?.playlists?.columns || []
      const mediaColumns = data.tables?.media_files?.columns || []

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

      const missingColumns = requiredPlaylistColumns.filter((col) => !playlistsColumns.includes(col))

      setDbDebug({
        playlistsTableExists: !!data.tables?.playlists?.exists,
        playlistsColumns,
        missingColumns,
        mediaTableExists: !!data.tables?.media_files?.exists,
        mediaColumns,
        sampleData: data.sampleData || {},
        tables: data.tables || {},
      })
    } catch (error) {
      console.error("Database diagnostics error:", error)
    } finally {
      setLoading(false)
    }
  }

  const runAPIDiagnostics = async () => {
    setLoading(true)
    try {
      const authHeaders = authDebug?.authHeaders || {}

      // Test Media API
      let mediaApiStatus = 0
      let mediaApiResponse = null
      try {
        const response = await fetch("/api/media", { headers: authHeaders })
        mediaApiStatus = response.status
        mediaApiResponse = await response.json()
      } catch (e) {
        mediaApiResponse = { error: e.message }
      }

      // Test Playlists API
      let playlistsApiStatus = 0
      let playlistsApiResponse = null
      try {
        const response = await fetch("/api/playlists", { headers: authHeaders })
        playlistsApiStatus = response.status
        playlistsApiResponse = await response.json()
      } catch (e) {
        playlistsApiResponse = { error: e.message }
      }

      // Test Auth API
      let authApiStatus = 0
      let authApiResponse = null
      try {
        const response = await fetch("/api/user/profile", { headers: authHeaders })
        authApiStatus = response.status
        authApiResponse = await response.json()
      } catch (e) {
        authApiResponse = { error: e.message }
      }

      setApiDebug({
        mediaApiStatus,
        mediaApiResponse,
        playlistsApiStatus,
        playlistsApiResponse,
        authApiStatus,
        authApiResponse,
      })
    } catch (error) {
      console.error("API diagnostics error:", error)
    } finally {
      setLoading(false)
    }
  }

  const initializeDatabase = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/debug-init-database", {
        method: "POST",
      })
      const result = await response.json()

      if (result.success) {
        alert("Database initialized successfully!")
        runDatabaseDiagnostics()
      } else {
        alert("Database initialization failed: " + result.error)
      }
    } catch (error) {
      alert("Database initialization failed: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const fixPlaylistsTable = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/debug-fix-playlists-table", {
        method: "POST",
      })
      const result = await response.json()

      if (result.success) {
        alert("Playlists table fixed successfully!")
        runDatabaseDiagnostics()
      } else {
        alert("Fix failed: " + result.error)
      }
    } catch (error) {
      alert("Fix failed: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const refreshAuth = async () => {
    try {
      // Clear existing auth
      document.cookie = "auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"

      // Redirect to login
      window.location.href = "/login"
    } catch (error) {
      console.error("Auth refresh error:", error)
    }
  }

  const testAuthentication = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/debug-auth-test")
      const result = await response.json()

      console.log("Auth test result:", result)

      if (result.success) {
        alert(`Authentication successful! User: ${result.user.email}`)
      } else {
        alert(`Authentication failed: ${result.error}`)
      }
    } catch (error) {
      alert(`Authentication test failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runAuthDiagnostics()
    runDatabaseDiagnostics()
  }, [])

  useEffect(() => {
    if (authDebug) {
      runAPIDiagnostics()
    }
  }, [authDebug])

  const getStatusIcon = (status: boolean | number) => {
    if (typeof status === "boolean") {
      return status ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />
    }
    if (status >= 200 && status < 300) {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    }
    return <XCircle className="h-4 w-4 text-red-500" />
  }

  const getStatusBadge = (status: boolean | number) => {
    if (typeof status === "boolean") {
      return <Badge variant={status ? "default" : "destructive"}>{status ? "OK" : "FAIL"}</Badge>
    }
    const variant = status >= 200 && status < 300 ? "default" : "destructive"
    return <Badge variant={variant}>{status}</Badge>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bug className="h-8 w-8" />
            Authentication & Database Debug
          </h1>
          <p className="text-gray-600">Diagnose and fix authentication and database issues</p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Page
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
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
            <Server className="h-4 w-4" />
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
            </CardHeader>
            <CardContent className="space-y-4">
              {authDebug ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span>Auth Cookie Exists</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(authDebug.cookieExists)}
                        {getStatusBadge(authDebug.cookieExists)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded">
                      <span>Token Valid</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(authDebug.tokenValid)}
                        {getStatusBadge(authDebug.tokenValid)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded">
                      <span>User Profile Loaded</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(!!authDebug.userProfile?.user)}
                        {getStatusBadge(!!authDebug.userProfile?.user)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded">
                      <span>Auth Headers Present</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(!!authDebug.authHeaders)}
                        {getStatusBadge(!!authDebug.authHeaders)}
                      </div>
                    </div>
                  </div>

                  {!authDebug.cookieExists && authDebug.userProfile?.user && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        User profile loads but no auth cookie exists. This suggests the authentication system is working
                        but cookies aren't being set properly.
                      </AlertDescription>
                    </Alert>
                  )}

                  {authDebug.tokenDecoded && (
                    <div className="p-4 bg-gray-50 rounded">
                      <h4 className="font-medium mb-2">Token Details:</h4>
                      <pre className="text-sm overflow-auto">{JSON.stringify(authDebug.tokenDecoded, null, 2)}</pre>
                    </div>
                  )}

                  {authDebug.userProfile && (
                    <div className="p-4 bg-gray-50 rounded">
                      <h4 className="font-medium mb-2">User Profile:</h4>
                      <pre className="text-sm overflow-auto">{JSON.stringify(authDebug.userProfile, null, 2)}</pre>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={runAuthDiagnostics} disabled={loading}>
                      Re-run Auth Diagnostics
                    </Button>
                    <Button onClick={testAuthentication} variant="outline" disabled={loading}>
                      Test Authentication
                    </Button>
                    <Button onClick={refreshAuth} variant="outline">
                      Clear Auth & Login
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2">Running authentication diagnostics...</p>
                </div>
              )}
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
            </CardHeader>
            <CardContent className="space-y-4">
              {dbDebug ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span>Playlists Table Exists</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(dbDebug.playlistsTableExists)}
                        {getStatusBadge(dbDebug.playlistsTableExists)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded">
                      <span>Media Table Exists</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(dbDebug.mediaTableExists)}
                        {getStatusBadge(dbDebug.mediaTableExists)}
                      </div>
                    </div>
                  </div>

                  {(!dbDebug.playlistsTableExists || !dbDebug.mediaTableExists) && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>Core tables are missing. Database needs to be initialized.</AlertDescription>
                    </Alert>
                  )}

                  {dbDebug.missingColumns.length > 0 && dbDebug.playlistsTableExists && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>Missing playlist columns: {dbDebug.missingColumns.join(", ")}</AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded">
                      <h4 className="font-medium mb-2">Playlists Columns ({dbDebug.playlistsColumns.length}):</h4>
                      <div className="text-sm space-y-1 max-h-40 overflow-auto">
                        {dbDebug.playlistsColumns.length > 0 ? (
                          dbDebug.playlistsColumns.map((col) => (
                            <div key={col} className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                              {col}
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-500">No columns found</div>
                        )}
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded">
                      <h4 className="font-medium mb-2">Media Columns ({dbDebug.mediaColumns.length}):</h4>
                      <div className="text-sm space-y-1 max-h-40 overflow-auto">
                        {dbDebug.mediaColumns.length > 0 ? (
                          dbDebug.mediaColumns.map((col) => (
                            <div key={col} className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                              {col}
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-500">No columns found</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {dbDebug.tables && Object.keys(dbDebug.tables).length > 0 && (
                    <div className="p-4 bg-gray-50 rounded">
                      <h4 className="font-medium mb-2">All Tables Status:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                        {Object.entries(dbDebug.tables).map(([tableName, tableInfo]: [string, any]) => (
                          <div key={tableName} className="flex items-center gap-2">
                            {getStatusIcon(tableInfo.exists)}
                            <span className={tableInfo.exists ? "text-green-700" : "text-red-700"}>{tableName}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={runDatabaseDiagnostics} disabled={loading}>
                      Re-run Database Diagnostics
                    </Button>
                    {(!dbDebug.playlistsTableExists || !dbDebug.mediaTableExists) && (
                      <Button onClick={initializeDatabase} variant="default" disabled={loading}>
                        <Settings className="h-4 w-4 mr-2" />
                        Initialize Database
                      </Button>
                    )}
                    {dbDebug.missingColumns.length > 0 && dbDebug.playlistsTableExists && (
                      <Button onClick={fixPlaylistsTable} variant="outline" disabled={loading}>
                        Fix Playlists Table
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2">Running database diagnostics...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                API Endpoint Tests
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {apiDebug ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Media API</span>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(apiDebug.mediaApiStatus)}
                          {getStatusBadge(apiDebug.mediaApiStatus)}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        {apiDebug.mediaApiResponse?.error ||
                          (apiDebug.mediaApiResponse?.success
                            ? `${apiDebug.mediaApiResponse.total || 0} files`
                            : "Unknown response")}
                      </div>
                    </div>

                    <div className="p-4 border rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Playlists API</span>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(apiDebug.playlistsApiStatus)}
                          {getStatusBadge(apiDebug.playlistsApiStatus)}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        {apiDebug.playlistsApiResponse?.error ||
                          apiDebug.playlistsApiResponse?.details ||
                          (apiDebug.playlistsApiResponse?.success
                            ? `${apiDebug.playlistsApiResponse.total || 0} playlists`
                            : "Unknown response")}
                      </div>
                    </div>

                    <div className="p-4 border rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Auth API</span>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(apiDebug.authApiStatus)}
                          {getStatusBadge(apiDebug.authApiStatus)}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        {apiDebug.authApiResponse?.error ||
                          (apiDebug.authApiResponse?.user ? apiDebug.authApiResponse.user.email : "No user data")}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {apiDebug.mediaApiResponse && (
                      <div className="p-4 bg-gray-50 rounded">
                        <h4 className="font-medium mb-2">Media API Response:</h4>
                        <pre className="text-sm overflow-auto max-h-40">
                          {JSON.stringify(apiDebug.mediaApiResponse, null, 2)}
                        </pre>
                      </div>
                    )}

                    {apiDebug.playlistsApiResponse && (
                      <div className="p-4 bg-gray-50 rounded">
                        <h4 className="font-medium mb-2">Playlists API Response:</h4>
                        <pre className="text-sm overflow-auto max-h-40">
                          {JSON.stringify(apiDebug.playlistsApiResponse, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>

                  <Button onClick={runAPIDiagnostics} disabled={loading}>
                    Re-run API Tests
                  </Button>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2">Running API diagnostics...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Running diagnostics...</span>
          </div>
        </div>
      )}
    </div>
  )
}
