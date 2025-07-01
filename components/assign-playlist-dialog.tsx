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
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Loader2, PlayCircle, FileText, Trash2 } from "lucide-react"

interface Playlist {
  id: number
  name: string
  description?: string
  item_count: number
  duration_minutes: number
  status: string
  created_at: string
}

interface AssignPlaylistDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deviceId: string
  deviceName: string
  currentPlaylistId?: number | null
  currentPlaylistName?: string | null
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
  const [loading, setLoading] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<number | null>(currentPlaylistId || null)

  // Load playlists when dialog opens
  useEffect(() => {
    if (open) {
      loadPlaylists()
    }
  }, [open])

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

  const assignPlaylist = async (playlistId: number | null) => {
    try {
      setAssigning(true)

      const response = await fetch(`/api/devices/${deviceId}/assign-playlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          playlistId,
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
      setAssigning(false)
    }
  }

  const handleAssign = () => {
    assignPlaylist(selectedPlaylistId)
  }

  const handleRemove = () => {
    assignPlaylist(null)
  }

  const getPlaylistIcon = (playlist: Playlist) => {
    if (playlist.item_count === 0) return <FileText className="h-4 w-4" />
    // You could enhance this to show different icons based on playlist content
    return <PlayCircle className="h-4 w-4" />
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Playlist to Screen</DialogTitle>
          <DialogDescription>
            Choose a playlist to display on "{deviceName}". The selected playlist will start playing immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Assignment */}
          {currentPlaylistId && currentPlaylistName && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Current Assignment</h4>
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PlayCircle className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">{currentPlaylistName}</span>
                      <Badge variant="secondary">Currently Playing</Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemove}
                      disabled={assigning}
                      className="text-red-600 hover:text-red-700 bg-transparent"
                    >
                      {assigning ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <Separator />
            </div>
          )}

          {/* Available Playlists */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Available Playlists</h4>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading playlists...</span>
              </div>
            ) : playlists.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <PlayCircle className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600">No playlists found</p>
                  <p className="text-sm text-gray-500 mt-1">Create a playlist first to assign it to this screen</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {playlists.map((playlist) => (
                  <Card
                    key={playlist.id}
                    className={`cursor-pointer transition-colors ${
                      selectedPlaylistId === playlist.id
                        ? "border-blue-500 bg-blue-50"
                        : "hover:border-gray-300 hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedPlaylistId(playlist.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">{getPlaylistIcon(playlist)}</div>
                          <div className="min-w-0 flex-1">
                            <h5 className="font-medium truncate">{playlist.name}</h5>
                            {playlist.description && (
                              <p className="text-sm text-gray-600 truncate">{playlist.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-xs text-gray-500">
                                {playlist.item_count} {playlist.item_count === 1 ? "item" : "items"}
                              </span>
                              <span className="text-xs text-gray-500">
                                ~{playlist.duration_minutes} {playlist.duration_minutes === 1 ? "minute" : "minutes"}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {playlist.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {selectedPlaylistId === playlist.id && (
                            <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-white" />
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedPlaylistId || assigning || selectedPlaylistId === currentPlaylistId}
          >
            {assigning ? (
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
