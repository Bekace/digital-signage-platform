"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Timer } from "lucide-react"

interface PlaylistItemDurationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentDuration: number
  currentTransition: string
  onSave: (duration: number, transition: string) => void
  mediaName: string
}

export function PlaylistItemDurationDialog({
  open,
  onOpenChange,
  currentDuration,
  currentTransition,
  onSave,
  mediaName,
}: PlaylistItemDurationDialogProps) {
  const [duration, setDuration] = useState(currentDuration)
  const [transition, setTransition] = useState(currentTransition)

  const handleSave = () => {
    onSave(duration, transition)
    onOpenChange(false)
  }

  const presetDurations = [5, 10, 15, 30, 45, 60, 90, 120]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Timer className="h-5 w-5" />
            <span>Edit Playback Settings</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Media File</Label>
            <p className="text-sm text-gray-600 truncate">{mediaName}</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="duration" className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Display Duration (seconds)</span>
              </Label>
              <Input
                id="duration"
                type="number"
                min="1"
                max="3600"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                placeholder="30"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Quick Presets</Label>
              <div className="grid grid-cols-4 gap-2">
                {presetDurations.map((preset) => (
                  <Button
                    key={preset}
                    variant={duration === preset ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDuration(preset)}
                    className="text-xs"
                  >
                    {preset}s
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transition">Transition Effect</Label>
              <Select value={transition} onValueChange={setTransition}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fade">Fade</SelectItem>
                  <SelectItem value="slide">Slide</SelectItem>
                  <SelectItem value="zoom">Zoom</SelectItem>
                  <SelectItem value="flip">Flip</SelectItem>
                  <SelectItem value="none">None (instant)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              This item will display for <strong>{duration} seconds</strong> with a <strong>{transition}</strong>{" "}
              transition.
            </p>
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
