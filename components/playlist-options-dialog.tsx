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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"

interface PlaylistOptionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  playlist: any
  onPlaylistUpdated: () => void
}

export function PlaylistOptionsDialog({ open, onOpenChange, playlist, onPlaylistUpdated }: PlaylistOptionsDialogProps) {
  const [loading, setLoading] = useState(false)

  // Basic settings
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState("draft")

  // Display settings
  const [scaleImage, setScaleImage] = useState("fit")
  const [scaleVideo, setScaleVideo] = useState("fit")
  const [scaleDocument, setScaleDocument] = useState("fit")
  const [backgroundColor, setBackgroundColor] = useState("#000000")
  const [textOverlay, setTextOverlay] = useState(false)

  // Playback settings
  const [shuffle, setShuffle] = useState(false)
  const [defaultTransition, setDefaultTransition] = useState("fade")
  const [transitionSpeed, setTransitionSpeed] = useState("normal")
  const [autoAdvance, setAutoAdvance] = useState(true)

  // Schedule settings
  const [scheduleEnabled, setScheduleEnabled] = useState(false)
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [selectedDays, setSelectedDays] = useState<string[]>([])

  const days = [
    { id: "monday", label: "Monday" },
    { id: "tuesday", label: "Tuesday" },
    { id: "wednesday", label: "Wednesday" },
    { id: "thursday", label: "Thursday" },
    { id: "friday", label: "Friday" },
    { id: "saturday", label: "Saturday" },
    { id: "sunday", label: "Sunday" },
  ]

  useEffect(() => {
    if (playlist && open) {
      setName(playlist.name || "")
      setDescription(playlist.description || "")
      setStatus(playlist.status || "draft")
      setScaleImage(playlist.scale_image || "fit")
      setScaleVideo(playlist.scale_video || "fit")
      setScaleDocument(playlist.scale_document || "fit")
      setBackgroundColor(playlist.background_color || "#000000")
      setTextOverlay(playlist.text_overlay || false)
      setShuffle(playlist.shuffle || false)
      setDefaultTransition(playlist.default_transition || "fade")
      setTransitionSpeed(playlist.transition_speed || "normal")
      setAutoAdvance(playlist.auto_advance !== false)
      setScheduleEnabled(playlist.schedule_enabled || false)
      setStartTime(playlist.start_time || "")
      setEndTime(playlist.end_time || "")
      setSelectedDays(Array.isArray(playlist.selected_days) ? playlist.selected_days : [])
    }
  }, [playlist, open])

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Please enter a playlist name")
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/playlists/${playlist.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          status,
          scale_image: scaleImage,
          scale_video: scaleVideo,
          scale_document: scaleDocument,
          background_color: backgroundColor,
          text_overlay: textOverlay,
          shuffle,
          default_transition: defaultTransition,
          transition_speed: transitionSpeed,
          auto_advance: autoAdvance,
          schedule_enabled: scheduleEnabled,
          start_time: scheduleEnabled ? startTime : null,
          end_time: scheduleEnabled ? endTime : null,
          selected_days: scheduleEnabled ? selectedDays : [],
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update playlist")
      }

      if (data.success) {
        toast.success("Playlist updated successfully")
        onOpenChange(false)
        onPlaylistUpdated()
      } else {
        throw new Error(data.error || "Failed to update playlist")
      }
    } catch (error) {
      console.error("Error updating playlist:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update playlist")
    } finally {
      setLoading(false)
    }
  }

  const handleDayToggle = (dayId: string) => {
    setSelectedDays((prev) => (prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Playlist Settings</DialogTitle>
          <DialogDescription>Configure your playlist settings, display options, and scheduling.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="display">Display</TabsTrigger>
            <TabsTrigger value="playback">Playback</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Set the name, description, and status of your playlist.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter playlist name"
                    disabled={loading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter playlist description"
                    disabled={loading}
                    rows={3}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={setStatus} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="display" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Display Settings</CardTitle>
                <CardDescription>Configure how media content is displayed on screens.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label>Image Scaling</Label>
                  <Select value={scaleImage} onValueChange={setScaleImage} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fit">Fit to Screen</SelectItem>
                      <SelectItem value="fill">Fill Screen</SelectItem>
                      <SelectItem value="stretch">Stretch</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Video Scaling</Label>
                  <Select value={scaleVideo} onValueChange={setScaleVideo} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fit">Fit to Screen</SelectItem>
                      <SelectItem value="fill">Fill Screen</SelectItem>
                      <SelectItem value="stretch">Stretch</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Document Scaling</Label>
                  <Select value={scaleDocument} onValueChange={setScaleDocument} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fit">Fit to Screen</SelectItem>
                      <SelectItem value="fill">Fill Screen</SelectItem>
                      <SelectItem value="stretch">Stretch</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="backgroundColor">Background Color</Label>
                  <Input
                    id="backgroundColor"
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="textOverlay" checked={textOverlay} onCheckedChange={setTextOverlay} disabled={loading} />
                  <Label htmlFor="textOverlay">Enable text overlay</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="playback" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Playback Settings</CardTitle>
                <CardDescription>Control how your playlist plays back content.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch id="shuffle" checked={shuffle} onCheckedChange={setShuffle} disabled={loading} />
                  <Label htmlFor="shuffle">Shuffle playback order</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="autoAdvance" checked={autoAdvance} onCheckedChange={setAutoAdvance} disabled={loading} />
                  <Label htmlFor="autoAdvance">Auto-advance to next item</Label>
                </div>
                <div className="grid gap-2">
                  <Label>Default Transition</Label>
                  <Select value={defaultTransition} onValueChange={setDefaultTransition} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="fade">Fade</SelectItem>
                      <SelectItem value="slide">Slide</SelectItem>
                      <SelectItem value="zoom">Zoom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Transition Speed</Label>
                  <Select value={transitionSpeed} onValueChange={setTransitionSpeed} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slow">Slow</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="fast">Fast</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Schedule Settings</CardTitle>
                <CardDescription>Set when this playlist should be active.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="scheduleEnabled"
                    checked={scheduleEnabled}
                    onCheckedChange={setScheduleEnabled}
                    disabled={loading}
                  />
                  <Label htmlFor="scheduleEnabled">Enable scheduling</Label>
                </div>

                {scheduleEnabled && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="startTime">Start Time</Label>
                        <Input
                          id="startTime"
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          disabled={loading}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="endTime">End Time</Label>
                        <Input
                          id="endTime"
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label>Active Days</Label>
                      <div className="flex flex-wrap gap-2">
                        {days.map((day) => (
                          <div key={day.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={day.id}
                              checked={selectedDays.includes(day.id)}
                              onCheckedChange={() => handleDayToggle(day.id)}
                              disabled={loading}
                            />
                            <Label htmlFor={day.id} className="text-sm">
                              {day.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {selectedDays.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {selectedDays.map((dayId) => {
                            const day = days.find((d) => d.id === dayId)
                            return day ? (
                              <Badge key={dayId} variant="secondary" className="text-xs">
                                {day.label}
                              </Badge>
                            ) : null
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
