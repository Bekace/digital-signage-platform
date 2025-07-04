"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Copy, RefreshCw, AlertCircle, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AddScreenDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeviceAdded?: () => void
}

export function AddScreenDialog({ open, onOpenChange, onDeviceAdded }: AddScreenDialogProps) {
  const [step, setStep] = useState(1)
  const [deviceType, setDeviceType] = useState("")
  const [screenName, setScreenName] = useState("")
  const [location, setLocation] = useState("")
  const [deviceCode, setDeviceCode] = useState("")
  const [codeExpiry, setCodeExpiry] = useState<Date | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [authChecked, setAuthChecked] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [registrationStatus, setRegistrationStatus] = useState<"waiting" | "success" | "failed">("waiting")
  const { toast } = useToast()

  // Check authentication when dialog opens
  useEffect(() => {
    if (open && !authChecked) {
      checkAuthentication()
    }
  }, [open, authChecked])

  // Generate code when moving to step 2
  useEffect(() => {
    if (open && step === 2 && isAuthenticated && !deviceCode) {
      generateDeviceCode()
    }
  }, [open, step, isAuthenticated, deviceCode])

  // Poll for device registration
  useEffect(() => {
    let pollInterval: NodeJS.Timeout

    if (step === 2 && deviceCode && registrationStatus === "waiting") {
      pollInterval = setInterval(() => {
        checkDeviceRegistration()
      }, 3000) // Check every 3 seconds
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval)
      }
    }
  }, [step, deviceCode, registrationStatus])

  const checkAuthentication = async () => {
    try {
      console.log("[ADD SCREEN] Checking authentication...")
      const response = await fetch("/api/auth/check", {
        method: "GET",
        credentials: "include",
      })

      const data = await response.json()
      console.log("[ADD SCREEN] Auth check response:", data)

      if (data.authenticated) {
        setIsAuthenticated(true)
        setAuthChecked(true)
        console.log("[ADD SCREEN] User authenticated:", data.user.email)
      } else {
        setError("Please log in to add a screen")
        setIsAuthenticated(false)
        toast({
          title: "Authentication Required",
          description: "Please log in to add a screen",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[ADD SCREEN] Auth check failed:", error)
      setError("Authentication check failed")
      setIsAuthenticated(false)
      toast({
        title: "Error",
        description: "Failed to verify authentication",
        variant: "destructive",
      })
    }
  }

  const generateDeviceCode = async () => {
    setLoading(true)
    setError("")

    try {
      console.log("[ADD SCREEN] Generating pairing code for:", { screenName, deviceType })

      const response = await fetch("/api/devices/generate-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      const data = await response.json()
      console.log("[ADD SCREEN] Generate code response:", data)

      if (data.success) {
        setDeviceCode(data.code)
        setCodeExpiry(new Date(data.expiresAt))
        setRegistrationStatus("waiting")
        toast({
          title: "Device code generated",
          description: `Code ${data.code} is ready for pairing`,
        })
      } else {
        setError(data.message || data.error || "Failed to generate device code")
        toast({
          title: "Error",
          description: data.message || data.error || "Failed to generate device code",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[ADD SCREEN] Failed to generate device code:", error)
      const errorMessage = "Network error - please check your connection"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const checkDeviceRegistration = async () => {
    try {
      const response = await fetch("/api/devices", {
        method: "GET",
        credentials: "include",
      })

      const data = await response.json()

      if (data.success && data.devices) {
        // Check if a new device was added recently (within last 30 seconds)
        const recentDevices = data.devices.filter((device: any) => {
          const deviceTime = new Date(device.lastSeen || device.created_at)
          const now = new Date()
          return now.getTime() - deviceTime.getTime() < 30000 // 30 seconds
        })

        if (recentDevices.length > 0) {
          setRegistrationStatus("success")
          toast({
            title: "Device Connected!",
            description: `${screenName} has been successfully connected`,
          })

          // Call the callback to refresh the devices list
          if (onDeviceAdded) {
            onDeviceAdded()
          }
        }
      }
    } catch (error) {
      console.error("[ADD SCREEN] Failed to check device registration:", error)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(deviceCode)
      toast({
        title: "Copied!",
        description: "Device code copied to clipboard",
      })
    } catch (error) {
      console.error("Failed to copy to clipboard:", error)
      toast({
        title: "Copy failed",
        description: "Please copy the code manually",
        variant: "destructive",
      })
    }
  }

  const handleNext = () => {
    if (step === 1 && deviceType && screenName.trim() && isAuthenticated) {
      setStep(2)
    }
  }

  const handleClose = () => {
    setStep(1)
    setDeviceType("")
    setScreenName("")
    setLocation("")
    setDeviceCode("")
    setCodeExpiry(null)
    setError("")
    setAuthChecked(false)
    setIsAuthenticated(false)
    setRegistrationStatus("waiting")
    onOpenChange(false)
  }

  const getDeviceInstructions = () => {
    switch (deviceType) {
      case "fire_tv":
        return [
          "Install the SignageCloud app on your Fire TV Stick",
          "Launch the app and you'll see a setup screen",
          "Enter the 6-digit code shown below",
          "The device will automatically connect and start displaying content",
        ]
      case "android_tv":
        return [
          "Install the SignageCloud app on your Android TV",
          "Open the app and navigate to the setup screen",
          "Enter the 6-digit code shown below",
          "Your Android TV will connect and begin showing your content",
        ]
      case "web_browser":
        return [
          "Open a web browser on your display device",
          "Navigate to: https://player.signagecloud.com",
          "Enter the 6-digit code shown below",
          "The browser will enter fullscreen mode and display your content",
        ]
      case "raspberry_pi":
        return [
          "Install the SignageCloud player on your Raspberry Pi",
          "Run the setup command and enter the 6-digit code below",
          "The Pi will connect and start displaying your content",
        ]
      case "windows":
        return [
          "Download and install the SignageCloud Windows app",
          "Launch the app and enter the 6-digit code below",
          "The app will connect and display your content in fullscreen",
        ]
      case "mac":
        return [
          "Download and install the SignageCloud Mac app",
          "Launch the app and enter the 6-digit code below",
          "The app will connect and display your content in fullscreen",
        ]
      default:
        return []
    }
  }

  const getDeviceDisplayName = (type: string) => {
    switch (type) {
      case "fire_tv":
        return "Amazon Fire TV Stick"
      case "android_tv":
        return "Android TV"
      case "web_browser":
        return "Web Browser"
      case "raspberry_pi":
        return "Raspberry Pi"
      case "windows":
        return "Windows PC"
      case "mac":
        return "Mac"
      default:
        return type
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
            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="screenName">Screen Name *</Label>
              <Input
                id="screenName"
                placeholder="e.g., Lobby Display, Reception TV"
                value={screenName}
                onChange={(e) => setScreenName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deviceType">Device Type *</Label>
              <Select value={deviceType} onValueChange={setDeviceType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your device type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fire_tv">Amazon Fire TV Stick</SelectItem>
                  <SelectItem value="android_tv">Android TV</SelectItem>
                  <SelectItem value="web_browser">Web Browser</SelectItem>
                  <SelectItem value="raspberry_pi">Raspberry Pi</SelectItem>
                  <SelectItem value="windows">Windows PC</SelectItem>
                  <SelectItem value="mac">Mac</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location (Optional)</Label>
              <Input
                id="location"
                placeholder="e.g., Main Lobby, Conference Room A"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleNext} disabled={!deviceType || !screenName.trim() || !isAuthenticated}>
                Next
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {registrationStatus === "success" && (
              <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="text-sm text-green-700">Device successfully connected!</p>
              </div>
            )}

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Setup Details</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <strong>Screen Name:</strong> {screenName}
                </p>
                <p>
                  <strong>Device Type:</strong> {getDeviceDisplayName(deviceType)}
                </p>
                {location && (
                  <p>
                    <strong>Location:</strong> {location}
                  </p>
                )}
              </div>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <h3 className="text-lg font-semibold">Device Pairing Code</h3>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="text-4xl font-mono font-bold tracking-wider bg-gray-100 px-4 py-2 rounded-lg">
                      {loading ? "------" : deviceCode || "------"}
                    </div>
                    <Button variant="outline" size="sm" onClick={copyToClipboard} disabled={loading || !deviceCode}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  {codeExpiry && (
                    <p className="text-sm text-gray-600">Code expires at {codeExpiry.toLocaleTimeString()}</p>
                  )}
                  {registrationStatus === "waiting" && (
                    <p className="text-sm text-blue-600">Waiting for device to connect...</p>
                  )}
                  <Button variant="outline" size="sm" onClick={generateDeviceCode} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                    {loading ? "Generating..." : "Generate New Code"}
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
              <Button onClick={handleClose}>{registrationStatus === "success" ? "Complete" : "Done"}</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
