import jwt from "jsonwebtoken"
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

export function extractTokenFromRequest(request: NextRequest): string | null {
  // Check Authorization header first
  const authHeader = request.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7)
  }

  // Fallback to cookies
  const cookieToken = request.cookies.get("auth-token")?.value
  return cookieToken || null
}

export function getTokenInfo(token: string): DecodedToken | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken
    return decoded
  } catch (error) {
    console.error("🔐 [AUTH-UTILS] Token verification failed:", error)
    return null
  }
}

export async function verifyAuth(request: NextRequest): Promise<User | null> {
  try {
    const token = extractTokenFromRequest(request)
    if (!token) {
      console.log("🔍 [AUTH-UTILS] No token found")
      return null
    }

    const decoded = getTokenInfo(token)
    if (!decoded) {
      console.log("🔍 [AUTH-UTILS] Token verification failed")
      return null
    }

    // Get user from database WITH admin information
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
      console.log("🔍 [AUTH-UTILS] User not found in database")
      return null
    }

    const user = users[0]
    const isAdmin = user.admin_role !== null && user.admin_role !== undefined

    return {
      ...user,
      is_admin: isAdmin,
    } as User
  } catch (error) {
    console.error("❌ [AUTH-UTILS] Error in verifyAuth:", error)
    return null
  }
}

export function getAuthHeaders(token?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

export function generateToken(payload: { userId: number; email: string }): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "7d" })
}

export async function requireAdminAuth(request: NextRequest): Promise<User> {
  const user = await verifyAuth(request)
  if (!user) {
    throw new Error("Authentication required")
  }
  if (!user.is_admin) {
    throw new Error("Admin access required")
  }
  return user
}
