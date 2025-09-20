import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Factory, BarChart3, Users, Shield, Zap } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2">
              <Factory className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">ManufactureOS</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
              <Link href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
                About
              </Link>
              <Button asChild variant="outline" size="sm">
                <Link href="/auth">Sign In</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/auth">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-6">
              <Zap className="mr-2 h-3 w-3" />
              {"Streamline your manufacturing operations"}
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl text-balance">
              The complete platform to <span className="text-primary">optimize manufacturing</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto text-pretty">
              {
                "Your team's toolkit to stop configuring and start innovating. Securely manage, track, and scale your manufacturing operations with real-time insights."
              }
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button asChild size="lg" className="h-12 px-8">
                <Link href="/auth">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-8 bg-transparent">
                <Link href="#demo">Watch Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-border/40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">85%</div>
              <div className="text-sm text-muted-foreground">faster order processing</div>
              <div className="mt-2 text-xs text-muted-foreground font-mono">SIEMENS</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">40%</div>
              <div className="text-sm text-muted-foreground">reduction in downtime</div>
              <div className="mt-2 text-xs text-muted-foreground font-mono">BOEING</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">200%</div>
              <div className="text-sm text-muted-foreground">increase in efficiency</div>
              <div className="mt-2 text-xs text-muted-foreground font-mono">TOYOTA</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">3x</div>
              <div className="text-sm text-muted-foreground">faster to deploy</div>
              <div className="mt-2 text-xs text-muted-foreground font-mono">FORD</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
              Make operations seamless.{" "}
              <span className="text-muted-foreground">
                Tools for your team and stakeholders to collaborate and iterate faster.
              </span>
            </h2>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-8">
              <Card className="p-8 bg-card/50 border-border/50">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <BarChart3 className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Real-time Analytics</h3>
                    <p className="text-muted-foreground text-pretty">
                      Monitor production metrics, track KPIs, and get instant insights into your manufacturing
                      operations with comprehensive dashboards.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-8 bg-card/50 border-border/50">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Role-based Access</h3>
                    <p className="text-muted-foreground text-pretty">
                      Secure, role-based dashboards for managers, operators, and inventory teams. Each user sees exactly
                      what they need to be productive.
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column - Feature Preview */}
            <div className="relative">
              <Card className="p-6 bg-card/30 border-border/30">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-foreground">Production Overview</h4>
                    <Badge variant="secondary">Live</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-background/50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-primary">94%</div>
                      <div className="text-sm text-muted-foreground">Efficiency</div>
                    </div>
                    <div className="bg-background/50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-chart-2">127</div>
                      <div className="text-sm text-muted-foreground">Active Orders</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Production Line A</span>
                      <Badge className="bg-status-completed/20 text-status-completed border-status-completed/30">
                        Running
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Production Line B</span>
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
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
              Faster operations. <span className="text-muted-foreground">More innovation.</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground text-pretty">
              The platform for rapid progress. Let your team focus on building products instead of managing
              infrastructure with automated workflows and integrated collaboration.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <Card className="p-6 bg-card/50 border-border/50">
              <Shield className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Enterprise Security</h3>
              <p className="text-muted-foreground text-sm text-pretty">
                Bank-grade security with role-based access control, audit trails, and compliance reporting for
                manufacturing standards.
              </p>
            </Card>

            <Card className="p-6 bg-card/50 border-border/50">
              <Zap className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Automated Workflows</h3>
              <p className="text-muted-foreground text-sm text-pretty">
                Streamline operations with automated work order routing, inventory alerts, and production scheduling.
              </p>
            </Card>

            <Card className="p-6 bg-card/50 border-border/50">
              <BarChart3 className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Advanced Analytics</h3>
              <p className="text-muted-foreground text-sm text-pretty">
                Make data-driven decisions with comprehensive reporting, predictive analytics, and performance insights.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
              Ready to transform your manufacturing operations?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground text-pretty">
              Join thousands of manufacturing teams who trust ManufactureOS to streamline their operations and drive
              innovation.
            </p>
            <div className="mt-8 flex items-center justify-center gap-x-6">
              <Button asChild size="lg" className="h-12 px-8">
                <Link href="/auth">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-8 bg-transparent">
                <Link href="#contact">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Factory className="h-6 w-6 text-primary" />
              <span className="font-semibold text-foreground">ManufactureOS</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2025 ManufactureOS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
