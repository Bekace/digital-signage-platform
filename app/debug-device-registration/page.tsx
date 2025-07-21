"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Database, Monitor, AlertCircle, CheckCircle, RefreshCw } from "lucide-react"

interface SchemaColumn {
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
  character_maximum_length: number | null
}

interface DebugResult {
  success: boolean
  data?: any
  error?: string
  details?: string
}

export default function DeviceRegistrationDebug() {
  const [loading, setLoading] = useState(false)
  const [schemaResult, setSchemaResult] = useState<DebugResult | null>(null)
  const [devicesResult, setDevicesResult] = useState<DebugResult | null>(null)
  const [pairingResult, setPairingResult] = useState<DebugResult | null>(null)
  const [testInsertResult, setTestInsertResult] = useState<DebugResult | null>(null)

  const checkDatabaseSchema = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/debug-device-schema")
      const result = await response.json()
      setSchemaResult(result)
    } catch (error) {
      setSchemaResult({
        success: false,
        error: "Failed to fetch schema",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    }
    setLoading(false)
  }

  const checkExistingDevices = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/debug-devices")
      const result = await response.json()
      setDevicesResult(result)
    } catch (error) {
      setDevicesResult({
        success: false,
        error: "Failed to fetch devices",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    }
    setLoading(false)
  }

  const checkPairingCodes = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/debug-pairing-codes")
      const result = await response.json()
      setPairingResult(result)
    } catch (error) {
      setPairingResult({
        success: false,
        error: "Failed to fetch pairing codes",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    }
    setLoading(false)
  }

  const testDeviceInsert = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/debug-test-device-insert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          testMode: true,
        }),
      })
      const result = await response.json()
      setTestInsertResult(result)
    } catch (error) {
      setTestInsertResult({
        success: false,
        error: "Failed to test insert",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    }
    setLoading(false)
  }

  const runAllTests = async () => {
    await checkDatabaseSchema()
    await checkExistingDevices()
    await checkPairingCodes()
    await testDeviceInsert()
  }

  const renderResult = (result: DebugResult | null, title: string) => {
    if (!result) return null

    return (
      <Alert className={result.success ? "border-green-200" : "border-red-200"}>
        <div className="flex items-center space-x-2">
          {result.success ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <h4 className="font-medium">{title}</h4>
        </div>
        <AlertDescription className="mt-2">
          {result.success ? (
            <div className="space-y-2">
              <p className="text-green-700">✅ Success</p>
              {result.data && (
                <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-red-700">❌ {result.error}</p>
              {result.details && <p className="text-sm text-red-600">{result.details}</p>}
            </div>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  const renderSchemaTable = (columns: SchemaColumn[]) => {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 px-2 py-1 text-left">Column</th>
              <th className="border border-gray-300 px-2 py-1 text-left">Type</th>
              <th className="border border-gray-300 px-2 py-1 text-left">Nullable</th>
              <th className="border border-gray-300 px-2 py-1 text-left">Default</th>
              <th className="border border-gray-300 px-2 py-1 text-left">Max Length</th>
            </tr>
          </thead>
          <tbody>
            {columns.map((col, index) => (
              <tr key={index} className={col.column_name === "updated_at" ? "bg-yellow-50" : ""}>
                <td className="border border-gray-300 px-2 py-1 font-mono">
                  {col.column_name}
                  {col.column_name === "updated_at" && (
                    <Badge variant="outline" className="ml-1 text-xs">
                      TARGET
                    </Badge>
                  )}
                </td>
                <td className="border border-gray-300 px-2 py-1">{col.data_type}</td>
                <td className="border border-gray-300 px-2 py-1">
                  <Badge variant={col.is_nullable === "YES" ? "secondary" : "destructive"}>{col.is_nullable}</Badge>
                </td>
                <td className="border border-gray-300 px-2 py-1 font-mono text-xs">{col.column_default || "NULL"}</td>
                <td className="border border-gray-300 px-2 py-1">{col.character_maximum_length || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Monitor className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Device Registration Debug</h1>
        </div>

        <div className="text-sm text-muted-foreground">
          Comprehensive debugging for device registration issues, focusing on the "updated_at" column error.
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Quick Actions</span>
            </CardTitle>
            <CardDescription>Run diagnostic tests to identify the device registration issue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <Button
                onClick={checkDatabaseSchema}
                disabled={loading}
                variant="outline"
                className="flex items-center space-x-2 bg-transparent"
              >
                <Database className="h-4 w-4" />
                <span>Check Schema</span>
              </Button>
              <Button
                onClick={checkExistingDevices}
                disabled={loading}
                variant="outline"
                className="flex items-center space-x-2 bg-transparent"
              >
                <Monitor className="h-4 w-4" />
                <span>Check Devices</span>
              </Button>
              <Button
                onClick={checkPairingCodes}
                disabled={loading}
                variant="outline"
                className="flex items-center space-x-2 bg-transparent"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Check Pairing</span>
              </Button>
              <Button
                onClick={testDeviceInsert}
                disabled={loading}
                variant="outline"
                className="flex items-center space-x-2 bg-transparent"
              >
                <AlertCircle className="h-4 w-4" />
                <span>Test Insert</span>
              </Button>
            </div>
            <Separator className="my-4" />
            <Button onClick={runAllTests} disabled={loading} className="w-full">
              {loading ? "Running Tests..." : "Run All Diagnostic Tests"}
            </Button>
          </CardContent>
        </Card>

        {schemaResult && (
          <Card>
            <CardHeader>
              <CardTitle>Database Schema Analysis</CardTitle>
              <CardDescription>Devices table structure and column definitions</CardDescription>
            </CardHeader>
            <CardContent>
              {renderResult(schemaResult, "Schema Check")}
              {schemaResult.success && schemaResult.data?.columns && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Devices Table Columns:</h4>
                  {renderSchemaTable(schemaResult.data.columns)}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {devicesResult && (
          <Card>
            <CardHeader>
              <CardTitle>Existing Devices Analysis</CardTitle>
              <CardDescription>Current devices in the database and their structure</CardDescription>
            </CardHeader>
            <CardContent>{renderResult(devicesResult, "Devices Check")}</CardContent>
          </Card>
        )}

        {pairingResult && (
          <Card>
            <CardHeader>
              <CardTitle>Pairing Codes Analysis</CardTitle>
              <CardDescription>Device pairing codes and their relationships</CardDescription>
            </CardHeader>
            <CardContent>{renderResult(pairingResult, "Pairing Codes Check")}</CardContent>
          </Card>
        )}

        {testInsertResult && (
          <Card>
            <CardHeader>
              <CardTitle>Device Insert Test</CardTitle>
              <CardDescription>Test device insertion to reproduce the error</CardDescription>
            </CardHeader>
            <CardContent>{renderResult(testInsertResult, "Insert Test")}</CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Error Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Current Error</h4>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <code>record "new" has no field "updated_at"</code>
                </AlertDescription>
              </Alert>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">Possible Causes</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Database trigger interfering with INSERT operation</li>
                <li>Column constraint preventing insertion</li>
                <li>Data type mismatch in the updated_at field</li>
                <li>Neon database driver SQL generation issue</li>
                <li>Column permissions or access restrictions</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
