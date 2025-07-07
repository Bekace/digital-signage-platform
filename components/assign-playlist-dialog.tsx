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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { PlayCircle, AlertCircle, Loader2 } from "lucide-react"

interface Playlist {
  id: number
  name: string
  description?: string
  media_count: number
  created_at: string
}

interface AssignPlaylistDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deviceId: string
  deviceName: string
  currentPlaylistId?: number
  currentPlaylistName?: string
  onPlaylistAssigned: () => void
}

export function AssignPlaylistDialog({
  open,
  onOpenChange,
  deviceId,
  deviceName,
  currentPlaylistId,
  currentPlaylistName,
  onPlaylistAssigned,
}: AssignPlaylistDialogProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) {
      loadPlaylists()
      setSelectedPlaylistId(currentPlaylistId?.toString() || "")
    }
  }, [open, currentPlaylistId])

  const loadPlaylists = async () => {
    try {
      setLoading(true)
      setError("")

      const response = await fetch("/api/playlists", {
        credentials: "include",
      })

      const data = await response.json()

      if (data.success) {
        setPlaylists(data.playlists || [])
      } else {
        setError(data.error || "Failed to load playlists")
      }
    } catch (err) {
      console.error("Error loading playlists:", err)
      setError("Failed to connect to server")
    } finally {
      setLoading(false)
    }
  }

  const handleAssign = async () => {
    if (!selectedPlaylistId) {
      toast.error("Please select a playlist")
      return
    }

    try {
      setSubmitting(true)
      setError("")

      const response = await fetch(`/api/devices/${deviceId}/playlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          playlistId: Number.parseInt(selectedPlaylistId),
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Playlist assigned successfully!")
        onPlaylistAssigned()
        onOpenChange(false)
      } else {
        setError(data.error || "Failed to assign playlist")
      }
    } catch (err) {
      console.error("Error assigning playlist:", err)
      setError("Failed to connect to server")
    } finally {
      setSubmitting(false)
    }
  }

  const handleUnassign = async () => {
    try {
      setSubmitting(true)
      setError("")

      const response = await fetch(`/api/devices/${deviceId}/playlist`, {
        method: "DELETE",
        credentials: "include",
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Playlist unassigned successfully!")
        onPlaylistAssigned()
        onOpenChange(false)
      } else {
        setError(data.error || "Failed to unassign playlist")
      }
    } catch (err) {
      console.error("Error unassigning playlist:", err)
      setError("Failed to connect to server")
    } finally {
      setSubmitting(false)
    }
  }

  const selectedPlaylist = playlists.find((p) => p.id.toString() === selectedPlaylistId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5" />
            Assign Playlist
          </DialogTitle>
          <DialogDescription>
            Assign a playlist to <strong>{deviceName}</strong>. The selected content will be displayed on this screen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {currentPlaylistId && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 text-blue-800">
                <PlayCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Currently Assigned:</span>
              </div>
              <p className="text-sm text-blue-700 mt-1">{currentPlaylistName || `Playlist #${currentPlaylistId}`}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Select Playlist</label>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Loading playlists...</span>
              </div>
            ) : playlists.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <PlayCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No playlists available</p>
                <p className="text-sm">Create a playlist first to assign content</p>
              </div>
            ) : (
              <Select value={selectedPlaylistId} onValueChange={setSelectedPlaylistId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a playlist..." />
                </SelectTrigger>
                <SelectContent>
                  {playlists.map((playlist) => (
                    <SelectItem key={playlist.id} value={playlist.id.toString()}>
                      <div className="flex flex-col">
                        <span className="font-medium">{playlist.name}</span>
                        <span className="text-xs text-gray-500">
                          {playlist.media_count} items • Created {new Date(playlist.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedPlaylist && (
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-green-800">
                <PlayCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Selected Playlist:</span>
              </div>
              <p className="text-sm text-green-700 mt-1">{selectedPlaylist.name}</p>
              <p className="text-xs text-green-600 mt-1">
                {selectedPlaylist.media_count} media items
                {selectedPlaylist.description && ` • ${selectedPlaylist.description}`}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          {currentPlaylistId && (
            <Button variant="outline" onClick={handleUnassign} disabled={submitting || loading}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Unassigning...
                </>
              ) : (
                "Unassign Current"
              )}
            </Button>
          )}
          <Button onClick={handleAssign} disabled={!selectedPlaylistId || submitting || loading}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Assigning...
              </>
            ) : (
              "Assign Playlist"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
