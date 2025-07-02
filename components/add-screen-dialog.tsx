"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Copy, RefreshCw } from "lucide-react"

interface AddScreenDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddScreenDialog({ open, onOpenChange }: AddScreenDialogProps) {
  const [step, setStep] = useState(1)
  const [deviceType, setDeviceType] = useState("")
  const [deviceCode, setDeviceCode] = useState("")
  const [codeExpiry, setCodeExpiry] = useState<Date | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && step === 2) {
      generateDeviceCode()
    }
  }, [open, step])

  const generateDeviceCode = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/devices/generate-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer your-user-token`, // In real app, get from auth context
        },
      })

      const data = await response.json()
      if (data.success) {
        setDeviceCode(data.code)
        setCodeExpiry(new Date(data.expiresAt))
      }
    } catch (error) {
      console.error("Failed to generate device code:", error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(deviceCode)
  }

  const handleNext = () => {
    if (step === 1 && deviceType) {
      setStep(2)
    }
  }

  const handleClose = () => {
    setStep(1)
    setDeviceType("")
    setDeviceCode("")
    setCodeExpiry(null)
    onOpenChange(false)
  }

  const getDeviceInstructions = () => {
    switch (deviceType) {
      case "firestick":
        return [
          "Install the SignageCloud app on your Fire TV Stick",
          "Launch the app and you'll see a setup screen",
          "Enter the 6-digit code shown below",
          "The device will automatically connect and start displaying content",
        ]
      case "android-tv":
        return [
          "Install the SignageCloud app on your Android TV",
          "Open the app and navigate to the setup screen",
          "Enter the 6-digit code shown below",
          "Your Android TV will connect and begin showing your content",
        ]
      case "web-browser":
        return [
          "Open a web browser on your display device",
          "Navigate to: https://player.signagecloud.com",
          "Enter the 6-digit code shown below",
          "The browser will enter fullscreen mode and display your content",
        ]
      default:
        return []
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Screen</DialogTitle>
          <DialogDescription>Connect a new display device to your SignageCloud account</DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deviceType">Device Type</Label>
              <Select value={deviceType} onValueChange={setDeviceType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your device type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="firestick">Amazon Fire TV Stick</SelectItem>
                  <SelectItem value="android-tv">Android TV</SelectItem>
                  <SelectItem value="web-browser">Web Browser</SelectItem>
                  <SelectItem value="raspberry-pi">Raspberry Pi</SelectItem>
                  <SelectItem value="windows">Windows PC</SelectItem>
                  <SelectItem value="mac">Mac</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="screenName">Screen Name</Label>
              <Input id="screenName" placeholder="e.g., Lobby Display, Reception TV" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location (Optional)</Label>
              <Input id="location" placeholder="e.g., Main Lobby, Conference Room A" />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleNext} disabled={!deviceType}>
                Next
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <h3 className="text-lg font-semibold">Device Code</h3>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="text-4xl font-mono font-bold tracking-wider bg-gray-100 px-4 py-2 rounded-lg">
                      {loading ? "------" : deviceCode}
                    </div>
                    <Button variant="outline" size="sm" onClick={copyToClipboard} disabled={loading}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  {codeExpiry && (
                    <p className="text-sm text-gray-600">Code expires at {codeExpiry.toLocaleTimeString()}</p>
                  )}
                  <Button variant="outline" size="sm" onClick={generateDeviceCode} disabled={loading}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generate New Code
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <h4 className="font-medium">Setup Instructions:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                {getDeviceInstructions().map((instruction, index) => (
                  <li key={index}>{instruction}</li>
                ))}
              </ol>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={handleClose}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
