"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Database, Table, AlertCircle, CheckCircle } from "lucide-react"

interface TableInfo {
  table_name: string
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
}

interface TableStructure {
  [tableName: string]: TableInfo[]
}

interface TableStats {
  table_name: string
  row_count: number
}

export default function DatabaseStructureMapPage() {
  const [loading, setLoading] = useState(true)
  const [structure, setStructure] = useState<TableStructure>({})
  const [stats, setStats] = useState<TableStats[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDatabaseStructure()
  }, [])

  const fetchDatabaseStructure = async () => {
    try {
      const response = await fetch("/api/database-structure-map")
      const data = await response.json()

      if (response.ok) {
        setStructure(data.structure)
        setStats(data.stats)
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

  const getTableCategory = (tableName: string) => {
    if (tableName.includes("user") || tableName.includes("admin") || tableName.includes("password")) {
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
      return { category: "Features", color: "bg-yellow-100 text-yellow-800" }
    }
    return { category: "Other", color: "bg-gray-100 text-gray-800" }
  }

  const getRowCount = (tableName: string) => {
    const stat = stats.find((s) => s.table_name === tableName)
    return stat ? stat.row_count : 0
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Loading database structure...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Database className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Database Structure Map</h1>
          </div>
          <p className="text-gray-600">Complete overview of your digital signage database schema</p>
        </div>

        {/* Database Schema Image */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Database Schema Overview</CardTitle>
            <CardDescription>Visual representation of your database tables</CardDescription>
          </CardHeader>
          <CardContent>
            <img
              src="/database-schema.png"
              alt="Database Schema"
              className="w-full max-w-md mx-auto rounded-lg border"
            />
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Table className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{Object.keys(structure).length}</p>
                  <p className="text-sm text-gray-600">Total Tables</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{stats.filter((s) => s.row_count > 0).length}</p>
                  <p className="text-sm text-gray-600">Tables with Data</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Database className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{stats.reduce((sum, s) => sum + s.row_count, 0)}</p>
                  <p className="text-sm text-gray-600">Total Records</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-orange-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{stats.filter((s) => s.row_count === 0).length}</p>
                  <p className="text-sm text-gray-600">Empty Tables</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tables by Category */}
        <div className="space-y-8">
          {Object.entries(
            Object.keys(structure).reduce(
              (acc, tableName) => {
                const { category } = getTableCategory(tableName)
                if (!acc[category]) acc[category] = []
                acc[category].push(tableName)
                return acc
              },
              {} as Record<string, string[]>,
            ),
          ).map(([category, tables]) => (
            <div key={category}>
              <h2 className="text-2xl font-bold mb-4 flex items-center">
                <Badge variant="secondary" className="mr-2">
                  {category}
                </Badge>
                <span className="text-sm text-gray-500">({tables.length} tables)</span>
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {tables.map((tableName) => {
                  const columns = structure[tableName]
                  const rowCount = getRowCount(tableName)
                  const { color } = getTableCategory(tableName)

                  return (
                    <Card key={tableName}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center">
                            <Table className="h-5 w-5 mr-2" />
                            {tableName}
                          </CardTitle>
                          <div className="flex items-center space-x-2">
                            <Badge className={color}>{rowCount} rows</Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {columns.map((column, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <div className="flex items-center">
                                <span className="font-medium">{column.column_name}</span>
                                {column.column_name === "id" && (
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    PK
                                  </Badge>
                                )}
                                {column.column_name.endsWith("_id") && column.column_name !== "id" && (
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    FK
                                  </Badge>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="text-gray-600">{column.data_type}</div>
                                {column.is_nullable === "NO" && <div className="text-xs text-red-600">Required</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Key Insights */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Architecture Overview</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>
                    • <strong>Users & Authentication:</strong>{" "}
                    {
                      Object.keys(structure).filter(
                        (t) => t.includes("user") || t.includes("admin") || t.includes("password"),
                      ).length
                    }{" "}
                    tables
                  </li>
                  <li>
                    • <strong>Content Management:</strong>{" "}
                    {Object.keys(structure).filter((t) => t.includes("media") || t.includes("playlist")).length} tables
                  </li>
                  <li>
                    • <strong>Device Management:</strong>{" "}
                    {Object.keys(structure).filter((t) => t.includes("device")).length} tables
                  </li>
                  <li>
                    • <strong>Subscription System:</strong>{" "}
                    {Object.keys(structure).filter((t) => t.includes("plan") || t.includes("subscription")).length}{" "}
                    tables
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Data Status</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>
                    • <strong>Active Tables:</strong>{" "}
                    {stats
                      .filter((s) => s.row_count > 0)
                      .map((s) => s.table_name)
                      .join(", ")}
                  </li>
                  <li>
                    • <strong>Empty Tables:</strong> {stats.filter((s) => s.row_count === 0).length} tables ready for
                    data
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-2">Important Notes</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>
                    • <strong>Devices vs Screens:</strong> You have a 'devices' table - clarify if you need a separate
                    'screens' table
                  </li>
                  <li>
                    • <strong>Rich Feature System:</strong> Sophisticated plan and feature management system in place
                  </li>
                  <li>
                    • <strong>Audit Trail:</strong> Comprehensive logging and tracking capabilities
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
