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
    setLocalOptions((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Playlist Options</DialogTitle>
          <DialogDescription>Configure how your playlist content is displayed and behaves.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Scaling Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Content Scaling</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scale-image">Image Scaling</Label>
                <Select value={localOptions.scale_image} onValueChange={(value) => updateOption("scale_image", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select image scaling" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fit">Fit (maintain aspect ratio)</SelectItem>
                    <SelectItem value="fill">Fill (may crop)</SelectItem>
                    <SelectItem value="stretch">Stretch (may distort)</SelectItem>
                    <SelectItem value="center">Center (original size)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scale-video">Video Scaling</Label>
                <Select value={localOptions.scale_video} onValueChange={(value) => updateOption("scale_video", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select video scaling" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fit">Fit (maintain aspect ratio)</SelectItem>
                    <SelectItem value="fill">Fill (may crop)</SelectItem>
                    <SelectItem value="stretch">Stretch (may distort)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scale-document">Document Scaling</Label>
                <Select
                  value={localOptions.scale_document}
                  onValueChange={(value) => updateOption("scale_document", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select document scaling" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fit">Fit to screen</SelectItem>
                    <SelectItem value="width">Fit to width</SelectItem>
                    <SelectItem value="height">Fit to height</SelectItem>
                    <SelectItem value="original">Original size</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Playback Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Playback Behavior</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Shuffle Playlist</Label>
                  <p className="text-sm text-muted-foreground">Play items in random order</p>
                </div>
                <Switch
                  checked={localOptions.shuffle}
                  onCheckedChange={(checked) => updateOption("shuffle", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto Advance</Label>
                  <p className="text-sm text-muted-foreground">Automatically move to next item</p>
                </div>
                <Switch
                  checked={localOptions.auto_advance}
                  onCheckedChange={(checked) => updateOption("auto_advance", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Loop Playlist</Label>
                  <p className="text-sm text-muted-foreground">Restart playlist when it ends</p>
                </div>
                <Switch
                  checked={localOptions.loop_playlist}
                  onCheckedChange={(checked) => updateOption("loop_playlist", checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Transition Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Transitions</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="default-transition">Default Transition</Label>
                <Select
                  value={localOptions.default_transition}
                  onValueChange={(value) => updateOption("default_transition", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select transition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="fade">Fade</SelectItem>
                    <SelectItem value="slide">Slide</SelectItem>
                    <SelectItem value="wipe">Wipe</SelectItem>
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
                    <SelectValue placeholder="Select speed" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slow">Slow (2s)</SelectItem>
                    <SelectItem value="medium">Medium (1s)</SelectItem>
                    <SelectItem value="fast">Fast (0.5s)</SelectItem>
                    <SelectItem value="instant">Instant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Appearance Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Appearance</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="background-color">Background Color</Label>
                <Select
                  value={localOptions.background_color}
                  onValueChange={(value) => updateOption("background_color", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select background color" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="black">Black</SelectItem>
                    <SelectItem value="white">White</SelectItem>
                    <SelectItem value="gray">Gray</SelectItem>
                    <SelectItem value="blue">Blue</SelectItem>
                    <SelectItem value="green">Green</SelectItem>
                    <SelectItem value="red">Red</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Text Overlay</Label>
                  <p className="text-sm text-muted-foreground">Show filename overlay on content</p>
                </div>
                <Switch
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
          <Button onClick={handleSave}>Save Options</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
