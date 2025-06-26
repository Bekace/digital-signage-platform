"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Settings,
  Plus,
  Trash2,
  GripVertical,
  RefreshCw,
  Clock,
  ImageIcon,
  Video,
  FileText,
  Music,
  Presentation,
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
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PlaylistOptionsDialog } from "@/components/playlist-options-dialog"
import { MediaThumbnail } from "@/components/media-thumbnail"

interface MediaFile {
  id: number
  filename: string
  original_filename?: string
  original_name?: string
  file_type: string
  file_size: number
  url: string
  thumbnail_url?: string
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
  media_file?: MediaFile
}

interface Playlist {
  id: number
  name: string
  description?: string
  status: string
  loop_enabled: boolean
  schedule_enabled: boolean
  start_time?: string
  end_time?: string
  selected_days: string[]
  scale_image: string
  scale_video: string
  scale_document: string
  shuffle: boolean
  default_transition: string
  transition_speed: string
  auto_advance: boolean
  background_color: string
  text_overlay: boolean
  created_at: string
  updated_at: string
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

  const getFileIcon = () => {
    if (!item.media_file) return <FileText className="h-4 w-4" />

    const isImage = item.media_file.mime_type?.startsWith("image/") || item.media_file.file_type === "image"
    const isVideo = item.media_file.mime_type?.startsWith("video/") || item.media_file.file_type === "video"
    const isAudio = item.media_file.mime_type?.startsWith("audio/")
    const isPresentation = item.media_file.file_type === "presentation"

    if (isVideo) return <Video className="h-4 w-4" />
    if (isAudio) return <Music className="h-4 w-4" />
    if (isPresentation) return <Presentation className="h-4 w-4" />
    if (isImage) return <ImageIcon className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div ref={setNodeRef} style={style} className="mb-2">
      <Card className="group hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>

            <div className="w-12 h-12 flex-shrink-0">
              {item.media_file && (
                <MediaThumbnail
                  file={{
                    ...item.media_file,
                    original_filename: item.media_file.original_name || item.media_file.filename,
                  }}
                  size="sm"
                />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">
                {item.media_file?.original_name || item.media_file?.filename || `Media ${item.media_id}`}
              </h4>
              <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                <div className="flex items-center space-x-1">
                  {getFileIcon()}
                  <span className="capitalize">{item.media_file?.file_type || "Unknown"}</span>
                </div>
                {item.media_file?.file_size && <span>{formatFileSize(item.media_file.file_size)}</span>}
                {item.duration && (
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{item.duration}s</span>
                  </div>
                )}
              </div>
            </div>

            <Badge variant="outline" className="text-xs">
              {item.transition_type}
            </Badge>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(item.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
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
  const [searchQuery, setSearchQuery] = useState("")
  const [showSettings, setShowSettings] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentItemIndex, setCurrentItemIndex] = useState(0)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  useEffect(() => {
    if (playlistId) {
      fetchPlaylist()
      fetchPlaylistItems()
      fetchMediaFiles()
    }
  }, [playlistId])

  const fetchPlaylist = async () => {
    try {
      const response = await fetch(`/api/playlists/${playlistId}`)
      const data = await response.json()

      if (response.ok) {
        setPlaylist(data.playlist)
      } else {
        setError(data.error || "Failed to load playlist")
      }
    } catch (err) {
      setError("Failed to load playlist")
      console.error("Error fetching playlist:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchPlaylistItems = async () => {
    try {
      const response = await fetch(`/api/playlists/${playlistId}/items`)
      const data = await response.json()

      if (response.ok) {
        setPlaylistItems(data.items || [])
      } else {
        console.error("Failed to load playlist items:", data.error)
      }
    } catch (err) {
      console.error("Error fetching playlist items:", err)
    }
  }

  const fetchMediaFiles = async () => {
    try {
      setMediaLoading(true)
      setMediaError(null)
      console.log("Fetching media files...")

      const response = await fetch("/api/media")
      const data = await response.json()

      console.log("Media API response:", data)

      if (response.ok) {
        // Use 'media' property for playlist editor compatibility
        const files = data.media || data.files || []
        console.log("Setting media files:", files)
        setMediaFiles(files)
      } else {
        const errorMsg = data.error || "Failed to load media files"
        setMediaError(errorMsg)
        console.error("Media API error:", errorMsg)
      }
    } catch (err) {
      const errorMsg = "Failed to load media files"
      setMediaError(errorMsg)
      console.error("Error fetching media files:", err)
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
      const response = await fetch(`/api/playlists/${playlistId}/items/reorder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: newItems.map((item, index) => ({
            id: item.id,
            position: index,
          })),
        }),
      })

      if (!response.ok) {
        // Revert on error
        setPlaylistItems(playlistItems)
        toast.error("Failed to reorder items")
      } else {
        toast.success("Playlist order updated")
      }
    } catch (error) {
      // Revert on error
      setPlaylistItems(playlistItems)
      toast.error("Failed to reorder items")
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
          duration: 10, // Default duration
          transition_type: "fade",
        }),
      })

      const data = await response.json()

      if (response.ok) {
        await fetchPlaylistItems() // Refresh the items
        toast.success(`Added "${mediaFile.original_name || mediaFile.filename}" to playlist`)
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
        toast.error("Failed to remove item")
      }
    } catch (error) {
      console.error("Error removing item:", error)
      toast.error("Failed to remove item")
    }
  }

  const filteredMediaFiles = mediaFiles.filter((file) => {
    const fileName = file.original_name || file.filename || ""
    return fileName.toLowerCase().includes(searchQuery.toLowerCase())
  })

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading playlist...</span>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !playlist) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error || "Playlist not found"}</p>
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
            <Button variant="outline" onClick={() => setShowSettings(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant={isPlaying ? "secondary" : "default"} onClick={() => setIsPlaying(!isPlaying)}>
              {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {isPlaying ? "Pause" : "Preview"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Playlist Items */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Playlist Items ({playlistItems.length})</span>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentItemIndex(Math.max(0, currentItemIndex - 1))}
                    >
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentItemIndex(Math.min(playlistItems.length - 1, currentItemIndex + 1))}
                    >
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  </div>
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
                      <div className="space-y-2">
                        {playlistItems.map((item) => (
                          <SortablePlaylistItem key={item.id} item={item} onRemove={removeFromPlaylist} />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Media Library */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Media Library</span>
                  <Button variant="ghost" size="sm" onClick={fetchMediaFiles}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Search media..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Separator />
                <ScrollArea className="h-96">
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
                      <p className="text-gray-500 text-sm">
                        {searchQuery ? "No media files match your search." : "No media files available."}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredMediaFiles.map((file) => (
                        <Card
                          key={file.id}
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => addMediaToPlaylist(file)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center space-x-3">
                              <MediaThumbnail
                                file={{
                                  ...file,
                                  original_filename: file.original_name || file.filename,
                                }}
                                size="sm"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">
                                  {file.original_name || file.filename || "Untitled"}
                                </h4>
                                <p className="text-xs text-gray-500 capitalize">{file.file_type || "Unknown"}</p>
                              </div>
                              <Plus className="h-4 w-4 text-gray-400" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Playlist Settings Dialog */}
        {showSettings && (
          <PlaylistOptionsDialog
            playlist={playlist}
            open={showSettings}
            onOpenChange={setShowSettings}
            onSave={(updatedPlaylist) => {
              setPlaylist(updatedPlaylist)
              setShowSettings(false)
              toast.success("Playlist settings updated")
            }}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
