"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Factory, User, Shield, Wrench, Package } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"

const roles = [
  {
    id: "Manager",
    name: "Manager",
    description: "Full access to dashboards, analytics, and team management",
    icon: User,
    color: "bg-primary/20 text-primary border-primary/30",
  },
  {
    id: "Admin",
    name: "Admin",
    description: "Complete system access including BOM management and settings",
    icon: Shield,
    color: "bg-destructive/20 text-destructive border-destructive/30",
  },
  {
    id: "Operator",
    name: "Operator",
    description: "Work order management and production floor operations",
    icon: Wrench,
    color: "bg-chart-2/20 text-chart-2 border-chart-2/30",
  },
  {
    id: "Inventory Manager",
    name: "Inventory Manager",
    description: "Stock management, inventory tracking, and supply chain",
    icon: Package,
    color: "bg-chart-3/20 text-chart-3 border-chart-3/30",
  },
]

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  })
  const router = useRouter()
  const { login } = useAuth()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!isLogin && !selectedRole) {
      alert("Please select a role to continue")
      return
    }

    const userData = {
      email: formData.email,
      name: formData.name || formData.email.split("@")[0],
      role: isLogin ? "Manager" : selectedRole,
    }

    login(userData)
    router.push("/dashboard")
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <Factory className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">ManufactureOS</span>
          </div>
          <p className="text-muted-foreground">{isLogin ? "Sign in to your account" : "Create your account"}</p>
        </div>

        {/* Auth Form */}
        <Card>
          <CardHeader>
            <CardTitle>{isLogin ? "Sign In" : "Sign Up"}</CardTitle>
            <CardDescription>
              {isLogin ? "Enter your credentials to access your dashboard" : "Choose your role and create your account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required={!isLogin}
                  />
                </div>
              )}

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
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Role Selection for Sign Up */}
              {!isLogin && (
                <div className="space-y-3">
                  <Label>Select Your Role</Label>
                  <div className="grid grid-cols-1 gap-3">
                    {roles.map((role) => {
                      const Icon = role.icon
                      return (
                        <div
                          key={role.id}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:bg-accent/50 ${
                            selectedRole === role.id ? "border-primary bg-primary/5" : "border-border"
                          }`}
                          onClick={() => setSelectedRole(role.id)}
                        >
                          <div className="flex items-start space-x-3">
                            <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-foreground">{role.name}</span>
                                <Badge className={role.color}>{role.name}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full">
                {isLogin ? "Sign In" : "Create Account"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>

            {/* Demo Accounts */}
            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center mb-3">Demo Accounts (click to auto-fill)</p>
              <div className="grid grid-cols-2 gap-2">
                {roles.map((role) => (
                  <Button
                    key={role.id}
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => {
                      setFormData({
                        email: `${role.id.toLowerCase().replace(" ", ".")}@demo.com`,
                        password: "demo123",
                        name: `Demo ${role.name}`,
                      })
                      setSelectedRole(role.id)
                      setIsLogin(false)
                    }}
                    className="text-xs"
                  >
                    {role.name}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back to Landing */}
        <div className="text-center">
          <Link href="/landing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
