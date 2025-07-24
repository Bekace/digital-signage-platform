import jwt from "jsonwebtoken"
import { cookies } from "next/headers"
import type { NextRequest } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export interface DecodedToken {
  userId: number
  email: string
  iat?: number
  exp?: number
}

export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  company?: string
  plan: string
  created_at: string
  is_admin?: boolean
  admin_role?: string
  admin_permissions?: any
}

export function verifyToken(token: string): DecodedToken | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken
    return decoded
  } catch (error) {
    console.error("🔐 [AUTH] Token verification failed:", error)
    return null
  }
}

export function generateToken(payload: { userId: number; email: string }): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "7d" })
}

export async function getCurrentUser(request?: NextRequest): Promise<User | null> {
  try {
    let token: string | null = null

    if (request) {
      // For API routes - check Authorization header first
      const authHeader = request.headers.get("authorization")
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7)
      } else {
        // Fallback to cookies for API routes
        const cookieStore = request.cookies
        token = cookieStore.get("auth-token")?.value || null
      }
    } else {
      // For server components - use cookies
      const cookieStore = await cookies()
      token = cookieStore.get("auth-token")?.value || null
    }

    if (!token) {
      return null
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return null
    }

    // Get user from database WITH admin information - NO is_admin column reference
    const users = await sql`
      SELECT 
        u.id, 
        u.email, 
        u.first_name, 
        u.last_name, 
        u.company, 
        u.plan, 
        u.created_at,
        au.role as admin_role,
        au.permissions as admin_permissions
      FROM users u
      LEFT JOIN admin_users au ON u.id = au.user_id
      WHERE u.id = ${decoded.userId}
      LIMIT 1
    `

    if (users.length === 0) {
      return null
    }

    const user = users[0]

    // Determine admin status from admin_users table only
    const isAdmin = user.admin_role !== null && user.admin_role !== undefined

    return {
      ...user,
      is_admin: isAdmin,
    } as User
  } catch (error) {
    console.error("❌ [AUTH] Error in getCurrentUser:", error)
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
