"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Play, Monitor, Clock, X } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Device {
  id: number
  name: string
  device_id: string
  current_playlist?: string
}

interface Playlist {
  id: number
  name: string
  description: string
  status: string
  items: number
  duration: string
}

interface AssignPlaylistDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  device: Device | null
  onPlaylistAssigned?: () => void
}

export function AssignPlaylistDialog({ open, onOpenChange, device, onPlaylistAssigned }: AssignPlaylistDialogProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(false)
  const [assigning, setAssigning] = useState(false)

  const fetchPlaylists = async () => {
    if (!open) return

    setLoading(true)
    try {
      console.log("🎵 Fetching playlists for assignment...")
      const response = await fetch("/api/playlists")
      const data = await response.json()

      console.log("🎵 Playlists API response:", data)

      if (data.success) {
        const allPlaylists = data.playlists || []
        // Filter for published playlists (status = 'active')
        const publishedPlaylists = allPlaylists.filter((p: Playlist) => p.status === "active")

        console.log("🎵 All playlists:", allPlaylists.length)
        console.log("🎵 Published playlists:", publishedPlaylists.length)
        console.log("🎵 Published playlist details:", publishedPlaylists)

        setPlaylists(publishedPlaylists)
      } else {
        console.error("🎵 Failed to fetch playlists:", data.error)
        toast({
          title: "Error",
          description: "Failed to load playlists",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("🎵 Playlist fetch error:", error)
      toast({
        title: "Error",
        description: "Failed to load playlists",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlaylists()
  }, [open])

  const handleAssignPlaylist = async (playlistId: number) => {
    if (!device) return

    setAssigning(true)
    try {
      console.log("🎵 Assigning playlist", playlistId, "to device", device.id)

      const response = await fetch(`/api/devices/${device.id}/playlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playlist_id: playlistId,
        }),
      })

      const data = await response.json()
      console.log("🎵 Assignment response:", data)

      if (data.success) {
        toast({
          title: "Success",
          description: "Playlist assigned successfully",
        })
        onOpenChange(false)
        onPlaylistAssigned?.()
      } else {
        throw new Error(data.error || "Failed to assign playlist")
      }
    } catch (error) {
      console.error("🎵 Assignment error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign playlist",
        variant: "destructive",
      })
    } finally {
      setAssigning(false)
    }
  }

  const handleUnassignPlaylist = async () => {
    if (!device) return

    setAssigning(true)
    try {
      const response = await fetch(`/api/devices/${device.id}/playlist`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Playlist unassigned successfully",
        })
        onOpenChange(false)
        onPlaylistAssigned?.()
      } else {
        throw new Error("Failed to unassign playlist")
      }
    } catch (error) {
      console.error("Unassign error:", error)
      toast({
        title: "Error",
        description: "Failed to unassign playlist",
        variant: "destructive",
      })
    } finally {
      setAssigning(false)
    }
  }

  if (!device) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Assign Playlist to {device.name || "Device"}
          </DialogTitle>
          <DialogDescription>Choose a published playlist to display on this screen</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Assignment */}
          {device.current_playlist && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Currently Assigned</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUnassignPlaylist}
                    disabled={assigning}
                    className="h-7 bg-transparent"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Unassign
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm font-medium text-blue-800">{device.current_playlist}</p>
              </CardContent>
            </Card>
          )}

          {/* Available Playlists */}
          <div className="space-y-3">
            <h4 className="font-medium">Available Playlists</h4>

            {loading ? (
              <div className="text-center py-8">
                <div className="text-sm text-gray-500">Loading playlists...</div>
              </div>
            ) : playlists.length === 0 ? (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="text-center py-6">
                  <Play className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
                  <h3 className="font-medium text-yellow-800 mb-1">No published playlists available</h3>
                  <p className="text-sm text-yellow-700">Create and publish a playlist first.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 max-h-60 overflow-y-auto">
                {playlists.map((playlist) => (
                  <Card key={playlist.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{playlist.name}</h4>
                            <Badge className="bg-green-100 text-green-800 text-xs">{playlist.status}</Badge>
                          </div>
                          {playlist.description && <p className="text-sm text-gray-600 mb-2">{playlist.description}</p>}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Play className="h-3 w-3" />
                              {playlist.items} items
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {playlist.duration}
                            </span>
                          </div>
                        </div>
                        <Button onClick={() => handleAssignPlaylist(playlist.id)} disabled={assigning} size="sm">
                          {assigning ? "Assigning..." : "Assign"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
