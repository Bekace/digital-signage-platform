"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Monitor, LayoutDashboard, ImageIcon, Play, Settings, Menu, LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useToast } from "@/hooks/use-toast"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Screens", href: "/dashboard/screens", icon: Monitor },
  { name: "Media", href: "/dashboard/media", icon: ImageIcon },
  { name: "Playlists", href: "/dashboard/playlists", icon: Play },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  company?: string
  plan: string
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch user profile on mount
  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true)
      console.log("Fetching user profile...")

      const response = await fetch("/api/user/profile", {
        method: "GET",
        credentials: "include", // Include cookies
      })

      console.log("Profile response status:", response.status)

      const data = await response.json()
      console.log("Profile response data:", data)

      if (data.success && data.user) {
        setUser(data.user)
        console.log("User profile loaded:", data.user.email)
      } else {
        console.error("Authentication failed:", data.message)
        // Check localStorage for user data as fallback
        const storedUser = localStorage.getItem("user")
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser)
            setUser(parsedUser)
            console.log("Using stored user data:", parsedUser.email)
          } catch (e) {
            console.error("Failed to parse stored user data")
            router.push("/login")
          }
        } else {
          router.push("/login")
        }
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error)
      // Check localStorage as fallback
      const storedUser = localStorage.getItem("user")
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser)
          setUser(parsedUser)
          console.log("Using stored user data after error:", parsedUser.email)
        } catch (e) {
          console.error("Failed to parse stored user data")
          router.push("/login")
        }
      } else {
        router.push("/login")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })

      const data = await response.json()

      if (data.success) {
        // Clear localStorage
        localStorage.removeItem("user")

        toast({
          title: "Logged out successfully",
          description: "You have been signed out of your account.",
        })
        router.push("/login")
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      console.error("Logout error:", error)
      // Force logout even if API fails
      localStorage.removeItem("user")
      toast({
        title: "Logged out",
        description: "You have been signed out.",
      })
      router.push("/login")
    } finally {
      setIsLoggingOut(false)
    }
  }

  // Safe getters for user data
  const getUserDisplayName = () => {
    if (!user || !user.firstName || !user.lastName) return "Loading..."
    return `${user.firstName} ${user.lastName}`
  }

  const getUserInitials = () => {
    if (!user || !user.firstName || !user.lastName) return "??"
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
  }

  const getUserEmail = () => {
    return user?.email || "Loading..."
  }

  // Show loading state while fetching user data
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-full flex-col">
            <div className="flex h-16 items-center px-6 border-b">
              <Link href="/" className="flex items-center">
                <Monitor className="h-6 w-6 mr-2" />
                <span className="font-bold">SignageCloud</span>
              </Link>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="h-4 w-4 mr-3" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
            <div className="border-t p-4">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-primary-foreground">{getUserInitials()}</span>
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{getUserDisplayName()}</p>
                  <p className="text-xs text-gray-500 truncate">{getUserEmail()}</p>
                </div>
              </div>
              <Button variant="ghost" className="w-full justify-start" onClick={handleLogout} disabled={isLoggingOut}>
                <LogOut className="h-4 w-4 mr-3" />
                {isLoggingOut ? "Signing out..." : "Sign Out"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r">
          <div className="flex h-16 items-center px-6 border-b">
            <Link href="/" className="flex items-center">
              <Monitor className="h-6 w-6 mr-2" />
              <span className="font-bold">SignageCloud</span>
            </Link>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <item.icon className="h-4 w-4 mr-3" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="border-t p-4">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-primary-foreground">{getUserInitials()}</span>
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{getUserDisplayName()}</p>
                <p className="text-xs text-gray-500 truncate">{getUserEmail()}</p>
              </div>
            </div>
            <Button variant="ghost" className="w-full justify-start" onClick={handleLogout} disabled={isLoggingOut}>
              <LogOut className="h-4 w-4 mr-3" />
              {isLoggingOut ? "Signing out..." : "Sign Out"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="hidden lg:flex lg:items-center lg:gap-x-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-primary-foreground">{getUserInitials()}</span>
                </div>
                <span className="text-sm font-medium">{getUserDisplayName()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
