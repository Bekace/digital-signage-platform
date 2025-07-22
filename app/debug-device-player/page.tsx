"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, CheckCircle, RefreshCw, Database, Monitor, PlayCircle, Code, Bug, Search } from "lucide-react"

interface DebugResult {
  success: boolean
  data?: any
  error?: string
  timestamp: string
}

interface DeviceDebugInfo {
  deviceExists: boolean
  deviceData?: any
  pairingCodeExists: boolean
  pairingCodeData?: any
  playlistAssigned: boolean
  playlistData?: any
  playlistItems?: any[]
  heartbeatData?: any[]
}

export default function DebugDevicePlayerPage() {
  const [deviceId, setDeviceId] = useState("")
  const [pairingCode, setPairingCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [debugResults, setDebugResults] = useState<Record<string, DebugResult>>({})
  const [deviceDebugInfo, setDeviceDebugInfo] = useState<DeviceDebugInfo | null>(null)

  // Auto-populate from localStorage if available
  useEffect(() => {
    const savedDeviceId = localStorage.getItem("deviceId")
    const savedPairingCode = localStorage.getItem("devicePairingCode")

    if (savedDeviceId) setDeviceId(savedDeviceId)
    if (savedPairingCode) setPairingCode(savedPairingCode)
  }, [])

  const addDebugResult = (key: string, result: DebugResult) => {
    setDebugResults((prev) => ({
      ...prev,
      [key]: {
        ...result,
        timestamp: new Date().toISOString(),
      },
    }))
  }

  const testApiEndpoint = async (endpoint: string, method = "GET", body?: any) => {
    try {
      const options: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }

      if (body && method !== "GET") {
        options.body = JSON.stringify(body)
      }

      const response = await fetch(endpoint, options)
      const data = await response.json()

      return {
        success: response.ok,
        status: response.status,
        data,
        error: response.ok ? undefined : `HTTP ${response.status}: ${data.error || data.message || "Unknown error"}`,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      }
    }
  }

  const debugDeviceRegistration = async () => {
    if (!pairingCode.trim()) {
      addDebugResult("registration", {
        success: false,
        error: "Pairing code is required",
        timestamp: "",
      })
      return
    }

    setLoading(true)

    try {
      // Test device registration
      const registrationResult = await testApiEndpoint("/api/devices/register", "POST", {
        deviceCode: pairingCode.toUpperCase(),
        name: "Debug Device Player",
        deviceType: "web_browser",
        platform: "Web",
        userAgent: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        capabilities: ["video", "image", "audio", "web", "slides", "pdf"],
      })

      addDebugResult("registration", registrationResult)

      if (registrationResult.success && registrationResult.data?.device?.id) {
        setDeviceId(registrationResult.data.device.id)
      }
    } catch (error) {
      addDebugResult("registration", {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: "",
      })
    } finally {
      setLoading(false)
    }
  }

  const debugDevicePlaylist = async () => {
    if (!deviceId.trim()) {
      addDebugResult("playlist", {
        success: false,
        error: "Device ID is required",
        timestamp: "",
      })
      return
    }

    setLoading(true)

    try {
      const playlistResult = await testApiEndpoint(`/api/devices/${deviceId}/playlist`)
      addDebugResult("playlist", playlistResult)
    } catch (error) {
      addDebugResult("playlist", {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: "",
      })
    } finally {
      setLoading(false)
    }
  }

  const debugDeviceHeartbeat = async () => {
    if (!deviceId.trim()) {
      addDebugResult("heartbeat", {
        success: false,
        error: "Device ID is required",
        timestamp: "",
      })
      return
    }

    setLoading(true)

    try {
      const heartbeatResult = await testApiEndpoint(`/api/devices/${deviceId}/heartbeat`, "POST", {
        status: "debug",
        currentItemId: null,
        performanceMetrics: {
          timestamp: Date.now(),
          playbackStatus: "debug",
          reconnectAttempts: 0,
        },
      })

      addDebugResult("heartbeat", heartbeatResult)
    } catch (error) {
      addDebugResult("heartbeat", {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: "",
      })
    } finally {
      setLoading(false)
    }
  }

  const debugDatabaseTables = async () => {
    setLoading(true)

    try {
      // Check device tables
      const deviceTablesResult = await testApiEndpoint("/api/debug-all-device-tables")
      addDebugResult("deviceTables", deviceTablesResult)

      // Check pairing codes
      const pairingCodesResult = await testApiEndpoint("/api/debug-pairing-codes")
      addDebugResult("pairingCodes", pairingCodesResult)

      // Check device schema
      const deviceSchemaResult = await testApiEndpoint("/api/debug-device-schema")
      addDebugResult("deviceSchema", deviceSchemaResult)
    } catch (error) {
      addDebugResult("databaseTables", {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: "",
      })
    } finally {
      setLoading(false)
    }
  }

  const comprehensiveDeviceDebug = async () => {
    if (!deviceId.trim()) {
      alert("Please provide a Device ID first")
      return
    }

    setLoading(true)
    const debugInfo: DeviceDebugInfo = {
      deviceExists: false,
      pairingCodeExists: false,
      playlistAssigned: false,
    }

    try {
      // 1. Check if device exists in devices table
      const deviceResult = await testApiEndpoint(`/api/devices/${deviceId}`)
      debugInfo.deviceExists = deviceResult.success
      debugInfo.deviceData = deviceResult.data

      // 2. Check pairing code if we have one
      if (pairingCode) {
        const pairingResult = await testApiEndpoint("/api/debug-pairing-codes")
        if (pairingResult.success && pairingResult.data?.codes) {
          const matchingCode = pairingResult.data.codes.find((code: any) => code.code === pairingCode.toUpperCase())
          debugInfo.pairingCodeExists = !!matchingCode
          debugInfo.pairingCodeData = matchingCode
        }
      }

      // 3. Check playlist assignment
      const playlistResult = await testApiEndpoint(`/api/devices/${deviceId}/playlist`)
      debugInfo.playlistAssigned = playlistResult.success && !!playlistResult.data?.playlist
      debugInfo.playlistData = playlistResult.data

      // 4. Get heartbeat data
      const heartbeatResult = await testApiEndpoint("/api/debug-heartbeats")
      if (heartbeatResult.success && heartbeatResult.data?.heartbeats) {
        debugInfo.heartbeatData = heartbeatResult.data.heartbeats.filter((hb: any) => hb.device_id === deviceId)
      }

      setDeviceDebugInfo(debugInfo)
      addDebugResult("comprehensive", {
        success: true,
        data: debugInfo,
        timestamp: "",
      })
    } catch (error) {
      addDebugResult("comprehensive", {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: "",
      })
    } finally {
      setLoading(false)
    }
  }

  const testDeviceInsert = async () => {
    setLoading(true)

    try {
      const insertResult = await testApiEndpoint("/api/debug-test-device-insert", "POST", {
        testData: {
          name: "Debug Test Device",
          device_type: "web_browser",
          platform: "Web Debug",
          user_agent: "Debug Agent",
          screen_resolution: "1920x1080",
          capabilities: ["video", "image"],
        },
      })

      addDebugResult("deviceInsert", insertResult)
    } catch (error) {
      addDebugResult("deviceInsert", {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: "",
      })
    } finally {
      setLoading(false)
    }
  }

  const renderDebugResult = (key: string, title: string) => {
    const result = debugResults[key]
    if (!result) return null

    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-sm">
            {result.success ? (
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
            )}
            {title}
            <Badge variant="outline" className="ml-auto text-xs">
              {new Date(result.timestamp).toLocaleTimeString()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {result.error && (
            <Alert variant="destructive" className="mb-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{result.error}</AlertDescription>
            </Alert>
          )}
          {result.data && (
            <div className="bg-gray-50 p-3 rounded-md">
              <pre className="text-xs overflow-auto max-h-40">{JSON.stringify(result.data, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-8">
        <Bug className="h-8 w-8 mr-3 text-red-500" />
        <h1 className="text-3xl font-bold">Device Player Debug Console</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Input Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Debug Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Device ID</label>
              <Input
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                placeholder="Enter device ID"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Pairing Code</label>
              <Input
                value={pairingCode}
                onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
                placeholder="Enter pairing code"
                maxLength={6}
                className="mt-1"
              />
            </div>
            <Button onClick={comprehensiveDeviceDebug} disabled={loading || !deviceId} className="w-full">
              {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Monitor className="h-4 w-4 mr-2" />}
              Run Full Device Debug
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Code className="h-5 w-5 mr-2" />
              API Tests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              onClick={debugDeviceRegistration}
              disabled={loading || !pairingCode}
              variant="outline"
              size="sm"
              className="w-full bg-transparent"
            >
              Test Registration
            </Button>
            <Button
              onClick={debugDevicePlaylist}
              disabled={loading || !deviceId}
              variant="outline"
              size="sm"
              className="w-full bg-transparent"
            >
              Test Playlist API
            </Button>
            <Button
              onClick={debugDeviceHeartbeat}
              disabled={loading || !deviceId}
              variant="outline"
              size="sm"
              className="w-full bg-transparent"
            >
              Test Heartbeat
            </Button>
            <Button
              onClick={debugDatabaseTables}
              disabled={loading}
              variant="outline"
              size="sm"
              className="w-full bg-transparent"
            >
              Check DB Tables
            </Button>
            <Button
              onClick={testDeviceInsert}
              disabled={loading}
              variant="outline"
              size="sm"
              className="w-full bg-transparent"
            >
              Test Device Insert
            </Button>
          </CardContent>
        </Card>

        {/* Status Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2" />
              Debug Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deviceDebugInfo ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Device Exists:</span>
                  {deviceDebugInfo.deviceExists ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pairing Code Valid:</span>
                  {deviceDebugInfo.pairingCodeExists ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Playlist Assigned:</span>
                  {deviceDebugInfo.playlistAssigned ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Heartbeats:</span>
                  <Badge variant="outline">{deviceDebugInfo.heartbeatData?.length || 0}</Badge>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                <Monitor className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Run debug to see status</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Debug Results */}
      <Tabs defaultValue="results" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="results">Test Results</TabsTrigger>
          <TabsTrigger value="device">Device Info</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="api">API Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="space-y-4">
          <h3 className="text-lg font-semibold mb-4">API Test Results</h3>
          {renderDebugResult("comprehensive", "Comprehensive Device Debug")}
          {renderDebugResult("registration", "Device Registration Test")}
          {renderDebugResult("playlist", "Playlist API Test")}
          {renderDebugResult("heartbeat", "Heartbeat API Test")}
          {renderDebugResult("deviceInsert", "Device Insert Test")}
        </TabsContent>

        <TabsContent value="device" className="space-y-4">
          <h3 className="text-lg font-semibold mb-4">Device Information</h3>
          {deviceDebugInfo ? (
            <div className="space-y-4">
              {deviceDebugInfo.deviceData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Device Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto">
                      {JSON.stringify(deviceDebugInfo.deviceData, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}

              {deviceDebugInfo.pairingCodeData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Pairing Code Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto">
                      {JSON.stringify(deviceDebugInfo.pairingCodeData, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}

              {deviceDebugInfo.playlistData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Playlist Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto">
                      {JSON.stringify(deviceDebugInfo.playlistData, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <PlayCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Run comprehensive debug to see device information</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <h3 className="text-lg font-semibold mb-4">Database Debug Results</h3>
          {renderDebugResult("deviceTables", "Device Tables Check")}
          {renderDebugResult("pairingCodes", "Pairing Codes Check")}
          {renderDebugResult("deviceSchema", "Device Schema Check")}
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <h3 className="text-lg font-semibold mb-4">API Call Logs</h3>
          <div className="space-y-2">
            {Object.entries(debugResults).map(([key, result]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center">
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                  )}
                  <span className="font-mono text-sm">{key}</span>
                </div>
                <div className="text-xs text-gray-500">{new Date(result.timestamp).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
