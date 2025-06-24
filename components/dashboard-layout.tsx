"use client"

import { Home, LayoutDashboard, ListChecks, Settings, Shield, User, Monitor, ImageIcon, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Link } from "lucide-react"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

interface SidebarProps {
  isMobile: boolean
}

const sidebarNavItems = [
  {
    name: "Home",
    href: "/dashboard",
    icon: Home,
  },
  {
    name: "Tasks",
    href: "/dashboard/tasks",
    icon: ListChecks,
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
  {
    name: "Profile",
    href: "/dashboard/profile",
    icon: User,
  },
  {
    name: "Admin",
    href: "/dashboard/admin",
    icon: Shield,
    adminOnly: true,
  },
]

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Screens", href: "/dashboard/screens", icon: Monitor },
  { name: "Media", href: "/dashboard/media", icon: ImageIcon },
  { name: "Playlists", href: "/dashboard/playlists", icon: Play },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

// Add admin navigation conditionally
const adminNavigation = [{ name: "Admin", href: "/dashboard/admin", icon: Shield }]

export const DashboardLayout = ({ isMobile }: SidebarProps) => {
  const pathname = usePathname()
  const [showSidebar, setShowSidebar] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // Replace this with your actual logic to check user permissions
    // For example, you might fetch user data from an API and check their role
    const checkAdminStatus = async () => {
      // Simulate an API call or permission check
      const userIsAdmin = true // Replace with actual logic
      setIsAdmin(userIsAdmin)
    }

    checkAdminStatus()
  }, [])

  return (
    <div className="flex h-screen">
      {isMobile ? (
        <Sheet open={showSidebar} onOpenChange={setShowSidebar}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <LayoutDashboard className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-3/4 p-0">
            <SidebarContent isAdmin={isAdmin} pathname={pathname} />
          </SheetContent>
        </Sheet>
      ) : (
        <aside className="hidden md:flex md:w-[200px] lg:w-[250px] border-r flex-col">
          <SidebarContent isAdmin={isAdmin} pathname={pathname} />
        </aside>
      )}
      <main className="flex-1 p-4">
        {/* Your page content goes here */}
        <p>Main Content</p>
      </main>
    </div>
  )
}

interface SidebarContentProps {
  pathname: string
  isAdmin: boolean
}

const SidebarContent = ({ pathname, isAdmin }: SidebarContentProps) => {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-6">
        <Link href="/" className="flex items-center font-semibold">
          <LayoutDashboard className="h-6 w-6 mr-2" />
          Acme Corp
        </Link>
      </div>
      <Separator />
      <ScrollArea className="flex-1 space-y-4 p-4">
        <div className="space-y-1">
          {sidebarNavItems.map((item) => {
            if (item.adminOnly && !isAdmin) {
              return null
            }
            const isActive = pathname === item.href
            return (
              <Button
                variant={isActive ? "secondary" : "ghost"}
                href={item.href}
                asChild
                className="w-full justify-start gap-2"
                key={item.href}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Button>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
