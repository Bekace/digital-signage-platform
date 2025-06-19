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

export function CreatePlaylistDialog({ open, onOpenChange }: CreatePlaylistDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    loop: true,
    scheduleEnabled: false,
    startTime: "09:00",
    endTime: "17:00",
    selectedDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // In a real app, you would send this data to your API
    console.log("Creating playlist:", formData)

    // Reset form and close dialog
    setFormData({
      name: "",
      description: "",
      loop: true,
      scheduleEnabled: false,
      startTime: "09:00",
      endTime: "17:00",
      selectedDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    })
    onOpenChange(false)
  }

  const handleDayToggle = (dayId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      selectedDays: checked ? [...prev.selectedDays, dayId] : prev.selectedDays.filter((id) => id !== dayId),
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
              <Label htmlFor="name">Playlist Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Morning Announcements"
                required
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
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Loop Playlist</Label>
                <p className="text-sm text-gray-500">Automatically restart when playlist ends</p>
              </div>
              <Switch
                checked={formData.loop}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, loop: checked }))}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Schedule Playlist</Label>
                  <p className="text-sm text-gray-500">Set specific times when this playlist should play</p>
                </div>
                <Switch
                  checked={formData.scheduleEnabled}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, scheduleEnabled: checked }))}
                />
              </div>

              {formData.scheduleEnabled && (
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime">End Time</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData((prev) => ({ ...prev, endTime: e.target.value }))}
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
                            checked={formData.selectedDays.includes(day.id)}
                            onCheckedChange={(checked) => handleDayToggle(day.id, checked as boolean)}
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.name.trim()}>
              Create Playlist
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
