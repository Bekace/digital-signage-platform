"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Database, Table, Key, Hash, RefreshCw, AlertCircle, CheckCircle } from "lucide-react"

interface TableInfo {
  table_name: string
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
  is_primary_key: boolean
  foreign_key_table: string | null
  foreign_key_column: string | null
}

interface TableStructure {
  name: string
  columns: TableInfo[]
  rowCount: number
  category: string
}

export default function DatabaseStructureMapPage() {
  const [loading, setLoading] = useState(false)
  const [tables, setTables] = useState<TableStructure[]>([])
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<string>("unknown")

  const fetchDatabaseStructure = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/database-structure-map")
      const data = await response.json()

      if (response.ok) {
        setTables(data.tables)
        setConnectionStatus(data.connectionStatus)
      } else {
        setError(data.error || "Failed to fetch database structure")
        setConnectionStatus("error")
      }
    } catch (err) {
      setError("Network error: Failed to fetch database structure")
      setConnectionStatus("error")
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDatabaseStructure()
  }, [])

  const categorizeTable = (tableName: string): string => {
    if (tableName.includes("user") || tableName.includes("admin") || tableName.includes("password")) {
      return "Authentication & Users"
    }
    if (tableName.includes("device") || tableName.includes("screen")) {
      return "Devices & Screens"
    }
    if (tableName.includes("media") || tableName.includes("playlist")) {
      return "Content Management"
    }
    if (tableName.includes("plan") || tableName.includes("subscription") || tableName.includes("feature")) {
      return "Subscription & Plans"
    }
    return "System & Other"
  }

  const getTablesByCategory = () => {
    const categories: { [key: string]: TableStructure[] } = {}
    tables.forEach((table) => {
      const category = categorizeTable(table.name)
      if (!categories[category]) {
        categories[category] = []
      }
      categories[category].push(table)
    })
    return categories
  }

  const getColumnTypeColor = (dataType: string): string => {
    if (dataType.includes("varchar") || dataType.includes("text")) return "bg-blue-100 text-blue-800"
    if (dataType.includes("integer") || dataType.includes("bigint")) return "bg-green-100 text-green-800"
    if (dataType.includes("timestamp") || dataType.includes("date")) return "bg-purple-100 text-purple-800"
    if (dataType.includes("boolean")) return "bg-yellow-100 text-yellow-800"
    if (dataType.includes("jsonb") || dataType.includes("json")) return "bg-orange-100 text-orange-800"
    return "bg-gray-100 text-gray-800"
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Database className="h-8 w-8 mr-3 text-blue-600" />
                Database Structure Map
              </h1>
              <p className="text-gray-600 mt-2">Complete analysis of your digital signage database schema</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {connectionStatus === "connected" ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : connectionStatus === "error" ? (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                ) : (
                  <Database className="h-5 w-5 text-gray-400" />
                )}
                <span className="text-sm font-medium">
                  Status:{" "}
                  {connectionStatus === "connected" ? "Connected" : connectionStatus === "error" ? "Error" : "Unknown"}
                </span>
              </div>
              <Button onClick={fetchDatabaseStructure} disabled={loading} variant="outline">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Database Schema Image */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Database Schema Overview</CardTitle>
            <CardDescription>Visual representation of your database tables</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <img
                src="/database-schema.png"
                alt="Database Schema"
                className="max-w-full h-auto rounded-lg border shadow-sm"
              />
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-lg">Analyzing database structure...</span>
          </div>
        )}

        {!loading && tables.length > 0 && (
          <div className="space-y-8">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Table className="h-8 w-8 text-blue-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Total Tables</p>
                      <p className="text-2xl font-bold">{tables.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Hash className="h-8 w-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Total Columns</p>
                      <p className="text-2xl font-bold">
                        {tables.reduce((sum, table) => sum + table.columns.length, 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Database className="h-8 w-8 text-purple-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Tables with Data</p>
                      <p className="text-2xl font-bold">{tables.filter((table) => table.rowCount > 0).length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Key className="h-8 w-8 text-orange-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Foreign Keys</p>
                      <p className="text-2xl font-bold">
                        {tables.reduce(
                          (sum, table) => sum + table.columns.filter((col) => col.foreign_key_table).length,
                          0,
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tables by Category */}
            {Object.entries(getTablesByCategory()).map(([category, categoryTables]) => (
              <div key={category}>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{category}</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {categoryTables.map((table) => (
                    <Card key={table.name}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center">
                            <Table className="h-5 w-5 mr-2 text-blue-600" />
                            {table.name}
                          </CardTitle>
                          <div className="flex items-center space-x-2">
                            <Badge variant={table.rowCount > 0 ? "default" : "secondary"}>{table.rowCount} rows</Badge>
                            <Badge variant="outline">{table.columns.length} columns</Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {table.columns.map((column) => (
                            <div key={column.column_name} className="flex items-center justify-between py-2 border-b">
                              <div className="flex items-center space-x-2">
                                {column.is_primary_key && <Key className="h-4 w-4 text-yellow-600" />}
                                <span className="font-medium">{column.column_name}</span>
                                {column.foreign_key_table && (
                                  <Badge variant="outline" className="text-xs">
                                    FK → {column.foreign_key_table}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge className={getColumnTypeColor(column.data_type)} variant="secondary">
                                  {column.data_type}
                                </Badge>
                                {column.is_nullable === "NO" && (
                                  <Badge variant="destructive" className="text-xs">
                                    Required
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}

            {/* Key Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
                <CardDescription>Important observations about your database structure</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Architecture Overview</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>
                        • You have a <strong>devices</strong> table for device players
                      </li>
                      <li>
                        • No separate <strong>screens</strong> table found - may need clarification
                      </li>
                      <li>• Rich content management with media_files, playlists, and playlist_items</li>
                      <li>• Sophisticated subscription system with multiple plan-related tables</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">Data Status</h4>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>
                        • Tables with data:{" "}
                        {tables
                          .filter((t) => t.rowCount > 0)
                          .map((t) => t.name)
                          .join(", ")}
                      </li>
                      <li>
                        • Empty tables:{" "}
                        {tables
                          .filter((t) => t.rowCount === 0)
                          .map((t) => t.name)
                          .join(", ")}
                      </li>
                    </ul>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h4 className="font-medium text-yellow-900 mb-2">Recommendations</h4>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      <li>
                        • Consider creating a separate <strong>screens</strong> table if needed
                      </li>
                      <li>• Clean up any unused tables to simplify the schema</li>
                      <li>• Verify foreign key relationships are properly established</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
