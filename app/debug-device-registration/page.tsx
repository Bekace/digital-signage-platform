"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Database, Monitor, AlertCircle, CheckCircle, RefreshCw, Code, Users, Activity } from "lucide-react"

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
  const [allTablesResult, setAllTablesResult] = useState<DebugResult | null>(null)

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

  const checkAllDeviceTables = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/debug-all-device-tables")
      const result = await response.json()
      setAllTablesResult(result)
    } catch (error) {
      setAllTablesResult({
        success: false,
        error: "Failed to fetch all device tables",
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
    await checkAllDeviceTables()
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

  const renderDataAnalysis = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Data Analysis from Attachments</CardTitle>
          <CardDescription>Analysis of the provided device-related table data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium flex items-center space-x-2">
                <Monitor className="h-4 w-4" />
                <span>Devices Table</span>
              </h4>
              <div className="mt-2 space-y-1 text-sm">
                <p>• 2 existing devices (IDs: 4, 5)</p>
                <p>• Both have updated_at column populated</p>
                <p>• Structure includes all expected columns</p>
                <p>• Both devices are offline status</p>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium flex items-center space-x-2">
                <Code className="h-4 w-4" />
                <span>Pairing Codes</span>
              </h4>
              <div className="mt-2 space-y-1 text-sm">
                <p>• 3 test codes available</p>
                <p>• All codes unused (device_id: null)</p>
                <p>• All codes have user_id: null</p>
                <p>• Codes expire after 1 hour</p>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium flex items-center space-x-2">
                <Activity className="h-4 w-4" />
                <span>Heartbeats</span>
              </h4>
              <div className="mt-2 space-y-1 text-sm">
                <p>• Empty table (no heartbeats)</p>
                <p>• No active device monitoring</p>
                <p>• Table exists but unused</p>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-2">Key Observations</h4>
            <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
              <li>Existing devices have updated_at populated correctly</li>
              <li>Pairing codes exist but none are linked to users</li>
              <li>The error occurs during new device creation, not with existing data</li>
              <li>The issue might be in the INSERT statement or database constraints</li>
              <li>No device heartbeats suggest devices aren't actively connecting</li>
            </ul>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Hypothesis:</strong> The error "record new has no field updated_at" suggests a PostgreSQL trigger
              or constraint issue during INSERT operations, not a missing column issue.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
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
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
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
              <Button
                onClick={checkAllDeviceTables}
                disabled={loading}
                variant="outline"
                className="flex items-center space-x-2 bg-transparent"
              >
                <Users className="h-4 w-4" />
                <span>All Tables</span>
              </Button>
            </div>
            <Separator className="my-4" />
            <Button onClick={runAllTests} disabled={loading} className="w-full">
              {loading ? "Running Tests..." : "Run All Diagnostic Tests"}
            </Button>
          </CardContent>
        </Card>

        {renderDataAnalysis()}

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

                  {schemaResult.data.analysis && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <h5 className="font-medium mb-2">Schema Analysis:</h5>
                      <ul className="text-sm space-y-1">
                        <li>
                          • Has updated_at column: {schemaResult.data.analysis.hasUpdatedAtColumn ? "✅ Yes" : "❌ No"}
                        </li>
                        <li>• Total columns: {schemaResult.data.analysis.totalColumns}</li>
                        <li>• Has constraints: {schemaResult.data.analysis.hasConstraints ? "✅ Yes" : "❌ No"}</li>
                        <li>• Has triggers: {schemaResult.data.analysis.hasTriggers ? "⚠️ Yes" : "✅ No"}</li>
                      </ul>
                      {schemaResult.data.analysis.updatedAtDetails && (
                        <div className="mt-2">
                          <p className="text-sm font-medium">updated_at column details:</p>
                          <pre className="text-xs bg-white p-2 rounded mt-1">
                            {JSON.stringify(schemaResult.data.analysis.updatedAtDetails, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {testInsertResult && (
          <Card>
            <CardHeader>
              <CardTitle>Device Insert Test Results</CardTitle>
              <CardDescription>Multiple INSERT tests to identify the exact issue</CardDescription>
            </CardHeader>
            <CardContent>
              {renderResult(testInsertResult, "Insert Tests")}
              {testInsertResult.success && testInsertResult.data?.tests && (
                <div className="mt-4 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {Object.entries(testInsertResult.data.tests).map(([testName, result]: [string, any]) => (
                      <div
                        key={testName}
                        className={`p-3 border rounded-lg ${result?.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
                      >
                        <h5 className="font-medium flex items-center space-x-2">
                          {result?.success ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span>{testName.toUpperCase()}</span>
                        </h5>
                        <p className="text-sm mt-1">{result?.success ? "✅ Success" : `❌ ${result?.error}`}</p>
                        {result?.data && (
                          <pre className="text-xs bg-white p-2 rounded mt-2 overflow-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>

                  {testInsertResult.data.analysis?.recommendation && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Recommendation:</strong> {testInsertResult.data.analysis.recommendation}
                      </AlertDescription>
                    </Alert>
                  )}
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
            <CardContent>
              {renderResult(pairingResult, "Pairing Codes Check")}
              {pairingResult.success && pairingResult.data?.analysis && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h5 className="font-medium mb-2">Pairing Analysis:</h5>
                  <ul className="text-sm space-y-1">
                    <li>• Total codes: {pairingResult.data.analysis.totalCodes}</li>
                    <li>• Active codes: {pairingResult.data.analysis.activeCodes}</li>
                    <li>• Used codes: {pairingResult.data.analysis.usedCodes}</li>
                    <li>• Expired codes: {pairingResult.data.analysis.expiredCodes}</li>
                    <li>
                      • Has user association: {pairingResult.data.analysis.hasUserAssociation ? "✅ Yes" : "❌ No"}
                    </li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {allTablesResult && (
          <Card>
            <CardHeader>
              <CardTitle>All Device Tables Analysis</CardTitle>
              <CardDescription>Comprehensive analysis of all device-related tables</CardDescription>
            </CardHeader>
            <CardContent>{renderResult(allTablesResult, "All Tables Check")}</CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Error Analysis & Next Steps</CardTitle>
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
              <h4 className="font-medium mb-2">Likely Root Causes</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>
                  <strong>Database Trigger:</strong> A BEFORE INSERT trigger might be interfering with the operation
                </li>
                <li>
                  <strong>Column Constraint:</strong> The updated_at column might have a constraint preventing manual
                  insertion
                </li>
                <li>
                  <strong>Neon Driver Issue:</strong> The Neon serverless driver might be generating unexpected SQL
                </li>
                <li>
                  <strong>Transaction Context:</strong> The error might occur within a transaction that affects column
                  visibility
                </li>
                <li>
                  <strong>User Association Missing:</strong> Pairing codes have no user_id, which might be required for
                  device creation
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Recommended Actions</h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Run the INSERT tests above to identify which approach works</li>
                <li>Check for database triggers on the devices table</li>
                <li>Verify if user_id is required for device creation</li>
                <li>Test with a simpler INSERT statement excluding updated_at</li>
                <li>Check database logs for more detailed error information</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
