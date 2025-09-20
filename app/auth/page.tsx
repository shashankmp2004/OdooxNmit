"use client";

import type React from "react";

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Factory, User, Shield, Wrench, Package, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn, getSession } from "next-auth/react"
import { toast } from "sonner"

const roles = [
	{
		id: "manager", // Fixed: lowercase to match database
		name: "Manager",
		description: "Full access to dashboards, analytics, and team management",
		icon: User,
		color: "bg-primary/20 text-primary border-primary/30",
		email: "manager@demo.com"
	},
	{
		id: "admin", // Fixed: lowercase to match database
		name: "Admin",
		description: "Complete system access including user management and settings",
		icon: Shield,
		color: "bg-destructive/20 text-destructive border-destructive/30",
		email: "admin@demo.com"
	},
	{
		id: "operator", // Fixed: lowercase to match database
		name: "Operator",
		description: "Work order management and production floor operations",
		icon: Wrench,
		color: "bg-chart-2/20 text-chart-2 border-chart-2/30",
		email: "operator@demo.com"
	},
	{
		id: "inventory_manager", // Fixed: correct enum value
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
	const [isLoading, setIsLoading] = useState(false)
	const router = useRouter()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsLoading(true)

		try {
			const result = await signIn("credentials", {
				email: formData.email,
				password: formData.password,
				redirect: false,
			})

			if (result?.error) {
				toast.error("Invalid credentials. Please try again.")
			} else {
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
		// Fixed password generation to match the actual passwords in the database
		const passwordMap = {
			admin: "Admin@123",
			manager: "Manager@123",
			operator: "Operator@123",
			inventory_manager: "Inventory@123"
		};

		setFormData({
			email: role.email,
			password: passwordMap[role.id as keyof typeof passwordMap],
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

							<Button type="submit" className="w-full" disabled={isLoading}>
								{isLoading ? "Signing in..." : "Sign In"}
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
