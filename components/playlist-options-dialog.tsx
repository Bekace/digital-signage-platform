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
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface PlaylistOptionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  playlist: any
  onSave: (options: any) => void
}

export function PlaylistOptionsDialog({ open, onOpenChange, playlist, onSave }: PlaylistOptionsDialogProps) {
  const [options, setOptions] = useState({
    name: playlist?.name || "",
    description: playlist?.description || "",
    scale_image: playlist?.scale_image || "fit",
    scale_video: playlist?.scale_video || "fit",
    scale_document: playlist?.scale_document || "fit",
    shuffle: playlist?.shuffle || false,
    default_transition: playlist?.default_transition || "fade",
    transition_speed: playlist?.transition_speed || "normal",
    auto_advance: playlist?.auto_advance !== false,
    background_color: playlist?.background_color || "#000000",
    text_overlay: playlist?.text_overlay || false,
  })

  const handleSave = () => {
    onSave(options)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Playlist Settings</DialogTitle>
          <DialogDescription>Configure your playlist options and behavior.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="scaling">Scaling</TabsTrigger>
            <TabsTrigger value="playback">Playback</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Set the name and description for your playlist.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Playlist Name</Label>
                  <Input
                    id="name"
                    value={options.name}
                    onChange={(e) => setOptions({ ...options, name: e.target.value })}
                    placeholder="Enter playlist name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={options.description}
                    onChange={(e) => setOptions({ ...options, description: e.target.value })}
                    placeholder="Enter playlist description"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scaling" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Content Scaling</CardTitle>
                <CardDescription>Configure how different media types are scaled and displayed.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="scale_image">Image Scaling</Label>
                  <Select
                    value={options.scale_image}
                    onValueChange={(value) => setOptions({ ...options, scale_image: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select image scaling" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fit">Fit to Screen</SelectItem>
                      <SelectItem value="fill">Fill Screen</SelectItem>
                      <SelectItem value="stretch">Stretch to Fit</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scale_video">Video Scaling</Label>
                  <Select
                    value={options.scale_video}
                    onValueChange={(value) => setOptions({ ...options, scale_video: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select video scaling" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fit">Fit to Screen</SelectItem>
                      <SelectItem value="fill">Fill Screen</SelectItem>
                      <SelectItem value="stretch">Stretch to Fit</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scale_document">Document Scaling</Label>
                  <Select
                    value={options.scale_document}
                    onValueChange={(value) => setOptions({ ...options, scale_document: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select document scaling" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fit">Fit to Screen</SelectItem>
                      <SelectItem value="fill">Fill Screen</SelectItem>
                      <SelectItem value="stretch">Stretch to Fit</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="playback" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Playback Settings</CardTitle>
                <CardDescription>Configure how your playlist plays and transitions between items.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="shuffle">Shuffle Playback</Label>
                    <div className="text-sm text-muted-foreground">Play items in random order</div>
                  </div>
                  <Switch
                    id="shuffle"
                    checked={options.shuffle}
                    onCheckedChange={(checked) => setOptions({ ...options, shuffle: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto_advance">Auto Advance</Label>
                    <div className="text-sm text-muted-foreground">Automatically advance to next item</div>
                  </div>
                  <Switch
                    id="auto_advance"
                    checked={options.auto_advance}
                    onCheckedChange={(checked) => setOptions({ ...options, auto_advance: checked })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default_transition">Default Transition</Label>
                  <Select
                    value={options.default_transition}
                    onValueChange={(value) => setOptions({ ...options, default_transition: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select transition" />
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
                    value={options.transition_speed}
                    onValueChange={(value) => setOptions({ ...options, transition_speed: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select speed" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slow">Slow</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="fast">Fast</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Visual Appearance</CardTitle>
                <CardDescription>Customize the visual appearance of your playlist.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="background_color">Background Color</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="background_color"
                      type="color"
                      value={options.background_color}
                      onChange={(e) => setOptions({ ...options, background_color: e.target.value })}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      value={options.background_color}
                      onChange={(e) => setOptions({ ...options, background_color: e.target.value })}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="text_overlay">Text Overlay</Label>
                    <div className="text-sm text-muted-foreground">Show text overlays on media</div>
                  </div>
                  <Switch
                    id="text_overlay"
                    checked={options.text_overlay}
                    onCheckedChange={(checked) => setOptions({ ...options, text_overlay: checked })}
                  />
                </div>
              </CardContent>
            </Card>
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
