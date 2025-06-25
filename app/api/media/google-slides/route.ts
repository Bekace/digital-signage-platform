import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { url, title, duration = 30 } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "Google Slides URL is required" }, { status: 400 })
    }

    // Validate Google Slides URL
    const isValidGoogleSlidesUrl = (url: string) => {
      const patterns = [
        /^https:\/\/docs\.google\.com\/presentation\/d\/[a-zA-Z0-9-_]+/,
        /^https:\/\/drive\.google\.com\/file\/d\/[a-zA-Z0-9-_]+/,
      ]
      return patterns.some((pattern) => pattern.test(url))
    }

    if (!isValidGoogleSlidesUrl(url)) {
      return NextResponse.json(
        {
          error: "Invalid Google Slides URL. Please use a valid Google Slides or Google Drive presentation link.",
        },
        { status: 400 },
      )
    }

    // Convert to embed URL if needed
    const getEmbedUrl = (url: string) => {
      // Extract presentation ID from various Google URLs
      let presentationId = ""

      // From docs.google.com/presentation/d/ID
      const docsMatch = url.match(/\/presentation\/d\/([a-zA-Z0-9-_]+)/)
      if (docsMatch) {
        presentationId = docsMatch[1]
      }

      // From drive.google.com/file/d/ID
      const driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/)
      if (driveMatch) {
        presentationId = driveMatch[1]
      }

      if (presentationId) {
        return `https://docs.google.com/presentation/d/${presentationId}/embed?start=true&loop=true&delayms=${duration * 1000}`
      }

      return url
    }

    const embedUrl = getEmbedUrl(url)
    const sql = getDb()

    // Create unique filename for tracking
    const timestamp = Date.now()
    const sanitizedTitle = (title || "Google Slides Presentation").replace(/[^a-zA-Z0-9.-]/g, "_")
    const uniqueFilename = `${user.id}/slides/${timestamp}-${sanitizedTitle}`

    // Insert into media_files table
    const mediaResult = await sql`
      INSERT INTO media_files (
        user_id, 
        filename, 
        original_name,
        file_type,
        file_size, 
        url,
        external_url,
        media_source,
        mime_type,
        embed_settings,
        created_at
      ) VALUES (
        ${user.id}, 
        ${uniqueFilename}, 
        ${title || "Google Slides Presentation"},
        'presentation',
        0,
        ${embedUrl},
        ${url},
        'google_slides',
        'text/html',
        ${JSON.stringify({
          duration: duration,
          autoplay: true,
          loop: true,
          original_url: url,
          embed_url: embedUrl,
        })},
        NOW()
      )
      RETURNING *
    `

    // Update user's usage counters (count as 1 file, no storage used)
    await sql`
      UPDATE users 
      SET media_files_count = COALESCE(media_files_count, 0) + 1
      WHERE id = ${user.id}
    `

    return NextResponse.json({
      success: true,
      file: mediaResult[0],
      message: "Google Slides presentation added successfully",
    })
  } catch (error) {
    console.error("Google Slides add error:", error)
    return NextResponse.json(
      {
        error: "Failed to add Google Slides presentation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
