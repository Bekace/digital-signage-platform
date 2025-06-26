"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Settings,
  Plus,
  GripVertical,
  Trash2,
  Play,
  Clock,
  HardDrive,
  Hash,
  Search,
  ImageIcon,
  Video,
  FileText,
  File,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PlaylistOptionsDialog } from "@/components/playlist-options-dialog"
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

interface Playlist {
  id: number
  name: string
  description: string
  status: string
  item_count: number
  total_duration: number
  scale_image: string
  scale_video: string
  scale_document: string
  shuffle: boolean
  default_transition: string
  transition_speed: string
  auto_advance: boolean
  background_color: string
  text_overlay: boolean
}

interface PlaylistItem {
  id: number
  playlist_id: number
  media_id: number
  position: number
  duration: number
  created_at: string
  media: {
    id: number
    filename: string
    original_filename: string
    file_type: string
    file_size: number
    url: string
    thumbnail_url?: string
  }
}

interface MediaFile {
  id: number
  filename: string
  original_filename: string
  file_type: string
  file_size: number
  url: string
  thumbnail_url?: string
  created_at: string
}

function SortablePlaylistItem({ item, onRemove }: { item: PlaylistItem; onRemove: (id: number) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <ImageIcon className="h-4 w-4 text-blue-500" />
    if (fileType.startsWith("video/")) return <Video className="h-4 w-4 text-purple-500" />
    if (fileType.includes("pdf")) return <FileText className="h-4 w-4 text-red-500" />
    return <File className="h-4 w-4 text-gray-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab hover:cursor-grabbing text-gray-400 hover:text-gray-600"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      <div className="flex-shrink-0">
        {item.media.thumbnail_url ? (
          <img
            src={item.media.thumbnail_url || "/placeholder.svg"}
            alt={item.media.original_filename}
            className="w-12 h-12 object-cover rounded border"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = "none"
              target.nextElementSibling?.classList.remove("hidden")
            }}
          />
        ) : null}
        <div
          className={`w-12 h-12 bg-gray-100 rounded border flex items-center justify-center ${item.media.thumbnail_url ? "hidden" : ""}`}
        >
          {getFileIcon(item.media.file_type)}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{item.media.original_filename}</p>
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          <span>{formatFileSize(item.media.file_size)}</span>
          <span>{item.duration}s</span>
          <span className="capitalize">{item.media.file_type.split("/")[0]}</span>
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(item.id)}
        className="text-red-500 hover:text-red-700 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

function MediaLibraryItem({ media, onAdd }: { media: MediaFile; onAdd: (mediaId: number) => void }) {
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <ImageIcon className="h-4 w-4 text-blue-500" />
    if (fileType.startsWith("video/")) return <Video className="h-4 w-4 text-purple-500" />
    if (fileType.includes("pdf")) return <FileText className="h-4 w-4 text-red-500" />
    return <File className="h-4 w-4 text-gray-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div
      onClick={() => onAdd(media.id)}
      className="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm hover:bg-gray-50 cursor-pointer transition-all group"
    >
      <div className="flex-shrink-0 relative">
        {media.thumbnail_url ? (
          <img
            src={media.thumbnail_url || "/placeholder.svg"}
            alt={media.original_filename}
            className="w-12 h-12 object-cover rounded border"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = "none"
              target.nextElementSibling?.classList.remove("hidden")
            }}
          />
        ) : null}
        <div
          className={`w-12 h-12 bg-gray-100 rounded border flex items-center justify-center ${media.thumbnail_url ? "hidden" : ""}`}
        >
          {getFileIcon(media.file_type)}
        </div>
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Plus className="h-5 w-5 text-white" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{media.original_filename}</p>
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          <span>{formatFileSize(media.file_size)}</span>
          <span className="capitalize">{media.file_type.split("/")[0]}</span>
        </div>
      </div>
    </div>
  )
}

export default function PlaylistEditorPage({ params }: { params: { playlistId: string } }) {
  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [playlistItems, setPlaylistItems] = useState<PlaylistItem[]>([])
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [mediaLoading, setMediaLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showOptionsDialog, setShowOptionsDialog] = useState(false)
  const [removeItem, setRemoveItem] = useState<PlaylistItem | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const router = useRouter()
  const playlistId = Number.parseInt(params.playlistId)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  useEffect(() => {
    fetchPlaylistData()
    fetchMediaFiles()
  }, [playlistId])

  const fetchPlaylistData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch playlist details
      const playlistResponse = await fetch(`/api/playlists/${playlistId}`)
      const playlistData = await playlistResponse.json()

      if (!playlistResponse.ok) {
        throw new Error(playlistData.error || "Failed to fetch playlist")
      }

      setPlaylist(playlistData.playlist)

      // Fetch playlist items
      const itemsResponse = await fetch(`/api/playlists/${playlistId}/items`)
      const itemsData = await itemsResponse.json()

      if (!itemsResponse.ok) {
        throw new Error(itemsData.error || "Failed to fetch playlist items")
      }

      setPlaylistItems(itemsData.items || [])
    } catch (error) {
      console.error("Error fetching playlist data:", error)
      setError(error instanceof Error ? error.message : "Failed to load playlist")
      toast.error("Failed to load playlist")
    } finally {
      setLoading(false)
    }
  }

  const fetchMediaFiles = async () => {
    try {
      setMediaLoading(true)
      console.log("🎬 [PLAYLIST EDITOR] Fetching media files...")

      const response = await fetch("/api/media")
      const data = await response.json()

      console.log("🎬 [PLAYLIST EDITOR] Media API response:", data)

      if (response.ok) {
        // Try both 'media' and 'files' properties for compatibility
        const mediaArray = data.media || data.files || []
        console.log("🎬 [PLAYLIST EDITOR] Setting media files:", mediaArray)
        setMediaFiles(mediaArray)
      } else {
        console.error("🎬 [PLAYLIST EDITOR] Failed to fetch media:", data.error)
        toast.error("Failed to load media library")
      }
    } catch (error) {
      console.error("🎬 [PLAYLIST EDITOR] Error fetching media files:", error)
      toast.error("Failed to load media library")
    } finally {
      setMediaLoading(false)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = playlistItems.findIndex((item) => item.id === active.id)
      const newIndex = playlistItems.findIndex((item) => item.id === over.id)

      const newItems = arrayMove(playlistItems, oldIndex, newIndex)
      setPlaylistItems(newItems)

      // Update positions on server
      try {
        const response = await fetch(`/api/playlists/${playlistId}/items/reorder`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: newItems.map((item, index) => ({
              id: item.id,
              position: index + 1,
            })),
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to reorder items")
        }

        toast.success("Items reordered successfully")
      } catch (error) {
        console.error("Error reordering items:", error)
        toast.error("Failed to reorder items")
        // Revert the change
        fetchPlaylistData()
      }
    }
  }

  const handleAddMedia = async (mediaId: number) => {
    try {
      console.log("➕ [PLAYLIST EDITOR] Adding media to playlist:", mediaId)

      const response = await fetch(`/api/playlists/${playlistId}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          media_id: mediaId,
          duration: 30,
        }),
      })

      const responseData = await response.json()
      console.log("➕ [PLAYLIST EDITOR] Add media response:", responseData)

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to add media to playlist")
      }

      toast.success("Media added to playlist")
      fetchPlaylistData() // Refresh playlist data
    } catch (error) {
      console.error("Error adding media to playlist:", error)
      toast.error(error instanceof Error ? error.message : "Failed to add media")
    }
  }

  const handleRemoveItem = async (item: PlaylistItem) => {
    try {
      const response = await fetch(`/api/playlists/${playlistId}/items/${item.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to remove item")
      }

      setPlaylistItems((prev) => prev.filter((i) => i.id !== item.id))
      toast.success("Item removed from playlist")
      setRemoveItem(null)
    } catch (error) {
      console.error("Error removing item:", error)
      toast.error(error instanceof Error ? error.message : "Failed to remove item")
    }
  }

  const handleSaveOptions = async (options: any) => {
    try {
      const response = await fetch(`/api/playlists/${playlistId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(options),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save options")
      }

      const data = await response.json()
      setPlaylist(data.playlist)
      toast.success("Playlist options saved successfully")
    } catch (error) {
      console.error("Error saving options:", error)
      toast.error(error instanceof Error ? error.message : "Failed to save options")
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0.00 MB"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getTotalSize = () => {
    return playlistItems.reduce((total, item) => total + item.media.file_size, 0)
  }

  const getTotalDuration = () => {
    return playlistItems.reduce((total, item) => total + item.duration, 0)
  }

  const filteredMediaFiles = mediaFiles.filter((media) =>
    media.original_filename.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-10 w-10" />
            <div>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32 mt-2" />
            </div>
          </div>
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-8">
              <Skeleton className="h-96 w-full" />
            </div>
            <div className="col-span-4">
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !playlist) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Playlist Editor</h1>
              <p className="text-gray-600">Edit your playlist content</p>
            </div>
          </div>

          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{error || "Playlist Not Found"}</h3>
              <p className="text-gray-600 text-center mb-4">
                {error || "The playlist you're looking for doesn't exist or you don't have access to it."}
              </p>
              <div className="flex space-x-2">
                <Button onClick={fetchPlaylistData}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button variant="outline" onClick={() => router.back()}>
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
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
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{playlist.name}</h1>
              <p className="text-gray-600">Edit your playlist content</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => setShowOptionsDialog(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Badge variant="outline" className="capitalize">
              {playlist.status}
            </Badge>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total size</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatFileSize(getTotalSize())}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getTotalDuration()} sec</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium"># of items</CardTitle>
              <Hash className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{playlistItems.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{playlist.status}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-6">
          {/* Playlist Editor */}
          <div className="col-span-8">
            <Card>
              <CardHeader>
                <CardTitle>Playlist Content</CardTitle>
              </CardHeader>
              <CardContent>
                {playlistItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                      <Play className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Empty Playlist</h3>
                    <p className="text-gray-600 mb-4">
                      Click on media files from the Media Library on the right to add them to your playlist!
                    </p>
                  </div>
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext
                      items={playlistItems.map((item) => item.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-3">
                        {playlistItems.map((item) => (
                          <SortablePlaylistItem
                            key={item.id}
                            item={item}
                            onRemove={(id) => {
                              const itemToRemove = playlistItems.find((i) => i.id === id)
                              if (itemToRemove) setRemoveItem(itemToRemove)
                            }}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Media Library */}
          <div className="col-span-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Media Library</CardTitle>
                  <Button size="sm" variant="outline" onClick={fetchMediaFiles}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search media..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {mediaLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center space-x-3 p-3">
                        <Skeleton className="w-12 h-12 rounded" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredMediaFiles.length === 0 ? (
                      <div className="text-center py-8">
                        <File className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">
                          {searchQuery ? "No media files match your search" : "No media files found"}
                        </p>
                        <p className="text-xs text-gray-500">
                          Upload media files to your library to add them to playlists
                        </p>
                      </div>
                    ) : (
                      filteredMediaFiles.map((media) => (
                        <MediaLibraryItem key={media.id} media={media} onAdd={handleAddMedia} />
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Playlist Options Dialog */}
        {playlist && (
          <PlaylistOptionsDialog
            open={showOptionsDialog}
            onOpenChange={setShowOptionsDialog}
            options={{
              scale_image: playlist.scale_image,
              scale_video: playlist.scale_video,
              scale_document: playlist.scale_document,
              shuffle: playlist.shuffle,
              default_transition: playlist.default_transition,
              transition_speed: playlist.transition_speed,
              auto_advance: playlist.auto_advance,
              loop_playlist: playlist.auto_advance, // Using auto_advance as loop_playlist for now
              background_color: playlist.background_color,
              text_overlay: playlist.text_overlay,
            }}
            onSave={handleSaveOptions}
          />
        )}

        {/* Remove Item Dialog */}
        <AlertDialog open={!!removeItem} onOpenChange={() => setRemoveItem(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Item</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove "{removeItem?.media.original_filename}" from this playlist?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => removeItem && handleRemoveItem(removeItem)}
                className="bg-red-600 hover:bg-red-700"
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  )
}
