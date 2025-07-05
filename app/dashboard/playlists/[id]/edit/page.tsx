"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { ArrowLeft, Save, Play, Plus, X, GripVertical, Search, ImageIcon, Video, FileText, Music } from "lucide-react"
import { toast } from "sonner"

interface MediaItem {
  id: string
  name: string
  type: string
  size: number
  url: string
  thumbnail_url?: string
  duration?: number
  created_at: string
}

interface PlaylistItem {
  id: string
  media_id: string
  duration: number
  order_index: number
  media?: MediaItem
}

interface Playlist {
  id: string
  name: string
  description?: string
  status: "draft" | "published"
  total_duration: number
  item_count: number
  created_at: string
  updated_at: string
}

export default function EditPlaylistPage() {
  const params = useParams()
  const router = useRouter()
  const playlistId = params.id as string

  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [playlistItems, setPlaylistItems] = useState<PlaylistItem[]>([])
  const [mediaLibrary, setMediaLibrary] = useState<MediaItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [draggedItem, setDraggedItem] = useState<number | null>(null)
  const [dragOverItem, setDragOverItem] = useState<number | null>(null)

  // Load playlist and media data
  useEffect(() => {
    loadPlaylistData()
    loadMediaLibrary()
  }, [playlistId])

  const loadPlaylistData = async () => {
    try {
      const [playlistRes, itemsRes] = await Promise.all([
        fetch(`/api/playlists/${playlistId}`),
        fetch(`/api/playlists/${playlistId}/items`),
      ])

      if (playlistRes.ok) {
        const playlistData = await playlistRes.json()
        setPlaylist(playlistData)
      }

      if (itemsRes.ok) {
        const itemsData = await itemsRes.json()
        setPlaylistItems(itemsData.sort((a: PlaylistItem, b: PlaylistItem) => a.order_index - b.order_index))
      }
    } catch (error) {
      console.error("Error loading playlist:", error)
      toast.error("Failed to load playlist")
    } finally {
      setLoading(false)
    }
  }

  const loadMediaLibrary = async () => {
    try {
      const response = await fetch("/api/media")
      if (response.ok) {
        const data = await response.json()
        setMediaLibrary(data.media || [])
      }
    } catch (error) {
      console.error("Error loading media library:", error)
    }
  }

  const addMediaToPlaylist = async (mediaItem: MediaItem) => {
    try {
      const response = await fetch(`/api/playlists/${playlistId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          media_id: mediaItem.id,
          duration: mediaItem.duration || 10,
        }),
      })

      if (response.ok) {
        const newItem = await response.json()
        setPlaylistItems((prev) => [...prev, { ...newItem, media: mediaItem }])
        setHasUnsavedChanges(true)
        toast.success("Media added to playlist")
      } else {
        toast.error("Failed to add media to playlist")
      }
    } catch (error) {
      console.error("Error adding media:", error)
      toast.error("Failed to add media to playlist")
    }
  }

  const removeFromPlaylist = async (itemId: string) => {
    try {
      const response = await fetch(`/api/playlists/${playlistId}/items/${itemId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setPlaylistItems((prev) => prev.filter((item) => item.id !== itemId))
        setHasUnsavedChanges(true)
        toast.success("Item removed from playlist")
      } else {
        toast.error("Failed to remove item")
      }
    } catch (error) {
      console.error("Error removing item:", error)
      toast.error("Failed to remove item")
    }
  }

  const updateItemDuration = (itemId: string, duration: number) => {
    setPlaylistItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, duration } : item)))
    setHasUnsavedChanges(true)
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItem(index)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverItem(index)
  }

  const handleDragEnd = () => {
    if (draggedItem !== null && dragOverItem !== null && draggedItem !== dragOverItem) {
      const newItems = [...playlistItems]
      const draggedItemData = newItems[draggedItem]

      // Remove dragged item
      newItems.splice(draggedItem, 1)

      // Insert at new position
      const insertIndex = draggedItem < dragOverItem ? dragOverItem - 1 : dragOverItem
      newItems.splice(insertIndex, 0, draggedItemData)

      // Update order indices
      const updatedItems = newItems.map((item, index) => ({
        ...item,
        order_index: index,
      }))

      setPlaylistItems(updatedItems)
      setHasUnsavedChanges(true)
    }

    setDraggedItem(null)
    setDragOverItem(null)
  }

  const saveChanges = async () => {
    setSaving(true)
    try {
      // Save item order and durations
      const updates = playlistItems.map((item, index) => ({
        id: item.id,
        duration: item.duration,
        order_index: index,
      }))

      const response = await fetch(`/api/playlists/${playlistId}/items`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: updates }),
      })

      if (response.ok) {
        setHasUnsavedChanges(false)
        toast.success("Changes saved successfully")
        loadPlaylistData() // Refresh data
      } else {
        toast.error("Failed to save changes")
      }
    } catch (error) {
      console.error("Error saving changes:", error)
      toast.error("Failed to save changes")
    } finally {
      setSaving(false)
    }
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
    if (type.startsWith("video/")) return <Video className="h-4 w-4" />
    if (type.startsWith("audio/")) return <Music className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ["B", "KB", "MB", "GB"]
    if (bytes === 0) return "0 B"
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  const filteredMedia = mediaLibrary.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const totalDuration = playlistItems.reduce((sum, item) => sum + item.duration, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading playlist...</p>
        </div>
      </div>
    )
  }

  if (!playlist) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg font-semibold mb-2">Playlist not found</p>
          <Button onClick={() => router.push("/dashboard/playlists")}>Back to Playlists</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/playlists")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Playlists
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{playlist.name}</h1>
            <p className="text-muted-foreground">
              {playlistItems.length} items • {formatDuration(totalDuration)} total
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {hasUnsavedChanges && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              Unsaved Changes
            </Badge>
          )}
          <Badge variant={playlist.status === "published" ? "default" : "secondary"}>{playlist.status}</Badge>
          <Button onClick={saveChanges} disabled={!hasUnsavedChanges || saving} className="min-w-[100px]">
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Media Library */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Media Library
              <Badge variant="outline">{filteredMedia.length}</Badge>
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search media..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              <div className="p-4 space-y-2">
                {filteredMedia.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => addMediaToPlaylist(item)}
                  >
                    <div className="flex-shrink-0">
                      {item.thumbnail_url ? (
                        <img
                          src={item.thumbnail_url || "/placeholder.svg"}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                          {getFileIcon(item.type)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(item.size)}
                        {item.duration && ` • ${formatDuration(item.duration)}`}
                      </p>
                    </div>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
                {filteredMedia.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "No media found matching your search" : "No media files available"}
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Playlist Editor */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Playlist Items
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span>{playlistItems.length} items</span>
                <span>{formatDuration(totalDuration)}</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              <div className="p-4 space-y-2">
                {playlistItems.map((item, index) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                      dragOverItem === index ? "border-primary bg-primary/5" : "hover:bg-accent"
                    } ${draggedItem === index ? "opacity-50" : ""}`}
                  >
                    <div className="cursor-grab active:cursor-grabbing">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <div className="flex-shrink-0">
                      {item.media?.thumbnail_url ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <img
                              src={item.media.thumbnail_url || "/placeholder.svg"}
                              alt={item.media.name}
                              className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                            />
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>{item.media.name}</DialogTitle>
                            </DialogHeader>
                            <AspectRatio ratio={16 / 9}>
                              {item.media.type.startsWith("video/") ? (
                                <video src={item.media.url} controls className="w-full h-full object-contain" />
                              ) : (
                                <img
                                  src={item.media.url || "/placeholder.svg"}
                                  alt={item.media.name}
                                  className="w-full h-full object-contain"
                                />
                              )}
                            </AspectRatio>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                          {getFileIcon(item.media?.type || "")}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.media?.name || "Unknown Media"}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.media?.size && formatFileSize(item.media.size)}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        value={item.duration}
                        onChange={(e) => updateItemDuration(item.id, Number.parseInt(e.target.value) || 0)}
                        className="w-20 text-center"
                        min="1"
                        max="3600"
                      />
                      <span className="text-sm text-muted-foreground">sec</span>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromPlaylist(item.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {playlistItems.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="mb-4">
                      <Play className="h-12 w-12 mx-auto opacity-50" />
                    </div>
                    <p className="text-lg font-medium mb-2">No items in playlist</p>
                    <p>Add media from the library to get started</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
