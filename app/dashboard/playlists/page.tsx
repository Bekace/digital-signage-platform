"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useToast } from "@/hooks/use-toast"
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Settings,
  RotateCcw,
  RotateCw,
  MessageSquare,
  Share,
  MoreHorizontal,
  Filter,
  ImageIcon,
  Video,
  Music,
  FileText,
  Cloud,
} from "lucide-react"
import Image from "next/image"

interface Playlist {
  id: number
  name: string
  description: string
  status: "draft" | "active"
  item_count: number
  total_duration: number
  total_size: number
  created_at: string
  updated_at: string
}

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

export default function PlaylistsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null)
  const [playlistItems, setPlaylistItems] = useState<PlaylistItem[]>([])
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [leftSearchQuery, setLeftSearchQuery] = useState("")
  const [rightSearchQuery, setRightSearchQuery] = useState("")
  const [selectedItems, setSelectedItems] = useState<number[]>([])

  useEffect(() => {
    fetchPlaylists()
    fetchMediaItems()
  }, [])

  const fetchPlaylists = async () => {
    try {
      const response = await fetch("/api/playlists")
      if (response.ok) {
        const data = await response.json()
        const playlistsData = data.playlists || []

        // Convert to proper format with calculated values
        const formattedPlaylists = playlistsData.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          status: p.status,
          item_count: p.item_count || 0,
          total_duration: p.item_count * 10, // Estimate
          total_size: p.item_count * 0.5, // Estimate in MB
          created_at: p.created_at,
          updated_at: p.updated_at,
        }))

        setPlaylists(formattedPlaylists)

        // Select first playlist by default
        if (formattedPlaylists.length > 0) {
          setSelectedPlaylist(formattedPlaylists[0])
          fetchPlaylistItems(formattedPlaylists[0].id)
        }
      } else {
        // Use mock data
        const mockPlaylists = [
          {
            id: 1,
            name: "New Playlist",
            description: "Sample playlist for demonstration",
            status: "draft" as const,
            item_count: 2,
            total_duration: 20,
            total_size: 0.98,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 2,
            name: "Simple Playlist",
            description: "Another sample playlist",
            status: "active" as const,
            item_count: 3,
            total_duration: 30,
            total_size: 1.5,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]
        setPlaylists(mockPlaylists)
        setSelectedPlaylist(mockPlaylists[0])

        // Mock playlist items for the first playlist
        setPlaylistItems([
          {
            id: 1,
            name: "Sample Image 3.jpeg",
            type: "image",
            duration: 10,
            order_index: 1,
            url: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop",
            thumbnail_url: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=150&h=100&fit=crop",
            file_size: 524288,
            media_id: 1,
          },
          {
            id: 2,
            name: "Sample Image 2.jpeg",
            type: "image",
            duration: 10,
            order_index: 2,
            url: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop",
            thumbnail_url: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=150&h=100&fit=crop",
            file_size: 786432,
            media_id: 2,
          },
        ])
      }
    } catch (error) {
      console.error("Failed to fetch playlists:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPlaylistItems = async (playlistId: number) => {
    try {
      const response = await fetch(`/api/playlists/${playlistId}/items`)
      if (response.ok) {
        const data = await response.json()
        setPlaylistItems(data.items || [])
      }
    } catch (error) {
      console.error("Failed to fetch playlist items:", error)
    }
  }

  const fetchMediaItems = async () => {
    try {
      const response = await fetch("/api/media")
      if (response.ok) {
        const data = await response.json()
        setMediaItems(data.files || [])
      } else {
        // Use sample media data
        setMediaItems([
          {
            id: 1,
            filename: "sample-image-3.jpg",
            original_name: "Sample Image 3.jpeg",
            file_type: "image",
            url: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop",
            thumbnail_url: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=150&h=100&fit=crop",
            file_size: 524288,
            mime_type: "image/jpeg",
            created_at: new Date().toISOString(),
          },
          {
            id: 2,
            filename: "sample-image-2.jpg",
            original_name: "Sample Image 2.jpeg",
            file_type: "image",
            url: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop",
            thumbnail_url: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=150&h=100&fit=crop",
            file_size: 786432,
            mime_type: "image/jpeg",
            created_at: new Date().toISOString(),
          },
          {
            id: 3,
            filename: "sample-image-1.jpg",
            original_name: "Sample Image 1.jpeg",
            file_type: "image",
            url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
            thumbnail_url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=150&h=100&fit=crop",
            file_size: 612352,
            mime_type: "image/jpeg",
            created_at: new Date().toISOString(),
          },
          {
            id: 4,
            filename: "new-york-weather.widget",
            original_name: "New York Weather",
            file_type: "widget",
            url: "/api/widgets/weather",
            thumbnail_url: "https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=150&h=100&fit=crop",
            file_size: 0,
            mime_type: "application/widget",
            created_at: new Date().toISOString(),
          },
          {
            id: 5,
            filename: "espn-news.widget",
            original_name: "ESPN News",
            file_type: "widget",
            url: "/api/widgets/espn",
            thumbnail_url: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=150&h=100&fit=crop",
            file_size: 0,
            mime_type: "application/widget",
            created_at: new Date().toISOString(),
          },
        ])
      }
    } catch (error) {
      console.error("Failed to fetch media:", error)
    }
  }

  const handleCreatePlaylist = async () => {
    try {
      const response = await fetch("/api/playlists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "New Playlist",
          description: "A new playlist",
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const newPlaylist = {
          ...data.playlist,
          item_count: 0,
          total_duration: 0,
          total_size: 0,
        }
        setPlaylists([...playlists, newPlaylist])
        setSelectedPlaylist(newPlaylist)
        setPlaylistItems([])
        toast({
          title: "Success",
          description: "New playlist created",
        })
      }
    } catch (error) {
      console.error("Failed to create playlist:", error)
      toast({
        title: "Error",
        description: "Failed to create playlist",
        variant: "destructive",
      })
    }
  }

  const handleSelectPlaylist = (playlist: Playlist) => {
    setSelectedPlaylist(playlist)
    fetchPlaylistItems(playlist.id)
  }

  const handleEditPlaylist = () => {
    if (selectedPlaylist) {
      router.push(`/dashboard/playlists/${selectedPlaylist.id}/edit`)
    }
  }

  const handleUpdateDuration = async (itemId: number, newDuration: number) => {
    setPlaylistItems(playlistItems.map((item) => (item.id === itemId ? { ...item, duration: newDuration } : item)))
  }

  const handleRemoveItem = async (itemId: number) => {
    setPlaylistItems(playlistItems.filter((item) => item.id !== itemId))
    toast({
      title: "Success",
      description: "Item removed from playlist",
    })
  }

  const getItemIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon className="h-4 w-4" />
      case "video":
        return <Video className="h-4 w-4" />
      case "audio":
        return <Music className="h-4 w-4" />
      case "widget":
        return <Cloud className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const filteredPlaylists = playlists.filter((playlist) =>
    playlist.name.toLowerCase().includes(leftSearchQuery.toLowerCase()),
  )

  const filteredMediaItems = mediaItems.filter((item) =>
    item.original_name.toLowerCase().includes(rightSearchQuery.toLowerCase()),
  )

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading playlists...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col">
        {/* Top Banner */}
        <div className="bg-gray-100 border-b px-6 py-3 flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Your trial expires in 5 days.</span>
            <span className="text-blue-600">
              <strong>New feature release!</strong> Curated Background Music for your business, office space. Try now!
            </span>
          </div>
          <Button size="sm" className="bg-green-600 hover:bg-green-700">
            <Edit3 className="h-4 w-4 mr-2" />
            Upgrade now
          </Button>
        </div>

        {/* Main Content - Three Column Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Playlists */}
          <div className="w-80 border-r bg-white">
            <div className="p-4 border-b">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search"
                  value={leftSearchQuery}
                  onChange={(e) => setLeftSearchQuery(e.target.value)}
                  className="pl-10"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 bg-green-600 text-white">
                    <Search className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Filter className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleCreatePlaylist}>
                  Create Playlist
                </Button>
                <Button variant="outline" size="sm" className="px-3 bg-transparent">
                  <Settings className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="px-3 bg-transparent">
                  <Share className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-2 text-sm text-gray-600 hover:bg-gray-50 rounded cursor-pointer">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span>Home</span>
                    <div className="ml-auto w-4 h-4 border border-gray-300 rounded"></div>
                  </div>

                  {filteredPlaylists.map((playlist) => (
                    <div
                      key={playlist.id}
                      className={`flex items-center gap-3 p-2 text-sm rounded cursor-pointer transition-colors ${
                        selectedPlaylist?.id === playlist.id ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"
                      }`}
                      onClick={() => handleSelectPlaylist(playlist)}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          playlist.status === "active" ? "bg-green-500" : "bg-orange-400"
                        }`}
                      ></div>
                      <span className="flex-1">{playlist.name}</span>
                      <div className="w-4 h-4 border border-gray-300 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Center Panel - Selected Playlist */}
          <div className="flex-1 flex flex-col bg-white">
            {selectedPlaylist ? (
              <>
                {/* Playlist Header */}
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-semibold">{selectedPlaylist.name}</h1>
                      <Button variant="ghost" size="sm" onClick={handleEditPlaylist}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <RotateCw className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Share className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-8 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Total size</span>
                      <span className="font-medium">{selectedPlaylist.total_size.toFixed(2)} MB</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Total time</span>
                      <span className="font-medium">{selectedPlaylist.total_duration} sec</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600"># of items</span>
                      <span className="font-medium">{selectedPlaylist.item_count}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          selectedPlaylist.status === "active" ? "bg-green-400" : "bg-orange-400"
                        }`}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Selected Items */}
                <div className="px-6 py-3 border-b bg-gray-50">
                  <span className="text-sm text-gray-600">Selected ({selectedItems.length})</span>
                </div>

                {/* Playlist Items */}
                <div className="flex-1 overflow-auto">
                  <div className="p-6">
                    {playlistItems.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <p>No items in this playlist</p>
                        <p className="text-sm">Add media from the library on the right</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {playlistItems.map((item, index) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-4 p-3 bg-white border rounded-lg hover:shadow-sm transition-shadow"
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
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                {getItemIcon(item.type)}
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
                              <Button variant="ghost" size="sm">
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Settings className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <p>Select a playlist to view its contents</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Media Library */}
          <div className="w-80 border-l bg-white">
            <div className="p-4 border-b">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search"
                  value={rightSearchQuery}
                  onChange={(e) => setRightSearchQuery(e.target.value)}
                  className="pl-10"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 bg-green-600 text-white">
                    <Search className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Filter className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Filter className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <Button
                className="w-full bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={() => router.push("/dashboard/media")}
              >
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
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
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
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          {getItemIcon(item.file_type)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
