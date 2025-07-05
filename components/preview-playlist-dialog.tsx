"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Play, ImageIcon, Video, FileText, Music } from "lucide-react"
import { toast } from "@/hooks/use-toast"

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
      } else {
        throw new Error("Failed to fetch playlist items")
      }
    } catch (error) {
      console.error("Failed to fetch playlist items:", error)
      toast({
        title: "Error",
        description: "Failed to load playlist items",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getItemIcon = (type: string) => {
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

  if (!playlist) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            {playlist.name}
          </DialogTitle>
          <DialogDescription>{playlist.description || "No description"}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant={playlist.status === "active" ? "default" : "secondary"}>
              {playlist.status.charAt(0).toUpperCase() + playlist.status.slice(1)}
            </Badge>
            <span className="text-sm text-gray-500">
              {items.length} item{items.length !== 1 ? "s" : ""}
            </span>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading playlist items...</div>
          ) : items.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Play className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No items in playlist</h3>
                <p className="text-gray-500">Add media items to this playlist to get started</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              <h3 className="font-medium">Playlist Items:</h3>
              {items.map((item, index) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500 w-6">{index + 1}.</span>
                        {getItemIcon(item.type)}
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-500 capitalize">{item.type}</div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">{formatDuration(item.duration)}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
