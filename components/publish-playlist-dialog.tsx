"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Play, Pause, AlertCircle, CheckCircle, X } from "lucide-react"

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
  onPlaylistPublished: () => void
}

export function PublishPlaylistDialog({
  open,
  onOpenChange,
  playlist,
  onPlaylistPublished,
}: PublishPlaylistDialogProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const isPublishing = playlist?.status === "draft"
  const action = isPublishing ? "publish" : "unpublish"
  const actionTitle = isPublishing ? "Publish Playlist" : "Unpublish Playlist"

  const handleAction = async () => {
    if (!playlist) return

    setLoading(true)
    try {
      const response = await fetch(`/api/playlists/${playlist.id}/${action}`, {
        method: "POST",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Playlist ${action}ed successfully`,
        })
        onPlaylistPublished()
        onOpenChange(false)
      } else {
        throw new Error(`Failed to ${action} playlist`)
      }
    } catch (error) {
      console.error(`${action} error:`, error)
      toast({
        title: "Error",
        description: `Failed to ${action} playlist`,
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
            {isPublishing ? <Play className="h-5 w-5 text-green-600" /> : <Pause className="h-5 w-5 text-orange-600" />}
            {actionTitle}
          </DialogTitle>
          <DialogDescription>
            {isPublishing
              ? "Make this playlist available for playback on screens"
              : "Remove this playlist from active playback"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">{playlist.name}</h4>
            {playlist.description && <p className="text-sm text-gray-600 mb-2">{playlist.description}</p>}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>{playlist.item_count || 0} items</span>
              <span>Current status: {playlist.status}</span>
            </div>
          </div>

          {isPublishing ? (
            <>
              {(playlist.item_count || 0) === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This playlist is empty. Add media items before publishing to ensure proper playback.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    This playlist contains {playlist.item_count} items and is ready for publication. It will become
                    available for assignment to screens.
                  </AlertDescription>
                </Alert>
              )}
            </>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Unpublishing will remove this playlist from all assigned screens and stop playback. You can republish it
                later.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleAction}
            disabled={loading || (isPublishing && (playlist.item_count || 0) === 0)}
            variant={isPublishing ? "default" : "secondary"}
          >
            {isPublishing ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
            {loading ? `${isPublishing ? "Publishing" : "Unpublishing"}...` : actionTitle}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
