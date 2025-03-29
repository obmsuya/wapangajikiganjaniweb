// components/tenants/TenantListTable.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Typography,
  Skeleton,
  Button,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Tooltip,
  useTheme
} from '@mui/material';
import { 
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import AdminTenantService from '@/services/tenant';
import { Tenant, BulkOperationRequest } from '@/services/tenant';
import { OutlinedInputProps } from '@mui/material';

// Add this interface at the top of the file
interface TenantListTableProps {
  onSelectionChange: (tenantIds: number[]) => void;
}

/**
 * Advanced data table component for tenant management
 * Provides search, filtering, pagination, and bulk operations
 */
export default function TenantListTable({ onSelectionChange }: TenantListTableProps) {
  const theme = useTheme();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedTenants, setSelectedTenants] = useState<number[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    content: '',
    action: () => {}
  });

  // Memoize the fetchTenants function
  const fetchTenants = useCallback(async () => {
    try {
      setLoading(true);
      const response = await AdminTenantService.getAdminTenants({
        page: page + 1,
        page_size: rowsPerPage,
        search: search || undefined,
        status: statusFilter || undefined,
        ordering: '-created_at'
      });
      
      setTenants(response.results);
      setTotalCount(response.count);
      setError(null);
    } catch (err) {
      console.error('Error fetching tenants:', err);
      setError('Failed to load tenants');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, statusFilter]);

  // Include the memoized fetchTenants function in the effect
  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setPage(0);
  };

  const handleStatusFilterChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleBulkMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleBulkMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = tenants.map(tenant => tenant.id);
      setSelectedTenants(newSelected);
      onSelectionChange(newSelected);
    } else {
      setSelectedTenants([]);
      onSelectionChange([]);
    }
  };

  const handleSelectTenant = (id: number) => {
    const selectedIndex = selectedTenants.indexOf(id);
    let newSelected: number[] = [];

    if (selectedIndex === -1) {
      newSelected = [...selectedTenants, id];
    } else {
      newSelected = selectedTenants.filter(tenantId => tenantId !== id);
    }

    setSelectedTenants(newSelected);
    onSelectionChange(newSelected);
  };

  const isSelected = (id: number) => selectedTenants.indexOf(id) !== -1;

  const handleBulkStatusUpdate = (status: string) => {
    setConfirmDialog({
      open: true,
      title: `Update Status to ${status}`,
      content: `Are you sure you want to change the status of ${selectedTenants.length} selected tenants to ${status}?`,
      action: () => performBulkStatusUpdate(status)
    });
    handleBulkMenuClose();
  };

  const performBulkStatusUpdate = async (status: string) => {
    try {
      setLoading(true);
      const bulkData: BulkOperationRequest = {
        operation: 'system_status_update',
        tenant_ids: selectedTenants,
        status: status
      };
      
      await AdminTenantService.performBulkOperation(bulkData);
      setSelectedTenants([]);
      fetchTenants();
    } catch (err) {
      console.error('Error performing bulk operation:', err);
      setError('Failed to update tenant statuses');
    } finally {
      setLoading(false);
      setConfirmDialog(prev => ({ ...prev, open: false }));
    }
  };

  const handleBulkExport = (format: 'csv' | 'excel') => {
    setConfirmDialog({
      open: true,
      title: `Export Data to ${format.toUpperCase()}`,
      content: `Are you sure you want to export data for ${selectedTenants.length} selected tenants?`,
      action: () => performBulkExport(format)
    });
    handleBulkMenuClose();
  };

  const performBulkExport = async (format: 'csv' | 'excel') => {
    try {
      setLoading(true);
      const bulkData: BulkOperationRequest = {
        operation: 'export_data',
        tenant_ids: selectedTenants,
        format: format === 'excel' ? 'excel' : 'csv'
      };
      
      const response = await AdminTenantService.performBulkOperation(bulkData);
      
      // Handle the export URL - this could be download or opening in new tab
      if (response.export_url) {
        window.open(response.export_url, '_blank');
      }
      
      setSelectedTenants([]);
    } catch (err) {
      console.error('Error performing export:', err);
      setError('Failed to export tenant data');
    } finally {
      setLoading(false);
      setConfirmDialog(prev => ({ ...prev, open: false }));
    }
  };

  const handleDeleteTenant = (id: number) => {
    setConfirmDialog({
      open: true,
      title: "Delete Tenant",
      content: "Are you sure you want to delete this tenant? This action cannot be undone.",
      action: () => performDeleteTenant(id)
    });
  };

  const performDeleteTenant = async (id: number) => {
    try {
      setLoading(true);
      await AdminTenantService.deleteTenant(id);
      fetchTenants();
    } catch (err) {
      console.error('Error deleting tenant:', err);
      setError('Failed to delete tenant');
    } finally {
      setLoading(false);
      setConfirmDialog(prev => ({ ...prev, open: false }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'former':
        return 'info';
      case 'blacklisted':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Search and Filter Toolbar */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 2, 
          mb: 2, 
          borderRadius: 2,
          boxShadow: theme.palette.mode === 'light' 
            ? '0px 2px 4px rgba(0, 0, 0, 0.05), 0px 4px 6px rgba(0, 0, 0, 0.07)'
            : '0px 2px 4px rgba(0, 0, 0, 0.2), 0px 4px 6px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <TextField
          placeholder="Search tenants by name, phone, or ID..."
          variant="outlined"
          size="small"
          value={search}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }as OutlinedInputProps}
          sx={{ 
            flexGrow: 1,
            minWidth: { xs: '100%', sm: '300px' },
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            }
          }}
        />
        
        <FormControl 
          size="small" 
          sx={{ 
            minWidth: { xs: '100%', sm: '200px' },
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            }
          }}
        >
          <InputLabel id="status-filter-label">Status</InputLabel>
          <Select
            labelId="status-filter-label"
            id="status-filter"
            value={statusFilter}
            label="Status"
            onChange={handleStatusFilterChange}
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="former">Former</MenuItem>
            <MenuItem value="blacklisted">Blacklisted</MenuItem>
          </Select>
        </FormControl>
      </Paper>
      
      {/* Bulk Operations Toolbar */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          mb: 2,
          alignItems: 'center'
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
          {selectedTenants.length > 0 
            ? `${selectedTenants.length} tenants selected` 
            : 'Select tenants to perform bulk actions'}
        </Typography>
        
        <Button
          variant="outlined"
          startIcon={<FilterListIcon />}
          onClick={handleBulkMenuOpen}
          disabled={selectedTenants.length === 0}
          sx={{ borderRadius: 2 }}
        >
          Bulk Actions
        </Button>
        
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleBulkMenuClose}
        >
          <MenuItem onClick={() => handleBulkStatusUpdate('active')}>Set as Active</MenuItem>
          <MenuItem onClick={() => handleBulkStatusUpdate('pending')}>Set as Pending</MenuItem>
          <MenuItem onClick={() => handleBulkStatusUpdate('former')}>Set as Former</MenuItem>
          <MenuItem onClick={() => handleBulkStatusUpdate('blacklisted')}>Blacklist</MenuItem>
          <MenuItem onClick={() => handleBulkExport('csv')}>Export as CSV</MenuItem>
          <MenuItem onClick={() => handleBulkExport('excel')}>Export as Excel</MenuItem>
        </Menu>
      </Box>
      
      {/* Tenants Data Table */}
      <Paper 
        elevation={0}
        sx={{ 
          width: '100%', 
          mb: 2,
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: theme.palette.mode === 'light' 
            ? '0px 2px 4px rgba(0, 0, 0, 0.05), 0px 4px 6px rgba(0, 0, 0, 0.07)'
            : '0px 2px 4px rgba(0, 0, 0, 0.2), 0px 4px 6px rgba(0, 0, 0, 0.3)',
        }}
      >
        <TableContainer>
          <Table
            sx={{ minWidth: 750 }}
            aria-labelledby="tenantListTable"
            size="medium"
          >
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Tooltip title="Select all tenants">
                    <input 
                      type="checkbox"
                      checked={tenants.length > 0 && selectedTenants.length === tenants.length}
                      onChange={handleSelectAllClick}
                    />
                  </Tooltip>
                </TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Phone Number</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Properties</TableCell>
                <TableCell>Documents</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                // Loading skeleton rows
                Array.from(new Array(5)).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell padding="checkbox">
                      <Skeleton variant="rectangular" width={16} height={16} />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" width="80%" />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" width="60%" />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="rectangular" width={100} height={30} sx={{ borderRadius: 1 }} />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" width={40} />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" width={40} />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" width="60%" />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Skeleton variant="circular" width={30} height={30} />
                        <Skeleton variant="circular" width={30} height={30} />
                        <Skeleton variant="circular" width={30} height={30} />
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell {...{ colspan: 8 }} align="center" sx={{ py: 3 }}>
                    <Typography color="error">{error}</Typography>
                    <Button 
                      variant="outlined" 
                      color="primary"
                      onClick={() => fetchTenants()}
                      sx={{ mt: 2 }}
                    >
                      Retry
                    </Button>
                  </TableCell>
                </TableRow>
              ) : tenants.length === 0 ? (
                <TableRow>
                    <TableCell {...{ colspan: 8 }} align="center" sx={{ py: 3 }}>
                    <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" sx={{ mb: 1 }}>No tenants found</Typography>
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                      {search || statusFilter 
                        ? 'Try a different search term or filter' 
                        : 'Add your first tenant to get started'}
                    </Typography>
                    {!search && !statusFilter && (
                      <Button 
                        variant="contained"
                        sx={{ mt: 1, borderRadius: 2 }}
                      >
                        Add Tenant
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                tenants.map((tenant) => (
                  <TableRow
                    hover
                    role="checkbox"
                    aria-checked={isSelected(tenant.id)}
                    tabIndex={-1}
                    key={tenant.id}
                    selected={isSelected(tenant.id)}
                  >
                    <TableCell padding="checkbox">
                      <input 
                        type="checkbox"
                        checked={isSelected(tenant.id)}
                        onChange={() => handleSelectTenant(tenant.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Link 
                        href={`/tenants/${tenant.id}`}
                        style={{ 
                          textDecoration: 'none',
                          color: 'inherit',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: 500,
                            color: theme.palette.primary.main,
                            '&:hover': { textDecoration: 'underline' }
                          }}
                        >
                          {tenant.full_name}
                        </Typography>
                      </Link>
                    </TableCell>
                    <TableCell>{tenant.phone_number}</TableCell>
                    <TableCell>
                      <Chip 
                        label={tenant.status.charAt(0).toUpperCase() + tenant.status.slice(1)}
                        color={getStatusColor(tenant.status)}
                        size="small"
                        sx={{ borderRadius: 1 }}
                      />
                    </TableCell>
                    <TableCell>{tenant.active_occupancy_count}</TableCell>
                    <TableCell>{tenant.document_count}</TableCell>
                    <TableCell>
                      {new Date(tenant.date_joined).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Tooltip title="View/Edit Tenant">
                          <IconButton 
                            size="small" 
                            component={Link}
                            href={`/tenants/${tenant.id}`}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Tenant">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteTenant(tenant.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="More Actions">
                          <IconButton size="small">
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
      >
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmDialog.content}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
            color="inherit"
          >
            Cancel
          </Button>
          <Button 
            onClick={() => confirmDialog.action()} 
            color="primary" 
            variant="contained"
            autoFocus
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}