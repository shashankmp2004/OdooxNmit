"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, Clock, CheckCircle, AlertTriangle, Upload, FileText } from "lucide-react"
import { subMonths } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { FileUpload } from "@/components/file-upload"
import { ReportsFilterBar } from "@/components/reports-filter-bar"
import { DateRange } from "@/components/ui/date-range-picker"
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

// Define TypeScript interfaces for API responses
interface OrderAnalytics {
  week: string
  completed: number
  delayed: number
}

interface UtilizationData {
  name: string
  value: number
  color: string
  [key: string]: any
}

interface ProductionData {
  month: string
  output: number
  target: number
}

interface AnalyticsSummary {
  kpis: {
    totalOrders: { value: number; change: number; trend: string }
    avgLeadTime: { value: number; change: number; trend: string; unit: string }
    onTimeDelivery: { value: number; change: number; trend: string; unit: string }
    qualityScore: { value: number; change: number; trend: string; unit: string }
  }
  summary: {
    productionEfficiency: { value: number; unit: string }
    costPerUnit: { value: number; change: number; trend: string; unit: string }
    defectRate: { value: number; change: number; trend: string; unit: string }
  }
}

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subMonths(new Date(), 1),
    to: new Date(),
  })
  const [productFilter, setProductFilter] = useState("all")
  const [workCenterFilter, setWorkCenterFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  
  // State for real data
  const [ordersData, setOrdersData] = useState<OrderAnalytics[]>([])
  const [utilizationData, setUtilizationData] = useState<UtilizationData[]>([])
  const [productionData, setProductionData] = useState<ProductionData[]>([])
  const [analyticsData, setAnalyticsData] = useState<AnalyticsSummary | null>(null)
  const [filterOptions, setFilterOptions] = useState<{
    products: Array<{id: string, name: string, sku: string}>
    workCenters: Array<{id: string, name: string}>
  }>({ products: [], workCenters: [] })
  
  const { toast } = useToast()
  const { data: session } = useAuth()

  // Fetch all analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true)
        
        const [ordersRes, utilizationRes, productionRes, summaryRes, filtersRes] = await Promise.all([
          fetch("/api/analytics/orders"),
          fetch("/api/analytics/utilization"),
          fetch("/api/analytics/production"),
          fetch("/api/analytics/summary"),
          fetch("/api/analytics/filters"),
        ])

        if (ordersRes.ok) {
          const orders = await ordersRes.json()
          setOrdersData(Array.isArray(orders) ? orders : [])
        }

        if (utilizationRes.ok) {
          const utilization = await utilizationRes.json()
          setUtilizationData(Array.isArray(utilization) ? utilization : [])
        }

        if (productionRes.ok) {
          const production = await productionRes.json()
          setProductionData(Array.isArray(production) ? production : [])
        }

        if (summaryRes.ok) {
          const summary = await summaryRes.json()
          setAnalyticsData(summary)
        }

        if (filtersRes.ok) {
          const filters = await filtersRes.json()
          setFilterOptions(filters)
        }
      } catch (error) {
        console.error("Error fetching analytics data:", error)
        toast({
          title: "Error",
          description: "Failed to load analytics data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAnalyticsData()
  }, [])

  // Date range changes handled by ReportsFilterBar

  const handleDownloadReport = async (format: "pdf" | "excel") => {
    try {
      toast({
        title: "Report Download Started",
        description: `Generating ${format.toUpperCase()} report...`,
      })

      const downloadUrl = format === "excel"
        ? "/api/reports/template"
        : "/api/reports/sample-pdf"

      const res = await fetch(downloadUrl)
      if (!res.ok) throw new Error(`Download failed (${res.status})`)

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)

      const disposition = res.headers.get('content-disposition') || ''
      const match = disposition.match(/filename="?([^";]+)"?/i)
      const fallbackName = format === 'excel'
        ? 'manufacturing_reports_template.xlsx'
        : 'manufacturing_reports_sample.pdf'
      const filename = match?.[1] || fallbackName

      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)

      toast({
        title: "Report Ready",
        description: `Your ${format.toUpperCase()} report has been downloaded.`,
      })
    } catch (err: any) {
      console.error('Download error:', err)
      toast({
        title: "Download failed",
        description: err?.message || `Could not download ${format.toUpperCase()} report`,
        variant: "destructive",
      })
    }
  }

  const handleFileUpload = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/reports/upload', {
        method: 'POST',
        body: formData,
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }
      
      toast({
        title: "File Upload Successful",
        description: `Processed ${result.recordCount} records from ${result.filename}`,
      })
      
      // Optionally refresh analytics data here
      
    } catch (error) {
      console.error('Upload error:', error)
      throw error // Re-throw to let FileUpload component handle it
    }
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
    <ProtectedRoute allowedRoles={["MANAGER", "ADMIN"]}>
      <div className="flex h-screen bg-background">
        <Sidebar userRole={session?.user?.role} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Reports & Analytics" userName={`${session?.user?.name} (${session?.user?.role})`} />
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
                    {loading ? (
                      <div className="text-2xl font-bold text-foreground">Loading...</div>
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-foreground">
                          {analyticsData?.kpis.totalOrders.value || 0}
                        </div>
                        <p className={`text-xs mt-1 ${
                          (analyticsData?.kpis.totalOrders.change || 0) >= 0 ? "text-green-400" : "text-red-400"
                        }`}>
                          {(analyticsData?.kpis.totalOrders.change || 0) >= 0 ? "+" : ""}
                          {(analyticsData?.kpis.totalOrders.change || 0).toFixed(1)}% from last month
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Lead Time</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-2xl font-bold text-foreground">Loading...</div>
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-foreground">
                          {analyticsData?.kpis.avgLeadTime.value || 0} {analyticsData?.kpis.avgLeadTime.unit || "days"}
                        </div>
                        <p className={`text-xs mt-1 ${
                          (analyticsData?.kpis.avgLeadTime.change || 0) <= 0 ? "text-green-400" : "text-red-400"
                        }`}>
                          {(analyticsData?.kpis.avgLeadTime.change || 0).toFixed(1)} days from last month
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">On-Time Delivery</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-2xl font-bold text-foreground">Loading...</div>
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-foreground">
                          {analyticsData?.kpis.onTimeDelivery.value || 0}{analyticsData?.kpis.onTimeDelivery.unit || "%"}
                        </div>
                        <p className={`text-xs mt-1 ${
                          (analyticsData?.kpis.onTimeDelivery.change || 0) >= 0 ? "text-green-400" : "text-red-400"
                        }`}>
                          {(analyticsData?.kpis.onTimeDelivery.change || 0) >= 0 ? "+" : ""}
                          {(analyticsData?.kpis.onTimeDelivery.change || 0).toFixed(1)}% from last month
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Quality Score</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-2xl font-bold text-foreground">Loading...</div>
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-foreground">
                          {analyticsData?.kpis.qualityScore.value || 0}{analyticsData?.kpis.qualityScore.unit || "%"}
                        </div>
                        <p className={`text-xs mt-1 ${
                          (analyticsData?.kpis.qualityScore.change || 0) >= 0 ? "text-green-400" : "text-red-400"
                        }`}>
                          {(analyticsData?.kpis.qualityScore.change || 0) >= 0 ? "+" : ""}
                          {(analyticsData?.kpis.qualityScore.change || 0).toFixed(1)}% from last month
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <Card className="bg-card border-border overflow-hidden">
                <CardContent className="p-4">
                  <ReportsFilterBar
                    products={filterOptions.products}
                    workCenters={filterOptions.workCenters}
                    value={dateRange as DateRange}
                    onChange={(r) => setDateRange({ from: r.from || dateRange.from, to: r.to || dateRange.to })}
                    productValue={productFilter}
                    onProductChange={setProductFilter}
                    workCenterValue={workCenterFilter}
                    onWorkCenterChange={setWorkCenterFilter}
                  />
                </CardContent>
              </Card>

              {/* File Import Section */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Import Data from Files
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col lg:flex-row gap-4 items-start">
                    <div className="flex-1">
                      <FileUpload
                        onFileUpload={handleFileUpload}
                        title="Import Manufacturing Data"
                        description="Upload Excel (.xlsx, .xls) or PDF files to import manufacturing data"
                        className="max-w-2xl"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-2 lg:min-w-48">
                      <p className="text-sm font-medium text-foreground mb-2">Download Templates:</p>
                      <Button
                        variant="default"
                        onClick={() => handleDownloadReport("excel")}
                        className="justify-start bg-yellow-500 text-black hover:bg-yellow-400 active:scale-[0.98] transition-transform shadow-sm hover:shadow"
                        size="sm"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Excel Template
                      </Button>
                      <Button
                        variant="default"
                        onClick={() => handleDownloadReport("pdf")}
                        className="justify-start bg-yellow-500 text-black hover:bg-yellow-400 active:scale-[0.98] transition-transform shadow-sm hover:shadow"
                        size="sm"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Sample PDF
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
                      <BarChart data={ordersData}>
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
                          data={utilizationData}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}%`}
                        >
                          {utilizationData.map((entry: UtilizationData, index: number) => (
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
                    <LineChart data={productionData}>
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
                    {loading ? (
                      <div className="text-2xl font-bold text-foreground mb-2">Loading...</div>
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-foreground mb-2">
                          {analyticsData?.summary.productionEfficiency.value || 0}
                          {analyticsData?.summary.productionEfficiency.unit || "%"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Average across all work centers for the selected period
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground">Cost per Unit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-2xl font-bold text-foreground mb-2">Loading...</div>
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-foreground mb-2">
                          {analyticsData?.summary.costPerUnit.unit || "$"}
                          {analyticsData?.summary.costPerUnit.value || 0}
                        </div>
                        <div className={`text-sm ${
                          (analyticsData?.summary.costPerUnit.change || 0) <= 0 ? "text-green-400" : "text-red-400"
                        }`}>
                          {analyticsData?.summary.costPerUnit.unit || "$"}
                          {(analyticsData?.summary.costPerUnit.change || 0).toFixed(2)} from last period
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground">Defect Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-2xl font-bold text-foreground mb-2">Loading...</div>
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-foreground mb-2">
                          {analyticsData?.summary.defectRate.value || 0}
                          {analyticsData?.summary.defectRate.unit || "%"}
                        </div>
                        <div className={`text-sm ${
                          (analyticsData?.summary.defectRate.change || 0) <= 0 ? "text-green-400" : "text-red-400"
                        }`}>
                          {(analyticsData?.summary.defectRate.change || 0).toFixed(1)}% from last period
                        </div>
                      </>
                    )}
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
