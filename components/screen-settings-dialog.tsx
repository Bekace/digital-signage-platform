"use client"

import { useState, useEffect } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Settings, Zap, RotateCcw } from "lucide-react"

interface Device {
  id: string
  name: string
  location?: string
  notes?: string
  status: string
  type: string
  orientation?: "landscape" | "portrait"
  brightness?: number
  volume?: number
  auto_restart?: boolean
  restart_time?: string
  last_seen?: string
  created_at?: string
}

interface ScreenSettingsDialogProps {
  device: Device | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeviceUpdate: (device: Device) => void
}

export function ScreenSettingsDialog({ device, open, onOpenChange, onDeviceUpdate }: ScreenSettingsDialogProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<Device>>({})

  useEffect(() => {
    if (device) {
      setFormData({
        name: device.name,
        location: device.location || "",
        notes: device.notes || "",
        orientation: device.orientation || "landscape",
        brightness: device.brightness || 100,
        volume: device.volume || 50,
        auto_restart: device.auto_restart || false,
        restart_time: device.restart_time || "02:00",
      })
    }
  }, [device])

  const handleSave = async () => {
    if (!device) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/devices/${device.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        const updatedDevice = { ...device, ...formData }
        onDeviceUpdate(updatedDevice)
        toast({
          title: "Settings saved",
          description: "Device settings have been updated successfully.",
        })
        onOpenChange(false)
      } else {
        throw new Error(data.error || "Failed to update device")
      }
    } catch (error) {
      console.error("Update device error:", error)
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRestart = async () => {
    if (!device) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/devices/${device.id}/restart`, {
        method: "POST",
        credentials: "include",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Restart command sent",
          description: "The device will restart shortly.",
        })
      } else {
        throw new Error(data.error || "Failed to restart device")
      }
    } catch (error) {
      console.error("Restart device error:", error)
      toast({
        title: "Error",
        description: "Failed to restart device. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!device) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Screen Settings
          </DialogTitle>
          <DialogDescription>Configure settings for {device.name}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="display">Display</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Device Name</Label>
                <Input
                  id="name"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter device name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location || ""}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Lobby, Conference Room"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any notes about this device..."
                rows={3}
              />
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Device Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Current Status:</span>
                  <Badge variant={device.status === "online" ? "default" : "secondary"}>{device.status}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Device Type:</span>
                  <span className="text-sm">{device.type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Seen:</span>
                  <span className="text-sm">
                    {device.last_seen ? new Date(device.last_seen).toLocaleString() : "Never"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="display" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Orientation</Label>
                <Select
                  value={formData.orientation || "landscape"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, orientation: value as "landscape" | "portrait" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="landscape">Landscape</SelectItem>
                    <SelectItem value="portrait">Portrait</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Brightness: {formData.brightness || 100}%</Label>
                <Slider
                  value={[formData.brightness || 100]}
                  onValueChange={(value) => setFormData({ ...formData, brightness: value[0] })}
                  max={100}
                  min={10}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Volume: {formData.volume || 50}%</Label>
                <Slider
                  value={[formData.volume || 50]}
                  onValueChange={(value) => setFormData({ ...formData, volume: value[0] })}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto Restart</Label>
                  <p className="text-sm text-gray-500">Automatically restart the device daily</p>
                </div>
                <Switch
                  checked={formData.auto_restart || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, auto_restart: checked })}
                />
              </div>

              {formData.auto_restart && (
                <div className="space-y-2">
                  <Label htmlFor="restart-time">Restart Time</Label>
                  <Input
                    id="restart-time"
                    type="time"
                    value={formData.restart_time || "02:00"}
                    onChange={(e) => setFormData({ ...formData, restart_time: e.target.value })}
                  />
                </div>
              )}

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Manual Restart
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">Restart the device immediately</p>
                  <Button onClick={handleRestart} disabled={isLoading} variant="outline" size="sm">
                    {isLoading ? "Restarting..." : "Restart Now"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Device Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Device ID:</span>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">{device.id}</code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Type:</span>
                  <span className="text-sm">{device.type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Created:</span>
                  <span className="text-sm">
                    {device.created_at ? new Date(device.created_at).toLocaleDateString() : "Unknown"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Diagnostics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">Run diagnostic tests on the device</p>
                <Button variant="outline" size="sm" disabled>
                  Run Diagnostics (Coming Soon)
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
