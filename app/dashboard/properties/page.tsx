'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Skeleton,
  useTheme
} from '@mui/material';
import { 
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Apartment as ApartmentIcon
} from '@mui/icons-material';
import Link from 'next/link';
import AdminPropertyService from '@/services/property';
import { PropertyBase } from '@/services/property';
import PropertyKPICard from '@/app/components/dashboard/PropertyKPICard';

export default function PropertiesPage() {
  const theme = useTheme();
  const [properties, setProperties] = useState<PropertyBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        const response = await AdminPropertyService.getProperties({
          page: page + 1, // API uses 1-based pagination
          page_size: rowsPerPage,
          search: search || undefined
        });
        
        setProperties(response.results);
        setTotalCount(response.count);
        setError(null);
      } catch (err) {
        console.error('Error fetching properties:', err);
        setError('Failed to load properties');
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [page, rowsPerPage, search]);

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

  const getPropertyCategoryLabel = (category: string) => {
    switch (category) {
      case 'apartment':
        return 'Apartment Building';
      case 'villa':
        return 'Villa';
      case 'rooms':
        return 'Normal Rooms';
      case 'bungalow':
        return 'Bungalow';
      default:
        return category;
    }
  };

  const getPropertyCategoryColor = (category: string) => {
    switch (category) {
      case 'apartment':
        return 'primary';
      case 'villa':
        return 'success';
      case 'rooms':
        return 'info';
      case 'bungalow':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, mb: 4 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 700,
            fontFamily: '"Futura PT Bold", "Helvetica", "Arial", sans-serif',
            mb: { xs: 2, sm: 0 }
          }}
        >
          Properties
        </Typography>
        
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          sx={{ 
            borderRadius: 2,
            boxShadow: 'none',
            '&:hover': { boxShadow: 'none' },
          }}
        >
          Add Property
        </Button>
      </Box>

      {/* Property KPIs */}
      <Box sx={{ mb: 4 }}>
        <PropertyKPICard />
      </Box>

      {/* Search and Filters */}
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
        
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search properties by name, address, or owner..."
          value={search}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          } as React.ComponentProps<typeof TextField>['InputProps'] }
          sx={{ 
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            }
          }}
        />
      </Paper>

      {/* Properties Table */}
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
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>Total Area</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                // Loading skeleton rows
                Array.from(new Array(5)).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton variant="text" width="80%" />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="rectangular" width={100} height={30} sx={{ borderRadius: 1 }} />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" width="90%" />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" width={80} />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="rectangular" width={80} height={30} sx={{ borderRadius: 1 }} />
                    </TableCell>
                    <TableCell align="right">
                      <Skeleton variant="circular" width={30} height={30} sx={{ display: 'inline-block', mx: 0.5 }} />
                      <Skeleton variant="circular" width={30} height={30} sx={{ display: 'inline-block', mx: 0.5 }} />
                    </TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell {...{ colspan: 6 }} align="center" sx={{ py: 3 }}>
                    <Typography color="error">{error}</Typography>
                    <Button 
                      variant="outlined" 
                      color="primary"
                      onClick={() => window.location.reload()}
                      sx={{ mt: 2 }}
                    >
                      Retry
                    </Button>
                  </TableCell>
                </TableRow>
              ) : properties.length === 0 ? (
                <TableRow>
                  <TableCell {...{ colspan: 6 }} align="center" sx={{ py: 3 }}>
                    <ApartmentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" sx={{ mb: 1 }}>No properties found</Typography>
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                      {search ? 'Try a different search term' : 'Add your first property to get started'}
                    </Typography>
                    {!search && (
                      <Button 
                        variant="contained"
                        startIcon={<AddIcon />}
                        sx={{ mt: 1 }}
                      >
                        Add Property
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                properties.map((property) => (
                  <TableRow key={property.id} hover>
                    <TableCell>
                      <Link 
                        href={`/properties/${property.id}`}
                        style={{ color: 'inherit', textDecoration: 'none' }}
                      >
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: 500,
                            color: 'primary.main',
                            '&:hover': { 
                              textDecoration: 'underline' 
                            }
                          }}
                        >
                          {property.name}
                        </Typography>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getPropertyCategoryLabel(property.category)}
                        color={getPropertyCategoryColor(property.category) as "primary" | "success" | "info" | "warning" | "default"}
                        size="small"
                        sx={{ 
                          fontWeight: 500,
                          borderRadius: 1,
                        }}
                      />
                    </TableCell>
                    <TableCell>{property.address}</TableCell>
                    <TableCell>{property.total_area} m²</TableCell>
                    <TableCell>
                      <Chip 
                        label={property.is_active ? 'Active' : 'Inactive'} 
                        color={property.is_active ? 'success' : 'default'}
                        size="small"
                        sx={{ borderRadius: 1 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton 
                        size="small" 
                        color="primary"
                        component={Link}
                        href={`/properties/${property.id}`}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small">
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Container>
  );
}