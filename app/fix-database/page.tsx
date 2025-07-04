"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Database, CheckCircle, XCircle } from "lucide-react"

export default function FixDatabasePage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")

  const runFix = async () => {
    setLoading(true)
    setError("")
    setResult(null)

    try {
      const response = await fetch("/api/fix-database-schema", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (data.success) {
        setResult(data)
      } else {
        setError(data.error || "Failed to fix database")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
    } finally {
      setLoading(false)
    }
  }

  const checkSchema = async () => {
    setLoading(true)
    setError("")
    setResult(null)

    try {
      const response = await fetch("/api/fix-database-schema", {
        method: "GET",
      })

      const data = await response.json()

      if (data.success) {
        setResult(data)
      } else {
        setError(data.error || "Failed to check database")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Database Schema Fix</h1>
          <p className="text-gray-600">Fix missing columns in the devices table</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Check Schema
              </CardTitle>
              <CardDescription>Check the current database table structure</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={checkSchema} disabled={loading} className="w-full">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Check Current Schema
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Fix Schema
              </CardTitle>
              <CardDescription>Add missing columns to the devices table</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={runFix} disabled={loading} className="w-full">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Run Database Fix
              </Button>
            </CardContent>
          </Card>
        </div>

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{result.message || "Operation completed successfully"}</AlertDescription>
          </Alert>
        )}

        {result && result.columns && (
          <Card>
            <CardHeader>
              <CardTitle>Database Table Structure</CardTitle>
              <CardDescription>Current columns in the devices table</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {result.columns.map((column: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="font-medium">{column.column_name}</span>
                    <span className="text-sm text-gray-600">
                      {column.data_type} {column.is_nullable === "NO" ? "(NOT NULL)" : "(NULLABLE)"}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {result && result.finalColumns && (
          <Card>
            <CardHeader>
              <CardTitle>Updated Table Structure</CardTitle>
              <CardDescription>Columns after the fix</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {result.finalColumns.map((column: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-green-50 rounded">
                    <span className="font-medium">{column.column_name}</span>
                    <span className="text-sm text-gray-600">
                      {column.data_type} {column.is_nullable === "NO" ? "(NOT NULL)" : "(NULLABLE)"}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>1. First, click "Check Current Schema" to see what columns exist</p>
            <p>2. Then click "Run Database Fix" to add missing columns</p>
            <p>3. After the fix, test the Screens page at /dashboard/screens</p>
            <p>4. The API endpoints should now work without column errors</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
