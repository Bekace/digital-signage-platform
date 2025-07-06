import jwt from "jsonwebtoken"
import { cookies } from "next/headers"
import { sql } from "@/lib/db"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export interface User {
  id: number
  email: string
  name: string
  company?: string
  role?: string
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    console.log("🔐 [AUTH] Getting current user...")

    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    console.log("🔐 [AUTH] Token found:", !!token)

    if (!token) {
      console.log("🔐 [AUTH] No token found")
      return null
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number }
    console.log("🔐 [AUTH] Token decoded, userId:", decoded.userId)

    const result = await sql`
      SELECT id, email, name, company, role 
      FROM users 
      WHERE id = ${decoded.userId}
    `

    console.log("🔐 [AUTH] Database query result:", result)

    if (result.length === 0) {
      console.log("🔐 [AUTH] User not found in database")
      return null
    }

    const user = result[0] as User
    console.log("🔐 [AUTH] User found:", { id: user.id, email: user.email })

    return user
  } catch (error) {
    console.error("🔐 [AUTH] Error getting current user:", error)
    return null
  }
}

export async function createAuthToken(userId: number): Promise<string> {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" })
}

export async function verifyAuthToken(token: string): Promise<number | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number }
    return decoded.userId
  } catch (error) {
    console.error("🔐 [AUTH] Token verification failed:", error)
    return null
  }
}
