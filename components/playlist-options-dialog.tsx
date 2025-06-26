"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Settings, Palette, Play, Clock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  onSave: (options: PlaylistOptions) => Promise<void>
}

export function PlaylistOptionsDialog({ open, onOpenChange, options, onSave }: PlaylistOptionsDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<PlaylistOptions>(options)

  // Update form data when options prop changes
  useEffect(() => {
    setFormData(options)
  }, [options])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSave(formData)
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving playlist options:", error)
      toast.error("Failed to save playlist options")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData(options)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Playlist Settings
          </DialogTitle>
          <DialogDescription>Configure how your playlist content is displayed and played.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="display" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="display">Display</TabsTrigger>
              <TabsTrigger value="playback">Playback</TabsTrigger>
              <TabsTrigger value="transitions">Transitions</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
            </TabsList>

            {/* Display Settings */}
            <TabsContent value="display" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Display Options
                  </CardTitle>
                  <CardDescription>Configure how different media types are scaled and displayed.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="scale_image">Image Scaling</Label>
                      <Select
                        value={formData.scale_image}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, scale_image: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fit">Fit to Screen</SelectItem>
                          <SelectItem value="fill">Fill Screen</SelectItem>
                          <SelectItem value="stretch">Stretch</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="scale_video">Video Scaling</Label>
                      <Select
                        value={formData.scale_video}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, scale_video: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fit">Fit to Screen</SelectItem>
                          <SelectItem value="fill">Fill Screen</SelectItem>
                          <SelectItem value="stretch">Stretch</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scale_document">Document Scaling</Label>
                    <Select
                      value={formData.scale_document}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, scale_document: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fit">Fit to Screen</SelectItem>
                        <SelectItem value="fill">Fill Screen</SelectItem>
                        <SelectItem value="stretch">Stretch</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="background_color">Background Color</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="background_color"
                        type="color"
                        value={formData.background_color}
                        onChange={(e) => setFormData((prev) => ({ ...prev, background_color: e.target.value }))}
                        className="w-16 h-10 p-1 border rounded"
                      />
                      <Input
                        type="text"
                        value={formData.background_color}
                        onChange={(e) => setFormData((prev) => ({ ...prev, background_color: e.target.value }))}
                        placeholder="#000000"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="text_overlay"
                      checked={formData.text_overlay}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, text_overlay: checked }))}
                    />
                    <Label htmlFor="text_overlay">Enable text overlay</Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Playback Settings */}
            <TabsContent value="playback" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Playback Options
                  </CardTitle>
                  <CardDescription>Control how your playlist plays and advances through content.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="shuffle"
                      checked={formData.shuffle}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, shuffle: checked }))}
                    />
                    <Label htmlFor="shuffle">Shuffle playlist</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="auto_advance"
                      checked={formData.auto_advance}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, auto_advance: checked }))}
                    />
                    <Label htmlFor="auto_advance">Auto-advance to next item</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="loop_playlist"
                      checked={formData.loop_playlist}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, loop_playlist: checked }))}
                    />
                    <Label htmlFor="loop_playlist">Loop playlist</Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Transition Settings */}
            <TabsContent value="transitions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Transition Effects</CardTitle>
                  <CardDescription>Configure transitions between playlist items.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="default_transition">Default Transition</Label>
                      <Select
                        value={formData.default_transition}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, default_transition: value }))}
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
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, transition_speed: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="slow">Slow (1s)</SelectItem>
                          <SelectItem value="normal">Normal (0.5s)</SelectItem>
                          <SelectItem value="fast">Fast (0.25s)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Schedule Settings */}
            <TabsContent value="schedule" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Schedule Settings
                  </CardTitle>
                  <CardDescription>Set up when this playlist should be active (coming soon).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
                    <p>Scheduling features are coming soon! You'll be able to:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Set specific times for playlist activation</li>
                      <li>Choose which days of the week to play</li>
                      <li>Create multiple schedule rules</li>
                      <li>Set different playlists for different time periods</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={handleReset} disabled={loading}>
              Reset
            </Button>
            <div className="space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
