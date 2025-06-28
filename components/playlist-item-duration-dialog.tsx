"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Clock, Zap } from "lucide-react"

interface PlaylistItemDurationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: {
    id: number
    duration?: number
    transition_type?: string
    media_file?: {
      original_name?: string
      filename: string
      file_type: string
    }
  }
  onSave: (duration: number, transitionType: string) => Promise<void>
}

export function PlaylistItemDurationDialog({ open, onOpenChange, item, onSave }: PlaylistItemDurationDialogProps) {
  const [duration, setDuration] = useState(item.duration || 30)
  const [transitionType, setTransitionType] = useState(item.transition_type || "fade")
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      await onSave(duration, transitionType)
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving duration:", error)
    } finally {
      setLoading(false)
    }
  }

  const presetDurations = [5, 10, 15, 30, 45, 60, 90, 120]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Edit Duration & Transition</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Media Info */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-sm text-gray-900 mb-1">
              {item.media_file?.original_name || item.media_file?.filename}
            </h4>
            <Badge variant="outline" className="text-xs">
              {item.media_file?.file_type}
            </Badge>
          </div>

          {/* Duration Settings */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Display Duration (seconds)</Label>
              <div className="flex space-x-2">
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="3600"
                  value={duration}
                  onChange={(e) => setDuration(Number.parseInt(e.target.value) || 30)}
                  className="flex-1"
                />
                <span className="text-sm text-gray-500 self-center">seconds</span>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="space-y-2">
              <Label>Quick Presets</Label>
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
          </div>

          {/* Transition Settings */}
          <div className="space-y-2">
            <Label className="flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span>Transition Effect</span>
            </Label>
            <Select value={transitionType} onValueChange={setTransitionType}>
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
              This item will display for <strong>{duration} seconds</strong> and transition using{" "}
              <strong>{transitionType}</strong> effect.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
