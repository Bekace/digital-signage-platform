import jwt from "jsonwebtoken"
import type { NextRequest } from "next/server"
import type { Request } from "node-fetch"

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
 * Get token from multiple possible locations
 */
function getStoredToken(): string | null {
  if (typeof window === "undefined") return null

  console.log("🔐 [AUTH UTILS] Checking for stored token...")

  // Try multiple possible storage locations
  const possibleKeys = ["auth-token", "token", "authToken"]

  for (const key of possibleKeys) {
    const token = localStorage.getItem(key)
    if (token) {
      console.log(`🔐 [AUTH UTILS] Found token in localStorage["${key}"]`)
      return token
    }
  }

  // Try to get from cookies as fallback
  try {
    const cookies = document.cookie.split(";")
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split("=")
      if (name === "auth-token" && value) {
        console.log("🔐 [AUTH UTILS] Found token in cookies")
        return decodeURIComponent(value)
      }
    }
  } catch (error) {
    console.log("🔐 [AUTH UTILS] Could not read cookies:", error)
  }

  console.log("🔐 [AUTH UTILS] No token found in any location")
  return null
}

/**
 * Get authentication headers for API requests
 * Validates token before returning headers
 */
export function getAuthHeaders(): AuthHeaders | null {
  try {
    if (typeof window === "undefined") {
      console.log("🔐 [AUTH UTILS] Server-side context, no token available")
      return null
    }

    const token = getStoredToken()
    if (!token) {
      console.log("🔐 [AUTH UTILS] No token found in any storage location")
      return null
    }

    // Validate token format and expiration
    const tokenInfo = getTokenInfo(token)
    if (!tokenInfo.valid) {
      console.log("🔐 [AUTH UTILS] Invalid token detected:", tokenInfo.error)
      clearAuthToken()
      return null
    }

    console.log("🔐 [AUTH UTILS] Valid token found, creating auth headers")
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }
  } catch (error) {
    console.error("🔐 [AUTH UTILS] Error getting auth headers:", error)
    clearAuthToken()
    return null
  }
}

/**
 * Check if the current token is valid
 */
export function isTokenValid(): boolean {
  try {
    if (typeof window === "undefined") {
      console.log("🔐 [AUTH UTILS] Server-side context, cannot validate token")
      return false
    }

    const token = getStoredToken()
    if (!token) {
      console.log("🔐 [AUTH UTILS] No token found for validation")
      return false
    }

    const tokenInfo = getTokenInfo(token)
    console.log("🔐 [AUTH UTILS] Token validation result:", tokenInfo.valid, tokenInfo.error || "OK")
    return tokenInfo.valid
  } catch (error) {
    console.error("🔐 [AUTH UTILS] Error checking token validity:", error)
    return false
  }
}

/**
 * Clear invalid authentication token from all possible locations
 */
export function clearAuthToken(): void {
  try {
    if (typeof window !== "undefined") {
      // Clear from all possible localStorage keys
      const possibleKeys = ["auth-token", "token", "authToken"]
      for (const key of possibleKeys) {
        localStorage.removeItem(key)
      }

      // Clear from cookies
      document.cookie = "auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"

      console.log("🔐 [AUTH UTILS] Token cleared from all storage locations")
    }
  } catch (error) {
    console.error("🔐 [AUTH UTILS] Error clearing token:", error)
  }
}

/**
 * Get detailed information about a token
 */
export function getTokenInfo(token?: string): TokenInfo {
  try {
    const actualToken = token || getStoredToken()

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
export function extractTokenFromRequest(request: NextRequest): string | null {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null
    }
    return authHeader.substring(7) // Remove 'Bearer ' prefix
  } catch (error) {
    console.error("🔐 [AUTH UTILS] Error extracting token from request:", error)
    return null
  }
}

/**
 * Verify token using the same logic as the server
 */
export function verifyToken(token: string): any {
  try {
    if (!process.env.JWT_SECRET) {
      console.error("🔐 [AUTH UTILS] JWT_SECRET not available in client")
      return null
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    return decoded
  } catch (error) {
    console.error("🔐 [AUTH UTILS] Token verification failed:", error)
    return null
  }
}

/**
 * Get token from request headers or cookies (client-side)
 */
export function getTokenFromRequest(request: Request): string | null {
  // Try Authorization header first
  const authHeader = request.headers.get("authorization")
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7)
  }

  // Try cookies as fallback
  const cookieHeader = request.headers.get("cookie")
  if (cookieHeader) {
    const cookies = cookieHeader.split(";").reduce(
      (acc, cookie) => {
        const [key, value] = cookie.trim().split("=")
        acc[key] = value
        return acc
      },
      {} as Record<string, string>,
    )
    return cookies["auth-token"] || null
  }

  return null
}

/**
 * Get token from localStorage (client-side)
 */
export function getTokenFromLocalStorage(): string | null {
  if (typeof window === "undefined") return null

  // Try multiple possible keys
  const keys = ["auth-token", "token", "authToken"]
  for (const key of keys) {
    const token = localStorage.getItem(key)
    if (token) return token
  }

  return null
}

/**
 * Get token from cookies (client-side)
 */
export function getTokenFromCookies(): string | null {
  if (typeof document === "undefined") return null

  const cookies = document.cookie.split(";").reduce(
    (acc, cookie) => {
      const [key, value] = cookie.trim().split("=")
      acc[key] = value
      return acc
    },
    {} as Record<string, string>,
  )

  return cookies["auth-token"] || null
}

/**
 * Get all tokens from localStorage and cookies (client-side)
 */
export function getAllTokens(): { localStorage: string | null; cookies: string | null } {
  return {
    localStorage: getTokenFromLocalStorage(),
    cookies: getTokenFromCookies(),
  }
}
