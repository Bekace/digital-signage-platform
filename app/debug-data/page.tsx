"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function DebugDataPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)
  const [tableStructure, setTableStructure] = useState<any>(null)

  async function fetchDebugData() {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/debug/check-data")

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API error: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
      console.error("Debug data fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchTableStructure() {
    try {
      const response = await fetch("/api/debug/table-structure")

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API error: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      setTableStructure(result)
    } catch (err) {
      console.error("Table structure fetch error:", err)
    }
  }

  useEffect(() => {
    fetchDebugData()
    fetchTableStructure()
  }, [])

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold">Database Debug Information</h1>

      {loading && <p className="text-gray-500">Loading debug data...</p>}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {data && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Database Connection</CardTitle>
              <CardDescription>Status of database connection and configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium">Connection Status:</div>
                <div>{data.connection === "OK" ? "✅ Connected" : "❌ Failed"}</div>

                <div className="font-medium">Database URL Set:</div>
                <div>{data.database_url_set ? "✅ Yes" : "❌ No"}</div>

                <div className="font-medium">Database URL Preview:</div>
                <div className="truncate">{data.database_url_preview || "Not available"}</div>

                <div className="font-medium">Timestamp:</div>
                <div>{data.timestamp || "Not available"}</div>
              </div>
            </CardContent>
          </Card>

          {data.error && (
            <Alert variant="destructive">
              <AlertTitle>Database Error</AlertTitle>
              <AlertDescription className="whitespace-pre-wrap">{data.error}</AlertDescription>
            </Alert>
          )}

          {data.tables && (
            <Card>
              <CardHeader>
                <CardTitle>Database Tables</CardTitle>
                <CardDescription>List of tables in the database</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Table Name</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.tables.map((table: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{table.table_name}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {tableStructure && (
            <Card>
              <CardHeader>
                <CardTitle>Table Structure</CardTitle>
                <CardDescription>Column information for key tables</CardDescription>
              </CardHeader>
              <CardContent>
                {Object.entries(tableStructure.tables || {}).map(([tableName, columns]: [string, any]) => (
                  <div key={tableName} className="mb-6">
                    <h3 className="text-lg font-medium mb-2">{tableName}</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Column Name</TableHead>
                          <TableHead>Data Type</TableHead>
                          <TableHead>Is Nullable</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {columns.map((column: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{column.column_name}</TableCell>
                            <TableCell>{column.data_type}</TableCell>
                            <TableCell>{column.is_nullable}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {data.devices && (
            <Card>
              <CardHeader>
                <CardTitle>Devices</CardTitle>
                <CardDescription>Registered devices in the system</CardDescription>
              </CardHeader>
              <CardContent>
                {data.devices.length === 0 ? (
                  <p className="text-gray-500">No devices found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Seen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.devices.map((device: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{device.id || device.device_id}</TableCell>
                          <TableCell>{device.name || device.screen_name}</TableCell>
                          <TableCell>{device.status}</TableCell>
                          <TableCell>{device.last_seen}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {data.media && (
            <Card>
              <CardHeader>
                <CardTitle>Media Files</CardTitle>
                <CardDescription>Media files in the system</CardDescription>
              </CardHeader>
              <CardContent>
                {data.media.length === 0 ? (
                  <p className="text-gray-500">No media files found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Filename</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Size</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.media.map((file: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{file.id}</TableCell>
                          <TableCell>{file.filename || file.original_name}</TableCell>
                          <TableCell>{file.file_type}</TableCell>
                          <TableCell>
                            {file.file_size ? `${Math.round(file.file_size / 1024)} KB` : "Unknown"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {data.playlists && (
            <Card>
              <CardHeader>
                <CardTitle>Playlists</CardTitle>
                <CardDescription>Content playlists in the system</CardDescription>
              </CardHeader>
              <CardContent>
                {data.playlists.length === 0 ? (
                  <p className="text-gray-500">No playlists found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Items</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.playlists.map((playlist: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{playlist.id}</TableCell>
                          <TableCell>{playlist.name}</TableCell>
                          <TableCell>{playlist.status}</TableCell>
                          <TableCell>{playlist.items?.length || 0}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Raw Debug Data</CardTitle>
              <CardDescription>Complete debug information</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96 text-xs">
                {JSON.stringify(data, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </>
      )}

      <div className="flex gap-4">
        <Button onClick={fetchDebugData} disabled={loading}>
          {loading ? "Loading..." : "Refresh Debug Data"}
        </Button>
        <Button onClick={fetchTableStructure} variant="outline">
          Refresh Table Structure
        </Button>
      </div>
    </div>
  )
}
