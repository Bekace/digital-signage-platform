"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Shield, User, CheckCircle, XCircle } from "lucide-react"

interface SuperAdminResult {
  success: boolean
  message: string
  user?: {
    id: number
    email: string
    name: string
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
        message: `Error: ${error}`,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Shield className="mx-auto h-12 w-12 text-red-600" />
          <h1 className="mt-4 text-3xl font-bold text-gray-900">Super Admin Setup</h1>
          <p className="mt-2 text-gray-600">Create super admin privileges for bekace.multimedia@gmail.com</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Super Admin Creation
            </CardTitle>
            <CardDescription>
              This will grant full administrative privileges to the specified user account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Target User:</h3>
              <p className="text-gray-700">bekace.multimedia@gmail.com</p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Permissions to be granted:</h3>
              <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                <div>• User Management</div>
                <div>• Plan Management</div>
                <div>• Feature Management</div>
                <div>• Media Management</div>
                <div>• Playlist Management</div>
                <div>• Device Management</div>
                <div>• System Access</div>
                <div>• Debug Tools</div>
              </div>
            </div>

            <Button onClick={handleMakeSuperAdmin} disabled={loading} className="w-full" size="lg">
              {loading ? "Creating Super Admin..." : "Make Super Admin"}
            </Button>

            {result && (
              <Alert className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription className={result.success ? "text-green-800" : "text-red-800"}>
                    {result.message}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {result?.success && result.user && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-green-800 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Super Admin Created Successfully
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <span className="font-semibold text-green-800">User ID:</span>
                      <span className="ml-2 text-green-700">{result.user.id}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-green-800">Email:</span>
                      <span className="ml-2 text-green-700">{result.user.email}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-green-800">Name:</span>
                      <span className="ml-2 text-green-700">{result.user.name}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-green-800">Admin Role:</span>
                      <Badge variant="destructive" className="ml-2">
                        {result.user.adminRole}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-semibold text-green-800">Created:</span>
                      <span className="ml-2 text-green-700">{new Date(result.user.adminCreated).toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            After creating super admin, refresh your dashboard to see admin navigation links.
          </p>
        </div>
      </div>
    </div>
  )
}
