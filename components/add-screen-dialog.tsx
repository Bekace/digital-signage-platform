"use client"

import React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Monitor, Smartphone, Tv, CheckCircle, Copy, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AddScreenDialogProps {
  onDeviceAdded: () => void
}

export function AddScreenDialog({ onDeviceAdded }: AddScreenDialogProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [deviceName, setDeviceName] = useState("")
  const [deviceType, setDeviceType] = useState("")
  const [location, setLocation] = useState("")
  const [generatedCode, setGeneratedCode] = useState("")
  const [deviceId, setDeviceId] = useState("")
  const [isPolling, setIsPolling] = useState(false)
  const [deviceConnected, setDeviceConnected] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()

  const deviceTypes = [
    { value: "web", label: "Web Browser", icon: Monitor },
    { value: "android", label: "Android Device", icon: Smartphone },
    { value: "tv", label: "Smart TV", icon: Tv },
  ]

  const resetDialog = () => {
    setStep(1)
    setDeviceName("")
    setDeviceType("")
    setLocation("")
    setGeneratedCode("")
    setDeviceId("")
    setIsPolling(false)
    setDeviceConnected(false)
    setError("")
    setLoading(false)
  }

  const handleNext = async () => {
    if (!deviceName.trim() || !deviceType) {
      setError("Please fill in all required fields")
      return
    }

    setLoading(true)
    setError("")

    try {
      console.log("Generating code for device:", { deviceName, deviceType, location })

      const response = await fetch("/api/devices/generate-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: deviceName,
          type: deviceType,
          location: location || null,
        }),
      })

      const data = await response.json()
      console.log("Generate code response:", data)

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      if (!data.success) {
        throw new Error(data.error || "Failed to generate code")
      }

      setGeneratedCode(data.code)
      setDeviceId(data.device?.id || "")
      setStep(2)
      startPolling()

      toast({
        title: "Device code generated",
        description: `Code: ${data.code}`,
      })
    } catch (error) {
      console.error("Generate code error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to generate device code"
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

  const startPolling = () => {
    setIsPolling(true)
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch("/api/devices", {
          credentials: "include",
        })
        const data = await response.json()

        if (data.success && data.devices) {
          const connectedDevice = data.devices.find(
            (device: any) => device.name === deviceName && device.status === "online",
          )

          if (connectedDevice) {
            setDeviceConnected(true)
            setIsPolling(false)
            clearInterval(pollInterval)
            toast({
              title: "Device connected!",
              description: `${deviceName} is now online`,
            })
          }
        }
      } catch (error) {
        console.error("Polling error:", error)
      }
    }, 3000)

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval)
      setIsPolling(false)
    }, 300000)
  }

  const copyCode = () => {
    navigator.clipboard.writeText(generatedCode)
    toast({
      title: "Code copied",
      description: "Device code copied to clipboard",
    })
  }

  const handleFinish = () => {
    setOpen(false)
    resetDialog()
    onDeviceAdded()
  }

  useEffect(() => {
    if (!open) {
      resetDialog()
    }
  }, [open])

  const getDeviceIcon = (type: string) => {
    const deviceType = deviceTypes.find((dt) => dt.value === type)
    return deviceType?.icon || Monitor
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Screen</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Screen</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deviceName">Screen Name *</Label>
              <Input
                id="deviceName"
                placeholder="e.g., Lobby Display"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deviceType">Device Type *</Label>
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

            <div className="space-y-2">
              <Label htmlFor="location">Location (Optional)</Label>
              <Input
                id="location"
                placeholder="e.g., Main Lobby, Conference Room A"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleNext} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Next
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {React.createElement(getDeviceIcon(deviceType), { className: "h-5 w-5" })}
                  {deviceName}
                </CardTitle>
                <CardDescription>
                  {deviceType === "web" && "Open a web browser and navigate to your signage URL"}
                  {deviceType === "android" && "Open the SignageCloud app on your Android device"}
                  {deviceType === "tv" && "Open the SignageCloud app on your Smart TV"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Enter this code on your device:</Label>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <div className="text-3xl font-mono font-bold bg-gray-100 px-4 py-2 rounded">{generatedCode}</div>
                      <Button variant="outline" size="sm" onClick={copyCode}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {deviceConnected ? (
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Device Connected!</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {isPolling && (
                        <div className="flex items-center justify-center gap-2 text-blue-600">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Waiting for device to connect...</span>
                        </div>
                      )}
                      <Badge variant="secondary">Status: Waiting for connection</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={handleFinish} disabled={!deviceConnected}>
                {deviceConnected ? "Finish" : "Skip for Now"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
