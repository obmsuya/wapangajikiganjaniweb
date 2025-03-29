// app/tenants/[id]/page.tsx
'use client';

import { useState } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Tabs, 
  Tab, 
  Breadcrumbs, 
  Link as MuiLink, 
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import Link from 'next/link';
import TenantDetailPanel from '@/app/components/tenants/TenantDetailPanel';
import TenantSystemAuditView from '@/app/components/tenants/TenantSystemAuditView';

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
      id={`tenant-detail-tabpanel-${index}`}
      aria-labelledby={`tenant-detail-tab-${index}`}
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

interface TenantDetailPageProps {
  params: {
    id: string;
  };
}

export default function TenantDetailPage({ params }: TenantDetailPageProps) {
  const tenantId = parseInt(params.id, 10);
  const [tabValue, setTabValue] = useState(0);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Breadcrumbs Navigation */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink component={Link} href="/tenants" color="inherit" underline="hover">
          Tenants
        </MuiLink>
        <Typography color="text.primary">Tenant Details</Typography>
      </Breadcrumbs>
      
      {/* Page Header */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' }, 
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', sm: 'center' }, 
        mb: 4 
      }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 700,
            fontFamily: '"Futura PT Bold", "Helvetica", "Arial", sans-serif',
            mb: { xs: 2, sm: 0 },
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <PersonIcon fontSize="large" /> Tenant Details
        </Typography>
        
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />}
          component={Link}
          href="/tenants"
          sx={{ 
            borderRadius: 2,
          }}
        >
          Back to Tenants
        </Button>
      </Box>
      
      {/* Tabs Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="tenant detail tabs"
          sx={{
            '& .MuiTabs-indicator': {
              height: 3,
            },
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.95rem',
              px: 3,
            }
          }}
        >
          <Tab label="Overview" id="tenant-detail-tab-0" aria-controls="tenant-detail-tabpanel-0" />
          <Tab label="System Audit" id="tenant-detail-tab-1" aria-controls="tenant-detail-tabpanel-1" />
        </Tabs>
      </Box>
      
      {/* Tab Content */}
      <TabPanel value={tabValue} index={0}>
        <TenantDetailPanel tenantId={tenantId} />
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <TenantSystemAuditView tenantId={tenantId} />
      </TabPanel>
    </Container>
  );
}