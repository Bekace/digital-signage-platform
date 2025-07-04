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
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Monitor, Play, Clock, Calendar } from "lucide-react"

interface Playlist {
  id: string
  name: string
  description?: string
  items: number
  duration: string
  status: "draft" | "active" | "scheduled"
  lastModified: string
}

interface Device {
  id: string
  name: string
  status: string
  location?: string
}

interface AssignPlaylistDialogProps {
  device: Device | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onAssignmentComplete: () => void
}

export function AssignPlaylistDialog({ device, open, onOpenChange, onAssignmentComplete }: AssignPlaylistDialogProps) {
  const { toast } = useToast()
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>("")
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false)

  useEffect(() => {
    if (open && device) {
      fetchPlaylists()
      fetchCurrentPlaylist()
    }
  }, [open, device])

  const fetchPlaylists = async () => {
    try {
      setIsLoadingPlaylists(true)
      const response = await fetch("/api/playlists", {
        credentials: "include",
      })

      const data = await response.json()

      if (data.success) {
        setPlaylists(data.playlists || [])
      } else {
        throw new Error(data.error || "Failed to fetch playlists")
      }
    } catch (error) {
      console.error("Fetch playlists error:", error)
      toast({
        title: "Error",
        description: "Failed to load playlists. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingPlaylists(false)
    }
  }

  const fetchCurrentPlaylist = async () => {
    if (!device) return

    try {
      const response = await fetch(`/api/devices/${device.id}/playlist`, {
        credentials: "include",
      })

      const data = await response.json()

      if (data.success && data.playlist) {
        setCurrentPlaylist(data.playlist)
      }
    } catch (error) {
      console.error("Fetch current playlist error:", error)
    }
  }

  const handleAssign = async () => {
    if (!device || !selectedPlaylistId) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/devices/${device.id}/playlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ playlistId: selectedPlaylistId }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Playlist assigned",
          description: `Playlist has been assigned to ${device.name}`,
        })
        onAssignmentComplete()
        onOpenChange(false)
      } else {
        throw new Error(data.error || "Failed to assign playlist")
      }
    } catch (error) {
      console.error("Assign playlist error:", error)
      toast({
        title: "Error",
        description: "Failed to assign playlist. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnassign = async () => {
    if (!device) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/devices/${device.id}/playlist`, {
        method: "DELETE",
        credentials: "include",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Playlist unassigned",
          description: `Playlist has been removed from ${device.name}`,
        })
        setCurrentPlaylist(null)
        onAssignmentComplete()
      } else {
        throw new Error(data.error || "Failed to unassign playlist")
      }
    } catch (error) {
      console.error("Unassign playlist error:", error)
      toast({
        title: "Error",
        description: "Failed to unassign playlist. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!device) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "scheduled":
        return "bg-blue-500"
      case "draft":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Assign Playlist
          </DialogTitle>
          <DialogDescription>Assign a playlist to {device.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Assignment */}
          {currentPlaylist && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Currently Playing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{currentPlaylist.name}</p>
                    <p className="text-sm text-gray-500">
                      {currentPlaylist.items} items • {currentPlaylist.duration}
                    </p>
                  </div>
                  <Badge className={getStatusColor(currentPlaylist.status)}>{currentPlaylist.status}</Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUnassign}
                  disabled={isLoading}
                  className="mt-3 w-full bg-transparent"
                >
                  Remove Assignment
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Playlist Selection */}
          <div className="space-y-2">
            <Label>Select Playlist</Label>
            {isLoadingPlaylists ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Select value={selectedPlaylistId} onValueChange={setSelectedPlaylistId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a playlist to assign" />
                </SelectTrigger>
                <SelectContent>
                  {playlists.map((playlist) => (
                    <SelectItem key={playlist.id} value={playlist.id}>
                      <div className="flex items-center gap-2">
                        <span>{playlist.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {playlist.items} items
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Selected Playlist Preview */}
          {selectedPlaylistId && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Playlist Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId)
                  if (!selectedPlaylist) return null

                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{selectedPlaylist.name}</p>
                        <Badge className={getStatusColor(selectedPlaylist.status)}>{selectedPlaylist.status}</Badge>
                      </div>
                      {selectedPlaylist.description && (
                        <p className="text-sm text-gray-600">{selectedPlaylist.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Play className="h-3 w-3" />
                          {selectedPlaylist.items} items
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {selectedPlaylist.duration}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {selectedPlaylist.lastModified}
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          )}

          {/* Device Status */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Device Status:</span>
              <Badge variant={device.status === "online" ? "default" : "secondary"}>{device.status}</Badge>
            </div>
            {device.location && (
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-gray-600">Location:</span>
                <span>{device.location}</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!selectedPlaylistId || isLoading}>
            {isLoading ? "Assigning..." : "Assign Playlist"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
