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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, RefreshCw, Search, Eye, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";

interface TableInfo {
  tableName: string;
  recordCount: number;
}

interface QueryResult {
  data: any[];
  columns: string[];
  recordCount: number;
}

// Dynamic table loading - no hardcoded list needed

export default function DatabaseViewerPage() {
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [tableData, setTableData] = useState<QueryResult | null>(null);
  const [tablesInfo, setTablesInfo] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(50);
  const [customQuery, setCustomQuery] = useState("");

  useEffect(() => {
    fetchTablesInfo();
  }, []);

  const fetchTablesInfo = async () => {
    try {
      const response = await fetch("/api/admin/database/tables");
      if (response.ok) {
        const data = await response.json();
        setTablesInfo(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch database information",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching tables info:", error);
      toast({
        title: "Error",
        description: "Failed to fetch database information",
        variant: "destructive",
      });
    }
  };

  const fetchTableData = async (tableName: string, page: number = 1) => {
    setLoading(true);
    try {
      const offset = (page - 1) * recordsPerPage;
      const response = await fetch(
        `/api/admin/database/query?table=${tableName}&limit=${recordsPerPage}&offset=${offset}&search=${encodeURIComponent(
          searchTerm
        )}`
      );

      if (response.ok) {
        const data = await response.json();
        setTableData(data);
        setCurrentPage(page);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch table data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching table data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch table data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const executeCustomQuery = async () => {
    if (!customQuery.trim()) {
      toast({
        title: "Error",
        description: "Please enter a query",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/database/custom-query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: customQuery }),
      });

      if (response.ok) {
        const data = await response.json();
        setTableData(data);
        setCurrentPage(1);
      } else {
        const error = await response.json();
        toast({
          title: "Query Error",
          description: error.error || "Failed to execute query",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error executing custom query:", error);
      toast({
        title: "Error",
        description: "Failed to execute query",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportTableData = async () => {
    if (!selectedTable) {
      toast({
        title: "Error",
        description: "Please select a table first",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/database/export?table=${selectedTable}`
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${selectedTable}_export.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast({
          title: "Success",
          description: "Data exported successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to export data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      });
    }
  };

  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName);
    setTableData(null);
    setCurrentPage(1);
    setSearchTerm("");
    fetchTableData(tableName);
  };

  const handleSearch = () => {
    if (selectedTable) {
      fetchTableData(selectedTable, 1);
    }
  };

  const handlePageChange = (page: number) => {
    if (selectedTable) {
      fetchTableData(selectedTable, page);
    }
  };

  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined) {
      return "-";
    }
    if (typeof value === "object") {
      return JSON.stringify(value);
    }
    if (typeof value === "boolean") {
      return value ? "true" : "false";
    }
    if (
      value instanceof Date ||
      (typeof value === "string" && value.includes("T") && value.includes("Z"))
    ) {
      return new Date(value).toLocaleString();
    }
    return String(value);
  };

  const totalPages = tableData
    ? Math.ceil(tableData.recordCount / recordsPerPage)
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Database Viewer</h1>
          <p className="text-gray-600">
            Direct access to database tables and records
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <ThemeToggle />
          <Button variant="outline" onClick={fetchTablesInfo}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={exportTableData}
            disabled={!selectedTable}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      <Tabs defaultValue="tables" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tables">Tables</TabsTrigger>
          <TabsTrigger value="query">Custom Query</TabsTrigger>
        </TabsList>

        <TabsContent value="tables" className="space-y-6">
          {/* Database Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tablesInfo.map((table) => (
              <Card
                key={table.tableName}
                className={`group cursor-pointer transition-all duration-200 relative overflow-hidden ${
                  selectedTable === table.tableName
                    ? "ring-2 ring-primary border-primary/30"
                    : "hover:shadow-md border-border"
                }`}
                onClick={() => handleTableSelect(table.tableName)}
              >
                {/* Glassmorphism background for hover and selected states */}
                <div
                  className={`absolute inset-0 transition-opacity duration-200 ${
                    selectedTable === table.tableName
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-xl"></div>
                  {/* White noise overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="w-full h-full opacity-[0.07] bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAIAAADYYG7QAAAACXBIWXMAAAsSAAALEgHS3X78AAAAU0lEQVR4nO3PMQEAAAQAMM5f9F3HChYk0gkk0gkk0gkk0gkk0gkk0gkk0gkk0gkk0gkk0gkk0gkk0gkk0gkk0gkk0gkk0gkk0gkk0gkk0gkk0gkk0gkk0gnkJ7MEIJmP0XZZAAAAAElFTkSuQmCC')] bg-repeat"></div>
                  </div>
                </div>

                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                  <CardTitle
                    className={`text-lg font-medium transition-colors ${
                      selectedTable === table.tableName
                        ? "text-primary"
                        : "text-foreground"
                    }`}
                  >
                    {table.tableName}
                  </CardTitle>
                  <Database
                    className={`h-5 w-5 transition-colors ${
                      selectedTable === table.tableName
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                </CardHeader>
                <CardContent className="relative z-10">
                  <div
                    className={`text-2xl font-bold transition-colors ${
                      selectedTable === table.tableName
                        ? "text-primary"
                        : "text-foreground"
                    }`}
                  >
                    {table.recordCount}
                  </div>
                  <p
                    className={`text-xs transition-colors ${
                      selectedTable === table.tableName
                        ? "text-primary/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    records
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Table Data Viewer */}
          {selectedTable && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{selectedTable} Data</CardTitle>
                    <CardDescription>
                      Viewing {tableData?.recordCount || 0} total records
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search records..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Button onClick={handleSearch} disabled={loading}>
                      Search
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : tableData && tableData.data.length > 0 ? (
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {tableData.columns.map((column) => (
                              <TableHead
                                key={column}
                                className="whitespace-nowrap"
                              >
                                {column}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tableData.data.map((row, index) => (
                            <TableRow key={index}>
                              {tableData.columns.map((column) => (
                                <TableCell
                                  key={column}
                                  className="max-w-xs truncate"
                                >
                                  {formatCellValue(row[column])}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          Showing {(currentPage - 1) * recordsPerPage + 1} to{" "}
                          {Math.min(
                            currentPage * recordsPerPage,
                            tableData.recordCount
                          )}{" "}
                          of {tableData.recordCount} results
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            Previous
                          </Button>
                          <div className="flex items-center gap-1">
                            {Array.from(
                              { length: Math.min(5, totalPages) },
                              (_, i) => {
                                const page =
                                  Math.max(
                                    1,
                                    Math.min(totalPages - 4, currentPage - 2)
                                  ) + i;
                                return (
                                  <Button
                                    key={page}
                                    variant={
                                      page === currentPage
                                        ? "default"
                                        : "outline"
                                    }
                                    size="sm"
                                    onClick={() => handlePageChange(page)}
                                  >
                                    {page}
                                  </Button>
                                );
                              }
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No data found
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="query" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Custom Database Query</CardTitle>
              <CardDescription>
                Execute custom Prisma queries (read-only operations only)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="query">Query</Label>
                <textarea
                  id="query"
                  className="w-full h-32 p-3 border rounded-md font-mono text-sm"
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  placeholder={`Example queries:
- SELECT * FROM "User" WHERE role = 'ADMIN'
- SELECT COUNT(*) FROM "Product"
- SELECT * FROM "ManufacturingOrder" WHERE state = 'IN_PROGRESS'`}
                />
              </div>
              <Button onClick={executeCustomQuery} disabled={loading}>
                <Eye className="w-4 h-4 mr-2" />
                Execute Query
              </Button>
            </CardContent>
          </Card>

          {/* Query Results */}
          {tableData && (
            <Card>
              <CardHeader>
                <CardTitle>Query Results</CardTitle>
                <CardDescription>
                  {tableData.recordCount} records returned
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tableData.data.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {tableData.columns.map((column) => (
                            <TableHead
                              key={column}
                              className="whitespace-nowrap"
                            >
                              {column}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tableData.data.map((row, index) => (
                          <TableRow key={index}>
                            {tableData.columns.map((column) => (
                              <TableCell
                                key={column}
                                className="max-w-xs truncate"
                              >
                                {formatCellValue(row[column])}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No results returned
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
