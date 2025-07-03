"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface AdminResponse {
  success: boolean
  message?: string
  error?: string
  user?: {
    id: number
    email: string
    first_name: string
    last_name: string
    is_admin: boolean
  }
  admin_users?: Array<{
    id: number
    email: string
    first_name: string
    last_name: string
    is_admin: boolean
  }>
  target_user?: {
    id: number
    email: string
    first_name: string
    last_name: string
    is_admin: boolean
  } | null
  timestamp: string
}

export default function MakeAdminPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AdminResponse | null>(null)
  const [adminStatus, setAdminStatus] = useState<AdminResponse | null>(null)

  const makeAdmin = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/debug/make-admin", {
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
        error: "Failed to make admin request",
        timestamp: new Date().toISOString(),
      })
    } finally {
      setLoading(false)
    }
  }

  const checkAdminStatus = async () => {
    try {
      const response = await fetch("/api/debug/make-admin")
      const data = await response.json()
      setAdminStatus(data)
    } catch (error) {
      setAdminStatus({
        success: false,
        error: "Failed to check admin status",
        timestamp: new Date().toISOString(),
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Make Admin</h1>
          <p className="text-gray-600">Set bekace.multimedia@gmail.com as admin user</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Make Admin Card */}
          <Card>
            <CardHeader>
              <CardTitle>Make Admin</CardTitle>
              <CardDescription>Grant admin privileges to bekace.multimedia@gmail.com</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={makeAdmin} disabled={loading} className="w-full">
                {loading ? "Processing..." : "Make Admin"}
              </Button>

              {result && (
                <div className="space-y-2">
                  <div
                    className={`p-3 rounded ${result.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
                  >
                    <div className="font-medium">{result.success ? "Success!" : "Error"}</div>
                    <div className="text-sm">{result.message || result.error}</div>
                  </div>

                  {result.user && (
                    <div className="p-3 bg-blue-50 rounded">
                      <div className="font-medium">Updated User:</div>
                      <div className="text-sm space-y-1">
                        <div>ID: {result.user.id}</div>
                        <div>Email: {result.user.email}</div>
                        <div>
                          Name: {result.user.first_name} {result.user.last_name}
                        </div>
                        <div>
                          Admin:{" "}
                          <Badge variant={result.user.is_admin ? "default" : "secondary"}>
                            {result.user.is_admin ? "Yes" : "No"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Check Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Admin Status</CardTitle>
              <CardDescription>Check current admin users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={checkAdminStatus} variant="outline" className="w-full bg-transparent">
                Check Admin Status
              </Button>

              {adminStatus && (
                <div className="space-y-4">
                  {adminStatus.success ? (
                    <>
                      {adminStatus.target_user && (
                        <div className="p-3 bg-blue-50 rounded">
                          <div className="font-medium">Target User Status:</div>
                          <div className="text-sm space-y-1">
                            <div>Email: {adminStatus.target_user.email}</div>
                            <div>
                              Name: {adminStatus.target_user.first_name} {adminStatus.target_user.last_name}
                            </div>
                            <div>
                              Admin:{" "}
                              <Badge variant={adminStatus.target_user.is_admin ? "default" : "secondary"}>
                                {adminStatus.target_user.is_admin ? "Yes" : "No"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      )}

                      {adminStatus.admin_users && adminStatus.admin_users.length > 0 && (
                        <div className="p-3 bg-green-50 rounded">
                          <div className="font-medium">All Admin Users:</div>
                          <div className="text-sm space-y-2 mt-2">
                            {adminStatus.admin_users.map((user) => (
                              <div key={user.id} className="flex justify-between items-center">
                                <span>{user.email}</span>
                                <Badge variant="default">Admin</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-3 bg-red-50 text-red-800 rounded">
                      <div className="font-medium">Error</div>
                      <div className="text-sm">{adminStatus.error}</div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
