import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"
import { extractTokenFromRequest } from "@/lib/auth-utils"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("📁 [MEDIA API] GET request received")

    // Extract and validate token from multiple sources
    let token = extractTokenFromRequest(request)
    const authHeader = request.headers.get("authorization")
    const cookieHeader = request.headers.get("cookie")

    console.log("📁 [MEDIA API] Auth header present:", !!authHeader)
    console.log("📁 [MEDIA API] Cookie header present:", !!cookieHeader)
    console.log("📁 [MEDIA API] Token extracted from header:", !!token)

    // Try to extract token from cookies if not found in Authorization header
    if (!token && cookieHeader) {
      const authTokenMatch = cookieHeader.match(/auth-token=([^;]+)/)
      if (authTokenMatch) {
        token = authTokenMatch[1]
        console.log("📁 [MEDIA API] Token extracted from cookie:", !!token)
      }
    }

    // Try to extract from URL parameters as fallback (for debugging)
    if (!token) {
      const url = new URL(request.url)
      const urlToken = url.searchParams.get("token")
      if (urlToken) {
        token = urlToken
        console.log("📁 [MEDIA API] Token extracted from URL:", !!token)
      }
    }

    if (!token) {
      console.log("📁 [MEDIA API] No valid token found")
      return NextResponse.json(
        {
          success: false,
          error: "No authentication token provided",
          debug: {
            authHeader: !!authHeader,
            authHeaderFormat: authHeader?.startsWith("Bearer ") ? "correct" : "incorrect",
            cookieHeader: !!cookieHeader,
            tokenExtracted: false,
            availableSources: {
              authorizationHeader: !!authHeader,
              cookieHeader: !!cookieHeader,
              urlParameter: !!request.url.includes("token="),
            },
          },
        },
        { status: 401 },
      )
    }

    // Get current user
    const user = await getCurrentUser(request)
    if (!user) {
      console.log("📁 [MEDIA API] No authenticated user found")
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired authentication token",
          debug: {
            authHeader: !!authHeader,
            tokenPresent: !!token,
            tokenLength: token.length,
            userFound: false,
          },
        },
        { status: 401 },
      )
    }

    console.log("📁 [MEDIA API] Authenticated user:", user.id, user.email)

    // Check if media_files table exists
    let tableExists = false
    try {
      const tableCheck = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'media_files'
        )
      `
      tableExists = tableCheck[0]?.exists || false
      console.log("📁 [MEDIA API] Media files table exists:", tableExists)
    } catch (error) {
      console.error("📁 [MEDIA API] Error checking table existence:", error)
    }

    if (!tableExists) {
      console.log("📁 [MEDIA API] Media files table does not exist")
      return NextResponse.json({
        success: true,
        media: [],
        files: [],
        total: 0,
        message: "Media files table does not exist yet",
        debug: {
          tableExists: false,
          userId: user.id,
          timestamp: new Date().toISOString(),
        },
      })
    }

    // Get media files for the user with better error handling
    let mediaFiles = []
    try {
      mediaFiles = await sql`
        SELECT 
          id,
          filename,
          original_name,
          original_filename,
          file_type,
          file_size,
          url,
          thumbnail_url,
          mime_type,
          dimensions,
          duration,
          media_source,
          external_url,
          embed_settings,
          created_at,
          updated_at,
          user_id
        FROM media_files 
        WHERE user_id = ${user.id} 
        AND (deleted_at IS NULL OR deleted_at = '')
        ORDER BY created_at DESC
      `

      // Ensure mediaFiles is an array
      if (!Array.isArray(mediaFiles)) {
        console.warn("📁 [MEDIA API] Query result is not an array:", typeof mediaFiles)
        mediaFiles = []
      }
    } catch (dbError) {
      console.error("📁 [MEDIA API] Database query error:", dbError)
      return NextResponse.json(
        {
          success: false,
          error: "Database query failed",
          details: dbError instanceof Error ? dbError.message : "Unknown database error",
          debug: {
            userId: user.id,
            userEmail: user.email,
            tableExists,
          },
        },
        { status: 500 },
      )
    }

    console.log("📁 [MEDIA API] Found", mediaFiles.length, "media files for user", user.id)

    // Ensure all files have required fields with fallbacks
    const processedFiles = mediaFiles.map((file) => ({
      ...file,
      original_name: file.original_name || file.original_filename || file.filename || "Untitled",
      thumbnail_url: file.thumbnail_url || "/thumbnails/generic.png",
      file_size: file.file_size || 0,
      created_at: file.created_at || new Date().toISOString(),
    }))

    return NextResponse.json({
      success: true,
      media: processedFiles,
      files: processedFiles, // Include both for compatibility
      total: processedFiles.length,
      debug: {
        userId: user.id,
        userEmail: user.email,
        filesFound: processedFiles.length,
        tableExists,
        authMethod: token === extractTokenFromRequest(request) ? "header" : "cookie",
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("📁 [MEDIA API] Unexpected error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        debug: {
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log("📁 [MEDIA API] DELETE request received")

    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      )
    }

    const { searchParams } = new URL(request.url)
    const mediaId = searchParams.get("id")

    if (!mediaId) {
      return NextResponse.json(
        {
          success: false,
          error: "Media ID is required",
        },
        { status: 400 },
      )
    }

    console.log("📁 [MEDIA API] Deleting media:", mediaId, "for user:", user.id)

    // Verify ownership and soft delete
    const result = await sql`
      UPDATE media_files 
      SET deleted_at = NOW() 
      WHERE id = ${mediaId} AND user_id = ${user.id} AND (deleted_at IS NULL OR deleted_at = '')
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Media file not found or already deleted",
        },
        { status: 404 },
      )
    }

    console.log("📁 [MEDIA API] Media deleted:", mediaId)

    return NextResponse.json({
      success: true,
      message: "Media file deleted successfully",
      deletedId: mediaId,
    })
  } catch (error) {
    console.error("📁 [MEDIA API] Error deleting media:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete media file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
