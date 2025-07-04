"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, Play } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface PublishPlaylistDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  playlist: {
    id: number
    name: string
    description: string
    status: string
    items: number
  }
  onPlaylistPublished?: () => void
}

export function PublishPlaylistDialog({
  open,
  onOpenChange,
  playlist,
  onPlaylistPublished,
}: PublishPlaylistDialogProps) {
  const [loading, setLoading] = useState(false)

  const handlePublish = async () => {
    if (playlist.items === 0) {
      toast({
        title: "Cannot Publish",
        description: "Please add at least one media item to the playlist before publishing",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/playlists/${playlist.id}/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Playlist published successfully",
        })
        onOpenChange(false)
        onPlaylistPublished?.()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to publish playlist")
      }
    } catch (error) {
      console.error("Publish playlist error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to publish playlist",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const canPublish = playlist.items > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Publish Playlist
          </DialogTitle>
          <DialogDescription>
            Review and publish your playlist to make it available for assignment to screens
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Playlist Info */}
          <div className="space-y-2">
            <h4 className="font-medium">{playlist.name}</h4>
            {playlist.description && <p className="text-sm text-gray-600">{playlist.description}</p>}
            <div className="flex items-center gap-2">
              <Badge variant="outline">{playlist.status.charAt(0).toUpperCase() + playlist.status.slice(1)}</Badge>
              <span className="text-sm text-gray-600">
                {playlist.items} item{playlist.items !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Validation */}
          <div className="space-y-2">
            <h5 className="font-medium text-sm">Publishing Requirements:</h5>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                {canPublish ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <span className={canPublish ? "text-green-700" : "text-red-700"}>At least 1 media item</span>
              </div>
            </div>
          </div>

          {!canPublish && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                Please add media items to your playlist before publishing. Go to the Media page to upload content, then
                add items to this playlist.
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handlePublish} disabled={loading || !canPublish}>
              {loading ? "Publishing..." : "Publish Playlist"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
