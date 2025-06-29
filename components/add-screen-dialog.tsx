"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Copy, RefreshCw, Monitor, Clock, Plus } from "lucide-react"
import { toast } from "sonner"

interface PairingCode {
  code: string
  expiresAt: string
}

export function AddScreenDialog() {
  const [open, setOpen] = useState(false)
  const [pairingCode, setPairingCode] = useState<PairingCode | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [timeLeft, setTimeLeft] = useState<string>("")

  const generatePairingCode = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch("/api/devices/generate-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (data.success) {
        setPairingCode({
          code: data.code,
          expiresAt: data.expiresAt,
        })

        // Start countdown timer
        updateTimeLeft(data.expiresAt)
        const interval = setInterval(() => {
          updateTimeLeft(data.expiresAt)
        }, 1000)

        // Clear interval when dialog closes
        setTimeout(() => clearInterval(interval), 30 * 60 * 1000)

        toast.success(`Pairing code generated: ${data.code}`)
      } else {
        throw new Error(data.error || "Failed to generate code")
      }
    } catch (error) {
      console.error("Error generating pairing code:", error)
      toast.error(error instanceof Error ? error.message : "Failed to generate pairing code")
    } finally {
      setIsGenerating(false)
    }
  }

  const updateTimeLeft = (expiresAt: string) => {
    const now = new Date().getTime()
    const expiry = new Date(expiresAt).getTime()
    const diff = expiry - now

    if (diff <= 0) {
      setTimeLeft("Expired")
      return
    }

    const minutes = Math.floor(diff / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    setTimeLeft(`${minutes}:${seconds.toString().padStart(2, "0")}`)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success("Copied to clipboard!")
    } catch (error) {
      toast.error("Failed to copy to clipboard")
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      // Reset state when dialog closes
      setPairingCode(null)
      setTimeLeft("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Screen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Add New Screen
          </DialogTitle>
          <DialogDescription>
            Generate a pairing code to connect a new display device to your account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!pairingCode ? (
            <div className="text-center py-6">
              <Monitor className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Click the button below to generate a pairing code for your new screen.
              </p>
              <Button onClick={generatePairingCode} disabled={isGenerating} className="w-full">
                {isGenerating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Pairing Code"
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <div className="bg-muted p-6 rounded-lg">
                  <Label className="text-sm font-medium text-muted-foreground">Pairing Code</Label>
                  <div className="text-3xl font-mono font-bold tracking-wider mt-2 mb-2">{pairingCode.code}</div>
                  <div className="flex items-center justify-center text-sm text-muted-foreground">
                    <Clock className="mr-1 h-3 w-3" />
                    Expires in: {timeLeft}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => copyToClipboard(pairingCode.code)}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Code
                </Button>
                <Button variant="outline" onClick={generatePairingCode} disabled={isGenerating}>
                  <RefreshCw className={`h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />
                </Button>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-sm mb-2 text-blue-900">Next Steps:</h4>
                <ol className="text-sm text-blue-800 space-y-1">
                  <li>1. Open your device browser</li>
                  <li>
                    2. Go to: <code className="bg-blue-100 px-1 rounded">/device-player</code>
                  </li>
                  <li>3. Enter the pairing code above</li>
                  <li>4. Click "Connect Device"</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
