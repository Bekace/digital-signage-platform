"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Play,
  Settings,
  Plus,
  GripVertical,
  Trash2,
  Clock,
  FileText,
  RefreshCw,
  Search,
  Loader2,
} from "lucide-react"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PlaylistOptionsDialog } from "@/components/playlist-options-dialog"
import { MediaThumbnail } from "@/components/media-thumbnail"

interface MediaFile {
  id: number
  filename: string
  original_filename: string
  file_type: string
  file_size: number
  url: string
  thumbnail_url?: string
  created_at: string
  mime_type?: string
  dimensions?: string
  duration?: number
}

interface PlaylistItem {
  id: number
  playlist_id: number
  media_id: number
  position: number
  duration?: number
  transition_type: string
  media_file: MediaFile
}

interface Playlist {
  id: number
  name: string
  description?: string
  status: string
  created_at: string
  updated_at: string
  // Playlist options
  scale_image?: string
  scale_video?: string
  scale_document?: string
  shuffle?: boolean
  default_transition?: string
  transition_speed?: string
  auto_advance?: boolean
  background_color?: string
  text_overlay?: boolean
  loop_enabled?: boolean
  schedule_enabled?: boolean
  start_time?: string
  end_time?: string
  selected_days?: string[]
}

function SortablePlaylistItem({ item, onRemove }: { item: PlaylistItem; onRemove: (id: number) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id.toString(),
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div ref={setNodeRef} style={style} className="touch-none">
      <Card className="mb-3">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
              <GripVertical className="h-5 w-5 text-gray-400" />
            </div>

            <MediaThumbnail file={item.media_file} size="md" />

            <div className="flex-1 min-w-0">
              <h4 className="font-medium truncate">{item.media_file.original_filename}</h4>
              <div className="flex items-center space-x-4 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {item.media_file.file_type}
                </Badge>
                <span className="text-sm text-gray-500">{formatFileSize(item.media_file.file_size)}</span>
                {item.duration && (
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {item.duration}s
                  </div>
                )}
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(item.id)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PlaylistEditorPage() {
  const params = useParams()
  const router = useRouter()
  const playlistId = params.playlistId as string

  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [playlistItems, setPlaylistItems] = useState<PlaylistItem[]>([])
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [mediaLoading, setMediaLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mediaError, setMediaError] = useState<string | null>(null)
  const [showOptions, setShowOptions] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  useEffect(() => {
    if (playlistId) {
      fetchPlaylistData()
      fetchMediaFiles()
    }
  }, [playlistId])

  const fetchPlaylistData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("🎵 [PLAYLIST EDITOR] Fetching playlist data for ID:", playlistId)

      // Fetch playlist details
      const playlistResponse = await fetch(`/api/playlists/${playlistId}`)
      const playlistData = await playlistResponse.json()

      console.log("📋 [PLAYLIST EDITOR] Playlist response:", playlistData)

      if (!playlistResponse.ok) {
        throw new Error(playlistData.error || "Failed to fetch playlist")
      }

      setPlaylist(playlistData.playlist)

      // Fetch playlist items
      const itemsResponse = await fetch(`/api/playlists/${playlistId}/items`)
      const itemsData = await itemsResponse.json()

      console.log("📝 [PLAYLIST EDITOR] Items response:", itemsData)

      if (itemsResponse.ok) {
        setPlaylistItems(itemsData.items || [])
      } else {
        console.error("Failed to fetch playlist items:", itemsData.error)
        setPlaylistItems([])
      }
    } catch (error) {
      console.error("❌ [PLAYLIST EDITOR] Error:", error)
      setError(error instanceof Error ? error.message : "Failed to load playlist")
    } finally {
      setLoading(false)
    }
  }

  const fetchMediaFiles = async () => {
    try {
      setMediaLoading(true)
      setMediaError(null)

      console.log("📁 [PLAYLIST EDITOR] Fetching media files...")

      const response = await fetch("/api/media")
      const data = await response.json()

      console.log("📁 [PLAYLIST EDITOR] Media response:", data)

      if (response.ok) {
        // Use 'media' property for playlist editor, fallback to 'files'
        setMediaFiles(data.media || data.files || [])
      } else {
        setMediaError(data.error || "Failed to load media files")
      }
    } catch (error) {
      console.error("❌ [PLAYLIST EDITOR] Media error:", error)
      setMediaError("Failed to load media files")
    } finally {
      setMediaLoading(false)
    }
  }

  const handleDragEnd = async (event: any) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = playlistItems.findIndex((item) => item.id.toString() === active.id)
    const newIndex = playlistItems.findIndex((item) => item.id.toString() === over.id)

    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    const newItems = arrayMove(playlistItems, oldIndex, newIndex)
    setPlaylistItems(newItems)

    // Update positions on server
    try {
      const updates = newItems.map((item, index) => ({
        id: item.id,
        position: index,
      }))

      const response = await fetch(`/api/playlists/${playlistId}/items/reorder`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items: updates }),
      })

      if (!response.ok) {
        throw new Error("Failed to update item positions")
      }

      toast.success("Playlist order updated")
    } catch (error) {
      console.error("Error updating playlist order:", error)
      toast.error("Failed to update playlist order")
      // Revert the change
      fetchPlaylistData()
    }
  }

  const addMediaToPlaylist = async (mediaFile: MediaFile) => {
    try {
      const response = await fetch(`/api/playlists/${playlistId}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          media_id: mediaFile.id,
          position: playlistItems.length,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setPlaylistItems((prev) => [...prev, data.item])
        toast.success(`Added "${mediaFile.original_filename}" to playlist`)
      } else {
        toast.error(data.error || "Failed to add media to playlist")
      }
    } catch (error) {
      console.error("Error adding media to playlist:", error)
      toast.error("Failed to add media to playlist")
    }
  }

  const removeFromPlaylist = async (itemId: number) => {
    try {
      const response = await fetch(`/api/playlists/${playlistId}/items/${itemId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setPlaylistItems((prev) => prev.filter((item) => item.id !== itemId))
        toast.success("Item removed from playlist")
      } else {
        toast.error("Failed to remove item from playlist")
      }
    } catch (error) {
      console.error("Error removing item from playlist:", error)
      toast.error("Failed to remove item from playlist")
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const filteredMediaFiles = mediaFiles.filter((file) =>
    file.original_filename.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading playlist...</span>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => router.push("/dashboard/playlists")} variant="outline">
            Back to Playlists
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  if (!playlist) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">Playlist not found</p>
          <Button onClick={() => router.push("/dashboard/playlists")} variant="outline">
            Back to Playlists
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/playlists")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{playlist.name}</h1>
              <p className="text-gray-600">{playlist.description || "No description"}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={playlist.status === "active" ? "default" : "secondary"}>{playlist.status}</Badge>
            <Button variant="outline" size="sm">
              <Play className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowOptions(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Playlist Items */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Playlist Items ({playlistItems.length})</span>
                  <Button variant="outline" size="sm" onClick={fetchPlaylistData}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {playlistItems.length === 0 ? (
                  <div className="text-center py-8">
                    <Plus className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No items in playlist</h3>
                    <p className="text-gray-500">Add media files from the library to get started.</p>
                  </div>
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext
                      items={playlistItems.map((item) => item.id.toString())}
                      strategy={verticalListSortingStrategy}
                    >
                      {playlistItems.map((item) => (
                        <SortablePlaylistItem key={item.id} item={item} onRemove={removeFromPlaylist} />
                      ))}
                    </SortableContext>
                  </DndContext>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Media Library */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Media Library</span>
                  <Button variant="outline" size="sm" onClick={fetchMediaFiles}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search media..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent className="max-h-[600px] overflow-y-auto">
                {mediaLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading media...</span>
                  </div>
                ) : mediaError ? (
                  <div className="text-center py-8">
                    <p className="text-red-600 mb-2">{mediaError}</p>
                    <Button variant="outline" size="sm" onClick={fetchMediaFiles}>
                      Try Again
                    </Button>
                  </div>
                ) : filteredMediaFiles.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">
                      {searchTerm ? "No media files match your search." : "No media files available."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredMediaFiles.map((file) => (
                      <Card key={file.id} className="cursor-pointer hover:shadow-sm transition-shadow">
                        <CardContent className="p-3" onClick={() => addMediaToPlaylist(file)}>
                          <div className="flex items-center space-x-3">
                            <MediaThumbnail file={file} size="sm" />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm truncate">{file.original_filename}</h4>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {file.file_type}
                                </Badge>
                                <span className="text-xs text-gray-500">{formatFileSize(file.file_size)}</span>
                              </div>
                            </div>
                            <Plus className="h-4 w-4 text-gray-400" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Playlist Options Dialog */}
        {playlist && (
          <PlaylistOptionsDialog
            open={showOptions}
            onOpenChange={setShowOptions}
            playlist={playlist}
            onUpdate={(updatedPlaylist) => {
              setPlaylist(updatedPlaylist)
              setShowOptions(false)
            }}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
