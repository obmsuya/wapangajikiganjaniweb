'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Skeleton, 
  Grid, 
  Stack,
  useTheme
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import ApartmentIcon from '@mui/icons-material/Apartment';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import PercentIcon from '@mui/icons-material/Percent';
import BuildIcon from '@mui/icons-material/Build';
import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb';

import AdminPropertyService from '@/services/property';
import { PortfolioAnalytics } from '@/services/property';

/**
 * PropertyKPICard Component
 * 
 * Displays key property metrics in a row of cards for the admin dashboard
 */
export default function PropertyKPICard() {
  const theme = useTheme();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [portfolioData, setPortfolioData] = useState<PortfolioAnalytics | null>(null);

  useEffect(() => {
    const fetchPropertyAnalytics = async () => {
      try {
        setLoading(true);
        const data = await AdminPropertyService.getPortfolioAnalytics();
        setPortfolioData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching property analytics:', err);
        setError('Failed to load property analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyAnalytics();
  }, []);

  // Define KPI card data
  const kpiCards = [
    {
      title: 'Total Properties',
      value: portfolioData?.property_metrics.total_properties || 0,
      icon: <HomeIcon color="primary" fontSize="large" />,
    },
    {
      title: 'Total Units',
      value: portfolioData?.property_metrics.total_units || 0,
      icon: <ApartmentIcon color="primary" fontSize="large" />,
    },
    {
      title: 'Occupied Units',
      value: portfolioData?.property_metrics.occupied_units || 0,
      icon: <MeetingRoomIcon color="success" fontSize="large" />,
    },
    {
      title: 'Vacant Units',
      value: portfolioData?.property_metrics.vacant_units || 0,
      icon: <DoNotDisturbIcon color="warning" fontSize="large" />,
    },
    {
      title: 'Vacancy Rate',
      value: portfolioData?.property_metrics.vacancy_rate 
        ? `${portfolioData.property_metrics.vacancy_rate.toFixed(1)}%` 
        : '0%',
      icon: <PercentIcon color="info" fontSize="large" />,
    },
    {
      title: 'Under Maintenance',
      value: portfolioData?.property_metrics.maintenance_units || 0,
      icon: <BuildIcon color="error" fontSize="large" />,
    },
  ];

  return (
    <Grid container spacing={2}>
      {kpiCards.map((card, index) => (
        <Grid item xs={6} sm={4} md={2} key={index}>
          <Card 
            sx={{ 
              height: '100%',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.palette.mode === 'light' 
                  ? '0px 6px 10px rgba(0, 0, 0, 0.1)'
                  : '0px 6px 10px rgba(0, 0, 0, 0.3)',
              },
            }}
          >
            <CardContent>
              <Stack
                direction="column"
                spacing={1}
                alignItems="center"
                justifyContent="center"
              >
                {/* Icon */}
                <Box>
                  {card.icon}
                </Box>
                
                {/* Title */}
                <Typography 
                  variant="subtitle2" 
                  color="textSecondary" 
                  align="center"
                  sx={{ fontWeight: 500 }}
                >
                  {card.title}
                </Typography>
                
                {/* Value */}
                {loading ? (
                  <Skeleton 
                    variant="rectangular" 
                    width="80%" 
                    height={32} 
                    sx={{ borderRadius: 1 }} 
                  />
                ) : error ? (
                  <Typography 
                    variant="body2" 
                    color="error" 
                    align="center"
                  >
                    No Data
                  </Typography>
                ) : (
                  <Typography 
                    variant="h5" 
                    color="textPrimary" 
                    align="center"
                    sx={{ 
                      fontWeight: 700,
                      fontFamily: '"Futura PT Bold", "Helvetica", "Arial", sans-serif',
                    }}
                  >
                    {card.value}
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}