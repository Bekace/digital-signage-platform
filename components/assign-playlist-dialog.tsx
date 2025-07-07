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
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { PlayCircle, Clock, FileText, X } from "lucide-react"
import { toast } from "sonner"

interface Playlist {
  id: number
  name: string
  description?: string
  item_count: number
  total_duration: number
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
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      loadPlaylists()
      setSelectedPlaylistId(currentPlaylistId?.toString() || "")
    }
  }, [open, currentPlaylistId])

  const loadPlaylists = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/playlists", {
        credentials: "include",
      })

      const data = await response.json()

      if (data.success) {
        setPlaylists(data.playlists || [])
      } else {
        toast.error("Failed to load playlists")
      }
    } catch (error) {
      console.error("Error loading playlists:", error)
      toast.error("Failed to load playlists")
    } finally {
      setLoading(false)
    }
  }

  const handleAssignPlaylist = async () => {
    try {
      setSaving(true)

      const response = await fetch(`/api/devices/${deviceId}/assign-playlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          playlistId: selectedPlaylistId ? Number.parseInt(selectedPlaylistId) : null,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        onPlaylistAssigned()
        onOpenChange(false)
      } else {
        toast.error(data.error || "Failed to assign playlist")
      }
    } catch (error) {
      console.error("Error assigning playlist:", error)
      toast.error("Failed to assign playlist")
    } finally {
      setSaving(false)
    }
  }

  const handleRemovePlaylist = async () => {
    try {
      setSaving(true)

      const response = await fetch(`/api/devices/${deviceId}/assign-playlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          playlistId: null,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Playlist removed from device")
        onPlaylistAssigned()
        onOpenChange(false)
      } else {
        toast.error(data.error || "Failed to remove playlist")
      }
    } catch (error) {
      console.error("Error removing playlist:", error)
      toast.error("Failed to remove playlist")
    } finally {
      setSaving(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  const selectedPlaylist = playlists.find((p) => p.id.toString() === selectedPlaylistId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Playlist</DialogTitle>
          <DialogDescription>
            Choose a playlist to assign to <strong>{deviceName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Assignment */}
          {currentPlaylistId && (
            <div className="p-3 bg-blue-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PlayCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Currently assigned:</span>
                  <span className="text-sm">{currentPlaylistName}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemovePlaylist}
                  disabled={saving}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Playlist Selection */}
          <div className="space-y-2">
            <Label htmlFor="playlist">Select Playlist</Label>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <Select value={selectedPlaylistId} onValueChange={setSelectedPlaylistId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a playlist..." />
                </SelectTrigger>
                <SelectContent>
                  {playlists.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No playlists available</p>
                      <p className="text-xs">Create a playlist first</p>
                    </div>
                  ) : (
                    playlists.map((playlist) => (
                      <SelectItem key={playlist.id} value={playlist.id.toString()}>
                        <div className="flex items-center justify-between w-full">
                          <span>{playlist.name}</span>
                          <div className="flex items-center gap-2 ml-2">
                            <Badge variant="outline" className="text-xs">
                              {playlist.item_count} items
                            </Badge>
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Selected Playlist Info */}
          {selectedPlaylist && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{selectedPlaylist.name}</span>
                  <Badge variant="secondary">{selectedPlaylist.item_count} items</Badge>
                </div>
                {selectedPlaylist.description && (
                  <p className="text-sm text-gray-600">{selectedPlaylist.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDuration(selectedPlaylist.total_duration)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    <span>Created {new Date(selectedPlaylist.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleAssignPlaylist}
            disabled={saving || !selectedPlaylistId || selectedPlaylistId === currentPlaylistId?.toString()}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
