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
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { Upload, UploadCloud } from "lucide-react"

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
  const [publishing, setPublishing] = useState(false)

  const handlePublish = async () => {
    if (!playlist) return

    setPublishing(true)
    try {
      const action = playlist.status === "active" ? "unpublish" : "publish"
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
      console.error("Publish error:", error)
      toast({
        title: "Error",
        description: "Failed to update playlist status",
        variant: "destructive",
      })
    } finally {
      setPublishing(false)
    }
  }

  if (!playlist) return null

  const isPublishing = playlist.status === "draft"
  const action = isPublishing ? "publish" : "unpublish"
  const actionTitle = isPublishing ? "Publish" : "Unpublish"

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {isPublishing ? <Upload className="h-5 w-5" /> : <UploadCloud className="h-5 w-5" />}
            {actionTitle} Playlist
          </AlertDialogTitle>
          <AlertDialogDescription>
            <div className="space-y-3">
              <div>
                Are you sure you want to {action} "{playlist.name}"?
              </div>

              <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Current Status:</span>
                  <Badge variant={playlist.status === "active" ? "default" : "secondary"}>
                    {playlist.status === "active" ? "Published" : "Draft"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Items:</span>
                  <span className="text-sm">{playlist.item_count || 0}</span>
                </div>
              </div>

              {isPublishing ? (
                <div className="text-sm text-green-700 bg-green-50 p-2 rounded">
                  Publishing will make this playlist available to all assigned screens.
                </div>
              ) : (
                <div className="text-sm text-orange-700 bg-orange-50 p-2 rounded">
                  Unpublishing will remove this playlist from all screens and set it to draft mode.
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={publishing}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handlePublish}
            disabled={publishing}
            className={isPublishing ? "bg-green-600 hover:bg-green-700" : "bg-orange-600 hover:bg-orange-700"}
          >
            {publishing ? `${actionTitle}ing...` : `${actionTitle} Playlist`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
