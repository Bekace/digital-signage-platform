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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Copy, Monitor, Smartphone, Tv, Globe, CheckCircle } from "lucide-react"

interface AddScreenDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onScreenAdded: () => void
}

export function AddScreenDialog({ open, onOpenChange, onScreenAdded }: AddScreenDialogProps) {
  const [step, setStep] = useState<"form" | "pairing">("form")
  const [screenName, setScreenName] = useState("")
  const [deviceType, setDeviceType] = useState("")
  const [loading, setLoading] = useState(false)
  const [pairingCode, setPairingCode] = useState("")
  const [deviceId, setDeviceId] = useState<number | null>(null)

  const deviceTypes = [
    { value: "fire_tv", label: "Amazon Fire TV", icon: Tv },
    { value: "android_tv", label: "Android TV", icon: Tv },
    { value: "android", label: "Android Device", icon: Smartphone },
    { value: "ios", label: "iOS Device", icon: Smartphone },
    { value: "web", label: "Web Browser", icon: Globe },
    { value: "other", label: "Other Device", icon: Monitor },
  ]

  const generatePairingCode = async () => {
    if (!screenName.trim() || !deviceType) {
      toast.error("Please fill in all fields")
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      if (!token) {
        toast.error("Please log in to add a screen")
        return
      }

      console.log("🔗 [ADD SCREEN] Generating pairing code for:", screenName, deviceType)

      const response = await fetch("/api/devices/generate-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: screenName.trim(),
          deviceType: deviceType,
        }),
      })

      const data = await response.json()
      console.log("🔗 [ADD SCREEN] Generate code response:", data)

      if (data.success) {
        setPairingCode(data.code)
        setDeviceId(data.deviceId)
        setStep("pairing")
        toast.success("Pairing code generated successfully")
      } else {
        toast.error(data.error || "Failed to generate pairing code")
      }
    } catch (error) {
      console.error("❌ [ADD SCREEN] Error generating code:", error)
      toast.error("Failed to generate pairing code")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success("Copied to clipboard")
    } catch (error) {
      console.error("Failed to copy to clipboard:", error)
      toast.error("Failed to copy to clipboard")
    }
  }

  const handleClose = () => {
    setStep("form")
    setScreenName("")
    setDeviceType("")
    setPairingCode("")
    setDeviceId(null)
    onOpenChange(false)
  }

  const handleScreenAdded = () => {
    handleClose()
    onScreenAdded()
    toast.success("Screen added successfully!")
  }

  const getDeviceInstructions = (type: string) => {
    switch (type) {
      case "fire_tv":
        return [
          "Install the Digital Signage app from Amazon Appstore",
          "Open the app on your Fire TV",
          'Select "Pair with Server"',
          "Enter the pairing code shown below",
          "Your Fire TV will connect automatically",
        ]
      case "android_tv":
        return [
          "Install the Digital Signage app from Google Play Store",
          "Open the app on your Android TV",
          'Select "Pair with Server"',
          "Enter the pairing code shown below",
          "Your Android TV will connect automatically",
        ]
      case "android":
        return [
          "Install the Digital Signage app from Google Play Store",
          "Open the app on your Android device",
          'Tap "Pair with Server"',
          "Enter the pairing code shown below",
          "Your device will connect automatically",
        ]
      case "ios":
        return [
          "Install the Digital Signage app from App Store",
          "Open the app on your iOS device",
          'Tap "Pair with Server"',
          "Enter the pairing code shown below",
          "Your device will connect automatically",
        ]
      case "web":
        return [
          "Open a web browser on your device",
          "Navigate to the player URL provided",
          'Click "Pair with Server"',
          "Enter the pairing code shown below",
          "Your browser will connect automatically",
        ]
      default:
        return [
          "Install the appropriate Digital Signage app",
          "Open the app on your device",
          'Look for "Pair with Server" option',
          "Enter the pairing code shown below",
          "Your device will connect automatically",
        ]
    }
  }

  const selectedDeviceType = deviceTypes.find((dt) => dt.value === deviceType)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        {step === "form" ? (
          <>
            <DialogHeader>
              <DialogTitle>Add New Screen</DialogTitle>
              <DialogDescription>Set up a new digital signage display by providing basic information</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="screen-name">Screen Name</Label>
                <Input
                  id="screen-name"
                  placeholder="e.g., Lobby Display, Conference Room TV"
                  value={screenName}
                  onChange={(e) => setScreenName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="device-type">Device Type</Label>
                <Select value={deviceType} onValueChange={setDeviceType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select device type" />
                  </SelectTrigger>
                  <SelectContent>
                    {deviceTypes.map((type) => {
                      const Icon = type.icon
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center">
                            <Icon className="h-4 w-4 mr-2" />
                            {type.label}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={generatePairingCode} disabled={loading}>
                {loading ? "Generating..." : "Generate Pairing Code"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center">
                {selectedDeviceType && <selectedDeviceType.icon className="h-5 w-5 mr-2" />}
                Pair Your {selectedDeviceType?.label}
              </DialogTitle>
              <DialogDescription>
                Follow these steps to connect your device to the digital signage system
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Pairing Code Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pairing Code</CardTitle>
                  <CardDescription>Enter this code on your device to establish connection</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="text-3xl font-mono font-bold tracking-wider">{pairingCode}</div>
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(pairingCode)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Setup Instructions</CardTitle>
                  <CardDescription>
                    Follow these steps on your {selectedDeviceType?.label.toLowerCase()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2">
                    {getDeviceInstructions(deviceType).map((instruction, index) => (
                      <li key={index} className="flex items-start">
                        <Badge variant="outline" className="mr-3 mt-0.5 min-w-[24px] justify-center">
                          {index + 1}
                        </Badge>
                        <span className="text-sm">{instruction}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              {/* Status */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center text-center">
                    <div className="space-y-2">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
                        <span className="text-sm font-medium">Waiting for device connection...</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        The dialog will close automatically when your device connects
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleScreenAdded}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
