"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CreatePlaylistDialog } from "@/components/create-playlist-dialog"
import { EditPlaylistDialog } from "@/components/edit-playlist-dialog"
import { PreviewPlaylistDialog } from "@/components/preview-playlist-dialog"
import { DeletePlaylistDialog } from "@/components/delete-playlist-dialog"
import { PublishPlaylistDialog } from "@/components/publish-playlist-dialog"
import { toast } from "@/hooks/use-toast"
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Eye,
  Copy,
  Trash2,
  Upload,
  UploadCloud,
  Calendar,
  Clock,
  Play,
} from "lucide-react"

interface Playlist {
  id: number
  name: string
  description: string
  status: string
  created_at: string
  updated_at: string
  item_count?: number
}

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null)

  useEffect(() => {
    fetchPlaylists()
  }, [])

  const fetchPlaylists = async () => {
    try {
      const response = await fetch("/api/playlists")
      if (response.ok) {
        const data = await response.json()
        setPlaylists(data.playlists || [])
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

  const handleEdit = (playlist: Playlist) => {
    setSelectedPlaylist(playlist)
    setEditDialogOpen(true)
  }

  const handlePreview = (playlist: Playlist) => {
    setSelectedPlaylist(playlist)
    setPreviewDialogOpen(true)
  }

  const handleDelete = (playlist: Playlist) => {
    setSelectedPlaylist(playlist)
    setDeleteDialogOpen(true)
  }

  const handleDuplicate = async (playlist: Playlist) => {
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

  const handlePublish = (playlist: Playlist) => {
    setSelectedPlaylist(playlist)
    setPublishDialogOpen(true)
  }

  const filteredPlaylists = playlists.filter((playlist) =>
    playlist.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Playlists</h1>
              <p className="text-gray-600">Manage your content playlists</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
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
            <p className="text-gray-600">Manage your content playlists</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Playlist
          </Button>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search playlists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filteredPlaylists.length === 0 ? (
          <Card className="p-12 text-center">
            <Play className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No playlists found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? "No playlists match your search." : "Create your first playlist to get started."}
            </p>
            {!searchTerm && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Playlist
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlaylists.map((playlist) => (
              <Card key={playlist.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{playlist.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {playlist.description || "No description"}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(playlist)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePreview(playlist)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(playlist)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handlePublish(playlist)}>
                          {playlist.status === "active" ? (
                            <>
                              <UploadCloud className="h-4 w-4 mr-2" />
                              Unpublish
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Publish
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDelete(playlist)} className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant={playlist.status === "active" ? "default" : "secondary"}>
                      {playlist.status === "active" ? "Published" : "Draft"}
                    </Badge>
                    <span className="text-sm text-gray-500">{playlist.item_count || 0} items</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 space-x-4">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(playlist.created_at)}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDate(playlist.updated_at)}
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-4">
                    <Button variant="outline" size="sm" onClick={() => handlePreview(playlist)} className="flex-1">
                      <Eye className="h-3 w-3 mr-1" />
                      Preview
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(playlist)} className="flex-1">
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <CreatePlaylistDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onPlaylistCreated={fetchPlaylists}
        />

        <EditPlaylistDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          playlist={selectedPlaylist}
          onPlaylistUpdated={fetchPlaylists}
        />

        <PreviewPlaylistDialog
          open={previewDialogOpen}
          onOpenChange={setPreviewDialogOpen}
          playlist={selectedPlaylist}
        />

        <DeletePlaylistDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          playlist={selectedPlaylist}
          onPlaylistDeleted={fetchPlaylists}
        />

        <PublishPlaylistDialog
          open={publishDialogOpen}
          onOpenChange={setPublishDialogOpen}
          playlist={selectedPlaylist}
          onPlaylistPublished={fetchPlaylists}
        />
      </div>
    </DashboardLayout>
  )
}
