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

    // Check if playlists table exists
    let tableExists = false
    try {
      const tableCheck = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'playlists'
        )
      `
      tableExists = tableCheck[0]?.exists || false
      console.log("🎵 [PLAYLISTS API] Playlists table exists:", tableExists)
    } catch (error) {
      console.error("🎵 [PLAYLISTS API] Error checking table existence:", error)
    }

    if (!tableExists) {
      console.log("🎵 [PLAYLISTS API] Playlists table does not exist")
      return NextResponse.json({
        success: true,
        playlists: [],
        total: 0,
        message: "Playlists table does not exist yet",
        debug: {
          tableExists: false,
          userId: user.id,
          timestamp: new Date().toISOString(),
        },
      })
    }

    // Get available columns
    let availableColumns = []
    try {
      const columnCheck = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'playlists'
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `

      // Ensure columnCheck is an array and extract column names safely
      if (Array.isArray(columnCheck)) {
        availableColumns = columnCheck.map((row) => row?.column_name).filter(Boolean)
      } else {
        console.warn("🎵 [PLAYLISTS API] Column check returned non-array:", typeof columnCheck)
        availableColumns = []
      }

      console.log("🎵 [PLAYLISTS API] Available columns:", availableColumns)
    } catch (columnError) {
      console.error("🎵 [PLAYLISTS API] Error checking columns:", columnError)
      availableColumns = []
    }

    // Define required and optional columns
    const requiredColumns = ["id", "name", "user_id", "created_at", "updated_at"]
    const optionalColumns = [
      "description",
      "status",
      "loop_enabled",
      "schedule_enabled",
      "start_time",
      "end_time",
      "selected_days",
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

    // Check if we have minimum required columns
    const hasRequiredColumns = requiredColumns.every((col) => availableColumns.includes(col))
    if (!hasRequiredColumns) {
      const missingRequired = requiredColumns.filter((col) => !availableColumns.includes(col))
      console.error("🎵 [PLAYLISTS API] Missing required columns:", missingRequired)

      return NextResponse.json(
        {
          success: false,
          error: "Playlists table is missing required columns",
          details: `Missing columns: ${missingRequired.join(", ")}`,
          debug: {
            availableColumns,
            missingRequired,
            userId: user.id,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 500 },
      )
    }

    // Build column list for SELECT query
    const columnsToSelect = [...requiredColumns, ...optionalColumns.filter((col) => availableColumns.includes(col))]

    console.log("🎵 [PLAYLISTS API] Selecting columns:", columnsToSelect)

    // Get playlists for the user
    let playlists = []
    try {
      const selectQuery = `
        SELECT ${columnsToSelect.join(", ")}
        FROM playlists 
        WHERE user_id = $1 
        ${availableColumns.includes("deleted_at") ? "AND (deleted_at IS NULL OR deleted_at = '')" : ""}
        ORDER BY ${availableColumns.includes("updated_at") ? "updated_at" : "created_at"} DESC
      `

      const queryResult = await sql.unsafe(selectQuery, [user.id])

      // Ensure queryResult is an array
      if (Array.isArray(queryResult)) {
        playlists = queryResult
      } else {
        console.warn("🎵 [PLAYLISTS API] Query result is not an array:", typeof queryResult)
        playlists = []
      }

      console.log("🎵 [PLAYLISTS API] Found", playlists.length, "playlists for user", user.id)
    } catch (queryError) {
      console.error("🎵 [PLAYLISTS API] Error in playlists query:", queryError)

      // Try a simpler fallback query
      try {
        const fallbackQuery = `SELECT id, name, user_id, created_at FROM playlists WHERE user_id = $1`
        const fallbackResult = await sql.unsafe(fallbackQuery, [user.id])
        playlists = Array.isArray(fallbackResult) ? fallbackResult : []
        console.log("🎵 [PLAYLISTS API] Fallback query successful:", playlists.length)
      } catch (fallbackError) {
        console.error("🎵 [PLAYLISTS API] Fallback query also failed:", fallbackError)
        return NextResponse.json(
          {
            success: false,
            error: "Failed to fetch playlists",
            details: fallbackError.message,
            debug: {
              originalError: queryError.message,
              fallbackError: fallbackError.message,
              userId: user.id,
              timestamp: new Date().toISOString(),
            },
          },
          { status: 500 },
        )
      }
    }

    // Process playlists and add item counts
    const processedPlaylists = []

    for (const playlist of playlists) {
      try {
        // Get item count if playlist_items table exists
        let itemCount = 0
        try {
          const itemCountResult = await sql`
            SELECT COUNT(*) as count 
            FROM playlist_items 
            WHERE playlist_id = ${playlist.id}
          `
          itemCount = Number.parseInt(itemCountResult[0]?.count) || 0
        } catch (itemError) {
          console.warn("🎵 [PLAYLISTS API] Could not get item count for playlist", playlist.id, ":", itemError.message)
          itemCount = 0
        }

        // Create processed playlist with defaults for missing columns
        const processedPlaylist = {
          id: playlist.id,
          name: playlist.name || "Untitled Playlist",
          description: playlist.description || "",
          status: playlist.status || "draft",
          loop_enabled: playlist.loop_enabled !== undefined ? playlist.loop_enabled : true,
          schedule_enabled: playlist.schedule_enabled !== undefined ? playlist.schedule_enabled : false,
          start_time: playlist.start_time || null,
          end_time: playlist.end_time || null,
          selected_days: playlist.selected_days || null,
          scale_image: playlist.scale_image || "fit",
          scale_video: playlist.scale_video || "fit",
          scale_document: playlist.scale_document || "fit",
          shuffle: playlist.shuffle !== undefined ? playlist.shuffle : false,
          default_transition: playlist.default_transition || "fade",
          transition_speed: playlist.transition_speed || "normal",
          auto_advance: playlist.auto_advance !== undefined ? playlist.auto_advance : true,
          background_color: playlist.background_color || "#000000",
          text_overlay: playlist.text_overlay !== undefined ? playlist.text_overlay : false,
          created_at: playlist.created_at,
          updated_at: playlist.updated_at || playlist.created_at,
          user_id: playlist.user_id,
          item_count: itemCount,
          device_count: 0, // TODO: Calculate actual device count
          total_duration: 0, // TODO: Calculate actual duration
          assigned_devices: [], // TODO: Get actual assigned devices
        }

        processedPlaylists.push(processedPlaylist)
      } catch (processingError) {
        console.error("🎵 [PLAYLISTS API] Error processing playlist", playlist.id, ":", processingError)
        // Still add the playlist with minimal data
        processedPlaylists.push({
          id: playlist.id,
          name: playlist.name || "Untitled Playlist",
          description: "",
          status: "draft",
          loop_enabled: true,
          schedule_enabled: false,
          start_time: null,
          end_time: null,
          selected_days: null,
          scale_image: "fit",
          scale_video: "fit",
          scale_document: "fit",
          shuffle: false,
          default_transition: "fade",
          transition_speed: "normal",
          auto_advance: true,
          background_color: "#000000",
          text_overlay: false,
          created_at: playlist.created_at,
          updated_at: playlist.updated_at || playlist.created_at,
          user_id: playlist.user_id,
          item_count: 0,
          device_count: 0,
          total_duration: 0,
          assigned_devices: [],
        })
      }
    }

    return NextResponse.json({
      success: true,
      playlists: processedPlaylists,
      total: processedPlaylists.length,
      debug: {
        tableExists,
        availableColumns,
        columnsSelected: columnsToSelect,
        userId: user.id,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("🎵 [PLAYLISTS API] Unexpected error:", error)
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

    // Check if playlists table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'playlists'
      )
    `

    if (!tableCheck[0]?.exists) {
      return NextResponse.json(
        {
          error: "Playlists table does not exist",
          details: "Database schema needs to be initialized",
        },
        { status: 500 },
      )
    }

    // Get available columns
    const columnCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'playlists'
      AND table_schema = 'public'
    `

    const availableColumns = Array.isArray(columnCheck)
      ? columnCheck.map((row) => row?.column_name).filter(Boolean)
      : []

    // Build insert data based on available columns
    const insertData = {
      name,
      user_id: user.id,
      created_at: new Date(),
      updated_at: new Date(),
    }

    // Add optional columns if they exist
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
    const playlist = Array.isArray(result) ? result[0] : result

    console.log("🎵 [PLAYLISTS API] Created playlist:", playlist?.id)

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
