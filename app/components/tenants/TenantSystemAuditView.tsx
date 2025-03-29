// components/tenants/TenantSystemAuditView.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  Chip, 
  Skeleton, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  useTheme 
} from '@mui/material';
import { 
  Edit as EditIcon,
  RemoveRedEye as ViewIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import AdminTenantService from '@/services/tenant';
import { SystemAudit } from '@/services/tenant';

interface TenantSystemAuditViewProps {
  tenantId: number;
}

/**
 * Comprehensive audit view for tenant activities
 * Shows login history, data modifications, document activity, etc.
 */
export default function TenantSystemAuditView({ tenantId }: TenantSystemAuditViewProps) {
  const theme = useTheme();
  const [auditData, setAuditData] = useState<SystemAudit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAuditData();
  }, [tenantId]);

  const fetchAuditData = async () => {
    try {
      setLoading(true);
      const data = await AdminTenantService.getTenantSystemAudit(tenantId);
      setAuditData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching tenant audit data:', err);
      setError('Failed to load audit data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <Paper 
          elevation={0}
          sx={{ 
            p: 3,
            borderRadius: 2,
            boxShadow: theme.palette.mode === 'light' 
              ? '0px 2px 4px rgba(0, 0, 0, 0.05), 0px 4px 6px rgba(0, 0, 0, 0.07)'
              : '0px 2px 4px rgba(0, 0, 0, 0.2), 0px 4px 6px rgba(0, 0, 0, 0.3)',
          }}
        >
          <Typography variant="h6" sx={{ mb: 3 }}>
            <Skeleton width={200} />
          </Typography>
          <Grid container spacing={3}>
            {Array.from(new Array(4)).map((_, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Box sx={{ p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="80%" height={40} />
                  <Skeleton variant="text" width="40%" />
                </Box>
              </Grid>
            ))}
          </Grid>
          
          <Box sx={{ mt: 4 }}>
            <Skeleton variant="text" width={150} height={32} />
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2, mt: 2 }} />
          </Box>
        </Paper>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ width: '100%' }}>
        <Paper 
          elevation={0}
          sx={{ 
            p: 3,
            borderRadius: 2,
            boxShadow: theme.palette.mode === 'light' 
              ? '0px 2px 4px rgba(0, 0, 0, 0.05), 0px 4px 6px rgba(0, 0, 0, 0.07)'
              : '0px 2px 4px rgba(0, 0, 0, 0.2), 0px 4px 6px rgba(0, 0, 0, 0.3)',
            textAlign: 'center'
          }}
        >
          <Typography color="error" variant="h6" sx={{ mb: 2 }}>
            {error}
          </Typography>
          <Button 
            variant="contained"
            onClick={fetchAuditData}
          >
            Retry
          </Button>
        </Paper>
      </Box>
    );
  }

  if (!auditData) {
    return null;
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Paper 
        elevation={0}
        sx={{ 
          p: 3,
          borderRadius: 2,
          boxShadow: theme.palette.mode === 'light' 
            ? '0px 2px 4px rgba(0, 0, 0, 0.05), 0px 4px 6px rgba(0, 0, 0, 0.07)'
            : '0px 2px 4px rgba(0, 0, 0, 0.2), 0px 4px 6px rgba(0, 0, 0, 0.3)',
        }}
      >
        <Typography variant="h6" sx={{ mb: 3 }}>
          System Audit Log for {auditData.tenant_details.full_name}
        </Typography>
        
        {/* Access Summary */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Box 
              sx={{ 
                p: 2, 
                border: `1px solid ${theme.palette.divider}`, 
                borderRadius: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Typography variant="body2" color="text.secondary">Last Login</Typography>
              <Typography variant="h6" sx={{ my: 1 }}>
                {auditData.system_access.last_login 
                  ? new Date(auditData.system_access.last_login).toLocaleString() 
                  : 'Never'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                IP: 192.168.1.1 (Example)
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Box 
              sx={{ 
                p: 2, 
                border: `1px solid ${theme.palette.divider}`, 
                borderRadius: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Typography variant="body2" color="text.secondary">Login Count</Typography>
              <Typography variant="h6" sx={{ my: 1 }}>
                {auditData.system_access.login_count}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Failed Attempts: {auditData.system_access.failed_login_attempts}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Box 
              sx={{ 
                p: 2, 
                border: `1px solid ${theme.palette.divider}`, 
                borderRadius: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Typography variant="body2" color="text.secondary">Password Changes</Typography>
              <Typography variant="h6" sx={{ my: 1 }}>
                {auditData.system_access.password_changes}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Last Change: {auditData.system_access.last_password_change 
                  ? new Date(auditData.system_access.last_password_change).toLocaleDateString() 
                  : 'Never'}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Box 
              sx={{ 
                p: 2, 
                border: `1px solid ${theme.palette.divider}`, 
                borderRadius: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Typography variant="body2" color="text.secondary">Account Status</Typography>
              <Typography variant="h6" sx={{ my: 1 }}>
                <Chip 
                  label={auditData.tenant_details.status.charAt(0).toUpperCase() + 
                         auditData.tenant_details.status.slice(1)}
                  color={auditData.tenant_details.status === 'active' ? 'success' : 
                         auditData.tenant_details.status === 'pending' ? 'warning' : 
                         auditData.tenant_details.status === 'blacklisted' ? 'error' : 'default'}
                  size="small"
                />
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Since: January 1, 2023 (Example)
              </Typography>
            </Box>
          </Grid>
        </Grid>
        
        {/* Data Modifications Section */}
        <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 2 }}>
          Data Modifications
        </Typography>
        
        <TableContainer sx={{ mb: 4 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date & Time</TableCell>
                <TableCell>Field</TableCell>
                <TableCell>Old Value</TableCell>
                <TableCell>New Value</TableCell>
                <TableCell>Modified By</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {auditData.data_modifications.length === 0 ? (
                <TableRow>
                  <TableCell {...{ colspan: 5 }} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">No data modifications recorded</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                auditData.data_modifications.map((mod, index) => (
                  <TableRow key={index}>
                    <TableCell>{new Date(mod.timestamp).toLocaleString()}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <EditIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        {mod.field}
                      </Box>
                    </TableCell>
                    <TableCell>{mod.old_value || 'N/A'}</TableCell>
                    <TableCell>{mod.new_value || 'N/A'}</TableCell>
                    <TableCell>{mod.modified_by}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Document Activity Section */}
        <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 2 }}>
          Document Activity
        </Typography>
        
        <TableContainer sx={{ mb: 4 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date & Time</TableCell>
                <TableCell>Document</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>User</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {auditData.document_activity.length === 0 ? (
                <TableRow>
                  <TableCell {...{ colspan: 4 }} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">No document activity recorded</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                auditData.document_activity.map((activity, index) => (
                  <TableRow key={index}>
                    <TableCell>{new Date(activity.timestamp).toLocaleString()}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ViewIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        {activity.document_title}
                      </Box>
                    </TableCell>
                    <TableCell>{activity.action}</TableCell>
                    <TableCell>{activity.performed_by}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Communication History Section */}
        <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 2 }}>
          Communication History
        </Typography>
        
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date & Time</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Sent By</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {auditData.communication_history.length === 0 ? (
                <TableRow>
                  <TableCell {...{ colspan: 5 }} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">No communication history recorded</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                auditData.communication_history.map((comm, index) => (
                  <TableRow key={index}>
                    <TableCell>{new Date(comm.timestamp).toLocaleString()}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <EmailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        {comm.type}
                      </Box>
                    </TableCell>
                    <TableCell>{comm.subject}</TableCell>
                    <TableCell>
                      <Chip 
                        label={comm.status}
                        color={comm.status === 'Sent' ? 'success' : 
                               comm.status === 'Failed' ? 'error' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{comm.sent_by}</TableCell>
                  </TableRow>
                )),
                auditData.communication_history.map((comm, index) => (
                    <TableRow key={index}>
                      <TableCell>{new Date(comm.timestamp).toLocaleString()}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <EmailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          {comm.type}
                        </Box>
                      </TableCell>
                      <TableCell>{comm.subject}</TableCell>
                      <TableCell>
                        <Chip 
                          label={comm.status}
                          color={comm.status === 'Sent' ? 'success' : 
                                 comm.status === 'Failed' ? 'error' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{comm.sent_by}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    );
  }