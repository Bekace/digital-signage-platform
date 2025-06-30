import jwt from "jsonwebtoken"
import type { NextRequest } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export interface User {
  id: number
  email: string
  name: string
  plan: string
}

export async function getCurrentUser(request: NextRequest): Promise<User | null> {
  try {
    console.log("🔐 [AUTH] ===== STARTING getCurrentUser =====")

    // Check for JWT_SECRET
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      console.log("❌ [AUTH] JWT_SECRET not found in environment")
      return null
    }
    console.log("✅ [AUTH] JWT_SECRET exists, length:", jwtSecret.length)

    // Try to get token from Authorization header first
    let token = request.headers.get("authorization")?.replace("Bearer ", "")
    console.log("🔐 [AUTH] Token from Authorization header:", !!token)

    // If no Authorization header, try cookies
    if (!token) {
      const cookies = request.headers.get("cookie")
      console.log("🔐 [AUTH] Cookies header:", !!cookies)

      if (cookies) {
        const authTokenMatch = cookies.match(/auth-token=([^;]+)/)
        if (authTokenMatch) {
          token = authTokenMatch[1]
          console.log("✅ [AUTH] Token found in cookies")
        }
      }
    }

    if (!token) {
      console.log("❌ [AUTH] No token found in headers or cookies")
      return null
    }

    console.log("🔐 [AUTH] Token preview:", `${token.substring(0, 20)}...${token.substring(token.length - 10)}`)

    // Verify JWT token
    console.log("🔐 [AUTH] Verifying JWT token...")
    const decoded = jwt.verify(token, jwtSecret) as any
    console.log("✅ [AUTH] JWT verified successfully")
    console.log("🔐 [AUTH] Decoded payload:", {
      userId: decoded.userId,
      email: decoded.email,
      iat: decoded.iat,
      exp: decoded.exp,
    })

    // Get user from database
    console.log("🔐 [AUTH] Fetching user from database...")
    const users = await sql`
      SELECT u.id, u.email, u.name, up.plan_type as plan
      FROM users u
      LEFT JOIN user_plans up ON u.id = up.user_id
      WHERE u.id = ${decoded.userId}
      LIMIT 1
    `

    if (users.length === 0) {
      console.log("❌ [AUTH] User not found in database")
      return null
    }

    const user = users[0]
    console.log("✅ [AUTH] User found:", {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan || "free",
    })

    console.log("🔐 [AUTH] ===== getCurrentUser COMPLETE =====")

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan || "free",
    }
  } catch (error) {
    console.error("❌ [AUTH] Error in getCurrentUser:", error)
    if (error instanceof jwt.JsonWebTokenError) {
      console.error("❌ [AUTH] JWT Error:", error.message)
    }
    return null
  }
}
