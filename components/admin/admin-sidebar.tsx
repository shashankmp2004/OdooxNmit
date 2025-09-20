"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Users,
  Package,
  ClipboardList,
  Wrench,
  BarChart3,
  Database,
  Settings,
  Home,
  Factory,
  Boxes,
  TrendingUp,
  UserCog,
  Shield,
  FileText,
} from "lucide-react"

const navigation = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/admin",
        icon: Home,
        description: "System overview and statistics"
      },
      {
        title: "Analytics",
        href: "/admin/analytics",
        icon: TrendingUp,
        description: "Detailed reports and insights"
      },
    ]
  },
  {
    title: "User Management",
    items: [
      {
        title: "Users",
        href: "/admin/users",
        icon: Users,
        description: "Manage all system users"
      },
      {
        title: "Roles & Permissions",
        href: "/admin/permissions",
        icon: Shield,
        description: "Configure access control"
      },
    ]
  },
  {
    title: "Production Management",
    items: [
      {
        title: "Products",
        href: "/admin/products",
        icon: Package,
        description: "Product catalog and BOM management"
      },
      {
        title: "Manufacturing Orders",
        href: "/admin/manufacturing-orders",
        icon: Factory,
        description: "Production planning and execution"
      },
      {
        title: "Work Orders",
        href: "/admin/work-orders",
        icon: Wrench,
        description: "Task assignment and tracking"
      },
      {
        title: "Work Centers",
        href: "/admin/work-centers",
        icon: Settings,
        description: "Production facilities management"
      },
    ]
  },
  {
    title: "Inventory Management",
    items: [
      {
        title: "Stock Management",
        href: "/admin/stock",
        icon: Boxes,
        description: "Inventory levels and movements"
      },
      {
        title: "Stock Entries",
        href: "/admin/stock-entries",
        icon: ClipboardList,
        description: "All stock transactions"
      },
    ]
  },
  {
    title: "System",
    items: [
      {
        title: "Database Viewer",
        href: "/admin/database",
        icon: Database,
        description: "Direct database access"
      },
      {
        title: "System Logs",
        href: "/admin/logs",
        icon: FileText,
        description: "Application logs and audit trail"
      },
      {
        title: "Settings",
        href: "/admin/settings",
        icon: UserCog,
        description: "System configuration"
      },
    ]
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-72 border-r bg-card">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-foreground">
          🔧 Admin Portal
        </h2>
        <p className="text-sm text-muted-foreground">
          System Administration
        </p>
      </div>
      
      <Separator />
      
      <ScrollArea className="h-[calc(100vh-100px)]">
        <div className="p-4 space-y-6">
          {navigation.map((section) => (
            <div key={section.title}>
              <h3 className="mb-2 px-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                        isActive 
                          ? "bg-accent text-accent-foreground font-medium" 
                          : "text-muted-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <div className="flex-1">
                        <div className="font-medium">{item.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {item.description}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t">
        <Link href="/dashboard">
          <Button variant="outline" size="sm" className="w-full">
            ← Back to Main App
          </Button>
        </Link>
      </div>
    </div>
  )
}