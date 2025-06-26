"use client"

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
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

interface PlaylistOptions {
  scale_image: string
  scale_video: string
  scale_document: string
  shuffle: boolean
  default_transition: string
  transition_speed: string
  auto_advance: boolean
  loop_playlist: boolean
  background_color: string
  text_overlay: boolean
}

interface PlaylistOptionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  options: PlaylistOptions
  onSave: (options: PlaylistOptions) => void
}

export function PlaylistOptionsDialog({ open, onOpenChange, options, onSave }: PlaylistOptionsDialogProps) {
  const [localOptions, setLocalOptions] = useState<PlaylistOptions>(options)

  const handleSave = () => {
    onSave(localOptions)
    onOpenChange(false)
  }

  const updateOption = (key: keyof PlaylistOptions, value: any) => {
    setLocalOptions((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Playlist Settings</DialogTitle>
          <DialogDescription>Configure how your playlist content is displayed and behaves.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Content Scaling */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Content Scaling</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scale-image">Images</Label>
                <Select value={localOptions.scale_image} onValueChange={(value) => updateOption("scale_image", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fit">Fit to screen</SelectItem>
                    <SelectItem value="fill">Fill screen</SelectItem>
                    <SelectItem value="stretch">Stretch to fit</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scale-video">Videos</Label>
                <Select value={localOptions.scale_video} onValueChange={(value) => updateOption("scale_video", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fit">Fit to screen</SelectItem>
                    <SelectItem value="fill">Fill screen</SelectItem>
                    <SelectItem value="stretch">Stretch to fit</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scale-document">Documents</Label>
                <Select
                  value={localOptions.scale_document}
                  onValueChange={(value) => updateOption("scale_document", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fit">Fit to screen</SelectItem>
                    <SelectItem value="fill">Fill screen</SelectItem>
                    <SelectItem value="stretch">Stretch to fit</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Playback Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Playback Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="transition">Default Transition</Label>
                <Select
                  value={localOptions.default_transition}
                  onValueChange={(value) => updateOption("default_transition", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="fade">Fade</SelectItem>
                    <SelectItem value="slide">Slide</SelectItem>
                    <SelectItem value="zoom">Zoom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transition-speed">Transition Speed</Label>
                <Select
                  value={localOptions.transition_speed}
                  onValueChange={(value) => updateOption("transition_speed", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slow">Slow</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="fast">Fast</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="background-color">Background Color</Label>
              <Select
                value={localOptions.background_color}
                onValueChange={(value) => updateOption("background_color", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="black">Black</SelectItem>
                  <SelectItem value="white">White</SelectItem>
                  <SelectItem value="gray">Gray</SelectItem>
                  <SelectItem value="blue">Blue</SelectItem>
                  <SelectItem value="green">Green</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Behavior Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Behavior Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="shuffle">Shuffle Playlist</Label>
                  <p className="text-sm text-muted-foreground">Play items in random order</p>
                </div>
                <Switch
                  id="shuffle"
                  checked={localOptions.shuffle}
                  onCheckedChange={(checked) => updateOption("shuffle", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-advance">Auto Advance</Label>
                  <p className="text-sm text-muted-foreground">Automatically advance to next item</p>
                </div>
                <Switch
                  id="auto-advance"
                  checked={localOptions.auto_advance}
                  onCheckedChange={(checked) => updateOption("auto_advance", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="loop-playlist">Loop Playlist</Label>
                  <p className="text-sm text-muted-foreground">Restart playlist when it reaches the end</p>
                </div>
                <Switch
                  id="loop-playlist"
                  checked={localOptions.loop_playlist}
                  onCheckedChange={(checked) => updateOption("loop_playlist", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="text-overlay">Text Overlay</Label>
                  <p className="text-sm text-muted-foreground">Show filename overlay on content</p>
                </div>
                <Switch
                  id="text-overlay"
                  checked={localOptions.text_overlay}
                  onCheckedChange={(checked) => updateOption("text_overlay", checked)}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Settings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
