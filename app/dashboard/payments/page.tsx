'use client';

import { useState } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Tabs, 
  Tab, 
  Paper
} from '@mui/material';
import PaymentDashboard from '@/app/components/payments/PaymentDashboard';
import TransactionList from '@/app/components/payments/TransactionList';
import SubscriptionPlans from '@/app/components/payments/SubscriptionPlans';
import PaymentReconciliation from '@/app/components/payments/PaymentReconciliation';
import FinancialReports from '@/app/components/payments/FinancialReports';
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`payment-tabpanel-${index}`}
      aria-labelledby={`payment-tab-${index}`}
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

export default function PaymentsPage() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 700,
            fontFamily: '"Futura PT Bold", "Helvetica", "Arial", sans-serif',
            mb: 4
          }}
        >
          Payments Management
        </Typography>
        
        <Paper sx={{ mb: 4 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Dashboard" />
            <Tab label="Transactions" />
            <Tab label="Subscriptions" />
            <Tab label="Reconciliation" />
            <Tab label="Reports" />
          </Tabs>
        </Paper>
        
        <TabPanel value={tabValue} index={0}>
          <PaymentDashboard />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <TransactionList />
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <SubscriptionPlans />
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          <PaymentReconciliation />
        </TabPanel>
        
        <TabPanel value={tabValue} index={4}>
          {/* RevenueReports component will go here */}
          <Typography variant="h5">Reports</Typography>
          <FinancialReports />
        </TabPanel>
      </Box>
    </Container>
  );
}
