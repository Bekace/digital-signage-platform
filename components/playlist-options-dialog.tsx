"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Monitor,
  Play,
  Shuffle,
  RotateCcw,
  Palette,
  Type,
  Clock,
  Calendar,
  Settings,
  ImageIcon,
  Video,
  FileText,
} from "lucide-react"

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
  }

  const updateOption = (key: keyof PlaylistOptions, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Playlist Settings</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="display" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="display" className="flex items-center space-x-2">
              <Monitor className="h-4 w-4" />
              <span>Display</span>
            </TabsTrigger>
            <TabsTrigger value="playback" className="flex items-center space-x-2">
              <Play className="h-4 w-4" />
              <span>Playback</span>
            </TabsTrigger>
            <TabsTrigger value="transitions" className="flex items-center space-x-2">
              <Shuffle className="h-4 w-4" />
              <span>Transitions</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Schedule</span>
            </TabsTrigger>
          </TabsList>

          {/* Display Settings */}
          <TabsContent value="display" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Monitor className="h-5 w-5" />
                  <span>Media Scaling</span>
                </CardTitle>
                <CardDescription>Configure how different media types are displayed on screens</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="flex items-center space-x-2">
                      <ImageIcon className="h-4 w-4" />
                      <span>Image Scaling</span>
                    </Label>
                    <Select value={formData.scale_image} onValueChange={(value) => updateOption("scale_image", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fit">Fit to screen</SelectItem>
                        <SelectItem value="fill">Fill screen</SelectItem>
                        <SelectItem value="stretch">Stretch to fit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center space-x-2">
                      <Video className="h-4 w-4" />
                      <span>Video Scaling</span>
                    </Label>
                    <Select value={formData.scale_video} onValueChange={(value) => updateOption("scale_video", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fit">Fit to screen</SelectItem>
                        <SelectItem value="fill">Fill screen</SelectItem>
                        <SelectItem value="stretch">Stretch to fit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>Document Scaling</span>
                    </Label>
                    <Select
                      value={formData.scale_document}
                      onValueChange={(value) => updateOption("scale_document", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fit">Fit to screen</SelectItem>
                        <SelectItem value="fill">Fill screen</SelectItem>
                        <SelectItem value="stretch">Stretch to fit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="h-5 w-5" />
                  <span>Appearance</span>
                </CardTitle>
                <CardDescription>Customize the visual appearance of your playlist</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="background-color">Background Color</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="background-color"
                        type="color"
                        value={formData.background_color}
                        onChange={(e) => updateOption("background_color", e.target.value)}
                        className="w-16 h-10 p-1 border rounded"
                      />
                      <Input
                        value={formData.background_color}
                        onChange={(e) => updateOption("background_color", e.target.value)}
                        placeholder="#000000"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center space-x-2">
                        <Type className="h-4 w-4" />
                        <span>Text Overlay</span>
                      </Label>
                      <p className="text-sm text-gray-500">Show file names on media</p>
                    </div>
                    <Switch
                      checked={formData.text_overlay}
                      onCheckedChange={(checked) => updateOption("text_overlay", checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Playback Settings */}
          <TabsContent value="playback" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Play className="h-5 w-5" />
                  <span>Playback Options</span>
                </CardTitle>
                <CardDescription>Control how your playlist plays back content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center space-x-2">
                        <RotateCcw className="h-4 w-4" />
                        <span>Loop Playlist</span>
                      </Label>
                      <p className="text-sm text-gray-500">Restart from beginning when finished</p>
                    </div>
                    <Switch
                      checked={formData.loop_playlist}
                      onCheckedChange={(checked) => updateOption("loop_playlist", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center space-x-2">
                        <Shuffle className="h-4 w-4" />
                        <span>Shuffle Mode</span>
                      </Label>
                      <p className="text-sm text-gray-500">Play items in random order</p>
                    </div>
                    <Switch
                      checked={formData.shuffle}
                      onCheckedChange={(checked) => updateOption("shuffle", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>Auto Advance</span>
                      </Label>
                      <p className="text-sm text-gray-500">Automatically move to next item</p>
                    </div>
                    <Switch
                      checked={formData.auto_advance}
                      onCheckedChange={(checked) => updateOption("auto_advance", checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transition Settings */}
          <TabsContent value="transitions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shuffle className="h-5 w-5" />
                  <span>Transition Effects</span>
                </CardTitle>
                <CardDescription>Configure how media transitions between items</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Default Transition</Label>
                    <Select
                      value={formData.default_transition}
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
                        <SelectItem value="flip">Flip</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Transition Speed</Label>
                    <Select
                      value={formData.transition_speed}
                      onValueChange={(value) => updateOption("transition_speed", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="slow">Slow (2s)</SelectItem>
                        <SelectItem value="normal">Normal (1s)</SelectItem>
                        <SelectItem value="fast">Fast (0.5s)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Transition Preview</h4>
                  <p className="text-sm text-gray-600">
                    Current setting: <Badge variant="outline">{formData.default_transition}</Badge> at{" "}
                    <Badge variant="outline">{formData.transition_speed}</Badge> speed
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule Settings */}
          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Schedule Settings</span>
                </CardTitle>
                <CardDescription>Configure when this playlist should be active (Coming Soon)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Scheduling Coming Soon</h3>
                  <p className="text-gray-500">Advanced scheduling features will be available in a future update.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Separator />

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Settings</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
