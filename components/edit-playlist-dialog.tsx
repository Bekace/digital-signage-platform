"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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

interface EditPlaylistDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  playlist: Playlist | null
  onPlaylistUpdated: () => void
}

export function EditPlaylistDialog({ open, onOpenChange, playlist, onPlaylistUpdated }: EditPlaylistDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (playlist) {
      setName(playlist.name)
      setDescription(playlist.description || "")
    }
  }, [playlist])

  const handleUpdate = async () => {
    if (!playlist || !name.trim()) return

    setUpdating(true)
    try {
      const response = await fetch(`/api/playlists/${playlist.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Playlist updated successfully",
        })
        onPlaylistUpdated()
        onOpenChange(false)
      } else {
        throw new Error("Failed to update playlist")
      }
    } catch (error) {
      console.error("Update error:", error)
      toast({
        title: "Error",
        description: "Failed to update playlist",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Playlist</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter playlist name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter playlist description"
              rows={3}
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={updating}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={updating || !name.trim()}>
            {updating ? "Updating..." : "Update Playlist"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
