/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useColorMode } from '@/app/components/theme/ThemeProvider';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend
} from 'recharts';

// Example registration data structure
interface RegistrationData {
  name: string;  // Month or date
  count: number;
  target?: number;
}

interface UserRegistrationChartProps {
  data?: RegistrationData[];
  isLoading?: boolean;
  period?: 'week' | 'month' | 'year';
  onPeriodChange?: (period: 'week' | 'month' | 'year') => void;
  title?: string;
  description?: string;
}

export function UserRegistrationChart({
  data,
  isLoading = false,
  period = 'month',
  onPeriodChange,
  title = "User Registration Trend",
  description = "New user registrations over time"
}: UserRegistrationChartProps) {
  const { mode } = useColorMode();
  const [chartData, setChartData] = useState<RegistrationData[]>([]);

  // Colors derived from the theme
  const primaryColor = mode === 'dark' ? '#3a8bce' : '#1a4971';
  const secondaryColor = mode === 'dark' ? '#5c7d9a' : '#2c3e50';
  const gridColor = mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const textColor = mode === 'dark' ? '#e1e1e1' : '#202124';

  // Generate sample data if none provided
  useEffect(() => {
    if (data) {
      setChartData(data);
      return;
    }

    // Sample data generation based on selected period
    const generateSampleData = () => {
      if (period === 'week') {
        return [
          { name: 'Mon', count: 12, target: 10 },
          { name: 'Tue', count: 19, target: 10 },
          { name: 'Wed', count: 15, target: 10 },
          { name: 'Thu', count: 27, target: 10 },
          { name: 'Fri', count: 21, target: 10 },
          { name: 'Sat', count: 8, target: 10 },
          { name: 'Sun', count: 15, target: 10 },
        ];
      } else if (period === 'month') {
        return [
          { name: 'Week 1', count: 45, target: 40 },
          { name: 'Week 2', count: 52, target: 40 },
          { name: 'Week 3', count: 38, target: 40 },
          { name: 'Week 4', count: 64, target: 40 },
        ];
      } else {
        return [
          { name: 'Jan', count: 145, target: 120 },
          { name: 'Feb', count: 205, target: 120 },
          { name: 'Mar', count: 187, target: 120 },
          { name: 'Apr', count: 251, target: 120 },
          { name: 'May', count: 273, target: 120 },
          { name: 'Jun', count: 198, target: 120 },
          { name: 'Jul', count: 234, target: 120 },
          { name: 'Aug', count: 290, target: 120 },
          { name: 'Sep', count: 341, target: 120 },
          { name: 'Oct', count: 378, target: 120 },
          { name: 'Nov', count: 274, target: 120 },
          { name: 'Dec', count: 198, target: 120 },
        ];
      }
    };

    setChartData(generateSampleData());
  }, [data, period]);

  // Handle period changes
  const handlePeriodChange = (newPeriod: 'week' | 'month' | 'year') => {
    if (onPeriodChange) {
      onPeriodChange(newPeriod);
    }
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background dark:bg-dark-background p-3 border border-border rounded-md shadow-sm">
          <p className="font-semibold">{label}</p>
          <p className="text-sm text-primary dark:text-dark-primary">
            {`New Users: ${payload[0].value}`}
          </p>
          {payload[1] && (
            <p className="text-sm text-secondary dark:text-dark-secondary">
              {`Target: ${payload[1].value}`}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={period === 'week' ? 'default' : 'outline'}
            onClick={() => handlePeriodChange('week')}
            className="h-8 px-3"
          >
            Week
          </Button>
          <Button
            size="sm"
            variant={period === 'month' ? 'default' : 'outline'}
            onClick={() => handlePeriodChange('month')}
            className="h-8 px-3"
          >
            Month
          </Button>
          <Button
            size="sm"
            variant={period === 'year' ? 'default' : 'outline'}
            onClick={() => handlePeriodChange('year')}
            className="h-8 px-3"
          >
            Year
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          {isLoading ? (
            <div className="flex h-full w-full items-center justify-center">
              <div className="h-full w-full animate-pulse bg-muted rounded-md"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis 
                  dataKey="name" 
                  stroke={textColor} 
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  stroke={textColor} 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ 
                    paddingTop: '10px',
                    fontSize: '12px', 
                    color: textColor 
                  }} 
                />
                <Bar 
                  dataKey="count" 
                  name="New Users" 
                  fill={primaryColor} 
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
                <Bar 
                  dataKey="target" 
                  name="Target" 
                  fill={secondaryColor} 
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                  opacity={0.6}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}