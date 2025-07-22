"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Loader2, Bug, CheckCircle, XCircle, AlertTriangle, Info, Database, Wifi } from "lucide-react"

interface DebugTest {
  status: "PASS" | "FAIL" | "ERROR" | "INFO"
  message: string
  data?: any
  error?: string
}

interface DebugSummary {
  status: "HEALTHY" | "ISSUES_FOUND"
  totalTests: number
  failedTests: number
  errorTests: number
  issues: string[]
  recommendations: string[]
}

interface DebugResults {
  timestamp: string
  deviceId?: string
  pairingCode?: string
  tests: Record<string, DebugTest>
  summary: DebugSummary
}

export default function DebugDevicePlayerPage() {
  const [deviceId, setDeviceId] = useState("")
  const [pairingCode, setPairingCode] = useState("")
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<DebugResults | null>(null)
  const [error, setError] = useState("")

  const runDebugAnalysis = async (includeRegistrationTest = false) => {
    if (!deviceId && !pairingCode) {
      setError("Please enter either a Device ID or Pairing Code")
      return
    }

    setIsRunning(true)
    setError("")
    setResults(null)

    try {
      const response = await fetch("/api/debug-device-player", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          deviceId: deviceId || undefined,
          pairingCode: pairingCode || undefined,
          action: includeRegistrationTest ? "test_registration" : "analyze",
        }),
      })

      const data = await response.json()

      if (data.success) {
        setResults(data.debug)
      } else {
        setError(data.error || "Debug analysis failed")
      }
    } catch (err) {
      console.error("Debug error:", err)
      setError("Failed to run debug analysis")
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PASS":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "FAIL":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "ERROR":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />
      case "INFO":
        return <Info className="h-4 w-4 text-blue-600" />
      default:
        return <Info className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PASS":
        return <Badge className="bg-green-100 text-green-800 border-green-200">PASS</Badge>
      case "FAIL":
        return <Badge variant="destructive">FAIL</Badge>
      case "ERROR":
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">ERROR</Badge>
      case "INFO":
        return <Badge variant="outline">INFO</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 flex items-center">
        <Bug className="mr-2 h-8 w-8" />
        Device Player Debug
      </h1>

      {/* Input Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Debug Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <label htmlFor="deviceId" className="text-sm font-medium">
                Device ID (Optional)
              </label>
              <Input
                id="deviceId"
                placeholder="Enter device ID (e.g., 38)"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                type="number"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="pairingCode" className="text-sm font-medium">
                Pairing Code (Optional)
              </label>
              <Input
                id="pairingCode"
                placeholder="Enter pairing code (e.g., FQET5L)"
                value={pairingCode}
                onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="font-mono"
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex space-x-2">
            <Button onClick={() => runDebugAnalysis(false)} disabled={isRunning} className="flex-1">
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Analysis...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Run Debug Analysis
                </>
              )}
            </Button>
            {pairingCode && (
              <Button onClick={() => runDebugAnalysis(true)} disabled={isRunning} variant="outline" className="flex-1">
                {isRunning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Wifi className="mr-2 h-4 w-4" />
                    Test Registration
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {results && (
        <div className="space-y-6">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Debug Summary
                <Badge
                  className={
                    results.summary.status === "HEALTHY"
                      ? "bg-green-100 text-green-800 border-green-200"
                      : "bg-red-100 text-red-800 border-red-200"
                  }
                >
                  {results.summary.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{results.summary.totalTests}</div>
                  <div className="text-sm text-gray-500">Total Tests</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{results.summary.failedTests}</div>
                  <div className="text-sm text-gray-500">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{results.summary.errorTests}</div>
                  <div className="text-sm text-gray-500">Errors</div>
                </div>
              </div>

              {results.summary.issues.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-red-800 mb-2">Issues Found:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {results.summary.issues.map((issue, index) => (
                      <li key={index} className="text-sm text-red-700">
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {results.summary.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium text-blue-800 mb-2">Recommendations:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {results.summary.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-blue-700">
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test Results */}
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(results.tests).map(([testName, test], index) => (
                  <div key={testName}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        {getStatusIcon(test.status)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium capitalize">{testName.replace(/([A-Z])/g, " $1").trim()}</h4>
                            {getStatusBadge(test.status)}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{test.message}</p>

                          {test.error && (
                            <Alert variant="destructive" className="mb-2">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription className="text-xs">{test.error}</AlertDescription>
                            </Alert>
                          )}

                          {test.data && (
                            <details className="text-xs">
                              <summary className="cursor-pointer text-blue-600 hover:text-blue-800">View Data</summary>
                              <pre className="mt-2 p-2 bg-gray-50 rounded border overflow-x-auto">
                                {JSON.stringify(test.data, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                    {index < Object.entries(results.tests).length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Debug Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Timestamp:</span>
                  <br />
                  {new Date(results.timestamp).toLocaleString()}
                </div>
                {results.deviceId && (
                  <div>
                    <span className="font-medium">Device ID:</span>
                    <br />
                    {results.deviceId}
                  </div>
                )}
                {results.pairingCode && (
                  <div>
                    <span className="font-medium">Pairing Code:</span>
                    <br />
                    <code className="font-mono">{results.pairingCode}</code>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Instructions */}
      {!results && (
        <Card>
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Debug Analysis:</h4>
                <p>
                  Enter a Device ID or Pairing Code to analyze the device player system. This will check database
                  records, validate connections, and identify issues.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Test Registration:</h4>
                <p>
                  If you have a pairing code, use "Test Registration" to simulate the device registration process and
                  verify it works correctly.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Common Issues:</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Device ID exists in localStorage but not in database (fake connection)</li>
                  <li>Pairing code expired or already used</li>
                  <li>Device registered but no playlist assigned</li>
                  <li>Authentication issues preventing API access</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
