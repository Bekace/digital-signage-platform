"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy, RefreshCw, Clock, CheckCircle } from "lucide-react"

function GenerateCodeSection() {
  const [code, setCode] = useState("")
  const [expiry, setExpiry] = useState<Date | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    generateCode()
  }, [])

  const generateCode = () => {
    const newCode = Math.random().toString(36).substring(2, 15).toUpperCase()
    setCode(newCode)

    const now = new Date()
    const expiryTime = new Date(now.getTime() + 5 * 60000) // Expires in 5 minutes
    setExpiry(expiryTime)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000) // Hide after 2 seconds
    } catch (err) {
      console.error("Failed to copy code:", err)
    }
  }

  const timeRemaining = expiry ? expiry.getTime() - new Date().getTime() : 0
  const minutes = Math.floor((timeRemaining / (1000 * 60)) % 60)
  const seconds = Math.floor((timeRemaining / 1000) % 60)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Device Pairing Code</CardTitle>
        <CardDescription>Enter this code on your device to pair it with your account.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center space-x-2">
          <Label htmlFor="name">Pairing Code</Label>
          <Input id="code" value={code} readOnly />
          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            className={copied ? "bg-green-100 text-green-700" : ""}
          >
            {copied ? (
              <>
                <CheckCircle className="h-4 w-4 mr-1" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-1" />
                Copy Code
              </>
            )}
          </Button>
        </div>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>
            Expires in {minutes}m {seconds}s
          </span>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={generateCode}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Generate New Code
        </Button>
      </CardFooter>
    </Card>
  )
}

export default function TestDevicePairingPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-semibold mb-6">Test Device Pairing</h1>
      <GenerateCodeSection />
    </div>
  )
}
