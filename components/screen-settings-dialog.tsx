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
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Monitor, MapPin, Volume2, Sun, Wifi, Battery, Clock, RefreshCw } from "lucide-react"

interface Device {
  id: string
  name: string
  location?: string
  notes?: string
  status: "online" | "offline" | "playing" | "paused"
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
        toast({
          title: "Settings saved",
          description: "Device settings have been updated successfully.",
        })
        onDeviceUpdate({ ...device, ...formData })
        onOpenChange(false)
      } else {
        throw new Error(data.error || "Failed to save settings")
      }
    } catch (error) {
      console.error("Save settings error:", error)
      toast({
        title: "Error",
        description: "Failed to save device settings. Please try again.",
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
      console.error("Restart error:", error)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
      case "playing":
        return "bg-green-500"
      case "paused":
        return "bg-yellow-500"
      case "offline":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
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
            <div className="flex items-center gap-2 mb-4">
              <Badge className={getStatusColor(device.status)}>{device.status}</Badge>
              <span className="text-sm text-gray-500">
                Last seen: {device.last_seen ? new Date(device.last_seen).toLocaleString() : "Never"}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Device Name</Label>
                <Input
                  id="name"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter device name"
                />
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="location"
                    className="pl-10"
                    value={formData.location || ""}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Main Lobby, Conference Room A"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add any notes about this device..."
                  rows={3}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="display" className="space-y-4">
            <div className="space-y-6">
              <div>
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

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sun className="h-4 w-4" />
                  <Label>Brightness: {formData.brightness || 80}%</Label>
                </div>
                <Slider
                  value={[formData.brightness || 80]}
                  onValueChange={(value) => setFormData({ ...formData, brightness: value[0] })}
                  max={100}
                  min={10}
                  step={5}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Volume2 className="h-4 w-4" />
                  <Label>Volume: {formData.volume || 50}%</Label>
                </div>
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
            <div className="space-y-6">
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
                <div>
                  <Label htmlFor="restart-time">Restart Time</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="restart-time"
                      type="time"
                      className="pl-10"
                      value={formData.restart_time || "02:00"}
                      onChange={(e) => setFormData({ ...formData, restart_time: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <Separator />

              <div>
                <Label>Manual Restart</Label>
                <p className="text-sm text-gray-500 mb-3">Immediately restart this device</p>
                <Button
                  variant="outline"
                  onClick={handleRestart}
                  disabled={isLoading}
                  className="w-full bg-transparent"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Restart Device
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Device ID</Label>
                  <Input value={device.id} disabled className="font-mono text-sm" />
                </div>
                <div>
                  <Label>Device Type</Label>
                  <Input value={device.type} disabled />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>IP Address</Label>
                  <Input value={device.ip_address || "Unknown"} disabled />
                </div>
                <div>
                  <Label>Last Seen</Label>
                  <Input value={device.last_seen ? new Date(device.last_seen).toLocaleString() : "Never"} disabled />
                </div>
              </div>

              {(device.battery_level !== undefined || device.wifi_strength !== undefined) && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    {device.battery_level !== undefined && (
                      <div className="flex items-center gap-2">
                        <Battery className="h-4 w-4" />
                        <span className="text-sm">Battery: {device.battery_level}%</span>
                      </div>
                    )}
                    {device.wifi_strength !== undefined && (
                      <div className="flex items-center gap-2">
                        <Wifi className="h-4 w-4" />
                        <span className="text-sm">WiFi: {device.wifi_strength}%</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              <Separator />

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Device Information</h4>
                <div className="text-sm space-y-1">
                  <p>
                    <strong>Status:</strong> {device.status}
                  </p>
                  <p>
                    <strong>Type:</strong> {device.type}
                  </p>
                  <p>
                    <strong>Orientation:</strong> {device.orientation || "landscape"}
                  </p>
                  <p>
                    <strong>Auto Restart:</strong> {device.auto_restart ? "Enabled" : "Disabled"}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Settings"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
