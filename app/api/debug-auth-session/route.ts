import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"
import { extractTokenFromRequest } from "@/lib/auth-utils"
import jwt from "jsonwebtoken"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [DEBUG AUTH] Starting comprehensive auth debug")

    const debug: any = {
      timestamp: new Date().toISOString(),
      request: {
        url: request.url,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
      },
      auth: {},
      database: {},
      errors: [],
    }

    // 1. Check Authorization header
    const authHeader = request.headers.get("authorization")
    debug.auth.authHeader = {
      present: !!authHeader,
      format: authHeader?.startsWith("Bearer ") ? "correct" : "incorrect",
      value: authHeader ? authHeader.substring(0, 20) + "..." : null,
    }

    // 2. Extract token
    const token = extractTokenFromRequest(request)
    debug.auth.tokenExtraction = {
      success: !!token,
      length: token?.length || 0,
      preview: token ? token.substring(0, 50) + "..." : null,
    }

    // 3. Verify token if present
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
        debug.auth.tokenVerification = {
          valid: true,
          userId: decoded.userId,
          email: decoded.email,
          expires: decoded.exp,
          isExpired: decoded.exp < Math.floor(Date.now() / 1000),
        }
      } catch (tokenError) {
        debug.auth.tokenVerification = {
          valid: false,
          error: tokenError instanceof Error ? tokenError.message : "Unknown error",
        }
        debug.errors.push(`Token verification failed: ${tokenError}`)
      }
    }

    // 4. Test getCurrentUser function
    try {
      const user = await getCurrentUser(request)
      debug.auth.getCurrentUser = {
        success: !!user,
        user: user
          ? {
              id: user.id,
              email: user.email,
              firstName: user.first_name,
              lastName: user.last_name,
              isAdmin: user.is_admin,
            }
          : null,
      }
    } catch (userError) {
      debug.auth.getCurrentUser = {
        success: false,
        error: userError instanceof Error ? userError.message : "Unknown error",
      }
      debug.errors.push(`getCurrentUser failed: ${userError}`)
    }

    // 5. Test database connectivity
    try {
      const dbTest = await sql`SELECT 1 as test`
      debug.database.connectivity = {
        success: true,
        result: dbTest[0],
      }
    } catch (dbError) {
      debug.database.connectivity = {
        success: false,
        error: dbError instanceof Error ? dbError.message : "Unknown error",
      }
      debug.errors.push(`Database connectivity failed: ${dbError}`)
    }

    // 6. Check users table structure
    try {
      const tableInfo = await sql`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        ORDER BY ordinal_position
      `
      debug.database.usersTable = {
        exists: tableInfo.length > 0,
        columns: tableInfo,
      }
    } catch (tableError) {
      debug.database.usersTable = {
        exists: false,
        error: tableError instanceof Error ? tableError.message : "Unknown error",
      }
      debug.errors.push(`Users table check failed: ${tableError}`)
    }

    // 7. Check media_files table structure
    try {
      const mediaTableInfo = await sql`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'media_files' 
        ORDER BY ordinal_position
      `
      debug.database.mediaFilesTable = {
        exists: mediaTableInfo.length > 0,
        columns: mediaTableInfo,
      }
    } catch (mediaTableError) {
      debug.database.mediaFilesTable = {
        exists: false,
        error: mediaTableError instanceof Error ? mediaTableError.message : "Unknown error",
      }
      debug.errors.push(`Media files table check failed: ${mediaTableError}`)
    }

    // 8. Check playlists table structure
    try {
      const playlistsTableInfo = await sql`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'playlists' 
        ORDER BY ordinal_position
      `
      debug.database.playlistsTable = {
        exists: playlistsTableInfo.length > 0,
        columns: playlistsTableInfo,
      }
    } catch (playlistsTableError) {
      debug.database.playlistsTable = {
        exists: false,
        error: playlistsTableError instanceof Error ? playlistsTableError.message : "Unknown error",
      }
      debug.errors.push(`Playlists table check failed: ${playlistsTableError}`)
    }

    // 9. Environment variables check
    debug.environment = {
      jwtSecret: !!process.env.JWT_SECRET,
      databaseUrl: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV,
    }

    console.log("🔍 [DEBUG AUTH] Debug complete:", debug.errors.length, "errors found")

    return NextResponse.json({
      success: true,
      debug,
      summary: {
        authWorking: !!debug.auth.getCurrentUser?.success,
        databaseWorking: !!debug.database.connectivity?.success,
        tablesExist: {
          users: !!debug.database.usersTable?.exists,
          mediaFiles: !!debug.database.mediaFilesTable?.exists,
          playlists: !!debug.database.playlistsTable?.exists,
        },
        errorCount: debug.errors.length,
      },
    })
  } catch (error) {
    console.error("🔍 [DEBUG AUTH] Fatal error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Debug session failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
