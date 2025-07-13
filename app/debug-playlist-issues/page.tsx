"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Database,
  User,
  Settings,
  FileText,
  Play,
  Loader2,
} from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"

interface DebugResult {
  success: boolean
  data?: any
  error?: string
  details?: string
}

interface DebugResults {
  authentication: DebugResult
  database: DebugResult
  playlists_api: DebugResult
  playlist_create: DebugResult
  playlist_fetch: DebugResult
  playlist_items: DebugResult
  media_api: DebugResult
  table_structure: DebugResult
}

export default function DebugPlaylistIssuesPage() {
  const [results, setResults] = useState<DebugResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  const runDiagnostics = async () => {
    setLoading(true)
    setResults(null)

    const diagnostics: DebugResults = {
      authentication: { success: false },
      database: { success: false },
      playlists_api: { success: false },
      playlist_create: { success: false },
      playlist_fetch: { success: false },
      playlist_items: { success: false },
      media_api: { success: false },
      table_structure: { success: false },
    }

    try {
      // Test Authentication
      console.log("🔐 Testing authentication...")
      try {
        const authResponse = await fetch("/api/test-auth")
        const authData = await authResponse.json()
        diagnostics.authentication = {
          success: authResponse.ok,
          data: authData,
          error: authResponse.ok ? undefined : authData.error,
        }
      } catch (error) {
        diagnostics.authentication = {
          success: false,
          error: "Authentication test failed",
          details: error instanceof Error ? error.message : "Unknown error",
        }
      }

      // Test Database Connection
      console.log("🗄️ Testing database connection...")
      try {
        const dbResponse = await fetch("/api/test-db")
        const dbData = await dbResponse.json()
        diagnostics.database = {
          success: dbResponse.ok,
          data: dbData,
          error: dbResponse.ok ? undefined : dbData.error,
        }
      } catch (error) {
        diagnostics.database = {
          success: false,
          error: "Database test failed",
          details: error instanceof Error ? error.message : "Unknown error",
        }
      }

      // Test Playlists API (GET)
      console.log("🎵 Testing playlists API...")
      try {
        const playlistsResponse = await fetch("/api/playlists")
        const playlistsData = await playlistsResponse.json()
        diagnostics.playlists_api = {
          success: playlistsResponse.ok,
          data: playlistsData,
          error: playlistsResponse.ok ? undefined : playlistsData.error,
        }
        console.log("GET /api/playlists", playlistsResponse.ok ? "PASS" : "FAIL")
        console.log("HTTP Status:", playlistsResponse.status)
        console.log("Response:", playlistsData)
      } catch (error) {
        diagnostics.playlists_api = {
          success: false,
          error: "Playlists API test failed",
          details: error instanceof Error ? error.message : "Unknown error",
        }
      }

      // Test Playlist Creation (POST)
      console.log("➕ Testing playlist creation...")
      try {
        const createPayload = {
          name: `Debug Test Playlist ${Date.now()}`,
          description: "This is a test playlist created by the debug tool",
          loop_enabled: true,
          schedule_enabled: false,
        }

        const createResponse = await fetch("/api/playlists", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(createPayload),
        })
        const createData = await createResponse.json()
        diagnostics.playlist_create = {
          success: createResponse.ok,
          data: { payload: createPayload, response: createData },
          error: createResponse.ok ? undefined : createData.error,
        }
        console.log("POST /api/playlists", createResponse.ok ? "PASS" : "FAIL")
        console.log("HTTP Status:", createResponse.status)
        console.log("Payload Sent:", createPayload)
        console.log("Response:", createData)
      } catch (error) {
        diagnostics.playlist_create = {
          success: false,
          error: "Playlist creation test failed",
          details: error instanceof Error ? error.message : "Unknown error",
        }
      }

      // Test Individual Playlist Fetch
      console.log("🎯 Testing individual playlist fetch...")
      if (diagnostics.playlists_api.success && diagnostics.playlists_api.data?.playlists?.length > 0) {
        try {
          const firstPlaylistId = diagnostics.playlists_api.data.playlists[0].id
          const fetchResponse = await fetch(`/api/playlists/${firstPlaylistId}`)
          const fetchData = await fetchResponse.json()
          diagnostics.playlist_fetch = {
            success: fetchResponse.ok,
            data: fetchData,
            error: fetchResponse.ok ? undefined : fetchData.error,
          }
          console.log(`GET /api/playlists/[id]`, fetchResponse.ok ? "PASS" : "FAIL")
          console.log("Response:", fetchData)
        } catch (error) {
          diagnostics.playlist_fetch = {
            success: false,
            error: "Individual playlist fetch failed",
            details: error instanceof Error ? error.message : "Unknown error",
          }
        }
      } else {
        diagnostics.playlist_fetch = {
          success: false,
          error: "No playlists available to test individual fetch",
        }
      }

      // Test Playlist Items
      console.log("📋 Testing playlist items...")
      if (diagnostics.playlists_api.success && diagnostics.playlists_api.data?.playlists?.length > 0) {
        try {
          const firstPlaylistId = diagnostics.playlists_api.data.playlists[0].id
          const itemsResponse = await fetch(`/api/playlists/${firstPlaylistId}/items`)
          const itemsData = await itemsResponse.json()
          diagnostics.playlist_items = {
            success: itemsResponse.ok,
            data: itemsData,
            error: itemsResponse.ok ? undefined : itemsData.error,
          }
        } catch (error) {
          diagnostics.playlist_items = {
            success: false,
            error: "Playlist items test failed",
            details: error instanceof Error ? error.message : "Unknown error",
          }
        }
      } else {
        diagnostics.playlist_items = {
          success: false,
          error: "No playlists available to test items",
        }
      }

      // Test Media API
      console.log("📁 Testing media API...")
      try {
        const mediaResponse = await fetch("/api/media")
        const mediaData = await mediaResponse.json()
        diagnostics.media_api = {
          success: mediaResponse.ok,
          data: mediaData,
          error: mediaResponse.ok ? undefined : mediaData.error,
        }
      } catch (error) {
        diagnostics.media_api = {
          success: false,
          error: "Media API test failed",
          details: error instanceof Error ? error.message : "Unknown error",
        }
      }

      // Test Table Structure
      console.log("🏗️ Testing table structure...")
      try {
        const structureResponse = await fetch("/api/debug-table-structure")
        const structureData = await structureResponse.json()
        diagnostics.table_structure = {
          success: structureResponse.ok,
          data: structureData,
          error: structureResponse.ok ? undefined : structureData.error,
        }
      } catch (error) {
        diagnostics.table_structure = {
          success: false,
          error: "Table structure test failed",
          details: error instanceof Error ? error.message : "Unknown error",
        }
      }
    } catch (error) {
      console.error("Diagnostic error:", error)
    }

    setResults(diagnostics)
    setLoading(false)
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  const getStatusIcon = (success: boolean) => {
    return success ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />
  }

  const getStatusBadge = (success: boolean) => {
    return <Badge variant={success ? "default" : "destructive"}>{success ? "PASS" : "FAIL"}</Badge>
  }

  const overallHealth = results ? Object.values(results).filter((r) => r.success).length : 0
  const totalTests = results ? Object.keys(results).length : 0

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Playlist Debug Center</h1>
            <p className="text-gray-600">Comprehensive diagnostics for playlist functionality</p>
          </div>
          <Button onClick={runDiagnostics} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Run Diagnostics
          </Button>
        </div>

        {results && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>System Health Overview</span>
                <Badge
                  variant={
                    overallHealth === totalTests
                      ? "default"
                      : overallHealth > totalTests / 2
                        ? "secondary"
                        : "destructive"
                  }
                >
                  {overallHealth}/{totalTests} Tests Passing
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(results.authentication.success)}
                  <span className="text-sm">Authentication</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(results.database.success)}
                  <span className="text-sm">Database</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(results.playlists_api.success)}
                  <span className="text-sm">Playlists API</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(results.media_api.success)}
                  <span className="text-sm">Media API</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="authentication">Auth</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="apis">APIs</TabsTrigger>
            <TabsTrigger value="solutions">Solutions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {results && (
              <div className="grid gap-4">
                {Object.entries(results).map(([key, result]) => (
                  <Card key={key}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(result.success)}
                          <div>
                            <h3 className="font-medium capitalize">{key.replace(/_/g, " ")}</h3>
                            {result.error && <p className="text-sm text-red-600">{result.error}</p>}
                            {result.details && <p className="text-xs text-gray-500">{result.details}</p>}
                          </div>
                        </div>
                        {getStatusBadge(result.success)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="authentication" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Authentication Test</span>
                  {results && getStatusBadge(results.authentication.success)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {results?.authentication.data && (
                  <ScrollArea className="h-64">
                    <pre className="text-xs bg-gray-50 p-4 rounded">
                      {JSON.stringify(results.authentication.data, null, 2)}
                    </pre>
                  </ScrollArea>
                )}
                {results?.authentication.error && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {results.authentication.error}
                      {results.authentication.details && (
                        <div className="mt-2 text-xs text-gray-600">{results.authentication.details}</div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="database" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Database Connection</span>
                  {results && getStatusBadge(results.database.success)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {results?.database.data && (
                  <ScrollArea className="h-64">
                    <pre className="text-xs bg-gray-50 p-4 rounded">
                      {JSON.stringify(results.database.data, null, 2)}
                    </pre>
                  </ScrollArea>
                )}
                {results?.database.error && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {results.database.error}
                      {results.database.details && (
                        <div className="mt-2 text-xs text-gray-600">{results.database.details}</div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Table Structure</span>
                  {results && getStatusBadge(results.table_structure.success)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {results?.table_structure.data && (
                  <ScrollArea className="h-64">
                    <pre className="text-xs bg-gray-50 p-4 rounded">
                      {JSON.stringify(results.table_structure.data, null, 2)}
                    </pre>
                  </ScrollArea>
                )}
                {results?.table_structure.error && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{results.table_structure.error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="apis" className="space-y-4">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Play className="h-5 w-5" />
                    <span>Playlists API</span>
                    {results && getStatusBadge(results.playlists_api.success)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {results?.playlists_api.data && (
                    <ScrollArea className="h-48">
                      <pre className="text-xs bg-gray-50 p-4 rounded">
                        {JSON.stringify(results.playlists_api.data, null, 2)}
                      </pre>
                    </ScrollArea>
                  )}
                  {results?.playlists_api.error && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{results.playlists_api.error}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Media API</span>
                    {results && getStatusBadge(results.media_api.success)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {results?.media_api.data && (
                    <ScrollArea className="h-48">
                      <pre className="text-xs bg-gray-50 p-4 rounded">
                        {JSON.stringify(results.media_api.data, null, 2)}
                      </pre>
                    </ScrollArea>
                  )}
                  {results?.media_api.error && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{results.media_api.error}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="solutions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Systematic Solution Approach</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">
                    Based on the diagnostic results, here are the recommended solutions in order of priority:
                  </h3>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">1. Root Cause Analysis</h4>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>
                      • <strong>Column Name Mismatches:</strong> The most common issue is API code referring to database
                      columns that don't exist or have different names.
                    </li>
                    <li>
                      • <strong>Authentication Inconsistencies:</strong> Different parts of the codebase using different
                      authentication patterns.
                    </li>
                    <li>
                      • <strong>Database Connection Issues:</strong> Inconsistent database connection handling across
                      API routes.
                    </li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">2. Immediate Fixes</h4>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• Fix table name mismatches (media vs media_files)</li>
                    <li>• Fix column name mismatches (scale_image, etc.)</li>
                    <li>• Standardize authentication patterns across all API routes</li>
                    <li>• Add proper error handling and logging</li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">3. Long-term Prevention Strategy</h4>
                  <div className="space-y-2">
                    <div>
                      <strong>Schema-First Development:</strong>
                      <ul className="text-sm ml-4 mt-1">
                        <li>• Create TypeScript interfaces that match database schema exactly</li>
                        <li>• Use these interfaces consistently across all API routes</li>
                        <li>• Generate types from database schema automatically</li>
                      </ul>
                    </div>
                    <div>
                      <strong>Centralized Database Layer:</strong>
                      <ul className="text-sm ml-4 mt-1">
                        <li>• Create repository pattern for database operations</li>
                        <li>• Single source of truth for all SQL queries</li>
                        <li>• Consistent error handling and logging</li>
                      </ul>
                    </div>
                    <div>
                      <strong>Automated Testing:</strong>
                      <ul className="text-sm ml-4 mt-1">
                        <li>• API integration tests for all endpoints</li>
                        <li>• Database schema validation tests</li>
                        <li>• Frontend-to-backend integration tests</li>
                      </ul>
                    </div>
                    <div>
                      <strong>Development Workflow:</strong>
                      <ul className="text-sm ml-4 mt-1">
                        <li>• Always run this debug page after making changes</li>
                        <li>• Test API endpoints directly before testing frontend</li>
                        <li>• Use consistent naming conventions across all layers</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">4. Recommended Next Steps</h4>
                  <ol className="text-sm space-y-1 ml-4">
                    <li>1. Fix the immediate issues identified in this diagnostic</li>
                    <li>2. Create TypeScript interfaces for all database tables</li>
                    <li>3. Refactor API routes to use consistent patterns</li>
                    <li>4. Add comprehensive error logging</li>
                    <li>5. Create automated tests for critical paths</li>
                    <li>6. Document the correct patterns for future development</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
