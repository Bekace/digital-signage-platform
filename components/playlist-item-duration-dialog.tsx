"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Clock, Timer, Zap } from "lucide-react"

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
  }

  const handlePresetDuration = (seconds: number) => {
    setDuration(seconds)
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
    } else {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
    }
  }

  const presetDurations = [
    { label: "5 sec", value: 5 },
    { label: "10 sec", value: 10 },
    { label: "15 sec", value: 15 },
    { label: "30 sec", value: 30 },
    { label: "45 sec", value: 45 },
    { label: "1 min", value: 60 },
    { label: "1.5 min", value: 90 },
    { label: "2 min", value: 120 },
  ]

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
          {/* Media Info */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-sm text-gray-900 truncate">{mediaName}</h4>
            <p className="text-xs text-gray-600 mt-1">
              Current: {formatDuration(currentDuration)} • {currentTransition}
            </p>
          </div>

          {/* Duration Settings */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Display Duration</span>
              </Label>

              {/* Preset Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {presetDurations.map((preset) => (
                  <Button
                    key={preset.value}
                    variant={duration === preset.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePresetDuration(preset.value)}
                    className="text-xs"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>

              {/* Custom Duration Input */}
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  min="1"
                  max="3600"
                  value={duration}
                  onChange={(e) => setDuration(Math.max(1, Math.min(3600, Number.parseInt(e.target.value) || 1)))}
                  className="flex-1"
                />
                <span className="text-sm text-gray-500 min-w-0">seconds</span>
              </div>

              <div className="text-xs text-gray-500">Range: 1 second to 1 hour (3600 seconds)</div>
            </div>

            <Separator />

            {/* Transition Settings */}
            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                <Zap className="h-4 w-4" />
                <span>Transition Effect</span>
              </Label>
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

            {/* Preview */}
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-sm text-blue-900 mb-1">Preview</h4>
              <p className="text-sm text-blue-700">
                This item will display for <strong>{formatDuration(duration)}</strong> and transition using{" "}
                <strong>{transition}</strong> effect.
              </p>
            </div>
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
