"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Play, Clock, ImageIcon, Video, Music, FileText, Eye, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react"
import Image from "next/image"

interface Playlist {
  id: number
  name: string
  description: string
  status: string
  created_at: string
  updated_at: string
  item_count?: number
}

interface PlaylistItem {
  id: number
  name: string
  type: string
  duration: number
  order_index: number
  url?: string
  file_size?: number
  thumbnail_url?: string
}

interface PreviewPlaylistDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  playlist: Playlist | null
}

export function PreviewPlaylistDialog({ open, onOpenChange, playlist }: PreviewPlaylistDialogProps) {
  const [items, setItems] = useState<PlaylistItem[]>([])
  const [loading, setLoading] = useState(false)
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0)
  const [showFullPreview, setShowFullPreview] = useState(false)

  useEffect(() => {
    if (playlist && open) {
      fetchPlaylistItems()
    }
  }, [playlist, open])

  const fetchPlaylistItems = async () => {
    if (!playlist) return

    setLoading(true)
    try {
      const response = await fetch(`/api/playlists/${playlist.id}/items`)
      if (response.ok) {
        const data = await response.json()
        setItems(data.items || [])
      } else {
        // Mock items with real preview data
        setItems([
          {
            id: 1,
            name: "Welcome Banner",
            type: "image",
            duration: 15,
            order_index: 1,
            url: "/placeholder.svg?height=400&width=600&text=Welcome+Banner",
            thumbnail_url: "/placeholder.svg?height=200&width=300&text=Welcome+Banner",
            file_size: 245760,
          },
          {
            id: 2,
            name: "Company Introduction",
            type: "video",
            duration: 45,
            order_index: 2,
            url: "/placeholder.svg?height=400&width=600&text=Company+Video",
            thumbnail_url: "/placeholder.svg?height=200&width=300&text=Video+Thumbnail",
            file_size: 15728640,
          },
          {
            id: 3,
            name: "Daily Announcements",
            type: "text",
            duration: 20,
            order_index: 3,
            url: "/placeholder.svg?height=400&width=600&text=Daily+Announcements",
            thumbnail_url: "/placeholder.svg?height=200&width=300&text=Text+Content",
            file_size: 2048,
          },
          {
            id: 4,
            name: "Background Music",
            type: "audio",
            duration: 180,
            order_index: 4,
            url: "#",
            file_size: 5242880,
          },
          {
            id: 5,
            name: "Product Showcase",
            type: "image",
            duration: 25,
            order_index: 5,
            url: "/placeholder.svg?height=400&width=600&text=Product+Showcase",
            thumbnail_url: "/placeholder.svg?height=200&width=300&text=Product+Image",
            file_size: 512000,
          },
        ])
      }
    } catch (error) {
      console.error("Failed to fetch playlist items:", error)
    } finally {
      setLoading(false)
    }
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
      default:
        return <Play className="h-4 w-4" />
    }
  }

  const getTotalDuration = () => {
    return items.reduce((total, item) => total + item.duration, 0)
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const currentItem = items[currentPreviewIndex]

  const nextPreview = () => {
    setCurrentPreviewIndex((prev) => (prev + 1) % items.length)
  }

  const prevPreview = () => {
    setCurrentPreviewIndex((prev) => (prev - 1 + items.length) % items.length)
  }

  const renderMediaPreview = (item: PlaylistItem) => {
    switch (item.type) {
      case "image":
        return (
          <div className="relative bg-gray-100 rounded-lg overflow-hidden">
            <AspectRatio ratio={16 / 9}>
              <Image
                src={item.thumbnail_url || item.url || "/placeholder.svg?height=300&width=400&text=Image"}
                alt={item.name}
                fill
                className="object-cover"
              />
            </AspectRatio>
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="bg-black/50 text-white">
                <ImageIcon className="h-3 w-3 mr-1" />
                Image
              </Badge>
            </div>
          </div>
        )
      case "video":
        return (
          <div className="relative bg-gray-900 rounded-lg overflow-hidden">
            <AspectRatio ratio={16 / 9}>
              <div className="flex items-center justify-center h-full">
                <Image
                  src={item.thumbnail_url || "/placeholder.svg?height=300&width=400&text=Video+Thumbnail"}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black/50 rounded-full p-4">
                    <Play className="h-8 w-8 text-white fill-white" />
                  </div>
                </div>
              </div>
            </AspectRatio>
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="bg-black/50 text-white">
                <Video className="h-3 w-3 mr-1" />
                Video
              </Badge>
            </div>
          </div>
        )
      case "text":
        return (
          <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg overflow-hidden">
            <AspectRatio ratio={16 / 9}>
              <div className="flex items-center justify-center h-full p-6">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-800">{item.name}</h3>
                  <p className="text-sm text-gray-600 mt-2">Text Content</p>
                </div>
              </div>
            </AspectRatio>
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="bg-black/50 text-white">
                <FileText className="h-3 w-3 mr-1" />
                Text
              </Badge>
            </div>
          </div>
        )
      case "audio":
        return (
          <div className="relative bg-gradient-to-br from-purple-50 to-pink-100 rounded-lg overflow-hidden">
            <AspectRatio ratio={16 / 9}>
              <div className="flex items-center justify-center h-full p-6">
                <div className="text-center">
                  <Music className="h-12 w-12 mx-auto mb-4 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-800">{item.name}</h3>
                  <p className="text-sm text-gray-600 mt-2">Audio File</p>
                </div>
              </div>
            </AspectRatio>
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="bg-black/50 text-white">
                <Music className="h-3 w-3 mr-1" />
                Audio
              </Badge>
            </div>
          </div>
        )
      default:
        return (
          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <Play className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Preview not available</p>
          </div>
        )
    }
  }

  if (!playlist) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Preview: {playlist.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Playlist Info */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{playlist.name}</CardTitle>
                <Badge variant={playlist.status === "active" ? "default" : "secondary"}>
                  {playlist.status === "active" ? "Published" : "Draft"}
                </Badge>
              </div>
              {playlist.description && <CardDescription>{playlist.description}</CardDescription>}
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Play className="h-3 w-3" />
                  {items.length} items
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(getTotalDuration())} total
                </div>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-32 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <Card className="p-12 text-center">
              <Play className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No items in this playlist</h3>
              <p className="text-gray-500">Add media files to see the preview</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Media Preview */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Media Preview</h3>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={prevPreview} disabled={items.length <= 1}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-gray-600">
                      {currentPreviewIndex + 1} of {items.length}
                    </span>
                    <Button variant="outline" size="sm" onClick={nextPreview} disabled={items.length <= 1}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {currentItem && (
                  <Card>
                    <CardContent className="p-4">
                      {renderMediaPreview(currentItem)}
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{currentItem.name}</h4>
                          <Button variant="ghost" size="sm" onClick={() => setShowFullPreview(true)}>
                            <Maximize2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            {getItemIcon(currentItem.type)}
                            <span className="capitalize">{currentItem.type}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(currentItem.duration)}
                          </div>
                          {currentItem.file_size && <span>{formatFileSize(currentItem.file_size)}</span>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Playlist Items List */}
              <div className="space-y-4">
                <h3 className="font-semibold">Playlist Items</h3>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2 pr-4">
                    {items.map((item, index) => (
                      <Card
                        key={item.id}
                        className={`cursor-pointer transition-colors ${
                          index === currentPreviewIndex ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-gray-50"
                        }`}
                        onClick={() => setCurrentPreviewIndex(index)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded text-sm font-medium">
                              {index + 1}
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">{getItemIcon(item.type)}</div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{item.name}</div>
                              <div className="text-sm text-gray-500 capitalize">{item.type}</div>
                            </div>
                            <div className="text-sm text-gray-600 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(item.duration)}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}

          {/* Playback Summary */}
          {items.length > 0 && (
            <>
              <Separator />
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Playback Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Duration:</span>
                    <div className="font-medium">{formatDuration(getTotalDuration())}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Items:</span>
                    <div className="font-medium">{items.length} files</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Loop Mode:</span>
                    <div className="font-medium">Continuous</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <div className="font-medium capitalize">{playlist.status}</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-between pt-4">
          <div className="flex gap-2">
            {items.length > 0 && (
              <Button variant="outline" onClick={() => setCurrentPreviewIndex(0)}>
                <Play className="h-4 w-4 mr-2" />
                Start Preview
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {playlist.status === "draft" && items.length > 0 && (
              <Button>
                <Play className="h-4 w-4 mr-2" />
                Publish Playlist
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
