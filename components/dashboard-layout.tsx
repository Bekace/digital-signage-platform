"use client"

import { CreditCard, File, FileText, Home, Settings, Tag, Users } from "lucide-react"
import type { User } from "next-auth"
import { getServerSession } from "next-auth/next"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

import { authOptions } from "@/lib/auth"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: ReactNode
}

const DashboardLayout = async ({ children }: DashboardLayoutProps) => {
  const session = await getServerSession(authOptions)
  const user = session?.user as User
  const pathname = usePathname()

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 border-r bg-gray-100 py-4">
        <div className="px-6">
          <Link href="/" className="mb-4 block text-xl font-bold">
            Acme
          </Link>
        </div>
        <nav className="flex flex-col space-y-1 px-2">
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
              pathname === "/dashboard" ? "bg-muted text-primary" : "",
            )}
          >
            <Home className="h-4 w-4" />
            Home
          </Link>
          <Link
            href="/dashboard/documents"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
              pathname === "/dashboard/documents" ? "bg-muted text-primary" : "",
            )}
          >
            <FileText className="h-4 w-4" />
            Documents
          </Link>
          <Link
            href="/dashboard/files"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
              pathname === "/dashboard/files" ? "bg-muted text-primary" : "",
            )}
          >
            <File className="h-4 w-4" />
            Files
          </Link>
          <Link
            href="/dashboard/settings"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
              pathname === "/dashboard/settings" ? "bg-muted text-primary" : "",
            )}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>

          {user?.is_admin && (
            <>
              <Link
                href="/dashboard/admin"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  pathname === "/dashboard/admin" ? "bg-muted text-primary" : "",
                )}
              >
                <Users className="h-4 w-4" />
                Admin
              </Link>
              <Link
                href="/dashboard/admin/users"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  pathname === "/dashboard/admin/users" ? "bg-muted text-primary" : "",
                )}
              >
                <Users className="h-4 w-4" />
                Users
              </Link>
              <Link
                href="/dashboard/admin/plans"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  pathname === "/dashboard/admin/plans" ? "bg-muted text-primary" : "",
                )}
              >
                <CreditCard className="h-4 w-4" />
                Plans
              </Link>
              <Link
                href="/dashboard/admin/features"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  pathname === "/dashboard/admin/features" ? "bg-muted text-primary" : "",
                )}
              >
                <Tag className="h-4 w-4" />
                Features
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4">{children}</div>
    </div>
  )
}

export default DashboardLayout
