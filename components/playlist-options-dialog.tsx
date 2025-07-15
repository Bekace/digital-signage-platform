"use client"

import type React from "react"

import { useState } from "react"
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
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"

interface Playlist {
  id: number
  name: string
  description: string
  status: string
  loop_enabled: boolean
  schedule_enabled: boolean
  start_time?: string
  end_time?: string
  selected_days: string[]
  scale_image?: string
  scale_video?: string
  scale_document?: string
  shuffle?: boolean
  default_transition?: string
  transition_speed?: string
  auto_advance?: boolean
  background_color?: string
  text_overlay?: boolean
}

interface PlaylistOptionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  playlist: Playlist | null
  onUpdate: (playlist: Playlist) => void
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

export function PlaylistOptionsDialog({ open, onOpenChange, playlist, onUpdate }: PlaylistOptionsDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "active",
    loop_enabled: false,
    schedule_enabled: false,
    start_time: "",
    end_time: "",
    selected_days: [] as string[],
    scale_image: "fit",
    scale_video: "fit",
    scale_document: "fit",
    shuffle: false,
    default_transition: "fade",
    transition_speed: "normal",
    auto_advance: true,
    background_color: "#000000",
    text_overlay: false,
  })

  // Update form data when playlist changes
  useState(() => {
    if (playlist) {
      setFormData({
        name: playlist.name || "",
        description: playlist.description || "",
        status: playlist.status || "active",
        loop_enabled: playlist.loop_enabled || false,
        schedule_enabled: playlist.schedule_enabled || false,
        start_time: playlist.start_time || "",
        end_time: playlist.end_time || "",
        selected_days: playlist.selected_days || [],
        scale_image: playlist.scale_image || "fit",
        scale_video: playlist.scale_video || "fit",
        scale_document: playlist.scale_document || "fit",
        shuffle: playlist.shuffle || false,
        default_transition: playlist.default_transition || "fade",
        transition_speed: playlist.transition_speed || "normal",
        auto_advance: playlist.auto_advance !== undefined ? playlist.auto_advance : true,
        background_color: playlist.background_color || "#000000",
        text_overlay: playlist.text_overlay || false,
      })
    }
  }, [playlist])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!playlist) {
      console.error("No playlist provided to update")
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/playlists/${playlist.id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update playlist")
      }

      const result = await response.json()
      if (result.success && result.playlist) {
        onUpdate(result.playlist)
      }
    } catch (error) {
      console.error("Error updating playlist:", error)
      // You might want to show a toast or error message here
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

  // Don't render if playlist is null/undefined
  if (!playlist) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Playlist Options</DialogTitle>
          <DialogDescription>Configure settings for "{playlist.name}"</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Settings</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
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
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          {/* Playback Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Playback Settings</h3>

            <div className="flex items-center space-x-2">
              <Switch
                id="loop"
                checked={formData.loop_enabled}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, loop_enabled: checked }))}
              />
              <Label htmlFor="loop">Loop playlist</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="shuffle"
                checked={formData.shuffle}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, shuffle: checked }))}
              />
              <Label htmlFor="shuffle">Shuffle items</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="auto_advance"
                checked={formData.auto_advance}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, auto_advance: checked }))}
              />
              <Label htmlFor="auto_advance">Auto advance items</Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="transition">Default Transition</Label>
                <Select
                  value={formData.default_transition}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, default_transition: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fade">Fade</SelectItem>
                    <SelectItem value="slide">Slide</SelectItem>
                    <SelectItem value="none">None</SelectItem>
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
                    <SelectItem value="slow">Slow</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="fast">Fast</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Media Scaling */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Media Scaling</h3>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scale_image">Images</Label>
                <Select
                  value={formData.scale_image}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, scale_image: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fit">Fit</SelectItem>
                    <SelectItem value="fill">Fill</SelectItem>
                    <SelectItem value="stretch">Stretch</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scale_video">Videos</Label>
                <Select
                  value={formData.scale_video}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, scale_video: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fit">Fit</SelectItem>
                    <SelectItem value="fill">Fill</SelectItem>
                    <SelectItem value="stretch">Stretch</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scale_document">Documents</Label>
                <Select
                  value={formData.scale_document}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, scale_document: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fit">Fit</SelectItem>
                    <SelectItem value="fill">Fill</SelectItem>
                    <SelectItem value="stretch">Stretch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Schedule Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Schedule Settings</h3>

            <div className="flex items-center space-x-2">
              <Switch
                id="schedule"
                checked={formData.schedule_enabled}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, schedule_enabled: checked }))}
              />
              <Label htmlFor="schedule">Enable scheduling</Label>
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
          </div>

          {/* Display Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Display Settings</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="background_color">Background Color</Label>
                <Input
                  id="background_color"
                  type="color"
                  value={formData.background_color}
                  onChange={(e) => setFormData((prev) => ({ ...prev, background_color: e.target.value }))}
                />
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  id="text_overlay"
                  checked={formData.text_overlay}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, text_overlay: checked }))}
                />
                <Label htmlFor="text_overlay">Show text overlay</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
