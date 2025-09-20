"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Settings,
  Database,
  Users,
  Bell,
  Shield,
  Clock,
  Download,
  Upload,
  Trash2,
  Save,
  RefreshCw,
  AlertTriangle,
  Check,
  Info,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";

interface SystemSettings {
  general: {
    companyName: string;
    companyAddress: string;
    timezone: string;
    dateFormat: string;
    currency: string;
    language: string;
  };
  manufacturing: {
    defaultWorkOrderPriority: string;
    autoCreateWorkOrders: boolean;
    stockConsumptionMethod: string;
    qualityControlRequired: boolean;
    defaultLeadTime: number;
  };
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    lowStockAlerts: boolean;
    overdueOrderAlerts: boolean;
    systemMaintenanceAlerts: boolean;
  };
  security: {
    sessionTimeout: number;
    passwordMinLength: number;
    requireTwoFactor: boolean;
    allowMultipleSessions: boolean;
    auditLogging: boolean;
  };
  system: {
    backupFrequency: string;
    dataRetentionDays: number;
    maintenanceMode: boolean;
    debugMode: boolean;
    performanceLogging: boolean;
  };
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    general: {
      companyName: "ManufactureOS",
      companyAddress: "",
      timezone: "UTC",
      dateFormat: "MM/DD/YYYY",
      currency: "USD",
      language: "en",
    },
    manufacturing: {
      defaultWorkOrderPriority: "MEDIUM",
      autoCreateWorkOrders: true,
      stockConsumptionMethod: "FIFO",
      qualityControlRequired: false,
      defaultLeadTime: 7,
    },
    notifications: {
      emailEnabled: true,
      smsEnabled: false,
      lowStockAlerts: true,
      overdueOrderAlerts: true,
      systemMaintenanceAlerts: true,
    },
    security: {
      sessionTimeout: 480,
      passwordMinLength: 8,
      requireTwoFactor: false,
      allowMultipleSessions: true,
      auditLogging: true,
    },
    system: {
      backupFrequency: "daily",
      dataRetentionDays: 365,
      maintenanceMode: false,
      debugMode: false,
      performanceLogging: false,
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [systemStats, setSystemStats] = useState({
    dbSize: "0 MB",
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    lastBackup: "Never",
    uptime: "0 days",
    version: "1.0.0",
  });

  useEffect(() => {
    fetchSettings();
    fetchSystemStats();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings");
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemStats = async () => {
    try {
      const response = await fetch("/api/admin/system-stats");
      if (response.ok) {
        const data = await response.json();
        setSystemStats(data);
      }
    } catch (error) {
      console.error("Error fetching system stats:", error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Settings saved successfully",
        });
      } else {
        throw new Error("Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const createBackup = async () => {
    try {
      const response = await fetch("/api/admin/backup", { method: "POST" });
      if (response.ok) {
        toast({
          title: "Success",
          description: "Database backup created successfully",
        });
        fetchSystemStats();
      } else {
        throw new Error("Failed to create backup");
      }
    } catch (error) {
      console.error("Error creating backup:", error);
      toast({
        title: "Error",
        description: "Failed to create backup",
        variant: "destructive",
      });
    }
  };

  const clearCache = async () => {
    try {
      const response = await fetch("/api/admin/cache", { method: "DELETE" });
      if (response.ok) {
        toast({
          title: "Success",
          description: "System cache cleared successfully",
        });
      } else {
        throw new Error("Failed to clear cache");
      }
    } catch (error) {
      console.error("Error clearing cache:", error);
      toast({
        title: "Error",
        description: "Failed to clear cache",
        variant: "destructive",
      });
    }
  };

  const updateSetting = (
    section: keyof SystemSettings,
    key: string,
    value: any
  ) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  if (loading) {
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
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-gray-600">
            Configure system-wide settings and preferences
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <ThemeToggle />
          <Button onClick={saveSettings} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid grid-cols-6 w-fit">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="manufacturing">Manufacturing</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                Basic company and system information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={settings.general.companyName}
                    onChange={(e) =>
                      updateSetting("general", "companyName", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={settings.general.timezone}
                    onValueChange={(value) =>
                      updateSetting("general", "timezone", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">
                        Eastern Time
                      </SelectItem>
                      <SelectItem value="America/Chicago">
                        Central Time
                      </SelectItem>
                      <SelectItem value="America/Denver">
                        Mountain Time
                      </SelectItem>
                      <SelectItem value="America/Los_Angeles">
                        Pacific Time
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="companyAddress">Company Address</Label>
                <Textarea
                  id="companyAddress"
                  value={settings.general.companyAddress}
                  onChange={(e) =>
                    updateSetting("general", "companyAddress", e.target.value)
                  }
                  placeholder="Enter company address..."
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select
                    value={settings.general.dateFormat}
                    onValueChange={(value) =>
                      updateSetting("general", "dateFormat", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={settings.general.currency}
                    onValueChange={(value) =>
                      updateSetting("general", "currency", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="JPY">JPY (¥)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={settings.general.language}
                    onValueChange={(value) =>
                      updateSetting("general", "language", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manufacturing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Manufacturing Settings</CardTitle>
              <CardDescription>
                Configure production and manufacturing parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="defaultPriority">
                    Default Work Order Priority
                  </Label>
                  <Select
                    value={settings.manufacturing.defaultWorkOrderPriority}
                    onValueChange={(value) =>
                      updateSetting(
                        "manufacturing",
                        "defaultWorkOrderPriority",
                        value
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="stockMethod">Stock Consumption Method</Label>
                  <Select
                    value={settings.manufacturing.stockConsumptionMethod}
                    onValueChange={(value) =>
                      updateSetting(
                        "manufacturing",
                        "stockConsumptionMethod",
                        value
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIFO">
                        FIFO (First In, First Out)
                      </SelectItem>
                      <SelectItem value="LIFO">
                        LIFO (Last In, First Out)
                      </SelectItem>
                      <SelectItem value="AVERAGE">Average Cost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="defaultLeadTime">
                  Default Lead Time (days)
                </Label>
                <Input
                  id="defaultLeadTime"
                  type="number"
                  value={settings.manufacturing.defaultLeadTime}
                  onChange={(e) =>
                    updateSetting(
                      "manufacturing",
                      "defaultLeadTime",
                      parseInt(e.target.value)
                    )
                  }
                  min="1"
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="autoWorkOrders">
                      Auto-create Work Orders
                    </Label>
                    <p className="text-sm text-gray-500">
                      Automatically create work orders when manufacturing orders
                      are confirmed
                    </p>
                  </div>
                  <Switch
                    id="autoWorkOrders"
                    checked={settings.manufacturing.autoCreateWorkOrders}
                    onCheckedChange={(checked) =>
                      updateSetting(
                        "manufacturing",
                        "autoCreateWorkOrders",
                        checked
                      )
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="qualityControl">
                      Quality Control Required
                    </Label>
                    <p className="text-sm text-gray-500">
                      Require quality control approval before completing work
                      orders
                    </p>
                  </div>
                  <Switch
                    id="qualityControl"
                    checked={settings.manufacturing.qualityControlRequired}
                    onCheckedChange={(checked) =>
                      updateSetting(
                        "manufacturing",
                        "qualityControlRequired",
                        checked
                      )
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure system notifications and alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailNotifications">
                      Email Notifications
                    </Label>
                    <p className="text-sm text-gray-500">
                      Enable email notifications for system alerts
                    </p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={settings.notifications.emailEnabled}
                    onCheckedChange={(checked) =>
                      updateSetting("notifications", "emailEnabled", checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="smsNotifications">SMS Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Enable SMS notifications for critical alerts
                    </p>
                  </div>
                  <Switch
                    id="smsNotifications"
                    checked={settings.notifications.smsEnabled}
                    onCheckedChange={(checked) =>
                      updateSetting("notifications", "smsEnabled", checked)
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="lowStockAlerts">Low Stock Alerts</Label>
                    <p className="text-sm text-gray-500">
                      Notify when product stock falls below minimum levels
                    </p>
                  </div>
                  <Switch
                    id="lowStockAlerts"
                    checked={settings.notifications.lowStockAlerts}
                    onCheckedChange={(checked) =>
                      updateSetting("notifications", "lowStockAlerts", checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="overdueAlerts">Overdue Order Alerts</Label>
                    <p className="text-sm text-gray-500">
                      Notify when orders are past their deadline
                    </p>
                  </div>
                  <Switch
                    id="overdueAlerts"
                    checked={settings.notifications.overdueOrderAlerts}
                    onCheckedChange={(checked) =>
                      updateSetting(
                        "notifications",
                        "overdueOrderAlerts",
                        checked
                      )
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="maintenanceAlerts">
                      System Maintenance Alerts
                    </Label>
                    <p className="text-sm text-gray-500">
                      Notify users about scheduled maintenance
                    </p>
                  </div>
                  <Switch
                    id="maintenanceAlerts"
                    checked={settings.notifications.systemMaintenanceAlerts}
                    onCheckedChange={(checked) =>
                      updateSetting(
                        "notifications",
                        "systemMaintenanceAlerts",
                        checked
                      )
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure security and access control settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sessionTimeout">
                    Session Timeout (minutes)
                  </Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.security.sessionTimeout}
                    onChange={(e) =>
                      updateSetting(
                        "security",
                        "sessionTimeout",
                        parseInt(e.target.value)
                      )
                    }
                    min="30"
                    max="1440"
                  />
                </div>
                <div>
                  <Label htmlFor="passwordLength">
                    Minimum Password Length
                  </Label>
                  <Input
                    id="passwordLength"
                    type="number"
                    value={settings.security.passwordMinLength}
                    onChange={(e) =>
                      updateSetting(
                        "security",
                        "passwordMinLength",
                        parseInt(e.target.value)
                      )
                    }
                    min="6"
                    max="50"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="twoFactor">
                      Require Two-Factor Authentication
                    </Label>
                    <p className="text-sm text-gray-500">
                      Require 2FA for all admin accounts
                    </p>
                  </div>
                  <Switch
                    id="twoFactor"
                    checked={settings.security.requireTwoFactor}
                    onCheckedChange={(checked) =>
                      updateSetting("security", "requireTwoFactor", checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="multipleSessions">
                      Allow Multiple Sessions
                    </Label>
                    <p className="text-sm text-gray-500">
                      Allow users to be logged in from multiple devices
                    </p>
                  </div>
                  <Switch
                    id="multipleSessions"
                    checked={settings.security.allowMultipleSessions}
                    onCheckedChange={(checked) =>
                      updateSetting(
                        "security",
                        "allowMultipleSessions",
                        checked
                      )
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auditLogging">Audit Logging</Label>
                    <p className="text-sm text-gray-500">
                      Log all user actions for security auditing
                    </p>
                  </div>
                  <Switch
                    id="auditLogging"
                    checked={settings.security.auditLogging}
                    onCheckedChange={(checked) =>
                      updateSetting("security", "auditLogging", checked)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>
                Configure system behavior and performance settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="backupFrequency">Backup Frequency</Label>
                  <Select
                    value={settings.system.backupFrequency}
                    onValueChange={(value) =>
                      updateSetting("system", "backupFrequency", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dataRetention">Data Retention (days)</Label>
                  <Input
                    id="dataRetention"
                    type="number"
                    value={settings.system.dataRetentionDays}
                    onChange={(e) =>
                      updateSetting(
                        "system",
                        "dataRetentionDays",
                        parseInt(e.target.value)
                      )
                    }
                    min="30"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                    <p className="text-sm text-gray-500">
                      Put the system in maintenance mode
                    </p>
                  </div>
                  <Switch
                    id="maintenanceMode"
                    checked={settings.system.maintenanceMode}
                    onCheckedChange={(checked) =>
                      updateSetting("system", "maintenanceMode", checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="debugMode">Debug Mode</Label>
                    <p className="text-sm text-gray-500">
                      Enable detailed logging for troubleshooting
                    </p>
                  </div>
                  <Switch
                    id="debugMode"
                    checked={settings.system.debugMode}
                    onCheckedChange={(checked) =>
                      updateSetting("system", "debugMode", checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="performanceLogging">
                      Performance Logging
                    </Label>
                    <p className="text-sm text-gray-500">
                      Log performance metrics for optimization
                    </p>
                  </div>
                  <Switch
                    id="performanceLogging"
                    checked={settings.system.performanceLogging}
                    onCheckedChange={(checked) =>
                      updateSetting("system", "performanceLogging", checked)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          {/* System Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>System Statistics</CardTitle>
              <CardDescription>
                Current system status and statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {systemStats.totalUsers}
                  </div>
                  <div className="text-sm text-gray-500">Total Users</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {systemStats.totalProducts}
                  </div>
                  <div className="text-sm text-gray-500">Total Products</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {systemStats.totalOrders}
                  </div>
                  <div className="text-sm text-gray-500">Total Orders</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{systemStats.dbSize}</div>
                  <div className="text-sm text-gray-500">Database Size</div>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <strong>System Version:</strong> {systemStats.version}
                </div>
                <div>
                  <strong>Uptime:</strong> {systemStats.uptime}
                </div>
                <div>
                  <strong>Last Backup:</strong> {systemStats.lastBackup}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Maintenance Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Actions</CardTitle>
              <CardDescription>
                Perform system maintenance and backup operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Database Operations</Label>
                  <div className="space-y-2">
                    <Button
                      onClick={createBackup}
                      className="w-full"
                      variant="outline"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Create Database Backup
                    </Button>
                    <Button
                      onClick={clearCache}
                      className="w-full"
                      variant="outline"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Clear System Cache
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>System Operations</Label>
                  <div className="space-y-2">
                    <Button
                      onClick={fetchSystemStats}
                      className="w-full"
                      variant="outline"
                    >
                      <Info className="h-4 w-4 mr-2" />
                      Refresh System Stats
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full">
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Reset System Settings
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Reset System Settings
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This will reset all system settings to their default
                            values. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              toast({
                                title: "Settings Reset",
                                description:
                                  "System settings have been reset to defaults",
                              });
                            }}
                          >
                            Reset Settings
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
