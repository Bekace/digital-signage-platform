import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"
import { extractTokenFromRequest } from "@/lib/auth-utils"
import jwt from "jsonwebtoken"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [DEBUG AUTH] Starting comprehensive auth debugging...")

    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      request: {
        url: request.url,
        method: request.method,
        headers: {},
        cookies: {},
      },
      authentication: {
        headerToken: null,
        cookieToken: null,
        tokenValid: false,
        userFound: false,
        userId: null,
        userEmail: null,
      },
      database: {
        connected: false,
        tablesExist: {},
        userCount: 0,
        mediaCount: 0,
        playlistCount: 0,
      },
      errors: [],
    }

    // 1. Analyze request headers
    const authHeader = request.headers.get("authorization")
    const userAgent = request.headers.get("user-agent")
    const referer = request.headers.get("referer")

    debugInfo.request.headers = {
      authorization: authHeader ? `${authHeader.substring(0, 20)}...` : null,
      userAgent: userAgent?.substring(0, 100),
      referer,
      contentType: request.headers.get("content-type"),
    }

    // 2. Analyze cookies
    const cookieHeader = request.headers.get("cookie")
    if (cookieHeader) {
      const cookies = cookieHeader.split(";").reduce((acc: any, cookie) => {
        const [name, value] = cookie.trim().split("=")
        acc[name] = value
        return acc
      }, {})
      debugInfo.request.cookies = cookies
    }

    // 3. Extract and analyze tokens
    try {
      const headerToken = extractTokenFromRequest(request)
      debugInfo.authentication.headerToken = headerToken ? `${headerToken.substring(0, 20)}...` : null

      const cookieToken = request.cookies.get("auth-token")?.value
      debugInfo.authentication.cookieToken = cookieToken ? `${cookieToken.substring(0, 20)}...` : null

      // Validate token
      const tokenToUse = headerToken || cookieToken
      if (tokenToUse) {
        try {
          const decoded = jwt.verify(tokenToUse, process.env.JWT_SECRET!) as any
          debugInfo.authentication.tokenValid = true
          debugInfo.authentication.userId = decoded.userId
          debugInfo.authentication.userEmail = decoded.email
          debugInfo.authentication.tokenExpires = decoded.exp
          debugInfo.authentication.tokenIssuedAt = decoded.iat
        } catch (tokenError) {
          debugInfo.authentication.tokenError =
            tokenError instanceof Error ? tokenError.message : "Token validation failed"
          debugInfo.errors.push(`Token validation: ${debugInfo.authentication.tokenError}`)
        }
      } else {
        debugInfo.errors.push("No authentication token found in headers or cookies")
      }
    } catch (error) {
      debugInfo.errors.push(`Token extraction error: ${error instanceof Error ? error.message : "Unknown error"}`)
    }

    // 4. Test getCurrentUser function
    try {
      const user = await getCurrentUser(request)
      if (user) {
        debugInfo.authentication.userFound = true
        debugInfo.authentication.currentUser = {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          company: user.company,
          plan: user.plan,
          isAdmin: user.is_admin,
        }
      } else {
        debugInfo.errors.push("getCurrentUser returned null")
      }
    } catch (error) {
      debugInfo.errors.push(`getCurrentUser error: ${error instanceof Error ? error.message : "Unknown error"}`)
    }

    // 5. Test database connectivity and table structure
    try {
      debugInfo.database.connected = true

      // Check if tables exist and get counts
      const tables = ["users", "media_files", "playlists", "playlist_items", "devices"]

      for (const table of tables) {
        try {
          const result = await sql`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_name = ${table}
          `
          debugInfo.database.tablesExist[table] = Number(result[0].count) > 0
        } catch (error) {
          debugInfo.database.tablesExist[table] = false
          debugInfo.errors.push(`Table check for ${table}: ${error instanceof Error ? error.message : "Unknown error"}`)
        }
      }

      // Get record counts
      try {
        const userCount = await sql`SELECT COUNT(*) as count FROM users`
        debugInfo.database.userCount = Number(userCount[0].count)
      } catch (error) {
        debugInfo.errors.push(`User count error: ${error instanceof Error ? error.message : "Unknown error"}`)
      }

      try {
        const mediaCount = await sql`SELECT COUNT(*) as count FROM media_files WHERE deleted_at IS NULL`
        debugInfo.database.mediaCount = Number(mediaCount[0].count)
      } catch (error) {
        debugInfo.errors.push(`Media count error: ${error instanceof Error ? error.message : "Unknown error"}`)
      }

      try {
        const playlistCount = await sql`SELECT COUNT(*) as count FROM playlists WHERE deleted_at IS NULL`
        debugInfo.database.playlistCount = Number(playlistCount[0].count)
      } catch (error) {
        debugInfo.errors.push(`Playlist count error: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    } catch (error) {
      debugInfo.database.connected = false
      debugInfo.errors.push(`Database connection error: ${error instanceof Error ? error.message : "Unknown error"}`)
    }

    // 6. Test specific API endpoints that are failing
    const endpointTests = []

    // Test media API logic
    try {
      if (debugInfo.authentication.userFound && debugInfo.authentication.userId) {
        const mediaFiles = await sql`
          SELECT COUNT(*) as count
          FROM media_files 
          WHERE user_id = ${debugInfo.authentication.userId}
          AND deleted_at IS NULL
        `
        endpointTests.push({
          endpoint: "media_files_query",
          success: true,
          userMediaCount: Number(mediaFiles[0].count),
        })
      }
    } catch (error) {
      endpointTests.push({
        endpoint: "media_files_query",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }

    // Test playlists API logic
    try {
      if (debugInfo.authentication.userFound && debugInfo.authentication.userId) {
        const playlists = await sql`
          SELECT COUNT(*) as count
          FROM playlists 
          WHERE user_id = ${debugInfo.authentication.userId}
          AND deleted_at IS NULL
        `
        endpointTests.push({
          endpoint: "playlists_query",
          success: true,
          userPlaylistCount: Number(playlists[0].count),
        })
      }
    } catch (error) {
      endpointTests.push({
        endpoint: "playlists_query",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }

    debugInfo.endpointTests = endpointTests

    // 7. Environment checks
    debugInfo.environment = {
      jwtSecretExists: !!process.env.JWT_SECRET,
      databaseUrlExists: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV,
    }

    // 8. Summary and recommendations
    debugInfo.summary = {
      authenticationWorking: debugInfo.authentication.tokenValid && debugInfo.authentication.userFound,
      databaseWorking: debugInfo.database.connected && debugInfo.database.tablesExist.users,
      criticalErrors: debugInfo.errors.filter(
        (error: string) => error.includes("Token") || error.includes("Database") || error.includes("getCurrentUser"),
      ),
      recommendations: [],
    }

    if (!debugInfo.authentication.tokenValid) {
      debugInfo.summary.recommendations.push("User needs to log in - no valid authentication token")
    }

    if (!debugInfo.database.connected) {
      debugInfo.summary.recommendations.push("Database connection issues - check DATABASE_URL environment variable")
    }

    if (!debugInfo.environment.jwtSecretExists) {
      debugInfo.summary.recommendations.push("JWT_SECRET environment variable is missing")
    }

    if (debugInfo.errors.length > 0) {
      debugInfo.summary.recommendations.push(
        `${debugInfo.errors.length} errors detected - see errors array for details`,
      )
    }

    console.log("🔍 [DEBUG AUTH] Debug info collected:", {
      authWorking: debugInfo.summary.authenticationWorking,
      dbWorking: debugInfo.summary.databaseWorking,
      errorCount: debugInfo.errors.length,
    })

    return NextResponse.json({
      success: true,
      debug: debugInfo,
    })
  } catch (error) {
    console.error("🔍 [DEBUG AUTH] Critical error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Debug endpoint failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
