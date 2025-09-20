"use client"

import { Search, User, Settings, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import RealTimeNotifications from "@/components/real-time-notifications"
import { SignoutDialog } from "@/components/signout-dialog"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"

interface HeaderProps {
  title: string
  userName?: string
}

export function Header({ title, userName }: HeaderProps) {
  const { data: session } = useAuth()
  const router = useRouter()

  const displayName = userName || `${session?.user?.name} (${session?.user?.role})`
  const isAdmin = session?.user?.role === 'admin'

  return (
    <header className="flex items-center justify-between p-4 bg-card border-b border-border">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-semibold text-foreground text-balance">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." className="pl-10 bg-background border-input" />
        </div>

        {/* Admin Portal Access */}
        {isAdmin && (
          <Link href="/admin">
            <Button variant="outline" size="sm" className="flex items-center gap-2 border-orange-200 text-orange-700 hover:bg-orange-50">
              <Shield className="h-4 w-4" />
              <span className="hidden md:inline">Admin Portal</span>
            </Button>
          </Link>
        )}

        {/* Notifications */}
        <RealTimeNotifications />

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden md:inline">{displayName}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </DropdownMenuItem>
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin" className="flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    Admin Portal
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <SignoutDialog>
              <DropdownMenuItem onSelect={(e: Event) => e.preventDefault()}>
                Sign out
              </DropdownMenuItem>
            </SignoutDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
