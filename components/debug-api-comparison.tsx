"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function DebugAPIComparison() {
  const [mediaData, setMediaData] = useState<any>(null)
  const [usersData, setUsersData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testMediaAPI = async () => {
    setLoading(true)
    try {
      console.log("🎬 Testing Media API...")
      const response = await fetch("/api/media")
      const data = await response.json()
      console.log("🎬 Media API Response:", data)
      setMediaData(data)
    } catch (err) {
      console.error("🎬 Media API Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const testUsersAPI = async () => {
    setLoading(true)
    try {
      console.log("👥 Testing Users API...")
      const response = await fetch("/api/admin/users")
      const data = await response.json()
      console.log("👥 Users API Response:", data)
      setUsersData(data)
    } catch (err) {
      console.error("👥 Users API Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const compareStructures = () => {
    console.log("🔍 STRUCTURE COMPARISON:")
    console.log("Media structure:", mediaData)
    console.log("Users structure:", usersData)

    if (mediaData && usersData) {
      console.log("Media files count:", mediaData.files?.length || 0)
      console.log("Users count:", usersData.users?.length || 0)
      console.log("Media has 'files' property:", !!mediaData.files)
      console.log("Users has 'users' property:", !!usersData.users)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>API Pattern Comparison Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={testMediaAPI} disabled={loading}>
            Test Media API
          </Button>
          <Button onClick={testUsersAPI} disabled={loading}>
            Test Users API
          </Button>
          <Button onClick={compareStructures} disabled={!mediaData || !usersData}>
            Compare Structures
          </Button>
        </div>

        {mediaData && (
          <div className="p-4 bg-green-50 rounded">
            <h3 className="font-bold">Media API Response:</h3>
            <pre className="text-xs overflow-auto">{JSON.stringify(mediaData, null, 2)}</pre>
          </div>
        )}

        {usersData && (
          <div className="p-4 bg-blue-50 rounded">
            <h3 className="font-bold">Users API Response:</h3>
            <pre className="text-xs overflow-auto">{JSON.stringify(usersData, null, 2)}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
