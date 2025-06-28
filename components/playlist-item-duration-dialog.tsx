"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PlaylistItemDurationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentDuration: number
  currentTransition: string
  mediaName: string
  onSave: (duration: number, transition: string) => void
}

export function PlaylistItemDurationDialog({
  open,
  onOpenChange,
  currentDuration,
  currentTransition,
  mediaName,
  onSave,
}: PlaylistItemDurationDialogProps) {
  const [duration, setDuration] = useState(currentDuration)
  const [transition, setTransition] = useState(currentTransition)

  const handleSave = () => {
    onSave(duration, transition)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Playback Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">Media File</Label>
            <p className="text-sm text-gray-600 truncate">{mediaName}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (seconds)</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              max="3600"
              value={duration}
              onChange={(e) => setDuration(Number.parseInt(e.target.value) || 30)}
              placeholder="30"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="transition">Transition Effect</Label>
            <Select value={transition} onValueChange={setTransition}>
              <SelectTrigger>
                <SelectValue placeholder="Select transition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fade">Fade</SelectItem>
                <SelectItem value="slide">Slide</SelectItem>
                <SelectItem value="zoom">Zoom</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
