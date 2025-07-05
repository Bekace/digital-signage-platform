"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Play, Pause, X, Loader2, AlertCircle } from "lucide-react"

interface Playlist {
  id: number
  name: string
  description: string
  status: string
  created_at: string
  updated_at: string
  item_count?: number
}

interface PublishPlaylistDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  playlist: Playlist | null
  onPlaylistUpdated: () => void
}

export function PublishPlaylistDialog({ open, onOpenChange, playlist, onPlaylistUpdated }: PublishPlaylistDialogProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const isPublished = playlist?.status === "active"
  const action = isPublished ? "unpublish" : "publish"

  const handleTogglePublish = async () => {
    if (!playlist) return

    setLoading(true)
    try {
      const endpoint = isPublished ? "unpublish" : "publish"
      const response = await fetch(`/api/playlists/${playlist.id}/${endpoint}`, {
        method: "POST",
      })

      if (response.ok) {
        const newStatus = isPublished ? "draft" : "active"
        toast({
          title: "Success",
          description: `Playlist "${playlist.name}" has been ${isPublished ? "unpublished" : "published"}`,
        })
        onPlaylistUpdated()
        onOpenChange(false)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to ${action} playlist`)
      }
    } catch (error) {
      console.error(`${action} error:`, error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${action} playlist`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!playlist) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isPublished ? (
              <>
                <Pause className="h-5 w-5 text-orange-600" />
                Unpublish Playlist
              </>
            ) : (
              <>
                <Play className="h-5 w-5 text-green-600" />
                Publish Playlist
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isPublished
              ? "This will make the playlist inactive and stop it from being displayed on screens."
              : "This will make the playlist active and available for display on screens."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className={`border rounded-lg p-4 ${isPublished ? "bg-orange-50 border-orange-200" : "bg-green-50 border-green-200"}`}
          >
            <div className="flex items-start gap-3">
              {isPublished ? (
                <Pause className="h-5 w-5 text-orange-600 mt-0.5" />
              ) : (
                <Play className="h-5 w-5 text-green-600 mt-0.5" />
              )}
              <div>
                <h4 className={`font-medium ${isPublished ? "text-orange-800" : "text-green-800"}`}>
                  {isPublished ? "Unpublish" : "Publish"} "{playlist.name}"
                </h4>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span className={isPublished ? "text-orange-700" : "text-green-700"}>Items:</span>
                    <span className={`font-medium ${isPublished ? "text-orange-800" : "text-green-800"}`}>
                      {playlist.item_count || 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={isPublished ? "text-orange-700" : "text-green-700"}>Current Status:</span>
                    <span className={`font-medium capitalize ${isPublished ? "text-orange-800" : "text-green-800"}`}>
                      {playlist.status}
                    </span>
                  </div>
                </div>

                {!isPublished && playlist.item_count === 0 && (
                  <div className="mt-3 flex items-start gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <p className="text-yellow-800 text-sm">
                      This playlist is empty. Add media items before publishing.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              variant={isPublished ? "destructive" : "default"}
              onClick={handleTogglePublish}
              disabled={loading || (!isPublished && playlist.item_count === 0)}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isPublished ? "Unpublishing..." : "Publishing..."}
                </>
              ) : (
                <>
                  {isPublished ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Unpublish
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Publish
                    </>
                  )}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
