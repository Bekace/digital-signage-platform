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
  item: {
    id: number
    duration: number
    transition_type: string
    media: {
      original_filename: string
    }
  }
  onSave: (duration: number, transitionType: string) => void
}

export function PlaylistItemDurationDialog({ open, onOpenChange, item, onSave }: PlaylistItemDurationDialogProps) {
  const [duration, setDuration] = useState(item.duration.toString())
  const [transitionType, setTransitionType] = useState(item.transition_type)

  const handleSave = () => {
    const durationNum = Number.parseInt(duration)
    if (durationNum > 0) {
      onSave(durationNum, transitionType)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Item Duration</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">File: {item.media.original_filename}</Label>
          </div>
          <div>
            <Label htmlFor="duration">Duration (seconds)</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              max="3600"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="transition">Transition Type</Label>
            <Select value={transitionType} onValueChange={setTransitionType}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fade">Fade</SelectItem>
                <SelectItem value="slide">Slide</SelectItem>
                <SelectItem value="cut">Cut</SelectItem>
                <SelectItem value="dissolve">Dissolve</SelectItem>
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
