"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
  fallbackPath?: string
}

export function ProtectedRoute({ 
  children, 
  allowedRoles = [], 
  fallbackPath = "/auth" 
}: ProtectedRouteProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return // Still loading

    if (!session) {
      router.push(fallbackPath)
      return
    }

    // Check role permissions if specified
    if (allowedRoles.length > 0) {
      const userRole = session.user?.role
      if (!userRole || (!allowedRoles.includes(userRole) && userRole !== "ADMIN")) {
        router.push("/dashboard") // Redirect to dashboard if no permission
        return
      }
    }
  }, [session, status, router, allowedRoles, fallbackPath])

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null // Will redirect
  }

  // Check role permissions again for render
  if (allowedRoles.length > 0) {
    const userRole = session.user?.role
    if (!userRole || (!allowedRoles.includes(userRole) && userRole !== "ADMIN")) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
            <p className="text-muted-foreground">You don't have permission to access this page.</p>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}
