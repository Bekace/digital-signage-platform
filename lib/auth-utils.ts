import jwt from "jsonwebtoken"
import type { NextRequest } from "next/server"
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { type UserInfo } from './auth'

export interface AuthHeaders {
  Authorization: string
  "Content-Type": string
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

/**
 * Get authentication headers for API requests
 * Validates token before returning headers
 */
export async function getAuthHeaders(): Promise<AuthHeaders | null> {
  try {
    if (typeof window === "undefined") {
      console.log("🔐 [AUTH] Server-side context, no token available")
      return null
    }

    const token = localStorage.getItem("auth-token")
    if (!token) {
      console.log("🔐 [AUTH] No token found in localStorage")
      return null
    }

    // Validate token format and expiration
    const userInfo = await verifyToken(token)
    if (!userInfo) {
      console.log("🔐 [AUTH] Invalid token detected")
      clearAuthToken()
      return null
    }

    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }
  } catch (error) {
    console.error("🔐 [AUTH] Error getting auth headers:", error)
    clearAuthToken()
    return null
  }
}

/**
 * Check if the current token is valid
 */
export async function isTokenValid(): Promise<boolean> {
  try {
    if (typeof window === "undefined") return false

    const token = localStorage.getItem("token")
    if (!token) return false

    const userInfo = await verifyToken(token)
    return !!userInfo
  } catch (error) {
    console.error("🔐 [AUTH] Error checking token validity:", error)
    return false
  }
}

/**
 * Clear invalid authentication token
 */
export function clearAuthToken(): void {
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token")
      console.log("🔐 [AUTH] Token cleared from localStorage")
    }
  } catch (error) {
    console.error("🔐 [AUTH] Error clearing token:", error)
  }
}

/**
 * Get detailed information about a token
 */
export function getTokenInfo(token?: string): TokenInfo {
  try {
    const actualToken = token || (typeof window !== "undefined" ? localStorage.getItem("token") : null)

    if (!actualToken) {
      return {
        valid: false,
        exists: false,
        length: 0,
        parts: 0,
        error: "No token provided",
      }
    }

    const parts = actualToken.split(".")
    const info: TokenInfo = {
      valid: false,
      exists: true,
      length: actualToken.length,
      parts: parts.length,
    }

    // Check if token has correct JWT format (3 parts)
    if (parts.length !== 3) {
      info.error = `Token format is invalid (${parts.length} parts instead of 3)`
      return info
    }

    // Try to decode the token
    try {
      const decoded = jwt.decode(actualToken) as any
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

/**
 * Redirect to login page (client-side only)
 */
export function redirectToLogin(): void {
  if (typeof window !== "undefined") {
    clearAuthToken()
    window.location.href = "/login"
  }
}

/**
 * Extract token from request headers (server-side)
 */
export function extractTokenFromRequestServer(request: NextRequest): string | null {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null
    }
    return authHeader.substring(7) // Remove 'Bearer ' prefix
  } catch (error) {
    console.error("🔐 [AUTH] Error extracting token from request:", error)
    return null
  }
}

export const extractTokenFromRequestClient = () => {
  const cookieStore = cookies()
  const token = cookieStore.get('token')?.value
  return token
}

export async function verifyToken(token: string | undefined): Promise<UserInfo | null> {
  if (!token) {
    console.log('No token provided')
    return null
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    )

    // Type guard to ensure payload has the necessary properties
    if (typeof payload?.id === 'number' && typeof payload?.email === 'string') {
      return {
        id: payload.id,
        email: payload.email,
        firstName: (payload.firstName as string) || '',
        lastName: (payload.lastName as string) || '',
        companyName: (payload.companyName as string) || '',
        isAdmin: !!payload.isAdmin,
      }
    } else {
      console.error('Invalid payload:', payload)
      return null
    }
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}
