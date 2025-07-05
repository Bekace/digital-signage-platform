"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import {
  Loader2,
  Settings,
  Monitor,
  Wifi,
  Volume2,
  FlashlightIcon as Brightness4,
  RotateCcw,
  Save,
  AlertCircle,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Device {
  id: string
  name: string
  type: string
  status: string
  location?: string
  lastSeen: string
  resolution?: string
  orientation?: string
  brightness?: number
  volume?: number
  autoRestart?: boolean
  restartTime?: string
  notes?: string
}

interface ScreenSettingsDialogProps {
  device: Device
  onDeviceUpdated: () => void
}

export function ScreenSettingsDialog({ device, onDeviceUpdated }: ScreenSettingsDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [settings, setSettings] = useState({
    name: device.name,
    location: device.location || "",
    orientation: device.orientation || "landscape",
    brightness: device.brightness || 80,
    volume: device.volume || 50,
    autoRestart: device.autoRestart || false,
    restartTime: device.restartTime || "03:00",
    notes: device.notes || "",
  })
  const { toast } = useToast()

  const orientations = [
    { value: "landscape", label: "Landscape (16:9)" },
    { value: "portrait", label: "Portrait (9:16)" },
    { value: "square", label: "Square (1:1)" },
  ]

  const resetSettings = () => {
    setSettings({
      name: device.name,
      location: device.location || "",
      orientation: device.orientation || "landscape",
      brightness: device.brightness || 80,
      volume: device.volume || 50,
      autoRestart: device.autoRestart || false,
      restartTime: device.restartTime || "03:00",
      notes: device.notes || "",
    })
    setError("")
  }

  const handleSave = async () => {
    if (!settings.name.trim()) {
      setError("Device name is required")
      return
    }

    setSaving(true)
    setError("")

    try {
      const response = await fetch(`/api/devices/${device.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(settings),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      if (data.success) {
        toast({
          title: "Settings saved",
          description: `${settings.name} settings have been updated`,
        })
        setOpen(false)
        onDeviceUpdated()
      } else {
        throw new Error(data.error || "Failed to save settings")
      }
    } catch (error) {
      console.error("Save settings error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to save settings"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleRestart = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/devices/${device.id}/restart`, {
        method: "POST",
        credentials: "include",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Restart command sent",
          description: `${device.name} will restart shortly`,
        })
      } else {
        throw new Error(data.error || "Failed to restart device")
      }
    } catch (error) {
      console.error("Restart error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to restart device",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      resetSettings()
    }
  }, [open, device])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Screen Settings - {device.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="display">Display</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Device Information</CardTitle>
                <CardDescription>Basic device settings and information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Device Name</Label>
                    <Input
                      id="name"
                      value={settings.name}
                      onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                      placeholder="e.g., Lobby Display"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={settings.location}
                      onChange={(e) => setSettings({ ...settings, location: e.target.value })}
                      placeholder="e.g., Main Lobby"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={settings.notes}
                    onChange={(e) => setSettings({ ...settings, notes: e.target.value })}
                    placeholder="Additional notes about this device..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Status</Label>
                    <Badge variant={device.status === "online" ? "default" : "secondary"}>{device.status}</Badge>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Last Seen</Label>
                    <p className="text-sm text-gray-600">{new Date(device.lastSeen).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="display" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Display Settings
                </CardTitle>
                <CardDescription>Configure display orientation, brightness, and volume</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="orientation">Screen Orientation</Label>
                  <Select
                    value={settings.orientation}
                    onValueChange={(value) => setSettings({ ...settings, orientation: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {orientations.map((orientation) => (
                        <SelectItem key={orientation.value} value={orientation.value}>
                          {orientation.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Brightness4 className="h-4 w-4" />
                    <Label>Brightness: {settings.brightness}%</Label>
                  </div>
                  <Slider
                    value={[settings.brightness]}
                    onValueChange={(value) => setSettings({ ...settings, brightness: value[0] })}
                    max={100}
                    min={10}
                    step={5}
                    className="w-full"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    <Label>Volume: {settings.volume}%</Label>
                  </div>
                  <Slider
                    value={[settings.volume]}
                    onValueChange={(value) => setSettings({ ...settings, volume: value[0] })}
                    max={100}
                    min={0}
                    step={5}
                    className="w-full"
                  />
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600">Current Resolution: {device.resolution || "1920x1080"}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <RotateCcw className="h-5 w-5" />
                  Schedule Settings
                </CardTitle>
                <CardDescription>Configure automatic restart and maintenance schedules</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Auto Restart</Label>
                    <p className="text-sm text-gray-600">Automatically restart the device daily</p>
                  </div>
                  <Switch
                    checked={settings.autoRestart}
                    onCheckedChange={(checked) => setSettings({ ...settings, autoRestart: checked })}
                  />
                </div>

                {settings.autoRestart && (
                  <div className="space-y-2 pl-4 border-l-2 border-gray-200">
                    <Label htmlFor="restartTime">Restart Time</Label>
                    <Input
                      id="restartTime"
                      type="time"
                      value={settings.restartTime}
                      onChange={(e) => setSettings({ ...settings, restartTime: e.target.value })}
                    />
                    <p className="text-xs text-gray-500">Device will restart daily at this time</p>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={handleRestart}
                    disabled={loading || device.status !== "online"}
                    className="w-full bg-transparent"
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Restart Device Now
                  </Button>
                  {device.status !== "online" && (
                    <p className="text-xs text-gray-500 mt-2 text-center">Device must be online to restart</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wifi className="h-5 w-5" />
                  Advanced Settings
                </CardTitle>
                <CardDescription>Advanced device configuration and diagnostics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Device ID</Label>
                    <p className="text-sm font-mono bg-gray-100 p-2 rounded">{device.id}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Device Type</Label>
                    <p className="text-sm capitalize">{device.type}</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Advanced settings may affect device performance. Contact support if you need assistance.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
