"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function DebugDataPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/debug/check-data")
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError("Failed to fetch debug data")
      console.error(err)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading debug data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-red-600">Error: {error}</div>
        <Button onClick={fetchData} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  if (!data || !data.success) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-red-600">{data?.error || "No data available or request failed"}</div>
        <Button onClick={fetchData} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  const currentUser = data.current_user || {}
  const currentUserData = data.current_user_data || {}
  const detailedData = data.detailed_data || {}
  const allDataDebug = data.all_data_debug || {}
  const databaseInfo = data.database_info || {}

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Database Debug Dashboard</h1>
        <Button onClick={fetchData}>Refresh Data</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Current User</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentUser.email || "Not logged in"}</div>
            <div className="text-sm text-gray-600">ID: {currentUser.id || "None"}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentUserData.devices || 0}</div>
            <div className="text-sm text-gray-600">Your devices</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Media Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentUserData.media_files || 0}</div>
            <div className="text-sm text-gray-600">Your media</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Playlists</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentUserData.playlists || 0}</div>
            <div className="text-sm text-gray-600">Your playlists</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="current" className="w-full">
        <TabsList>
          <TabsTrigger value="current">Your Data</TabsTrigger>
          <TabsTrigger value="all">All Data (Debug)</TabsTrigger>
          <TabsTrigger value="tables">Database Tables</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Devices</CardTitle>
              </CardHeader>
              <CardContent>
                {!detailedData.current_user_devices || detailedData.current_user_devices.length === 0 ? (
                  <p className="text-gray-500">No devices found</p>
                ) : (
                  <div className="space-y-2">
                    {detailedData.current_user_devices.map((device: any) => (
                      <div key={device.id} className="border p-2 rounded">
                        <div className="font-medium">{device.name || "Unnamed Device"}</div>
                        <div className="text-sm text-gray-600">Code: {device.device_code || "No code"}</div>
                        <Badge variant={device.status === "online" ? "default" : "secondary"}>
                          {device.status || "unknown"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Media Files</CardTitle>
              </CardHeader>
              <CardContent>
                {!detailedData.current_user_media || detailedData.current_user_media.length === 0 ? (
                  <p className="text-gray-500">No media files found</p>
                ) : (
                  <div className="space-y-2">
                    {detailedData.current_user_media.map((media: any) => (
                      <div key={media.id} className="border p-2 rounded">
                        <div className="font-medium">{media.original_name || "Unnamed File"}</div>
                        <div className="text-sm text-gray-600">
                          {media.file_type || "Unknown"} • {Math.round((media.file_size || 0) / 1024)} KB
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Playlists</CardTitle>
              </CardHeader>
              <CardContent>
                {!detailedData.current_user_playlists || detailedData.current_user_playlists.length === 0 ? (
                  <p className="text-gray-500">No playlists found</p>
                ) : (
                  <div className="space-y-2">
                    {detailedData.current_user_playlists.map((playlist: any) => (
                      <div key={playlist.id} className="border p-2 rounded">
                        <div className="font-medium">{playlist.name || "Unnamed Playlist"}</div>
                        <div className="text-sm text-gray-600">{playlist.description || "No description"}</div>
                        <Badge variant="outline">{playlist.status || "unknown"}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>All Devices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {!allDataDebug.all_devices || allDataDebug.all_devices.length === 0 ? (
                    <p className="text-gray-500">No devices in database</p>
                  ) : (
                    allDataDebug.all_devices.map((device: any) => (
                      <div key={device.id} className="border p-2 rounded text-sm">
                        <div className="font-medium">{device.name || "Unnamed Device"}</div>
                        <div className="text-gray-600">User: {device.user_email || "No user"}</div>
                        <div className="text-gray-600">Code: {device.device_code || "No code"}</div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>All Media Files</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {!allDataDebug.all_media_files || allDataDebug.all_media_files.length === 0 ? (
                    <p className="text-gray-500">No media files in database</p>
                  ) : (
                    allDataDebug.all_media_files.map((media: any) => (
                      <div key={media.id} className="border p-2 rounded text-sm">
                        <div className="font-medium">{media.original_name || "Unnamed File"}</div>
                        <div className="text-gray-600">User: {media.user_email || "No user"}</div>
                        <div className="text-gray-600">Type: {media.file_type || "Unknown"}</div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>All Playlists</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {!allDataDebug.all_playlists || allDataDebug.all_playlists.length === 0 ? (
                    <p className="text-gray-500">No playlists in database</p>
                  ) : (
                    allDataDebug.all_playlists.map((playlist: any) => (
                      <div key={playlist.id} className="border p-2 rounded text-sm">
                        <div className="font-medium">{playlist.name || "Unnamed Playlist"}</div>
                        <div className="text-gray-600">User: {playlist.user_email || "No user"}</div>
                        <div className="text-gray-600">Status: {playlist.status || "unknown"}</div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tables">
          <Card>
            <CardHeader>
              <CardTitle>Database Tables</CardTitle>
              <CardDescription>Tables that exist in your database</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {!databaseInfo.tables_exist || databaseInfo.tables_exist.length === 0 ? (
                  <p className="text-gray-500">No tables found</p>
                ) : (
                  databaseInfo.tables_exist.map((table: any) => (
                    <Badge key={table.table_name} variant="outline">
                      {table.table_name}
                    </Badge>
                  ))
                )}
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-600">Total users in database: {databaseInfo.total_users || 0}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Raw Debug Data</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96">{JSON.stringify(data, null, 2)}</pre>
        </CardContent>
      </Card>
    </div>
  )
}
