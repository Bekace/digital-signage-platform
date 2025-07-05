import { cookies } from "next/headers"
import { getDb } from "./db"

export interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  company?: string
  plan: string
  isAdmin: boolean
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    console.log("🔐 [AUTH] Getting current user...")

    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session_token")

    console.log("🔐 [AUTH] Session token exists:", !!sessionToken?.value)

    if (!sessionToken?.value) {
      console.log("🔐 [AUTH] No session token found")
      return null
    }

    const sql = getDb()

    // Get user from session token
    const users = await sql`
      SELECT 
        id, 
        email, 
        first_name as "firstName", 
        last_name as "lastName", 
        company, 
        plan,
        is_admin as "isAdmin"
      FROM users 
      WHERE id = ${sessionToken.value}
    `

    console.log("🔐 [AUTH] Database query result:", users)

    if (users.length === 0) {
      console.log("🔐 [AUTH] No user found for session token")
      return null
    }

    const user = users[0]
    console.log("🔐 [AUTH] User found:", user.email, "ID:", user.id)

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      company: user.company,
      plan: user.plan || "free",
      isAdmin: user.isAdmin || false,
    }
  } catch (error) {
    console.error("🔐 [AUTH] Error getting current user:", error)
    return null
  }
}

export async function createSession(userId: number): Promise<string> {
  try {
    const cookieStore = await cookies()

    // Use user ID as session token (simple approach)
    const sessionToken = userId.toString()

    // Set cookie
    cookieStore.set("session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    console.log("🔐 [AUTH] Session created for user:", userId)
    return sessionToken
  } catch (error) {
    console.error("🔐 [AUTH] Error creating session:", error)
    throw error
  }
}

export async function destroySession(): Promise<void> {
  try {
    const cookieStore = await cookies()
    cookieStore.delete("session_token")
    console.log("🔐 [AUTH] Session destroyed")
  } catch (error) {
    console.error("🔐 [AUTH] Error destroying session:", error)
    throw error
  }
}
