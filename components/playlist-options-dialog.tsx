"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
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
  onSave: (options: PlaylistOptions) => Promise<void>
}

export function PlaylistOptionsDialog({ open, onOpenChange, options, onSave }: PlaylistOptionsDialogProps) {
  const [formData, setFormData] = useState<PlaylistOptions>(options)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setFormData(options)
  }, [options])

  const handleSave = async () => {
    setLoading(true)
    try {
      await onSave(formData)
      toast.success("Playlist settings saved successfully")
    } catch (error) {
      toast.error("Failed to save playlist settings")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData(options)
    toast.info("Settings reset to saved values")
  }

  const updateField = (field: keyof PlaylistOptions, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                    <Select value={formData.scale_image} onValueChange={(value) => updateField("scale_image", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fit">Fit - Maintain aspect ratio</SelectItem>
                        <SelectItem value="fill">Fill - Crop to fill screen</SelectItem>
                        <SelectItem value="stretch">Stretch - Fill entire screen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center space-x-2">
                      <Video className="h-4 w-4" />
                      <span>Video Scaling</span>
                    </Label>
                    <Select value={formData.scale_video} onValueChange={(value) => updateField("scale_video", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fit">Fit - Maintain aspect ratio</SelectItem>
                        <SelectItem value="fill">Fill - Crop to fill screen</SelectItem>
                        <SelectItem value="stretch">Stretch - Fill entire screen</SelectItem>
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
                      onValueChange={(value) => updateField("scale_document", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fit">Fit - Maintain aspect ratio</SelectItem>
                        <SelectItem value="fill">Fill - Crop to fill screen</SelectItem>
                        <SelectItem value="stretch">Stretch - Fill entire screen</SelectItem>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="background-color">Background Color</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="background-color"
                        type="color"
                        value={formData.background_color}
                        onChange={(e) => updateField("background_color", e.target.value)}
                        className="w-16 h-10 p-1 border rounded"
                      />
                      <Input
                        type="text"
                        value={formData.background_color}
                        onChange={(e) => updateField("background_color", e.target.value)}
                        placeholder="#000000"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center space-x-2">
                      <Type className="h-4 w-4" />
                      <span>Text Overlay</span>
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.text_overlay}
                        onCheckedChange={(checked) => updateField("text_overlay", checked)}
                      />
                      <span className="text-sm text-gray-600">Show file names on screen</span>
                    </div>
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
                  <span>Playback Behavior</span>
                </CardTitle>
                <CardDescription>Control how your playlist plays on screens</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="flex items-center space-x-2">
                          <RotateCcw className="h-4 w-4" />
                          <span>Loop Playlist</span>
                        </Label>
                        <p className="text-sm text-gray-600">Restart from beginning when playlist ends</p>
                      </div>
                      <Switch
                        checked={formData.loop_playlist}
                        onCheckedChange={(checked) => updateField("loop_playlist", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="flex items-center space-x-2">
                          <Shuffle className="h-4 w-4" />
                          <span>Shuffle</span>
                        </Label>
                        <p className="text-sm text-gray-600">Play items in random order</p>
                      </div>
                      <Switch
                        checked={formData.shuffle}
                        onCheckedChange={(checked) => updateField("shuffle", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="flex items-center space-x-2">
                          <Clock className="h-4 w-4" />
                          <span>Auto Advance</span>
                        </Label>
                        <p className="text-sm text-gray-600">Automatically move to next item</p>
                      </div>
                      <Switch
                        checked={formData.auto_advance}
                        onCheckedChange={(checked) => updateField("auto_advance", checked)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Current Settings</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Loop:</span>
                          <Badge variant={formData.loop_playlist ? "default" : "secondary"}>
                            {formData.loop_playlist ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Shuffle:</span>
                          <Badge variant={formData.shuffle ? "default" : "secondary"}>
                            {formData.shuffle ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Auto Advance:</span>
                          <Badge variant={formData.auto_advance ? "default" : "secondary"}>
                            {formData.auto_advance ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                      </div>
                    </div>
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
                <CardDescription>Configure how items transition between each other</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Default Transition</Label>
                    <Select
                      value={formData.default_transition}
                      onValueChange={(value) => updateField("default_transition", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fade">Fade</SelectItem>
                        <SelectItem value="slide">Slide</SelectItem>
                        <SelectItem value="zoom">Zoom</SelectItem>
                        <SelectItem value="flip">Flip</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Transition Speed</Label>
                    <Select
                      value={formData.transition_speed}
                      onValueChange={(value) => updateField("transition_speed", value)}
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

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium mb-2 text-blue-900">Transition Preview</h4>
                  <p className="text-sm text-blue-700">
                    Items will transition using <strong>{formData.default_transition}</strong> effect at{" "}
                    <strong>{formData.transition_speed}</strong> speed.
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
                  <p className="text-gray-600">
                    Advanced scheduling features will be available in a future update. For now, playlists are active
                    when assigned to screens.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Separator />

        <div className="flex justify-between">
          <Button variant="outline" onClick={handleReset} disabled={loading}>
            Reset Changes
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
