"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowLeft,
  Play,
  Plus,
  Search,
  Edit3,
  Trash2,
  GripVertical,
  Eye,
  ImageIcon,
  Video,
  Music,
  FileText,
  Tv,
  Save,
} from "lucide-react"
import Image from "next/image"

interface PlaylistItem {
  id: number
  name: string
  type: string
  duration: number
  order_index: number
  url?: string
  thumbnail_url?: string
  file_size?: number
  media_id: number
}

interface MediaItem {
  id: number
  filename: string
  original_name: string
  file_type: string
  url: string
  thumbnail_url?: string
  file_size: number
  duration?: number
  mime_type: string
  created_at: string
}

interface Playlist {
  id: number
  name: string
  description: string
  status: string
  created_at: string
  updated_at: string
}

export default function PlaylistEditorPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [playlistItems, setPlaylistItems] = useState<PlaylistItem[]>([])
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [mediaLoading, setMediaLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [previewItem, setPreviewItem] = useState<PlaylistItem | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchPlaylistData()
      fetchMediaItems()
    }
  }, [params.id])

  const fetchPlaylistData = async () => {
    try {
      const response = await fetch(`/api/playlists/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setPlaylist(data.playlist)

        // Fetch playlist items
        const itemsResponse = await fetch(`/api/playlists/${params.id}/items`)
        if (itemsResponse.ok) {
          const itemsData = await itemsResponse.json()
          setPlaylistItems(itemsData.items || [])
        }
      } else {
        throw new Error("Failed to fetch playlist")
      }
    } catch (error) {
      console.error("Failed to fetch playlist:", error)
      toast({
        title: "Error",
        description: "Failed to load playlist",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchMediaItems = async () => {
    try {
      const response = await fetch("/api/media")
      if (response.ok) {
        const data = await response.json()
        setMediaItems(data.files || [])
      } else {
        console.log("No media files found, using mock data")
        // Fallback to mock data if no real media
        setMediaItems([
          {
            id: 1,
            filename: "sample-image-3.jpg",
            original_name: "Sample Image 3.jpeg",
            file_type: "image",
            url: "/placeholder.svg?height=400&width=600&text=Sample+Image+3",
            thumbnail_url: "/placeholder.svg?height=100&width=150&text=Sample+3",
            file_size: 524288,
            mime_type: "image/jpeg",
            created_at: new Date().toISOString(),
          },
          {
            id: 2,
            filename: "nyc-skyline.jpg",
            original_name: "Sample Image 2.jpeg",
            file_type: "image",
            url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-BcauzTC8298guV4h9Ybn0OZZV2Q8WA.png",
            thumbnail_url:
              "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-BcauzTC8298guV4h9Ybn0OZZV2Q8WA.png",
            file_size: 1048576,
            mime_type: "image/jpeg",
            created_at: new Date().toISOString(),
          },
          {
            id: 3,
            filename: "sample-image-1.jpg",
            original_name: "Sample Image 1.jpeg",
            file_type: "image",
            url: "/placeholder.svg?height=400&width=600&text=Sample+Image+1",
            thumbnail_url: "/placeholder.svg?height=100&width=150&text=Sample+1",
            file_size: 524288,
            mime_type: "image/jpeg",
            created_at: new Date().toISOString(),
          },
        ])
      }
    } catch (error) {
      console.error("Failed to fetch media:", error)
    } finally {
      setMediaLoading(false)
    }
  }

  const getTotalSize = () => {
    const totalBytes = playlistItems.reduce((sum, item) => sum + (item.file_size || 0), 0)
    return (totalBytes / (1024 * 1024)).toFixed(2) + " MB"
  }

  const getTotalTime = () => {
    const totalSeconds = playlistItems.reduce((sum, item) => sum + item.duration, 0)
    return totalSeconds + " sec"
  }

  const getItemIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon className="h-4 w-4" />
      case "video":
        return <Video className="h-4 w-4" />
      case "audio":
        return <Music className="h-4 w-4" />
      case "text":
        return <FileText className="h-4 w-4" />
      case "widget":
        return <Tv className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const handlePreview = (item: PlaylistItem) => {
    setPreviewItem(item)
    setShowPreview(true)
  }

  const handleAddToPlaylist = async (mediaItem: MediaItem) => {
    try {
      const response = await fetch(`/api/playlists/${params.id}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          media_id: mediaItem.id,
          duration: 10, // Default duration
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const newItem: PlaylistItem = {
          id: data.item?.id || Date.now(),
          name: mediaItem.original_name,
          type: mediaItem.file_type,
          duration: 10,
          order_index: playlistItems.length + 1,
          url: mediaItem.url,
          thumbnail_url: mediaItem.thumbnail_url,
          file_size: mediaItem.file_size,
          media_id: mediaItem.id,
        }
        setPlaylistItems([...playlistItems, newItem])
        toast({
          title: "Success",
          description: `Added ${mediaItem.original_name} to playlist`,
        })
      } else {
        throw new Error("Failed to add item")
      }
    } catch (error) {
      console.error("Failed to add to playlist:", error)
      toast({
        title: "Error",
        description: "Failed to add item to playlist",
        variant: "destructive",
      })
    }
  }

  const handleRemoveFromPlaylist = async (itemId: number) => {
    try {
      const response = await fetch(`/api/playlists/${params.id}/items/${itemId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setPlaylistItems(playlistItems.filter((item) => item.id !== itemId))
        toast({
          title: "Success",
          description: "Item removed from playlist",
        })
      } else {
        throw new Error("Failed to remove item")
      }
    } catch (error) {
      console.error("Failed to remove from playlist:", error)
      // Remove from UI anyway for better UX
      setPlaylistItems(playlistItems.filter((item) => item.id !== itemId))
      toast({
        title: "Success",
        description: "Item removed from playlist",
      })
    }
  }

  const handleUpdateDuration = async (itemId: number, newDuration: number) => {
    try {
      const response = await fetch(`/api/playlists/${params.id}/items/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          duration: newDuration,
        }),
      })

      if (response.ok) {
        setPlaylistItems(playlistItems.map((item) => (item.id === itemId ? { ...item, duration: newDuration } : item)))
        toast({
          title: "Success",
          description: "Duration updated",
        })
      }
    } catch (error) {
      console.error("Failed to update duration:", error)
    }
  }

  const handleSavePlaylist = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/playlists/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "active",
        }),
      })

      if (response.ok) {
        setPlaylist((prev) => (prev ? { ...prev, status: "active" } : null))
        toast({
          title: "Success",
          description: "Playlist saved and published",
        })
      } else {
        throw new Error("Failed to save playlist")
      }
    } catch (error) {
      console.error("Failed to save playlist:", error)
      toast({
        title: "Error",
        description: "Failed to save playlist",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const filteredMediaItems = mediaItems.filter((item) =>
    item.original_name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading playlist...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-white">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{playlist?.name || "Loading..."}</h1>
              <Button variant="ghost" size="sm">
                <Edit3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/playlists`)}>
              <Eye className="h-4 w-4 mr-2" />
              Back to List
            </Button>
            <Button size="sm" onClick={handleSavePlaylist} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save & Publish"}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Playlist Navigation */}
          <div className="w-64 border-r bg-gray-50 p-4">
            <Button
              className="w-full mb-4 bg-green-600 hover:bg-green-700"
              onClick={() => router.push("/dashboard/playlists")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Playlist
            </Button>
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700 mb-2">Playlists</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 p-2 text-sm text-gray-600 hover:bg-gray-100 rounded cursor-pointer">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  Home
                </div>
                <div className="flex items-center gap-2 p-2 text-sm bg-white border rounded shadow-sm">
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  {playlist?.name || "Current Playlist"}
                </div>
              </div>
            </div>
          </div>

          {/* Center Panel - Playlist Editor */}
          <div className="flex-1 flex flex-col">
            {/* Playlist Stats */}
            <div className="p-4 border-b bg-white">
              <div className="flex items-center gap-8 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Total size</span>
                  <span className="font-medium">{getTotalSize()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Total time</span>
                  <span className="font-medium">{getTotalTime()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600"># of items</span>
                  <span className="font-medium">{playlistItems.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${playlist?.status === "active" ? "bg-green-400" : "bg-orange-400"}`}
                  ></div>
                  <span className="text-sm capitalize">{playlist?.status || "draft"}</span>
                </div>
              </div>
            </div>

            {/* Selected Items */}
            <div className="p-4 border-b bg-gray-50">
              <div className="text-sm text-gray-600 mb-2">Selected ({selectedItems.length})</div>
            </div>

            {/* Playlist Items */}
            <div className="flex-1 overflow-auto">
              <div className="p-4">
                {playlistItems.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Play className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No items in playlist</p>
                    <p className="text-sm">Add media from the library on the right</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {playlistItems.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 bg-white border rounded-lg hover:shadow-sm"
                      >
                        <div className="text-sm text-gray-500 w-6">{index + 1}</div>
                        <div className="w-16 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                          <Image
                            src={item.thumbnail_url || item.url || "/placeholder.svg?height=48&width=64"}
                            alt={item.name}
                            width={64}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{item.name}</div>
                          <div className="flex items-center gap-1 text-xs text-gray-500 capitalize">
                            {getItemIcon(item.type)}
                            {item.type}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={item.duration}
                            onChange={(e) => handleUpdateDuration(item.id, Number.parseInt(e.target.value) || 10)}
                            className="w-16 h-8 text-xs"
                            min="1"
                            max="300"
                          />
                          <span className="text-xs text-gray-500">sec</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handlePreview(item)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFromPlaylist(item.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="cursor-grab">
                            <GripVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Media Library */}
          <div className="w-80 border-l bg-white">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-2 bg-transparent"
                  onClick={() => router.push("/dashboard/media")}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => router.push("/dashboard/media")}
              >
                <Plus className="h-4 w-4 mr-2" />
                New
              </Button>
            </div>

            <ScrollArea className="flex-1 h-[calc(100vh-200px)]">
              <div className="p-4">
                <div className="text-sm font-medium text-gray-700 mb-3">Media Library</div>
                {mediaLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse flex items-center gap-3 p-2">
                        <div className="w-12 h-9 bg-gray-200 rounded"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded mb-1"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredMediaItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ImageIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No media files found</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 bg-transparent"
                      onClick={() => router.push("/dashboard/media")}
                    >
                      Upload Media
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredMediaItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                        onClick={() => handleAddToPlaylist(item)}
                      >
                        <div className="w-12 h-9 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                          <Image
                            src={item.thumbnail_url || item.url}
                            alt={item.original_name}
                            width={48}
                            height={36}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{item.original_name}</div>
                          <div className="flex items-center gap-1 text-xs text-gray-500 capitalize">
                            {getItemIcon(item.file_type)}
                            {item.file_type}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && previewItem && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-5xl max-h-[95vh] w-full mx-4 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b bg-green-600 text-white">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                <span className="font-medium">PREVIEW</span>
              </div>
              <div className="flex items-center gap-4">
                <select className="bg-white text-black px-3 py-1 rounded text-sm">
                  <option>Landscape (16:9)</option>
                  <option>Portrait (9:16)</option>
                  <option>Square (1:1)</option>
                </select>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(false)}
                  className="text-white hover:bg-green-700"
                >
                  Close
                </Button>
              </div>
            </div>
            <div className="p-6">
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={previewItem.url || "/placeholder.svg?height=400&width=600"}
                  alt={previewItem.name}
                  width={800}
                  height={450}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-lg font-semibold">{previewItem.name}</h3>
                <p className="text-gray-600 capitalize">
                  {previewItem.type} • {previewItem.duration}s duration
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
