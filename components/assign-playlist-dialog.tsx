"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Play, List } from "lucide-react"

interface Playlist {
  id: number
  name: string
  description?: string
  status: string
  itemCount?: number
}

interface AssignPlaylistDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deviceId: number
  deviceName: string
  currentPlaylistId?: number
  onPlaylistAssigned: () => void
}

export function AssignPlaylistDialog({
  open,
  onOpenChange,
  deviceId,
  deviceName,
  currentPlaylistId,
  onPlaylistAssigned,
}: AssignPlaylistDialogProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [fetchingPlaylists, setFetchingPlaylists] = useState(false)

  const fetchPlaylists = async () => {
    try {
      setFetchingPlaylists(true)
      const response = await fetch("/api/playlists", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && Array.isArray(data.playlists)) {
          setPlaylists(data.playlists)
        }
      }
    } catch (error) {
      console.error("Failed to fetch playlists:", error)
    } finally {
      setFetchingPlaylists(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchPlaylists()
      setSelectedPlaylistId(currentPlaylistId ? currentPlaylistId.toString() : "")
    }
  }, [open, currentPlaylistId])

  const handleAssignPlaylist = async () => {
    try {
      setLoading(true)

      const playlistId = selectedPlaylistId === "none" ? null : Number.parseInt(selectedPlaylistId)

      const response = await fetch(`/api/devices/${deviceId}/assign-playlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ playlistId }),
      })

      const data = await response.json()

      if (data.success) {
        onPlaylistAssigned()
        onOpenChange(false)
      } else {
        console.error("Failed to assign playlist:", data.error)
      }
    } catch (error) {
      console.error("Error assigning playlist:", error)
    } finally {
      setLoading(false)
    }
  }

  const selectedPlaylist = playlists.find((p) => p.id.toString() === selectedPlaylistId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Assign Playlist
          </DialogTitle>
          <DialogDescription>
            Choose a playlist to assign to <strong>{deviceName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {fetchingPlaylists ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading playlists...</span>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Playlist</label>
              <Select value={selectedPlaylistId} onValueChange={setSelectedPlaylistId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a playlist..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <div className="flex items-center gap-2">
                      <span>No playlist (remove current)</span>
                    </div>
                  </SelectItem>
                  {playlists.map((playlist) => (
                    <SelectItem key={playlist.id} value={playlist.id.toString()}>
                      <div className="flex items-center gap-2">
                        <List className="h-4 w-4" />
                        <span>{playlist.name}</span>
                        {playlist.itemCount !== undefined && (
                          <Badge variant="secondary" className="ml-auto">
                            {playlist.itemCount} items
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedPlaylist && (
            <div className="rounded-lg border p-3 bg-muted/50">
              <h4 className="font-medium">{selectedPlaylist.name}</h4>
              {selectedPlaylist.description && (
                <p className="text-sm text-muted-foreground mt-1">{selectedPlaylist.description}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={selectedPlaylist.status === "active" ? "default" : "secondary"}>
                  {selectedPlaylist.status}
                </Badge>
                {selectedPlaylist.itemCount !== undefined && (
                  <Badge variant="outline">{selectedPlaylist.itemCount} items</Badge>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleAssignPlaylist} disabled={loading || !selectedPlaylistId}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {selectedPlaylistId === "none" ? "Remove Playlist" : "Assign Playlist"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
