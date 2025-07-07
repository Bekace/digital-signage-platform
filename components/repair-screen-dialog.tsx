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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Copy, Check, Monitor, Smartphone, Tv, Globe, Wifi, WifiOff, Loader2, Link } from "lucide-react"

interface Device {
  id: string
  name: string
  device_type: string
  status: string
  platform?: string
}

interface RepairScreenDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  device: Device
  onRepairCompleted: () => void
}

export function RepairScreenDialog({ open, onOpenChange, device, onRepairCompleted }: RepairScreenDialogProps) {
  const [step, setStep] = useState<"confirm" | "pairing">("confirm")
  const [pairingCode, setPairingCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean
    device?: any
    checking: boolean
  }>({
    connected: false,
    checking: false,
  })

  const deviceTypes = [
    { value: "fire_tv", label: "Fire TV Stick", icon: Tv },
    { value: "android_tv", label: "Android TV", icon: Tv },
    { value: "android", label: "Android Device", icon: Smartphone },
    { value: "ios", label: "iOS Device", icon: Smartphone },
    { value: "web_browser", label: "Web Browser", icon: Globe },
    { value: "other", label: "Other Device", icon: Monitor },
  ]

  // Check connection status periodically
  useEffect(() => {
    if (step === "pairing" && pairingCode && !connectionStatus.connected) {
      const checkConnection = async () => {
        try {
          setConnectionStatus((prev) => ({ ...prev, checking: true }))

          const response = await fetch("/api/devices/check-connection", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ pairingCode }),
          })

          const data = await response.json()
          console.log("🔍 [RE-PAIR] Connection check:", data)

          if (data.success) {
            setConnectionStatus({
              connected: data.connected,
              device: data.device,
              checking: false,
            })

            if (data.connected && !connectionStatus.connected) {
              toast.success("Device reconnected successfully!")
            }
          }
        } catch (error) {
          console.error("❌ [RE-PAIR] Connection check error:", error)
          setConnectionStatus((prev) => ({ ...prev, checking: false }))
        }
      }

      // Check immediately
      checkConnection()

      // Then check every 3 seconds
      const interval = setInterval(checkConnection, 3000)
      return () => clearInterval(interval)
    }
  }, [step, pairingCode, connectionStatus.connected])

  const generatePairingCode = async () => {
    try {
      setLoading(true)
      console.log("🔗 [RE-PAIR] Generating pairing code for existing device:", device.id)

      const response = await fetch(`/api/devices/${device.id}/repair`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      const data = await response.json()
      console.log("🔗 [RE-PAIR] Generate code response:", data)

      if (data.success) {
        setPairingCode(data.pairingCode || data.code)
        setStep("pairing")
        setConnectionStatus({ connected: false, checking: false })
        toast.success("Re-pairing code generated successfully")
      } else {
        toast.error(data.error || "Failed to generate re-pairing code")
      }
    } catch (error) {
      console.error("❌ [RE-PAIR] Error generating code:", error)
      toast.error("Failed to generate re-pairing code")
    } finally {
      setLoading(false)
    }
  }

  const completeRepair = async () => {
    try {
      setLoading(true)
      console.log("📺 [RE-PAIR] Completing re-pair with code:", pairingCode)

      const response = await fetch(`/api/devices/${device.id}/complete-repair`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ pairingCode }),
      })

      const data = await response.json()
      console.log("📺 [RE-PAIR] Complete repair response:", data)

      if (data.success) {
        toast.success("Device re-paired successfully!")
        handleClose()
        onRepairCompleted()
      } else {
        toast.error(data.error || "Failed to complete re-pairing")
      }
    } catch (error) {
      console.error("❌ [RE-PAIR] Error completing repair:", error)
      toast.error("Failed to complete re-pairing")
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
    setStep("confirm")
    setPairingCode("")
    setCopied(false)
    setConnectionStatus({ connected: false, checking: false })
    onOpenChange(false)
  }

  const getDeviceInstructions = (type: string) => {
    switch (type) {
      case "fire_tv":
        return [
          "Open the SignageCloud app on your Fire TV",
          "Select 'Connect to Dashboard' or 'Re-pair Device'",
          "Enter the pairing code when prompted",
          "Wait for connection confirmation",
        ]
      case "android_tv":
        return [
          "Open the SignageCloud app on your Android TV",
          "Select 'Connect to Dashboard' or 'Re-pair Device'",
          "Enter the pairing code when prompted",
          "Wait for connection confirmation",
        ]
      case "android":
        return [
          "Open the SignageCloud app on your Android device",
          "Tap 'Connect to Dashboard' or 'Re-pair Device'",
          "Enter the pairing code when prompted",
          "Wait for connection confirmation",
        ]
      case "ios":
        return [
          "Open the SignageCloud app on your iOS device",
          "Tap 'Connect to Dashboard' or 'Re-pair Device'",
          "Enter the pairing code when prompted",
          "Wait for connection confirmation",
        ]
      case "web_browser":
        return [
          "Open the device player page in your web browser",
          "Click 'Connect' or enter the pairing code",
          "Wait for connection confirmation",
        ]
      default:
        return [
          "Open your SignageCloud compatible app",
          "Look for 'Connect to Dashboard' or 'Re-pair Device' option",
          "Enter the pairing code when prompted",
          "Wait for connection confirmation",
        ]
    }
  }

  const selectedDeviceType = deviceTypes.find((dt) => dt.value === device.device_type)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        {step === "confirm" ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                Re-pair Device
              </DialogTitle>
              <DialogDescription>
                Generate a new pairing code to reconnect "{device.name}" to a device player. This is useful if the
                device lost connection or you want to connect it to a different player.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {selectedDeviceType && <selectedDeviceType.icon className="h-5 w-5" />}
                    {device.name}
                  </CardTitle>
                  <CardDescription className="capitalize">
                    {device.device_type?.replace("_", " ") || "Unknown Device"} •{" "}
                    {device.platform || "Unknown Platform"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {device.status === "online" ? (
                      <Wifi className="h-4 w-4 text-green-500" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-red-500" />
                    )}
                    <Badge variant={device.status === "online" ? "default" : "destructive"} className="capitalize">
                      {device.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">What happens when you re-pair?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• A new pairing code will be generated</li>
                  <li>• The device will be updated with new connection info</li>
                  <li>• Any assigned playlists will remain unchanged</li>
                  <li>• The device player will need to reconnect using the new code</li>
                </ul>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={generatePairingCode} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Re-pairing Code"
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedDeviceType && <selectedDeviceType.icon className="h-5 w-5" />}
                Re-connect {device.name}
              </DialogTitle>
              <DialogDescription>Use this pairing code to reconnect your device player</DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Connection Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {connectionStatus.connected ? (
                      <>
                        <Wifi className="h-5 w-5 text-green-500" />
                        Device Reconnected
                      </>
                    ) : connectionStatus.checking ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Checking Connection...
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-5 w-5 text-orange-500" />
                        Waiting for Connection
                      </>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {connectionStatus.connected
                      ? "Your device has been successfully reconnected"
                      : "Enter the pairing code in your device player to reconnect"}
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Pairing Code */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Re-pairing Code</CardTitle>
                  <CardDescription>Enter this code in your device player to reconnect</CardDescription>
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
                  <CardTitle className="text-lg">Reconnection Instructions</CardTitle>
                  <CardDescription>Follow these steps to reconnect your device</CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2">
                    {getDeviceInstructions(device.device_type).map((instruction, index) => (
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
                <p>The re-pairing code will expire in 10 minutes.</p>
                <p>Click "Complete Re-pairing" once your device connects.</p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={completeRepair}
                disabled={!connectionStatus.connected || loading}
                className={connectionStatus.connected ? "bg-green-600 hover:bg-green-700" : ""}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Completing...
                  </>
                ) : connectionStatus.connected ? (
                  "Complete Re-pairing"
                ) : (
                  "Waiting for Connection..."
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
