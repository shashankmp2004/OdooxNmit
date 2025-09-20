"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { LogOut } from "lucide-react"
import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface SignoutDialogProps {
  children: React.ReactNode
  className?: string
}

export function SignoutDialog({ children, className }: SignoutDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await signOut({
        redirect: false,
      })
      toast.success("Signed out successfully")
      router.push("/auth")
    } catch (error) {
      console.error("Sign out error:", error)
      toast.error("An error occurred during sign out")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5 text-destructive" />
            Sign Out
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to sign out? You will need to sign in again to access your dashboard.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSignOut}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Signing out..." : "Sign Out"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}