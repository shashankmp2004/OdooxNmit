"use client";

import type React from "react";

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Factory, User, Shield, Wrench, Package, AlertCircle, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn, useSession } from "next-auth/react"
import { toast } from "sonner"

const roles = [
  {
    id: "MANAGER",
    name: "Manager",
    description: "Full access to dashboards, analytics, and team management",
    icon: User,
    color: "bg-primary/20 text-primary border-primary/30",
    email: "manager@demo.com"
  },
  {
    id: "ADMIN",
    name: "Admin",
    description: "Complete system access including user management and settings",
    icon: Shield,
    color: "bg-destructive/20 text-destructive border-destructive/30",
    email: "admin@demo.com"
  },
  {
    id: "OPERATOR",
    name: "Operator",
    description: "Work order management and production floor operations",
    icon: Wrench,
    color: "bg-chart-2/20 text-chart-2 border-chart-2/30",
    email: "operator@demo.com"
  },
  {
    id: "INVENTORY",
    name: "Inventory Manager",
    description: "Stock management, inventory tracking, and supply chain",
    icon: Package,
    color: "bg-chart-3/20 text-chart-3 border-chart-3/30",
    email: "inventory@demo.com"
  },
];

export default function AuthPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [remember, setRemember] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const { status } = useSession()

  useEffect(() => {
    // Prefill from localStorage if available
    try {
      const savedRemember = localStorage.getItem("mf_remember")
      const savedEmail = localStorage.getItem("mf_email")
      if (savedRemember !== null) setRemember(savedRemember === "true")
      if (savedEmail) setFormData((p) => ({ ...p, email: savedEmail }))
      // Mirror remember flag to a cookie for middleware hints
      document.cookie = `mf_remember=${savedRemember ?? 'true'}; path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`
    } catch {
      // ignore storage errors
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
        remember, // hint for future server-side per-session policies
      })

      if (result?.error) {
        toast.error("Invalid credentials. Please try again.")
      } else {
        // Save lightweight browser-side state for convenience
        try {
          localStorage.setItem("mf_remember", String(remember))
          if (remember) {
            localStorage.setItem("mf_email", formData.email)
          } else {
            localStorage.removeItem("mf_email")
          }
          document.cookie = `mf_remember=${String(remember)}; Max-Age=${60 * 60 * 24 * 30}; path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`
        } catch {}
        toast.success("Signed in successfully!")
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Sign in error:", error)
      toast.error("An error occurred during sign in")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleDemoLogin = (role: typeof roles[0]) => {
    setFormData({
      email: role.email,
      password: `${role.id.charAt(0) + role.id.slice(1).toLowerCase()}@123`,
    })
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <Factory className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">
              ManufactureOS
            </span>
          </div>
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>

        {/* Auth Form */}
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span>Remember this device</span>
                </label>
                {status === "authenticated" && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => router.push("/dashboard")}
                  >
                    Go to Dashboard
                  </Button>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : status === "authenticated" ? "Continue" : "Sign In"}
              </Button>
            </form>

            {/* Demo Accounts */}
            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center mb-3">Demo Accounts (click to auto-fill)</p>
              <div className="grid grid-cols-1 gap-2">
                {roles.map((role) => {
                  const Icon = role.icon
                  return (
                    <Button
                      key={role.id}
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={() => handleDemoLogin(role)}
                      className="text-xs justify-start h-auto p-2"
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      <div className="text-left">
                        <div className="font-medium">{role.name}</div>
                        <div className="text-muted-foreground">{role.email}</div>
                      </div>
                    </Button>
                  )
                })}
              </div>
              <div className="mt-2 p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <AlertCircle className="h-3 w-3" />
                  <span>Password format: {"{Role}"}@123 (e.g., Admin@123)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back to Landing */}
        <div className="text-center">
          <Link
            href="/landing"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
