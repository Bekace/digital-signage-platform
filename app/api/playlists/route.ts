import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("🎵 [PLAYLISTS API] GET request received")

    const user = await getCurrentUser(request)
    if (!user) {
      console.log("🎵 [PLAYLISTS API] No authenticated user found")
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      )
    }

    console.log("🎵 [PLAYLISTS API] Authenticated user:", user.id, user.email)

    // Get ALL columns from playlists table
    console.log("🎵 [PLAYLISTS API] Checking available columns...")
    const columnCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'playlists'
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `

    console.log("🎵 [PLAYLISTS API] Raw column check result:", columnCheck)
    console.log("🎵 [PLAYLISTS API] Column check length:", columnCheck.length)

    const availableColumns = columnCheck.map((row) => row.column_name)
    console.log("🎵 [PLAYLISTS API] Available columns:", availableColumns)
    console.log("🎵 [PLAYLISTS API] Total available columns:", availableColumns.length)

    // Check specifically for the problematic columns
    const problemColumns = [
      "scale_image",
      "scale_video",
      "scale_document",
      "shuffle",
      "default_transition",
      "transition_speed",
      "auto_advance",
      "background_color",
      "text_overlay",
    ]

    const foundProblemColumns = problemColumns.filter((col) => availableColumns.includes(col))
    const missingProblemColumns = problemColumns.filter((col) => !availableColumns.includes(col))

    console.log("🎵 [PLAYLISTS API] Found problem columns:", foundProblemColumns)
    console.log("🎵 [PLAYLISTS API] Missing problem columns:", missingProblemColumns)

    // Build the SELECT query with ALL available columns
    const selectColumns = availableColumns.join(", ")
    console.log("🎵 [PLAYLISTS API] SELECT columns string:", selectColumns)

    // Get playlists for the user
    const playlistsQuery = `
      SELECT ${selectColumns}
      FROM playlists 
      WHERE user_id = $1 
      AND (deleted_at IS NULL OR deleted_at = '')
      ORDER BY updated_at DESC
    `

    console.log("🎵 [PLAYLISTS API] Executing query:", playlistsQuery)
    const playlists = await sql.unsafe(playlistsQuery, [user.id])

    console.log("🎵 [PLAYLISTS API] Found", playlists.length, "playlists")
    if (playlists.length > 0) {
      console.log("🎵 [PLAYLISTS API] First playlist keys:", Object.keys(playlists[0]))
      console.log("🎵 [PLAYLISTS API] First playlist sample:", {
        id: playlists[0].id,
        name: playlists[0].name,
        scale_image: playlists[0].scale_image,
        scale_video: playlists[0].scale_video,
        shuffle: playlists[0].shuffle,
        background_color: playlists[0].background_color,
      })
    }

    // Process playlists and add item counts
    const processedPlaylists = await Promise.all(
      playlists.map(async (playlist) => {
        try {
          // Get item count
          const itemCountResult = await sql`
            SELECT COUNT(*) as count 
            FROM playlist_items 
            WHERE playlist_id = ${playlist.id}
          `
          const itemCount = Number.parseInt(itemCountResult[0]?.count) || 0

          // Return playlist with all its existing properties plus computed ones
          return {
            ...playlist, // This should include ALL columns from the database
            item_count: itemCount,
            device_count: 0, // TODO: Calculate actual device count
            total_duration: 0, // TODO: Calculate actual duration
            assigned_devices: [], // TODO: Get actual assigned devices
          }
        } catch (error) {
          console.error("🎵 [PLAYLISTS API] Error processing playlist", playlist.id, ":", error)
          return {
            ...playlist,
            item_count: 0,
            device_count: 0,
            total_duration: 0,
            assigned_devices: [],
          }
        }
      }),
    )

    console.log("🎵 [PLAYLISTS API] Processed playlists count:", processedPlaylists.length)
    if (processedPlaylists.length > 0) {
      console.log("🎵 [PLAYLISTS API] First processed playlist keys:", Object.keys(processedPlaylists[0]))
    }

    return NextResponse.json({
      success: true,
      playlists: processedPlaylists,
      total: processedPlaylists.length,
      debug: {
        availableColumns: availableColumns,
        totalColumns: availableColumns.length,
        foundProblemColumns: foundProblemColumns,
        missingProblemColumns: missingProblemColumns,
        userId: user.id,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("🎵 [PLAYLISTS API] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch playlists",
        details: error instanceof Error ? error.message : "Unknown error",
        debug: {
          timestamp: new Date().toISOString(),
          errorType: error instanceof Error ? error.constructor.name : typeof error,
        },
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("🎵 [PLAYLISTS API] POST request received")

    const user = await getCurrentUser(request)
    if (!user) {
      console.log("🎵 [PLAYLISTS API] No authenticated user found for POST")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json({ error: "Playlist name is required" }, { status: 400 })
    }

    console.log("🎵 [PLAYLISTS API] Creating playlist:", name, "for user:", user.id)

    // Get available columns for insert
    const columnCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'playlists'
      AND table_schema = 'public'
    `

    const availableColumns = columnCheck.map((row) => row.column_name)
    console.log("🎵 [PLAYLISTS API] Available columns for insert:", availableColumns)

    // Build insert data with all available columns
    const insertData = {
      name,
      user_id: user.id,
      created_at: new Date(),
      updated_at: new Date(),
    }

    // Add all optional columns with their default values if they exist
    if (availableColumns.includes("description")) insertData.description = description || ""
    if (availableColumns.includes("status")) insertData.status = "draft"
    if (availableColumns.includes("loop_enabled")) insertData.loop_enabled = true
    if (availableColumns.includes("schedule_enabled")) insertData.schedule_enabled = false
    if (availableColumns.includes("scale_image")) insertData.scale_image = "fit"
    if (availableColumns.includes("scale_video")) insertData.scale_video = "fit"
    if (availableColumns.includes("scale_document")) insertData.scale_document = "fit"
    if (availableColumns.includes("shuffle")) insertData.shuffle = false
    if (availableColumns.includes("default_transition")) insertData.default_transition = "fade"
    if (availableColumns.includes("transition_speed")) insertData.transition_speed = "normal"
    if (availableColumns.includes("auto_advance")) insertData.auto_advance = true
    if (availableColumns.includes("background_color")) insertData.background_color = "#000000"
    if (availableColumns.includes("text_overlay")) insertData.text_overlay = false

    console.log("🎵 [PLAYLISTS API] Insert data:", insertData)

    // Build dynamic insert query
    const columns = Object.keys(insertData)
    const values = Object.values(insertData)
    const placeholders = values.map((_, index) => `$${index + 1}`).join(", ")

    const insertQuery = `
      INSERT INTO playlists (${columns.join(", ")}) 
      VALUES (${placeholders}) 
      RETURNING *
    `

    console.log("🎵 [PLAYLISTS API] Insert query:", insertQuery)
    const result = await sql.unsafe(insertQuery, values)
    const playlist = result[0]

    console.log("🎵 [PLAYLISTS API] Created playlist:", playlist.id)
    console.log("🎵 [PLAYLISTS API] Created playlist keys:", Object.keys(playlist))

    return NextResponse.json({
      success: true,
      playlist,
      message: "Playlist created successfully",
    })
  } catch (error) {
    console.error("🎵 [PLAYLISTS API] Error creating playlist:", error)
    return NextResponse.json(
      {
        error: "Failed to create playlist",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
