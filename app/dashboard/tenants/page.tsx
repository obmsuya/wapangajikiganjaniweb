// app/tenants/page.tsx
'use client';

import { useState } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
} from '@mui/material';
import { 
  PersonAdd as PersonAddIcon 
} from '@mui/icons-material';
import TenantListTable from '@/app/components/tenants/TenantListTable';
import BulkOperationsToolbar from '@/app/components/tenants/BulkOperationsToolbar';

export default function TenantsPage() {
  const [selectedTenants, setSelectedTenants] = useState<number[]>([]);
  
  const handleSelectedTenantsChange = (tenantIds: number[]) => {
    setSelectedTenants(tenantIds);
  };
  
  const handleOperationComplete = () => {
    // Refresh data or update state as needed
    setSelectedTenants([]);
  };
  
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
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
            mb: { xs: 2, sm: 0 }
          }}
        >
          Tenants
        </Typography>
        
        <Button 
          variant="contained" 
          startIcon={<PersonAddIcon />}
          sx={{ 
            borderRadius: 2,
            boxShadow: 'none',
            '&:hover': { boxShadow: 'none' },
          }}
        >
          Add Tenant
        </Button>
      </Box>
      
      {selectedTenants.length > 0 && (
        <BulkOperationsToolbar 
          selectedTenants={selectedTenants}
          onOperationComplete={handleOperationComplete}
        />
      )}
      
      <TenantListTable 
        onSelectionChange={handleSelectedTenantsChange}
      />
    </Container>
  );
}