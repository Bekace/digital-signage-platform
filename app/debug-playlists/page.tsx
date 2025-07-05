"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "@/components/dashboard-layout"

interface Playlist {
  id: number
  name: string
  description: string
  status: string
  created_at: string
  updated_at: string
  item_count?: number
}

export default function DebugPlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [rawData, setRawData] = useState<any>(null)

  useEffect(() => {
    fetchPlaylists()
  }, [])

  const fetchPlaylists = async () => {
    try {
      const response = await fetch("/api/playlists")
      const data = await response.json()

      console.log("Raw playlist data:", data)
      setRawData(data)
      setPlaylists(data.playlists || [])
    } catch (error) {
      console.error("Failed to fetch playlists:", error)
    } finally {
      setLoading(false)
    }
  }

  const publishedPlaylists = playlists.filter((p) => p.status === "active")
  const draftPlaylists = playlists.filter((p) => p.status === "draft")

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Debug: Playlists</h1>
          <p className="text-gray-600">Debug information for playlist assignment issue</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Total Playlists</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{playlists.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Published (Active)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{publishedPlaylists.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Draft</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-600">{draftPlaylists.length}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Available for Assignment (status = "active")</CardTitle>
          </CardHeader>
          <CardContent>
            {publishedPlaylists.length === 0 ? (
              <p className="text-red-600">No published playlists found! This is why assignment fails.</p>
            ) : (
              <div className="space-y-2">
                {publishedPlaylists.map((playlist) => (
                  <div key={playlist.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-medium">{playlist.name}</p>
                      <p className="text-sm text-gray-600">ID: {playlist.id}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">{playlist.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Playlists (Raw Data)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {playlists.map((playlist) => (
                <div key={playlist.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="font-medium">{playlist.name}</p>
                    <p className="text-sm text-gray-600">
                      ID: {playlist.id} | Status: "{playlist.status}" | Items: {playlist.item_count || 0}
                    </p>
                  </div>
                  <Badge
                    variant={playlist.status === "active" ? "default" : "secondary"}
                    className={playlist.status === "active" ? "bg-green-100 text-green-800" : ""}
                  >
                    {playlist.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Raw API Response</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">{JSON.stringify(rawData, null, 2)}</pre>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
