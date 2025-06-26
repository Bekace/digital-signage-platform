"use client"

import { useState } from "react"
import { Settings, ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface PlaylistOptions {
  scaleImage: string
  scaleVideo: string
  scaleDocument: string
  shuffle: boolean
  defaultTransition: string
  transitionSpeed: string
  autoAdvance: boolean
  loopPlaylist: boolean
  backgroundColor: string
  textOverlay: boolean
}

interface PlaylistOptionsDialogProps {
  playlistId: string
  initialOptions?: Partial<PlaylistOptions>
  onSave?: (options: PlaylistOptions) => void
}

const defaultOptions: PlaylistOptions = {
  scaleImage: "fit",
  scaleVideo: "fit",
  scaleDocument: "fit",
  shuffle: false,
  defaultTransition: "fade",
  transitionSpeed: "medium",
  autoAdvance: true,
  loopPlaylist: false,
  backgroundColor: "black",
  textOverlay: false,
}

export function PlaylistOptionsDialog({ playlistId, initialOptions = {}, onSave }: PlaylistOptionsDialogProps) {
  const [options, setOptions] = useState<PlaylistOptions>({
    ...defaultOptions,
    ...initialOptions,
  })
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/playlists/${playlistId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          settings: options,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save playlist options")
      }

      toast.success("Playlist options saved successfully")
      onSave?.(options)
      setOpen(false)
    } catch (error) {
      console.error("Error saving playlist options:", error)
      toast.error("Failed to save playlist options")
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    // Reset to initial options on cancel
    setOptions({
      ...defaultOptions,
      ...initialOptions,
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-500" />
            Playlist Options
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Scale Image */}
          <div className="flex items-center justify-between">
            <Label htmlFor="scale-image" className="text-sm font-medium text-gray-700">
              Scale Image
            </Label>
            <Select value={options.scaleImage} onValueChange={(value) => setOptions({ ...options, scaleImage: value })}>
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
            <Select value={options.scaleVideo} onValueChange={(value) => setOptions({ ...options, scaleVideo: value })}>
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
              value={options.scaleDocument}
              onValueChange={(value) => setOptions({ ...options, scaleDocument: value })}
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
            <div className="flex items-center gap-2">
              <Switch
                id="shuffle"
                checked={options.shuffle}
                onCheckedChange={(checked) => setOptions({ ...options, shuffle: checked })}
              />
              <span className="text-xs text-gray-500 min-w-[24px]">{options.shuffle ? "ON" : "OFF"}</span>
            </div>
          </div>

          {/* Default Transition */}
          <div className="flex items-center justify-between">
            <Label htmlFor="default-transition" className="text-sm font-medium text-gray-700">
              Default Transition
            </Label>
            <Select
              value={options.defaultTransition}
              onValueChange={(value) => setOptions({ ...options, defaultTransition: value })}
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
              value={options.transitionSpeed}
              onValueChange={(value) => setOptions({ ...options, transitionSpeed: value })}
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

          {/* Advanced Section */}
          <div className="border-t pt-4">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              {showAdvanced ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              Advanced
            </button>

            {showAdvanced && (
              <div className="mt-4 space-y-4 pl-6">
                {/* Auto Advance */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-advance" className="text-sm font-medium text-gray-700">
                    Auto Advance
                  </Label>
                  <Switch
                    id="auto-advance"
                    checked={options.autoAdvance}
                    onCheckedChange={(checked) => setOptions({ ...options, autoAdvance: checked })}
                  />
                </div>

                {/* Loop Playlist */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="loop-playlist" className="text-sm font-medium text-gray-700">
                    Loop Playlist
                  </Label>
                  <Switch
                    id="loop-playlist"
                    checked={options.loopPlaylist}
                    onCheckedChange={(checked) => setOptions({ ...options, loopPlaylist: checked })}
                  />
                </div>

                {/* Background Color */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="background-color" className="text-sm font-medium text-gray-700">
                    Background Color
                  </Label>
                  <Select
                    value={options.backgroundColor}
                    onValueChange={(value) => setOptions({ ...options, backgroundColor: value })}
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
                    checked={options.textOverlay}
                    onCheckedChange={(checked) => setOptions({ ...options, textOverlay: checked })}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
