"use client"

import { useState } from "react"
import { Settings, ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

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
  open?: boolean
  onOpenChange?: (open: boolean) => void
  options: PlaylistOptions
  onSave: (options: PlaylistOptions) => void
}

export function PlaylistOptionsDialog({ open, onOpenChange, options, onSave }: PlaylistOptionsDialogProps) {
  const [localOptions, setLocalOptions] = useState<PlaylistOptions>(options)
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleSave = () => {
    onSave(localOptions)
    if (onOpenChange) {
      onOpenChange(false)
    } else {
      setIsDialogOpen(false)
    }
  }

  const handleCancel = () => {
    setLocalOptions(options) // Reset to original options
    if (onOpenChange) {
      onOpenChange(false)
    } else {
      setIsDialogOpen(false)
    }
  }

  const updateOption = (key: keyof PlaylistOptions, value: any) => {
    setLocalOptions((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const dialogOpen = open !== undefined ? open : isDialogOpen
  const setDialogOpen = onOpenChange || setIsDialogOpen

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-gray-100 rounded-full w-fit">
            <Settings className="h-6 w-6 text-gray-600" />
          </div>
          <DialogTitle className="text-xl">Playlist Options</DialogTitle>
          <DialogDescription>Configure how your playlist content is displayed and behaves.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Scale Image */}
          <div className="flex items-center justify-between">
            <Label htmlFor="scale-image" className="text-sm font-medium text-gray-700">
              Scale Image
            </Label>
            <Select value={localOptions.scale_image} onValueChange={(value) => updateOption("scale_image", value)}>
              <SelectTrigger className="w-32">
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

          {/* Scale Video */}
          <div className="flex items-center justify-between">
            <Label htmlFor="scale-video" className="text-sm font-medium text-gray-700">
              Scale Video
            </Label>
            <Select value={localOptions.scale_video} onValueChange={(value) => updateOption("scale_video", value)}>
              <SelectTrigger className="w-32">
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

          {/* Scale Document */}
          <div className="flex items-center justify-between">
            <Label htmlFor="scale-document" className="text-sm font-medium text-gray-700">
              Scale Document
            </Label>
            <Select
              value={localOptions.scale_document}
              onValueChange={(value) => updateOption("scale_document", value)}
            >
              <SelectTrigger className="w-32">
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

          {/* Shuffle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="shuffle" className="text-sm font-medium text-gray-700">
              Shuffle
            </Label>
            <div className="flex items-center space-x-2">
              <Switch
                id="shuffle"
                checked={localOptions.shuffle}
                onCheckedChange={(checked) => updateOption("shuffle", checked)}
              />
              <span className="text-xs font-medium text-teal-600 bg-teal-50 px-2 py-1 rounded">
                {localOptions.shuffle ? "ON" : "OFF"}
              </span>
            </div>
          </div>

          {/* Default Transition */}
          <div className="flex items-center justify-between">
            <Label htmlFor="default-transition" className="text-sm font-medium text-gray-700">
              Default Transition
            </Label>
            <Select
              value={localOptions.default_transition}
              onValueChange={(value) => updateOption("default_transition", value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fade">Fade</SelectItem>
                <SelectItem value="slide">Slide</SelectItem>
                <SelectItem value="zoom">Zoom</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Transition Speed */}
          <div className="flex items-center justify-between">
            <Label htmlFor="transition-speed" className="text-sm font-medium text-gray-700">
              Transition Speed
            </Label>
            <Select
              value={localOptions.transition_speed}
              onValueChange={(value) => updateOption("transition_speed", value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="slow">Slow</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="fast">Fast</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Advanced Options */}
          <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto text-blue-600 hover:text-blue-700">
                <span className="text-sm font-medium">Advanced</span>
                {isAdvancedOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mt-4 pt-4 border-t">
              {/* Auto Advance */}
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-advance" className="text-sm font-medium text-gray-700">
                  Auto Advance
                </Label>
                <Switch
                  id="auto-advance"
                  checked={localOptions.auto_advance}
                  onCheckedChange={(checked) => updateOption("auto_advance", checked)}
                />
              </div>

              {/* Loop Playlist */}
              <div className="flex items-center justify-between">
                <Label htmlFor="loop-playlist" className="text-sm font-medium text-gray-700">
                  Loop Playlist
                </Label>
                <Switch
                  id="loop-playlist"
                  checked={localOptions.loop_playlist}
                  onCheckedChange={(checked) => updateOption("loop_playlist", checked)}
                />
              </div>

              {/* Background Color */}
              <div className="flex items-center justify-between">
                <Label htmlFor="background-color" className="text-sm font-medium text-gray-700">
                  Background Color
                </Label>
                <Select
                  value={localOptions.background_color}
                  onValueChange={(value) => updateOption("background_color", value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="black">Black</SelectItem>
                    <SelectItem value="white">White</SelectItem>
                    <SelectItem value="gray">Gray</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Text Overlay */}
              <div className="flex items-center justify-between">
                <Label htmlFor="text-overlay" className="text-sm font-medium text-gray-700">
                  Text Overlay
                </Label>
                <Switch
                  id="text-overlay"
                  checked={localOptions.text_overlay}
                  onCheckedChange={(checked) => updateOption("text_overlay", checked)}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleCancel}>
            Close
          </Button>
          <Button onClick={handleSave} className="bg-teal-600 hover:bg-teal-700">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
