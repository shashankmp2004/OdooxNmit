"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Download, Filter, TrendingUp, Clock, CheckCircle, AlertTriangle } from "lucide-react"
import { format, subDays, subMonths } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts"

// Mock data for charts
const ordersCompletionData = [
  { week: "Week 1", completed: 24, delayed: 3 },
  { week: "Week 2", completed: 28, delayed: 2 },
  { week: "Week 3", completed: 32, delayed: 5 },
  { week: "Week 4", completed: 26, delayed: 4 },
  { week: "Week 5", completed: 30, delayed: 2 },
  { week: "Week 6", completed: 35, delayed: 3 },
]

const resourceUtilizationData = [
  { name: "Welding Station A", value: 87, color: "#3b82f6" },
  { name: "Assembly Line B", value: 92, color: "#10b981" },
  { name: "CNC Machine 3", value: 78, color: "#f59e0b" },
  { name: "QC Station 1", value: 65, color: "#ef4444" },
  { name: "Electrical Station", value: 83, color: "#8b5cf6" },
]

const productionOutputData = [
  { month: "Jan", output: 1200, target: 1100 },
  { month: "Feb", output: 1350, target: 1200 },
  { month: "Mar", output: 1180, target: 1250 },
  { month: "Apr", output: 1420, target: 1300 },
  { month: "May", output: 1380, target: 1350 },
  { month: "Jun", output: 1520, target: 1400 },
]

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subMonths(new Date(), 1),
    to: new Date(),
  })
  const [productFilter, setProductFilter] = useState("all")
  const [workCenterFilter, setWorkCenterFilter] = useState("all")
  const { toast } = useToast()
  const { user } = useAuth()

  const handleDateRangeChange = (range: "7d" | "30d" | "90d" | "custom") => {
    const now = new Date()
    switch (range) {
      case "7d":
        setDateRange({ from: subDays(now, 7), to: now })
        break
      case "30d":
        setDateRange({ from: subDays(now, 30), to: now })
        break
      case "90d":
        setDateRange({ from: subDays(now, 90), to: now })
        break
    }
  }

  const handleDownloadReport = (format: "pdf" | "excel") => {
    toast({
      title: "Report Download Started",
      description: `Generating ${format.toUpperCase()} report...`,
    })
    setTimeout(() => {
      toast({
        title: "Report Ready",
        description: `Your ${format.toUpperCase()} report has been downloaded.`,
      })
    }, 2000)
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-foreground font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <ProtectedRoute allowedRoles={["Manager", "Admin"]}>
      <div className="flex h-screen bg-background">
        <Sidebar userRole={user?.role} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Reports & Analytics" userName={`${user?.name} (${user?.role})`} />
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-card border-border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">175</div>
                    <p className="text-xs text-green-400 mt-1">+12% from last month</p>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Lead Time</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">4.2 days</div>
                    <p className="text-xs text-green-400 mt-1">-0.3 days from last month</p>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">On-Time Delivery</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">94.2%</div>
                    <p className="text-xs text-green-400 mt-1">+2.1% from last month</p>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Quality Score</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">98.7%</div>
                    <p className="text-xs text-green-400 mt-1">+0.5% from last month</p>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                      {/* Date Range Quick Filters */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDateRangeChange("7d")}
                          className="bg-background border-input"
                        >
                          Last 7 days
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDateRangeChange("30d")}
                          className="bg-background border-input"
                        >
                          Last 30 days
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDateRangeChange("90d")}
                          className="bg-background border-input"
                        >
                          Last 90 days
                        </Button>
                      </div>

                      {/* Custom Date Range */}
                      <div className="flex items-center gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-32 justify-start text-left font-normal bg-background border-input",
                                !dateRange.from && "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dateRange.from ? format(dateRange.from, "MMM dd") : "Start date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={dateRange.from}
                              onSelect={(date) => date && setDateRange({ ...dateRange, from: date })}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>

                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-32 justify-start text-left font-normal bg-background border-input",
                                !dateRange.to && "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dateRange.to ? format(dateRange.to, "MMM dd") : "End date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={dateRange.to}
                              onSelect={(date) => date && setDateRange({ ...dateRange, to: date })}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Product Filter */}
                      <Select value={productFilter} onValueChange={setProductFilter}>
                        <SelectTrigger className="w-48 bg-background border-input">
                          <Filter className="mr-2 h-4 w-4" />
                          <SelectValue placeholder="All Products" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Products</SelectItem>
                          <SelectItem value="steel-frame">Steel Frame Assembly</SelectItem>
                          <SelectItem value="hydraulic-pump">Hydraulic Pump Unit</SelectItem>
                          <SelectItem value="control-panel">Control Panel Board</SelectItem>
                          <SelectItem value="motor-housing">Motor Housing</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Work Center Filter */}
                      <Select value={workCenterFilter} onValueChange={setWorkCenterFilter}>
                        <SelectTrigger className="w-48 bg-background border-input">
                          <SelectValue placeholder="All Work Centers" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Work Centers</SelectItem>
                          <SelectItem value="welding-a">Welding Station A</SelectItem>
                          <SelectItem value="assembly-b">Assembly Line B</SelectItem>
                          <SelectItem value="cnc-3">CNC Machine 3</SelectItem>
                          <SelectItem value="qc-1">QC Station 1</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Download Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleDownloadReport("excel")}
                        className="bg-background border-input"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Excel
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleDownloadReport("pdf")}
                        className="bg-background border-input"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Orders Completed vs Delayed */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">Orders Completed vs. Delayed (Weekly)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={ordersCompletionData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="week" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="completed" fill="#10b981" name="Completed" />
                        <Bar dataKey="delayed" fill="#ef4444" name="Delayed" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Resource Utilization */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">Resource Utilization by Work Center</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={resourceUtilizationData}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}%`}
                        >
                          {resourceUtilizationData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Production Output Chart */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Production Output Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={productionOutputData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="output"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        name="Actual Output"
                        dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="target"
                        stroke="#10b981"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="Target Output"
                        dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Summary Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground">Production Efficiency</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground mb-2">92.4%</div>
                    <div className="text-sm text-muted-foreground">
                      Average across all work centers for the selected period
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground">Cost per Unit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground mb-2">$247.50</div>
                    <div className="text-sm text-green-400">-$12.30 from last period</div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground">Defect Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground mb-2">1.3%</div>
                    <div className="text-sm text-green-400">-0.2% from last period</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
