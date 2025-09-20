"use client"

import { User, Settings, Shield, LayoutDashboard, LogOut, BellOff } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { useStockAlerts } from "@/hooks/use-socket"
import { useToast } from "@/hooks/use-toast"
import React from "react"
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
  const stockAlerts = useStockAlerts()
  const { toast } = useToast()
  const [muteUntil, setMuteUntil] = React.useState<number>(0)

  // Restore mute from localStorage (per browser/user)
  React.useEffect(() => {
    const raw = localStorage.getItem('muteLowStockUntil')
    setMuteUntil(raw ? parseInt(raw, 10) : 0)
  }, [])

  const muteFor10Minutes = () => {
    const until = Date.now() + 10 * 60 * 1000
    setMuteUntil(until)
    localStorage.setItem('muteLowStockUntil', String(until))
    toast({ title: 'Muted', description: 'Low stock toasts muted for 10 minutes' })
  }

  // Show toast when a new low stock alert arrives (latest only)
  // Debounced batch notification to avoid toast spam
  React.useEffect(() => {
    if (!stockAlerts?.length) return
    const low = stockAlerts.filter(a => a.type === 'low_stock')
    if (!low.length) return
    if (Date.now() < muteUntil) return
    const timer = setTimeout(() => {
      const uniqueProducts = Array.from(new Set(low.map(a => a.data.productName)))
      const head = uniqueProducts.slice(0, 3).join(', ')
      const more = uniqueProducts.length > 3 ? ` +${uniqueProducts.length - 3} more` : ''
      toast({
        title: "Low Stock Alert",
        description: `${head}${more}`
      })
    }, 400)
    return () => clearTimeout(timer)
  }, [stockAlerts.map(a => a.timestamp).join('|'), muteUntil])

  const displayName = userName || `${session?.user?.name} (${session?.user?.role})`
  const isAdmin = session?.user?.role === 'ADMIN'

  return (
    <header className="flex items-center justify-between p-4 bg-card border-b border-border">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-semibold text-foreground text-balance">{title}</h1>
      </div>

      <div className="flex items-center gap-3 flex-wrap justify-end">

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
        <div className="flex items-center gap-2">
          <RealTimeNotifications />
          <Button variant="outline" size="sm" onClick={muteFor10Minutes} title="Mute low stock toasts for 10 minutes">
            <BellOff className="h-4 w-4" />
          </Button>
        </div>

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
            <DropdownMenuItem asChild>
              <Link href="/dashboard" className="flex items-center">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                Profile
              </Link>
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
              <DropdownMenuItem onSelect={(e: Event) => e.preventDefault()} className="text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </SignoutDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
