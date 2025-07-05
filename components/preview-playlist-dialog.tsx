"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Play, ImageIcon, Video, FileText, Music } from "lucide-react"

interface Playlist {
  id: number
  name: string
  description: string
  status: string
}

interface PlaylistItem {
  id: number
  name: string
  type: string
  duration: number
  url: string
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
    } finally {
      setLoading(false)
    }
  }

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "image":
        return <ImageIcon className="h-4 w-4" />
      case "video":
        return <Video className="h-4 w-4" />
      case "audio":
        return <Music className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            {playlist?.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant={playlist?.status === "active" ? "default" : "secondary"}>
              {playlist?.status === "active" ? "Published" : "Draft"}
            </Badge>
            <span className="text-sm text-gray-500">{items.length} items</span>
          </div>

          {playlist?.description && <p className="text-sm text-gray-600">{playlist.description}</p>}

          <div className="border rounded-lg max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading playlist items...</div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Play className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No items in this playlist yet</p>
                <p className="text-xs mt-1">Add media files to get started</p>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {items.map((item, index) => (
                  <Card key={item.id} className="p-3">
                    <CardContent className="p-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded">
                            {getFileIcon(item.type)}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-gray-500 capitalize">{item.type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-mono">{formatDuration(item.duration)}</p>
                          <p className="text-xs text-gray-500">#{index + 1}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
