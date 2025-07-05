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
import { toast } from "@/hooks/use-toast"

interface Playlist {
  id: number
  name: string
  description: string
  status: string
  created_at: string
  updated_at: string
  item_count?: number
}

interface DeletePlaylistDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  playlist: Playlist | null
  onPlaylistDeleted: () => void
}

export function DeletePlaylistDialog({ open, onOpenChange, playlist, onPlaylistDeleted }: DeletePlaylistDialogProps) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!playlist) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/playlists/${playlist.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Playlist deleted successfully",
        })
        onPlaylistDeleted()
        onOpenChange(false)
      } else {
        throw new Error("Failed to delete playlist")
      }
    } catch (error) {
      console.error("Delete error:", error)
      toast({
        title: "Error",
        description: "Failed to delete playlist",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  if (!playlist) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Playlist</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{playlist.name}"? This action cannot be undone and will remove all playlist
            items.
            {playlist.item_count && playlist.item_count > 0 && (
              <span className="block mt-2 font-medium text-red-600">
                This playlist contains {playlist.item_count} item{playlist.item_count !== 1 ? "s" : ""}.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700">
            {deleting ? "Deleting..." : "Delete Playlist"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
