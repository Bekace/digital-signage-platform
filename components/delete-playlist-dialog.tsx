"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Trash2, AlertTriangle, X, Loader2 } from "lucide-react"

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
          description: `Playlist "${playlist.name}" has been deleted`,
        })
        onPlaylistDeleted()
        onOpenChange(false)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete playlist")
      }
    } catch (error) {
      console.error("Delete error:", error)
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete Playlist
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the playlist and all its content.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Trash2 className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800">You are about to delete:</h4>
                <p className="text-red-700 mt-1">
                  <strong>"{playlist.name}"</strong>
                </p>
                {playlist.item_count && playlist.item_count > 0 && (
                  <p className="text-red-600 text-sm mt-2">
                    This playlist contains {playlist.item_count} media item{playlist.item_count !== 1 ? "s" : ""}.
                  </p>
                )}
                {playlist.status === "active" && (
                  <p className="text-red-600 text-sm mt-1">This playlist is currently published and active.</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Playlist
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
