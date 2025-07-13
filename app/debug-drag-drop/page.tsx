"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Database, User, Loader2, ArrowUpDown, Key } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"

interface DebugResult {
  success: boolean
  data?: any
  error?: string
  details?: string
  httpStatus?: number
}

interface TableColumn {
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
}

interface TableInfo {
  exists: boolean
  columns: TableColumn[]
  sample_data: any[]
  row_count: number
}

interface DebugResults {
  authentication: DebugResult
  database_connection: DebugResult
  table_structure: {
    playlists: TableInfo
    playlist_items: TableInfo
    media_files: TableInfo
  }
  api_endpoints: {
    get_playlists: DebugResult
    get_playlist_items: DebugResult
    reorder_items: DebugResult
  }
  drag_drop_simulation: DebugResult
  token_analysis: DebugResult
}

export default function DebugDragDropPage() {
  const [results, setResults] = useState<DebugResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [testPlaylistId, setTestPlaylistId] = useState<string>("")

  const runComprehensiveDiagnostics = async () => {
    setLoading(true)
    setResults(null)

    const diagnostics: DebugResults = {
      authentication: { success: false },
      database_connection: { success: false },
      table_structure: {
        playlists: { exists: false, columns: [], sample_data: [], row_count: 0 },
        playlist_items: { exists: false, columns: [], sample_data: [], row_count: 0 },
        media_files: { exists: false, columns: [], sample_data: [], row_count: 0 },
      },
      api_endpoints: {
        get_playlists: { success: false },
        get_playlist_items: { success: false },
        reorder_items: { success: false },
      },
      drag_drop_simulation: { success: false },
      token_analysis: { success: false },
    }

    try {
      // 1. Token Analysis
      console.log("🔍 [DEBUG] Analyzing authentication token...")
      const token = localStorage.getItem("token")
      if (token) {
        try {
          const tokenParts = token.split(".")
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]))
            const isExpired = Date.now() > payload.exp * 1000
            diagnostics.token_analysis = {
              success: !isExpired,
              data: {
                token_exists: true,
                token_length: token.length,
                token_parts: tokenParts.length,
                payload: payload,
                expires: new Date(payload.exp * 1000).toISOString(),
                user_id: payload.userId,
                email: payload.email,
                is_expired: isExpired,
                time_until_expiry: isExpired
                  ? "EXPIRED"
                  : `${Math.round((payload.exp * 1000 - Date.now()) / 1000 / 60)} minutes`,
              },
              error: isExpired ? "Token is expired" : undefined,
            }
          } else {
            diagnostics.token_analysis = {
              success: false,
              error: "Token format is invalid (not 3 parts)",
              data: { token_exists: true, token_length: token.length, token_parts: tokenParts.length },
            }
          }
        } catch (error) {
          diagnostics.token_analysis = {
            success: false,
            error: "Token parsing failed - malformed JWT",
            details: error instanceof Error ? error.message : "Unknown error",
            data: { token_exists: true, token_length: token.length },
          }
        }
      } else {
        diagnostics.token_analysis = {
          success: false,
          error: "No token found in localStorage",
          data: { token_exists: false },
        }
      }

      // 2. Authentication Test
      console.log("🔍 [DEBUG] Testing authentication...")
      try {
        const authHeaders = token ? { Authorization: `Bearer ${token}` } : {}
        console.log("🔍 [DEBUG] Using auth headers:", { hasAuth: !!authHeaders.Authorization })

        const authResponse = await fetch("/api/test-auth", {
          headers: authHeaders,
        })
        const authData = await authResponse.json()
        diagnostics.authentication = {
          success: authResponse.ok,
          data: authData,
          error: authResponse.ok ? undefined : authData.error,
          httpStatus: authResponse.status,
        }
      } catch (error) {
        diagnostics.authentication = {
          success: false,
          error: "Authentication test failed",
          details: error instanceof Error ? error.message : "Unknown error",
        }
      }

      // 3. Database Connection
      console.log("🔍 [DEBUG] Testing database connection...")
      try {
        const dbResponse = await fetch("/api/test-db")
        const dbData = await dbResponse.json()
        diagnostics.database_connection = {
          success: dbResponse.ok,
          data: dbData,
          error: dbResponse.ok ? undefined : dbData.error,
          httpStatus: dbResponse.status,
        }
      } catch (error) {
        diagnostics.database_connection = {
          success: false,
          error: "Database test failed",
          details: error instanceof Error ? error.message : "Unknown error",
        }
      }

      // 4. Table Structure Analysis
      console.log("🔍 [DEBUG] Analyzing table structure...")
      try {
        const structureResponse = await fetch("/api/debug-drag-drop-tables")
        const structureData = await structureResponse.json()
        if (structureResponse.ok) {
          diagnostics.table_structure = structureData.tables || diagnostics.table_structure
        }
      } catch (error) {
        console.error("Table structure analysis failed:", error)
      }

      // 5. API Endpoints Testing
      console.log("🔍 [DEBUG] Testing API endpoints...")
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {}

      // Test GET /api/playlists
      try {
        console.log("🔍 [DEBUG] Testing GET /api/playlists with headers:", { hasAuth: !!authHeaders.Authorization })
        const playlistsResponse = await fetch("/api/playlists", {
          headers: authHeaders,
        })
        const playlistsData = await playlistsResponse.json()
        diagnostics.api_endpoints.get_playlists = {
          success: playlistsResponse.ok,
          data: playlistsData,
          error: playlistsResponse.ok ? undefined : playlistsData.error,
          httpStatus: playlistsResponse.status,
        }

        // Set test playlist ID if available
        if (playlistsResponse.ok && playlistsData.playlists?.length > 0) {
          setTestPlaylistId(playlistsData.playlists[0].id.toString())
        }
      } catch (error) {
        diagnostics.api_endpoints.get_playlists = {
          success: false,
          error: "GET playlists failed",
          details: error instanceof Error ? error.message : "Unknown error",
        }
      }

      // Test playlist items if we have a playlist
      if (
        diagnostics.api_endpoints.get_playlists.success &&
        diagnostics.api_endpoints.get_playlists.data?.playlists?.length > 0
      ) {
        const firstPlaylistId = diagnostics.api_endpoints.get_playlists.data.playlists[0].id
        try {
          console.log("🔍 [DEBUG] Testing GET playlist items for playlist:", firstPlaylistId)
          const itemsResponse = await fetch(`/api/playlists/${firstPlaylistId}/items`, {
            headers: authHeaders,
          })
          const itemsData = await itemsResponse.json()
          diagnostics.api_endpoints.get_playlist_items = {
            success: itemsResponse.ok,
            data: itemsData,
            error: itemsResponse.ok ? undefined : itemsData.error,
            httpStatus: itemsResponse.status,
          }

          // Test reorder if we have items
          if (itemsResponse.ok && itemsData.items?.length > 1) {
            try {
              const reorderPayload = {
                items: itemsData.items.map((item: any, index: number) => ({
                  id: item.id,
                  position: index + 1, // Keep same order for test
                })),
              }

              console.log("🔍 [DEBUG] Testing reorder with payload:", reorderPayload)
              const reorderResponse = await fetch(`/api/playlists/${firstPlaylistId}/items/reorder`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  ...authHeaders,
                },
                body: JSON.stringify(reorderPayload),
              })
              const reorderData = await reorderResponse.json()
              diagnostics.api_endpoints.reorder_items = {
                success: reorderResponse.ok,
                data: { request: reorderPayload, response: reorderData },
                error: reorderResponse.ok ? undefined : reorderData.error,
                httpStatus: reorderResponse.status,
              }
            } catch (error) {
              diagnostics.api_endpoints.reorder_items = {
                success: false,
                error: "Reorder test failed",
                details: error instanceof Error ? error.message : "Unknown error",
              }
            }
          } else {
            diagnostics.api_endpoints.reorder_items = {
              success: false,
              error: "No items available for reorder test",
              data: { available_items: itemsData.items?.length || 0 },
            }
          }
        } catch (error) {
          diagnostics.api_endpoints.get_playlist_items = {
            success: false,
            error: "GET playlist items failed",
            details: error instanceof Error ? error.message : "Unknown error",
          }
        }
      }

      // 6. Drag Drop Simulation
      console.log("🔍 [DEBUG] Simulating drag drop operation...")
      if (diagnostics.api_endpoints.get_playlist_items.success) {
        const items = diagnostics.api_endpoints.get_playlist_items.data?.items || []
        if (items.length > 1) {
          // Simulate moving first item to second position
          const simulatedReorder = items.map((item: any, index: number) => {
            if (index === 0) return { ...item, position: 2 }
            if (index === 1) return { ...item, position: 1 }
            return { ...item, position: index + 1 }
          })

          diagnostics.drag_drop_simulation = {
            success: true,
            data: {
              original_order: items.map((item: any) => ({ id: item.id, position: item.position })),
              simulated_order: simulatedReorder.map((item: any) => ({ id: item.id, position: item.position })),
              would_send_to_api: simulatedReorder.map((item: any, index: number) => ({
                id: item.id,
                position: index + 1,
              })),
            },
          }
        } else {
          diagnostics.drag_drop_simulation = {
            success: false,
            error: "Not enough items to simulate drag drop",
            data: { available_items: items.length },
          }
        }
      } else {
        diagnostics.drag_drop_simulation = {
          success: false,
          error: "Cannot simulate without playlist items",
        }
      }
    } catch (error) {
      console.error("Comprehensive diagnostic error:", error)
    }

    setResults(diagnostics)
    setLoading(false)
  }

  const fixAuthenticationIssue = async () => {
    try {
      // Clear existing token
      localStorage.removeItem("token")

      // Redirect to login
      window.location.href = "/login"
    } catch (error) {
      console.error("Error clearing token:", error)
    }
  }

  useEffect(() => {
    runComprehensiveDiagnostics()
  }, [])

  const getStatusIcon = (success: boolean) => {
    return success ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />
  }

  const getStatusBadge = (success: boolean) => {
    return <Badge variant={success ? "default" : "destructive"}>{success ? "PASS" : "FAIL"}</Badge>
  }

  const overallHealth = results
    ? [
        results.authentication.success,
        results.database_connection.success,
        results.api_endpoints.get_playlists.success,
        results.api_endpoints.get_playlist_items.success,
        results.api_endpoints.reorder_items.success,
      ].filter(Boolean).length
    : 0

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Drag & Drop Debug Center</h1>
            <p className="text-gray-600">Comprehensive diagnostics for playlist item reordering functionality</p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={runComprehensiveDiagnostics} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Run Diagnostics
            </Button>
            {results && !results.token_analysis.success && (
              <Button onClick={fixAuthenticationIssue} variant="destructive">
                <Key className="h-4 w-4 mr-2" />
                Fix Auth
              </Button>
            )}
          </div>
        </div>

        {results && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>System Health Overview</span>
                <Badge variant={overallHealth >= 4 ? "default" : overallHealth >= 2 ? "secondary" : "destructive"}>
                  {overallHealth}/5 Tests Passing
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(results.authentication.success)}
                  <span className="text-sm">Authentication</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(results.database_connection.success)}
                  <span className="text-sm">Database</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(results.api_endpoints.get_playlists.success)}
                  <span className="text-sm">Playlists API</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(results.api_endpoints.get_playlist_items.success)}
                  <span className="text-sm">Items API</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(results.api_endpoints.reorder_items.success)}
                  <span className="text-sm">Reorder API</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="authentication">Auth</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="tables">Tables</TabsTrigger>
            <TabsTrigger value="apis">APIs</TabsTrigger>
            <TabsTrigger value="solutions">Solutions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {results && (
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>Token Analysis</span>
                      {getStatusBadge(results.token_analysis.success)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {results.token_analysis.data && (
                      <div className="space-y-2 text-sm">
                        <div>Token Exists: {results.token_analysis.data.token_exists ? "Yes" : "No"}</div>
                        {results.token_analysis.data.token_exists && (
                          <>
                            <div>Token Length: {results.token_analysis.data.token_length}</div>
                            <div>Token Parts: {results.token_analysis.data.token_parts}/3</div>
                            <div>User ID: {results.token_analysis.data.user_id || "N/A"}</div>
                            <div>Email: {results.token_analysis.data.email || "N/A"}</div>
                            <div>
                              Expires: {results.token_analysis.data.expires || "N/A"}{" "}
                              {results.token_analysis.data.is_expired && (
                                <Badge variant="destructive" className="ml-2">
                                  EXPIRED
                                </Badge>
                              )}
                            </div>
                            <div>Time Until Expiry: {results.token_analysis.data.time_until_expiry}</div>
                          </>
                        )}
                      </div>
                    )}
                    {results.token_analysis.error && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {results.token_analysis.error}
                          {results.token_analysis.details && (
                            <div className="mt-2 text-xs text-gray-600">{results.token_analysis.details}</div>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <ArrowUpDown className="h-5 w-5" />
                      <span>Drag Drop Simulation</span>
                      {getStatusBadge(results.drag_drop_simulation.success)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {results.drag_drop_simulation.success && results.drag_drop_simulation.data && (
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Original Order:</h4>
                          <div className="text-sm bg-gray-50 p-2 rounded">
                            {JSON.stringify(results.drag_drop_simulation.data.original_order, null, 2)}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Would Send to API:</h4>
                          <div className="text-sm bg-gray-50 p-2 rounded">
                            {JSON.stringify(results.drag_drop_simulation.data.would_send_to_api, null, 2)}
                          </div>
                        </div>
                      </div>
                    )}
                    {results.drag_drop_simulation.error && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {results.drag_drop_simulation.error}
                          {results.drag_drop_simulation.data && (
                            <div className="mt-2 text-xs text-gray-600">
                              Available items: {results.drag_drop_simulation.data.available_items}
                            </div>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="authentication" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Authentication Analysis</span>
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
                      HTTP {results.authentication.httpStatus}: {results.authentication.error}
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
                  {results && getStatusBadge(results.database_connection.success)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {results?.database_connection.data && (
                  <ScrollArea className="h-64">
                    <pre className="text-xs bg-gray-50 p-4 rounded">
                      {JSON.stringify(results.database_connection.data, null, 2)}
                    </pre>
                  </ScrollArea>
                )}
                {results?.database_connection.error && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      HTTP {results.database_connection.httpStatus}: {results.database_connection.error}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tables" className="space-y-4">
            {results && (
              <div className="grid gap-4">
                {Object.entries(results.table_structure).map(([tableName, tableInfo]) => (
                  <Card key={tableName}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="capitalize">{tableName.replace("_", " ")} Table</span>
                        <Badge variant={tableInfo.exists ? "default" : "destructive"}>
                          {tableInfo.exists ? "EXISTS" : "MISSING"}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {tableInfo.exists ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>Columns: {tableInfo.columns.length}</div>
                            <div>Rows: {tableInfo.row_count}</div>
                          </div>
                          <Separator />
                          <div>
                            <h4 className="font-medium mb-2">Columns:</h4>
                            <div className="overflow-auto">
                              <table className="min-w-full text-xs">
                                <thead>
                                  <tr className="border-b">
                                    <th className="text-left p-2">Name</th>
                                    <th className="text-left p-2">Type</th>
                                    <th className="text-left p-2">Nullable</th>
                                    <th className="text-left p-2">Default</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {tableInfo.columns.map((col, idx) => (
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
                          {tableInfo.sample_data.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-2">Sample Data:</h4>
                              <ScrollArea className="h-32">
                                <pre className="text-xs bg-gray-50 p-2 rounded">
                                  {JSON.stringify(tableInfo.sample_data, null, 2)}
                                </pre>
                              </ScrollArea>
                            </div>
                          )}
                        </div>
                      ) : (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>Table does not exist in the database</AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="apis" className="space-y-4">
            {results && (
              <div className="grid gap-4">
                {Object.entries(results.api_endpoints).map(([endpointName, endpointResult]) => (
                  <Card key={endpointName}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="capitalize">{endpointName.replace("_", " ")} API</span>
                        {getStatusBadge(endpointResult.success)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {endpointResult.httpStatus && (
                        <div className="mb-2">
                          <Badge variant="outline">HTTP {endpointResult.httpStatus}</Badge>
                        </div>
                      )}
                      {endpointResult.data && (
                        <div className="mb-4">
                          <h4 className="font-medium mb-2">Response Data:</h4>
                          <ScrollArea className="h-48">
                            <pre className="text-xs bg-gray-50 p-4 rounded">
                              {JSON.stringify(endpointResult.data, null, 2)}
                            </pre>
                          </ScrollArea>
                        </div>
                      )}
                      {endpointResult.error && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            {endpointResult.error}
                            {endpointResult.details && (
                              <div className="mt-2 text-xs text-gray-600">{endpointResult.details}</div>
                            )}
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="solutions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Drag & Drop Issue Resolution Guide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Common Issues and Solutions:</h3>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">1. Authentication Issues</h4>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>
                      • <strong>JWT Malformed:</strong> Token is corrupted or invalid format
                    </li>
                    <li>
                      • <strong>Token Expired:</strong> User needs to log in again
                    </li>
                    <li>
                      • <strong>Missing Authorization Header:</strong> API calls not including Bearer token
                    </li>
                    <li>
                      • <strong>Solution:</strong> Check token format, expiration, and header inclusion
                    </li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">2. Table Name Issues</h4>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>
                      • <strong>Wrong Table Names:</strong> Code referencing non-existent tables
                    </li>
                    <li>
                      • <strong>Column Mismatches:</strong> API expecting columns that don't exist
                    </li>
                    <li>
                      • <strong>Schema Drift:</strong> Database schema different from code expectations
                    </li>
                    <li>
                      • <strong>Solution:</strong> Verify actual table names and column structures
                    </li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">3. API Endpoint Problems</h4>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>
                      • <strong>Reorder API Failing:</strong> PUT /api/playlists/[id]/items/reorder not working
                    </li>
                    <li>
                      • <strong>Payload Format:</strong> Incorrect data structure being sent
                    </li>
                    <li>
                      • <strong>Position Calculation:</strong> Wrong position values in reorder request
                    </li>
                    <li>
                      • <strong>Solution:</strong> Check API implementation and payload format
                    </li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">4. Frontend Drag Logic</h4>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>
                      • <strong>DnD Kit Configuration:</strong> Sensors or collision detection issues
                    </li>
                    <li>
                      • <strong>State Management:</strong> Local state not syncing with server
                    </li>
                    <li>
                      • <strong>Error Handling:</strong> Failed requests not reverting UI changes
                    </li>
                    <li>
                      • <strong>Solution:</strong> Review drag handlers and state updates
                    </li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">5. Recommended Fix Order</h4>
                  <ol className="text-sm space-y-1 ml-4">
                    <li>1. Fix authentication token issues first</li>
                    <li>2. Verify and correct table/column names</li>
                    <li>3. Test API endpoints individually</li>
                    <li>4. Fix reorder API implementation</li>
                    <li>5. Update frontend drag handling</li>
                    <li>6. Add comprehensive error handling</li>
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
