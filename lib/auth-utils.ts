import jwt from "jsonwebtoken"
import { neon } from "@neondatabase/serverless"
import type { NextRequest } from "next/server"

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

// MISSING EXPORTS - Adding these to fix deployment error
export function extractTokenFromRequest(request: NextRequest): string | null {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null
    }
    return authHeader.substring(7) // Remove 'Bearer ' prefix
  } catch (error) {
    console.error("🔐 [AUTH UTILS] Error extracting token from request:", error)
    return null
  }
}

export interface TokenInfo {
  valid: boolean
  exists: boolean
  length: number
  parts: number
  userId?: number
  email?: string
  expires?: number
  timeUntilExpiry?: string
  error?: string
}

export function getTokenInfo(token?: string): TokenInfo {
  try {
    if (!token) {
      return {
        valid: false,
        exists: false,
        length: 0,
        parts: 0,
        error: "No token provided",
      }
    }

    const parts = token.split(".")
    const info: TokenInfo = {
      valid: false,
      exists: true,
      length: token.length,
      parts: parts.length,
    }

    // Check if token has correct JWT format (3 parts)
    if (parts.length !== 3) {
      info.error = `Token format is invalid (${parts.length} parts instead of 3)`
      return info
    }

    // Try to decode the token
    try {
      const decoded = jwt.decode(token) as any
      if (decoded && typeof decoded === "object") {
        info.userId = decoded.userId
        info.email = decoded.email
        info.expires = decoded.exp

        // Check if token is expired
        const now = Math.floor(Date.now() / 1000)
        if (decoded.exp && decoded.exp < now) {
          info.error = "Token is expired"
          return info
        }

        // Calculate time until expiry
        if (decoded.exp) {
          const timeLeft = decoded.exp - now
          if (timeLeft > 0) {
            const hours = Math.floor(timeLeft / 3600)
            const minutes = Math.floor((timeLeft % 3600) / 60)
            info.timeUntilExpiry = `${hours}h ${minutes}m`
          }
        }

        info.valid = true
      } else {
        info.error = "Token payload is invalid"
      }
    } catch (decodeError) {
      info.error = `Token decode failed: ${decodeError instanceof Error ? decodeError.message : "Unknown error"}`
    }

    return info
  } catch (error) {
    return {
      valid: false,
      exists: false,
      length: 0,
      parts: 0,
      error: `Analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}
