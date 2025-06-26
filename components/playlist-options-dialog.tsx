"use client"

import { useState } from "react"
import { Settings, Clock } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  const [formData, setFormData] = useState<PlaylistOptions>(options)

  const handleSave = () => {
    onSave(formData)
    onOpenChange(false)
  }

  const updateField = (field: keyof PlaylistOptions, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Playlist Settings
          </DialogTitle>
          <DialogDescription>Configure how your playlist displays and behaves.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="display" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="display">Display</TabsTrigger>
            <TabsTrigger value="playback">Playback</TabsTrigger>
            <TabsTrigger value="transitions">Transitions</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="display" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scale_image">Image Scaling</Label>
                <Select value={formData.scale_image} onValueChange={(value) => updateField("scale_image", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fit">Fit</SelectItem>
                    <SelectItem value="fill">Fill</SelectItem>
                    <SelectItem value="stretch">Stretch</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scale_video">Video Scaling</Label>
                <Select value={formData.scale_video} onValueChange={(value) => updateField("scale_video", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fit">Fit</SelectItem>
                    <SelectItem value="fill">Fill</SelectItem>
                    <SelectItem value="stretch">Stretch</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scale_document">Document Scaling</Label>
                <Select value={formData.scale_document} onValueChange={(value) => updateField("scale_document", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fit">Fit</SelectItem>
                    <SelectItem value="fill">Fill</SelectItem>
                    <SelectItem value="stretch">Stretch</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="background_color">Background Color</Label>
                <Input
                  id="background_color"
                  type="color"
                  value={formData.background_color}
                  onChange={(e) => updateField("background_color", e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="text_overlay"
                checked={formData.text_overlay}
                onCheckedChange={(checked) => updateField("text_overlay", checked)}
              />
              <Label htmlFor="text_overlay">Enable text overlay</Label>
            </div>
          </TabsContent>

          <TabsContent value="playback" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="shuffle"
                  checked={formData.shuffle}
                  onCheckedChange={(checked) => updateField("shuffle", checked)}
                />
                <Label htmlFor="shuffle">Shuffle playlist</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="auto_advance"
                  checked={formData.auto_advance}
                  onCheckedChange={(checked) => updateField("auto_advance", checked)}
                />
                <Label htmlFor="auto_advance">Auto advance to next item</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="loop_playlist"
                  checked={formData.loop_playlist}
                  onCheckedChange={(checked) => updateField("loop_playlist", checked)}
                />
                <Label htmlFor="loop_playlist">Loop playlist</Label>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="transitions" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="default_transition">Default Transition</Label>
                <Select
                  value={formData.default_transition}
                  onValueChange={(value) => updateField("default_transition", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="fade">Fade</SelectItem>
                    <SelectItem value="slide">Slide</SelectItem>
                    <SelectItem value="zoom">Zoom</SelectItem>
                    <SelectItem value="flip">Flip</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transition_speed">Transition Speed</Label>
                <Select
                  value={formData.transition_speed}
                  onValueChange={(value) => updateField("transition_speed", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slow">Slow</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="fast">Fast</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Schedule settings coming soon</p>
              <p className="text-sm">Set specific times and days for playlist playback</p>
            </div>
          </TabsContent>
        </Tabs>

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
