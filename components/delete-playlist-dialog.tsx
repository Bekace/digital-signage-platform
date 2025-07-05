"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Trash2, AlertTriangle, X } from "lucide-react"

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
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

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
      setLoading(false)
    }
  }

  if (!playlist) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Delete Playlist
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this playlist? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">{playlist.name}</h4>
            {playlist.description && <p className="text-sm text-gray-600 mb-2">{playlist.description}</p>}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>{playlist.item_count || 0} items</span>
              <span>Status: {playlist.status}</span>
            </div>
          </div>

          {playlist.status === "active" && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This playlist is currently published and may be playing on screens. Deleting it will stop playback.
              </AlertDescription>
            </Alert>
          )}

          {(playlist.item_count || 0) > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This playlist contains {playlist.item_count} media items. The items themselves will not be deleted, only
                removed from this playlist.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            <Trash2 className="h-4 w-4 mr-2" />
            {loading ? "Deleting..." : "Delete Playlist"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
