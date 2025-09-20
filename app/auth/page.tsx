"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Shield, Wrench, Package, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { motion, useAnimation } from "framer-motion";

const roles = [
  { id: "MANAGER", name: "Manager", email: "manager@demo.com", icon: User },
  { id: "ADMIN", name: "Admin", email: "admin@demo.com", icon: Shield },
  {
    id: "OPERATOR",
    name: "Operator",
    email: "operator@demo.com",
    icon: Wrench,
  },
  {
    id: "INVENTORY",
    name: "Inventory Manager",
    email: "inventory@demo.com",
    icon: Package,
  },
];

export default function AuthPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const catControls = useAnimation();
  const tailControls = useAnimation();
  const earControls = useAnimation();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });
      if (result?.error) toast.error("Invalid credentials. Please try again.");
      else {
        toast.success("Signed in successfully!");
        router.push("/dashboard");
      }
    } catch {
      toast.error("An error occurred during sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleDemoLogin = (role: (typeof roles)[0]) => {
    setFormData({
      email: role.email,
      password: `${role.id.charAt(0) + role.id.slice(1).toLowerCase()}@123`,
    });
  };

  useEffect(() => {
    catControls.start({
      scale: emailFocused || passwordFocused ? 1.05 : 1,
      transition: { type: "spring", stiffness: 200, damping: 15 },
    });

    // Breathing animation when idle
    if (!emailFocused && !passwordFocused) {
      catControls.start({
        scale: [1, 1.02, 1],
        transition: {
          duration: 3,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        },
      });
    }

    // Tail swaying animation
    tailControls.start({
      rotate: [-5, 5, -5],
      transition: {
        duration: 2,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      },
    });

    // Ear twitching animation
    earControls.start({
      rotate: [0, 2, 0, -1, 0],
      transition: {
        duration: 4,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
        delay: Math.random() * 2,
      },
    });
  }, [emailFocused, passwordFocused, catControls, tailControls, earControls]);

  const pupilX = emailFocused ? 80 : 85;
  const pupilX2 = emailFocused ? 110 : 115;
  const eyeRadiusY = passwordFocused ? 2 : 10;

  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center p-4">
      {/* Back to Home */}
      <Link
        href="/landing"
        className="absolute top-6 left-6 text-sm text-muted-foreground hover:text-foreground transition"
      >
        ← Back to Home
      </Link>

      <div className="w-full max-w-5xl">
        {/* Sign In heading */}
        <h1 className="text-4xl font-bold text-foreground text-left mb-6">
          Sign In
        </h1>

        <Card className="backdrop-blur-md bg-white/10 border border-white/20 shadow-xl flex flex-col md:flex-row overflow-hidden">
          {/* Left: Cat + Form */}
          <CardContent className="flex-1 p-6 md:p-8 flex flex-col items-center space-y-6">
            {/* Enhanced Cat SVG */}
            <motion.svg
              viewBox="0 0 200 200"
              className="w-40 h-40"
              animate={catControls}
            >
              {/* Cat Body with subtle gradient effect */}
              <defs>
                <radialGradient id="bodyGradient" cx="0.5" cy="0.3" r="0.8">
                  <stop offset="0%" stopColor="#2a2a2a" />
                  <stop offset="100%" stopColor="#000000" />
                </radialGradient>
                <radialGradient id="headGradient" cx="0.4" cy="0.3" r="0.9">
                  <stop offset="0%" stopColor="#333333" />
                  <stop offset="100%" stopColor="#000000" />
                </radialGradient>
              </defs>

              {/* Cat Body */}
              <motion.path
                d="M50,180 Q40,120 90,90 Q100,60 110,90 Q160,120 150,180 Z"
                fill="url(#bodyGradient)"
                stroke="#1a1a1a"
                strokeWidth="2"
              />

              {/* Cat Head */}
              <motion.circle
                cx="100"
                cy="60"
                r="40"
                fill="url(#headGradient)"
                stroke="#1a1a1a"
                strokeWidth="2"
              />

              {/* Left Ear */}
              <motion.path
                d="M75,35 L85,15 L95,35 Z"
                fill="#000000"
                stroke="#1a1a1a"
                strokeWidth="1"
                animate={earControls}
                style={{ transformOrigin: "85px 35px" }}
              />
              {/* Left Ear Inner */}
              <motion.path
                d="M78,32 L85,20 L92,32 Z"
                fill="#2a2a2a"
                animate={earControls}
                style={{ transformOrigin: "85px 32px" }}
              />

              {/* Right Ear */}
              <motion.path
                d="M105,35 L115,15 L125,35 Z"
                fill="#000000"
                stroke="#1a1a1a"
                strokeWidth="1"
                animate={earControls}
                style={{ transformOrigin: "115px 35px" }}
              />
              {/* Right Ear Inner */}
              <motion.path
                d="M108,32 L115,20 L122,32 Z"
                fill="#2a2a2a"
                animate={earControls}
                style={{ transformOrigin: "115px 32px" }}
              />

              {/* Eyes with enhanced details */}
              <motion.ellipse
                cx="85"
                cy="65"
                rx="12"
                ry={eyeRadiusY}
                fill="white"
                stroke="#cccccc"
                strokeWidth="0.5"
                transition={{ duration: 0.2 }}
              />
              <motion.circle
                cx={pupilX}
                cy="65"
                r="4"
                fill="black"
                transition={{ duration: 0.2 }}
              />
              {/* Eye shine */}
              <motion.circle
                cx={pupilX + 1}
                cy="63"
                r="1"
                fill="white"
                transition={{ duration: 0.2 }}
              />

              <motion.ellipse
                cx="115"
                cy="65"
                rx="12"
                ry={eyeRadiusY}
                fill="white"
                stroke="#cccccc"
                strokeWidth="0.5"
                transition={{ duration: 0.2 }}
              />
              <motion.circle
                cx={pupilX2}
                cy="65"
                r="4"
                fill="black"
                transition={{ duration: 0.2 }}
              />
              {/* Eye shine */}
              <motion.circle
                cx={pupilX2 + 1}
                cy="63"
                r="1"
                fill="white"
                transition={{ duration: 0.2 }}
              />

              {/* Nose */}
              <motion.path
                d="M100,75 L95,80 L105,80 Z"
                fill="#1a1a1a"
                stroke="#333333"
                strokeWidth="0.5"
              />

              {/* Mouth */}
              <motion.path
                d="M100,80 Q95,85 90,82"
                fill="none"
                stroke="#1a1a1a"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <motion.path
                d="M100,80 Q105,85 110,82"
                fill="none"
                stroke="#1a1a1a"
                strokeWidth="1.5"
                strokeLinecap="round"
              />

              {/* Whiskers */}
              <motion.line
                x1="60"
                y1="70"
                x2="75"
                y2="68"
                stroke="#1a1a1a"
                strokeWidth="1"
                strokeLinecap="round"
              />
              <motion.line
                x1="60"
                y1="75"
                x2="75"
                y2="75"
                stroke="#1a1a1a"
                strokeWidth="1"
                strokeLinecap="round"
              />
              <motion.line
                x1="60"
                y1="80"
                x2="75"
                y2="82"
                stroke="#1a1a1a"
                strokeWidth="1"
                strokeLinecap="round"
              />

              <motion.line
                x1="125"
                y1="68"
                x2="140"
                y2="70"
                stroke="#1a1a1a"
                strokeWidth="1"
                strokeLinecap="round"
              />
              <motion.line
                x1="125"
                y1="75"
                x2="140"
                y2="75"
                stroke="#1a1a1a"
                strokeWidth="1"
                strokeLinecap="round"
              />
              <motion.line
                x1="125"
                y1="82"
                x2="140"
                y2="80"
                stroke="#1a1a1a"
                strokeWidth="1"
                strokeLinecap="round"
              />

              {/* Tail */}
              <motion.path
                d="M150,160 Q170,140 165,120 Q160,100 175,85"
                fill="none"
                stroke="#000000"
                strokeWidth="8"
                strokeLinecap="round"
                animate={tailControls}
                style={{ transformOrigin: "150px 160px" }}
              />
              <motion.path
                d="M150,160 Q170,140 165,120 Q160,100 175,85"
                fill="none"
                stroke="#2a2a2a"
                strokeWidth="4"
                strokeLinecap="round"
                animate={tailControls}
                style={{ transformOrigin: "150px 160px" }}
              />

              {/* Paws */}
              <motion.ellipse
                cx="80"
                cy="175"
                rx="8"
                ry="6"
                fill="#000000"
                stroke="#1a1a1a"
                strokeWidth="1"
              />
              <motion.ellipse
                cx="120"
                cy="175"
                rx="8"
                ry="6"
                fill="#000000"
                stroke="#1a1a1a"
                strokeWidth="1"
              />
            </motion.svg>

            {/* Form */}
            <form onSubmit={handleSubmit} className="w-full space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
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
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>

          {/* Right: Demo Accounts */}
          <CardContent className="flex-1 p-6 md:p-8 flex flex-col justify-center space-y-6">
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
                      <div className="text-muted-foreground">{role.email}</div>
                    </div>
                  </Button>
                );
              })}
            </div>
            <div className="mt-2 p-2 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertCircle className="h-3 w-3" />
                <span>Password format: {"Role"}@123 (e.g., Admin@123)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
