import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [DEBUG SCREENS] Starting comprehensive debug...")

    // Check environment variables
    const jwtSecret = process.env.JWT_SECRET
    const dbUrl = process.env.DATABASE_URL

    console.log("🔍 [DEBUG SCREENS] Environment check:")
    console.log("- JWT_SECRET exists:", !!jwtSecret)
    console.log("- JWT_SECRET length:", jwtSecret?.length || 0)
    console.log("- DATABASE_URL exists:", !!dbUrl)

    // Check headers
    const headers = Object.fromEntries(request.headers.entries())
    console.log("🔍 [DEBUG SCREENS] Request headers:", headers)

    const authHeader = request.headers.get("authorization")
    console.log(
      "🔍 [DEBUG SCREENS] Authorization header:",
      authHeader ? `${authHeader.substring(0, 30)}...` : "NOT FOUND",
    )

    // Test authentication
    let authResult = "Not tested"
    let user = null
    try {
      user = await getCurrentUser(request)
      authResult = user ? `Success: ${user.email}` : "Failed: No user returned"
    } catch (error) {
      authResult = `Error: ${error instanceof Error ? error.message : "Unknown error"}`
    }

    // Test database connection
    let dbResult = "Not tested"
    try {
      const testQuery = await sql`SELECT 1 as test`
      dbResult = testQuery.length > 0 ? "Success" : "Failed: No results"
    } catch (error) {
      dbResult = `Error: ${error instanceof Error ? error.message : "Unknown error"}`
    }

    // Test user count
    let userCount = "Not tested"
    try {
      const users = await sql`SELECT COUNT(*) as count FROM users`
      userCount = `${users[0]?.count || 0} users in database`
    } catch (error) {
      userCount = `Error: ${error instanceof Error ? error.message : "Unknown error"}`
    }

    return NextResponse.json({
      success: true,
      debug: {
        environment: {
          jwtSecretExists: !!jwtSecret,
          jwtSecretLength: jwtSecret?.length || 0,
          databaseUrlExists: !!dbUrl,
        },
        request: {
          hasAuthHeader: !!authHeader,
          authHeaderPreview: authHeader ? `${authHeader.substring(0, 30)}...` : null,
          allHeaders: headers,
        },
        authentication: {
          result: authResult,
          user: user
            ? {
                id: user.id,
                email: user.email,
                name: `${user.first_name} ${user.last_name}`,
                plan: user.plan,
              }
            : null,
        },
        database: {
          connectionTest: dbResult,
          userCount: userCount,
        },
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("🔍 [DEBUG SCREENS] Critical error:", error)
    return NextResponse.json({
      success: false,
      error: "Debug failed",
      details: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : "No stack",
    })
  }
}
