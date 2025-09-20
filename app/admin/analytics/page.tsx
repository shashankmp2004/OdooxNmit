"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Area,
  AreaChart,
} from "recharts";
import {
  Users,
  Package,
  Factory,
  Wrench,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  Calendar,
  Clock,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";

interface AnalyticsData {
  users: {
    total: number;
    byRole: Array<{ role: string; count: number }>;
    recentSignups: number;
  };
  products: {
    total: number;
    lowStock: number;
    categories: Array<{ category: string; count: number }>;
  };
  manufacturing: {
    activeOrders: number;
    completedThisMonth: number;
    pendingWork: number;
    inProgressWork: number;
  };
  stock: {
    totalValue: number;
    movements: number;
    alerts: number;
  };
}

interface TimeSeriesData {
  date: string;
  users: number;
  orders: number;
  production: number;
}

interface ProductionMetrics {
  efficiency: number;
  onTimeDelivery: number;
  workOrderCompletion: number;
  stockTurnover: number;
}

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7c7c", "#8dd1e1"];

export default function AdminAnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [productionMetrics, setProductionMetrics] =
    useState<ProductionMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState("30");

  useEffect(() => {
    fetchAnalyticsData();
    fetchTimeSeriesData();
    fetchProductionMetrics();
  }, [selectedTimeRange]);

  const fetchAnalyticsData = async () => {
    try {
      const response = await fetch("/api/admin/stats");
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch analytics data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeSeriesData = async () => {
    try {
      const response = await fetch(
        `/api/admin/analytics/time-series?days=${selectedTimeRange}`
      );
      if (response.ok) {
        const data = await response.json();
        setTimeSeriesData(data);
      }
    } catch (error) {
      console.error("Error fetching time series data:", error);
    }
  };

  const fetchProductionMetrics = async () => {
    try {
      const response = await fetch(
        `/api/admin/analytics/production-metrics?days=${selectedTimeRange}`
      );
      if (response.ok) {
        const data = await response.json();
        setProductionMetrics(data);
      }
    } catch (error) {
      console.error("Error fetching production metrics:", error);
    }
  };

  const exportAnalytics = async () => {
    try {
      const response = await fetch("/api/admin/analytics/export");
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `analytics_report_${
          new Date().toISOString().split("T")[0]
        }.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast({
          title: "Success",
          description: "Analytics report exported successfully",
        });
      }
    } catch (error) {
      console.error("Error exporting analytics:", error);
      toast({
        title: "Error",
        description: "Failed to export analytics",
        variant: "destructive",
      });
    }
  };

  if (loading || !analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-600">
            Comprehensive system performance and insights
          </p>
        </div>
        <div className="flex gap-2">
          <ThemeToggle />
          <Select
            value={selectedTimeRange}
            onValueChange={setSelectedTimeRange}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportAnalytics} variant="outline">
            Export Report
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-fit">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsData.users.total}
                </div>
                <p className="text-xs text-muted-foreground">
                  +{analyticsData.users.recentSignups} this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsData.products.total}
                </div>
                <p className="text-xs text-muted-foreground">
                  {analyticsData.products.lowStock} low stock alerts
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Orders
                </CardTitle>
                <Factory className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsData.manufacturing.activeOrders}
                </div>
                <p className="text-xs text-muted-foreground">
                  {analyticsData.manufacturing.completedThisMonth} completed
                  this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Work Orders
                </CardTitle>
                <Wrench className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsData.manufacturing.inProgressWork}
                </div>
                <p className="text-xs text-muted-foreground">
                  {analyticsData.manufacturing.pendingWork} pending
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Roles Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>User Roles Distribution</CardTitle>
                <CardDescription>Distribution of users by role</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.users.byRole}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ role, count }) => `${role}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analyticsData.users.byRole.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Product Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Product Categories</CardTitle>
                <CardDescription>Products by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.products.categories}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Time Series Chart */}
          {timeSeriesData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Activity Trends</CardTitle>
                <CardDescription>System activity over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stackId="1"
                      stroke="#8884d8"
                      fill="#8884d8"
                    />
                    <Area
                      type="monotone"
                      dataKey="orders"
                      stackId="1"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                    />
                    <Area
                      type="monotone"
                      dataKey="production"
                      stackId="1"
                      stroke="#ffc658"
                      fill="#ffc658"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="production" className="space-y-6">
          {/* Production Metrics */}
          {productionMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Efficiency
                  </CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {productionMetrics.efficiency}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Production efficiency
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    On-Time Delivery
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {productionMetrics.onTimeDelivery}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Orders delivered on time
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Work Order Completion
                  </CardTitle>
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {productionMetrics.workOrderCompletion}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Completion rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Stock Turnover
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {productionMetrics.stockTurnover}x
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Inventory turnover
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Production Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Manufacturing Order Status</CardTitle>
                <CardDescription>
                  Current status of manufacturing orders
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Badge className="bg-blue-500">PLANNED</Badge>
                      Planned Orders
                    </span>
                    <span className="font-semibold">12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Badge className="bg-orange-500">IN_PROGRESS</Badge>
                      In Progress
                    </span>
                    <span className="font-semibold">
                      {analyticsData.manufacturing.activeOrders}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Badge className="bg-green-500">DONE</Badge>
                      Completed
                    </span>
                    <span className="font-semibold">
                      {analyticsData.manufacturing.completedThisMonth}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Work Order Progress</CardTitle>
                <CardDescription>Work order status breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Badge className="bg-yellow-500">PENDING</Badge>
                      Pending
                    </span>
                    <span className="font-semibold">
                      {analyticsData.manufacturing.pendingWork}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Badge className="bg-blue-500">STARTED</Badge>
                      In Progress
                    </span>
                    <span className="font-semibold">
                      {analyticsData.manufacturing.inProgressWork}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Badge className="bg-green-500">COMPLETED</Badge>
                      Completed
                    </span>
                    <span className="font-semibold">45</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          {/* Inventory Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Stock Movements
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsData.stock.movements}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total transactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Low Stock Alerts
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {analyticsData.stock.alerts}
                </div>
                <p className="text-xs text-muted-foreground">
                  Products below threshold
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Stock Value
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${analyticsData.stock.totalValue.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total inventory value
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Inventory Charts */}
          <Card>
            <CardHeader>
              <CardTitle>Stock Level Trends</CardTitle>
              <CardDescription>Inventory levels over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="production"
                    stroke="#8884d8"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Order Processing Time</span>
                  <Badge variant="secondary">2.3 days avg</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Work Order Completion Rate</span>
                  <Badge variant="secondary">92%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>System Uptime</span>
                  <Badge variant="secondary">99.8%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>User Satisfaction</span>
                  <Badge variant="secondary">4.7/5</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system activities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">5 new products added today</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">12 work orders completed</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm">3 stock alerts triggered</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm">2 new users registered</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
