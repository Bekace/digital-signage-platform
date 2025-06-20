"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Copy, CheckCircle, Clock, Loader2 } from "lucide-react"

interface AddScreenDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onScreenAdded?: () => void
}

export function AddScreenDialog({ open, onOpenChange, onScreenAdded }: AddScreenDialogProps) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    deviceType: "",
    screenName: "",
    location: "",
  })
  const [deviceCode, setDeviceCode] = useState("")
  const [codeExpiry, setCodeExpiry] = useState<Date | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [registrationStatus, setRegistrationStatus] = useState<"waiting" | "success" | "expired">("waiting")

  // Real-time countdown
  useEffect(() => {
    const interval = setInterval(() => {
      if (codeExpiry) {
        const remaining = Math.max(0, Math.floor((codeExpiry.getTime() - Date.now()) / 1000))
        setTimeRemaining(remaining)

        if (remaining === 0 && registrationStatus === "waiting") {
          setRegistrationStatus("expired")
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [codeExpiry, registrationStatus])

  // Poll for device registration
  useEffect(() => {
    let pollInterval: NodeJS.Timeout

    if (deviceCode && registrationStatus === "waiting") {
      pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/devices/check-registration/${deviceCode}`)
          const data = await response.json()

          if (data.success && data.registered) {
            setRegistrationStatus("success")
            clearInterval(pollInterval)

            // Wait a moment then close dialog
            setTimeout(() => {
              handleClose()
              onScreenAdded?.()
            }, 2000)
          }
        } catch (error) {
          console.error("Registration check failed:", error)
        }
      }, 3000) // Check every 3 seconds
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval)
    }
  }, [deviceCode, registrationStatus, onScreenAdded])

  const generateDeviceCode = async () => {
    setLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/devices/generate-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          screenName: formData.screenName,
          deviceType: formData.deviceType,
          location: formData.location,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setDeviceCode(data.code)
        setCodeExpiry(new Date(data.expiresAt))
        setRegistrationStatus("waiting")
        setStep(2)
      } else {
        setError(data.message || "Failed to generate code")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(deviceCode)
  }

  const handleNext = () => {
    if (step === 1 && formData.deviceType && formData.screenName) {
      generateDeviceCode()
    }
  }

  const handleClose = () => {
    setStep(1)
    setFormData({ deviceType: "", screenName: "", location: "" })
    setDeviceCode("")
    setCodeExpiry(null)
    setTimeRemaining(0)
    setError("")
    setRegistrationStatus("waiting")
    onOpenChange(false)
  }

  const getDeviceInstructions = () => {
    switch (formData.deviceType) {
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

  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60
  const isExpired = registrationStatus === "expired"
  const isSuccess = registrationStatus === "success"

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
              <Label htmlFor="screenName">Screen Name *</Label>
              <Input
                id="screenName"
                value={formData.screenName}
                onChange={(e) => setFormData((prev) => ({ ...prev, screenName: e.target.value }))}
                placeholder="e.g., Lobby Display, Reception TV"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deviceType">Device Type *</Label>
              <Select
                value={formData.deviceType}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, deviceType: value }))}
              >
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
              <Label htmlFor="location">Location (Optional)</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., Main Lobby, Conference Room A"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleNext} disabled={!formData.deviceType || !formData.screenName || loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Code"
                )}
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
                    <div
                      className={`text-4xl font-mono font-bold tracking-wider px-4 py-2 rounded-lg transition-all ${
                        isExpired
                          ? "bg-red-100 text-red-600 line-through"
                          : isSuccess
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      {deviceCode}
                    </div>
                    <Button variant="outline" size="sm" onClick={copyToClipboard} disabled={isExpired}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Status Display */}
                  <div className="space-y-2">
                    {isSuccess && (
                      <Badge className="bg-green-100 text-green-800 text-lg px-4 py-2">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Device Connected!
                      </Badge>
                    )}

                    {isExpired && (
                      <Badge variant="destructive" className="text-lg px-4 py-2">
                        Code Expired
                      </Badge>
                    )}

                    {registrationStatus === "waiting" && !isExpired && (
                      <div className="space-y-2">
                        <Badge className="text-lg px-4 py-2">
                          <Clock className="h-4 w-4 mr-1" />
                          {minutes}:{seconds.toString().padStart(2, "0")}
                        </Badge>
                        <Progress value={(timeRemaining / 600) * 100} className="h-2" />
                        <p className="text-sm text-gray-600">Waiting for device to connect...</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {!isSuccess && !isExpired && (
              <div className="space-y-3">
                <h4 className="font-medium">Setup Instructions:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  {getDeviceInstructions().map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ol>
              </div>
            )}

            {isSuccess && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{formData.screenName}</strong> has been successfully connected! The dialog will close
                  automatically.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end space-x-2">
              {isExpired && <Button onClick={() => setStep(1)}>Generate New Code</Button>}
              {!isSuccess && (
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
              )}
              {isSuccess && <Button onClick={handleClose}>Done</Button>}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
