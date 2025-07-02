"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function DebugPage() {
  const [dbResult, setDbResult] = useState<any>(null)
  const [loginResult, setLoginResult] = useState<any>(null)
  const [email, setEmail] = useState("demo@signagecloud.com")
  const [password, setPassword] = useState("password123")
  const [loading, setLoading] = useState(false)

  const testDatabase = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/debug/test-db")
      const data = await response.json()
      setDbResult(data)
    } catch (error) {
      setDbResult({ error: "Failed to test database" })
    }
    setLoading(false)
  }

  const testLogin = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/debug/test-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await response.json()
      setLoginResult(data)
    } catch (error) {
      setLoginResult({ error: "Failed to test login" })
    }
    setLoading(false)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Debug Dashboard</h1>

      <Card>
        <CardHeader>
          <CardTitle>Database Connection Test</CardTitle>
          <CardDescription>Test if the database is connected and working</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testDatabase} disabled={loading}>
            Test Database Connection
          </Button>

          {dbResult && (
            <div className="bg-gray-100 p-4 rounded-lg">
              <pre className="text-sm overflow-auto">{JSON.stringify(dbResult, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Login Test</CardTitle>
          <CardDescription>Test the login functionality step by step</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>

          <Button onClick={testLogin} disabled={loading}>
            Test Login
          </Button>

          {loginResult && (
            <div className="bg-gray-100 p-4 rounded-lg">
              <pre className="text-sm overflow-auto">{JSON.stringify(loginResult, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
