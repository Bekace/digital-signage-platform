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
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Copy, Check, Monitor, Smartphone, Tv, Globe, Plus } from "lucide-react"

interface AddScreenDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onScreenAdded: () => void
}

export function AddScreenDialog({ open, onOpenChange, onScreenAdded }: AddScreenDialogProps) {
  const [step, setStep] = useState<"form" | "pairing">("form")
  const [screenName, setScreenName] = useState("")
  const [deviceType, setDeviceType] = useState("")
  const [pairingCode, setPairingCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const deviceTypes = [
    { value: "fire_tv", label: "Fire TV Stick", icon: Tv },
    { value: "android_tv", label: "Android TV", icon: Tv },
    { value: "android", label: "Android Device", icon: Smartphone },
    { value: "ios", label: "iOS Device", icon: Smartphone },
    { value: "web", label: "Web Browser", icon: Globe },
    { value: "other", label: "Other Device", icon: Monitor },
  ]

  const generatePairingCode = async () => {
    try {
      setLoading(true)
      console.log("🔗 [ADD SCREEN] Generating pairing code for:", { screenName, deviceType })

      const token = localStorage.getItem("token")
      if (!token) {
        toast.error("Please log in to add screens")
        return
      }

      const response = await fetch("/api/devices/generate-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          screenName,
          deviceType,
        }),
      })

      const data = await response.json()
      console.log("🔗 [ADD SCREEN] Generate code response:", data)

      if (data.success) {
        setPairingCode(data.pairingCode || data.code)
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

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(pairingCode)
      setCopied(true)
      toast.success("Pairing code copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error("Failed to copy pairing code")
    }
  }

  const handleClose = () => {
    setStep("form")
    setScreenName("")
    setDeviceType("")
    setPairingCode("")
    setCopied(false)
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
          "Install the SignageCloud app from the Amazon Appstore",
          "Open the app on your Fire TV",
          "Select 'Connect to Dashboard'",
          "Enter the pairing code when prompted",
          "Your screen will appear in the dashboard once connected",
        ]
      case "android_tv":
        return [
          "Install the SignageCloud app from Google Play Store",
          "Open the app on your Android TV",
          "Select 'Connect to Dashboard'",
          "Enter the pairing code when prompted",
          "Your screen will appear in the dashboard once connected",
        ]
      case "android":
        return [
          "Install the SignageCloud app from Google Play Store",
          "Open the app on your Android device",
          "Tap 'Connect to Dashboard'",
          "Enter the pairing code when prompted",
          "Your device will appear in the dashboard once connected",
        ]
      case "ios":
        return [
          "Install the SignageCloud app from the App Store",
          "Open the app on your iOS device",
          "Tap 'Connect to Dashboard'",
          "Enter the pairing code when prompted",
          "Your device will appear in the dashboard once connected",
        ]
      case "web":
        return [
          "Open a web browser on your device",
          "Navigate to your SignageCloud player URL",
          "Click 'Connect to Dashboard'",
          "Enter the pairing code when prompted",
          "Your browser will appear in the dashboard once connected",
        ]
      default:
        return [
          "Install or open your SignageCloud compatible app",
          "Look for 'Connect to Dashboard' or 'Pair Device' option",
          "Enter the pairing code when prompted",
          "Your device will appear in the dashboard once connected",
        ]
    }
  }

  const selectedDeviceType = deviceTypes.find((dt) => dt.value === deviceType)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        {step === "form" ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Screen
              </DialogTitle>
              <DialogDescription>
                Add a new digital signage display to your account. You'll get a pairing code to connect your device.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="screenName">Screen Name</Label>
                <Input
                  id="screenName"
                  placeholder="e.g., Lobby Display, Conference Room TV"
                  value={screenName}
                  onChange={(e) => setScreenName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deviceType">Device Type</Label>
                <Select value={deviceType} onValueChange={setDeviceType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select device type" />
                  </SelectTrigger>
                  <SelectContent>
                    {deviceTypes.map((type) => {
                      const Icon = type.icon
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
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
              <Button onClick={generatePairingCode} disabled={!screenName || !deviceType || loading}>
                {loading ? "Generating..." : "Generate Pairing Code"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedDeviceType && <selectedDeviceType.icon className="h-5 w-5" />}
                Connect Your {selectedDeviceType?.label}
              </DialogTitle>
              <DialogDescription>Use this pairing code to connect "{screenName}" to your dashboard</DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Pairing Code */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pairing Code</CardTitle>
                  <CardDescription>Enter this code in your SignageCloud app</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="text-3xl font-mono font-bold tracking-wider">{pairingCode}</div>
                    <Button variant="outline" size="sm" onClick={copyToClipboard}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Setup Instructions</CardTitle>
                  <CardDescription>Follow these steps to connect your device</CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2">
                    {getDeviceInstructions(deviceType).map((instruction, index) => (
                      <li key={index} className="flex gap-3">
                        <Badge
                          variant="outline"
                          className="min-w-[24px] h-6 rounded-full p-0 flex items-center justify-center"
                        >
                          {index + 1}
                        </Badge>
                        <span className="text-sm">{instruction}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              <Separator />

              <div className="text-center text-sm text-muted-foreground">
                <p>The pairing code will expire in 10 minutes.</p>
                <p>Your screen will appear in the dashboard once connected.</p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button onClick={handleScreenAdded}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
