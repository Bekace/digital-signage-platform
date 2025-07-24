"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, XCircle, User, Shield, Calendar, Key } from "lucide-react"

interface SuperAdminResult {
  success: boolean
  message?: string
  error?: string
  details?: string
  user?: {
    id: number
    email: string
    firstName: string
    lastName: string
    isAdminFlag: boolean
    adminRole: string
    adminCreated: string
    permissions: any
  }
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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Shield className="mx-auto h-12 w-12 text-blue-600" />
          <h1 className="mt-4 text-3xl font-bold text-gray-900">Make Super Admin</h1>
          <p className="mt-2 text-gray-600">Grant super admin privileges to bekace.multimedia@gmail.com</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Target User
            </CardTitle>
            <CardDescription>This will grant super admin privileges to the specified user</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium text-gray-900">bekace.multimedia@gmail.com</p>
              <p className="text-sm text-gray-600 mt-1">
                Will be granted full system access and administrative privileges
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mb-6">
          <Button onClick={handleMakeSuperAdmin} disabled={loading} size="lg" className="px-8">
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Make Super Admin
              </>
            )}
          </Button>
        </div>

        {result && (
          <Card className={`border-2 ${result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${result.success ? "text-green-800" : "text-red-800"}`}>
                {result.success ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                {result.success ? "Super Admin Created Successfully" : "Error Occurred"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.success && result.user ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">User ID</label>
                      <p className="text-lg font-semibold">{result.user.id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="text-lg font-semibold">{result.user.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Name</label>
                      <p className="text-lg font-semibold">
                        {result.user.firstName} {result.user.lastName}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Admin Role</label>
                      <Badge variant="secondary" className="mt-1">
                        {result.user.adminRole}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <label className="text-sm font-medium text-gray-600">Status Flags</label>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <span>is_admin:</span>
                        <Badge variant={result.user.isAdminFlag ? "default" : "secondary"}>
                          {result.user.isAdminFlag ? "true" : "false"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>admin_users:</span>
                        <Badge variant="default">created</Badge>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Admin Created
                    </label>
                    <p className="text-sm text-gray-800 mt-1">{new Date(result.user.adminCreated).toLocaleString()}</p>
                  </div>

                  {result.user.permissions && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        Permissions Summary
                      </label>
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                        {Object.keys(result.user.permissions).map((permission) => (
                          <Badge key={permission} variant="outline" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-red-800 font-medium">{result.error}</p>
                  {result.details && <p className="text-red-600 text-sm">{result.details}</p>}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
