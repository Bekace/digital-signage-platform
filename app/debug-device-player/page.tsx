"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Loader2, Bug, CheckCircle, XCircle, AlertTriangle, Info, Database, Settings } from "lucide-react"

interface DebugTest {
  status: "PASS" | "FAIL" | "ERROR" | "INFO"
  data?: any
  error?: string
  message: string
}

interface DebugResults {
  timestamp: string
  deviceId?: string
  pairingCode?: string
  tests: Record<string, DebugTest>
  summary: {
    status: string
    totalTests: number
    failedTests: number
    errorTests: number
    issues: string[]
    recommendations: string[]
  }
}

export default function DebugDevicePlayerPage() {
  const [deviceId, setDeviceId] = useState("")
  const [pairingCode, setPairingCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<DebugResults | null>(null)
  const [error, setError] = useState("")

  const runDebug = async (includeRegistrationTest = false) => {
    if (!deviceId && !pairingCode) {
      setError("Please enter either a Device ID or Pairing Code")
      return
    }

    setIsLoading(true)
    setError("")
    setResults(null)

    try {
      const response = await fetch("/api/debug-device-player", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceId: deviceId || undefined,
          pairingCode: pairingCode || undefined,
          action: includeRegistrationTest ? "test_registration" : "debug",
        }),
      })

      const data = await response.json()

      if (data.success) {
        setResults(data.debug)
      } else {
        setError(data.error || "Debug failed")
      }
    } catch (err) {
      console.error("Debug error:", err)
      setError("Failed to run debug analysis")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PASS":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "FAIL":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "ERROR":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case "INFO":
        return <Info className="h-4 w-4 text-blue-500" />
      default:
        return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PASS":
        return <Badge className="bg-green-500">PASS</Badge>
      case "FAIL":
        return <Badge variant="destructive">FAIL</Badge>
      case "ERROR":
        return <Badge className="bg-orange-500">ERROR</Badge>
      case "INFO":
        return <Badge variant="outline">INFO</Badge>
      default:
        return <Badge variant="secondary">UNKNOWN</Badge>
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 flex items-center">
          <Bug className="mr-2 h-8 w-8" />
          Device Player Debug
        </h1>

        {/* Input Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Debug Parameters</CardTitle>
            <CardDescription>
              Enter the Device ID and/or Pairing Code from the Device Player to analyze issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <label htmlFor="deviceId" className="text-sm font-medium">
                  Device ID (from Device Player)
                </label>
                <Input
                  id="deviceId"
                  placeholder="e.g., 38"
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="pairingCode" className="text-sm font-medium">
                  Pairing Code (from Device Player)
                </label>
                <Input
                  id="pairingCode"
                  placeholder="e.g., FQET5L"
                  value={pairingCode}
                  onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
                  maxLength={6}
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
              <Button
                onClick={() => runDebug(false)}
                disabled={isLoading || (!deviceId && !pairingCode)}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Debug...
                  </>
                ) : (
                  <>
                    <Bug className="mr-2 h-4 w-4" />
                    Run Debug Analysis
                  </>
                )}
              </Button>

              {pairingCode && (
                <Button onClick={() => runDebug(true)} disabled={isLoading} variant="outline">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Settings className="mr-2 h-4 w-4" />
                      Test Registration
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {results && (
          <div className="space-y-6">
            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="mr-2 h-5 w-5" />
                  Debug Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{results.summary.totalTests}</div>
                    <div className="text-sm text-gray-500">Total Tests</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {results.summary.totalTests - results.summary.failedTests - results.summary.errorTests}
                    </div>
                    <div className="text-sm text-gray-500">Passed</div>
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

                <div className="flex items-center justify-center mb-4">
                  <Badge className={results.summary.status === "HEALTHY" ? "bg-green-500" : "bg-red-500"}>
                    {results.summary.status}
                  </Badge>
                </div>

                {results.summary.issues.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2 text-red-600">Issues Found:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {results.summary.issues.map((issue, index) => (
                        <li key={index} className="text-red-700">
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {results.summary.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 text-blue-600">Recommendations:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {results.summary.recommendations.map((rec, index) => (
                        <li key={index} className="text-blue-700">
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
                <CardDescription>
                  Detailed analysis of each component - Generated at {new Date(results.timestamp).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(results.tests).map(([testName, test], index) => (
                    <div key={testName}>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(test.status)}
                          <div>
                            <h4 className="font-medium capitalize">{testName.replace(/([A-Z])/g, " $1").trim()}</h4>
                            <p className="text-sm text-gray-600">{test.message}</p>
                            {test.error && <p className="text-sm text-red-600 mt-1">Error: {test.error}</p>}
                          </div>
                        </div>
                        {getStatusBadge(test.status)}
                      </div>

                      {test.data && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                          <details>
                            <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                              View Data
                            </summary>
                            <pre className="mt-2 text-xs overflow-x-auto">{JSON.stringify(test.data, null, 2)}</pre>
                          </details>
                        </div>
                      )}

                      {index < Object.entries(results.tests).length - 1 && <Separator className="my-4" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
