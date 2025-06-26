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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

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

  const handleReset = () => {
    setFormData(options)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Playlist Settings</DialogTitle>
          <DialogDescription>Configure how your playlist content is displayed and behaves.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="scaling" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="scaling">Scaling</TabsTrigger>
            <TabsTrigger value="playback">Playback</TabsTrigger>
            <TabsTrigger value="transitions">Transitions</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

          <TabsContent value="scaling" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Content Scaling</CardTitle>
                <CardDescription>Choose how different types of content are scaled to fit the screen.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="scale_image">Image Scaling</Label>
                  <Select
                    value={formData.scale_image}
                    onValueChange={(value) => setFormData({ ...formData, scale_image: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select image scaling" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fit">Fit to Screen</SelectItem>
                      <SelectItem value="fill">Fill Screen</SelectItem>
                      <SelectItem value="stretch">Stretch to Fit</SelectItem>
                      <SelectItem value="center">Center (No Scaling)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scale_video">Video Scaling</Label>
                  <Select
                    value={formData.scale_video}
                    onValueChange={(value) => setFormData({ ...formData, scale_video: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select video scaling" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fit">Fit to Screen</SelectItem>
                      <SelectItem value="fill">Fill Screen</SelectItem>
                      <SelectItem value="stretch">Stretch to Fit</SelectItem>
                      <SelectItem value="center">Center (No Scaling)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scale_document">Document Scaling</Label>
                  <Select
                    value={formData.scale_document}
                    onValueChange={(value) => setFormData({ ...formData, scale_document: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select document scaling" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fit">Fit to Screen</SelectItem>
                      <SelectItem value="fill">Fill Screen</SelectItem>
                      <SelectItem value="stretch">Stretch to Fit</SelectItem>
                      <SelectItem value="center">Center (No Scaling)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="playback" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Playback Behavior</CardTitle>
                <CardDescription>Control how your playlist plays and advances through content.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="shuffle">Shuffle Playlist</Label>
                    <p className="text-sm text-muted-foreground">Play items in random order</p>
                  </div>
                  <Switch
                    id="shuffle"
                    checked={formData.shuffle}
                    onCheckedChange={(checked) => setFormData({ ...formData, shuffle: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto_advance">Auto Advance</Label>
                    <p className="text-sm text-muted-foreground">Automatically advance to next item</p>
                  </div>
                  <Switch
                    id="auto_advance"
                    checked={formData.auto_advance}
                    onCheckedChange={(checked) => setFormData({ ...formData, auto_advance: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="loop_playlist">Loop Playlist</Label>
                    <p className="text-sm text-muted-foreground">Restart playlist when it reaches the end</p>
                  </div>
                  <Switch
                    id="loop_playlist"
                    checked={formData.loop_playlist}
                    onCheckedChange={(checked) => setFormData({ ...formData, loop_playlist: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transitions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Transitions</CardTitle>
                <CardDescription>Configure how content transitions between items.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="default_transition">Default Transition</Label>
                  <Select
                    value={formData.default_transition}
                    onValueChange={(value) => setFormData({ ...formData, default_transition: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select transition type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="fade">Fade</SelectItem>
                      <SelectItem value="slide_left">Slide Left</SelectItem>
                      <SelectItem value="slide_right">Slide Right</SelectItem>
                      <SelectItem value="slide_up">Slide Up</SelectItem>
                      <SelectItem value="slide_down">Slide Down</SelectItem>
                      <SelectItem value="zoom_in">Zoom In</SelectItem>
                      <SelectItem value="zoom_out">Zoom Out</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transition_speed">Transition Speed</Label>
                  <Select
                    value={formData.transition_speed}
                    onValueChange={(value) => setFormData({ ...formData, transition_speed: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select transition speed" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slow">Slow (1.5s)</SelectItem>
                      <SelectItem value="normal">Normal (1s)</SelectItem>
                      <SelectItem value="fast">Fast (0.5s)</SelectItem>
                      <SelectItem value="instant">Instant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize the visual appearance of your playlist.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="background_color">Background Color</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="background_color"
                      type="color"
                      value={formData.background_color}
                      onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      type="text"
                      value={formData.background_color}
                      onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="text_overlay">Text Overlay</Label>
                    <p className="text-sm text-muted-foreground">Show filename overlay on content</p>
                  </div>
                  <Switch
                    id="text_overlay"
                    checked={formData.text_overlay}
                    onCheckedChange={(checked) => setFormData({ ...formData, text_overlay: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Settings</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
