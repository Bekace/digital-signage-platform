"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
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
    if (duration >= 1 && duration <= 3600) {
      onSave(duration, transition)
    }
  }

  const presetDurations = [5, 10, 15, 30, 45, 60, 90, 120]

  const formatDuration = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
    } else {
      const hours = Math.floor(seconds / 3600)
      const remainingMinutes = Math.floor((seconds % 3600) / 60)
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
    }
  }

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
            <h4 className="font-medium text-sm truncate">{mediaName}</h4>
            <p className="text-xs text-gray-600 mt-1">Configure how long this item displays</p>
          </div>

          {/* Duration Settings */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Display Duration</span>
              </Label>

              {/* Quick Presets */}
              <div className="grid grid-cols-4 gap-2">
                {presetDurations.map((preset) => (
                  <Button
                    key={preset}
                    variant={duration === preset ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDuration(preset)}
                    className="text-xs"
                  >
                    {formatDuration(preset)}
                  </Button>
                ))}
              </div>

              {/* Custom Duration Input */}
              <div className="flex space-x-2">
                <Input
                  type="number"
                  min="1"
                  max="3600"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  placeholder="Duration in seconds"
                  className="flex-1"
                />
                <div className="flex items-center px-3 bg-gray-100 rounded text-sm text-gray-600">seconds</div>
              </div>

              {/* Duration Preview */}
              <div className="text-center p-2 bg-blue-50 rounded">
                <Badge variant="outline" className="text-blue-700">
                  {formatDuration(duration)}
                </Badge>
              </div>
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
                  <SelectItem value="fade">Fade - Smooth opacity transition</SelectItem>
                  <SelectItem value="slide">Slide - Horizontal movement</SelectItem>
                  <SelectItem value="zoom">Zoom - Scale in/out effect</SelectItem>
                  <SelectItem value="flip">Flip - 3D rotation effect</SelectItem>
                  <SelectItem value="none">None - Instant change</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Settings Summary */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Preview Settings</h4>
              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="font-medium">{formatDuration(duration)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Transition:</span>
                  <span className="font-medium capitalize">{transition}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={duration < 1 || duration > 3600}>
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
