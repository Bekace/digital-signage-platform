"use client"

import { useState, useEffect } from "react"
import { Plus, Play, MoreHorizontal, Edit, Trash2, Copy, Clock, Monitor } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CreatePlaylistDialog } from "@/components/create-playlist-dialog"
import { toast } from "@/hooks/use-toast"

interface Playlist {
  id: number
  name: string
  description: string
  items: number
  duration: string
  status: string
  screens: string[]
  lastModified: string
}

export default function PlaylistsPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPlaylists = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("🎵 [FRONTEND] Starting playlist fetch...")
      console.log("🎵 [FRONTEND] Current URL:", window.location.href)
      console.log("🎵 [FRONTEND] Document cookies:", document.cookie)

      const response = await fetch("/api/playlists", {
        method: "GET",
        credentials: "include", // Important: include cookies
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("🎵 [FRONTEND] Response status:", response.status)
      console.log("🎵 [FRONTEND] Response headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error("🎵 [FRONTEND] Response not OK:", errorText)

        if (response.status === 401) {
          setError("Authentication required. Please log in again.")
          // Redirect to login after a delay
          setTimeout(() => {
            window.location.href = "/login"
          }, 2000)
          return
        }

        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      console.log("🎵 [FRONTEND] Response data:", data)

      if (data.success && Array.isArray(data.playlists)) {
        setPlaylists(data.playlists)
        console.log("🎵 [FRONTEND] Successfully loaded", data.playlists.length, "playlists")

        if (data.playlists.length > 0) {
          toast({
            title: "Playlists loaded",
            description: `Found ${data.playlists.length} playlist${data.playlists.length === 1 ? "" : "s"}`,
          })
        }
      } else {
        console.error("🎵 [FRONTEND] Invalid response format:", data)
        const errorMsg = data.error || "Invalid response format"
        setError(errorMsg)
        throw new Error(errorMsg)
      }
    } catch (error) {
      console.error("🎵 [FRONTEND] Failed to fetch playlists:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to load playlists"
      setError(errorMessage)

      toast({
        title: "Error loading playlists",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlaylists()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "draft":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handlePlaylistCreated = () => {
    fetchPlaylists()
    setShowCreateDialog(false)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading playlists...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Playlists -------</h1>
              <p className="text-gray-600">Create and manage content playlists for your screens</p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Playlist
            </Button>
          </div>

          <Card>
            <CardContent className="text-center py-8">
              <div className="text-red-500 mb-4">
                <Play className="h-12 w-12 mx-auto mb-2" />
                <h3 className="text-lg font-medium mb-2">Error Loading Playlists</h3>
                <p className="text-sm">{error}</p>
              </div>
              <Button onClick={fetchPlaylists} variant="outline">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Playlists</h1>
            <p className="text-gray-600">Create and manage content playlists for your screens</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Playlist
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Playlists</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{playlists.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {playlists.filter((p) => p.status === "active").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {playlists.filter((p) => p.status === "scheduled").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Drafts</CardTitle>
              <Edit className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">
                {playlists.filter((p) => p.status === "draft").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Playlists Grid */}
        {playlists.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Play className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No playlists yet</h3>
              <p className="text-gray-500 mb-4">Create your first playlist to get started</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Playlist
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {playlists.map((playlist) => (
              <Card key={playlist.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center space-x-2">
                    <Play className="h-5 w-5" />
                    <CardTitle className="text-lg">{playlist.name}</CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription>{playlist.description}</CardDescription>

                  <div className="flex justify-between items-center">
                    <Badge className={getStatusColor(playlist.status)}>
                      {playlist.status.charAt(0).toUpperCase() + playlist.status.slice(1)}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Items:</span>
                      <span>{playlist.items}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span>{playlist.duration}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Screens:</span>
                      <span>{playlist.screens.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Modified:</span>
                      <span>{playlist.lastModified}</span>
                    </div>
                  </div>

                  {playlist.screens.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Active on:</div>
                      <div className="flex flex-wrap gap-1">
                        {playlist.screens.map((screen, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            <Monitor className="h-3 w-3 mr-1" />
                            {screen}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                      Edit
                    </Button>
                    <Button size="sm" className="flex-1">
                      {playlist.status === "draft" ? "Publish" : "Preview"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <CreatePlaylistDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onPlaylistCreated={handlePlaylistCreated}
        />
      </div>
    </DashboardLayout>
  )
}
