"use client"

import type React from "react"

import { useState } from "react"
import { Settings } from "lucide-react"
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
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronRight } from "lucide-react"

interface PlaylistOptions {
  scale_image: string
  scale_video: string
  scale_document: string
  shuffle: boolean
  default_transition: string
  transition_speed: string
  advanced_options?: {
    auto_advance: boolean
    loop_playlist: boolean
    background_color: string
    text_overlay: boolean
  }
}

interface PlaylistOptionsDialogProps {
  options: PlaylistOptions
  onSave: (options: PlaylistOptions) => void
  trigger?: React.ReactNode
}

export function PlaylistOptionsDialog({ options, onSave, trigger }: PlaylistOptionsDialogProps) {
  const [open, setOpen] = useState(false)
  const [localOptions, setLocalOptions] = useState<PlaylistOptions>(options)
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const handleSave = () => {
    onSave(localOptions)
    setOpen(false)
  }

  const handleClose = () => {
    setLocalOptions(options) // Reset to original options
    setOpen(false)
  }

  const updateOption = (key: keyof PlaylistOptions, value: any) => {
    setLocalOptions((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const updateAdvancedOption = (key: string, value: any) => {
    setLocalOptions((prev) => ({
      ...prev,
      advanced_options: {
        ...prev.advanced_options,
        [key]: value,
      },
    }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-gray-100 rounded-full w-fit">
            <Settings className="h-8 w-8 text-gray-600" />
          </div>
          <DialogTitle className="text-xl">Playlist Options</DialogTitle>
          <DialogDescription>Configure how your playlist content is displayed and behaves.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Scale Image */}
          <div className="flex items-center justify-between">
            <Label htmlFor="scale-image" className="text-sm font-medium">
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
            <Label htmlFor="scale-video" className="text-sm font-medium">
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
            <Label htmlFor="scale-document" className="text-sm font-medium">
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
            <Label htmlFor="shuffle" className="text-sm font-medium">
              Shuffle
            </Label>
            <div className="flex items-center space-x-2">
              <Switch
                id="shuffle"
                checked={localOptions.shuffle}
                onCheckedChange={(checked) => updateOption("shuffle", checked)}
              />
              <span className="text-xs text-gray-500 font-medium">{localOptions.shuffle ? "ON" : "OFF"}</span>
            </div>
          </div>

          {/* Default Transition */}
          <div className="flex items-center justify-between">
            <Label htmlFor="default-transition" className="text-sm font-medium">
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
            <Label htmlFor="transition-speed" className="text-sm font-medium">
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
          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-center p-0 h-auto text-blue-600 hover:text-blue-700">
                <span className="mr-1">Advanced</span>
                <ChevronRight className={`h-4 w-4 transition-transform ${advancedOpen ? "rotate-90" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mt-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-advance" className="text-sm font-medium">
                  Auto Advance
                </Label>
                <Switch
                  id="auto-advance"
                  checked={localOptions.advanced_options?.auto_advance || false}
                  onCheckedChange={(checked) => updateAdvancedOption("auto_advance", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="loop-playlist" className="text-sm font-medium">
                  Loop Playlist
                </Label>
                <Switch
                  id="loop-playlist"
                  checked={localOptions.advanced_options?.loop_playlist || false}
                  onCheckedChange={(checked) => updateAdvancedOption("loop_playlist", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="background-color" className="text-sm font-medium">
                  Background Color
                </Label>
                <Select
                  value={localOptions.advanced_options?.background_color || "black"}
                  onValueChange={(value) => updateAdvancedOption("background_color", value)}
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

              <div className="flex items-center justify-between">
                <Label htmlFor="text-overlay" className="text-sm font-medium">
                  Text Overlay
                </Label>
                <Switch
                  id="text-overlay"
                  checked={localOptions.advanced_options?.text_overlay || false}
                  onCheckedChange={(checked) => updateAdvancedOption("text_overlay", checked)}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleClose}>
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
