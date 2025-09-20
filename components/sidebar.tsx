"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-provider"
import {
  LayoutDashboard,
  ClipboardList,
  Warehouse,
  FileText,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Factory,
  LogOut,
} from "lucide-react"

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["MANAGER", "ADMIN"],
  },
  {
    name: "Work Orders",
    href: "/work-orders",
    icon: ClipboardList,
    roles: ["OPERATOR", "MANAGER", "ADMIN"],
  },
  {
    name: "Stock Ledger",
    href: "/stock-ledger",
    icon: Warehouse,
    roles: ["INVENTORY", "MANAGER", "ADMIN"],
  },
  {
    name: "BOM Management",
    href: "/bom",
    icon: FileText,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    name: "Reports",
    href: "/reports",
    icon: BarChart3,
    roles: ["MANAGER", "ADMIN"],
  },
]

interface SidebarProps {
  userRole?: string
}

export function Sidebar({ userRole = "MANAGER" }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useAuth()

  // Use the actual user role from session if available
  const currentRole = userRole || session?.user?.role || "MANAGER"
  
  const filteredNavigation = navigation.filter((item) => item.roles.includes(currentRole))

  const handleLogout = () => {
    router.push("/api/auth/signout")
  }

  return (
    <div
      className={cn(
        "flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Factory className="h-6 w-6 text-sidebar-primary" />
            <span className="font-semibold text-sidebar-foreground">ManufactureOS</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* User Role Badge */}
      {!collapsed && (
        <div className="p-4 border-b border-sidebar-border">
          <Badge variant="secondary" className="bg-sidebar-accent text-sidebar-accent-foreground">
            {currentRole}
          </Badge>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 text-sidebar-foreground",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                    : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  collapsed && "px-2",
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* Settings and Logout */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        <Link href="/settings">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              collapsed && "px-2",
            )}
          >
            <Settings className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span>Settings</span>}
          </Button>
        </Link>

        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            "w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            collapsed && "px-2",
          )}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </div>
    </div>
  )
}
