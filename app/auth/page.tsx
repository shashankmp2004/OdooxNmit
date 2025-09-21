"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Factory, User, Shield, Wrench, Package, AlertCircle, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

const roles = [
  { id: "MANAGER", name: "Manager", icon: User, email: "manager@demo.com" },
  { id: "ADMIN", name: "Admin", icon: Shield, email: "admin@demo.com" },
  { id: "OPERATOR", name: "Operator", icon: Wrench, email: "operator1@demo.com" },
  { id: "INVENTORY", name: "Inventory Manager", icon: Package, email: "inventory@demo.com" },
];

export default function AuthPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [signup, setSignup] = useState({ name: "", email: "", password: "" });
  const [remember, setRemember] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    try {
      const savedRemember = localStorage.getItem("mf_remember");
      const savedEmail = localStorage.getItem("mf_email");
      if (savedRemember !== null) setRemember(savedRemember === "true");
      if (savedEmail) setFormData((p) => ({ ...p, email: savedEmail }));
    } catch {}
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await signIn("credentials", { email: formData.email, password: formData.password, redirect: false, remember });
      if (result?.error) toast.error("Invalid credentials.");
      else {
        localStorage.setItem("mf_remember", String(remember));
        if (remember) localStorage.setItem("mf_email", formData.email);
        else localStorage.removeItem("mf_email");
        toast.success("Signed in successfully!");
        // After sign in, route based on role
        setTimeout(() => {
          const role = (document as any)?.cookie?.includes('next-auth') ? undefined : undefined;
          // Fetch session from useSession would lag on immediate redirect; query a lightweight endpoint
          fetch('/api/auth/me').then(async r => {
            const j = await r.json().catch(() => null);
            const userRole = j?.user?.role;
            if (userRole === 'INVENTORY') router.push('/stock-ledger');
            else if (userRole === 'OPERATOR') router.push('/work-orders');
            else router.push('/dashboard');
          }).catch(() => router.push('/dashboard'));
        }, 50);
      }
    } catch { toast.error("Sign in error"); }
    finally { setIsLoading(false); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignup((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/simple-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signup)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Sign up failed');
      toast.success('Account created. You can sign in now.');
      setFormData({ email: signup.email, password: signup.password });
      setSignup({ name: '', email: '', password: '' });
    } catch (err: any) {
      toast.error(err?.message || 'Sign up failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (role: (typeof roles)[0]) => {
    setFormData({
      email: role.email,
      password: `${role.id.charAt(0) + role.id.slice(1).toLowerCase()}@123`,
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      <Link href="/landing" className="absolute top-4 left-4 text-sm text-muted-foreground hover:text-foreground transition-colors">
        ← Back to home
      </Link>

      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-center space-x-2">
          <Factory className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold text-foreground">ManufactureOS</span>
        </div>
        <Card className="relative border border-border bg-card rounded-2xl shadow-xl overflow-hidden">
          {/* White noise overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="w-full h-full opacity-[0.07] bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAIAAADYYG7QAAAACXBIWXMAAAsSAAALEgHS3X78AAAAU0lEQVR4nO3PMQEAAAQAMM5f9F3HChYk0gkk0gkk0gkk0gkk0gkk0gkk0gkk0gkk0gkk0gkk0gkk0gkk0gkk0gkk0gkk0gkk0gkk0gkk0gkk0gkk0gkk0gnkJ7MEIJmP0XZZAAAAAElFTkSuQmCC')] bg-repeat"></div>
          </div>
          <CardHeader>
            <CardTitle className="text-left text-2xl font-bold">Sign In</CardTitle>
          </CardHeader>

          <CardContent className="relative space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1 border-b border-white/30 pb-1">
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

              <div className="space-y-1 border-b border-white/30 pb-1 relative">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={formData.password} onChange={handleInputChange} required />
                <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1" onClick={() => setShowPassword(s => !s)} aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4" />
                  <span>Remember this device</span>
                </label>
                {status === "authenticated" && <Button type="button" variant="secondary" onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : status === "authenticated" ? "Continue" : "Sign In"}
              </Button>
            </form>
            {/* Demo Accounts */}
              <div className="mt-6 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center mb-3">
                Demo Accounts (click to auto-fill)
              </p>
              <div className="grid grid-cols-1 gap-2">
                {roles.map((role) => {
                  const Icon = role.icon;
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
                        <div className="text-muted-foreground">
                          {role.email}
                        </div>
                      </div>
                    </Button>
                  );
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

        {/* Simple Sign Up (stacked below sign in) */}
        <Card className="border border-border bg-card rounded-2xl shadow">
          <CardHeader>
            <CardTitle className="text-left text-xl font-semibold">Sign Up</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" placeholder="Your name" value={signup.name} onChange={handleSignupChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input id="signup-email" name="email" type="email" placeholder="you@example.com" value={signup.email} onChange={handleSignupChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input id="signup-password" name="password" type="password" placeholder="Create a password" value={signup.password} onChange={handleSignupChange} required />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>Create Account</Button>
              <p className="text-xs text-muted-foreground">No email verification. Accounts default to OPERATOR role. Admin can later update roles.</p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
