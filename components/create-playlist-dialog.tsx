"use client"

import type React from "react"
import { useState } from "react"
import { toast } from "sonner"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"

interface CreatePlaylistDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPlaylistCreated?: () => void
}

const daysOfWeek = [
  { id: "monday", label: "Monday" },
  { id: "tuesday", label: "Tuesday" },
  { id: "wednesday", label: "Wednesday" },
  { id: "thursday", label: "Thursday" },
  { id: "friday", label: "Friday" },
  { id: "saturday", label: "Saturday" },
  { id: "sunday", label: "Sunday" },
]

export function CreatePlaylistDialog({ open, onOpenChange, onPlaylistCreated }: CreatePlaylistDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    loop_enabled: true,
    schedule_enabled: false,
    start_time: "09:00",
    end_time: "17:00",
    selected_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      loop_enabled: true,
      schedule_enabled: false,
      start_time: "09:00",
      end_time: "17:00",
      selected_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("🎵 [CREATE PLAYLIST] Form submitted:", formData)

    if (!formData.name.trim()) {
      toast.error("Playlist name is required")
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        loop_enabled: formData.loop_enabled,
        schedule_enabled: formData.schedule_enabled,
        start_time: formData.schedule_enabled ? formData.start_time : null,
        end_time: formData.schedule_enabled ? formData.end_time : null,
        selected_days: formData.schedule_enabled ? formData.selected_days : [],
      }

      console.log("🎵 [CREATE PLAYLIST] Sending payload:", payload)

      const response = await fetch("/api/playlists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      console.log("🎵 [CREATE PLAYLIST] Response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("🎵 [CREATE PLAYLIST] Error response:", errorData)
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("🎵 [CREATE PLAYLIST] Success response:", data)

      toast.success("Playlist created successfully!")
      resetForm()
      onOpenChange(false)

      // Notify parent component to refresh data
      if (onPlaylistCreated) {
        onPlaylistCreated()
      }
    } catch (error) {
      console.error("🎵 [CREATE PLAYLIST] Error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create playlist")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDayToggle = (dayId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      selected_days: checked ? [...prev.selected_days, dayId] : prev.selected_days.filter((id) => id !== dayId),
    }))
  }

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Playlist</DialogTitle>
          <DialogDescription>Create a new playlist to organize your content for display</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Playlist Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Morning Announcements"
                required
                disabled={isSubmitting}
                maxLength={255}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this playlist..."
                rows={3}
                disabled={isSubmitting}
                maxLength={1000}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Loop Playlist</Label>
                <p className="text-sm text-gray-500">Automatically restart when playlist ends</p>
              </div>
              <Switch
                checked={formData.loop_enabled}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, loop_enabled: checked }))}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Schedule Playlist</Label>
                  <p className="text-sm text-gray-500">Set specific times when this playlist should play</p>
                </div>
                <Switch
                  checked={formData.schedule_enabled}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, schedule_enabled: checked }))}
                  disabled={isSubmitting}
                />
              </div>

              {formData.schedule_enabled && (
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData((prev) => ({ ...prev, start_time: e.target.value }))}
                        disabled={isSubmitting}
                        required={formData.schedule_enabled}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime">End Time</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => setFormData((prev) => ({ ...prev, end_time: e.target.value }))}
                        disabled={isSubmitting}
                        required={formData.schedule_enabled}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Days of Week</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {daysOfWeek.map((day) => (
                        <div key={day.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={day.id}
                            checked={formData.selected_days.includes(day.id)}
                            onCheckedChange={(checked) => handleDayToggle(day.id, checked as boolean)}
                            disabled={isSubmitting}
                          />
                          <Label htmlFor={day.id} className="text-sm">
                            {day.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {formData.schedule_enabled && formData.selected_days.length === 0 && (
                      <p className="text-sm text-red-600">At least one day must be selected</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !formData.name.trim() ||
                isSubmitting ||
                (formData.schedule_enabled && formData.selected_days.length === 0)
              }
            >
              {isSubmitting ? "Creating..." : "Create Playlist"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
