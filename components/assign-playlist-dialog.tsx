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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { PlayCircle, Clock, FileText, Loader2, AlertCircle, X } from "lucide-react"

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
  const [loadingPlaylists, setLoadingPlaylists] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) {
      loadPlaylists()
      setSelectedPlaylistId(currentPlaylistId ? currentPlaylistId.toString() : "")
    }
  }, [open, currentPlaylistId])

  const loadPlaylists = async () => {
    try {
      setLoadingPlaylists(true)
      setError("")

      console.log("🎵 [ASSIGN PLAYLIST] Loading playlists...")

      const response = await fetch("/api/playlists", {
        credentials: "include",
      })

      const data = await response.json()
      console.log("🎵 [ASSIGN PLAYLIST] Playlists response:", data)

      if (data.success) {
        setPlaylists(data.playlists || [])
      } else {
        setError(data.error || "Failed to load playlists")
      }
    } catch (err) {
      console.error("🎵 [ASSIGN PLAYLIST] Error loading playlists:", err)
      setError("Failed to connect to server")
    } finally {
      setLoadingPlaylists(false)
    }
  }

  const assignPlaylist = async () => {
    try {
      setLoading(true)
      console.log("🎵 [ASSIGN PLAYLIST] Assigning playlist:", {
        deviceId,
        playlistId: selectedPlaylistId || null,
      })

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
      console.log("🎵 [ASSIGN PLAYLIST] Assignment response:", data)

      if (data.success) {
        toast.success(data.message || "Playlist assigned successfully")
        onPlaylistAssigned()
        onOpenChange(false)
      } else {
        toast.error(data.error || "Failed to assign playlist")
      }
    } catch (error) {
      console.error("🎵 [ASSIGN PLAYLIST] Error:", error)
      toast.error("Failed to assign playlist")
    } finally {
      setLoading(false)
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
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5" />
            Assign Playlist to {deviceName}
          </DialogTitle>
          <DialogDescription>
            Choose a playlist to display on this screen. The device will automatically start playing the selected
            playlist.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Assignment */}
          {currentPlaylistId && (
            <Alert>
              <PlayCircle className="h-4 w-4" />
              <AlertDescription>
                Currently assigned: <strong>{currentPlaylistName}</strong>
              </AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {loadingPlaylists ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading playlists...</span>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : playlists.length === 0 ? (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                No playlists found. Create a playlist first to assign it to this screen.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <RadioGroup value={selectedPlaylistId} onValueChange={setSelectedPlaylistId}>
                {/* Remove Assignment Option */}
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="" id="remove" />
                  <Label htmlFor="remove" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <X className="h-4 w-4 text-red-500" />
                      <span className="font-medium">Remove playlist assignment</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">The screen will stop playing content</p>
                  </Label>
                </div>

                {/* Playlist Options */}
                {playlists.map((playlist) => (
                  <div key={playlist.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={playlist.id.toString()} id={`playlist-${playlist.id}`} />
                    <Label htmlFor={`playlist-${playlist.id}`} className="flex-1 cursor-pointer">
                      <Card className="hover:bg-gray-50 transition-colors">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{playlist.name}</CardTitle>
                            <div className="flex gap-2">
                              <Badge variant="secondary">{playlist.item_count} items</Badge>
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDuration(playlist.total_duration)}
                              </Badge>
                            </div>
                          </div>
                          {playlist.description && (
                            <CardDescription className="text-sm">{playlist.description}</CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="text-xs text-gray-500">
                            Created {new Date(playlist.created_at).toLocaleDateString()}
                          </div>
                        </CardContent>
                      </Card>
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              {/* Selected Playlist Preview */}
              {selectedPlaylist && (
                <Alert>
                  <PlayCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Selected:</strong> {selectedPlaylist.name} ({selectedPlaylist.item_count} items,{" "}
                    {formatDuration(selectedPlaylist.total_duration)})
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={assignPlaylist} disabled={loading || loadingPlaylists}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Assigning...
              </>
            ) : selectedPlaylistId === "" ? (
              "Remove Assignment"
            ) : (
              "Assign Playlist"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
