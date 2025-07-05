"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CreatePlaylistDialog } from "@/components/create-playlist-dialog"
import { EditPlaylistDialog } from "@/components/edit-playlist-dialog"
import { PreviewPlaylistDialog } from "@/components/preview-playlist-dialog"
import { DeletePlaylistDialog } from "@/components/delete-playlist-dialog"
import { PublishPlaylistDialog } from "@/components/publish-playlist-dialog"
import { useToast } from "@/hooks/use-toast"
import { Plus, Search, MoreVertical, Edit, Eye, Copy, Trash2, Play, Pause, Clock, List } from "lucide-react"

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
  const [searchQuery, setSearchQuery] = useState("")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchPlaylists()
  }, [])

  const fetchPlaylists = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/playlists")
      if (response.ok) {
        const data = await response.json()
        setPlaylists(data.playlists || [])
      } else {
        // Mock data fallback
        setPlaylists([
          {
            id: 1,
            name: "Morning Announcements",
            description: "Daily morning content for lobby displays",
            status: "active",
            created_at: "2024-01-15T08:00:00Z",
            updated_at: "2024-01-15T08:00:00Z",
            item_count: 5,
          },
          {
            id: 2,
            name: "Product Showcase",
            description: "Latest product highlights and features",
            status: "draft",
            created_at: "2024-01-14T10:30:00Z",
            updated_at: "2024-01-14T10:30:00Z",
            item_count: 3,
          },
          {
            id: 3,
            name: "Emergency Alerts",
            description: "Important safety and emergency information",
            status: "active",
            created_at: "2024-01-13T14:15:00Z",
            updated_at: "2024-01-13T14:15:00Z",
            item_count: 2,
          },
          {
            id: 4,
            name: "Company Events",
            description: "Upcoming events and celebrations",
            status: "draft",
            created_at: "2024-01-12T16:45:00Z",
            updated_at: "2024-01-12T16:45:00Z",
            item_count: 0,
          },
        ])
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

  const filteredPlaylists = playlists.filter(
    (playlist) =>
      playlist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      playlist.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

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
      toast({
        title: "Error",
        description: "Failed to duplicate playlist",
        variant: "destructive",
      })
    }
  }

  const handlePublishToggle = (playlist: Playlist) => {
    setSelectedPlaylist(playlist)
    setPublishDialogOpen(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Playlists</h1>
            <p className="text-gray-600">Manage your content playlists and media sequences</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Playlist
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search playlists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <List className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Playlists</p>
                  <p className="text-2xl font-bold">{playlists.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Play className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Published</p>
                  <p className="text-2xl font-bold">{playlists.filter((p) => p.status === "active").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Pause className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Drafts</p>
                  <p className="text-2xl font-bold">{playlists.filter((p) => p.status === "draft").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Items</p>
                  <p className="text-2xl font-bold">{playlists.reduce((sum, p) => sum + (p.item_count || 0), 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Playlists Grid */}
        {loading ? (
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
        ) : filteredPlaylists.length === 0 ? (
          <Card className="p-12 text-center">
            <List className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {searchQuery ? "No playlists found" : "No playlists yet"}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery ? "Try adjusting your search terms" : "Create your first playlist to get started"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Playlist
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlaylists.map((playlist) => (
              <Card key={playlist.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{playlist.name}</CardTitle>
                      <CardDescription className="mt-1">{playlist.description || "No description"}</CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(playlist)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePreview(playlist)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(playlist)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handlePublishToggle(playlist)}>
                          {playlist.status === "active" ? (
                            <>
                              <Pause className="mr-2 h-4 w-4" />
                              Unpublish
                            </>
                          ) : (
                            <>
                              <Play className="mr-2 h-4 w-4" />
                              Publish
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDelete(playlist)} className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
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
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Created {formatDate(playlist.created_at)}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handlePreview(playlist)}>
                        <Eye className="h-3 w-3 mr-1" />
                        Preview
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(playlist)}>
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
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

      <PreviewPlaylistDialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen} playlist={selectedPlaylist} />

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
        onPlaylistUpdated={fetchPlaylists}
      />
    </DashboardLayout>
  )
}
