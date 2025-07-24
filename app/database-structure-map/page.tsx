"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Database, Table, RefreshCw, AlertCircle, CheckCircle } from "lucide-react"

interface TableInfo {
  table_name: string
  column_count: number
  row_count: number
  columns: Array<{
    column_name: string
    data_type: string
    is_nullable: string
    column_default: string | null
  }>
}

interface DatabaseStructure {
  tables: TableInfo[]
  totalTables: number
  totalColumns: number
  totalRows: number
}

export default function DatabaseStructureMapPage() {
  const [loading, setLoading] = useState(true)
  const [structure, setStructure] = useState<DatabaseStructure | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchStructure = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/database-structure-map")
      const data = await response.json()

      if (response.ok) {
        setStructure(data)
      } else {
        setError(data.error || "Failed to fetch database structure")
      }
    } catch (err) {
      setError("Network error: Failed to fetch database structure")
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStructure()
  }, [])

  const categorizeTable = (tableName: string) => {
    if (tableName.includes("user") || tableName.includes("admin") || tableName.includes("auth")) {
      return { category: "Authentication", color: "bg-blue-100 text-blue-800" }
    }
    if (tableName.includes("device") || tableName.includes("screen")) {
      return { category: "Devices & Screens", color: "bg-green-100 text-green-800" }
    }
    if (tableName.includes("media") || tableName.includes("playlist")) {
      return { category: "Content Management", color: "bg-purple-100 text-purple-800" }
    }
    if (tableName.includes("plan") || tableName.includes("subscription")) {
      return { category: "Billing & Plans", color: "bg-orange-100 text-orange-800" }
    }
    if (tableName.includes("feature")) {
      return { category: "Features", color: "bg-pink-100 text-pink-800" }
    }
    return { category: "Other", color: "bg-gray-100 text-gray-800" }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Loading database structure...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold">Database Structure Map</h1>
            </div>
            <Button onClick={fetchStructure} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          <p className="text-gray-600 mt-2">Complete overview of your digital signage database schema</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Database Overview */}
        {structure && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Table className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-2xl font-bold">{structure.totalTables}</p>
                      <p className="text-gray-600">Tables</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Database className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-2xl font-bold">{structure.totalColumns}</p>
                      <p className="text-gray-600">Columns</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-2xl font-bold">{structure.totalRows.toLocaleString()}</p>
                      <p className="text-gray-600">Total Records</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Database className="h-8 w-8 text-orange-600" />
                    <div className="ml-4">
                      <p className="text-2xl font-bold">{structure.tables.filter((t) => t.row_count > 0).length}</p>
                      <p className="text-gray-600">Tables with Data</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tables by Category */}
            {["Authentication", "Devices & Screens", "Content Management", "Billing & Plans", "Features", "Other"].map(
              (category) => {
                const categoryTables = structure.tables.filter(
                  (table) => categorizeTable(table.table_name).category === category,
                )

                if (categoryTables.length === 0) return null

                return (
                  <div key={category} className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">{category}</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {categoryTables.map((table) => {
                        const { color } = categorizeTable(table.table_name)
                        return (
                          <Card key={table.table_name}>
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center">
                                  <Table className="h-5 w-5 mr-2" />
                                  {table.table_name}
                                </CardTitle>
                                <div className="flex space-x-2">
                                  <Badge className={color}>{table.row_count} rows</Badge>
                                  <Badge variant="outline">{table.column_count} cols</Badge>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                {table.columns.slice(0, 5).map((column) => (
                                  <div key={column.column_name} className="flex justify-between text-sm">
                                    <span className="font-medium">{column.column_name}</span>
                                    <span className="text-gray-500">
                                      {column.data_type}
                                      {column.is_nullable === "NO" && " (required)"}
                                    </span>
                                  </div>
                                ))}
                                {table.columns.length > 5 && (
                                  <p className="text-sm text-gray-500">
                                    ... and {table.columns.length - 5} more columns
                                  </p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                )
              },
            )}

            {/* Key Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
                <CardDescription>Important observations about your database structure</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">🔍 Architecture Analysis</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>
                        • <strong>Users & Authentication:</strong>{" "}
                        {
                          structure.tables.filter(
                            (t) => t.table_name.includes("user") || t.table_name.includes("admin"),
                          ).length
                        }{" "}
                        tables
                      </li>
                      <li>
                        • <strong>Device Management:</strong>{" "}
                        {structure.tables.filter((t) => t.table_name.includes("device")).length} tables
                      </li>
                      <li>
                        • <strong>Content System:</strong>{" "}
                        {
                          structure.tables.filter(
                            (t) => t.table_name.includes("media") || t.table_name.includes("playlist"),
                          ).length
                        }{" "}
                        tables
                      </li>
                      <li>
                        • <strong>Subscription System:</strong>{" "}
                        {
                          structure.tables.filter(
                            (t) => t.table_name.includes("plan") || t.table_name.includes("subscription"),
                          ).length
                        }{" "}
                        tables
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">📊 Data Distribution</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>
                        • <strong>Tables with data:</strong> {structure.tables.filter((t) => t.row_count > 0).length}{" "}
                        out of {structure.totalTables}
                      </li>
                      <li>
                        • <strong>Largest table:</strong>{" "}
                        {
                          structure.tables.reduce(
                            (max, table) => (table.row_count > max.row_count ? table : max),
                            structure.tables[0],
                          )?.table_name
                        }{" "}
                        (
                        {
                          structure.tables.reduce(
                            (max, table) => (table.row_count > max.row_count ? table : max),
                            structure.tables[0],
                          )?.row_count
                        }{" "}
                        rows)
                      </li>
                      <li>
                        • <strong>Empty tables:</strong> {structure.tables.filter((t) => t.row_count === 0).length}
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-2">⚠️ Important Notes</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>
                        • <strong>Screens vs Devices:</strong> Check if you need a separate 'screens' table or if
                        'devices' handles both
                      </li>
                      <li>
                        • <strong>Admin System:</strong> admin_users table exists for role-based permissions
                      </li>
                      <li>
                        • <strong>Content Management:</strong> Rich playlist and media management system in place
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
