"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Play, Pause } from "lucide-react"

interface Playlist {
  id: number
  name: string
  description: string
  status: string
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

  const isPublishing = playlist?.status === "draft"
  const action = isPublishing ? "publish" : "unpublish"

  const handleToggleStatus = async () => {
    if (!playlist) return

    setLoading(true)
    try {
      const endpoint = isPublishing ? "publish" : "unpublish"
      const response = await fetch(`/api/playlists/${playlist.id}/${endpoint}`, {
        method: "POST",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Playlist ${isPublishing ? "published" : "unpublished"} successfully`,
        })
        onPlaylistUpdated()
        onOpenChange(false)
      } else {
        throw new Error(`Failed to ${action} playlist`)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} playlist`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {isPublishing ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
            {isPublishing ? "Publish" : "Unpublish"} Playlist
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isPublishing ? (
              <>
                Are you sure you want to publish "{playlist?.name}"?
                <span className="block mt-2">
                  This will make the playlist available to all connected devices and screens.
                </span>
                {playlist?.item_count === 0 && (
                  <span className="block mt-2 text-amber-600 font-medium">
                    Warning: This playlist is empty. Consider adding media items before publishing.
                  </span>
                )}
              </>
            ) : (
              <>
                Are you sure you want to unpublish "{playlist?.name}"?
                <span className="block mt-2">
                  This will remove the playlist from all connected devices and screens.
                </span>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleToggleStatus}
            disabled={loading}
            className={isPublishing ? "bg-green-600 hover:bg-green-700" : "bg-orange-600 hover:bg-orange-700"}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPublishing ? "Publish" : "Unpublish"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
