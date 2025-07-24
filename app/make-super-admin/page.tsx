"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, XCircle, User, Shield, Clock, Mail } from "lucide-react"

interface AdminUser {
  id: number
  email: string
  firstName: string
  lastName: string
  isAdminFlag: boolean
  adminRole: string
  adminCreated: string
  permissions: Record<string, any>
}

interface ApiResponse {
  success: boolean
  message: string
  user?: AdminUser
  error?: string
  details?: string
}

export default function MakeSuperAdminPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<ApiResponse | null>(null)

  const handleMakeSuperAdmin = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/make-super-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data: ApiResponse = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: "Network error occurred",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Make Super Admin</h1>
          <p className="text-gray-600">Create super admin privileges for bekace.multimedia@gmail.com</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Super Admin Setup
            </CardTitle>
            <CardDescription>
              This will grant full administrative privileges to the specified user account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <Mail className="h-5 w-5 text-yellow-600 mt-0.5" />
                </div>
                <div>
                  <h3 className="font-medium text-yellow-800">Target User</h3>
                  <p className="text-sm text-yellow-700 mt-1">bekace.multimedia@gmail.com</p>
                </div>
              </div>
            </div>

            <Button onClick={handleMakeSuperAdmin} disabled={isLoading} className="w-full">
              {isLoading ? "Creating Super Admin..." : "Make Super Admin"}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card>
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
            <CardContent className="space-y-4">
              {result.success && result.user ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 font-medium">{result.message}</p>
                  </div>

                  <div className="grid gap-4">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        User ID
                      </span>
                      <Badge variant="secondary">{result.user.id}</Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </span>
                      <span className="text-sm">{result.user.email}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Name
                      </span>
                      <span className="text-sm">
                        {result.user.firstName} {result.user.lastName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Admin Role
                      </span>
                      <Badge variant={result.user.adminRole === "super_admin" ? "default" : "secondary"}>
                        {result.user.adminRole}
                      </Badge>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Status Flags</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">is_admin</span>
                        <Badge variant={result.user.isAdminFlag ? "default" : "secondary"}>
                          {result.user.isAdminFlag ? "true" : "false"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">admin_users</span>
                        <Badge variant="default">created</Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Admin Created
                      </span>
                      <span className="text-sm">{new Date(result.user.adminCreated).toLocaleString()}</span>
                    </div>

                    {result.user.permissions && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Permissions</h4>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <pre className="text-xs overflow-auto">
                            {JSON.stringify(result.user.permissions, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 font-medium">{result.error}</p>
                    {result.details && <p className="text-red-700 text-sm mt-1">{result.details}</p>}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">What This Does</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <p>• Finds the user by email address</p>
            <p>• Creates or updates record in admin_users table</p>
            <p>• Sets role to 'super_admin'</p>
            <p>• Grants full permissions for all modules</p>
            <p>• Updates is_admin flag if column exists</p>
            <p>• Provides detailed verification results</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
