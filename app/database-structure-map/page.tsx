"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Database, Table, Users, Monitor, PlayCircle, Settings, Activity, Folder, Shield } from "lucide-react"

interface TableInfo {
  table_name: string
  column_count: number
  row_count: number
  columns: Array<{
    column_name: string
    data_type: string
    is_nullable: string
    column_default: string
  }>
}

interface DatabaseStructure {
  tables: TableInfo[]
  relationships: Array<{
    table: string
    column: string
    referenced_table: string
    referenced_column: string
  }>
}

export default function DatabaseStructureMapPage() {
  const [structure, setStructure] = useState<DatabaseStructure | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const loadDatabaseStructure = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/database-structure-map", {
        method: "GET",
        credentials: "include",
      })

      const data = await response.json()

      if (data.success) {
        setStructure(data.structure)
        toast.success("Database structure loaded successfully")
      } else {
        setError(data.error || "Failed to load database structure")
        toast.error("Failed to load database structure")
      }
    } catch (err) {
      console.error("Error loading database structure:", err)
      setError("Failed to connect to database")
      toast.error("Failed to connect to database")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDatabaseStructure()
  }, [])

  const getTableIcon = (tableName: string) => {
    if (tableName.includes("user")) return <Users className="h-4 w-4" />
    if (tableName.includes("screen") || tableName.includes("device")) return <Monitor className="h-4 w-4" />
    if (tableName.includes("playlist") || tableName.includes("media")) return <PlayCircle className="h-4 w-4" />
    if (tableName.includes("plan") || tableName.includes("feature")) return <Settings className="h-4 w-4" />
    if (tableName.includes("session") || tableName.includes("audit")) return <Activity className="h-4 w-4" />
    if (tableName.includes("folder")) return <Folder className="h-4 w-4" />
    return <Table className="h-4 w-4" />
  }

  const getTableCategory = (tableName: string) => {
    if (tableName.includes("user") || tableName.includes("session")) return "Authentication"
    if (tableName.includes("screen") || tableName.includes("device")) return "Screens & Devices"
    if (tableName.includes("playlist") || tableName.includes("media")) return "Content Management"
    if (tableName.includes("plan") || tableName.includes("feature")) return "Subscription System"
    if (tableName.includes("audit") || tableName.includes("log")) return "Audit & Logging"
    if (tableName.includes("folder")) return "File Organization"
    return "Other"
  }

  const getRowCountBadge = (count: number) => {
    if (count === 0) return <Badge variant="destructive">Empty</Badge>
    if (count < 10) return <Badge variant="secondary">{count} rows</Badge>
    if (count < 100) return <Badge variant="default">{count} rows</Badge>
    return <Badge variant="outline">{count} rows</Badge>
  }

  const categorizedTables =
    structure?.tables.reduce(
      (acc, table) => {
        const category = getTableCategory(table.table_name)
        if (!acc[category]) acc[category] = []
        acc[category].push(table)
        return acc
      },
      {} as Record<string, TableInfo[]>,
    ) || {}

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Database className="h-8 w-8" />
            Database Structure Map
          </h1>
          <p className="text-gray-600 mt-2">Complete analysis of your digital signage database structure</p>
        </div>

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Database Analysis</CardTitle>
            <CardDescription>Load and analyze the complete database structure</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={loadDatabaseStructure} disabled={loading} className="w-full">
              {loading ? "Loading Database Structure..." : "Refresh Database Structure"}
            </Button>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Database Structure Display */}
        {structure && (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tables">Tables Detail</TabsTrigger>
              <TabsTrigger value="relationships">Relationships</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Total Tables</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{structure.tables.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Total Rows</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {structure.tables.reduce((sum, table) => sum + table.row_count, 0)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Relationships</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{structure.relationships.length}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Tables by Category */}
              <div className="space-y-6">
                {Object.entries(categorizedTables).map(([category, tables]) => (
                  <Card key={category}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {category === "Authentication" && <Shield className="h-5 w-5" />}
                        {category === "Screens & Devices" && <Monitor className="h-5 w-5" />}
                        {category === "Content Management" && <PlayCircle className="h-5 w-5" />}
                        {category === "Subscription System" && <Settings className="h-5 w-5" />}
                        {category === "Audit & Logging" && <Activity className="h-5 w-5" />}
                        {category === "File Organization" && <Folder className="h-5 w-5" />}
                        {category}
                      </CardTitle>
                      <CardDescription>{tables.length} tables in this category</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {tables.map((table) => (
                          <div
                            key={table.table_name}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              {getTableIcon(table.table_name)}
                              <span className="font-medium">{table.table_name}</span>
                            </div>
                            {getRowCountBadge(table.row_count)}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Tables Detail Tab */}
            <TabsContent value="tables" className="space-y-4">
              {structure.tables.map((table) => (
                <Card key={table.table_name}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getTableIcon(table.table_name)}
                        {table.table_name}
                      </div>
                      <div className="flex items-center gap-2">
                        {getRowCountBadge(table.row_count)}
                        <Badge variant="outline">{table.column_count} columns</Badge>
                      </div>
                    </CardTitle>
                    <CardDescription>Category: {getTableCategory(table.table_name)}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Column</th>
                            <th className="text-left p-2">Type</th>
                            <th className="text-left p-2">Nullable</th>
                            <th className="text-left p-2">Default</th>
                          </tr>
                        </thead>
                        <tbody>
                          {table.columns.map((column) => (
                            <tr key={column.column_name} className="border-b">
                              <td className="p-2 font-medium">{column.column_name}</td>
                              <td className="p-2">
                                <Badge variant="secondary" className="text-xs">
                                  {column.data_type}
                                </Badge>
                              </td>
                              <td className="p-2">
                                {column.is_nullable === "YES" ? (
                                  <Badge variant="outline" className="text-xs">
                                    Nullable
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive" className="text-xs">
                                    Required
                                  </Badge>
                                )}
                              </td>
                              <td className="p-2 text-gray-600 text-xs">{column.column_default || "None"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Relationships Tab */}
            <TabsContent value="relationships" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Foreign Key Relationships</CardTitle>
                  <CardDescription>Database table relationships and constraints</CardDescription>
                </CardHeader>
                <CardContent>
                  {structure.relationships.length > 0 ? (
                    <div className="space-y-3">
                      {structure.relationships.map((rel, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="text-sm">
                              <span className="font-medium">{rel.table}</span>
                              <span className="text-gray-500">.{rel.column}</span>
                            </div>
                            <span className="text-gray-400">→</span>
                            <div className="text-sm">
                              <span className="font-medium">{rel.referenced_table}</span>
                              <span className="text-gray-500">.{rel.referenced_column}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">No foreign key relationships found</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analysis Tab */}
            <TabsContent value="analysis" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Empty Tables */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600">Empty Tables</CardTitle>
                    <CardDescription>Tables with no data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {structure.tables
                        .filter((table) => table.row_count === 0)
                        .map((table) => (
                          <div key={table.table_name} className="flex items-center gap-2 p-2 bg-red-50 rounded">
                            {getTableIcon(table.table_name)}
                            <span className="font-medium">{table.table_name}</span>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Populated Tables */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-600">Populated Tables</CardTitle>
                    <CardDescription>Tables with data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {structure.tables
                        .filter((table) => table.row_count > 0)
                        .sort((a, b) => b.row_count - a.row_count)
                        .map((table) => (
                          <div
                            key={table.table_name}
                            className="flex items-center justify-between p-2 bg-green-50 rounded"
                          >
                            <div className="flex items-center gap-2">
                              {getTableIcon(table.table_name)}
                              <span className="font-medium">{table.table_name}</span>
                            </div>
                            <Badge variant="default">{table.row_count} rows</Badge>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Key Insights */}
              <Card>
                <CardHeader>
                  <CardTitle>Key Insights</CardTitle>
                  <CardDescription>Important observations about your database</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Alert>
                      <AlertDescription>
                        <strong>Screens vs Devices Clarification:</strong> You're right - "screens" table is for display
                        screens, "devices" table is for device players. This is a critical distinction for the
                        architecture.
                      </AlertDescription>
                    </Alert>

                    <Alert>
                      <AlertDescription>
                        <strong>Data Status:</strong> Your database has real user data, media files, and subscription
                        information, but appears to be missing screen/device data.
                      </AlertDescription>
                    </Alert>

                    <Alert>
                      <AlertDescription>
                        <strong>Next Steps:</strong> We should create a simple test form to verify database connectivity
                        before proceeding with the cleanup plan.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
