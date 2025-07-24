import jwt from "jsonwebtoken"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

interface AuthResult {
  success: boolean
  userId?: number
  email?: string
  isAdmin?: boolean
  adminRole?: string
  error?: string
}

export async function verifyAuth(request: Request): Promise<AuthResult> {
  try {
    console.log("🔐 [AUTH UTILS] Starting auth verification...")

    // Get token from Authorization header or cookie
    const authHeader = request.headers.get("authorization")
    const cookieHeader = request.headers.get("cookie")

    let token: string | null = null

    // Try Authorization header first
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7)
      console.log("🔐 [AUTH UTILS] Token found in Authorization header")
    }
    // Try cookie as fallback
    else if (cookieHeader) {
      const cookies = cookieHeader.split(";").reduce(
        (acc, cookie) => {
          const [key, value] = cookie.trim().split("=")
          acc[key] = value
          return acc
        },
        {} as Record<string, string>,
      )

      token = cookies["auth-token"]
      if (token) {
        console.log("🔐 [AUTH UTILS] Token found in cookie")
      }
    }

    if (!token) {
      console.log("🔐 [AUTH UTILS] No token found")
      return { success: false, error: "No token provided" }
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number; email: string }
    console.log("🔐 [AUTH UTILS] Token verified for user:", decoded.userId)

    // Check if user exists and get admin status
    const userResult = await sql`
      SELECT 
        u.id,
        u.email,
        CASE 
          WHEN au.user_id IS NOT NULL THEN true 
          ELSE false 
        END as is_admin,
        au.role as admin_role
      FROM users u
      LEFT JOIN admin_users au ON u.id = au.user_id
      WHERE u.id = ${decoded.userId}
      LIMIT 1
    `

    if (userResult.length === 0) {
      console.log("🔐 [AUTH UTILS] User not found in database:", decoded.userId)
      return { success: false, error: "User not found" }
    }

    const user = userResult[0]
    const isAdmin = user.is_admin || false
    const adminRole = user.admin_role || null

    console.log("🔐 [AUTH UTILS] Auth successful:", {
      userId: user.id,
      email: user.email,
      isAdmin,
      adminRole,
    })

    return {
      success: true,
      userId: user.id,
      email: user.email,
      isAdmin,
      adminRole,
    }
  } catch (error) {
    console.error("❌ [AUTH UTILS] Auth verification failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Authentication failed",
    }
  }
}

export function getTokenFromRequest(request: Request): string | null {
  // Try Authorization header first
  const authHeader = request.headers.get("authorization")
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7)
  }

  // Try cookie as fallback
  const cookieHeader = request.headers.get("cookie")
  if (cookieHeader) {
    const cookies = cookieHeader.split(";").reduce(
      (acc, cookie) => {
        const [key, value] = cookie.trim().split("=")
        acc[key] = value
        return acc
      },
      {} as Record<string, string>,
    )

    return cookies["auth-token"] || null
  }

  return null
}
