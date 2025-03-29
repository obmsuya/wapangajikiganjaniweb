'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Tabs,
  Tab,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  SelectChangeEvent,
  Stack
} from '@mui/material';
import { Alert } from '@/components/ui/alert';
import {
  DateRange as DateRangeIcon,
  Refresh as RefreshIcon,
  CompareArrows as CompareArrowsIcon,
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  Receipt as ReceiptIcon,
  Print as PrintIcon,
  PictureAsPdf as PdfIcon,
  InsertDriveFile as CsvIcon,
  FilterList as FilterIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import PaymentService, { 
  TrialBalanceReport, 
  ProfitLossReport, 
  ExpensesReport,
} from '@/services/payment';
import { Loader } from '@/app/components/ui/loader';
import { formatCurrency } from '@/lib/utils';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { autoTable } from 'jspdf-autotable';

// Animated card component
const AnimatedCard = motion(Card);

// Animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

// Tab panel interface
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}   
// Tab panel component
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`financial-tabpanel-${index}`}
      aria-labelledby={`financial-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

/**
 * Financial Reports Component
 * Provides comprehensive financial reporting including trial balance,
 * profit and loss statements, and expense reports
 */
export default function FinancialReports() {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [dateRange, setDateRange] = useState({
    from_date: dayjs().subtract(30, 'day'),
    to_date: dayjs()
  });
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month' | 'category' | 'vendor' | 'date'>('month');
  const [compareWithPrevious, setCompareWithPrevious] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Report data states
  const [trialBalanceData, setTrialBalanceData] = useState<TrialBalanceReport | null>(null);
  const [profitLossData, setProfitLossData] = useState<ProfitLossReport | null>(null);
  const [expensesData, setExpensesData] = useState<ExpensesReport | null>(null);
  
  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    fetchReportData(newValue);
  };
  
  // Handle date range change
  const handleDateChange = (field: 'from_date' | 'to_date', date: Dayjs | null) => {
    if (date) {
      setDateRange(prev => ({
        ...prev,
        [field]: date
      }));
    }
  };
  
  // Handle group by change
  const handleGroupByChange = (event: SelectChangeEvent<string>) => {
    setGroupBy(event.target.value as 'day' | 'week' | 'month' | 'category' | 'vendor' | 'date');
  };
  
  // Handle compare toggle
  const handleCompareToggle = () => {
    setCompareWithPrevious(prev => !prev);
  };
  
  // Fetch report data based on current tab
  const fetchReportData = useCallback(async (tab: number = tabValue) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        from_date: dateRange.from_date.format('YYYY-MM-DD'),
        to_date: dateRange.to_date.format('YYYY-MM-DD')
      };
      
      if (tab === 0) { // Trial Balance
        const data = await PaymentService.getTrialBalanceReport(params);
        setTrialBalanceData(data);
      } else if (tab === 1) { // Profit & Loss
        const data = await PaymentService.getProfitLossReport({
          ...params,
          compare_previous: compareWithPrevious
        });
        setProfitLossData(data);
      } else if (tab === 2) { // Expenses
        const data = await PaymentService.getExpensesReport({
          ...params,
          group_by: groupBy as 'category' | 'vendor' | 'date'
        });
        setExpensesData(data);
      }
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('Failed to load report data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [tabValue, dateRange, compareWithPrevious, groupBy]);
  
  // Fetch data when component mounts or filters change
  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);
  
  // Generate PDF report
  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Add title
    const title = tabValue === 0 
      ? 'Trial Balance Report' 
      : tabValue === 1 
        ? 'Profit & Loss Statement' 
        : 'Expenses Report';
    
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    
    // Add date range
    doc.setFontSize(12);
    doc.text(
      `Period: ${dateRange.from_date.format('MMM D, YYYY')} - ${dateRange.to_date.format('MMM D, YYYY')}`, 
      14, 
      32
    );
    
    // Add company info
    doc.setFontSize(10);
    doc.text('Wapangaji Property Management', 14, 42);
    
    if (tabValue === 0 && trialBalanceData) {
      // Trial Balance table
      const tableData = [
        ...trialBalanceData.accounts.assets.map(account => [
          account.account_code,
          account.account_name,
          'Assets',
          formatCurrency(account.debit),
          formatCurrency(account.credit)
        ]),
        ...trialBalanceData.accounts.liabilities.map(account => [
          account.account_code,
          account.account_name,
          'Liabilities',
          formatCurrency(account.debit),
          formatCurrency(account.credit)
        ]),
        ...trialBalanceData.accounts.equity.map(account => [
          account.account_code,
          account.account_name,
          'Equity',
          formatCurrency(account.debit),
          formatCurrency(account.credit)
        ]),
        ...trialBalanceData.accounts.revenue.map(account => [
          account.account_code,
          account.account_name,
          'Revenue',
          formatCurrency(account.debit),
          formatCurrency(account.credit)
        ]),
        ...trialBalanceData.accounts.expenses.map(account => [
          account.account_code,
          account.account_name,
          'Expenses',
          formatCurrency(account.debit),
          formatCurrency(account.credit)
        ]),
      ];
      
      // Add totals row
      tableData.push([
        '',
        'TOTAL',
        '',
        formatCurrency(trialBalanceData.totals.debit_total),
        formatCurrency(trialBalanceData.totals.credit_total)
      ]);
      
      autoTable(doc, {
        head: [['Account Code', 'Account Name', 'Category', 'Debit', 'Credit']],
        body: tableData,
        startY: 50,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        footStyles: { fillColor: [220, 220, 220], textColor: 0, fontStyle: 'bold' }
      });
      
    } else if (tabValue === 1 && profitLossData) {
      // Profit & Loss table
      const revenueData = profitLossData.revenue?.items?.map(item => ({
        name: item.name,
        value: item.amount
      })) || [];
      
      const expenseData = profitLossData.expenses?.items?.map(item => ({
        name: item.name,
        value: item.amount
      })) || [];
      
      // Revenue section
      autoTable(doc, {
        head: [['Revenue', 'Amount', '% of Total']],
        body: revenueData,
        startY: 50,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 }
      });
      
      // Revenue total
      autoTable(doc, {
        body: [['Total Revenue', formatCurrency(profitLossData.summary.total_revenue), '100%']],
        startY: (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 1,
        theme: 'grid',
        styles: { fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fillColor: [220, 220, 220] }
      });
      
      // Expenses section
      autoTable(doc, {
        head: [['Expenses', 'Amount', '% of Revenue']],
        body: expenseData,
        startY: (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 10,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 }
      });
      
      // Expenses total
      autoTable(doc, {
        body: [['Total Expenses', formatCurrency(profitLossData.summary.total_expenses), `${(profitLossData.summary.total_expenses / profitLossData.summary.total_revenue * 100).toFixed(2)}%`]],
        startY: (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 1,
        theme: 'grid',
        styles: { fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fillColor: [220, 220, 220] }
      });
      
      // Net profit
      autoTable(doc, {
        body: [['Net Profit/Loss', formatCurrency(profitLossData.summary.net_profit), `${profitLossData.summary.profit_margin.toFixed(2)}%`]],
        startY: (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 10,
        theme: 'grid',
        styles: { fontSize: 10, fontStyle: 'bold' },
        bodyStyles: { 
          fillColor: profitLossData.summary.net_profit >= 0 ? [200, 230, 201] : [230, 200, 200],
          textColor: 0
        }
      });
      
    } else if (tabValue === 2 && expensesData) {
      // Expenses table
      const expenseTableData = [];
      
      for (const [, groupData] of Object.entries(expensesData.expenses)) {
        if (groupData.items) {
          for (const item of groupData.items) {
            expenseTableData.push([
              item.category,
              item.vendor,
              item.description,
              item.date,
              formatCurrency(item.amount)
            ]);
          }
        }
      }
      
      autoTable(doc, {
        head: [['Category', 'Vendor', 'Description', 'Date', 'Amount']],
        body: expenseTableData,
        startY: 64
      });
    }
    
    // Save the PDF
    doc.save(`${title.replace(/\s+/g, '_').toLowerCase()}_${dateRange.from_date.format('YYYY-MM-DD')}_to_${dateRange.to_date.format('YYYY-MM-DD')}.pdf`);
  };
  
  // Export to CSV
  const exportToCSV = () => {
    let csvContent = '';
    const title = tabValue === 0 
      ? 'Trial Balance Report' 
      : tabValue === 1 
        ? 'Profit & Loss Statement' 
        : 'Expenses Report';
    
    if (tabValue === 0 && trialBalanceData) {
      // Trial Balance CSV
      csvContent = 'Account Code,Account Name,Category,Debit,Credit\n';
      
      // Assets
      trialBalanceData.accounts.assets.forEach(account => {
        csvContent += `${account.account_code},"${account.account_name}",Assets,${account.debit},${account.credit}\n`;
      });
      
      // Liabilities
      trialBalanceData.accounts.liabilities.forEach(account => {
        csvContent += `${account.account_code},"${account.account_name}",Liabilities,${account.debit},${account.credit}\n`;
      });
      
      // Equity
      trialBalanceData.accounts.equity.forEach(account => {
        csvContent += `${account.account_code},"${account.account_name}",Equity,${account.debit},${account.credit}\n`;
      });
      
      // Revenue
      trialBalanceData.accounts.revenue.forEach(account => {
        csvContent += `${account.account_code},"${account.account_name}",Revenue,${account.debit},${account.credit}\n`;
      });
      
      // Expenses
      trialBalanceData.accounts.expenses.forEach(account => {
        csvContent += `${account.account_code},"${account.account_name}",Expenses,${account.debit},${account.credit}\n`;
      });
      
      // Totals
      csvContent += `,"TOTAL",,${trialBalanceData.totals.debit_total},${trialBalanceData.totals.credit_total}\n`;
      
    } else if (tabValue === 1 && profitLossData) {
      // Profit & Loss CSV
      csvContent = 'Category,Item,Amount,Percentage\n';
      
      // Revenue items
      (profitLossData.revenue?.items || []).forEach(item => {
        csvContent += `Revenue,"${item.name}",${item.amount},${item.percentage || 0}\n`;
      });
      
      // Revenue total
      csvContent += `Revenue,Total Revenue,${profitLossData.summary.total_revenue},100\n`;
      
      // Expenses items
      (profitLossData.expenses?.items || []).forEach(item => {
        csvContent += `Expenses,"${item.name}",${item.amount},${item.percentage || 0}\n`;
      });
      
      // Expenses total
      csvContent += `Expenses,Total Expenses,${profitLossData.summary.total_expenses},${(profitLossData.summary.total_expenses / profitLossData.summary.total_revenue * 100).toFixed(2)}\n`;
      
      // Net profit
      csvContent += `Summary,Net Profit/Loss,${profitLossData.summary.net_profit},${profitLossData.summary.profit_margin.toFixed(2)}\n`;
      
    } else if (tabValue === 2 && expensesData) {
      // Expenses CSV
      csvContent = 'Group,Description,Amount,Vendor,Date\n';
      
      Object.entries(expensesData.expenses).forEach(([groupKey, groupData]) => {
        (groupData.items ?? []).forEach(item => {
          csvContent += `"${groupKey}","${item.description}",${item.amount},"${item.vendor}",${item.date}\n`;
        });
      });
      
      // Add total row
      csvContent += `Total,TOTAL EXPENSES,${expensesData.total_expenses},,\n`;
    }
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${title.replace(/\s+/g, '_').toLowerCase()}_${dateRange.from_date.format('YYYY-MM-DD')}_to_${dateRange.to_date.format('YYYY-MM-DD')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Render Trial Balance tab content
  const renderTrialBalance = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <Loader size="lg" />
        </Box>
      );
    }
    
    if (error) {
      return (
        <Alert variant="destructive" >
          {error}
        </Alert>
      );
    }
    
    if (!trialBalanceData) {
      return (
        <Alert variant="default" >
          No trial balance data available for the selected period.
        </Alert>
      );
    }
    
    return (
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <AnimatedCard 
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h6" component="h3">
                      <AccountBalanceIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Trial Balance
                    </Typography>
                    <Tooltip title="A trial balance is a bookkeeping worksheet in which the balances of all ledgers are compiled into debit and credit columns.">
                      <IconButton size="small">
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Box>
                    <Chip 
                      label={trialBalanceData.is_balanced ? "Balanced" : "Unbalanced"} 
                      color={trialBalanceData.is_balanced ? "success" : "error"}
                      sx={{ mr: 1 }}
                    />
                    <Tooltip title="Print Report">
                      <IconButton onClick={() => window.print()}>
                        <PrintIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Export to PDF">
                      <IconButton onClick={generatePDF}>
                        <PdfIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Export to CSV">
                      <IconButton onClick={exportToCSV}>
                        <CsvIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                
                <TableContainer component={Paper} sx={{ mt: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: theme.palette.primary.main }}>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Account Code</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Account Name</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Debit</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Credit</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {/* Assets */}
                      <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                        <TableCell {...{ colSpan: 4 }} sx={{ fontWeight: 'bold' }}>Assets</TableCell>
                      </TableRow>
                      {trialBalanceData.accounts.assets.map((account, index) => (
                        <TableRow key={`asset-${index}`}>
                          <TableCell>{account.account_code}</TableCell>
                          <TableCell>{account.account_name}</TableCell>
                          <TableCell>{formatCurrency(account.debit)}</TableCell>
                          <TableCell>{formatCurrency(account.credit)}</TableCell>
                        </TableRow>
                      ))}
                      
                      {/* Liabilities */}
                      <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                        <TableCell {...{ colSpan: 4 }} sx={{ fontWeight: 'bold' }}>Liabilities</TableCell>
                      </TableRow>
                      {trialBalanceData.accounts.liabilities.map((account, index) => (
                        <TableRow key={`liability-${index}`}>
                          <TableCell>{account.account_code}</TableCell>
                          <TableCell>{account.account_name}</TableCell>
                          <TableCell>{formatCurrency(account.debit)}</TableCell>
                          <TableCell>{formatCurrency(account.credit)}</TableCell>
                        </TableRow>
                      ))}
                      
                      {/* Equity */}
                      {trialBalanceData.accounts.equity.length > 0 && (
                        <>
                          <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                            <TableCell {...{ colSpan: 4 }} sx={{ fontWeight: 'bold' }}>Equity</TableCell>
                          </TableRow>
                          {trialBalanceData.accounts.equity.map((account, index) => (
                            <TableRow key={`equity-${index}`}>
                              <TableCell>{account.account_code}</TableCell>
                              <TableCell>{account.account_name}</TableCell>
                              <TableCell>{formatCurrency(account.debit)}</TableCell>
                              <TableCell>{formatCurrency(account.credit)}</TableCell>
                            </TableRow>
                          ))}
                        </>
                      )}
                      
                      {/* Revenue */}
                      <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                        <TableCell {...{ colSpan: 4 }} sx={{ fontWeight: 'bold' }}>Revenue</TableCell>
                      </TableRow>
                      {trialBalanceData.accounts.revenue.map((account, index) => (
                        <TableRow key={`revenue-${index}`}>
                          <TableCell>{account.account_code}</TableCell>
                          <TableCell>{account.account_name}</TableCell>
                          <TableCell>{formatCurrency(account.debit)}</TableCell>
                          <TableCell>{formatCurrency(account.credit)}</TableCell>
                        </TableRow>
                      ))}
                      
                      {/* Expenses */}
                      {trialBalanceData.accounts.expenses.length > 0 && (
                        <>
                          <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                            <TableCell {...{ colSpan: 4 }} sx={{ fontWeight: 'bold' }}>Expenses</TableCell>
                          </TableRow>
                          {trialBalanceData.accounts.expenses.map((account, index) => (
                            <TableRow key={`expense-${index}`}>
                              <TableCell>{account.account_code}</TableCell>
                              <TableCell>{account.account_name}</TableCell>
                              <TableCell>{formatCurrency(account.debit)}</TableCell>
                              <TableCell>{formatCurrency(account.credit)}</TableCell>
                            </TableRow>
                          ))}
                        </>
                      )}
                      
                      {/* Totals */}
                      <TableRow sx={{ 
                        backgroundColor: trialBalanceData.is_balanced 
                          ? theme.palette.success.light 
                          : theme.palette.error.light 
                      }}>
                        <TableCell {...{ colSpan: 2 }} sx={{ fontWeight: 'bold' }}>TOTAL</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>{formatCurrency(trialBalanceData.totals.debit_total)}</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>{formatCurrency(trialBalanceData.totals.credit_total)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </AnimatedCard>
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  // Render Profit & Loss tab content
  const renderProfitLoss = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <Loader size="lg" />
        </Box>
      );
    }
    
    if (error) {
      return (
        <Alert variant="destructive" >
          {error}
        </Alert>
      );
    }
    
    if (!profitLossData) {
      return (
        <Alert variant="default" >
          No profit and loss data available for the selected period.
        </Alert>
      );
    }
    
    // Prepare chart data
    const revenueData = profitLossData.revenue?.items?.map(item => ({
      name: item.name,
      value: item.amount
    })) || [];
    
    const expenseData = profitLossData.expenses?.items?.map(item => ({
      name: item.name,
      value: item.amount
    })) || [];
    
    // Colors for pie charts
    const REVENUE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
    const EXPENSE_COLORS = ['#FF8042', '#FFBB28', '#00C49F', '#0088FE', '#8884D8'];
    
    return (
      <Box>
        <Grid container spacing={3}>
          {/* Summary Card */}
          <Grid item xs={12} md={6}>
            <AnimatedCard 
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <CardContent>
                <Typography variant="h6" component="h3" gutterBottom>
                  <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Profit & Loss Summary
                </Typography>
                
                <Box sx={{ mt: 3 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="textSecondary">Total Revenue</Typography>
                      <Typography variant="h5" color="primary">
                        {formatCurrency(profitLossData.summary.total_revenue)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="textSecondary">Total Expenses</Typography>
                      <Typography variant="h5" color="error">
                        {formatCurrency(profitLossData.summary.total_expenses)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="textSecondary">Net Profit/Loss</Typography>
                      <Typography 
                        variant="h4" 
                        color={profitLossData.summary.net_profit >= 0 ? "success" : "error"}
                      >
                        {formatCurrency(profitLossData.summary.net_profit)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="textSecondary">Profit Margin</Typography>
                      <Typography 
                        variant="h5" 
                        color={profitLossData.summary.profit_margin >= 0 ? "success" : "error"}
                      >
                        {profitLossData.summary.profit_margin.toFixed(2)}%
                      </Typography>
                      </Grid>
                    </Grid>
                </Box>
                
                {/* Comparison with previous period */}
                {compareWithPrevious && profitLossData.comparison && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      <CompareArrowsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Comparison with Previous Period
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="caption" color="textSecondary">
                          Previous Period: {profitLossData.comparison.period.from_date} to {profitLossData.comparison.period.to_date}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={4}>
                        <Typography variant="subtitle2" color="textSecondary">Revenue Change</Typography>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          {profitLossData.comparison.changes.revenue_change.percentage >= 0 ? (
                            <ArrowUpIcon color="success" fontSize="small" />
                          ) : (
                            <ArrowDownIcon color="error" fontSize="small" />
                          )}
                          <Typography 
                            variant="body1" 
                            color={profitLossData.comparison.changes.revenue_change.percentage >= 0 ? "success.main" : "error.main"}
                          >
                            {Math.abs(profitLossData.comparison.changes.revenue_change.percentage).toFixed(2)}%
                          </Typography>
                        </Stack>
                      </Grid>
                      
                      <Grid item xs={4}>
                        <Typography variant="subtitle2" color="textSecondary">Expenses Change</Typography>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          {profitLossData.comparison.changes.expenses_change.percentage <= 0 ? (
                            <ArrowDownIcon color="success" fontSize="small" />
                          ) : (
                            <ArrowUpIcon color="error" fontSize="small" />
                          )}
                          <Typography 
                            variant="body1" 
                            color={profitLossData.comparison.changes.expenses_change.percentage <= 0 ? "success.main" : "error.main"}
                          >
                            {Math.abs(profitLossData.comparison.changes.expenses_change.percentage).toFixed(2)}%
                          </Typography>
                        </Stack>
                      </Grid>
                      
                      <Grid item xs={4}>
                        <Typography variant="subtitle2" color="textSecondary">Profit Change</Typography>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          {profitLossData.comparison.changes.profit_change.percentage >= 0 ? (
                            <ArrowUpIcon color="success" fontSize="small" />
                          ) : (
                            <ArrowDownIcon color="error" fontSize="small" />
                          )}
                          <Typography 
                            variant="body1" 
                            color={profitLossData.comparison.changes.profit_change.percentage >= 0 ? "success.main" : "error.main"}
                          >
                            {Math.abs(profitLossData.comparison.changes.profit_change.percentage).toFixed(2)}%
                          </Typography>
                        </Stack>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </CardContent>
            </AnimatedCard>
          </Grid>
          
          {/* Charts Card */}
          <Grid item xs={12} md={6}>
            <AnimatedCard 
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2 }}
            >
              <CardContent>
                <Typography variant="h6" component="h3" gutterBottom>
                  Revenue vs Expenses
                </Typography>
                
                <Box sx={{ height: 300, mt: 2 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'Revenue', value: profitLossData.summary.total_revenue },
                        { name: 'Expenses', value: profitLossData.summary.total_expenses },
                        { name: 'Net Profit', value: profitLossData.summary.net_profit }
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                      <Bar 
                        dataKey="value" 
                        fill="#8884d8"
                      >
                        {[
                          { name: 'Revenue', color: theme.palette.primary.main },
                          { name: 'Expenses', color: theme.palette.error.main },
                          { name: 'Net Profit', color: theme.palette.success.main }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </AnimatedCard>
          </Grid>
          
          {/* Revenue Breakdown */}
          <Grid item xs={12} md={6}>
            <AnimatedCard 
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.3 }}
            >
              <CardContent>
                <Typography variant="h6" component="h3" gutterBottom>
                  Revenue Breakdown
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ height: 250 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={revenueData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {revenueData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={REVENUE_COLORS[index % REVENUE_COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Source</TableCell>
                            <TableCell align="right">Amount</TableCell>
                            <TableCell align="right">%</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(profitLossData.revenue?.items || []).map((item, index) => (
                            <TableRow key={`revenue-item-${index}`}>
                              <TableCell>{item.name}</TableCell>
                              <TableCell align="right">{formatCurrency(item.amount)}</TableCell>
                              <TableCell align="right">{item.percentage?.toFixed(1)}%</TableCell>
                            </TableRow>
                          ))}
                          <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                            <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                              {formatCurrency(profitLossData.revenue.total)}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>100%</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                </Grid>
              </CardContent>
            </AnimatedCard>
          </Grid>
          
          {/* Expense Breakdown */}
          <Grid item xs={12} md={6}>
            <AnimatedCard 
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.4 }}
            >
              <CardContent>
                <Typography variant="h6" component="h3" gutterBottom>
                  Expense Breakdown
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ height: 250 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={expenseData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {expenseData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Category</TableCell>
                            <TableCell align="right">Amount</TableCell>
                            <TableCell align="right">%</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(profitLossData.expenses?.items || []).map((item, index) => (
                            <TableRow key={`expense-item-${index}`}>
                              <TableCell>{item.name}</TableCell>
                              <TableCell align="right">{formatCurrency(item.amount)}</TableCell>
                              <TableCell align="right">{item.percentage?.toFixed(1)}%</TableCell>
                            </TableRow>
                          ))}
                          <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                            <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                              {formatCurrency(profitLossData.expenses.total)}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>100%</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                </Grid>
              </CardContent>
            </AnimatedCard>
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  // Render Expenses tab content
  const renderExpenses = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <Loader size="lg" />
        </Box>
      );
    }
    
    if (error) {
      return (
        <Alert variant="destructive" >
          {error}
        </Alert>
      );
    }
    
    if (!expensesData) {
      return (
        <Alert variant="default" >
          No expense data available for the selected period.
        </Alert>
      );
    }
    
    // Prepare chart data
    const chartData = Object.entries(expensesData.expenses).map(([key, value]) => ({
      name: key,
      value: value.total
    }));
    
    // Colors for charts
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658'];
    
    return (
      <Box>
        <Grid container spacing={3}>
          {/* Summary Card */}
          <Grid item xs={12} md={6}>
            <AnimatedCard 
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <CardContent>
                <Typography variant="h6" component="h3" gutterBottom>
                  <ReceiptIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Expenses Summary
                </Typography>
                
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h4" color="error">
                    {formatCurrency(expensesData.total_expenses)}
                  </Typography>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Total Expenses for {expensesData.report_period.from_date} to {expensesData.report_period.to_date}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle1" gutterBottom>
                    Grouped by: {expensesData.grouped_by.charAt(0).toUpperCase() + expensesData.grouped_by.slice(1)}
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    {Object.entries(expensesData.expenses).map(([key, value], index) => (
                      <Box key={`expense-group-${index}`} sx={{ mb: 1 }}>
                        <Typography variant="body2">
                          {key}: <strong>{formatCurrency(value.total)}</strong> 
                          <Typography component="span" variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                            ({((value.total / expensesData.total_expenses) * 100).toFixed(1)}%)
                          </Typography>
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </CardContent>
            </AnimatedCard>
          </Grid>
          
          {/* Chart Card */}
          <Grid item xs={12} md={6}>
            <AnimatedCard 
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2 }}
            >
              <CardContent>
                <Typography variant="h6" component="h3" gutterBottom>
                  Expenses Distribution
                </Typography>
                
                <Box sx={{ height: 300, mt: 2 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </AnimatedCard>
          </Grid>
          
          {/* Detailed Expenses Table */}
          <Grid item xs={12}>
            <AnimatedCard 
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.3 }}
            >
              <CardContent>
                <Typography variant="h6" component="h3" gutterBottom>
                  Detailed Expenses
                </Typography>
                
                <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Category</TableCell>
                        <TableCell>Vendor</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell align="right">Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(expensesData.expenses).flatMap(([, groupData]) => 
                        (groupData.items ?? []).map(item => [
                          item.category,
                          item.vendor,
                          item.description,
                          item.date,
                          formatCurrency(item.amount)
                        ])
                      )}
                      <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                        <TableCell {...{ colSpan: 4 }} sx={{ fontWeight: 'bold' }}>TOTAL</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          {formatCurrency(expensesData.total_expenses)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </AnimatedCard>
          </Grid>
          
          {/* Expense Trends */}
          <Grid item xs={12}>
            {renderExpenseTrends()}
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  // Render Expense Trends
  const renderExpenseTrends = () => {
    if (!expensesData) return null;
    
    // Prepare data for line chart
    const lineData = Object.entries(expensesData.expenses).map(([key, data]) => ({
      name: key,
      amount: data.total
    }));
    
    return (
      <Box sx={{ height: 300, mt: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          <DateRangeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Expense Trends
        </Typography>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={lineData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
            <Line type="monotone" dataKey="amount" stroke={theme.palette.primary.main} activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    );
  };
  
  // Export to PDF function
  const exportToPdf = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Financial Report', 14, 22);
    
    // Add date range
    doc.setFontSize(12);
    doc.text(`Period: ${dateRange.from_date.format('YYYY-MM-DD')} to ${dateRange.to_date.format('YYYY-MM-DD')}`, 14, 30);
    
    // Add report type based on current tab
    let reportTitle = '';
    if (tabValue === 0) {
      reportTitle = 'Trial Balance';
      
      if (trialBalanceData) {
        // Add trial balance table
        const tableData = [
          ...trialBalanceData.accounts.assets.map(account => [
            account.account_code,
            account.account_name,
            formatCurrency(account.debit),
            formatCurrency(account.credit)
          ]),
          ...trialBalanceData.accounts.liabilities.map(account => [
            account.account_code,
            account.account_name,
            formatCurrency(account.debit),
            formatCurrency(account.credit)
          ]),
          ...trialBalanceData.accounts.revenue.map(account => [
            account.account_code,
            account.account_name,
            formatCurrency(account.debit),
            formatCurrency(account.credit)
          ]),
          ...trialBalanceData.accounts.expenses.map(account => [
            account.account_code,
            account.account_name,
            formatCurrency(account.debit),
            formatCurrency(account.credit)
          ]),
          ['TOTAL', '', formatCurrency(trialBalanceData.totals.debit_total), formatCurrency(trialBalanceData.totals.credit_total)]
        ];
        
        autoTable(doc, {
          head: [['Account Code', 'Account Name', 'Debit', 'Credit']],
          body: tableData,
          startY: 40
        });
      }
    } else if (tabValue === 1) {
      reportTitle = 'Profit & Loss Statement';
      
      if (profitLossData) {
        // Add summary
        doc.text('Summary', 14, 40);
        doc.text(`Total Revenue: ${formatCurrency(profitLossData.summary.total_revenue)}`, 14, 48);
        doc.text(`Total Expenses: ${formatCurrency(profitLossData.summary.total_expenses)}`, 14, 56);
        doc.text(`Net Profit/Loss: ${formatCurrency(profitLossData.summary.net_profit)}`, 14, 64);
        doc.text(`Profit Margin: ${profitLossData.summary.profit_margin.toFixed(2)}%`, 14, 72);
        
        // Add revenue breakdown
        doc.text('Revenue Breakdown', 14, 84);
        
        const revenueData = profitLossData.revenue?.items?.map(item => [
          item.name,
          formatCurrency(item.amount),
          `${item.percentage?.toFixed(1)}%`
        ]) || [];
        
        autoTable(doc, {
          head: [['Source', 'Amount', 'Percentage']],
          body: revenueData,
          startY: 88
        });
        
        // Add expense breakdown
        interface JsPDFWithAutoTable extends jsPDF {
          lastAutoTable: {
            finalY: number;
          };
        }

        const finalY = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 10;
        doc.text('Expense Breakdown', 14, finalY);
        
        const expenseData = profitLossData.expenses?.items?.map(item => [
          item.name,
          formatCurrency(item.amount),
          `${item.percentage?.toFixed(1)}%`
        ]) || [];
        
        autoTable(doc, {
          head: [['Category', 'Amount', 'Percentage']],
          body: expenseData,
          startY: finalY + 4
        });
      }
    } else if (tabValue === 2) {
      reportTitle = 'Expenses Report';
      
      if (expensesData) {
        // Add summary
        doc.text(`Total Expenses: ${formatCurrency(expensesData.total_expenses)}`, 14, 40);
        doc.text(`Grouped by: ${expensesData.grouped_by}`, 14, 48);
        
        // Add detailed expenses
        doc.text('Detailed Expenses', 14, 60);
        
        const expenseTableData = [];
        
        for (const [, groupData] of Object.entries(expensesData.expenses)) {
          if (groupData.items) {
            for (const item of groupData.items) {
              expenseTableData.push([
                item.category,
                item.vendor,
                item.description,
                item.date,
                formatCurrency(item.amount)
              ]);
            }
          }
        }
        
        autoTable(doc, {
          head: [['Category', 'Vendor', 'Description', 'Date', 'Amount']],
          body: expenseTableData,
          startY: 64
        });
      }
    }
    
    doc.setFontSize(14);
    doc.text(reportTitle, 14, 38);
    
    // Save the PDF
    doc.save(`${reportTitle.toLowerCase().replace(/\s+/g, '-')}-${dateRange.from_date.format('YYYY-MM-DD')}-to-${dateRange.to_date.format('YYYY-MM-DD')}.pdf`);
  };
  
  // Export to CSV function
  const exportToCsv = () => {
    let csvContent = '';
    let filename = '';
    
    if (tabValue === 0 && trialBalanceData) {
      // Trial Balance CSV
      filename = `trial-balance-${dateRange.from_date.format('YYYY-MM-DD')}-to-${dateRange.to_date.format('YYYY-MM-DD')}.csv`;
      
      // Headers
      csvContent = 'Account Code,Account Name,Debit,Credit\n';
      
      // Assets
      trialBalanceData.accounts.assets.forEach(account => {
        csvContent += `${account.account_code},"${account.account_name}",${account.debit},${account.credit}\n`;
      });
      
      // Liabilities
      trialBalanceData.accounts.liabilities.forEach(account => {
        csvContent += `${account.account_code},"${account.account_name}",${account.debit},${account.credit}\n`;
      });
      
      // Revenue
      trialBalanceData.accounts.revenue.forEach(account => {
        csvContent += `${account.account_code},"${account.account_name}",${account.debit},${account.credit}\n`;
      });
      
      // Expenses
      trialBalanceData.accounts.expenses.forEach(account => {
        csvContent += `${account.account_code},"${account.account_name}",${account.debit},${account.credit}\n`;
      });
      
      // Totals
      csvContent += `TOTAL,"",${trialBalanceData.totals.debit_total},${trialBalanceData.totals.credit_total}\n`;
      
    } else if (tabValue === 1 && profitLossData) {
      // Profit & Loss CSV
      filename = `profit-loss-${dateRange.from_date.format('YYYY-MM-DD')}-to-${dateRange.to_date.format('YYYY-MM-DD')}.csv`;
      
      // Summary
      csvContent = 'Profit & Loss Summary\n';
      csvContent += `Total Revenue,${profitLossData.summary.total_revenue}\n`;
      csvContent += `Total Expenses,${profitLossData.summary.total_expenses}\n`;
      csvContent += `Net Profit/Loss,${profitLossData.summary.net_profit}\n`;
      csvContent += `Profit Margin,${profitLossData.summary.profit_margin.toFixed(2)}%\n\n`;
      
      // Revenue breakdown
      csvContent += 'Revenue Breakdown\n';
      csvContent += 'Source,Amount,Percentage\n';
      
      (profitLossData.revenue?.items || []).forEach(item => {
        csvContent += `"${item.name}",${item.amount},${item.percentage?.toFixed(1)}%\n`;
      });
      
      csvContent += `Total,${profitLossData.revenue.total},100%\n\n`;
      
      // Expense breakdown
      csvContent += 'Expense Breakdown\n';
      csvContent += 'Category,Amount,Percentage\n';
      
      (profitLossData.expenses?.items || []).forEach(item => {
        csvContent += `"${item.name}",${item.amount},${item.percentage?.toFixed(1)}%\n`;
      });
      
      csvContent += `Total,${profitLossData.expenses.total},100%\n`;
      
    } else if (tabValue === 2 && expensesData) {
      // Expenses CSV
      filename = `expenses-${dateRange.from_date.format('YYYY-MM-DD')}-to-${dateRange.to_date.format('YYYY-MM-DD')}.csv`;
      
      // Summary
      csvContent = 'Expenses Summary\n';
      csvContent += `Total Expenses,${expensesData.total_expenses}\n`;
      csvContent += `Grouped by,${expensesData.grouped_by}\n\n`;
      
      // Detailed expenses
      csvContent += 'Detailed Expenses\n';
      csvContent += 'Category,Vendor,Description,Date,Amount\n';
      
      Object.entries(expensesData.expenses).forEach(([groupKey, groupData]) => {
        (groupData.items ?? []).forEach(item => {
          csvContent += `"${groupKey}","${item.description}",${item.amount},"${item.vendor}",${item.date}\n`;
        });
      });
    }
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Fetch initial data
  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);
  
  return (
    <Box>
      {/* Report Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h6" component="h2" gutterBottom>
                <AccountBalanceIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Financial Reports
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button 
                  variant="outlined" 
                  startIcon={<PdfIcon />}
                  onClick={exportToPdf}
                >
                  Export PDF
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<CsvIcon />}
                  onClick={exportToCsv}
                >
                  Export CSV
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<PrintIcon />}
                  onClick={() => window.print()}
                >
                  Print
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  onClick={() => {
                    // Show/hide advanced filters
                    // This is just a placeholder - you would implement actual filter functionality
                    console.log('Show advanced filters');
                  }}
                  sx={{ ml: 1 }}
                >
                  Filters
                </Button>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="From Date"
                  value={dateRange.from_date}
                  onChange={(date) => handleDateChange('from_date', date)}
                  slotProps={{ 
                    textField: { 
                      fullWidth: true,
                      size: "small"
                    } 
                  }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="To Date"
                  value={dateRange.to_date}
                  onChange={(date) => handleDateChange('to_date', date)}
                  slotProps={{ 
                    textField: { 
                      fullWidth: true,
                      size: "small"
                    } 
                  }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel id="group-by-label">Group By</InputLabel>
                <Select
                  labelId="group-by-label"
                  value={groupBy}
                  label="Group By"
                  onChange={handleGroupByChange}
                >
                  {tabValue === 2 ? 
                    // Options for Expenses tab
                    [
                      <MenuItem key="category" value="category">Category</MenuItem>,
                      <MenuItem key="vendor" value="vendor">Vendor</MenuItem>,
                      <MenuItem key="date" value="date">Date</MenuItem>
                    ]
                    : 
                    // Options for other tabs
                    [
                      <MenuItem key="day" value="day">Day</MenuItem>,
                      <MenuItem key="week" value="week">Week</MenuItem>,
                      <MenuItem key="month" value="month">Month</MenuItem>
                    ]
                  }
                </Select>
              </FormControl>
            </Grid>
            
            {tabValue === 1 && (
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <Button
                    variant={compareWithPrevious ? "contained" : "outlined"}
                    color="primary"
                    startIcon={<CompareArrowsIcon />}
                    onClick={handleCompareToggle}
                    size="medium"
                  >
                    {compareWithPrevious ? "Comparing with Previous" : "Compare with Previous"}
                  </Button>
                </FormControl>
              </Grid>
            )}
            
            <Grid item xs={12} md={4}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<RefreshIcon />}
                onClick={() => fetchReportData()}
                fullWidth
              >
                Generate Report
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {/* Report Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          aria-label="financial report tabs"
        >
          <Tab 
            icon={<AccountBalanceIcon />} 
            iconPosition="start" 
            label="Trial Balance" 
          />
          <Tab 
            icon={<TrendingUpIcon />} 
            iconPosition="start" 
            label="Profit & Loss" 
          />
          <Tab 
            icon={<ReceiptIcon />} 
            iconPosition="start" 
            label="Expenses" 
          />
        </Tabs>
      </Box>
      
      {/* Tab Content */}
      <TabPanel value={tabValue} index={0}>
        {renderTrialBalance()}
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        {renderProfitLoss()}
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        {renderExpenses()}
      </TabPanel>
    </Box>
  );
}                   