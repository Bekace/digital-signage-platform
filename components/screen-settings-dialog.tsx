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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Settings, RotateCcw } from "lucide-react"

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
  ip_address?: string
  battery_level?: number
  wifi_strength?: number
  code?: string
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
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    notes: "",
    orientation: "landscape" as "landscape" | "portrait",
    brightness: 80,
    volume: 50,
    auto_restart: false,
    restart_time: "02:00",
  })

  useEffect(() => {
    if (device) {
      setFormData({
        name: device.name || "",
        location: device.location || "",
        notes: device.notes || "",
        orientation: device.orientation || "landscape",
        brightness: device.brightness || 80,
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
        onDeviceUpdate({ ...device, ...formData })
        toast({
          title: "Settings updated",
          description: "Device settings have been saved successfully.",
        })
        onOpenChange(false)
      } else {
        throw new Error(data.error || "Failed to update device")
      }
    } catch (error) {
      console.error("Update device error:", error)
      toast({
        title: "Error",
        description: "Failed to update device settings. Please try again.",
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
          title: "Restart initiated",
          description: "Device restart command has been sent.",
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
            Device Settings
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
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Device Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter device name"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Main Lobby, Conference Room A"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes about this device"
                  rows={3}
                />
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Status Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <Badge variant={device.status === "online" ? "default" : "secondary"}>{device.status}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Last Seen:</span>
                    <span className="text-sm">
                      {device.last_seen ? new Date(device.last_seen).toLocaleString() : "Never"}
                    </span>
                  </div>
                  {device.ip_address && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">IP Address:</span>
                      <span className="text-sm font-mono">{device.ip_address}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="display" className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Orientation</Label>
                <Select
                  value={formData.orientation}
                  onValueChange={(value: "landscape" | "portrait") => setFormData({ ...formData, orientation: value })}
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

              <div className="grid gap-2">
                <Label>Brightness: {formData.brightness}%</Label>
                <Slider
                  value={[formData.brightness]}
                  onValueChange={(value) => setFormData({ ...formData, brightness: value[0] })}
                  max={100}
                  min={10}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="grid gap-2">
                <Label>Volume: {formData.volume}%</Label>
                <Slider
                  value={[formData.volume]}
                  onValueChange={(value) => setFormData({ ...formData, volume: value[0] })}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
              </div>

              {(device.battery_level !== undefined || device.wifi_strength !== undefined) && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Device Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {device.battery_level !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Battery:</span>
                        <span className="text-sm">{device.battery_level}%</span>
                      </div>
                    )}
                    {device.wifi_strength !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">WiFi Signal:</span>
                        <span className="text-sm">{device.wifi_strength}%</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto Restart</Label>
                  <p className="text-sm text-gray-600">Automatically restart the device daily</p>
                </div>
                <Switch
                  checked={formData.auto_restart}
                  onCheckedChange={(checked) => setFormData({ ...formData, auto_restart: checked })}
                />
              </div>

              {formData.auto_restart && (
                <div className="grid gap-2">
                  <Label htmlFor="restart-time">Restart Time</Label>
                  <Input
                    id="restart-time"
                    type="time"
                    value={formData.restart_time}
                    onChange={(e) => setFormData({ ...formData, restart_time: e.target.value })}
                  />
                </div>
              )}

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Manual Actions</CardTitle>
                  <CardDescription>Perform immediate actions on the device</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleRestart}
                    disabled={isLoading}
                    variant="outline"
                    className="w-full bg-transparent"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restart Device Now
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div className="grid gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Device Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Device ID:</span>
                    <span className="text-sm font-mono">{device.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Type:</span>
                    <span className="text-sm">{device.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Pairing Code:</span>
                    <span className="text-sm font-mono">{device.code || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Created:</span>
                    <span className="text-sm">
                      {device.created_at ? new Date(device.created_at).toLocaleDateString() : "Unknown"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Diagnostics</CardTitle>
                  <CardDescription>Device health and performance information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Connection:</span>
                    <Badge variant={device.status === "online" ? "default" : "secondary"}>
                      {device.status === "online" ? "Connected" : "Disconnected"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Uptime:</span>
                    <span className="text-sm">
                      {device.last_seen ? `Since ${new Date(device.last_seen).toLocaleDateString()}` : "Unknown"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
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
