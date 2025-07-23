"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Database, CheckCircle, XCircle } from "lucide-react"

export default function DatabaseSetupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [setupResult, setSetupResult] = useState(null)
  const [verificationResult, setVerificationResult] = useState(null)

  const runDatabaseSetup = async () => {
    setIsLoading(true)
    setSetupResult(null)
    setVerificationResult(null)

    try {
      const response = await fetch("/api/setup-database", {
        method: "POST",
      })
      const result = await response.json()
      setSetupResult(result)

      if (result.success) {
        // Run verification after setup
        await verifyDatabase()
      }
    } catch (error) {
      setSetupResult({
        success: false,
        message: "Setup request failed",
        error: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const verifyDatabase = async () => {
    try {
      const response = await fetch("/api/verify-database")
      const result = await response.json()
      setVerificationResult(result)
    } catch (error) {
      setVerificationResult({
        success: false,
        message: "Verification request failed",
        error: error.message,
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Comprehensive Database Setup</h1>
          <p className="text-gray-600">Set up all required database tables and clean up demo data</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Setup
              </CardTitle>
              <CardDescription>Create all required tables and remove demo/sample data</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={runDatabaseSetup} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up database...
                  </>
                ) : (
                  "Run Comprehensive Database Setup"
                )}
              </Button>
            </CardContent>
          </Card>

          {setupResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {setupResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  Setup Result
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert className={setupResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  <AlertDescription>
                    <strong>Status:</strong> {setupResult.success ? "Success" : "Failed"}
                    <br />
                    <strong>Message:</strong> {setupResult.message}
                    {setupResult.error && (
                      <>
                        <br />
                        <strong>Error:</strong> {setupResult.error}
                      </>
                    )}
                  </AlertDescription>
                </Alert>

                {setupResult.tables_created && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Tables Created:</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {setupResult.tables_created.map((table) => (
                        <div key={table} className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {table}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {verificationResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {verificationResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  Database Verification
                </CardTitle>
              </CardHeader>
              <CardContent>
                {verificationResult.success ? (
                  <div className="space-y-4">
                    <Alert className="border-green-200 bg-green-50">
                      <AlertDescription>Database verification successful!</AlertDescription>
                    </Alert>

                    <div>
                      <h4 className="font-semibold mb-2">Table Status:</h4>
                      <div className="grid grid-cols-1 gap-2">
                        {Object.entries(verificationResult.tables.counts).map(([table, count]) => (
                          <div
                            key={table}
                            className="flex justify-between items-center text-sm bg-gray-100 px-3 py-2 rounded"
                          >
                            <span className="font-medium">{table}</span>
                            <span className="text-gray-600">{count} records</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {verificationResult.tables.missing.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 text-red-600">Missing Tables:</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {verificationResult.tables.missing.map((table) => (
                            <div key={table} className="text-sm bg-red-100 px-2 py-1 rounded text-red-700">
                              {table}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="font-semibold mb-2">Demo Data Check:</h4>
                      <div className="text-sm space-y-1">
                        <div>Demo Users: {verificationResult.demo_data.demo_users}</div>
                        <div>Demo Devices: {verificationResult.demo_data.demo_devices}</div>
                        <div>Test Pairing Codes: {verificationResult.demo_data.test_pairing_codes}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription>
                      <strong>Verification Failed:</strong> {verificationResult.message}
                      {verificationResult.error && (
                        <>
                          <br />
                          <strong>Error:</strong> {verificationResult.error}
                        </>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Manual Verification</CardTitle>
              <CardDescription>You can also verify the database setup manually</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={verifyDatabase} variant="outline" className="w-full bg-transparent">
                Verify Database Status
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
