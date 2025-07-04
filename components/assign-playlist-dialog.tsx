"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Play, Monitor, Clock, X } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Playlist {
  id: number
  name: string
  description: string
  items: number
  duration: string
  status: string
}

interface Device {
  id: number
  name: string
  current_playlist?: string
}

interface AssignPlaylistDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  device: Device
  onPlaylistAssigned?: () => void
}

export function AssignPlaylistDialog({ open, onOpenChange, device, onPlaylistAssigned }: AssignPlaylistDialogProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [fetchingPlaylists, setFetchingPlaylists] = useState(true)

  const fetchPlaylists = async () => {
    try {
      const response = await fetch("/api/playlists")
      if (response.ok) {
        const data = await response.json()
        // Only show published playlists
        const publishedPlaylists = (data.playlists || []).filter((playlist: Playlist) => playlist.status === "active")
        setPlaylists(publishedPlaylists)
      } else {
        throw new Error("Failed to fetch playlists")
      }
    } catch (error) {
      console.error("Failed to fetch playlists:", error)
      toast({
        title: "Error",
        description: "Failed to load playlists",
        variant: "destructive",
      })
    } finally {
      setFetchingPlaylists(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchPlaylists()
    }
  }, [open])

  const handleAssign = async () => {
    if (!selectedPlaylistId) {
      toast({
        title: "Error",
        description: "Please select a playlist to assign",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/devices/${device.id}/playlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playlistId: Number.parseInt(selectedPlaylistId),
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Playlist assigned successfully",
        })
        onOpenChange(false)
        onPlaylistAssigned?.()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to assign playlist")
      }
    } catch (error) {
      console.error("Assign playlist error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign playlist",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUnassign = async () => {
    setLoading(true)

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
        const error = await response.json()
        throw new Error(error.error || "Failed to unassign playlist")
      }
    } catch (error) {
      console.error("Unassign playlist error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to unassign playlist",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Assign Playlist to {device.name}
          </DialogTitle>
          <DialogDescription>Select a published playlist to assign to this screen</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Assignment */}
          {device.current_playlist && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">Currently Assigned:</p>
                  <p className="text-sm text-blue-700">{device.current_playlist}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUnassign}
                  disabled={loading}
                  className="text-red-600 hover:text-red-700 bg-transparent"
                >
                  <X className="h-4 w-4 mr-1" />
                  Unassign
                </Button>
              </div>
            </div>
          )}

          {/* Playlist Selection */}
          {fetchingPlaylists ? (
            <div className="text-center py-4">Loading playlists...</div>
          ) : playlists.length === 0 ? (
            <div className="text-center py-8">
              <Play className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Published Playlists</h3>
              <p className="text-gray-500 mb-4">
                You need to publish at least one playlist before you can assign it to a screen.
              </p>
              <p className="text-sm text-gray-400">Go to Playlists → Create/Edit a playlist → Publish it</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h4 className="font-medium">Available Playlists:</h4>
              <RadioGroup value={selectedPlaylistId} onValueChange={setSelectedPlaylistId}>
                <div className="grid gap-3">
                  {playlists.map((playlist) => (
                    <div key={playlist.id} className="flex items-center space-x-3">
                      <RadioGroupItem value={playlist.id.toString()} id={`playlist-${playlist.id}`} />
                      <Label htmlFor={`playlist-${playlist.id}`} className="flex-1 cursor-pointer">
                        <Card className="hover:bg-gray-50">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">{playlist.name}</CardTitle>
                              <Badge className="bg-green-100 text-green-800">Published</Badge>
                            </div>
                            {playlist.description && (
                              <CardDescription className="text-sm">{playlist.description}</CardDescription>
                            )}
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Play className="h-3 w-3" />
                                {playlist.items} items
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {playlist.duration}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={loading || !selectedPlaylistId || playlists.length === 0}>
              {loading ? "Assigning..." : "Assign Playlist"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
