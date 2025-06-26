"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Plus, Trash2, GripVertical, ImageIcon, Video, FileText, File } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { PlaylistOptionsDialog } from "@/components/playlist-options-dialog"
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

interface MediaFile {
  id: number
  filename: string
  original_name: string
  file_type: string
  file_size: number
  mime_type: string
  url: string
  thumbnail_url?: string
}

interface PlaylistItem {
  id: number
  position: number
  duration: number
  media_id: number
  filename: string
  original_name: string
  file_type: string
  file_size: number
  mime_type: string
  url: string
  thumbnail_url?: string
}

interface Playlist {
  id: number
  name: string
  description?: string
  item_count: number
  total_size: number
  total_duration: number
  settings?: any
}

function SortablePlaylistItem({ item, onRemove }: { item: PlaylistItem; onRemove: (id: number) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const getFileIcon = (fileType: string, mimeType: string) => {
    if (mimeType.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
    if (mimeType.startsWith("video/")) return <Video className="h-4 w-4" />
    if (mimeType === "application/pdf") return <FileText className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-white border rounded-lg hover:shadow-sm transition-shadow"
    >
      <button
        className="cursor-grab hover:cursor-grabbing text-gray-400 hover:text-gray-600"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {item.thumbnail_url ? (
        <img
          src={item.thumbnail_url || "/placeholder.svg"}
          alt={item.original_name}
          className="w-12 h-12 object-cover rounded border"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.style.display = "none"
            target.nextElementSibling?.classList.remove("hidden")
          }}
        />
      ) : null}

      <div
        className={`w-12 h-12 bg-gray-100 rounded border flex items-center justify-center ${item.thumbnail_url ? "hidden" : ""}`}
      >
        {getFileIcon(item.file_type, item.mime_type)}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{item.original_name}</p>
        <p className="text-xs text-gray-500">
          {formatFileSize(item.file_size)} • {item.duration}s
        </p>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(item.id)}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

function MediaLibraryItem({ media, onAdd }: { media: MediaFile; onAdd: (mediaId: number) => void }) {
  const getFileIcon = (fileType: string, mimeType: string) => {
    if (mimeType.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
    if (mimeType.startsWith("video/")) return <Video className="h-4 w-4" />
    if (mimeType === "application/pdf") return <FileText className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  return (
    <div
      onClick={() => onAdd(media.id)}
      className="flex items-center gap-3 p-3 bg-white border rounded-lg hover:shadow-sm hover:bg-gray-50 cursor-pointer transition-all group"
    >
      <div className="relative">
        {media.thumbnail_url ? (
          <img
            src={media.thumbnail_url || "/placeholder.svg"}
            alt={media.original_name}
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
          {getFileIcon(media.file_type, media.mime_type)}
        </div>

        <div className="absolute inset-0 bg-black bg-opacity-50 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Plus className="h-5 w-5 text-white" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{media.original_name}</p>
        <p className="text-xs text-gray-500">{formatFileSize(media.file_size)}</p>
      </div>
    </div>
  )
}

export default function PlaylistEditor() {
  const params = useParams()
  const router = useRouter()
  const playlistId = params.playlistId as string

  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [items, setItems] = useState<PlaylistItem[]>([])
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)

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
      const [playlistRes, itemsRes] = await Promise.all([
        fetch(`/api/playlists/${playlistId}`),
        fetch(`/api/playlists/${playlistId}/items`),
      ])

      if (!playlistRes.ok) {
        throw new Error("Failed to fetch playlist")
      }

      const playlistData = await playlistRes.json()
      const itemsData = await itemsRes.json()

      setPlaylist(playlistData.playlist)
      setItems(itemsData.items || [])
    } catch (error) {
      console.error("Error fetching playlist data:", error)
      toast.error("Failed to load playlist")
    }
  }

  const fetchMediaFiles = async () => {
    try {
      const response = await fetch("/api/media")
      if (!response.ok) {
        throw new Error("Failed to fetch media files")
      }

      const data = await response.json()
      setMediaFiles(data.files || [])
    } catch (error) {
      console.error("Error fetching media files:", error)
      toast.error("Failed to load media library")
    } finally {
      setLoading(false)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over.id)

      const newItems = arrayMove(items, oldIndex, newIndex)
      setItems(newItems)

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

  const addMediaToPlaylist = async (mediaId: number) => {
    try {
      const response = await fetch(`/api/playlists/${playlistId}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mediaId,
          duration: 10, // Default duration
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to add media to playlist")
      }

      toast.success("Media added to playlist")
      fetchPlaylistData() // Refresh playlist data
    } catch (error) {
      console.error("Error adding media to playlist:", error)
      toast.error("Failed to add media to playlist")
    }
  }

  const removeItemFromPlaylist = async (itemId: number) => {
    try {
      const response = await fetch(`/api/playlists/${playlistId}/items/${itemId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to remove item from playlist")
      }

      toast.success("Item removed from playlist")
      fetchPlaylistData() // Refresh playlist data
    } catch (error) {
      console.error("Error removing item from playlist:", error)
      toast.error("Failed to remove item from playlist")
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0.00 MB"
    const mb = bytes / (1024 * 1024)
    return mb.toFixed(2) + " MB"
  }

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return "0 sec"
    if (seconds < 60) return `${seconds} sec`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading playlist...</p>
        </div>
      </div>
    )
  }

  if (!playlist) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">Playlist Not Found</p>
          <p className="text-sm text-gray-600 mt-1">The playlist you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/dashboard/playlists")} className="mt-4">
            Back to Playlists
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/playlists")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{playlist.name}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
              <span>Total size: {formatFileSize(playlist.total_size)}</span>
              <span>Total time: {formatDuration(playlist.total_duration)}</span>
              <span># of items: {playlist.item_count}</span>
            </div>
          </div>
        </div>
        <PlaylistOptionsDialog
          playlistId={playlistId}
          initialOptions={playlist.settings}
          onSave={() => fetchPlaylistData()}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Playlist Editor */}
        <div className="flex-1 p-6">
          <Card className="h-full">
            <CardContent className="p-6 h-full">
              {items.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <p className="text-lg font-medium">
                      Drag and Drop asset from the right or playlist from the left to here!
                    </p>
                    <p className="text-sm mt-2">Your playlist is empty. Add some media files to get started.</p>
                  </div>
                </div>
              ) : (
                <div className="h-full overflow-auto">
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        {items.map((item) => (
                          <SortablePlaylistItem key={item.id} item={item} onRemove={removeItemFromPlaylist} />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Media Library Sidebar */}
        <div className="w-80 bg-white border-l p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Media Library</h2>
            <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
              <Plus className="h-4 w-4 mr-2" />
              New
            </Button>
          </div>

          <div className="space-y-2 overflow-auto max-h-[calc(100vh-200px)]">
            {mediaFiles.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p className="text-sm">No media files found</p>
                <p className="text-xs mt-1">Upload some files to get started</p>
              </div>
            ) : (
              mediaFiles.map((media) => <MediaLibraryItem key={media.id} media={media} onAdd={addMediaToPlaylist} />)
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
