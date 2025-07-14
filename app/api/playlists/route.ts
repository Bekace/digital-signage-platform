import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("🎵 [PLAYLISTS API] GET request received")

    // Check authorization header
    const authHeader = request.headers.get("authorization")
    console.log("🎵 [PLAYLISTS API] Auth header present:", !!authHeader)
    console.log("🎵 [PLAYLISTS API] Auth header value:", authHeader?.substring(0, 20) + "...")

    const user = await getCurrentUser(request)
    if (!user) {
      console.log("🎵 [PLAYLISTS API] No authenticated user found")
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

    console.log("🎵 [PLAYLISTS API] Authenticated user:", user.id, user.email)

    // First, check what columns exist in the playlists table
    let availableColumns = []
    try {
      const columnCheck = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'playlists'
        ORDER BY ordinal_position
      `
      availableColumns = columnCheck.map((row) => row.column_name)
      console.log("🎵 [PLAYLISTS API] Available columns:", availableColumns)
    } catch (columnError) {
      console.error("🎵 [PLAYLISTS API] Error checking columns:", columnError)
    }

    // Build dynamic SELECT query based on available columns
    const baseColumns = [
      "id",
      "name",
      "description",
      "status",
      "loop_enabled",
      "schedule_enabled",
      "start_time",
      "end_time",
      "selected_days",
      "created_at",
      "updated_at",
      "user_id",
    ]

    const optionalColumns = [
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

    // Only include columns that exist
    const columnsToSelect = [
      ...baseColumns.filter((col) => availableColumns.includes(col)),
      ...optionalColumns.filter((col) => availableColumns.includes(col)),
    ]

    console.log("🎵 [PLAYLISTS API] Selecting columns:", columnsToSelect)

    // Get playlists for the user with dynamic column selection
    let playlists = []
    try {
      const selectQuery = `
        SELECT ${columnsToSelect.join(", ")}
        FROM playlists 
        WHERE user_id = $1 
        AND deleted_at IS NULL
        ORDER BY updated_at DESC
      `

      playlists = await sql.unsafe(selectQuery, [user.id])
      console.log("🎵 [PLAYLISTS API] Raw playlists query result:", playlists.length)
    } catch (queryError) {
      console.error("🎵 [PLAYLISTS API] Error in playlists query:", queryError)

      // Fallback to basic query if advanced query fails
      try {
        playlists = await sql`
          SELECT id, name, description, status, loop_enabled, 
                 schedule_enabled, start_time, end_time, selected_days,
                 created_at, updated_at, user_id
          FROM playlists 
          WHERE user_id = ${user.id} 
          AND deleted_at IS NULL
          ORDER BY updated_at DESC
        `
        console.log("🎵 [PLAYLISTS API] Fallback query successful:", playlists.length)
      } catch (fallbackError) {
        console.error("🎵 [PLAYLISTS API] Fallback query also failed:", fallbackError)
        throw fallbackError
      }
    }

    console.log("🎵 [PLAYLISTS API] Found", playlists.length, "playlists for user", user.id)

    // Get item counts for each playlist and add default values for missing columns
    const playlistsWithCounts = await Promise.all(
      playlists.map(async (playlist) => {
        try {
          const itemCount = await sql`
            SELECT COUNT(*) as count 
            FROM playlist_items 
            WHERE playlist_id = ${playlist.id}
          `

          // Add default values for missing optional columns
          const playlistWithDefaults = {
            ...playlist,
            item_count: Number.parseInt(itemCount[0].count) || 0,
            device_count: 0, // TODO: Calculate actual device count
            total_duration: 0, // TODO: Calculate actual duration
            assigned_devices: [], // TODO: Get actual assigned devices
            // Default values for optional columns if they don't exist
            scale_image: playlist.scale_image || "fit",
            scale_video: playlist.scale_video || "fit",
            scale_document: playlist.scale_document || "fit",
            shuffle: playlist.shuffle !== undefined ? playlist.shuffle : false,
            default_transition: playlist.default_transition || "fade",
            transition_speed: playlist.transition_speed || "normal",
            auto_advance: playlist.auto_advance !== undefined ? playlist.auto_advance : true,
            background_color: playlist.background_color || "#000000",
            text_overlay: playlist.text_overlay !== undefined ? playlist.text_overlay : false,
          }

          return playlistWithDefaults
        } catch (error) {
          console.error("Error getting item count for playlist", playlist.id, ":", error)
          return {
            ...playlist,
            item_count: 0,
            device_count: 0,
            total_duration: 0,
            assigned_devices: [],
            // Default values
            scale_image: playlist.scale_image || "fit",
            scale_video: playlist.scale_video || "fit",
            scale_document: playlist.scale_document || "fit",
            shuffle: playlist.shuffle !== undefined ? playlist.shuffle : false,
            default_transition: playlist.default_transition || "fade",
            transition_speed: playlist.transition_speed || "normal",
            auto_advance: playlist.auto_advance !== undefined ? playlist.auto_advance : true,
            background_color: playlist.background_color || "#000000",
            text_overlay: playlist.text_overlay !== undefined ? playlist.text_overlay : false,
          }
        }
      }),
    )

    return NextResponse.json({
      success: true,
      playlists: playlistsWithCounts,
      total: playlistsWithCounts.length,
      debug: {
        availableColumns,
        columnsSelected: columnsToSelect,
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

    // Check which columns exist before inserting
    const columnCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'playlists'
    `
    const availableColumns = columnCheck.map((row) => row.column_name)

    // Build insert query based on available columns
    const baseInsert = {
      name,
      description: description || "",
      user_id: user.id,
      status: "draft",
      loop_enabled: true,
      schedule_enabled: false,
      created_at: new Date(),
      updated_at: new Date(),
    }

    // Add optional columns if they exist
    const optionalInsert = {}
    if (availableColumns.includes("scale_image")) optionalInsert.scale_image = "fit"
    if (availableColumns.includes("scale_video")) optionalInsert.scale_video = "fit"
    if (availableColumns.includes("scale_document")) optionalInsert.scale_document = "fit"
    if (availableColumns.includes("shuffle")) optionalInsert.shuffle = false
    if (availableColumns.includes("default_transition")) optionalInsert.default_transition = "fade"
    if (availableColumns.includes("transition_speed")) optionalInsert.transition_speed = "normal"
    if (availableColumns.includes("auto_advance")) optionalInsert.auto_advance = true
    if (availableColumns.includes("background_color")) optionalInsert.background_color = "#000000"
    if (availableColumns.includes("text_overlay")) optionalInsert.text_overlay = false

    const insertData = { ...baseInsert, ...optionalInsert }

    // Build dynamic insert query
    const columns = Object.keys(insertData)
    const values = Object.values(insertData)
    const placeholders = values.map((_, index) => `$${index + 1}`).join(", ")

    const insertQuery = `
      INSERT INTO playlists (${columns.join(", ")}) 
      VALUES (${placeholders}) 
      RETURNING *
    `

    const result = await sql.unsafe(insertQuery, values)
    const playlist = result[0]

    console.log("🎵 [PLAYLISTS API] Created playlist:", playlist.id)

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
