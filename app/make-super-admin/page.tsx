"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Shield, CheckCircle, AlertCircle } from "lucide-react"

export default function MakeSuperAdminPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const makeSuperAdmin = async () => {
    setLoading(true)
    setError(null)
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
        setResult(data)
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
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-blue-600" />
              <CardTitle>Make Super Admin</CardTitle>
            </div>
            <CardDescription>Grant super admin privileges to bekace.multimedia@gmail.com</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">What this will do:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Create or update admin_users record</li>
                <li>• Set role to 'super_admin'</li>
                <li>• Grant all permissions (users, media, playlists, devices, etc.)</li>
                <li>• Update is_admin flag in users table (if column exists)</li>
              </ul>
            </div>

            <Button onClick={makeSuperAdmin} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating Super Admin...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Make Super Admin
                </>
              )}
            </Button>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {result && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">{result.message}</p>
                    <div className="text-sm space-y-1">
                      <p>
                        <strong>User:</strong> {result.user.firstName} {result.user.lastName}
                      </p>
                      <p>
                        <strong>Email:</strong> {result.user.email}
                      </p>
                      <p>
                        <strong>User ID:</strong> {result.user.id}
                      </p>
                      <p>
                        <strong>Admin Role:</strong> {result.user.adminRole}
                      </p>
                      <p>
                        <strong>Is Admin Flag:</strong> {result.user.isAdminFlag ? "Yes" : "No"}
                      </p>
                      <p>
                        <strong>Admin Created:</strong> {result.user.adminCreated || "Just now"}
                      </p>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {result && result.user.permissions && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Granted Permissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
                    {JSON.stringify(result.user.permissions, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
