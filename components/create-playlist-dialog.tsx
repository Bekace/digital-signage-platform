"use client"

import type React from "react"

import { useState } from "react"
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
  onCreatePlaylist: (playlistData: any) => Promise<void>
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

export function CreatePlaylistDialog({ open, onOpenChange, onCreatePlaylist }: CreatePlaylistDialogProps) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      return
    }

    setIsSubmitting(true)

    try {
      await onCreatePlaylist({
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        loop_enabled: formData.loop_enabled,
        schedule_enabled: formData.schedule_enabled,
        start_time: formData.schedule_enabled ? formData.start_time : null,
        end_time: formData.schedule_enabled ? formData.end_time : null,
        selected_days: formData.schedule_enabled ? formData.selected_days : [],
      })

      // Reset form
      setFormData({
        name: "",
        description: "",
        loop_enabled: true,
        schedule_enabled: false,
        start_time: "09:00",
        end_time: "17:00",
        selected_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      })
    } catch (error) {
      // Error handling is done in the parent component
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.name.trim() || isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Playlist"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
