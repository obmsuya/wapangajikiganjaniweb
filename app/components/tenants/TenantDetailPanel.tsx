// components/tenants/TenantDetailPanel.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  Divider, 
  Chip, 
  Button, 
  Avatar, 
  Skeleton, 
  Tabs, 
  Tab, 
  Card, 
  CardContent, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Tooltip, 
  useTheme,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  AlertColor,
  SelectChangeEvent
} from '@mui/material';
import { 
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Work as WorkIcon,
  ContactPhone as ContactPhoneIcon,
  CalendarToday as CalendarIcon,
  EventNote as EventNoteIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilePresent as FileIcon,
  Home as HomeIcon,
  Description as DocumentIcon,
  History as HistoryIcon,
  Warning as WarningIcon,
  CheckCircle as VerifiedIcon,
} from '@mui/icons-material';
import AdminTenantService from '@/services/tenant';
import { Tenant, TenantOccupancy, TenantDocument, TenantNote } from '@/services/tenant';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

export type TenantStatus = 'active' | 'pending' | 'former' | 'blacklisted';
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tenant-tabpanel-${index}`}
      aria-labelledby={`tenant-tab-${index}`}
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

interface TenantDetailPanelProps {
  tenantId: number;
}

/**
 * Expandable panel showing detailed tenant information
 * Used in the tenant detail page
 */
export default function TenantDetailPanel({ tenantId }: TenantDetailPanelProps) {
  const theme = useTheme();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [occupancies, setOccupancies] = useState<TenantOccupancy[]>([]);
  const [documents, setDocuments] = useState<TenantDocument[]>([]);
  const [notes, setNotes] = useState<TenantNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState<Partial<Tenant>>({});
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Fetch tenant details on component mount
  useEffect(() => {
    fetchTenantDetails();
  }, [tenantId]);

  const fetchTenantDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch tenant details
      const tenantData = await AdminTenantService.getAdminTenantDetails(tenantId);
      setTenant(tenantData);
      
      // Use AdminTenantService for occupancies
      try {
        // We need to add this method to AdminTenantService
        const occupancyData = await AdminTenantService.getTenantOccupancies(tenantId);
        setOccupancies(occupancyData.results || []);
      } catch (occupancyError) {
        console.error('Error fetching occupancies:', occupancyError);
      }
      
      // Use AdminTenantService for documents
      try {
        // We need to add this method to AdminTenantService
        const documentData = await AdminTenantService.getTenantDocuments(tenantId);
        setDocuments(documentData.results || []);
      } catch (documentError) {
        console.error('Error fetching documents:', documentError);
      }
      
      // Use AdminTenantService for notes
      try {
        // We need to add this method to AdminTenantService
        const noteData = await AdminTenantService.getTenantNotes(tenantId);
        setNotes(noteData.results || []);
      } catch (noteError) {
        console.error('Error fetching notes:', noteError);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching tenant details:', err);
      setError('Failed to load tenant details');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEditClick = () => {
    if (tenant) {
      setEditData({
        full_name: tenant.full_name,
        phone_number: tenant.phone_number,
        email: tenant.email,
        status: tenant.status,
        emergency_contact_name: tenant.emergency_contact_name,
        emergency_contact_phone: tenant.emergency_contact_phone,
        emergency_contact_relationship: tenant.emergency_contact_relationship,
        occupation: tenant.occupation,
        employer_name: tenant.employer_name,
        employer_contact: tenant.employer_contact
      });
      setIsEditDialogOpen(true);
    }
  };

  const handleEditSubmit = async () => {
    try {
      setLoading(true);
      await AdminTenantService.updateTenant(tenantId, editData);
      setIsEditDialogOpen(false);
      fetchTenantDetails();
    } catch (err) {
      console.error('Error updating tenant:', err);
      setError('Failed to update tenant');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setLoading(true);
      await AdminTenantService.deleteTenant(tenantId);
      setIsDeleteDialogOpen(false);
      // Redirect to tenant list page - this would need to be implemented
      window.location.href = '/tenants';
    } catch (err) {
      console.error('Error deleting tenant:', err);
      setError('Failed to delete tenant');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status?: string): AlertColor => {
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
        return 'info';
    }
  };

  // Add this new component for document items
  const DocumentItem = ({ document }: { document: TenantDocument }) => (
    <ListItem>
      <ListItemIcon>
        <Tooltip title={document.verification_status}>
          {document.is_verified ? 
            <VerifiedIcon color="success" /> : 
            <DocumentIcon color="action" />
          }
        </Tooltip>
      </ListItemIcon>
      <ListItemText
        primary={document.title}
        secondary={`Uploaded ${new Date(document.uploaded_at).toLocaleDateString()}`}
      />
    </ListItem>
  );

  // Add this new component for note items
  const NoteItem = ({ note }: { note: TenantNote }) => (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary">
          {note.note_type.charAt(0).toUpperCase() + note.note_type.slice(1)}
        </Typography>
        <Typography variant="h6" gutterBottom>
          {note.title}
        </Typography>
        <Typography variant="body2">
          {note.content}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Added by {note.created_by_name} on {new Date(note.created_at).toLocaleDateString()}
        </Typography>
      </CardContent>
    </Card>
  );

  // Add this new component for occupancy items after the NoteItem component
  const OccupancyItem = ({ occupancy }: { occupancy: TenantOccupancy }) => (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              {occupancy.property_name} - Unit {occupancy.unit_number}
            </Typography>
            <Chip 
              label={occupancy.status.charAt(0).toUpperCase() + occupancy.status.slice(1)}
              color={
                occupancy.status === 'active' ? 'success' : 
                occupancy.status === 'pending' ? 'warning' : 
                occupancy.status === 'ended' ? 'default' : 'error'
              }
              size="small"
              sx={{ mr: 1 }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Rent: ${occupancy.rent_amount}/month
          </Typography>
        </Box>
        
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="body2" color="text.secondary">Start Date</Typography>
            <Typography variant="body1">
              {new Date(occupancy.start_date).toLocaleDateString()}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="body2" color="text.secondary">End Date</Typography>
            <Typography variant="body1">
              {occupancy.end_date ? new Date(occupancy.end_date).toLocaleDateString() : 'Ongoing'}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="body2" color="text.secondary">Duration</Typography>
            <Typography variant="body1">
              {occupancy.occupancy_duration ? `${occupancy.occupancy_duration} months` : 'N/A'}
            </Typography>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="body2" color="text.secondary">Deposit</Typography>
            <Typography variant="body1">${occupancy.deposit_amount}</Typography>
          </Box>
          
          <Button size="small" variant="outlined" sx={{ borderRadius: 2 }}>
            View Details
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading && !tenant) {
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
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Skeleton variant="circular" width={120} height={120} />
                <Skeleton variant="text" width="80%" height={32} />
                <Skeleton variant="rectangular" width="60%" height={32} sx={{ borderRadius: 1 }} />
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Skeleton variant="text" width="50%" height={40} />
                <Skeleton variant="rectangular" width={120} height={36} sx={{ borderRadius: 1 }} />
              </Box>
              <Grid container spacing={2}>
                {Array.from(new Array(6)).map((_, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Skeleton variant="text" width="90%" />
                    <Skeleton variant="text" width="70%" />
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    );
  }

  if (error && !tenant) {
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
            onClick={fetchTenantDetails}
          >
            Retry
          </Button>
        </Paper>
      </Box>
    );
  }

  if (!tenant) {
    return null;
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Tenant Summary Card */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 3,
          mb: 3,
          borderRadius: 2,
          boxShadow: theme.palette.mode === 'light' 
            ? '0px 2px 4px rgba(0, 0, 0, 0.05), 0px 4px 6px rgba(0, 0, 0, 0.07)'
            : '0px 2px 4px rgba(0, 0, 0, 0.2), 0px 4px 6px rgba(0, 0, 0, 0.3)',
        }}
      >
        <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Avatar
                src={tenant.profile_image}
                alt={tenant.full_name}
                sx={{ 
                  width: 120, 
                  height: 120, 
                  border: `4px solid ${theme.palette.background.paper}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                {tenant.full_name.split(' ').map(name => name[0]).join('')}
              </Avatar>
              
              <Typography variant="h5" sx={{ fontWeight: 700, textAlign: 'center' }}>
                {tenant.full_name}
              </Typography>
              
              <Chip 
                label={tenant.status.charAt(0).toUpperCase() + tenant.status.slice(1)}
                color={getStatusColor(tenant.status)}
                sx={{ fontWeight: 500, fontSize: '0.9rem', py: 0.5, px: 1 }}
              />
              
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                ID: {tenant.id_type} {tenant.id_number}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3, gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleEditClick}
                sx={{ borderRadius: 2 }}
              >
                Edit Tenant
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDeleteClick}
                sx={{ borderRadius: 2 }}
              >
                Delete
              </Button>
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Phone Number</Typography>
                    <Typography variant="body1">{tenant.phone_number}</Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Email Address</Typography>
                    <Typography variant="body1">{tenant.email || 'Not provided'}</Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <WorkIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Occupation</Typography>
                    <Typography variant="body1">{tenant.occupation || 'Not provided'}</Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Employer</Typography>
                    <Typography variant="body1">{tenant.employer_name || 'Not provided'}</Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Date Joined</Typography>
                    <Typography variant="body1">
                      {new Date(tenant.date_joined).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ContactPhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Emergency Contact</Typography>
                    <Typography variant="body1">
                      {tenant.emergency_contact_name} ({tenant.emergency_contact_relationship})
                    </Typography>
                    <Typography variant="body2">{tenant.emergency_contact_phone}</Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Tenant Detail Tabs */}
      <Paper 
        elevation={0}
        sx={{ 
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: theme.palette.mode === 'light' 
            ? '0px 2px 4px rgba(0, 0, 0, 0.05), 0px 4px 6px rgba(0, 0, 0, 0.07)'
            : '0px 2px 4px rgba(0, 0, 0, 0.2), 0px 4px 6px rgba(0, 0, 0, 0.3)',
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="tenant details tabs"
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
            <Tab label="Occupancies" id="tenant-tab-0" aria-controls="tenant-tabpanel-0" />
            <Tab label="Documents" id="tenant-tab-1" aria-controls="tenant-tabpanel-1" />
            <Tab label="Notes" id="tenant-tab-2" aria-controls="tenant-tabpanel-2" />
            <Tab label="Activity" id="tenant-tab-3" aria-controls="tenant-tabpanel-3" />
          </Tabs>
        </Box>
        
        <Box sx={{ p: 3 }}>
          {/* Occupancies Tab */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Properties & Units</Typography>
              <Button 
                variant="outlined" 
                size="small"
                sx={{ borderRadius: 2 }}
              >
                Assign New Unit
              </Button>
            </Box>
            
            {occupancies.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 5 }}>
                <HomeIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>No Active Occupancies</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  This tenant is not currently occupying any properties or units.
                </Typography>
                <Button 
                  variant="contained"
                  sx={{ borderRadius: 2 }}
                >
                  Assign a Property Unit
                </Button>
              </Box>
            ) : (
              <Box>
                {occupancies.map((occupancy) => (
                  <OccupancyItem key={occupancy.id} occupancy={occupancy} />
                ))}
              </Box>
            )}
          </TabPanel>
          
          {/* Documents Tab */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Tenant Documents</Typography>
              <Button 
                variant="outlined" 
                size="small"
                sx={{ borderRadius: 2 }}
              >
                Upload Document
              </Button>
            </Box>
            
            {tenant.document_count === 0 ? (
              <Box sx={{ textAlign: 'center', py: 5 }}>
                <FileIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>No Documents Uploaded</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  There are no documents uploaded for this tenant.
                </Typography>
                <Button 
                  variant="contained"
                  sx={{ borderRadius: 2 }}
                >
                  Upload Document
                </Button>
              </Box>
            ) : (
              <List>
                {documents.map((document) => (
                  <DocumentItem key={document.id} document={document} />
                ))}
              </List>
            )}
          </TabPanel>
          
          {/* Notes Tab */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Tenant Notes</Typography>
              <Button 
                variant="outlined" 
                size="small"
                sx={{ borderRadius: 2 }}
              >
                Add Note
              </Button>
            </Box>
            
            {notes.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 5 }}>
                <EventNoteIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>No Notes</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  There are no notes for this tenant.
                </Typography>
                <Button 
                  variant="contained"
                  sx={{ borderRadius: 2 }}
                >
                  Add First Note
                </Button>
              </Box>
            ) : (
              <Box>
                {notes.map((note) => (
                  <NoteItem key={note.id} note={note} />
                ))}
              </Box>
            )}
          </TabPanel>
          
          {/* Activity Tab */}
          <TabPanel value={tabValue} index={3}>
            <Typography variant="h6" sx={{ mb: 3 }}>System Activity</Typography>
            <List>
              {tenant.active_occupancy_count > 0 ? (
                <>
                  <ListItem>
                    <ListItemIcon>
                      <HistoryIcon color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Last Activity"
                      secondary={`Last login: ${new Date().toLocaleDateString()}`}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemIcon>
                      <WarningIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary="System Alerts"
                      secondary="No recent alerts"
                    />
                  </ListItem>
                </>
              ) : (
                <ListItem>
                  <ListItemText
                    primary="No recent activity"
                    secondary="Activity log will appear here"
                  />
                </ListItem>
              )}
            </List>
          </TabPanel>
        </Box>
      </Paper>
      
      {/* Edit Tenant Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Tenant</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Full Name"
                fullWidth
                value={editData.full_name || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditData({ ...editData, full_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Phone Number"
                fullWidth
                value={editData.phone_number || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditData({ ...editData, phone_number: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email"
                fullWidth
                value={editData.email || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditData({ ...editData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editData.status || ''}
                  label="Status"
                  onChange={(e: SelectChangeEvent<string>) => setEditData({ ...editData, status: e.target.value as TenantStatus })}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="former">Former</MenuItem>
                  <MenuItem value="blacklisted">Blacklisted</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Occupation"
                fullWidth
                value={editData.occupation || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditData({ ...editData, occupation: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Employer Name"
                fullWidth
                value={editData.employer_name || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditData({ ...editData, employer_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Emergency Contact</Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Name"
                fullWidth
                value={editData.emergency_contact_name || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditData({ ...editData, emergency_contact_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Phone"
                fullWidth
                value={editData.emergency_contact_phone || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditData({ ...editData, emergency_contact_phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Relationship"
                fullWidth
                value={editData.emergency_contact_relationship || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditData({ ...editData, emergency_contact_relationship: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditSubmit} variant="contained">Save Changes</Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Tenant</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {tenant.full_name}? This action cannot be undone.
          </Typography>
          <Typography color="error" sx={{ mt: 2 }}>
            Warning: All associated data including occupancy records, documents, and notes will also be deleted.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}