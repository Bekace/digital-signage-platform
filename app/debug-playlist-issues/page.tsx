"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, XCircle, AlertCircle, Database, User, Code, RefreshCw } from "lucide-react"

interface DebugResult {
  success: boolean
  data?: any
  error?: string
  details?: any
}

interface TableInfo {
  exists: boolean
  columns: Array<{
    column_name: string
    data_type: string
    is_nullable: string
    column_default: string | null
  }>
  sample_data: any[]
}

interface DebugData {
  authentication: DebugResult
  database_connection: DebugResult
  table_structure: {
    playlists: TableInfo
    playlist_items: TableInfo
  }
  api_tests: {
    get_playlists: DebugResult
    create_playlist: DebugResult
    get_single_playlist: DebugResult
  }
  frontend_tests: {
    fetch_playlists: DebugResult
    create_playlist_dialog: DebugResult
  }
}

export default function DebugPlaylistIssuesPage() {
  const [debugData, setDebugData] = useState<DebugData | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  const runFullDiagnostic = async () => {
    setLoading(true)
    const results: DebugData = {
      authentication: { success: false },
      database_connection: { success: false },
      table_structure: {
        playlists: { exists: false, columns: [], sample_data: [] },
        playlist_items: { exists: false, columns: [], sample_data: [] },
      },
      api_tests: {
        get_playlists: { success: false },
        create_playlist: { success: false },
        get_single_playlist: { success: false },
      },
      frontend_tests: {
        fetch_playlists: { success: false },
        create_playlist_dialog: { success: false },
      },
    }

    try {
      // Test 1: Authentication
      console.log("🔍 Testing authentication...")
      try {
        const authResponse = await fetch("/api/test-auth")
        const authData = await authResponse.json()
        results.authentication = {
          success: authResponse.ok && authData.success,
          data: authData,
          error: authData.error,
        }
      } catch (error) {
        results.authentication = {
          success: false,
          error: error instanceof Error ? error.message : "Authentication test failed",
        }
      }

      // Test 2: Database Connection
      console.log("🔍 Testing database connection...")
      try {
        const dbResponse = await fetch("/api/test-db")
        const dbData = await dbResponse.json()
        results.database_connection = {
          success: dbResponse.ok && dbData.success,
          data: dbData,
          error: dbData.error,
        }
      } catch (error) {
        results.database_connection = {
          success: false,
          error: error instanceof Error ? error.message : "Database connection test failed",
        }
      }

      // Test 3: Table Structure
      console.log("🔍 Testing table structure...")
      try {
        const tableResponse = await fetch("/api/debug-table-structure")
        const tableData = await tableResponse.json()
        if (tableResponse.ok && tableData.success) {
          results.table_structure = {
            playlists: tableData.tables?.playlists || { exists: false, columns: [], sample_data: [] },
            playlist_items: tableData.tables?.playlist_items || { exists: false, columns: [], sample_data: [] },
          }
        }
      } catch (error) {
        console.error("Table structure test failed:", error)
      }

      // Test 4: API Endpoints
      console.log("🔍 Testing API endpoints...")

      // Test GET /api/playlists
      try {
        const getPlaylistsResponse = await fetch("/api/playlists")
        const getPlaylistsData = await getPlaylistsResponse.json()
        results.api_tests.get_playlists = {
          success: getPlaylistsResponse.ok,
          data: getPlaylistsData,
          error: getPlaylistsData.error,
          details: {
            status: getPlaylistsResponse.status,
            headers: Object.fromEntries(getPlaylistsResponse.headers.entries()),
          },
        }
      } catch (error) {
        results.api_tests.get_playlists = {
          success: false,
          error: error instanceof Error ? error.message : "GET playlists failed",
        }
      }

      // Test POST /api/playlists (create playlist)
      try {
        const createPayload = {
          name: `Debug Test Playlist ${Date.now()}`,
          description: "This is a test playlist created by the debug tool",
          loop_enabled: true,
          schedule_enabled: false,
        }
        const createResponse = await fetch("/api/playlists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(createPayload),
        })
        const createData = await createResponse.json()
        results.api_tests.create_playlist = {
          success: createResponse.ok,
          data: createData,
          error: createData.error,
          details: {
            status: createResponse.status,
            payload: createPayload,
          },
        }

        // If playlist was created successfully, test GET single playlist
        if (createResponse.ok && createData.playlist?.id) {
          try {
            const getSingleResponse = await fetch(`/api/playlists/${createData.playlist.id}`)
            const getSingleData = await getSingleResponse.json()
            results.api_tests.get_single_playlist = {
              success: getSingleResponse.ok,
              data: getSingleData,
              error: getSingleData.error,
              details: {
                status: getSingleResponse.status,
                playlist_id: createData.playlist.id,
              },
            }
          } catch (error) {
            results.api_tests.get_single_playlist = {
              success: false,
              error: error instanceof Error ? error.message : "GET single playlist failed",
            }
          }
        }
      } catch (error) {
        results.api_tests.create_playlist = {
          success: false,
          error: error instanceof Error ? error.message : "POST playlist failed",
        }
      }

      // Test 5: Frontend Integration
      console.log("🔍 Testing frontend integration...")
      results.frontend_tests.fetch_playlists = {
        success: results.api_tests.get_playlists.success,
        data: results.api_tests.get_playlists.data,
        error: results.api_tests.get_playlists.error,
      }

      results.frontend_tests.create_playlist_dialog = {
        success: results.api_tests.create_playlist.success,
        data: results.api_tests.create_playlist.data,
        error: results.api_tests.create_playlist.error,
      }
    } catch (error) {
      console.error("Full diagnostic failed:", error)
    }

    setDebugData(results)
    setLoading(false)
  }

  useEffect(() => {
    runFullDiagnostic()
  }, [])

  const getStatusIcon = (success: boolean) => {
    return success ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />
  }

  const getStatusBadge = (success: boolean) => {
    return (
      <Badge variant={success ? "default" : "destructive"} className={success ? "bg-green-100 text-green-800" : ""}>
        {success ? "PASS" : "FAIL"}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Running diagnostic tests...</span>
        </div>
      </div>
    )
  }

  if (!debugData) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Debug Data</h3>
            <Button onClick={runFullDiagnostic}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Diagnostic
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Playlist Debug Dashboard</h1>
          <p className="text-gray-600">Comprehensive diagnostic tool for playlist functionality</p>
        </div>
        <Button onClick={runFullDiagnostic} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Re-run Tests
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="auth">Authentication</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="api">API Tests</TabsTrigger>
          <TabsTrigger value="solutions">Solutions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Authentication</CardTitle>
                {getStatusIcon(debugData.authentication.success)}
              </CardHeader>
              <CardContent>{getStatusBadge(debugData.authentication.success)}</CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Database</CardTitle>
                {getStatusIcon(debugData.database_connection.success)}
              </CardHeader>
              <CardContent>{getStatusBadge(debugData.database_connection.success)}</CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">API Endpoints</CardTitle>
                {getStatusIcon(
                  debugData.api_tests.get_playlists.success && debugData.api_tests.create_playlist.success,
                )}
              </CardHeader>
              <CardContent>
                {getStatusBadge(
                  debugData.api_tests.get_playlists.success && debugData.api_tests.create_playlist.success,
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Frontend</CardTitle>
                {getStatusIcon(debugData.frontend_tests.fetch_playlists.success)}
              </CardHeader>
              <CardContent>{getStatusBadge(debugData.frontend_tests.fetch_playlists.success)}</CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Issues Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!debugData.authentication.success && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Authentication Issue:</strong> {debugData.authentication.error}
                  </AlertDescription>
                </Alert>
              )}

              {!debugData.database_connection.success && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Database Issue:</strong> {debugData.database_connection.error}
                  </AlertDescription>
                </Alert>
              )}

              {!debugData.api_tests.get_playlists.success && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>API Issue:</strong> GET /api/playlists failed - {debugData.api_tests.get_playlists.error}
                  </AlertDescription>
                </Alert>
              )}

              {!debugData.api_tests.create_playlist.success && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>API Issue:</strong> POST /api/playlists failed - {debugData.api_tests.create_playlist.error}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Authentication Status</span>
                {getStatusIcon(debugData.authentication.success)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Status:</strong> {getStatusBadge(debugData.authentication.success)}
                </div>
                <div>
                  <strong>User ID:</strong> {debugData.authentication.data?.user?.id || "N/A"}
                </div>
              </div>

              {debugData.authentication.error && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{debugData.authentication.error}</AlertDescription>
                </Alert>
              )}

              <Separator />

              <div>
                <strong>Full Response:</strong>
                <pre className="mt-2 p-4 bg-gray-100 rounded text-sm overflow-auto">
                  {JSON.stringify(debugData.authentication.data, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Database Connection & Tables</span>
                {getStatusIcon(debugData.database_connection.success)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <strong>Connection Status:</strong> {getStatusBadge(debugData.database_connection.success)}
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-semibold">Playlists Table</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong>Exists:</strong> {debugData.table_structure.playlists.exists ? "Yes" : "No"}
                  </div>
                  <div>
                    <strong>Columns:</strong> {debugData.table_structure.playlists.columns.length}
                  </div>
                </div>

                {debugData.table_structure.playlists.columns.length > 0 && (
                  <div>
                    <strong>Column Details:</strong>
                    <div className="mt-2 overflow-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Column</th>
                            <th className="text-left p-2">Type</th>
                            <th className="text-left p-2">Nullable</th>
                            <th className="text-left p-2">Default</th>
                          </tr>
                        </thead>
                        <tbody>
                          {debugData.table_structure.playlists.columns.map((col, idx) => (
                            <tr key={idx} className="border-b">
                              <td className="p-2 font-mono">{col.column_name}</td>
                              <td className="p-2">{col.data_type}</td>
                              <td className="p-2">{col.is_nullable}</td>
                              <td className="p-2 font-mono text-xs">{col.column_default || "NULL"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div>
                  <strong>Sample Data:</strong>
                  <pre className="mt-2 p-4 bg-gray-100 rounded text-sm overflow-auto max-h-64">
                    {JSON.stringify(debugData.table_structure.playlists.sample_data, null, 2)}
                  </pre>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-semibold">Playlist Items Table</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong>Exists:</strong> {debugData.table_structure.playlist_items.exists ? "Yes" : "No"}
                  </div>
                  <div>
                    <strong>Columns:</strong> {debugData.table_structure.playlist_items.columns.length}
                  </div>
                </div>

                {debugData.table_structure.playlist_items.columns.length > 0 && (
                  <div>
                    <strong>Column Details:</strong>
                    <div className="mt-2 overflow-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Column</th>
                            <th className="text-left p-2">Type</th>
                            <th className="text-left p-2">Nullable</th>
                            <th className="text-left p-2">Default</th>
                          </tr>
                        </thead>
                        <tbody>
                          {debugData.table_structure.playlist_items.columns.map((col, idx) => (
                            <tr key={idx} className="border-b">
                              <td className="p-2 font-mono">{col.column_name}</td>
                              <td className="p-2">{col.data_type}</td>
                              <td className="p-2">{col.is_nullable}</td>
                              <td className="p-2 font-mono text-xs">{col.column_default || "NULL"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Code className="h-5 w-5" />
                  <span>GET /api/playlists</span>
                  {getStatusIcon(debugData.api_tests.get_playlists.success)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <strong>Status:</strong> {getStatusBadge(debugData.api_tests.get_playlists.success)}
                </div>

                {debugData.api_tests.get_playlists.details && (
                  <div>
                    <strong>HTTP Status:</strong> {debugData.api_tests.get_playlists.details.status}
                  </div>
                )}

                {debugData.api_tests.get_playlists.error && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{debugData.api_tests.get_playlists.error}</AlertDescription>
                  </Alert>
                )}

                <div>
                  <strong>Response:</strong>
                  <pre className="mt-2 p-4 bg-gray-100 rounded text-sm overflow-auto max-h-64">
                    {JSON.stringify(debugData.api_tests.get_playlists.data, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Code className="h-5 w-5" />
                  <span>POST /api/playlists</span>
                  {getStatusIcon(debugData.api_tests.create_playlist.success)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <strong>Status:</strong> {getStatusBadge(debugData.api_tests.create_playlist.success)}
                </div>

                {debugData.api_tests.create_playlist.details && (
                  <div>
                    <strong>HTTP Status:</strong> {debugData.api_tests.create_playlist.details.status}
                  </div>
                )}

                {debugData.api_tests.create_playlist.error && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{debugData.api_tests.create_playlist.error}</AlertDescription>
                  </Alert>
                )}

                <div>
                  <strong>Payload Sent:</strong>
                  <pre className="mt-2 p-4 bg-gray-100 rounded text-sm overflow-auto">
                    {JSON.stringify(debugData.api_tests.create_playlist.details?.payload, null, 2)}
                  </pre>
                </div>

                <div>
                  <strong>Response:</strong>
                  <pre className="mt-2 p-4 bg-gray-100 rounded text-sm overflow-auto max-h-64">
                    {JSON.stringify(debugData.api_tests.create_playlist.data, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>

          {debugData.api_tests.get_single_playlist.data && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Code className="h-5 w-5" />
                  <span>GET /api/playlists/[id]</span>
                  {getStatusIcon(debugData.api_tests.get_single_playlist.success)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <strong>Status:</strong> {getStatusBadge(debugData.api_tests.get_single_playlist.success)}
                </div>

                <div>
                  <strong>Response:</strong>
                  <pre className="mt-2 p-4 bg-gray-100 rounded text-sm overflow-auto max-h-64">
                    {JSON.stringify(debugData.api_tests.get_single_playlist.data, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="solutions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Systematic Solution Approach</CardTitle>
              <CardDescription>
                Based on the diagnostic results, here are the recommended solutions in order of priority
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">1. Root Cause Analysis</h4>
                <div className="pl-4 space-y-2">
                  <p>
                    <strong>Column Name Mismatches:</strong> The most common issue is API code referring to database
                    columns that don't exist or have different names.
                  </p>
                  <p>
                    <strong>Authentication Inconsistencies:</strong> Different parts of the codebase using different
                    authentication patterns.
                  </p>
                  <p>
                    <strong>Database Connection Issues:</strong> Inconsistent database connection handling across API
                    routes.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-semibold text-lg">2. Immediate Fixes</h4>
                <div className="pl-4 space-y-2">
                  {!debugData.authentication.success && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Fix Authentication:</strong> Update all API routes to use consistent getCurrentUser()
                        function
                      </AlertDescription>
                    </Alert>
                  )}

                  {!debugData.database_connection.success && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Fix Database Connection:</strong> Ensure all API routes use getDb() consistently
                      </AlertDescription>
                    </Alert>
                  )}

                  {!debugData.api_tests.create_playlist.success && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Fix Column Names:</strong> Update API routes to match actual database schema
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-semibold text-lg">3. Long-term Prevention Strategy</h4>
                <div className="pl-4 space-y-3">
                  <div>
                    <strong>Schema-First Development:</strong>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Create TypeScript interfaces that match database schema exactly</li>
                      <li>Use these interfaces consistently across all API routes</li>
                      <li>Generate types from database schema automatically</li>
                    </ul>
                  </div>

                  <div>
                    <strong>Centralized Database Layer:</strong>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Create repository pattern for database operations</li>
                      <li>Single source of truth for all SQL queries</li>
                      <li>Consistent error handling and logging</li>
                    </ul>
                  </div>

                  <div>
                    <strong>Automated Testing:</strong>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>API integration tests for all endpoints</li>
                      <li>Database schema validation tests</li>
                      <li>Frontend-to-backend integration tests</li>
                    </ul>
                  </div>

                  <div>
                    <strong>Development Workflow:</strong>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Always run this debug page after making changes</li>
                      <li>Test API endpoints directly before testing frontend</li>
                      <li>Use consistent naming conventions across all layers</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-semibold text-lg">4. Recommended Next Steps</h4>
                <div className="pl-4 space-y-2">
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Fix the immediate issues identified in this diagnostic</li>
                    <li>Create TypeScript interfaces for all database tables</li>
                    <li>Refactor API routes to use consistent patterns</li>
                    <li>Add comprehensive error logging</li>
                    <li>Create automated tests for critical paths</li>
                    <li>Document the correct patterns for future development</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
