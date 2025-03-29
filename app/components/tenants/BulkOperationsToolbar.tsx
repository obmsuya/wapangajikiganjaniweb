// components/tenants/BulkOperationsToolbar.tsx
'use client';

import { useState } from 'react';
import {
  Box,
  Paper,
  Button,
  Menu,
  MenuItem,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Snackbar,
  useTheme
} from '@mui/material';
import {
  ChangeCircle as ChangeCircleIcon,
  FileDownload as FileDownloadIcon,
} from '@mui/icons-material';
import AdminTenantService from '@/services/tenant';
import { BulkOperationRequest } from '@/services/tenant';


interface BulkOperationsToolbarProps {
  selectedTenants: number[];
  onOperationComplete: () => void;
}

/**
 * Interface for performing bulk operations on tenants
 * Provides options for status updates, exports, and mass communications
 */
export default function BulkOperationsToolbar({
  selectedTenants,
  onOperationComplete
}: BulkOperationsToolbarProps) {
  const theme = useTheme();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [operationType, setOperationType] = useState<string>('');
  const [statusValue, setStatusValue] = useState<string>('');
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'excel'>('csv');
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleStatusUpdateClick = () => {
    setOperationType('status_update');
    setDialogOpen(true);
    handleMenuClose();
  };

  const handleExportClick = (format: 'json' | 'csv' | 'excel') => {
    setOperationType('export');
    setExportFormat(format);
    setDialogOpen(true);
    handleMenuClose();
  };

  const handleStatusChange = (event: SelectChangeEvent) => {
    setStatusValue(event.target.value);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setStatusValue('');
  };

  const handleOperation = async () => {
    if (selectedTenants.length === 0) {
      return;
    }

    setIsLoading(true);

    try {
      if (operationType === 'status_update' && statusValue) {
        const bulkData: BulkOperationRequest = {
          operation: 'system_status_update',
          tenant_ids: selectedTenants,
          status: statusValue
        };

        await AdminTenantService.performBulkOperation(bulkData);

        setSnackbar({
          open: true,
          message: `Successfully updated ${selectedTenants.length} tenants to ${statusValue} status`,
          severity: 'success'
        });

        onOperationComplete();
      } else if (operationType === 'export') {
        const bulkData: BulkOperationRequest = {
          operation: 'export_data',
          tenant_ids: selectedTenants,
          format: exportFormat
        };

        const response = await AdminTenantService.performBulkOperation(bulkData);

        // Handle export URL if provided
        if (response.export_url) {
          window.open(response.export_url, '_blank');
        }

        setSnackbar({
          open: true,
          message: `Successfully exported ${selectedTenants.length} tenant records`,
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Bulk operation error:', error);
      setSnackbar({
        open: true,
        message: 'Operation failed. Please try again.',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
      setDialogOpen(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 3,
        borderRadius: 2,
        boxShadow: theme.palette.mode === 'light'
          ? '0px 2px 4px rgba(0, 0, 0, 0.05), 0px 4px 6px rgba(0, 0, 0, 0.07)'
          : '0px 2px 4px rgba(0, 0, 0, 0.2), 0px 4px 6px rgba(0, 0, 0, 0.3)',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          {selectedTenants.length > 0
            ? `${selectedTenants.length} tenants selected`
            : 'Select tenants to perform bulk actions'}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ChangeCircleIcon />}
            disabled={selectedTenants.length === 0}
            onClick={handleStatusUpdateClick}
            sx={{ borderRadius: 2 }}
          >
            Update Status
          </Button>

          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            disabled={selectedTenants.length === 0}
            onClick={handleMenuOpen}
            sx={{ borderRadius: 2 }}
          >
            Export
          </Button>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => handleExportClick('csv')}>Export as CSV</MenuItem>
            <MenuItem onClick={() => handleExportClick('excel')}>Export as Excel</MenuItem>
            <MenuItem onClick={() => handleExportClick('json')}>Export as JSON</MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Status Update Dialog */}
      <Dialog open={dialogOpen && operationType === 'status_update'} onClose={handleDialogClose}>
        <DialogTitle>Update Tenant Status</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Change the status for {selectedTenants.length} selected tenants.
          </DialogContentText>
          <FormControl fullWidth>
            <InputLabel id="status-select-label">Status</InputLabel>
            <Select
              labelId="status-select-label"
              value={statusValue}
              label="Status"
              onChange={handleStatusChange}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="former">Former</MenuItem>
              <MenuItem value="blacklisted">Blacklisted</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} disabled={isLoading}>Cancel</Button>
          <Button
            onClick={handleOperation}
            variant="contained"
            disabled={isLoading || !statusValue}
            autoFocus
          >
            {isLoading ? 'Processing...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={dialogOpen && operationType === 'export'} onClose={handleDialogClose}>
        <DialogTitle>Export Tenant Data</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You are about to export data for {selectedTenants.length} tenants in
            {exportFormat === 'csv' ? ' CSV' :
              exportFormat === 'excel' ? ' Excel' : ' JSON'} format.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} disabled={isLoading}>Cancel</Button>
          <Button
            onClick={handleOperation}
            variant="contained"
            disabled={isLoading}
            autoFocus
          >
            {isLoading ? 'Exporting...' : 'Export'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        
        <Snackbar
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
          variant="default"
        >
          <Typography variant="body1">
          {snackbar.message}
          </Typography>
        </Snackbar>
      </Snackbar>
    </Paper>
  );
}