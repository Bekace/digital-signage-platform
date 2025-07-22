"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { Bug, CheckCircle, XCircle, AlertTriangle, Code, Loader2, Settings } from "lucide-react"

interface DebugResults {
  deviceId: string
  pairingCode: string
  timestamp: string
  checks: {
    [key: string]: {
      passed: boolean
      data?: any
      error?: string
      message: string
      isExpired?: boolean
      isUsed?: boolean
    }
  }
  recommendations: string[]
  summary: {
    status: "healthy" | "warning" | "error" | "unknown"
    issues: string[]
    working: string[]
  }
}

export default function DebugDevicePlayerPage() {
  const [deviceId, setDeviceId] = useState("")
  const [pairingCode, setPairingCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<DebugResults | null>(null)

  const runDebugAnalysis = async () => {
    if (!deviceId && !pairingCode) {
      toast.error("Please enter either a Device ID or Pairing Code")
      return
    }

    setLoading(true)
    console.log("🔍 [DEBUG] Starting analysis for:", { deviceId, pairingCode })

    try {
      const response = await fetch("/api/debug-device-player", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceId: deviceId || undefined,
          pairingCode: pairingCode || undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setResults(data.debug)
        toast.success("Debug analysis completed")
      } else {
        toast.error(data.error || "Debug analysis failed")
      }
    } catch (error) {
      console.error("🔍 [DEBUG] Error:", error)
      toast.error("Failed to run debug analysis")
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Bug className="h-5 w-5 text-gray-500" />
    }
  }

  const getCheckIcon = (passed: boolean) => {
    return passed ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Bug className="h-8 w-8" />
            Device Player Debug
          </h1>
          <p className="text-gray-600 mt-2">Analyze and troubleshoot device player connection issues</p>
        </div>

        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Analysis</CardTitle>
            <CardDescription>Enter device information to analyze connection and registration issues</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deviceId">Device ID (Optional)</Label>
                <Input
                  id="deviceId"
                  placeholder="e.g., 38"
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pairingCode">Pairing Code (Optional)</Label>
                <Input
                  id="pairingCode"
                  placeholder="e.g., FQET5L"
                  value={pairingCode}
                  onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="font-mono"
                />
              </div>
            </div>

            <Button onClick={runDebugAnalysis} disabled={loading || (!deviceId && !pairingCode)} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running Analysis...
                </>
              ) : (
                <>
                  <Bug className="h-4 w-4 mr-2" />
                  Run Debug Analysis
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {results && (
          <div className="space-y-6">
            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(results.summary.status)}
                  Analysis Summary
                </CardTitle>
                <CardDescription>Overall system health and status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{results.summary.working.length}</div>
                    <div className="text-sm text-gray-600">Working</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{results.summary.issues.length}</div>
                    <div className="text-sm text-gray-600">Issues</div>
                  </div>
                  <div className="text-center">
                    <Badge
                      variant={
                        results.summary.status === "healthy"
                          ? "default"
                          : results.summary.status === "warning"
                            ? "secondary"
                            : "destructive"
                      }
                      className="text-lg px-4 py-2"
                    >
                      {results.summary.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                {results.summary.issues.length > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Issues Found:</strong>
                      <ul className="list-disc list-inside mt-2">
                        {results.summary.issues.map((issue, index) => (
                          <li key={index}>{issue}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {results.summary.working.length > 0 && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Working Components:</strong>
                      <ul className="list-disc list-inside mt-2">
                        {results.summary.working.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Detailed Checks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.entries(results.checks).map(([checkName, check]) => (
                <Card key={checkName}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      {getCheckIcon(check.passed)}
                      {checkName
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (str) => str.toUpperCase())
                        .trim()}
                    </CardTitle>
                    <CardDescription>{check.message}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {check.error && (
                      <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>{check.error}</AlertDescription>
                      </Alert>
                    )}

                    {check.data && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Data:</h4>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <pre className="text-xs overflow-x-auto">{JSON.stringify(check.data, null, 2)}</pre>
                        </div>
                      </div>
                    )}

                    {checkName === "pairingCode" && check.data && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Expired:</span>
                          <Badge variant={check.isExpired ? "destructive" : "default"}>
                            {check.isExpired ? "Yes" : "No"}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Used:</span>
                          <Badge variant={check.isUsed ? "destructive" : "default"}>
                            {check.isUsed ? "Yes" : "No"}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recommendations */}
            {results.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Recommendations
                  </CardTitle>
                  <CardDescription>Steps to fix identified issues</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {results.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5 text-xs">
                          {index + 1}
                        </Badge>
                        <p className="text-sm">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Raw Debug Data */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Raw Debug Data
                </CardTitle>
                <CardDescription>Complete analysis results for technical review</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-xs overflow-x-auto">{JSON.stringify(results, null, 2)}</pre>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
