"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Playlist {
  id: number
  name: string
  description: string
  status: string
  created_at: string
  updated_at: string
}

export default function DebugPlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPlaylists()
  }, [])

  const fetchPlaylists = async () => {
    try {
      console.log("Fetching playlists for debug...")
      const response = await fetch("/api/playlists")
      console.log("Response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("Raw playlist data:", data)
        setPlaylists(data.playlists || [])
      } else {
        const errorData = await response.json()
        console.error("API Error:", errorData)
        setError(`API Error: ${errorData.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Fetch error:", error)
      setError(`Fetch Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "published":
        return "bg-green-100 text-green-800"
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "draft":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-red-100 text-red-800"
    }
  }

  const publishedPlaylists = playlists.filter((p) => p.status === "active" || p.status === "published")

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Debug: Playlists</h1>
          <p className="text-gray-600">Debug information for playlist assignment issue</p>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total Playlists</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{playlists.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Status: Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {playlists.filter((p) => p.status === "active").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Status: Published</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {playlists.filter((p) => p.status === "published").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Available for Assignment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{publishedPlaylists.length}</div>
            </CardContent>
          </Card>
        </div>

        {loading && (
          <Card>
            <CardContent className="text-center py-8">Loading playlists...</CardContent>
          </Card>
        )}

        {error && (
          <Card>
            <CardContent className="text-center py-8">
              <div className="text-red-600 font-medium">Error:</div>
              <div className="text-red-500">{error}</div>
            </CardContent>
          </Card>
        )}

        {!loading && !error && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>All Playlists (Raw Data)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {playlists.length === 0 ? (
                    <div className="text-gray-500">No playlists found</div>
                  ) : (
                    playlists.map((playlist) => (
                      <div key={playlist.id} className="border rounded p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{playlist.name}</div>
                          <Badge className={getStatusColor(playlist.status)}>{playlist.status}</Badge>
                        </div>
                        <div className="text-sm text-gray-600">{playlist.description}</div>
                        <div className="text-xs text-gray-500">
                          ID: {playlist.id} | Created: {playlist.created_at} | Updated: {playlist.updated_at}
                        </div>
                        <div className="text-xs">
                          <strong>Available for assignment:</strong>{" "}
                          {playlist.status === "active" || playlist.status === "published" ? "YES" : "NO"}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Playlists Available for Assignment</CardTitle>
              </CardHeader>
              <CardContent>
                {publishedPlaylists.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-red-600 font-medium">No published playlists found!</div>
                    <div className="text-gray-500 mt-2">
                      This is why the assignment dialog shows "No published playlists available"
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {publishedPlaylists.map((playlist) => (
                      <div key={playlist.id} className="border rounded p-3 bg-green-50">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{playlist.name}</div>
                          <Badge className={getStatusColor(playlist.status)}>{playlist.status}</Badge>
                        </div>
                        <div className="text-sm text-gray-600">{playlist.description}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
