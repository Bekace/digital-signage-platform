import jwt from "jsonwebtoken"
import { cookies } from "next/headers"

export function getTokenInfo(token?: string) {
  if (!token) {
    return {
      valid: false,
      error: "No token provided",
    }
  }

  try {
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      return {
        valid: false,
        error: "JWT_SECRET not configured",
      }
    }

    const decoded = jwt.verify(token, jwtSecret) as any
    return {
      valid: true,
      decoded: {
        userId: decoded.userId,
        email: decoded.email,
        iat: decoded.iat,
        exp: decoded.exp,
        isExpired: Date.now() / 1000 > decoded.exp,
      },
    }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Token verification failed",
    }
  }
}

export async function getCurrentUser(request?: Request) {
  try {
    let token: string | undefined

    if (request) {
      // Extract from request headers
      token = request.headers.get("authorization")?.replace("Bearer ", "")
    } else {
      // Extract from cookies (server-side)
      const cookieStore = cookies()
      token = cookieStore.get("auth-token")?.value
    }

    if (!token) {
      return null
    }

    const tokenInfo = getTokenInfo(token)
    if (!tokenInfo.valid || !tokenInfo.decoded) {
      return null
    }

    return {
      id: tokenInfo.decoded.userId,
      email: tokenInfo.decoded.email,
    }
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}
