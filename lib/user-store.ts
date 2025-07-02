// Simple in-memory user store for demo purposes
// In production, this would be replaced with a proper database

interface User {
  id: number
  email: string
  name: string
  password: string
  company?: string
  role?: string
  createdAt: Date
}

interface Session {
  token: string
  userId: number
  expiresAt: Date
}

interface Device {
  id: string
  name: string
  code: string
  status: "online" | "offline"
  lastSeen: string
  userId: number
  registeredAt: string
}

// In-memory stores
const sessions: Map<string, Session> = new Map()
const devices: Map<string, Device> = new Map()
const deviceCodes: Map<string, { userId: number; expiresAt: Date }> = new Map()

class UserStore {
  private users: User[] = []
  private nextId = 1

  async createUser(userData: Omit<User, "id" | "createdAt">): Promise<User> {
    const user: User = {
      ...userData,
      id: this.nextId++,
      createdAt: new Date(),
    }
    this.users.push(user)
    return user
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.users.find((user) => user.email === email) || null
  }

  async findUserById(id: number): Promise<User | null> {
    return this.users.find((user) => user.id === id) || null
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | null> {
    const userIndex = this.users.findIndex((user) => user.id === id)
    if (userIndex === -1) return null

    this.users[userIndex] = { ...this.users[userIndex], ...updates }
    return this.users[userIndex]
  }

  async getAllUsers(): Promise<User[]> {
    return [...this.users]
  }

  static authenticateUser(
    email: string,
    password: string,
  ): {
    success: boolean
    message: string
    user?: Omit<User, "password">
    token?: string
  } {
    const token = `token-${Date.now()}-${Math.random().toString(36).substr(2, 16)}`
    const session: Session = {
      token,
      userId: 0, // Placeholder, will be set after user is found
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    }

    sessions.set(token, session)

    // Return user without password
    const userWithoutPassword = { email, name: "", company: "", role: "", createdAt: new Date() }
    return {
      success: true,
      message: "Login successful",
      user: userWithoutPassword,
      token,
    }
  }

  static validateToken(token: string): {
    valid: boolean
    user?: Omit<User, "password">
  } {
    const session = sessions.get(token)

    if (!session || session.expiresAt < new Date()) {
      if (session) sessions.delete(token) // Clean up expired session
      return { valid: false }
    }

    const userWithoutPassword = { email: "", name: "", company: "", role: "", createdAt: new Date() }
    return { valid: true, user: userWithoutPassword }
  }
}

export const userStore = new UserStore()

// Device management
export function generateDeviceCode(userId: number): string {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  deviceCodes.set(code, { userId, expiresAt })

  // Clean up expired codes
  setTimeout(
    () => {
      deviceCodes.delete(code)
    },
    10 * 60 * 1000,
  )

  return code
}

export function validateDeviceCode(code: string): { userId: number } | null {
  const codeData = deviceCodes.get(code)
  if (!codeData || codeData.expiresAt < new Date()) {
    deviceCodes.delete(code)
    return null
  }
  return { userId: codeData.userId }
}

export function registerDevice(code: string, deviceName: string): Device | null {
  const codeData = validateDeviceCode(code)
  if (!codeData) return null

  const device: Device = {
    id: Math.random().toString(36).substring(2, 15),
    name: deviceName,
    code,
    status: "online",
    lastSeen: new Date().toISOString(),
    userId: codeData.userId,
    registeredAt: new Date().toISOString(),
  }

  devices.set(device.id, device)
  deviceCodes.delete(code) // Remove used code

  return device
}

export function getDevicesByUserId(userId: number): Device[] {
  return Array.from(devices.values()).filter((device) => device.userId === userId)
}

export function getDeviceById(id: string): Device | undefined {
  return devices.get(id)
}

export function updateDeviceHeartbeat(deviceId: string): boolean {
  const device = devices.get(deviceId)
  if (!device) return false

  device.status = "online"
  device.lastSeen = new Date().toISOString()
  devices.set(deviceId, device)

  return true
}
