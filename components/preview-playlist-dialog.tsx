"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Play, Clock, ImageIcon, Video, Music } from "lucide-react"

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
}

interface PreviewPlaylistDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  playlist: Playlist | null
}

export function PreviewPlaylistDialog({ open, onOpenChange, playlist }: PreviewPlaylistDialogProps) {
  const [items, setItems] = useState<PlaylistItem[]>([])
  const [loading, setLoading] = useState(false)

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
      }
    } catch (error) {
      console.error("Failed to fetch playlist items:", error)
      // Set mock items for demo
      setItems([
        { id: 1, name: "Welcome Image", type: "image", duration: 15, order_index: 1 },
        { id: 2, name: "Company Video", type: "video", duration: 30, order_index: 2 },
        { id: 3, name: "Announcement", type: "text", duration: 10, order_index: 3 },
      ])
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
        return <ImageIcon className="h-4 w-4" /> // Assuming ImageIcon is used for text as well
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

  if (!playlist) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Preview: {playlist.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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

          <Separator />

          {/* Playlist Items */}
          <div className="space-y-3">
            <h3 className="font-semibold">Playlist Items</h3>
            {loading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <Card className="p-8 text-center">
                <Play className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-600">No items in this playlist yet</p>
                <p className="text-sm text-gray-500 mt-1">Add media files to get started</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {items.map((item, index) => (
                  <Card key={item.id} className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded">
                        <span className="text-sm font-medium">{index + 1}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">{getItemIcon(item.type)}</div>
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-500 capitalize">{item.type}</div>
                      </div>
                      <div className="text-sm text-gray-600 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(item.duration)}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Playback Info */}
          {items.length > 0 && (
            <>
              <Separator />
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Playback Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Duration:</span>
                    <div className="font-medium">{formatDuration(getTotalDuration())}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Loop Mode:</span>
                    <div className="font-medium">Enabled</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Items:</span>
                    <div className="font-medium">{items.length} media files</div>
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

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {playlist.status === "draft" && (
            <Button>
              <Play className="h-4 w-4 mr-2" />
              Publish Playlist
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
