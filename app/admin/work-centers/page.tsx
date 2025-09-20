"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Trash2,
  Edit,
  Plus,
  Search,
  Settings,
  Activity,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";

interface WorkCenter {
  id: string;
  name: string;
  location: string;
  description: string | null;
  capacity: number;
  status: "AVAILABLE" | "BUSY" | "MAINTENANCE" | "OFFLINE";
  currentUtilization: number;
  createdAt: string;
  updatedAt: string;
  _count: {
    workOrders: number;
  };
}

const statuses = ["AVAILABLE", "BUSY", "MAINTENANCE", "OFFLINE"];

export default function WorkCentersPage() {
  const [workCenters, setWorkCenters] = useState<WorkCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [editingWorkCenter, setEditingWorkCenter] = useState<WorkCenter | null>(
    null
  );
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    description: "",
    capacity: "",
    status: "AVAILABLE",
  });

  useEffect(() => {
    fetchWorkCenters();
  }, []);

  const fetchWorkCenters = async () => {
    try {
      const response = await fetch("/api/admin/work-centers");
      if (response.ok) {
        const data = await response.json();
        setWorkCenters(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch work centers",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching work centers:", error);
      toast({
        title: "Error",
        description: "Failed to fetch work centers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkCenter = async () => {
    try {
      const response = await fetch("/api/admin/work-centers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          capacity: parseInt(formData.capacity),
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Work center created successfully",
        });
        setIsCreateDialogOpen(false);
        setFormData({
          name: "",
          location: "",
          description: "",
          capacity: "",
          status: "AVAILABLE",
        });
        fetchWorkCenters();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to create work center",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating work center:", error);
      toast({
        title: "Error",
        description: "Failed to create work center",
        variant: "destructive",
      });
    }
  };

  const handleUpdateWorkCenter = async () => {
    if (!editingWorkCenter) return;

    try {
      const response = await fetch(
        `/api/admin/work-centers/${editingWorkCenter.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            capacity: parseInt(formData.capacity),
          }),
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Work center updated successfully",
        });
        setIsEditDialogOpen(false);
        setEditingWorkCenter(null);
        setFormData({
          name: "",
          location: "",
          description: "",
          capacity: "",
          status: "AVAILABLE",
        });
        fetchWorkCenters();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to update work center",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating work center:", error);
      toast({
        title: "Error",
        description: "Failed to update work center",
        variant: "destructive",
      });
    }
  };

  const handleDeleteWorkCenter = async (id: string) => {
    if (!confirm("Are you sure you want to delete this work center?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/work-centers/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Work center deleted successfully",
        });
        fetchWorkCenters();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to delete work center",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting work center:", error);
      toast({
        title: "Error",
        description: "Failed to delete work center",
        variant: "destructive",
      });
    }
  };

  const openCreateDialog = () => {
    setFormData({
      name: "",
      location: "",
      description: "",
      capacity: "",
      status: "AVAILABLE",
    });
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (workCenter: WorkCenter) => {
    setEditingWorkCenter(workCenter);
    setFormData({
      name: workCenter.name,
      location: workCenter.location,
      description: workCenter.description || "",
      capacity: workCenter.capacity.toString(),
      status: workCenter.status,
    });
    setIsEditDialogOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return <CheckCircle className="h-4 w-4" />;
      case "BUSY":
        return <Activity className="h-4 w-4" />;
      case "MAINTENANCE":
        return <Settings className="h-4 w-4" />;
      case "OFFLINE":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-500";
      case "BUSY":
        return "bg-blue-500";
      case "MAINTENANCE":
        return "bg-yellow-500";
      case "OFFLINE":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  // Filter work centers based on search and status
  const filteredWorkCenters = workCenters.filter((workCenter) => {
    const matchesSearch =
      !searchTerm ||
      workCenter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workCenter.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedStatus === "all" || workCenter.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Work Centers</h1>
            <p className="text-gray-600">
              Manage production facilities and their capacity
            </p>
          </div>
        </div>
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">Loading work centers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Work Centers</h1>
          <p className="text-gray-600">
            Manage production facilities and their capacity
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <ThemeToggle />
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Create Work Center
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Work Center</DialogTitle>
                <DialogDescription>
                  Create a new production facility
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Work Center Name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      placeholder="Location/Area"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="capacity">Capacity (units/hour) *</Label>
                    <Input
                      id="capacity"
                      type="number"
                      min="1"
                      value={formData.capacity}
                      onChange={(e) =>
                        setFormData({ ...formData, capacity: e.target.value })
                      }
                      placeholder="Production capacity"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Optional description..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateWorkCenter}>
                  Create Work Center
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Centers</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workCenters.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {workCenters.filter((wc) => wc.status === "AVAILABLE").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Busy</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {workCenters.filter((wc) => wc.status === "BUSY").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Capacity
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workCenters.reduce((sum, wc) => sum + wc.capacity, 0)} u/h
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search work centers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Work Centers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Work Centers ({filteredWorkCenters.length})</CardTitle>
          <CardDescription>
            Manage your production facilities and monitor their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Utilization</TableHead>
                <TableHead>Active Orders</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWorkCenters.map((workCenter) => (
                <TableRow key={workCenter.id}>
                  <TableCell className="font-medium">
                    {workCenter.name}
                  </TableCell>
                  <TableCell>{workCenter.location}</TableCell>
                  <TableCell>
                    <Badge
                      className={`text-white ${getStatusBadgeColor(
                        workCenter.status
                      )} flex items-center gap-1 w-fit`}
                    >
                      {getStatusIcon(workCenter.status)}
                      {workCenter.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{workCenter.capacity} units/hour</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 w-16">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${Math.min(
                              workCenter.currentUtilization,
                              100
                            )}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {workCenter.currentUtilization}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{workCenter._count.workOrders}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(workCenter)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteWorkCenter(workCenter.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Work Center</DialogTitle>
            <DialogDescription>Update work center details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Work Center Name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="Location/Area"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-capacity">Capacity (units/hour) *</Label>
                <Input
                  id="edit-capacity"
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({ ...formData, capacity: e.target.value })
                  }
                  placeholder="Production capacity"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Optional description..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateWorkCenter}>Update Work Center</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
