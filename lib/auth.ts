import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { getDb } from "./db"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  company: string
  role: string
  plan: string
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    console.log("🔐 [AUTH] Getting current user...")

    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    console.log("🔐 [AUTH] Token exists:", !!token)

    if (!token) {
      console.log("🔐 [AUTH] No auth token found")
      return null
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    console.log("🔐 [AUTH] Token decoded for user ID:", decoded.userId)

    const sql = getDb()
    const users = await sql`
      SELECT id, email, first_name, last_name, company, role, plan
      FROM users 
      WHERE id = ${decoded.userId}
      LIMIT 1
    `

    if (users.length === 0) {
      console.log("🔐 [AUTH] User not found in database")
      return null
    }

    const user = users[0]
    console.log("🔐 [AUTH] User found:", user.email, "ID:", user.id)
    return user
  } catch (error) {
    console.error("🔐 [AUTH] Auth error:", error)
    return null
  }
}

export function generateToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" })
}

export function verifyToken(token: string): any {
  return jwt.verify(token, JWT_SECRET)
}
