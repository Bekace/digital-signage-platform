import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("📁 [MEDIA API] GET request received")

    // Get current user
    const user = await getCurrentUser(request)
    if (!user) {
      console.log("📁 [MEDIA API] No authenticated user found")
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      )
    }

    console.log("📁 [MEDIA API] Authenticated user:", user.id, user.email)

    // Get media files for the user with better error handling
    let mediaFiles
    try {
      mediaFiles = await sql`
        SELECT 
          id,
          filename,
          original_name,
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
        AND deleted_at IS NULL
        ORDER BY created_at DESC
      `
    } catch (dbError) {
      console.error("📁 [MEDIA API] Database query error:", dbError)
      return NextResponse.json(
        {
          success: false,
          error: "Database query failed",
          details: dbError instanceof Error ? dbError.message : "Unknown database error",
        },
        { status: 500 },
      )
    }

    console.log("📁 [MEDIA API] Found", mediaFiles.length, "media files for user", user.id)

    // Ensure all files have required fields with fallbacks
    const processedFiles = mediaFiles.map((file) => ({
      ...file,
      original_name: file.original_name || file.filename || "Untitled",
      thumbnail_url: file.thumbnail_url || "/thumbnails/generic.png",
      file_size: file.file_size || 0,
      created_at: file.created_at || new Date().toISOString(),
    }))

    return NextResponse.json({
      success: true,
      media: processedFiles,
      files: processedFiles, // Include both for compatibility
      total: processedFiles.length,
    })
  } catch (error) {
    console.error("📁 [MEDIA API] Unexpected error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
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
      WHERE id = ${mediaId} AND user_id = ${user.id} AND deleted_at IS NULL
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
