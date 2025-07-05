"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Database, List } from "lucide-react"

interface Playlist {
  id: number
  name: string
  description: string
  status: string
  items: number
  duration: string
  created_at: string
  updated_at: string
}

export default function DebugPlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(false)
  const [rawData, setRawData] = useState<any>(null)

  const fetchPlaylists = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/playlists", {
        credentials: "include",
      })

      const data = await response.json()
      setRawData(data)

      if (data.success) {
        setPlaylists(data.playlists || [])
      } else {
        console.error("API Error:", data.error)
      }
    } catch (error) {
      console.error("Fetch error:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlaylists()
  }, [])

  const publishedPlaylists = playlists.filter((p) => p.status === "active")
  const draftPlaylists = playlists.filter((p) => p.status === "draft")

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Debug Playlists</h1>
        <Button onClick={fetchPlaylists} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Playlists</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{playlists.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Published (Active)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{publishedPlaylists.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Draft</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{draftPlaylists.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">API Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {rawData?.success ? (
                <Badge className="bg-green-100 text-green-800">Success</Badge>
              ) : (
                <Badge className="bg-red-100 text-red-800">Error</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Published Playlists */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <List className="h-5 w-5 text-green-600" />
            Published Playlists (Available for Assignment)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {publishedPlaylists.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No published playlists found</p>
          ) : (
            <div className="space-y-3">
              {publishedPlaylists.map((playlist) => (
                <div key={playlist.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{playlist.name}</h3>
                      <p className="text-sm text-gray-600">{playlist.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        <span>ID: {playlist.id}</span>
                        <span>Items: {playlist.items}</span>
                        <span>Duration: {playlist.duration}</span>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">{playlist.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Draft Playlists */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <List className="h-5 w-5 text-gray-600" />
            Draft Playlists
          </CardTitle>
        </CardHeader>
        <CardContent>
          {draftPlaylists.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No draft playlists found</p>
          ) : (
            <div className="space-y-3">
              {draftPlaylists.map((playlist) => (
                <div key={playlist.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{playlist.name}</h3>
                      <p className="text-sm text-gray-600">{playlist.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        <span>ID: {playlist.id}</span>
                        <span>Items: {playlist.items}</span>
                        <span>Duration: {playlist.duration}</span>
                      </div>
                    </div>
                    <Badge className="bg-gray-100 text-gray-800">{playlist.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Raw API Response */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Raw API Response
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-60">
            {JSON.stringify(rawData, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
