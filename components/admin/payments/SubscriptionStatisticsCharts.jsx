'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { format, subMonths, addDays, eachMonthOfInterval, subYears } from 'date-fns';
import { 
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  Calendar, RefreshCw, TrendingUp, TrendingDown, 
  AlertTriangle, CheckCircle2, BarChart4, PieChart as PieChartIcon,
  Clock, Filter, Download, Calendar as CalendarIcon,
  ArrowUpDown, MoreHorizontal, ArrowUp, ArrowDown
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useSubscriptionStatistics } from '@/hooks/admin/useAdminPayment';

// Import DataTable components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

/**
 * Subscription statistics charts component showing various subscription metrics
 */
export default function SubscriptionStatisticsCharts() {
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeFrame, setTimeFrame] = useState('all');
  
  // Get subscription statistics
  const { statistics, loading, error, refreshStatistics } = useSubscriptionStatistics();
  
  // Handle hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // COLORS for charts
  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
  
  // Format numbers with commas
  const formatNumber = (number) => {
    if (number === undefined || number === null) return '—';
    return number.toLocaleString();
  };
  
  // Format as percentage
  const formatPercentage = (value) => {
    if (value === undefined || value === null) return '—';
    return `${value.toFixed(1)}%`;
  };
  
  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-md">
          <p className="font-medium mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="flex items-center text-sm">
              <span 
                className="w-3 h-3 mr-2 rounded-full" 
                style={{ backgroundColor: entry.color }}
              ></span>
              <span>{entry.name}: {entry.formatter ? entry.formatter(entry.value) : entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  // Prepare data for subscription status chart
  const statusChartData = useMemo(() => {
    if (!statistics || !statistics.subscription_counts) return [];
    
    const { active, expiring_soon, expired, cancelled } = statistics.subscription_counts;
    
    return [
      { name: 'Active', value: active || 0, color: COLORS[0] },
      { name: 'Expiring Soon', value: expiring_soon || 0, color: COLORS[3] },
      { name: 'Expired', value: expired || 0, color: COLORS[1] },
      { name: 'Cancelled', value: cancelled || 0, color: COLORS[2] }
    ].filter(item => item.value > 0);
  }, [statistics, COLORS]);
  
  // Prepare data for plan statistics chart
  const planChartData = useMemo(() => {
    if (!statistics || !statistics.plan_statistics) return [];
    
    return (statistics.plan_statistics || []).map((plan, index) => ({
      name: plan.plan_name,
      value: plan.count,
      color: COLORS[index % COLORS.length],
      percentage: plan.percentage || 0,
      type: plan.plan_name.toLowerCase().includes('basic') ? 'Basic' : 
            plan.plan_name.toLowerCase().includes('premium') ? 'Premium' : 
            plan.plan_name.toLowerCase().includes('free') ? 'Free' : 
            'Standard'
    }));
  }, [statistics, COLORS]);
  
  // Generate mock trend data for subscription growth
  const generateTrendData = useCallback(() => {
    const end = new Date();
    const start = subYears(end, 1);
    
    const months = eachMonthOfInterval({ start, end });
    
    // Generate mock data with a realistic growth trend
    let baseValue = 10;
    const data = months.map((month, index) => {
      // Create a realistic growth pattern with some randomness
      const growthRate = 0.05 + (Math.random() * 0.1); // 5-15% growth
      baseValue = baseValue * (1 + growthRate);
      
      return {
        date: month,
        name: format(month, 'MMM yy'),
        value: Math.round(baseValue),
        // Add a seasonal pattern
        active: Math.round(baseValue * (0.7 + (Math.sin(index) * 0.1))),
        new: Math.round(baseValue * 0.2 * (1 + (Math.cos(index) * 0.5))),
        cancelled: Math.round(baseValue * 0.05 * (1 + (Math.sin(index + 2) * 0.3)))
      };
    });
    
    // Filter based on timeframe
    if (timeFrame === '3m') {
      return data.slice(-3);
    } else if (timeFrame === '6m') {
      return data.slice(-6);
    }
    
    return data;
  }, [timeFrame]);
  
  // Subscription growth trend data
  const trendData = useMemo(() => generateTrendData(), [generateTrendData]);
  
  // Calculate churn rate (mock data)
  const churnRate = useMemo(() => {
    if (trendData.length < 2) return 0;
    
    const lastMonth = trendData[trendData.length - 1];
    const previousMonth = trendData[trendData.length - 2];
    
    if (!previousMonth.active || previousMonth.active === 0) return 0;
    
    return (previousMonth.cancelled / previousMonth.active) * 100;
  }, [trendData]);
  
  // Generate mock data for expiring subscriptions
  const expiringSubscriptionsData = useMemo(() => {
    // Mock data - in a real application this would come from the API
    return Array(5).fill(null).map((_, i) => {
      const expiryDate = addDays(new Date(), i + 1);
      return {
        id: `sub-${i+1}`,
        planName: ['Basic Plan', 'Premium Plan', 'Enterprise Plan'][Math.floor(Math.random() * 3)],
        landlordName: ['John Doe', 'Jane Smith', 'Robert Johnson', 'Sarah Williams', 'David Brown'][i],
        expiryDate,
        daysLeft: i + 1
      };
    });
  }, []);

  // Plan DataTable setup
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});

  // Define columns for plan DataTable
  const planColumns = useMemo(() => [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Plan
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center">
          <span 
            className="h-3 w-3 rounded-full mr-2"
            style={{ backgroundColor: row.original.color }}
          ></span>
          <span className="font-medium">{row.getValue("name")}</span>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Type
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.getValue("type")}
        </Badge>
      ),
    },
    {
      accessorKey: "value",
      header: ({ column }) => (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Subscriptions
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-right font-medium">
          {formatNumber(row.getValue("value"))}
        </div>
      ),
    },
    {
      accessorKey: "percentage",
      header: ({ column }) => (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Percentage
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-right font-medium">
          {formatPercentage(row.getValue("percentage"))}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(row.original.name)}
                >
                  Copy plan name
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>View details</DropdownMenuItem>
                <DropdownMenuItem>View subscribers</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ], []);

  // Setup plan table
  const planTable = useReactTable({
    data: planChartData,
    columns: planColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  // Define columns for expiring subscriptions DataTable
  const expiringColumns = useMemo(() => [
    {
      accessorKey: "landlordName",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Landlord
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-medium">{row.getValue("landlordName")}</div>,
    },
    {
      accessorKey: "planName",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Plan
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <Badge variant="outline">{row.getValue("planName")}</Badge>
      ),
    },
    {
      accessorKey: "expiryDate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Expiry Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center">
          <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
          {format(row.getValue("expiryDate"), 'PPP')}
        </div>
      ),
      sortingFn: (rowA, rowB) => {
        const dateA = rowA.getValue("expiryDate");
        const dateB = rowB.getValue("expiryDate");
        return dateA.getTime() - dateB.getTime();
      },
    },
    {
      accessorKey: "daysLeft",
      header: ({ column }) => (
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Days Left
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => {
        const daysLeft = row.getValue("daysLeft");
        return (
          <div className="text-center">
            <Badge className={
              daysLeft <= 1 ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
              daysLeft <= 3 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300' :
              'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
            }>
              {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
            </Badge>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        return (
          <div className="text-right">
            <Button variant="outline" size="sm">
              Renew
            </Button>
          </div>
        );
      },
    },
  ], []);

  // Setup expiring subscriptions table
  const expiringTable = useReactTable({
    data: expiringSubscriptionsData,
    columns: expiringColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <Card className="p-5">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h2 className="text-xl font-bold">Subscription Analytics</h2>
        
        <div className="flex items-center gap-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mr-2">
            <TabsList>
              <TabsTrigger value="overview">
                <BarChart4 className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="trends">
                <TrendingUp className="h-4 w-4 mr-2" />
                Trends
              </TabsTrigger>
              <TabsTrigger value="expiring">
                <Clock className="h-4 w-4 mr-2" />
                Expiring
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          {activeTab === 'trends' && (
            <Select value={timeFrame} onValueChange={setTimeFrame}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Time frame" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="6m">Last 6 months</SelectItem>
                <SelectItem value="3m">Last 3 months</SelectItem>
              </SelectContent>
            </Select>
          )}
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={refreshStatistics}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="p-4 bg-error-50 text-error-700 rounded-md mb-6">
          <AlertTriangle className="h-5 w-5 inline-block mr-2" />
          Failed to load subscription statistics. Please try again.
        </div>
      )}
      
      {/* Main Content Area */}
      <div className="space-y-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Top Cards - Subscription Status */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))
              ) : (
                <>
                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
                    <div className="flex justify-between items-start">
                      <div className="text-sm text-blue-700 dark:text-blue-300">Active</div>
                      <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-2">
                      {formatNumber(statistics?.subscription_counts?.active)}
                    </div>
                  </div>
                  
                  <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg border border-amber-200 dark:border-amber-900">
                    <div className="flex justify-between items-start">
                      <div className="text-sm text-amber-700 dark:text-amber-300">Expiring Soon</div>
                      <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-2">
                      {formatNumber(statistics?.subscription_counts?.expiring_soon)}
                    </div>
                  </div>
                  
                  <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg border border-red-200 dark:border-red-900">
                    <div className="flex justify-between items-start">
                      <div className="text-sm text-red-700 dark:text-red-300">Expired</div>
                      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="text-2xl font-bold text-red-700 dark:text-red-300 mt-2">
                      {formatNumber(statistics?.subscription_counts?.expired)}
                    </div>
                  </div>
                  
                  <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-start">
                      <div className="text-sm text-gray-700 dark:text-gray-300">Cancelled</div>
                      <XCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="text-2xl font-bold text-gray-700 dark:text-gray-300 mt-2">
                      {formatNumber(statistics?.subscription_counts?.cancelled)}
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Subscription Status Chart */}
              <div>
                <h3 className="text-lg font-medium mb-4">Subscription Status Distribution</h3>
                <div className="h-[300px]">
                  {loading ? (
                    <Skeleton className="h-full w-full" />
                  ) : isClient && statusChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                        >
                          {statusChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => formatNumber(value)} 
                          contentStyle={{ 
                            backgroundColor: 'rgb(var(--card-bg))', 
                            borderColor: 'rgb(var(--card-border))' 
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      No subscription status data available
                    </div>
                  )}
                </div>
              </div>
              
              {/* Plan Distribution Chart */}
              <div>
                <h3 className="text-lg font-medium mb-4">Plan Distribution</h3>
                <div className="h-[300px]">
                  {loading ? (
                    <Skeleton className="h-full w-full" />
                  ) : isClient && planChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={planChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={formatNumber} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" name="Subscriptions">
                          {planChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      No plan distribution data available
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Landlord Subscription Status */}
            <div>
              <h3 className="text-lg font-medium mb-4">Landlord Subscription Coverage</h3>
              
              {loading ? (
                <Skeleton className="h-16 w-full" />
              ) : statistics?.landlord_statistics ? (
                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span>
                      <span className="font-medium">{formatNumber(statistics.landlord_statistics.with_active_subscription)}</span> of {formatNumber(statistics.landlord_statistics.total)} landlords
                    </span>
                    <span className="font-medium">
                      {formatPercentage(statistics.landlord_statistics.subscription_rate)}
                    </span>
                  </div>
                  <Progress 
                    value={statistics.landlord_statistics.subscription_rate} 
                    className="h-2"
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Total Landlords</div>
                      <div className="text-xl font-bold mt-1">
                        {formatNumber(statistics.landlord_statistics.total)}
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">With Active Subscription</div>
                      <div className="text-xl font-bold mt-1">
                        {formatNumber(statistics.landlord_statistics.with_active_subscription)}
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Without Subscription</div>
                      <div className="text-xl font-bold mt-1">
                        {formatNumber(statistics.landlord_statistics.without_subscription)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No landlord statistics available
                </div>
              )}
            </div>
            
            {/* Plan Statistics DataTable */}
            <div>
              <h3 className="text-lg font-medium mb-4">Subscription Plan Details</h3>
              
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <div className="border rounded-md">
                  <div className="flex items-center py-4 px-4">
                    <Input
                      placeholder="Filter plans..."
                      value={(planTable.getColumn("name")?.getFilterValue() ?? "")}
                      onChange={(event) =>
                        planTable.getColumn("name")?.setFilterValue(event.target.value)
                      }
                      className="max-w-sm"
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto">
                          Columns <ArrowDown className="ml-2 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {planTable
                          .getAllColumns()
                          .filter((column) => column.getCanHide())
                          .map((column) => {
                            return (
                              <DropdownMenuCheckboxItem
                                key={column.id}
                                className="capitalize"
                                checked={column.getIsVisible()}
                                onCheckedChange={(value) =>
                                  column.toggleVisibility(!!value)
                                }
                              >
                                {column.id}
                              </DropdownMenuCheckboxItem>
                            );
                          })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <Table>
                    <TableHeader>
                      {planTable.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <TableHead key={header.id}>
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {planTable.getRowModel().rows?.length ? (
                        planTable.getRowModel().rows.map((row) => (
                          <TableRow
                            key={row.id}
                            data-state={row.getIsSelected() && "selected"}
                          >
                            {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={planColumns.length} className="h-24 text-center">
                            No plan data available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <div className="flex items-center justify-end space-x-2 p-4">
                    <div className="flex-1 text-sm text-muted-foreground">
                      {planTable.getFilteredRowModel().rows.length} plans total
                    </div>
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => planTable.previousPage()}
                        disabled={!planTable.getCanPreviousPage()}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => planTable.nextPage()}
                        disabled={!planTable.getCanNextPage()}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        
        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <>
            {/* Subscription Growth Chart */}
            <div>
              <h3 className="text-lg font-medium mb-4">Subscription Growth Trend</h3>
              <div className="h-[400px]">
                {loading ? (
                  <Skeleton className="h-full w-full" />
                ) : isClient && trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0.2}/>
                        </linearGradient>
                        <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS[2]} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={COLORS[2]} stopOpacity={0.2}/>
                        </linearGradient>
                        <linearGradient id="colorCancelled" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS[1]} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={COLORS[1]} stopOpacity={0.2}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={formatNumber} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="active" 
                        name="Active Subscriptions" 
                        stroke={COLORS[0]} 
                        fillOpacity={0.3}
                        fill="url(#colorActive)" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="new" 
                        name="New Subscriptions" 
                        stroke={COLORS[2]} 
                        fillOpacity={0.3}
                        fill="url(#colorNew)" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="cancelled" 
                        name="Cancelled" 
                        stroke={COLORS[1]} 
                        fillOpacity={0.3}
                        fill="url(#colorCancelled)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    No trend data available
                  </div>
                )}
              </div>
            </div>
            
            {/* Growth Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <div className="text-sm text-gray-500">Growth Rate (Monthly)</div>
                <div className="flex items-center mt-1">
                  <div className="text-xl font-bold">12.3%</div>
                  <Badge className="ml-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +2.5%
                  </Badge>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <div className="text-sm text-gray-500">Churn Rate</div>
                <div className="flex items-center mt-1">
                  <div className="text-xl font-bold">{formatPercentage(churnRate)}</div>
                  <Badge className="ml-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    -0.8%
                  </Badge>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <div className="text-sm text-gray-500">Renewal Rate</div>
                <div className="flex items-center mt-1">
                  <div className="text-xl font-bold">87.2%</div>
                  <Badge className="ml-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +1.4%
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* Monthly Conversion Chart */}
            <div>
              <h3 className="text-lg font-medium mb-4">Subscription Conversion Rate</h3>
              <div className="h-[300px]">
                {loading ? (
                  <Skeleton className="h-full w-full" />
                ) : isClient ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => `${value}%`} domain={[0, 100]} />
                      <Tooltip 
                        formatter={(value) => `${value.toFixed(1)}%`}
                        labelFormatter={(label) => `Period: ${label}`}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        name="Conversion Rate" 
                        stroke={COLORS[4]} 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 8 }}
                        // Mapping the value to a percentage in the range of 60-90%
                        // This is for demonstration only - real data would come from API
                        dataKey={(entry) => 60 + (entry.value % 30)}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    No conversion data available
                  </div>
                )}
              </div>
            </div>
          </>
        )}
        
        {/* Expiring Subscriptions Tab */}
        {activeTab === 'expiring' && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Subscriptions Expiring Soon</h3>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
            
            {/* Expiring Subscriptions DataTable */}
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="border rounded-md">
                <div className="flex items-center py-4 px-4">
                  <Input
                    placeholder="Filter landlords..."
                    value={(expiringTable.getColumn("landlordName")?.getFilterValue() ?? "")}
                    onChange={(event) =>
                      expiringTable.getColumn("landlordName")?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                  />
                </div>
                <Table>
                  <TableHeader>
                    {expiringTable.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {expiringTable.getRowModel().rows?.length ? (
                      expiringTable.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() && "selected"}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={expiringColumns.length} className="h-24 text-center">
                          No subscriptions expiring soon
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                <div className="flex items-center justify-end space-x-2 p-4">
                  <div className="flex-1 text-sm text-muted-foreground">
                    {expiringTable.getFilteredRowModel().rows.length} expiring subscriptions
                  </div>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => expiringTable.previousPage()}
                      disabled={!expiringTable.getCanPreviousPage()}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => expiringTable.nextPage()}
                      disabled={!expiringTable.getCanNextPage()}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Expiry Distribution Chart */}
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Expiry Distribution (Next 30 Days)</h3>
              <div className="h-[300px]">
                {loading ? (
                  <Skeleton className="h-full w-full" />
                ) : isClient ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { period: '1-7 days', count: 8, fill: COLORS[1] },
                      { period: '8-14 days', count: 12, fill: COLORS[3] },
                      { period: '15-30 days', count: 18, fill: COLORS[0] }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis tickFormatter={formatNumber} />
                      <Tooltip formatter={formatNumber} />
                      <Bar dataKey="count" name="Subscriptions" fill={COLORS[0]}>
                        {[
                          { period: '1-7 days', count: 8, fill: COLORS[1] },
                          { period: '8-14 days', count: 12, fill: COLORS[3] },
                          { period: '15-30 days', count: 18, fill: COLORS[0] }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    No expiry distribution data available
                  </div>
                )}
              </div>
            </div>
            
            {/* Auto-Renewal Stats */}
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Auto-Renewal Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Auto-Renewal Enabled</div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="text-xl font-bold">68.4%</div>
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                      184 subscriptions
                    </Badge>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Successful Auto-Renewals (Last 30 Days)</div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="text-xl font-bold">92.7%</div>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      38 renewals
                    </Badge>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Failed Auto-Renewals (Last 30 Days)</div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="text-xl font-bold">7.3%</div>
                    <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                      3 failures
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* Auto-Renewal Pie Chart */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-[240px]">
                  {loading ? (
                    <Skeleton className="h-full w-full" />
                  ) : isClient ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Auto-Renewal Enabled', value: 184, color: COLORS[0] },
                            { name: 'Auto-Renewal Disabled', value: 85, color: COLORS[1] }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                        >
                          <Cell fill={COLORS[0]} />
                          <Cell fill={COLORS[1]} />
                        </Pie>
                        <Tooltip 
                          formatter={(value) => formatNumber(value)} 
                          contentStyle={{ 
                            backgroundColor: 'rgb(var(--card-bg))', 
                            borderColor: 'rgb(var(--card-border))' 
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      No auto-renewal data available
                    </div>
                  )}
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg flex flex-col">
                  <h4 className="text-sm font-medium mb-3">Auto-Renewal Success Rate by Plan</h4>
                  <div className="space-y-4 flex-grow">
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>Basic Plan</span>
                        <span className="font-medium">94.2%</span>
                      </div>
                      <Progress value={94.2} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>Premium Plan</span>
                        <span className="font-medium">97.8%</span>
                      </div>
                      <Progress value={97.8} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>Enterprise Plan</span>
                        <span className="font-medium">100%</span>
                      </div>
                      <Progress value={100} className="h-2" />
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-4">
                    Based on renewal attempts in the last 90 days
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

// Import necessary components for DropdownMenuCheckboxItem
const DropdownMenuCheckboxItem = ({
  className,
  children,
  checked,
  onCheckedChange,
}) => {
  return (
    <div 
      className={`relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${className}`}
      onClick={() => onCheckedChange(!checked)}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {checked ? <Check className="h-4 w-4" /> : null}
      </span>
      {children}
    </div>
  );
};

// Import Check icon for checkbox item
const Check = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);