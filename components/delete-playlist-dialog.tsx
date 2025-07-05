"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertTriangle } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Playlist {
  id: number
  name: string
  description: string
  status: string
}

interface DeletePlaylistDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  playlist: Playlist | null
  onPlaylistDeleted?: () => void
}

export function DeletePlaylistDialog({ open, onOpenChange, playlist, onPlaylistDeleted }: DeletePlaylistDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!playlist) return

    setLoading(true)

    try {
      const response = await fetch(`/api/playlists/${playlist.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Playlist deleted successfully",
        })
        onOpenChange(false)
        onPlaylistDeleted?.()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete playlist")
      }
    } catch (error) {
      console.error("Delete playlist error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete playlist",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!playlist) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Delete Playlist
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{playlist.name}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
