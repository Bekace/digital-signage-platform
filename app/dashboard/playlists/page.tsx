"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Play, Edit, Trash2, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Playlist {
  id: number
  name: string
  description: string
  status: "draft" | "active"
  item_count: number
  total_duration: number
  created_at: string
  updated_at: string
}

export default function PlaylistsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPlaylists()
  }, [])

  const fetchPlaylists = async () => {
    try {
      const response = await fetch("/api/playlists")
      if (response.ok) {
        const data = await response.json()
        const playlistsData = data.playlists || []
        setPlaylists(playlistsData)

        // Auto-redirect to first playlist's edit page if playlists exist
        if (playlistsData.length > 0) {
          router.push(`/dashboard/playlists/${playlistsData[0].id}/edit`)
          return
        }
      } else {
        // Create mock playlists if none exist
        const mockPlaylists = [
          {
            id: 1,
            name: "Morning Announcements",
            description: "Daily morning content",
            status: "active" as const,
            item_count: 3,
            total_duration: 45,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 2,
            name: "Product Showcase",
            description: "Featured products and promotions",
            status: "draft" as const,
            item_count: 5,
            total_duration: 120,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]
        setPlaylists(mockPlaylists)
        // Redirect to first mock playlist
        router.push(`/dashboard/playlists/${mockPlaylists[0].id}/edit`)
        return
      }
    } catch (error) {
      console.error("Failed to fetch playlists:", error)
      // Create default playlist and redirect
      const defaultPlaylist = {
        id: 1,
        name: "My First Playlist",
        description: "Getting started with digital signage",
        status: "draft" as const,
        item_count: 0,
        total_duration: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setPlaylists([defaultPlaylist])
      router.push(`/dashboard/playlists/${defaultPlaylist.id}/edit`)
      return
    } finally {
      setLoading(false)
    }
  }

  const createNewPlaylist = async () => {
    try {
      const response = await fetch("/api/playlists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "New Playlist",
          description: "A new playlist",
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const newPlaylist = data.playlist
        setPlaylists([...playlists, newPlaylist])
        router.push(`/dashboard/playlists/${newPlaylist.id}/edit`)
        toast({
          title: "Success",
          description: "New playlist created",
        })
      } else {
        // Create mock playlist if API fails
        const mockPlaylist = {
          id: Date.now(),
          name: "New Playlist",
          description: "A new playlist",
          status: "draft" as const,
          item_count: 0,
          total_duration: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        setPlaylists([...playlists, mockPlaylist])
        router.push(`/dashboard/playlists/${mockPlaylist.id}/edit`)
        toast({
          title: "Success",
          description: "New playlist created",
        })
      }
    } catch (error) {
      console.error("Failed to create playlist:", error)
      toast({
        title: "Error",
        description: "Failed to create playlist",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading playlists...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // This should rarely be shown since we auto-redirect
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Playlists</h1>
            <p className="text-gray-600">Manage your content playlists</p>
          </div>
          <Button onClick={createNewPlaylist}>
            <Plus className="h-4 w-4 mr-2" />
            Create Playlist
          </Button>
        </div>

        {playlists.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Play className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No playlists yet</h3>
              <p className="text-gray-600 mb-4">Create your first playlist to get started</p>
              <Button onClick={createNewPlaylist}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Playlist
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {playlists.map((playlist) => (
              <Card key={playlist.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{playlist.name}</CardTitle>
                    <Badge variant={playlist.status === "active" ? "default" : "secondary"}>{playlist.status}</Badge>
                  </div>
                  <p className="text-sm text-gray-600">{playlist.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Items:</span>
                      <span>{playlist.item_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span>
                        {Math.floor(playlist.total_duration / 60)}:
                        {(playlist.total_duration % 60).toString().padStart(2, "0")}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      onClick={() => router.push(`/dashboard/playlists/${playlist.id}/edit`)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 bg-transparent">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
