"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Factory,
  BarChart3,
  Users,
  Shield,
  Zap,
  Twitter,
  Linkedin,
  Github,
  Mail,
  Phone,
  MapPin,
  Lock,
  Award,
  Smartphone,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { User, Settings as Cog, Shield as ShieldIcon } from "lucide-react";
import { SignoutDialog } from "@/components/signout-dialog";
import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Hero } from "@/app/landing/hero";
import Stats from "@/app/landing/stats";

export default function LandingPage() {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const { data: session, status } = useSession();

  useEffect(() => {
    // Create intersection observer for scroll animations
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in");
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    // Observe all elements with scroll animation classes
    const animationClasses = [
      ".scroll-animate",
      ".scroll-animate-fade",
      ".scroll-animate-slide-left",
      ".scroll-animate-slide-right",
      ".scroll-animate-scale",
    ];

    animationClasses.forEach((className) => {
      const elements = document.querySelectorAll(className);
      elements.forEach((el) => observerRef.current?.observe(el));
    });

    // Auto-animate hero section on page load
    setTimeout(() => {
      const heroSection = document.querySelector(".hero-animate");
      if (heroSection) {
        heroSection.classList.add("animate-in");
      }
    }, 300);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const benefits = [
    {
      icon: Shield,
      title: "Enterprise Security",
      desc: "Bank-grade security with role-based access control, audit trails, and compliance reporting.",
    },
    {
      icon: Zap,
      title: "Automated Workflows",
      desc: "Streamline operations with automated work order routing, inventory alerts, and production scheduling.",
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      desc: "Make data-driven decisions with comprehensive reporting, predictive analytics, and performance insights.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Animation Styles */}
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }

        .scroll-animate {
          opacity: 0;
          transform: translateY(15px);
          transition: all 1.2s ease-out;
        }

        .scroll-animate.animate-in {
          opacity: 1;
          transform: translateY(0);
        }

        .hero-animate {
          opacity: 0;
          transform: translateY(20px);
          transition: all 1.5s ease-out;
        }

        .hero-animate.animate-in {
          opacity: 1;
          transform: translateY(0);
        }

        .scroll-animate-delay-1 {
          transition-delay: 0.15s;
        }

        .scroll-animate-delay-2 {
          transition-delay: 0.3s;
        }

        .scroll-animate-delay-3 {
          transition-delay: 0.45s;
        }

        .scroll-animate-delay-4 {
          transition-delay: 0.6s;
        }

        .scroll-animate-delay-5 {
          transition-delay: 0.75s;
        }

        .scroll-animate-fade {
          opacity: 0;
          transition: opacity 1.2s ease-out;
        }

        .scroll-animate-fade.animate-in {
          opacity: 1;
        }

        /* Additional smooth animations for better UX */
        .scroll-animate-slide-left {
          opacity: 0;
          transform: translateX(-15px);
          transition: all 1.2s ease-out;
        }

        .scroll-animate-slide-left.animate-in {
          opacity: 1;
          transform: translateX(0);
        }

        .scroll-animate-slide-right {
          opacity: 0;
          transform: translateX(15px);
          transition: all 1.2s ease-out;
        }

        .scroll-animate-slide-right.animate-in {
          opacity: 1;
          transform: translateX(0);
        }

        /* Scale fade animation for cards */
        .scroll-animate-scale {
          opacity: 0;
          transform: translateY(20px) scale(0.95);
          transition: all 1.2s ease-out;
        }

        .scroll-animate-scale.animate-in {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      `}</style>

      {/* Navigation */}
      <motion.nav
        className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          duration: 0.8,
          ease: [0.25, 0.46, 0.45, 0.94],
          delay: 0.1,
        }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <motion.div
              className="flex items-center space-x-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Factory className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">
                ManufactureOS
              </span>
            </motion.div>
            <motion.div
              className="hidden md:flex items-center space-x-8"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Link
                href="#features"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </Link>
              <Link
                href="#pricing"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="#about"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                About
              </Link>
              {status === "authenticated" ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="hidden lg:inline">{session.user?.name || session.user?.email}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      Signed in as
                      <div className="text-xs text-muted-foreground truncate">{session.user?.email}</div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Cog className="h-4 w-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    {(session.user as any)?.role === "ADMIN" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="flex items-center">
                            <ShieldIcon className="h-4 w-4 mr-2" />
                            Admin Portal
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <SignoutDialog>
                      <DropdownMenuItem onSelect={(e: Event) => e.preventDefault()}>
                        Sign out
                      </DropdownMenuItem>
                    </SignoutDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/auth?mode=login">Sign In</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/auth?mode=signup">Get Started</Link>
                  </Button>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.div
        className="hero-animate"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
      >
        <Hero />
      </motion.div>

      {/* Stats Section */}
      <motion.div
        className="scroll-animate scroll-animate-delay-1"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
        <Stats />
      </motion.div>

      {/* Features Section */}
      <motion.section
        id="features"
        className="py-20 scroll-animate"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
              Make operations seamless.{" "}
              <span className="text-muted-foreground">
                <br></br>
                Tools for your team and stakeholders to collaborate and iterate
                faster.
              </span>
            </h2>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-8">
              <Card className="p-8 bg-card/50 border-border/50 backdrop-blur-md">
                <div className="flex items-start space-x-4">
                  <BarChart3 className="h-8 w-8 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Real-time Analytics
                    </h3>
                    <p className="text-muted-foreground text-pretty">
                      Monitor production metrics, track KPIs, and get instant
                      insights into your manufacturing operations with
                      comprehensive dashboards.
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="p-8 bg-card/50 border-border/50 backdrop-blur-md">
                <div className="flex items-start space-x-4">
                  <Users className="h-8 w-8 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Role-based Access
                    </h3>
                    <p className="text-muted-foreground text-pretty">
                      Secure, role-based dashboards for managers, operators, and
                      inventory teams. Each user sees exactly what they need to
                      be productive.
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column */}
            <div className="relative">
              <Card className="p-6 bg-card/30 border-border/30 backdrop-blur-md">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-foreground">
                      Production Overview
                    </h4>
                    <Badge variant="secondary">Live</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-background/50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-primary">94%</div>
                      <div className="text-sm text-muted-foreground">
                        Efficiency
                      </div>
                    </div>
                    <div className="bg-background/50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-chart-2">127</div>
                      <div className="text-sm text-muted-foreground">
                        Active Orders
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Production Line A
                      </span>
                      <Badge className="bg-status-completed/20 text-status-completed border-status-completed/30">
                        Running
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Production Line B
                      </span>
                      <Badge className="bg-status-in-progress/20 text-status-in-progress border-status-in-progress/30">
                        Maintenance
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Benefits Section */}
      <motion.section
        className="py-20 bg-muted/20 scroll-animate"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto max-w-2xl text-center mb-16 scroll-animate scroll-animate-delay-1"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.15 }}
          >
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
              Faster operations.{" "}
              <span className="text-muted-foreground">More innovation.</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground text-pretty">
              The platform for rapid progress. Let your team focus on building
              products instead of managing infrastructure with automated
              workflows and integrated collaboration.
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {benefits.map((feature, idx) => {
              const Icon = feature.icon;
              const delayClass =
                idx === 0
                  ? "scroll-animate-delay-2"
                  : idx === 1
                  ? "scroll-animate-delay-3"
                  : "scroll-animate-delay-4";
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{
                    duration: 1.5,
                    ease: "easeOut",
                    delay: idx * 0.15 + 0.3,
                  }}
                >
                  <Card
                    className={`relative group overflow-hidden p-6 rounded-2xl border border-white/20 bg-white/6 shadow-2xl transition-transform transform hover:-translate-y-1 hover:scale-[1.01] dark:border-white/40 dark:bg-black/20 scroll-animate-scale ${delayClass}`}
                  >
                    {/* Glow + Frosted + Noise */}
                    <div className="absolute inset-0 rounded-2xl pointer-events-none transition-all duration-300 bg-gradient-to-tr from-white/5 to-white/10 opacity-0 group-hover:opacity-100 blur-xl"></div>
                    <div className="relative z-10 text-center">
                      <Icon className="h-8 w-8 text-primary mb-4 mx-auto" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground text-sm text-pretty">
                        {feature.desc}
                      </p>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        className="py-20 scroll-animate"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto max-w-2xl text-center scroll-animate scroll-animate-delay-1"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.15 }}
          >
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
              Ready to transform your manufacturing operations?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground text-pretty">
              Join thousands of manufacturing teams who trust ManufactureOS to
              streamline their operations and drive innovation.
            </p>
            <motion.div
              className="mt-8 flex items-center justify-center gap-x-6 scroll-animate scroll-animate-delay-2"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
            >
              <Button asChild size="lg" className="h-12 px-8">
                <Link href="/auth?mode=signup">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="relative group overflow-hidden p-6 rounded-1.125rem border border-white/20 bg-white/6 shadow-2xl transition-transform transform hover: hover:scale-[1.01] dark:border-white/40 dark:bg-black/20"
              >
                <Link href="#contact">Contact Sales</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Separator Line */}
      <motion.hr
        className="border-t border-border/20 mx-auto max-w-6xl"
        initial={{ opacity: 0, scaleX: 0 }}
        whileInView={{ opacity: 1, scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />

      {/* Footer */}
      <motion.footer
        className="border-t border-border/40 py-12 bg-muted/30 scroll-animate"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8 scroll-animate scroll-animate-delay-1">
            {/* Company Info */}
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <Factory className="h-6 w-6 text-primary" />
                <span className="font-semibold text-foreground">
                  ManufactureOS
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Comprehensive manufacturing management platform for modern
                operations.
              </p>
              {/* Social Media */}
              <div className="flex space-x-4">
                <Link
                  href="https://twitter.com"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Twitter className="h-5 w-5" />
                  <span className="sr-only">Twitter</span>
                </Link>
                <Link
                  href="https://linkedin.com"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Linkedin className="h-5 w-5" />
                  <span className="sr-only">LinkedIn</span>
                </Link>
                <Link
                  href="https://github.com"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Github className="h-5 w-5" />
                  <span className="sr-only">GitHub</span>
                </Link>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4">
                Product
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/features"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/integrations"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Integrations
                  </Link>
                </li>
                <li>
                  <Link
                    href="/api"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    API
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4">
                Company
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/about"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/careers"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Careers
                  </Link>
                </li>
                <li>
                  <Link
                    href="/news"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    News
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources Links */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4">
                Resources
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/docs"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link
                    href="/help"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link
                    href="/blog"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="/community"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Community
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4">
                Contact
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  support@manufactureos.com
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  +1 (555) 123-4567
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  123 Manufacturing St, Tech City
                </p>
              </div>
            </div>
          </div>

          {/* Industry Stats */}
          <div className="border-t border-border/40 pt-8 mb-8 scroll-animate scroll-animate-delay-2">
            <div className="text-center max-w-2xl mx-auto">
              <h3 className="text-sm font-semibold text-foreground mb-4">
                Trusted by Industry Leaders
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">500+</p>
                  <p className="text-xs text-muted-foreground">Manufacturers</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">1M+</p>
                  <p className="text-xs text-muted-foreground">
                    Orders Processed
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">99.9%</p>
                  <p className="text-xs text-muted-foreground">Uptime</p>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Badges  */}
          <div className="border-t border-border/40 pt-8 mb-8 scroll-animate scroll-animate-delay-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Trust Badges */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-4">
                  Security & Compliance
                </h3>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    <span>SOC 2 Certified</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Lock className="h-4 w-4" />
                    <span>GDPR Compliant</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Award className="h-4 w-4" />
                    <span>ISO 9001</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Legal & Copyright */}
          <div className="border-t border-border/40 pt-6 scroll-animate scroll-animate-delay-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                <Link
                  href="/privacy"
                  className="hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/terms"
                  className="hover:text-foreground transition-colors"
                >
                  Terms of Service
                </Link>
                <Link
                  href="/security"
                  className="hover:text-foreground transition-colors"
                >
                  Security
                </Link>
                <Link
                  href="/cookies"
                  className="hover:text-foreground transition-colors"
                >
                  Cookie Policy
                </Link>
              </div>
              <p className="text-sm text-muted-foreground">
                © 2025 ManufactureOS. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
