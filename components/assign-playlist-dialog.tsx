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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { List, ImageIcon, Clock, CheckCircle, AlertCircle } from "lucide-react"

interface Device {
  id: string
  name: string
  current_playlist?: {
    id: string
    name: string
    items: number
  }
}

interface Playlist {
  id: number
  name: string
  description?: string
  status: string
  items: number
  duration: string
  created_at: string
  updated_at: string
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
  const [allPlaylists, setAllPlaylists] = useState<Playlist[]>([])
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  useEffect(() => {
    if (open) {
      fetchPlaylists()
    }
  }, [open])

  const fetchPlaylists = async () => {
    setIsLoading(true)
    try {
      console.log("🎵 Fetching playlists for assignment...")
      const response = await fetch("/api/playlists", {
        credentials: "include",
      })

      const data = await response.json()
      console.log("🎵 Playlists API response:", data)
      setDebugInfo(data)

      if (data.success) {
        const allPlaylistsData = data.playlists || []
        setAllPlaylists(allPlaylistsData)

        // Filter for published playlists - check for both "active" and "published" status
        const publishedPlaylists = allPlaylistsData.filter(
          (playlist: Playlist) => playlist.status === "active" || playlist.status === "published",
        )

        console.log("🎵 All playlists:", allPlaylistsData.length)
        console.log("🎵 Published playlists:", publishedPlaylists.length)
        console.log("🎵 Published playlist details:", publishedPlaylists)

        setPlaylists(publishedPlaylists)
      } else {
        throw new Error(data.error || "Failed to fetch playlists")
      }
    } catch (error) {
      console.error("🎵 Fetch playlists error:", error)
      toast({
        title: "Error",
        description: "Failed to load playlists. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssign = async () => {
    if (!device || !selectedPlaylist) return

    setIsAssigning(true)
    try {
      const response = await fetch(`/api/devices/${device.id}/playlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ playlistId: selectedPlaylist }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Playlist assigned",
          description: "The playlist has been successfully assigned to the device.",
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
      setIsAssigning(false)
    }
  }

  const handleUnassign = async () => {
    if (!device) return

    setIsAssigning(true)
    try {
      const response = await fetch(`/api/devices/${device.id}/playlist`, {
        method: "DELETE",
        credentials: "include",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Playlist unassigned",
          description: "The playlist has been removed from the device.",
        })
        onAssignmentComplete()
        onOpenChange(false)
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
      setIsAssigning(false)
    }
  }

  if (!device) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <List className="h-5 w-5" />
            Assign Playlist
          </DialogTitle>
          <DialogDescription>Choose a playlist to assign to {device.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Debug Info */}
          {process.env.NODE_ENV === "development" && debugInfo && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  Debug Info
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs">
                <div>Total playlists: {allPlaylists.length}</div>
                <div>Published playlists: {playlists.length}</div>
                <div>Playlist statuses: {allPlaylists.map((p) => `${p.name}: ${p.status}`).join(", ")}</div>
              </CardContent>
            </Card>
          )}

          {/* Current Assignment */}
          {device.current_playlist && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  Currently Assigned
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{device.current_playlist.name}</p>
                    <p className="text-sm text-gray-600">{device.current_playlist.items} items</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleUnassign} disabled={isAssigning}>
                    {isAssigning ? "Removing..." : "Remove"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Available Playlists */}
          <div>
            <h3 className="text-sm font-medium mb-3">Available Playlists</h3>

            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : playlists.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <List className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 text-center">
                    No published playlists available.
                    <br />
                    {allPlaylists.length > 0 ? (
                      <>Found {allPlaylists.length} playlists, but none are published.</>
                    ) : (
                      <>Create and publish a playlist first.</>
                    )}
                  </p>
                  {allPlaylists.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      Available playlists: {allPlaylists.map((p) => `${p.name} (${p.status})`).join(", ")}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {playlists.map((playlist) => (
                  <Card
                    key={playlist.id}
                    className={`cursor-pointer transition-colors ${
                      selectedPlaylist === playlist.id.toString()
                        ? "border-blue-500 bg-blue-50"
                        : "hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedPlaylist(playlist.id.toString())}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{playlist.name}</h4>
                            <Badge variant="default" className="text-xs">
                              {playlist.status}
                            </Badge>
                          </div>
                          {playlist.description && <p className="text-sm text-gray-600 mb-2">{playlist.description}</p>}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <ImageIcon className="h-3 w-3" />
                              {playlist.items} items
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {playlist.duration}
                            </span>
                          </div>
                        </div>
                        {selectedPlaylist === playlist.id.toString() && (
                          <CheckCircle className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isAssigning}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!selectedPlaylist || isAssigning}>
            {isAssigning ? "Assigning..." : "Assign Playlist"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
