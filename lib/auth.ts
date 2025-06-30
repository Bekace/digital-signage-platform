import jwt from "jsonwebtoken"
import { cookies } from "next/headers"
import type { NextRequest } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  isAdmin: boolean
}

export interface TokenPayload {
  userId: number
  email: string
  iat?: number
  exp?: number
}

export function generateToken(user: User): string {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
  }

  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "7d" })
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload
    return decoded
  } catch (error) {
    console.error("Token verification failed:", error)
    return null
  }
}

export async function getCurrentUser(request?: NextRequest): Promise<User | null> {
  try {
    let token: string | null = null

    if (request) {
      // For API routes - check Authorization header first
      const authHeader = request.headers.get("authorization")
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7)
        console.log("🔐 [AUTH] Found Bearer token in Authorization header")
      } else {
        // Fallback to cookies for API routes
        const cookieStore = request.cookies
        token = cookieStore.get("auth-token")?.value || null
        console.log("🔐 [AUTH] Found token in cookies (API route)")
      }
    } else {
      // For server components - use cookies
      const cookieStore = cookies()
      token = cookieStore.get("auth-token")?.value || null
      console.log("🔐 [AUTH] Found token in cookies (server component)")
    }

    if (!token) {
      console.log("❌ [AUTH] No token found")
      return null
    }

    console.log("🔐 [AUTH] Verifying token...")
    const decoded = verifyToken(token)
    if (!decoded) {
      console.log("❌ [AUTH] Token verification failed")
      return null
    }

    console.log(`🔐 [AUTH] Token verified for user ${decoded.userId}`)

    // Get user from database
    const users = await sql`
      SELECT id, email, first_name, last_name, is_admin
      FROM users 
      WHERE id = ${decoded.userId}
    `

    if (users.length === 0) {
      console.log(`❌ [AUTH] User ${decoded.userId} not found in database`)
      return null
    }

    const user = users[0]
    const currentUser: User = {
      id: user.id,
      email: user.email,
      firstName: user.first_name || "",
      lastName: user.last_name || "",
      isAdmin: user.is_admin || false,
    }

    console.log(`✅ [AUTH] Current user:`, { id: currentUser.id, email: currentUser.email })
    return currentUser
  } catch (error) {
    console.error("❌ [AUTH] Error getting current user:", error)
    return null
  }
}

export async function requireAuth(request?: NextRequest): Promise<User> {
  const user = await getCurrentUser(request)
  if (!user) {
    throw new Error("Authentication required")
  }
  return user
}

export async function requireAdmin(request?: NextRequest): Promise<User> {
  const user = await requireAuth(request)
  if (!user.isAdmin) {
    throw new Error("Admin access required")
  }
  return user
}
