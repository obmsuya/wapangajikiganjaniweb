'use client';

import { Box, Container, Typography, Breadcrumbs, Link } from '@mui/material';
import TransactionDetail from '@/app/components/payments/TransactionDetail';
import NextLink from 'next/link';
import { NavigateNext as NavigateNextIcon } from '@mui/icons-material';

export default function TransactionDetailPage({ params }: { params: { id: string } }) {
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Breadcrumbs 
          separator={<NavigateNextIcon fontSize="small" />} 
          aria-label="breadcrumb"
          sx={{ mb: 3 }}
        >
          <Link component={NextLink} href="/dashboard" underline="hover" color="inherit">
            Dashboard
          </Link>
          <Link component={NextLink} href="/payments" underline="hover" color="inherit">
            Payments
          </Link>
          <Typography color="text.primary">Transaction Details</Typography>
        </Breadcrumbs>
        
        <TransactionDetail transactionId={params.id} />
      </Box>
    </Container>
  );
}
