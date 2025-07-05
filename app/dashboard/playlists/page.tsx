"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CreatePlaylistDialog } from "@/components/create-playlist-dialog"
import { EditPlaylistDialog } from "@/components/edit-playlist-dialog"
import { PreviewPlaylistDialog } from "@/components/preview-playlist-dialog"
import { DeletePlaylistDialog } from "@/components/delete-playlist-dialog"
import { PublishPlaylistDialog } from "@/components/publish-playlist-dialog"
import { useToast } from "@/hooks/use-toast"
import { Plus, Search, MoreHorizontal, Play, Edit, Trash2, Copy, Eye, Clock, FileText, Settings } from "lucide-react"

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
  const router = useRouter()
  const { toast } = useToast()
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showPublishDialog, setShowPublishDialog] = useState(false)
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null)

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

        // Redirect to first playlist's edit page if playlists exist
        if (playlistsData.length > 0) {
          router.push(`/dashboard/playlists/${playlistsData[0].id}/edit`)
          return
        }
      } else {
        // Fallback to mock data
        const mockPlaylists = [
          {
            id: 1,
            name: "New Playlist",
            description: "Sample playlist for demonstration",
            status: "draft",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            item_count: 2,
          },
          {
            id: 2,
            name: "Simple Playlist",
            description: "Another sample playlist",
            status: "active",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            item_count: 5,
          },
        ]
        setPlaylists(mockPlaylists)

        // Redirect to first playlist's edit page
        router.push(`/dashboard/playlists/${mockPlaylists[0].id}/edit`)
        return
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

  const handleCreatePlaylist = () => {
    setShowCreateDialog(true)
  }

  const handleEdit = (playlist: Playlist) => {
    setSelectedPlaylist(playlist)
    setShowEditDialog(true)
  }

  const handleEditContent = (playlist: Playlist) => {
    router.push(`/dashboard/playlists/${playlist.id}/edit`)
  }

  const handlePreview = (playlist: Playlist) => {
    setSelectedPlaylist(playlist)
    setShowPreviewDialog(true)
  }

  const handleDelete = (playlist: Playlist) => {
    setSelectedPlaylist(playlist)
    setShowDeleteDialog(true)
  }

  const handleDuplicate = async (playlist: Playlist) => {
    try {
      const response = await fetch(`/api/playlists/${playlist.id}/duplicate`, {
        method: "POST",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Duplicated "${playlist.name}"`,
        })
        fetchPlaylists()
      } else {
        throw new Error("Failed to duplicate playlist")
      }
    } catch (error) {
      console.error("Failed to duplicate playlist:", error)
      toast({
        title: "Error",
        description: "Failed to duplicate playlist",
        variant: "destructive",
      })
    }
  }

  const handlePublish = (playlist: Playlist) => {
    setSelectedPlaylist(playlist)
    setShowPublishDialog(true)
  }

  const filteredPlaylists = playlists.filter((playlist) =>
    playlist.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const stats = {
    total: playlists.length,
    published: playlists.filter((p) => p.status === "active").length,
    drafts: playlists.filter((p) => p.status === "draft").length,
    totalItems: playlists.reduce((sum, p) => sum + (p.item_count || 0), 0),
  }

  // Show loading state while fetching
  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading playlists...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Playlists</h1>
            <p className="text-gray-600">Manage your digital signage playlists</p>
          </div>
          <Button onClick={handleCreatePlaylist}>
            <Plus className="h-4 w-4 mr-2" />
            Create Playlist
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Playlists</CardTitle>
              <FileText className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Published</CardTitle>
              <Play className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.published}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Drafts</CardTitle>
              <Edit className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.drafts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalItems}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search playlists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Empty State */}
        {playlists.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No playlists yet</h3>
            <p className="text-gray-500 mb-4">Create your first playlist to get started</p>
            <Button onClick={handleCreatePlaylist}>
              <Plus className="h-4 w-4 mr-2" />
              Create Playlist
            </Button>
          </div>
        ) : (
          /* Playlists Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlaylists.map((playlist) => (
              <Card key={playlist.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{playlist.name}</CardTitle>
                      <CardDescription className="mt-1">{playlist.description || "No description"}</CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditContent(playlist)}>
                          <Settings className="h-4 w-4 mr-2" />
                          Edit Content
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(playlist)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePreview(playlist)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(playlist)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePublish(playlist)}>
                          <Play className="h-4 w-4 mr-2" />
                          {playlist.status === "active" ? "Unpublish" : "Publish"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(playlist)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-4">
                      <span>{playlist.item_count || 0} items</span>
                      <Badge variant={playlist.status === "active" ? "default" : "secondary"}>
                        {playlist.status === "active" ? "Published" : "Draft"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" onClick={() => handlePreview(playlist)} className="flex-1">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button size="sm" onClick={() => handleEditContent(playlist)} className="flex-1">
                      <Settings className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreatePlaylistDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onPlaylistCreated={fetchPlaylists}
      />

      <EditPlaylistDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        playlist={selectedPlaylist}
        onPlaylistUpdated={fetchPlaylists}
      />

      <PreviewPlaylistDialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog} playlist={selectedPlaylist} />

      <DeletePlaylistDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        playlist={selectedPlaylist}
        onPlaylistDeleted={fetchPlaylists}
      />

      <PublishPlaylistDialog
        open={showPublishDialog}
        onOpenChange={setShowPublishDialog}
        playlist={selectedPlaylist}
        onPlaylistUpdated={fetchPlaylists}
      />
    </DashboardLayout>
  )
}
