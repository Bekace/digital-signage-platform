"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Upload } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Playlist {
  id: number
  name: string
  description: string
  status: string
}

interface PublishPlaylistDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  playlist: Playlist | null
  onPlaylistPublished: () => void
}

export function PublishPlaylistDialog({
  open,
  onOpenChange,
  playlist,
  onPlaylistPublished,
}: PublishPlaylistDialogProps) {
  const [publishing, setPublishing] = useState(false)

  const handlePublish = async () => {
    if (!playlist) return

    setPublishing(true)
    try {
      const response = await fetch(`/api/playlists/${playlist.id}/publish`, {
        method: "POST",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Playlist published successfully",
        })
        onPlaylistPublished()
        onOpenChange(false)
      } else {
        const error = await response.json()
        throw new Error(error.message || "Failed to publish playlist")
      }
    } catch (error) {
      console.error("Publish error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to publish playlist",
        variant: "destructive",
      })
    } finally {
      setPublishing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Publish Playlist
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <h4 className="font-medium mb-2">Publishing "{playlist?.name}"</h4>
            <p className="text-sm text-gray-600">
              Once published, this playlist will be available for assignment to screens and devices.
            </p>
          </div>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Published playlists can be assigned to screens and will be visible to all users in your organization.
            </AlertDescription>
          </Alert>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Make sure your playlist contains the media items you want before publishing.
            </AlertDescription>
          </Alert>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={publishing}>
            Cancel
          </Button>
          <Button onClick={handlePublish} disabled={publishing}>
            {publishing ? "Publishing..." : "Publish Playlist"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
