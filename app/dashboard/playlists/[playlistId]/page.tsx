"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Save,
  Settings,
  Clock,
  HardDrive,
  Hash,
  Plus,
  Trash2,
  GripVertical,
  ImageIcon,
  Video,
  FileText,
} from "lucide-react"
import { toast } from "sonner"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"

interface MediaFile {
  id: number
  filename: string
  original_name: string
  file_type: string
  file_size: number
  mime_type: string
  url: string
  thumbnail_url?: string
  duration?: number
  dimensions?: string
}

interface PlaylistItem {
  id: number
  playlist_id: number
  media_file_id: number
  position: number
  duration?: number
  transition_type: string
  media: MediaFile
}

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
  created_at: string
  updated_at: string
}

function SortablePlaylistItem({ item, onRemove }: { item: PlaylistItem; onRemove: (id: number) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
    if (fileType.startsWith("video/")) return <Video className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div ref={setNodeRef} style={style} className="mb-2">
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>

            <div className="flex-shrink-0">
              {item.media.thumbnail_url ? (
                <img
                  src={item.media.thumbnail_url || "/placeholder.svg"}
                  alt={item.media.original_name}
                  className="w-12 h-12 object-cover rounded"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                  {getFileIcon(item.media.mime_type)}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium truncate">{item.media.original_name}</h4>
              <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                <span>{formatFileSize(item.media.file_size)}</span>
                <span>{formatDuration(item.duration || item.media.duration)}</span>
                <Badge variant="outline" className="text-xs">
                  {item.media.file_type}
                </Badge>
              </div>
            </div>

            <Button variant="ghost" size="sm" onClick={() => onRemove(item.id)} className="text-red-600">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MediaLibraryItem({
  media,
  onAddToPlaylist,
}: { media: MediaFile; onAddToPlaylist: (media: MediaFile) => void }) {
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
    if (fileType.startsWith("video/")) return <Video className="h-4 w-4" />
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
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onAddToPlaylist(media)}>
      <CardContent className="p-3">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {media.thumbnail_url ? (
              <img
                src={media.thumbnail_url || "/placeholder.svg"}
                alt={media.original_name}
                className="w-10 h-10 object-cover rounded"
              />
            ) : (
              <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                {getFileIcon(media.mime_type)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium truncate">{media.original_name}</h4>
            <p className="text-xs text-gray-500">{formatFileSize(media.file_size)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function PlaylistEditorPage() {
  const params = useParams()
  const router = useRouter()
  const playlistId = Number.parseInt(params.playlistId as string)

  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [items, setItems] = useState<PlaylistItem[]>([])
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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
      const [playlistResponse, itemsResponse] = await Promise.all([
        fetch(`/api/playlists/${playlistId}`),
        fetch(`/api/playlists/${playlistId}/items`),
      ])

      if (playlistResponse.ok) {
        const playlistData = await playlistResponse.json()
        setPlaylist(playlistData.playlist)
      }

      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json()
        setItems(itemsData.items || [])
      }
    } catch (error) {
      console.error("Error fetching playlist data:", error)
      toast.error("Failed to load playlist")
    } finally {
      setLoading(false)
    }
  }

  const fetchMediaFiles = async () => {
    try {
      const response = await fetch("/api/media")
      if (response.ok) {
        const data = await response.json()
        setMediaFiles(data.files || [])
      }
    } catch (error) {
      console.error("Error fetching media files:", error)
    }
  }

  const handleAddToPlaylist = async (media: MediaFile) => {
    try {
      const response = await fetch(`/api/playlists/${playlistId}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          media_file_id: media.id,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setItems((prev) => [...prev, data.item])
        toast.success("Item added to playlist")
      } else {
        throw new Error("Failed to add item")
      }
    } catch (error) {
      console.error("Error adding item to playlist:", error)
      toast.error("Failed to add item to playlist")
    }
  }

  const handleRemoveItem = async (itemId: number) => {
    try {
      const response = await fetch(`/api/playlists/${playlistId}/items/${itemId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setItems((prev) => prev.filter((item) => item.id !== itemId))
        toast.success("Item removed from playlist")
      } else {
        throw new Error("Failed to remove item")
      }
    } catch (error) {
      console.error("Error removing item:", error)
      toast.error("Failed to remove item")
    }
  }

  const handleDragEnd = async (event: any) => {
    const { active, over } = event

    if (active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over.id)

      const newItems = arrayMove(items, oldIndex, newIndex)
      setItems(newItems)

      // Update positions on server
      try {
        await fetch(`/api/playlists/${playlistId}/items/reorder`, {
          method: "PUT",
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
      } catch (error) {
        console.error("Error reordering items:", error)
        toast.error("Failed to save new order")
        // Revert on error
        fetchPlaylistData()
      }
    }
  }

  const calculateStats = () => {
    const totalSize = items.reduce((sum, item) => sum + item.media.file_size, 0)
    const totalDuration = items.reduce((sum, item) => sum + (item.duration || item.media.duration || 30), 0)

    return {
      totalSize,
      totalDuration,
      itemCount: items.length,
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0.00 MB"
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(2)} MB`
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const stats = calculateStats()

  if (loading) {
    return (
      <DashboardLayout>
        <div className="h-full flex">
          <div className="flex-1 p-6">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!playlist) {
    return (
      <DashboardLayout>
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Playlist Not Found</h2>
            <Button onClick={() => router.push("/dashboard/playlists")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Playlists
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => router.push("/dashboard/playlists")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{playlist.name}</h1>
                <p className="text-gray-600">{playlist.description || "No description"}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center space-x-6 mt-4 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <HardDrive className="h-4 w-4" />
              <span>Total size: {formatFileSize(stats.totalSize)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Total time: {formatDuration(stats.totalDuration)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Hash className="h-4 w-4" />
              <span># of items: {stats.itemCount}</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Playlist Editor */}
          <div className="flex-1 p-6">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Playlist Items</CardTitle>
                <CardDescription>Drag and drop to reorder items</CardDescription>
              </CardHeader>
              <CardContent className="h-full">
                {items.length === 0 ? (
                  <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="text-center">
                      <Plus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No items yet</h3>
                      <p className="text-gray-600">
                        Drag and drop assets from the right panel to add them to your playlist
                      </p>
                    </div>
                  </div>
                ) : (
                  <ScrollArea className="h-full">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                        {items.map((item) => (
                          <SortablePlaylistItem key={item.id} item={item} onRemove={handleRemoveItem} />
                        ))}
                      </SortableContext>
                    </DndContext>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Media Library Sidebar */}
          <div className="w-80 border-l bg-gray-50 p-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Media Library</h3>
              <p className="text-sm text-gray-600">Click on items to add them to your playlist</p>
            </div>

            <ScrollArea className="h-full">
              <div className="space-y-2">
                {mediaFiles.map((media) => (
                  <MediaLibraryItem key={media.id} media={media} onAddToPlaylist={handleAddToPlaylist} />
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
