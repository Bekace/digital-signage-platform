import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("📁 [MEDIA API] GET request received")

    // Check authorization header
    const authHeader = request.headers.get("authorization")
    console.log("📁 [MEDIA API] Auth header present:", !!authHeader)

    const user = await getCurrentUser(request)
    if (!user) {
      console.log("📁 [MEDIA API] No authenticated user found")
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          debug: {
            authHeader: !!authHeader,
            authHeaderFormat: authHeader?.startsWith("Bearer ") ? "correct" : "incorrect",
          },
        },
        { status: 401 },
      )
    }

    console.log("📁 [MEDIA API] Authenticated user:", user.id)

    // Get media files for the user
    const mediaFiles = await sql`
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
      AND deleted_at IS NULL
      ORDER BY created_at DESC
    `

    console.log("📁 [MEDIA API] Found", mediaFiles.length, "media files for user", user.id)

    return NextResponse.json({
      success: true,
      media: mediaFiles,
      files: mediaFiles, // Include both for compatibility
      total: mediaFiles.length,
    })
  } catch (error) {
    console.error("📁 [MEDIA API] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch media files",
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const mediaId = searchParams.get("id")

    if (!mediaId) {
      return NextResponse.json({ error: "Media ID is required" }, { status: 400 })
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
      return NextResponse.json({ error: "Media file not found" }, { status: 404 })
    }

    console.log("📁 [MEDIA API] Media deleted:", mediaId)

    return NextResponse.json({
      success: true,
      message: "Media file deleted successfully",
    })
  } catch (error) {
    console.error("📁 [MEDIA API] Error deleting media:", error)
    return NextResponse.json(
      {
        error: "Failed to delete media file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
