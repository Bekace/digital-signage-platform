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
import { toast } from "sonner"

interface PlaylistOptionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  playlist: any
  onPlaylistUpdated: () => void
}

const DAYS_OF_WEEK = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
]

const SCALE_OPTIONS = [
  { value: "fit", label: "Fit to Screen" },
  { value: "fill", label: "Fill Screen" },
  { value: "stretch", label: "Stretch" },
  { value: "center", label: "Center" },
]

const TRANSITION_OPTIONS = [
  { value: "none", label: "None" },
  { value: "fade", label: "Fade" },
  { value: "slide", label: "Slide" },
  { value: "zoom", label: "Zoom" },
  { value: "flip", label: "Flip" },
]

const TRANSITION_SPEED_OPTIONS = [
  { value: "slow", label: "Slow (2s)" },
  { value: "medium", label: "Medium (1s)" },
  { value: "fast", label: "Fast (0.5s)" },
]

const BACKGROUND_COLOR_OPTIONS = [
  { value: "black", label: "Black" },
  { value: "white", label: "White" },
  { value: "gray", label: "Gray" },
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "red", label: "Red" },
]

export function PlaylistOptionsDialog({ open, onOpenChange, playlist, onPlaylistUpdated }: PlaylistOptionsDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "draft",
    loop_enabled: true,
    schedule_enabled: false,
    start_time: "",
    end_time: "",
    selected_days: [] as string[],
    scale_image: "fit",
    scale_video: "fit",
    scale_document: "fit",
    shuffle: false,
    default_transition: "fade",
    transition_speed: "medium",
    auto_advance: true,
    background_color: "black",
    text_overlay: false,
  })

  useEffect(() => {
    if (playlist) {
      setFormData({
        name: playlist.name || "",
        description: playlist.description || "",
        status: playlist.status || "draft",
        loop_enabled: playlist.loop_enabled !== false,
        schedule_enabled: playlist.schedule_enabled || false,
        start_time: playlist.start_time || "",
        end_time: playlist.end_time || "",
        selected_days: Array.isArray(playlist.selected_days) ? playlist.selected_days : [],
        scale_image: playlist.scale_image || "fit",
        scale_video: playlist.scale_video || "fit",
        scale_document: playlist.scale_document || "fit",
        shuffle: playlist.shuffle || false,
        default_transition: playlist.default_transition || "fade",
        transition_speed: playlist.transition_speed || "medium",
        auto_advance: playlist.auto_advance !== false,
        background_color: playlist.background_color || "black",
        text_overlay: playlist.text_overlay || false,
      })
    }
  }, [playlist])

  const handleSave = async () => {
    if (!playlist) return

    setLoading(true)
    try {
      const response = await fetch(`/api/playlists/${playlist.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update playlist")
      }

      const data = await response.json()
      if (data.success) {
        toast.success("Playlist settings updated successfully")
        onPlaylistUpdated()
        onOpenChange(false)
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

  const toggleDay = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      selected_days: prev.selected_days.includes(day)
        ? prev.selected_days.filter((d) => d !== day)
        : [...prev.selected_days, day],
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Playlist Settings</DialogTitle>
          <DialogDescription>Configure your playlist settings and behavior</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="playback">Playback</TabsTrigger>
            <TabsTrigger value="scaling">Scaling</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Set the name and description for your playlist</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Playlist Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter playlist name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter playlist description"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Schedule Settings</CardTitle>
                <CardDescription>Configure when this playlist should be active</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="schedule_enabled"
                    checked={formData.schedule_enabled}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, schedule_enabled: checked }))}
                  />
                  <Label htmlFor="schedule_enabled">Enable Scheduling</Label>
                </div>

                {formData.schedule_enabled && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="start_time">Start Time</Label>
                        <Input
                          id="start_time"
                          type="time"
                          value={formData.start_time}
                          onChange={(e) => setFormData((prev) => ({ ...prev, start_time: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end_time">End Time</Label>
                        <Input
                          id="end_time"
                          type="time"
                          value={formData.end_time}
                          onChange={(e) => setFormData((prev) => ({ ...prev, end_time: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Active Days</Label>
                      <div className="flex flex-wrap gap-2">
                        {DAYS_OF_WEEK.map((day) => (
                          <Badge
                            key={day.value}
                            variant={formData.selected_days.includes(day.value) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => toggleDay(day.value)}
                          >
                            {day.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="playback" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Playback Behavior</CardTitle>
                <CardDescription>Configure how your playlist plays content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="loop_enabled"
                    checked={formData.loop_enabled}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, loop_enabled: checked }))}
                  />
                  <Label htmlFor="loop_enabled">Loop Playlist</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="shuffle"
                    checked={formData.shuffle}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, shuffle: checked }))}
                  />
                  <Label htmlFor="shuffle">Shuffle Content</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto_advance"
                    checked={formData.auto_advance}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, auto_advance: checked }))}
                  />
                  <Label htmlFor="auto_advance">Auto Advance</Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transitions</CardTitle>
                <CardDescription>Configure transitions between content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="default_transition">Default Transition</Label>
                  <Select
                    value={formData.default_transition}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, default_transition: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRANSITION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transition_speed">Transition Speed</Label>
                  <Select
                    value={formData.transition_speed}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, transition_speed: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRANSITION_SPEED_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scaling" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Content Scaling</CardTitle>
                <CardDescription>Configure how different content types are scaled</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="scale_image">Image Scaling</Label>
                  <Select
                    value={formData.scale_image}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, scale_image: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SCALE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scale_video">Video Scaling</Label>
                  <Select
                    value={formData.scale_video}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, scale_video: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SCALE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scale_document">Document Scaling</Label>
                  <Select
                    value={formData.scale_document}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, scale_document: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SCALE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Visual Appearance</CardTitle>
                <CardDescription>Configure the visual appearance of your playlist</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="background_color">Background Color</Label>
                  <Select
                    value={formData.background_color}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, background_color: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BACKGROUND_COLOR_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="text_overlay"
                    checked={formData.text_overlay}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, text_overlay: checked }))}
                  />
                  <Label htmlFor="text_overlay">Show Text Overlay</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Settings"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
