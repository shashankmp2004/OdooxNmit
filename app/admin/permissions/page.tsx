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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trash2,
  Edit,
  Plus,
  Search,
  Shield,
  Users,
  Settings,
  Eye,
  Lock,
  Unlock,
  Check,
  X,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";

interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "OPERATOR" | "INVENTORY";
  createdAt: string;
  updatedAt: string;
}

interface Permission {
  key: string;
  name: string;
  description: string;
  category: string;
}

interface RolePermissions {
  role: string;
  permissions: string[];
}

const roles = [
  {
    value: "ADMIN",
    label: "Administrator",
    description: "Full system access",
    color: "bg-red-500",
  },
  {
    value: "MANAGER",
    label: "Manager",
    description: "Management operations",
    color: "bg-blue-500",
  },
  {
    value: "OPERATOR",
    label: "Operator",
    description: "Production operations",
    color: "bg-green-500",
  },
  {
    value: "INVENTORY",
    label: "Inventory",
    description: "Stock management",
    color: "bg-yellow-500",
  },
];

const permissionCategories = [
  {
    category: "Manufacturing Orders",
    permissions: [
      {
        key: "canCreateMO",
        name: "Create Manufacturing Orders",
        description: "Create new production orders",
      },
      {
        key: "canViewMO",
        name: "View Manufacturing Orders",
        description: "View manufacturing order details",
      },
      {
        key: "canEditMO",
        name: "Edit Manufacturing Orders",
        description: "Modify manufacturing orders",
      },
      {
        key: "canDeleteMO",
        name: "Delete Manufacturing Orders",
        description: "Remove manufacturing orders",
      },
    ],
  },
  {
    category: "Work Orders",
    permissions: [
      {
        key: "canCreateWO",
        name: "Create Work Orders",
        description: "Create new work orders",
      },
      {
        key: "canViewWO",
        name: "View Work Orders",
        description: "View work order details",
      },
      {
        key: "canEditWO",
        name: "Edit Work Orders",
        description: "Modify work orders",
      },
      {
        key: "canDeleteWO",
        name: "Delete Work Orders",
        description: "Remove work orders",
      },
    ],
  },
  {
    category: "Products & BOM",
    permissions: [
      {
        key: "canCreateProduct",
        name: "Create Products",
        description: "Create new products and BOMs",
      },
      {
        key: "canViewProduct",
        name: "View Products",
        description: "View product information",
      },
      {
        key: "canEditProduct",
        name: "Edit Products",
        description: "Modify product details",
      },
      {
        key: "canDeleteProduct",
        name: "Delete Products",
        description: "Remove products",
      },
    ],
  },
  {
    category: "Stock Management",
    permissions: [
      {
        key: "canViewStock",
        name: "View Stock",
        description: "View inventory levels",
      },
      {
        key: "canManualStockAdjustment",
        name: "Manual Stock Adjustment",
        description: "Manually adjust inventory",
      },
    ],
  },
  {
    category: "User Management",
    permissions: [
      {
        key: "canManageUsers",
        name: "Manage Users",
        description: "Create, edit, and delete users",
      },
      {
        key: "canViewUsers",
        name: "View Users",
        description: "View user information",
      },
    ],
  },
  {
    category: "Reports",
    permissions: [
      {
        key: "canViewReports",
        name: "View Reports",
        description: "Access system reports",
      },
      {
        key: "canExportReports",
        name: "Export Reports",
        description: "Export report data",
      },
    ],
  },
];

// Default role permissions based on the auth.ts file
const defaultRolePermissions = {
  ADMIN: [
    "canCreateMO",
    "canViewMO",
    "canEditMO",
    "canDeleteMO",
    "canCreateWO",
    "canViewWO",
    "canEditWO",
    "canDeleteWO",
    "canCreateProduct",
    "canViewProduct",
    "canEditProduct",
    "canDeleteProduct",
    "canViewStock",
    "canManualStockAdjustment",
    "canManageUsers",
    "canViewUsers",
    "canViewReports",
    "canExportReports",
  ],
  MANAGER: [
    "canCreateMO",
    "canViewMO",
    "canEditMO",
    "canCreateWO",
    "canViewWO",
    "canEditWO",
    "canDeleteWO",
    "canCreateProduct",
    "canViewProduct",
    "canEditProduct",
    "canViewUsers",
    "canViewReports",
    "canExportReports",
  ],
  OPERATOR: ["canViewMO", "canViewWO", "canEditWO", "canViewProduct"],
  INVENTORY: [
    "canViewMO",
    "canViewProduct",
    "canViewStock",
    "canManualStockAdjustment",
    "canViewReports",
  ],
};

export default function PermissionsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("roles");
  const [selectedUserForRole, setSelectedUserForRole] = useState<User | null>(
    null
  );
  const [isChangeRoleDialogOpen, setIsChangeRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch users",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangeUserRole = async () => {
    if (!selectedUserForRole || !newRole) return;

    try {
      const response = await fetch(
        `/api/admin/users/${selectedUserForRole.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role: newRole,
          }),
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: `User role updated to ${newRole}`,
        });
        setIsChangeRoleDialogOpen(false);
        setSelectedUserForRole(null);
        setNewRole("");
        fetchUsers();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to update user role",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating user role:", error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const openChangeRoleDialog = (user: User) => {
    setSelectedUserForRole(user);
    setNewRole(user.role);
    setIsChangeRoleDialogOpen(true);
  };

  const getRoleBadgeColor = (role: string) => {
    const roleConfig = roles.find((r) => r.value === role);
    return roleConfig?.color || "bg-gray-500";
  };

  const getRoleDescription = (role: string) => {
    const roleConfig = roles.find((r) => r.value === role);
    return roleConfig?.description || "";
  };

  const hasPermission = (role: string, permission: string): boolean => {
    return (
      defaultRolePermissions[
        role as keyof typeof defaultRolePermissions
      ]?.includes(permission) || false
    );
  };

  // Filter users based on search and role
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !searchTerm ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = selectedRole === "all" || user.role === selectedRole;

    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Roles & Permissions</h1>
            <p className="text-gray-600">
              Manage user roles and system permissions
            </p>
          </div>
        </div>
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">Loading permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Roles & Permissions</h1>
          <p className="text-gray-600">
            Manage user roles and system permissions
          </p>
        </div>
        <ThemeToggle />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {roles.map((role) => {
          const count = users.filter((u) => u.role === role.value).length;
          return (
            <Card key={role.value}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {role.label}
                </CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
                <p className="text-xs text-muted-foreground">
                  {role.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="roles">Role Overview</TabsTrigger>
          <TabsTrigger value="users">User Roles</TabsTrigger>
          <TabsTrigger value="permissions">Permissions Matrix</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Roles</CardTitle>
              <CardDescription>
                Overview of all user roles and their basic permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {roles.map((role) => (
                  <div key={role.value} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Badge className={`text-white ${role.color}`}>
                          {role.label}
                        </Badge>
                        <span className="font-medium">{role.description}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {users.filter((u) => u.role === role.value).length}{" "}
                        users
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {defaultRolePermissions[
                        role.value as keyof typeof defaultRolePermissions
                      ]?.length || 0}{" "}
                      permissions assigned
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardContent>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>User Roles ({filteredUsers.length})</CardTitle>
              <CardDescription>
                Manage individual user role assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Current Role</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge
                          className={`text-white ${getRoleBadgeColor(
                            user.role
                          )}`}
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {defaultRolePermissions[user.role]?.length || 0}{" "}
                          permissions
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openChangeRoleDialog(user)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Change Role
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Permissions Matrix</CardTitle>
              <CardDescription>
                View all permissions assigned to each role
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {permissionCategories.map((category) => (
                  <div key={category.category}>
                    <h3 className="text-lg font-semibold mb-3">
                      {category.category}
                    </h3>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-1/3">Permission</TableHead>
                            {roles.map((role) => (
                              <TableHead
                                key={role.value}
                                className="text-center"
                              >
                                <Badge
                                  className={`text-white ${role.color} text-xs`}
                                >
                                  {role.value}
                                </Badge>
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {category.permissions.map((permission) => (
                            <TableRow key={permission.key}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">
                                    {permission.name}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {permission.description}
                                  </div>
                                </div>
                              </TableCell>
                              {roles.map((role) => (
                                <TableCell
                                  key={role.value}
                                  className="text-center"
                                >
                                  {hasPermission(role.value, permission.key) ? (
                                    <Check className="h-5 w-5 text-green-500 mx-auto" />
                                  ) : (
                                    <X className="h-5 w-5 text-red-500 mx-auto" />
                                  )}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Change Role Dialog */}
      <Dialog
        open={isChangeRoleDialogOpen}
        onOpenChange={setIsChangeRoleDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for {selectedUserForRole?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="role">New Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${role.color}`}
                        ></div>
                        {role.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {newRole && (
              <div className="text-sm text-muted-foreground">
                <strong>Permissions:</strong>{" "}
                {defaultRolePermissions[
                  newRole as keyof typeof defaultRolePermissions
                ]?.length || 0}{" "}
                permissions will be assigned
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsChangeRoleDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleChangeUserRole}>Update Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
