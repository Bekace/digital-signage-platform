"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, Shield, CheckCircle, AlertCircle, User, Key } from "lucide-react"

interface AdminUser {
  id: number
  email: string
  firstName: string
  lastName: string
  isAdminFlag: boolean
  adminRole: string
  adminCreated: string
  permissions: any
}

export default function MakeSuperAdminPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AdminUser | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const makeSuperAdmin = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    setResult(null)

    try {
      const response = await fetch("/api/make-super-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(data.message)
        setResult(data.user)
      } else {
        setError(data.error || "Failed to make user super admin")
      }
    } catch (err) {
      setError("Network error: Failed to make user super admin")
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Shield className="h-8 w-8 text-red-600" />
            <h1 className="text-3xl font-bold">Make Super Admin</h1>
          </div>
          <p className="text-gray-600">Grant super admin privileges to bekace.multimedia@gmail.com</p>
        </div>

        {/* Action Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Super Admin Setup
            </CardTitle>
            <CardDescription>
              This will create or update admin privileges for bekace.multimedia@gmail.com with full system access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">⚠️ What This Will Do:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Find user by email: bekace.multimedia@gmail.com</li>
                  <li>• Create or update admin_users record</li>
                  <li>• Set role to 'super_admin'</li>
                  <li>• Grant full permissions to all modules</li>
                  <li>• Update is_admin flag (if column exists)</li>
                </ul>
              </div>

              <Button onClick={makeSuperAdmin} disabled={loading} className="w-full" size="lg">
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Creating Super Admin...
                  </>
                ) : (
                  <>
                    <Shield className="h-5 w-5 mr-2" />
                    Make Super Admin
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert className="mb-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Result Card */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                Super Admin Created Successfully
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">User ID</label>
                    <p className="text-lg font-mono">{result.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-lg">{result.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="text-lg">
                      {result.firstName} {result.lastName}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Admin Role</label>
                    <Badge variant="default" className="mt-1">
                      {result.adminRole}
                    </Badge>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Status Flags</label>
                  <div className="flex space-x-2 mt-1">
                    <Badge variant={result.isAdminFlag ? "default" : "secondary"}>
                      is_admin: {result.isAdminFlag ? "true" : "false"}
                    </Badge>
                    <Badge variant="default">admin_users: created</Badge>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Admin Created</label>
                  <p className="text-sm text-gray-600">
                    {result.adminCreated ? new Date(result.adminCreated).toLocaleString() : "Just now"}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center">
                    <Key className="h-4 w-4 mr-1" />
                    Permissions Granted
                  </label>
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <pre className="text-xs text-gray-700 overflow-x-auto">
                      {JSON.stringify(result.permissions, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">✅ Next Steps:</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• You now have super admin access</li>
                    <li>• Visit /dashboard/admin to access admin features</li>
                    <li>• Check /dashboard/admin/users to manage users</li>
                    <li>• Access /dashboard/admin/features for feature management</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Troubleshooting</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <strong>If you get "User not found":</strong>
                <p className="text-gray-600">Make sure bekace.multimedia@gmail.com is registered in the users table</p>
              </div>
              <div>
                <strong>If you get a database error:</strong>
                <p className="text-gray-600">Check that the admin_users table exists and has the correct structure</p>
              </div>
              <div>
                <strong>Alternative method:</strong>
                <p className="text-gray-600">
                  You can also run the Node.js script:{" "}
                  <code className="bg-gray-100 px-1 rounded">node scripts/make-super-admin.js</code>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
