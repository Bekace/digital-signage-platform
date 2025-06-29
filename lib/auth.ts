import jwt from "jsonwebtoken"
import type { NextRequest } from "next/server"

export interface AuthUser {
  userId: number
  email: string
  name: string
  isAdmin?: boolean
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      userId: user.userId,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin || false,
    },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" },
  )
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthUser
    return decoded
  } catch (error) {
    console.error("Token verification failed:", error)
    return null
  }
}

export function getAuthUser(request: NextRequest): AuthUser | null {
  const token = request.cookies.get("auth-token")?.value

  if (!token) {
    return null
  }

  return verifyToken(token)
}

export function requireAuth(request: NextRequest): AuthUser {
  const user = getAuthUser(request)

  if (!user) {
    throw new Error("Authentication required")
  }

  return user
}

export function requireAdmin(request: NextRequest): AuthUser {
  const user = requireAuth(request)

  if (!user.isAdmin) {
    throw new Error("Admin access required")
  }

  return user
}
