"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ArrowLeft,
  Play,
  Pause,
  Settings,
  Plus,
  GripVertical,
  Clock,
  FileText,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { MediaThumbnail } from "@/components/media-thumbnail"
import { UploadMediaDialog } from "@/components/upload-media-dialog"
import { PlaylistOptionsDialog } from "@/components/playlist-options-dialog"
import { PlaylistItemDurationDialog } from "@/components/playlist-item-duration-dialog"
import { getAuthHeaders, isTokenValid, clearAuthToken } from "@/lib/auth-utils"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface MediaFile {
  id: number
  filename: string
  original_name: string
  original_filename: string
  file_type: string
  file_size: number
  url: string
  thumbnail_url?: string
  mime_type?: string
  dimensions?: string
  duration?: number
  media_source?: string
  external_url?: string
  embed_settings?: string
  created_at: string
}

interface PlaylistItem {
  id: number
  playlist_id: number
  media_id: number
  position: number
  duration: number
  transition_type: string
  created_at: string
  media: MediaFile | null
  media_file: MediaFile | null
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
  item_count: number
  device_count: number
  total_duration: number
  assigned_devices: any[]
  created_at: string
  updated_at: string
}

function SortablePlaylistItem({
  item,
  onEditDuration,
}: { item: PlaylistItem; onEditDuration: (item: PlaylistItem) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const media = item.media || item.media_file

  return (
    <div ref={setNodeRef} style={style} className={`bg-white border rounded-lg p-4 ${isDragging ? "shadow-lg" : ""}`}>
      <div className="flex items-center space-x-4">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-5 w-5 text-gray-400" />
        </div>

        <div className="flex-shrink-0">{media && <MediaThumbnail media={media} size="sm" />}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-sm truncate">
                {media?.original_name || media?.filename || "Unknown Media"}
              </h4>
              <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                <span>Position {item.position}</span>
                <span>•</span>
                <span>{media?.file_type?.toUpperCase() || "Unknown"}</span>
                {media?.file_size && (
                  <>
                    <span>•</span>
                    <span>{(media.file_size / 1024 / 1024).toFixed(1)} MB</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => onEditDuration(item)}>
                <Clock className="h-4 w-4 mr-1" />
                {item.duration}s
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PlaylistEditorPage() {
  const params = useParams()
  const router = useRouter()
  const playlistId = params.playlistId as string

  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [items, setItems] = useState<PlaylistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reordering, setReordering] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showOptionsDialog, setShowOptionsDialog] = useState(false)
  const [showDurationDialog, setShowDurationDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<PlaylistItem | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const fetchPlaylistData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Check token validity first
      if (!isTokenValid()) {
        console.error("🎵 [PLAYLIST EDITOR] Invalid token detected")
        clearAuthToken()
        router.push("/login")
        return
      }

      const headers = getAuthHeaders()
      if (!headers.Authorization) {
        console.error("🎵 [PLAYLIST EDITOR] No authorization headers")
        router.push("/login")
        return
      }

      console.log("🎵 [PLAYLIST EDITOR] Fetching playlist data for ID:", playlistId)

      // Fetch playlist details
      const playlistResponse = await fetch(`/api/playlists/${playlistId}`, {
        headers,
      })

      if (!playlistResponse.ok) {
        const errorData = await playlistResponse.json()
        throw new Error(errorData.error || `HTTP ${playlistResponse.status}`)
      }

      const playlistData = await playlistResponse.json()
      console.log("🎵 [PLAYLIST EDITOR] Playlist data:", playlistData)

      if (playlistData.success && playlistData.playlist) {
        setPlaylist(playlistData.playlist)
      } else {
        throw new Error("Invalid playlist response")
      }

      // Fetch playlist items
      const itemsResponse = await fetch(`/api/playlists/${playlistId}/items`, {
        headers,
      })

      if (!itemsResponse.ok) {
        const errorData = await itemsResponse.json()
        throw new Error(errorData.error || `HTTP ${itemsResponse.status}`)
      }

      const itemsData = await itemsResponse.json()
      console.log("🎵 [PLAYLIST EDITOR] Items data:", itemsData)

      if (itemsData.success && itemsData.items) {
        setItems(itemsData.items)
      } else {
        throw new Error("Invalid items response")
      }
    } catch (error) {
      console.error("🎵 [PLAYLIST EDITOR] Error fetching data:", error)
      setError(error instanceof Error ? error.message : "Failed to load playlist")
    } finally {
      setLoading(false)
    }
  }

  const handleDragEnd = async (event: any) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    console.log("🔄 [DRAG] Moving item", active.id, "to position of", over.id)

    const oldIndex = items.findIndex((item) => item.id === active.id)
    const newIndex = items.findIndex((item) => item.id === over.id)

    if (oldIndex === -1 || newIndex === -1) {
      console.error("🔄 [DRAG] Could not find item indices")
      return
    }

    // Optimistically update the UI
    const newItems = arrayMove(items, oldIndex, newIndex)
    const reorderedItems = newItems.map((item, index) => ({
      ...item,
      position: index + 1,
    }))

    setItems(reorderedItems)
    setReordering(true)

    try {
      // Check token validity before API call
      if (!isTokenValid()) {
        console.error("🔄 [DRAG] Invalid token during reorder")
        clearAuthToken()
        router.push("/login")
        return
      }

      const headers = getAuthHeaders()
      if (!headers.Authorization) {
        console.error("🔄 [DRAG] No authorization headers for reorder")
        router.push("/login")
        return
      }

      const reorderPayload = {
        items: reorderedItems.map((item) => ({
          id: item.id,
          position: item.position,
        })),
      }

      console.log("🔄 [DRAG] Sending reorder request:", reorderPayload)

      const response = await fetch(`/api/playlists/${playlistId}/items/reorder`, {
        method: "PUT",
        headers,
        body: JSON.stringify(reorderPayload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("🔄 [DRAG] Reorder failed:", errorData)

        // Revert the optimistic update
        setItems(items)

        if (response.status === 401) {
          clearAuthToken()
          router.push("/login")
          return
        }

        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()
      console.log("🔄 [DRAG] Reorder successful:", result)

      // Update with server response if available
      if (result.items) {
        setItems(result.items)
      }
    } catch (error) {
      console.error("🔄 [DRAG] Error reordering items:", error)

      // Revert the optimistic update
      setItems(items)

      setError(error instanceof Error ? error.message : "Failed to reorder items")
    } finally {
      setReordering(false)
    }
  }

  const handleEditDuration = (item: PlaylistItem) => {
    setSelectedItem(item)
    setShowDurationDialog(true)
  }

  const handleDurationUpdate = async (newDuration: number) => {
    if (!selectedItem) return

    try {
      const headers = getAuthHeaders()
      if (!headers.Authorization) {
        router.push("/login")
        return
      }

      const response = await fetch(`/api/playlists/${playlistId}/items/${selectedItem.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ duration: newDuration }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 401) {
          clearAuthToken()
          router.push("/login")
          return
        }
        throw new Error(errorData.error || "Failed to update duration")
      }

      // Update local state
      setItems((prevItems) =>
        prevItems.map((item) => (item.id === selectedItem.id ? { ...item, duration: newDuration } : item)),
      )

      setShowDurationDialog(false)
      setSelectedItem(null)
    } catch (error) {
      console.error("Error updating duration:", error)
      setError(error instanceof Error ? error.message : "Failed to update duration")
    }
  }

  useEffect(() => {
    if (playlistId) {
      fetchPlaylistData()
    }
  }, [playlistId])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <div className="mt-2">
                <Button variant="outline" size="sm" onClick={fetchPlaylistData}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    )
  }

  if (!playlist) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Playlist not found</AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    )
  }

  const totalDuration = items.reduce((sum, item) => sum + item.duration, 0)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{playlist.name}</h1>
              <p className="text-gray-600">{playlist.description || "No description"}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => setShowOptionsDialog(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Options
            </Button>
            <Button onClick={() => setShowUploadDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Media
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Items</p>
                  <p className="text-lg font-semibold">{items.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="text-lg font-semibold">
                    {Math.floor(totalDuration / 60)}m {totalDuration % 60}s
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div
                    className={`w-2 h-2 rounded-full ${playlist.status === "active" ? "bg-green-500" : "bg-gray-400"}`}
                  />
                  <span className="text-sm text-gray-600">Status</span>
                </div>
                <Badge variant={playlist.status === "active" ? "default" : "secondary"}>{playlist.status}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                {playlist.loop_enabled ? (
                  <Play className="h-4 w-4 text-purple-500" />
                ) : (
                  <Pause className="h-4 w-4 text-gray-400" />
                )}
                <div>
                  <p className="text-sm text-gray-600">Loop</p>
                  <p className="text-lg font-semibold">{playlist.loop_enabled ? "Enabled" : "Disabled"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Playlist Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Playlist Items</span>
              {reordering && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Reordering...</span>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No items in this playlist</h3>
                <p className="text-gray-600 mb-4">Add some media files to get started</p>
                <Button onClick={() => setShowUploadDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Media
                </Button>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToVerticalAxis]}
              >
                <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-3">
                      {items.map((item) => (
                        <SortablePlaylistItem key={item.id} item={item} onEditDuration={handleEditDuration} />
                      ))}
                    </div>
                  </ScrollArea>
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        </Card>

        {/* Dialogs */}
        <UploadMediaDialog
          open={showUploadDialog}
          onOpenChange={setShowUploadDialog}
          onUploadComplete={() => {
            setShowUploadDialog(false)
            fetchPlaylistData()
          }}
        />

        <PlaylistOptionsDialog
          open={showOptionsDialog}
          onOpenChange={setShowOptionsDialog}
          playlist={playlist}
          onUpdate={(updatedPlaylist) => {
            setPlaylist(updatedPlaylist)
            setShowOptionsDialog(false)
          }}
        />

        {selectedItem && (
          <PlaylistItemDurationDialog
            open={showDurationDialog}
            onOpenChange={setShowDurationDialog}
            item={selectedItem}
            onUpdate={handleDurationUpdate}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
