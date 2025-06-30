import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [DEBUG SCREENS FLOW] Starting comprehensive debug...")

    // Environment check
    const environment = {
      jwtSecretExists: !!process.env.JWT_SECRET,
      jwtSecretLength: process.env.JWT_SECRET?.length || 0,
      databaseUrlExists: !!process.env.DATABASE_URL,
    }

    // Request analysis
    const allHeaders: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      allHeaders[key] = value
    })

    const requestInfo = {
      hasAuthHeader: !!request.headers.get("authorization"),
      authHeaderPreview: request.headers.get("authorization")?.substring(0, 30) || null,
      allHeaders,
    }

    // Authentication test
    let authResult = "Failed"
    let userInfo = null
    try {
      const user = await getCurrentUser(request)
      if (user) {
        authResult = `Success: ${user.email}`
        userInfo = {
          id: user.id,
          email: user.email,
          name: `${user.first_name} ${user.last_name}`,
          plan: user.plan,
        }
      }
    } catch (error) {
      authResult = `Error: ${error instanceof Error ? error.message : "Unknown"}`
    }

    // Database test
    let dbResult = "Failed"
    let userCount = "Unknown"
    try {
      const users = await sql`SELECT COUNT(*) as count FROM users`
      userCount = `${users[0].count} users in database`
      dbResult = "Success"
    } catch (error) {
      dbResult = `Error: ${error instanceof Error ? error.message : "Unknown"}`
    }

    return NextResponse.json({
      success: true,
      debug: {
        environment,
        request: requestInfo,
        authentication: {
          result: authResult,
          user: userInfo,
        },
        database: {
          connectionTest: dbResult,
          userCount,
        },
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("❌ [DEBUG SCREENS FLOW] Error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    })
  }
}
