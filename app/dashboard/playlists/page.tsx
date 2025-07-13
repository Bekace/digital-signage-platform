"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Play, Trash2, Edit, Eye, Clock, Hash, Users, MoreHorizontal, Search } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CreatePlaylistDialog } from "@/components/create-playlist-dialog"
import { PlaylistPreviewModal } from "@/components/playlist-preview-modal"

interface Playlist {
  id: number
  name: string
  description: string
  status: string
  loop_enabled: boolean
  schedule_enabled: boolean
  start_time?: string
  end_time?: string
  selected_days: string[]
  item_count: number
  device_count: number
  total_duration: number
  assigned_devices: string[]
  created_at: string
  updated_at: string
}

interface PlaylistItem {
  id: number
  playlist_id: number
  media_id: number
  position: number
  duration?: number
  transition_type: string
  media?: {
    id: number
    filename: string
    original_name?: string
    original_filename?: string
    file_type: string
    file_size: number
    url: string
    thumbnail_url?: string
    mime_type?: string
    dimensions?: string
    duration?: number
    media_source?: string
    external_url?: string
  }
}

export default function PlaylistsPage() {
  const router = useRouter()
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [deletePlaylist, setDeletePlaylist] = useState<Playlist | null>(null)
  const [previewPlaylist, setPreviewPlaylist] = useState<Playlist | null>(null)
  const [previewItems, setPreviewItems] = useState<PlaylistItem[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)

  useEffect(() => {
    fetchPlaylists()
  }, [])

  const fetchPlaylists = async () => {
    try {
      setLoading(true)
      console.log("🎵 [PLAYLISTS PAGE] Fetching playlists...")

      const response = await fetch("/api/playlists")
      const data = await response.json()

      console.log("🎵 [PLAYLISTS PAGE] Response:", data)

      if (response.ok && data.success) {
        setPlaylists(data.playlists || [])
        console.log("🎵 [PLAYLISTS PAGE] Set playlists:", data.playlists?.length || 0)
      } else {
        console.error("🎵 [PLAYLISTS PAGE] Error:", data.error)
        toast.error(data.error || "Failed to fetch playlists")
      }
    } catch (error) {
      console.error("🎵 [PLAYLISTS PAGE] Fetch error:", error)
      toast.error("Failed to fetch playlists")
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePlaylist = async (playlist: Playlist) => {
    try {
      const response = await fetch(`/api/playlists/${playlist.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Playlist deleted successfully")
        setPlaylists((prev) => prev.filter((p) => p.id !== playlist.id))
        setDeletePlaylist(null)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Failed to delete playlist")
      }
    } catch (error) {
      console.error("Error deleting playlist:", error)
      toast.error("Failed to delete playlist")
    }
  }

  const handlePreviewPlaylist = async (playlist: Playlist) => {
    try {
      setPreviewLoading(true)
      console.log("👁️ [PLAYLISTS PAGE] Loading preview for playlist:", playlist.id)

      // Fetch playlist items for preview
      const response = await fetch(`/api/playlists/${playlist.id}/items`)
      const data = await response.json()

      if (response.ok && data.success) {
        setPreviewItems(data.items || [])
        setPreviewPlaylist(playlist)
        console.log("👁️ [PLAYLISTS PAGE] Preview items loaded:", data.items?.length || 0)
      } else {
        console.error("👁️ [PLAYLISTS PAGE] Error loading preview:", data.error)
        toast.error(data.error || "Failed to load playlist preview")
      }
    } catch (error) {
      console.error("👁️ [PLAYLISTS PAGE] Preview error:", error)
      toast.error("Failed to load playlist preview")
    } finally {
      setPreviewLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "draft":
        return "bg-gray-100 text-gray-800"
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredPlaylists = playlists.filter(
    (playlist) =>
      playlist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      playlist.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading playlists...</span>
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
            <p className="text-muted-foreground">Manage your media playlists and content scheduling</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Playlist
          </Button>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search playlists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <CardTitle className="text-sm font-medium">Active Playlists</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{playlists.filter((p) => p.status === "active").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Hash className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{playlists.reduce((sum, p) => sum + p.item_count, 0)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connected Devices</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{playlists.reduce((sum, p) => sum + p.device_count, 0)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Playlists Grid */}
        {filteredPlaylists.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Play className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? "No playlists found" : "No playlists yet"}
              </h3>
              <p className="text-gray-500 text-center mb-4">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "Create your first playlist to start organizing your media content"}
              </p>
              {!searchQuery && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Playlist
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlaylists.map((playlist) => (
              <Card key={playlist.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg line-clamp-1">{playlist.name}</CardTitle>
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
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/playlists/${playlist.id}`)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePreviewPlaylist(playlist)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeletePlaylist(playlist)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge className={getStatusColor(playlist.status)}>{playlist.status}</Badge>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Hash className="h-3 w-3" />
                        <span>{playlist.item_count}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDuration(playlist.total_duration)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span>{playlist.device_count}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Created {formatDate(playlist.created_at)}</span>
                    <span>Updated {formatDate(playlist.updated_at)}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/playlists/${playlist.id}`)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreviewPlaylist(playlist)}
                      disabled={previewLoading || playlist.item_count === 0}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Playlist Dialog */}
        <CreatePlaylistDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onPlaylistCreated={fetchPlaylists}
        />

        {/* Preview Modal */}
        {previewPlaylist && (
          <PlaylistPreviewModal
            open={!!previewPlaylist}
            onOpenChange={(open) => !open && setPreviewPlaylist(null)}
            playlist={{
              id: previewPlaylist.id,
              name: previewPlaylist.name,
              description: previewPlaylist.description,
              status: previewPlaylist.status,
              loop_enabled: previewPlaylist.loop_enabled,
              schedule_enabled: previewPlaylist.schedule_enabled,
              start_time: previewPlaylist.start_time,
              end_time: previewPlaylist.end_time,
              selected_days: previewPlaylist.selected_days,
              scale_image: "fit",
              scale_video: "fit",
              scale_document: "fit",
              shuffle: false,
              default_transition: "fade",
              transition_speed: "normal",
              auto_advance: true,
              background_color: "#000000",
              text_overlay: false,
            }}
            items={previewItems}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletePlaylist} onOpenChange={() => setDeletePlaylist(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Playlist</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deletePlaylist?.name}"? This action cannot be undone and will remove
                all playlist items.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deletePlaylist && handleDeletePlaylist(deletePlaylist)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  )
}
