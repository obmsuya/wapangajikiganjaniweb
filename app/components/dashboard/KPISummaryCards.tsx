// components/dashboard/KPISummaryCards.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Grid, 
  Typography, 
  Skeleton,
  useTheme,
  Stack,
  Tooltip
} from '@mui/material';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import ApartmentIcon from '@mui/icons-material/Apartment';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import ConstructionIcon from '@mui/icons-material/Construction';
import PercentIcon from '@mui/icons-material/Percent';
import PeopleIcon from '@mui/icons-material/People';

import AdminPropertyService from '@/services/property';
import { PortfolioAnalytics } from '@/services/property';

/**
 * KPI Card props interface
 */
interface KPICardProps {
  title: string;
  value: string | number | null;
  icon: React.ReactNode;
  isLoading: boolean;
  color?: string;
}

/**
 * Individual KPI Card component
 */
const KPICard: React.FC<KPICardProps> = ({ 
  title, 
  value, 
  icon, 
  isLoading,
  color
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  return (
    <Card 
      sx={{ 
        height: '100%',
        borderTop: `4px solid ${color || theme.palette.primary.main}`,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: isDarkMode
            ? '0px 5px 10px rgba(0, 0, 0, 0.4)'
            : '0px 5px 10px rgba(0, 0, 0, 0.1)'
        }
      }}
    >
      <CardContent>
        <Stack 
          direction="row" 
          spacing={1} 
          alignItems="center" 
          mb={1}
        >
          <Box sx={{ color: color || theme.palette.primary.main }}>
            {icon}
          </Box>
          <Typography 
            variant="subtitle2" 
            color="text.secondary"
            sx={{ fontWeight: 600, fontSize: '0.875rem' }}
          >
            {title}
          </Typography>
        </Stack>

        {isLoading ? (
          <Skeleton 
            variant="rectangular" 
            width="80%" 
            height={40} 
            animation="wave"
            sx={{ borderRadius: 1 }}
          />
        ) : (
          value !== null && value !== undefined ? (
            <Typography 
              variant="h4" 
              component="div" 
              sx={{ 
                fontWeight: 700, 
                mt: 1,
                color: theme.palette.text.primary
              }}
            >
              {value}
            </Typography>
          ) : (
            <Typography 
              variant="body1" 
              color="text.secondary" 
              sx={{ fontStyle: 'italic', mt: 1 }}
            >
              No Data
            </Typography>
          )
        )}
      </CardContent>
    </Card>
  );
};

/**
 * KPI Summary Cards component
 * Displays a row of KPI cards for property metrics
 */
const KPISummaryCards: React.FC = () => {
  const [analytics, setAnalytics] = useState<PortfolioAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();

  // Define colors for different KPI cards
  const propertyColor = theme.palette.primary.main;
  const unitColor = theme.palette.info.main;
  const vacancyColor = theme.palette.warning.main;
  const maintenanceColor = theme.palette.error.main;

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        const data = await AdminPropertyService.getPortfolioAnalytics();
        setAnalytics(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching property analytics:', err);
        setError('Failed to load property analytics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // Format the vacancy rate to display with % sign and 1 decimal place
  const formattedVacancyRate = analytics?.property_metrics.vacancy_rate 
    ? `${analytics.property_metrics.vacancy_rate.toFixed(1)}%` 
    : null;

  return (
    <Box sx={{ width: '100%', mb: 3 }}>
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Grid container spacing={2}>
        {/* Total Properties */}
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <KPICard
            title="Total Properties"
            value={analytics?.property_metrics.total_properties || null}
            icon={<HomeWorkIcon />}
            isLoading={isLoading}
            color={propertyColor}
          />
        </Grid>
        
        {/* Total Units */}
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <KPICard
            title="Total Units"
            value={analytics?.property_metrics.total_units || null}
            icon={<ApartmentIcon />}
            isLoading={isLoading}
            color={unitColor}
          />
        </Grid>
        
        {/* Vacant Units */}
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <KPICard
            title="Vacant Units"
            value={analytics?.property_metrics.vacant_units || null}
            icon={<MeetingRoomIcon />}
            isLoading={isLoading}
            color={theme.palette.secondary.main}
          />
        </Grid>
        
        {/* Vacancy Rate */}
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Tooltip title="Percentage of unoccupied units" arrow>
            <Box sx={{ height: '100%' }}>
              <KPICard
                title="Vacancy Rate"
                value={formattedVacancyRate}
                icon={<PercentIcon />}
                isLoading={isLoading}
                color={vacancyColor}
              />
            </Box>
          </Tooltip>
        </Grid>
        
        {/* Occupied Units */}
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <KPICard
            title="Occupied Units"
            value={analytics?.property_metrics.occupied_units || null}
            icon={<PeopleIcon />}
            isLoading={isLoading}
            color={theme.palette.success.main}
          />
        </Grid>
        
        {/* Maintenance Units */}
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <KPICard
            title="Units Under Maintenance"
            value={analytics?.property_metrics.maintenance_units || null}
            icon={<ConstructionIcon />}
            isLoading={isLoading}
            color={maintenanceColor}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default KPISummaryCards;