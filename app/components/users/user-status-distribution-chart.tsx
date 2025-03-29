/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useColorMode } from '@/app/components/theme/ThemeProvider';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip
} from 'recharts';
import { 
  UserCheck, 
  UserX, 
  ShieldAlert, 
  User,
  UserCog 
} from 'lucide-react';
import { JSX } from 'react/jsx-runtime';

// Chart data types
interface StatusData {
  name: string;
  value: number;
  icon: JSX.Element;
}

interface UserStatusChartProps {
  data?: {
    active: number;
    inactive: number;
    admin?: number;
    staff?: number;
    regular?: number;
  };
  isLoading?: boolean;
  title?: string;
  description?: string;
  showRoleDistribution?: boolean;
}

export function UserStatusChart({
  data,
  isLoading = false,
  title = "User Status Distribution",
  description = "Active vs Inactive users",
  showRoleDistribution = false
}: UserStatusChartProps) {
  const { mode } = useColorMode();
  const [chartData, setChartData] = useState<StatusData[]>([]);
  
  // Colors derived from theme
  const colors = {
    active: mode === 'dark' ? '#4caf50' : '#2e7d32',
    inactive: mode === 'dark' ? '#f44336' : '#d32f2f',
    admin: mode === 'dark' ? '#3a8bce' : '#1a4971',
    staff: mode === 'dark' ? '#5c7d9a' : '#2c3e50',
    regular: mode === 'dark' ? '#9e9e9e' : '#757575',
  };

  useEffect(() => {
    if (!data && !isLoading) {
      // Sample data if none provided
      if (showRoleDistribution) {
        setChartData([
          { name: 'Admin', value: 5, icon: <ShieldAlert size={14} /> },
          { name: 'Staff', value: 12, icon: <UserCog size={14} /> },
          { name: 'Regular', value: 83, icon: <User size={14} /> },
        ]);
      } else {
        setChartData([
          { name: 'Active', value: 76, icon: <UserCheck size={14} /> },
          { name: 'Inactive', value: 24, icon: <UserX size={14} /> },
        ]);
      }
      return;
    }

    if (data) {
      if (showRoleDistribution) {
        setChartData([
          { name: 'Admin', value: data.admin || 0, icon: <ShieldAlert size={14} /> },
          { name: 'Staff', value: data.staff || 0, icon: <UserCog size={14} /> },
          { name: 'Regular', value: data.regular || 0, icon: <User size={14} /> },
        ]);
      } else {
        setChartData([
          { name: 'Active', value: data.active, icon: <UserCheck size={14} /> },
          { name: 'Inactive', value: data.inactive, icon: <UserX size={14} /> },
        ]);
      }
    }
  }, [data, isLoading, showRoleDistribution]);

  // Get color for each segment
  const getColor = (entry: StatusData) => {
    switch(entry.name) {
      case 'Active': return colors.active;
      case 'Inactive': return colors.inactive;
      case 'Admin': return colors.admin;
      case 'Staff': return colors.staff;
      case 'Regular': return colors.regular;
      default: return '#9e9e9e';
    }
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background dark:bg-dark-background p-3 border border-border rounded-md shadow-sm">
          <div className="flex items-center gap-2">
            {data.icon}
            <span className="font-semibold">{data.name}</span>
          </div>
          <div className="mt-1">
            <span className="text-sm font-medium">{data.value} users</span>
            <span className="text-xs text-muted-foreground ml-2">
              ({((data.value / getTotalUsers()) * 100).toFixed(1)}%)
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom legend component
  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex justify-center gap-6 mt-4 flex-wrap">
        {payload.map((entry: any, index: number) => (
          <div key={`legend-${index}`} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: entry.color }} 
            />
            <div className="flex items-center gap-1">
              {chartData[index]?.icon}
              <span className="text-sm">{entry.value}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              ({((chartData[index]?.value / getTotalUsers()) * 100).toFixed(0)}%)
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Calculate total users
  const getTotalUsers = () => {
    return chartData.reduce((sum, item) => sum + item.value, 0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[240px]">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-full h-full rounded-full animate-pulse bg-muted"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  labelLine={false}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getColor(entry)} 
                      stroke={mode === 'dark' ? '#121212' : '#ffffff'}
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  content={<CustomLegend />}
                  verticalAlign="bottom"
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        {!isLoading && (
          <div className="mt-2 text-center">
            <p className="text-sm text-muted-foreground">
              Total Users: <span className="font-medium text-text dark:text-dark-text">{getTotalUsers()}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}