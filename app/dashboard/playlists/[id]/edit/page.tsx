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
  Clock,
  ImageIcon,
  Video,
  Music,
  FileText,
  Tv,
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
}

interface MediaItem {
  id: number
  name: string
  type: string
  url: string
  thumbnail_url?: string
  file_size: number
  duration?: number
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
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [previewItem, setPreviewItem] = useState<PlaylistItem | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchPlaylistData()
      fetchMediaItems()
    }
  }, [params.id])

  const fetchPlaylistData = async () => {
    try {
      // Mock playlist data based on the reference image
      setPlaylist({
        id: Number(params.id),
        name: "New Playlist",
        description: "Sample playlist for demonstration",
        status: "draft",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      // Mock playlist items based on the reference
      setPlaylistItems([
        {
          id: 1,
          name: "Sample Image 3.jpeg",
          type: "image",
          duration: 10,
          order_index: 1,
          url: "/placeholder.svg?height=400&width=600&text=Sample+Image+3",
          thumbnail_url: "/placeholder.svg?height=100&width=150&text=Sample+3",
          file_size: 524288,
        },
        {
          id: 2,
          name: "Sample Image 2.jpeg",
          type: "image",
          duration: 10,
          order_index: 2,
          url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-BcauzTC8298guV4h9Ybn0OZZV2Q8WA.png",
          thumbnail_url: "/placeholder.svg?height=100&width=150&text=NYC+Skyline",
          file_size: 524288,
        },
      ])
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
      // Mock media items based on the reference
      setMediaItems([
        {
          id: 1,
          name: "Sample Image 3.jpeg",
          type: "image",
          url: "/placeholder.svg?height=400&width=600&text=Sample+Image+3",
          thumbnail_url: "/placeholder.svg?height=100&width=150&text=Sample+3",
          file_size: 524288,
        },
        {
          id: 2,
          name: "Sample Image 2.jpeg",
          type: "image",
          url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-BcauzTC8298guV4h9Ybn0OZZV2Q8WA.png",
          thumbnail_url: "/placeholder.svg?height=100&width=150&text=NYC+Skyline",
          file_size: 524288,
        },
        {
          id: 3,
          name: "Sample Image 1.jpeg",
          type: "image",
          url: "/placeholder.svg?height=400&width=600&text=Sample+Image+1",
          thumbnail_url: "/placeholder.svg?height=100&width=150&text=Sample+1",
          file_size: 524288,
        },
        {
          id: 4,
          name: "New York Weather",
          type: "widget",
          url: "/placeholder.svg?height=400&width=600&text=Weather+Widget",
          thumbnail_url: "/placeholder.svg?height=100&width=150&text=Weather",
          file_size: 0,
        },
        {
          id: 5,
          name: "ESPN News",
          type: "widget",
          url: "/placeholder.svg?height=400&width=600&text=ESPN+News",
          thumbnail_url: "/placeholder.svg?height=100&width=150&text=ESPN",
          file_size: 0,
        },
      ])
    } catch (error) {
      console.error("Failed to fetch media:", error)
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

  const handleAddToPlaylist = (mediaItem: MediaItem) => {
    const newItem: PlaylistItem = {
      id: Date.now(),
      name: mediaItem.name,
      type: mediaItem.type,
      duration: mediaItem.duration || 10,
      order_index: playlistItems.length + 1,
      url: mediaItem.url,
      thumbnail_url: mediaItem.thumbnail_url,
      file_size: mediaItem.file_size,
    }
    setPlaylistItems([...playlistItems, newItem])
    toast({
      title: "Success",
      description: `Added ${mediaItem.name} to playlist`,
    })
  }

  const handleRemoveFromPlaylist = (itemId: number) => {
    setPlaylistItems(playlistItems.filter((item) => item.id !== itemId))
    toast({
      title: "Success",
      description: "Item removed from playlist",
    })
  }

  const filteredMediaItems = mediaItems.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))

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
              <h1 className="text-xl font-semibold">{playlist?.name}</h1>
              <Button variant="ghost" size="sm">
                <Edit3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button size="sm">
              <Play className="h-4 w-4 mr-2" />
              Save & Publish
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Playlist Navigation */}
          <div className="w-64 border-r bg-gray-50 p-4">
            <Button className="w-full mb-4 bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Playlist
            </Button>
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700 mb-2">Playlists</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 p-2 text-sm text-gray-600 hover:bg-gray-100 rounded">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  Home
                </div>
                <div className="flex items-center gap-2 p-2 text-sm bg-white border rounded shadow-sm">
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  New Playlist
                </div>
                <div className="flex items-center gap-2 p-2 text-sm text-gray-600 hover:bg-gray-100 rounded">
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  Simple Playlist
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
                  <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
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
                          <div className="flex items-center gap-1 text-xs text-gray-500">{getItemIcon(item.type)}</div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-3 w-3" />
                          {item.duration} sec
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handlePreview(item)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFromPlaylist(item.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
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
                <Button variant="outline" size="sm" className="ml-2 bg-transparent">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button className="w-full bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                New
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4">
                <div className="text-sm font-medium text-gray-700 mb-3">Home</div>
                <div className="space-y-3">
                  {filteredMediaItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                      onClick={() => handleAddToPlaylist(item)}
                    >
                      <div className="w-12 h-9 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                        <Image
                          src={item.thumbnail_url || item.url}
                          alt={item.name}
                          width={48}
                          height={36}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{item.name}</div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">{getItemIcon(item.type)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && previewItem && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full mx-4 overflow-hidden">
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
            <div className="p-4">
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={previewItem.url || "/placeholder.svg?height=400&width=600"}
                  alt={previewItem.name}
                  width={800}
                  height={450}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
