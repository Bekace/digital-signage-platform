"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"

interface Playlist {
  id: number
  name: string
  description: string
  status: string
}

interface EditPlaylistDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  playlist: Playlist | null
  onPlaylistUpdated?: () => void
}

export function EditPlaylistDialog({ open, onOpenChange, playlist, onPlaylistUpdated }: EditPlaylistDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (playlist) {
      setName(playlist.name)
      setDescription(playlist.description)
    }
  }, [playlist])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!playlist || !name.trim()) {
      toast({
        title: "Error",
        description: "Playlist name is required",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

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
        onOpenChange(false)
        onPlaylistUpdated?.()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to update playlist")
      }
    } catch (error) {
      console.error("Update playlist error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update playlist",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Playlist</DialogTitle>
          <DialogDescription>Update your playlist information</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Playlist Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter playlist name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter playlist description"
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Playlist"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
