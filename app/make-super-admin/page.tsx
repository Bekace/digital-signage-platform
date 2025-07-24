"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, User, Mail, Calendar, CheckCircle, XCircle } from "lucide-react"

interface SuperAdminResult {
  success: boolean
  message?: string
  error?: string
  details?: string
  user?: {
    id: number
    email: string
    name: string
    adminRole: string
    adminPermissions: any
    adminCreated: string
  }
  action?: string
}

export default function MakeSuperAdminPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SuperAdminResult | null>(null)

  const handleMakeSuperAdmin = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/make-super-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: "Network error occurred",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <Shield className="mx-auto h-12 w-12 text-red-600 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">Super Admin Setup</h1>
          <p className="text-gray-600 mt-2">Grant super admin privileges to bekace.multimedia@gmail.com</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Target User
            </CardTitle>
            <CardDescription>This will grant full administrative privileges to the specified user</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="h-4 w-4" />
              bekace.multimedia@gmail.com
            </div>
          </CardContent>
        </Card>

        <div className="text-center mb-6">
          <Button onClick={handleMakeSuperAdmin} disabled={loading} size="lg" className="bg-red-600 hover:bg-red-700">
            {loading ? "Processing..." : "Make Super Admin"}
          </Button>
        </div>

        {result && (
          <Card className={`border-2 ${result.success ? "border-green-200" : "border-red-200"}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                {result.success ? "Success" : "Error"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.success ? (
                <div className="space-y-4">
                  <p className="text-green-700 font-medium">{result.message}</p>

                  {result.user && (
                    <div className="bg-green-50 p-4 rounded-lg space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">User ID:</span> {result.user.id}
                        </div>
                        <div>
                          <span className="font-medium">Email:</span> {result.user.email}
                        </div>
                        <div>
                          <span className="font-medium">Name:</span> {result.user.name}
                        </div>
                        <div>
                          <span className="font-medium">Admin Role:</span>
                          <Badge variant="destructive" className="ml-2">
                            {result.user.adminRole}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">Admin Created:</span>
                        {new Date(result.user.adminCreated).toLocaleString()}
                      </div>

                      <div className="text-sm">
                        <span className="font-medium">Action:</span>
                        <Badge variant="outline" className="ml-2">
                          {result.action}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-red-700 font-medium">{result.error}</p>
                  {result.details && <p className="text-red-600 text-sm bg-red-50 p-3 rounded">{result.details}</p>}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="mt-8 text-center">
          <Button variant="outline" onClick={() => (window.location.href = "/dashboard")}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
