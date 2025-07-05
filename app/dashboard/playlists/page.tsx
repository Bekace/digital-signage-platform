"use client"

import { useState, useEffect } from "react"
import { Plus, Play, MoreHorizontal, Edit, Trash2, Copy, Clock, Monitor, Upload, Eye } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CreatePlaylistDialog } from "@/components/create-playlist-dialog"
import { EditPlaylistDialog } from "@/components/edit-playlist-dialog"
import { PreviewPlaylistDialog } from "@/components/preview-playlist-dialog"
import { DeletePlaylistDialog } from "@/components/delete-playlist-dialog"
import { PublishPlaylistDialog } from "@/components/publish-playlist-dialog"
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
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showPublishDialog, setShowPublishDialog] = useState(false)
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null)
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPlaylists = async () => {
    try {
      const response = await fetch("/api/playlists")
      if (response.ok) {
        const data = await response.json()
        setPlaylists(data.playlists || [])
      } else {
        throw new Error("Failed to fetch playlists")
      }
    } catch (error) {
      console.error("Failed to fetch playlists:", error)
      toast({
        title: "Error",
        description: "Failed to load playlists",
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

  const handlePlaylistUpdated = () => {
    fetchPlaylists()
    setShowEditDialog(false)
    setSelectedPlaylist(null)
  }

  const handlePlaylistDeleted = () => {
    fetchPlaylists()
    setShowDeleteDialog(false)
    setSelectedPlaylist(null)
  }

  const handlePlaylistPublished = () => {
    fetchPlaylists()
    setShowPublishDialog(false)
    setSelectedPlaylist(null)
  }

  const handleEditClick = (playlist: Playlist) => {
    setSelectedPlaylist(playlist)
    setShowEditDialog(true)
  }

  const handlePreviewClick = (playlist: Playlist) => {
    setSelectedPlaylist(playlist)
    setShowPreviewDialog(true)
  }

  const handleDeleteClick = (playlist: Playlist) => {
    setSelectedPlaylist(playlist)
    setShowDeleteDialog(true)
  }

  const handlePublishClick = (playlist: Playlist) => {
    setSelectedPlaylist(playlist)
    setShowPublishDialog(true)
  }

  const handleDuplicateClick = async (playlist: Playlist) => {
    try {
      const response = await fetch(`/api/playlists/${playlist.id}/duplicate`, {
        method: "POST",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Playlist duplicated successfully",
        })
        fetchPlaylists()
      } else {
        throw new Error("Failed to duplicate playlist")
      }
    } catch (error) {
      console.error("Duplicate error:", error)
      toast({
        title: "Error",
        description: "Failed to duplicate playlist",
        variant: "destructive",
      })
    }
  }

  const handleUnpublish = async (playlistId: number) => {
    try {
      const response = await fetch(`/api/playlists/${playlistId}/unpublish`, {
        method: "POST",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Playlist unpublished successfully",
        })
        fetchPlaylists()
      } else {
        throw new Error("Failed to unpublish playlist")
      }
    } catch (error) {
      console.error("Unpublish error:", error)
      toast({
        title: "Error",
        description: "Failed to unpublish playlist",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="text-center">Loading playlists...</div>
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
              <CardTitle className="text-sm font-medium">Published</CardTitle>
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
                      <DropdownMenuItem onClick={() => handleEditClick(playlist)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePreviewClick(playlist)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </DropdownMenuItem>
                      {playlist.status === "draft" ? (
                        <DropdownMenuItem onClick={() => handlePublishClick(playlist)}>
                          <Upload className="h-4 w-4 mr-2" />
                          Publish
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handleUnpublish(playlist.id)}>
                          <Upload className="h-4 w-4 mr-2" />
                          Unpublish
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleDuplicateClick(playlist)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteClick(playlist)}>
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent"
                      onClick={() => handleEditClick(playlist)}
                    >
                      Edit
                    </Button>
                    {playlist.status === "draft" ? (
                      <Button size="sm" className="flex-1" onClick={() => handlePublishClick(playlist)}>
                        Publish
                      </Button>
                    ) : (
                      <Button size="sm" className="flex-1" onClick={() => handlePreviewClick(playlist)}>
                        Preview
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* All Dialogs */}
        <CreatePlaylistDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onPlaylistCreated={handlePlaylistCreated}
        />

        <EditPlaylistDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          playlist={selectedPlaylist}
          onPlaylistUpdated={handlePlaylistUpdated}
        />

        <PreviewPlaylistDialog
          open={showPreviewDialog}
          onOpenChange={setShowPreviewDialog}
          playlist={selectedPlaylist}
        />

        <DeletePlaylistDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          playlist={selectedPlaylist}
          onPlaylistDeleted={handlePlaylistDeleted}
        />

        {selectedPlaylist && (
          <PublishPlaylistDialog
            open={showPublishDialog}
            onOpenChange={setShowPublishDialog}
            playlist={selectedPlaylist}
            onPlaylistPublished={handlePlaylistPublished}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
