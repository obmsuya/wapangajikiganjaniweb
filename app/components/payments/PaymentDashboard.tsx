'use client';

import { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    Card,
    CardContent,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Skeleton,
    Button,
    useTheme,
    alpha,
    Avatar
} from '@mui/material';
import {
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    AccessTime as AccessTimeIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Pending as PendingIcon,
    Payments as PaymentsIcon,
    CreditCard as CreditCardIcon,
    ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import PaymentService, { PaymentAnalytics } from '@/services/payment';
import NextLink from 'next/link';
import { motion } from 'framer-motion';

// Payment provider logos
const PROVIDER_LOGOS: Record<string, string> = {
    'Airtel': 'admin-side/public/images/payment-providers/airtel.png',
    'Tigo': '/images/payment-providers/mixx-by-yas.png',
    'Halopesa': '/images/payment-providers/halopesa.png',
    'Azampesa': '/images/payment-providers/azampesa.png',
    'Mpesa': '/images/payment-providers/mpesa.png',
    'CRDB': '/images/payment-providers/crdb.png',
    'NMB': '/images/payment-providers/nmb.png',
};

// Animated card component
const AnimatedCard = motion(Card);

/**
 * Payment Dashboard Component
 * Displays payment analytics, recent transactions, and charts
 */
export default function PaymentDashboard() {
    const theme = useTheme();
    const [analytics, setAnalytics] = useState<PaymentAnalytics | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');

    // Colors for the pie chart
    const COLORS = [
        theme.palette.primary.main,
        theme.palette.secondary.main,
        theme.palette.error.main,
        theme.palette.warning.main,
        theme.palette.info.main,
    ];

    // Card animation variants
    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.1,
                duration: 0.5,
                ease: "easeOut"
            }
        })
    };

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setLoading(true);
                const data = await PaymentService.getPaymentAnalytics();
                setAnalytics(data);
                setError(null);
            } catch (err) {
                console.error('Error fetching payment analytics:', err);
                setError('Failed to load payment analytics. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    // Format currency
    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'TZS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Format date
    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    // Get status chip color
    const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'default' => {
        switch (status) {
            case 'completed':
                return 'success';
            case 'failed':
                return 'error';
            case 'pending':
                return 'warning';
            default:
                return 'default';
        }
    };

    // Get status icon
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircleIcon fontSize="small" />;
            case 'failed':
                return <ErrorIcon fontSize="small" />;
            case 'pending':
                return <PendingIcon fontSize="small" />;
            default:
                return <AccessTimeIcon fontSize="small" />;
        }
    };

    // Calculate trend percentage based on actual data
    const calculateTrendPercentage = (type: 'completed' | 'pending' | 'failed'): number => {
        if (!analytics) return 0;

        // Get the daily totals data
        const dailyData = analytics.daily_totals;
        if (!dailyData || dailyData.length < 2) return 0;

        // Split the data into two periods for comparison
        const midPoint = Math.floor(dailyData.length / 2);
        const recentPeriod = dailyData.slice(midPoint);
        const previousPeriod = dailyData.slice(0, midPoint);

        // Calculate totals for each period
        const recentTotal = recentPeriod.reduce((sum, day) => sum + day.count, 0);
        const previousTotal = previousPeriod.reduce((sum, day) => sum + day.count, 0);

        // Filter by transaction type using the summary data
        let currentValue = 0;
        let previousValue = 0;

        switch (type) {
            case 'completed':
                currentValue = analytics.summary.total_completed.count;
                // Estimate previous value based on the trend
                previousValue = previousTotal > 0
                    ? Math.round(currentValue * (previousTotal / recentTotal))
                    : currentValue;
                break;
            case 'pending':
                currentValue = analytics.summary.total_pending.count;
                previousValue = previousTotal > 0
                    ? Math.round(currentValue * (previousTotal / recentTotal))
                    : currentValue;
                break;
            case 'failed':
                currentValue = analytics.summary.total_failed.count;
                previousValue = previousTotal > 0
                    ? Math.round(currentValue * (previousTotal / recentTotal))
                    : currentValue;
                break;
        }

        // Calculate percentage change
        if (previousValue === 0) return currentValue > 0 ? 100 : 0;

        const percentageChange = ((currentValue - previousValue) / previousValue) * 100;
        return parseFloat(percentageChange.toFixed(1));
    };

    // Get provider logo
    const getProviderLogo = (provider: string): string => {
        return PROVIDER_LOGOS[provider] || '/images/payment-providers/default.png';
    };

    // Custom pie chart label with provider logos
    const renderCustomizedPieLabel = ({
        cx,
        cy,
        midAngle,
        innerRadius,
        outerRadius,
        name
    }: {
        cx: number;
        cy: number;
        midAngle: number;
        innerRadius: number;
        outerRadius: number;
        name: string;
    }) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <g>
                <image
                    x={x - 12}
                    y={y - 12}
                    width={24}
                    height={24}
                    xlinkHref={getProviderLogo(name)}
                    style={{ borderRadius: '50%' }}
                />
            </g>
        );
    };

    // Render payment method item with logo
    const renderPaymentMethodItem = (provider: string, amount: number) => (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
            <Avatar
                src={getProviderLogo(provider)}
                alt={provider}
                sx={{
                    width: 32,
                    height: 32,
                    mr: 1.5,
                    bgcolor: 'background.paper',
                    border: `1px solid ${theme.palette.divider}`,
                    padding: '2px'
                }}
            />
            <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body2" fontWeight="medium">
                    {provider}
                </Typography>
            </Box>
            <Typography variant="body2" fontWeight="bold">
                {formatCurrency(amount)}
            </Typography>
        </Box>
    );

    if (loading) {
        return (
            <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                    {/* Summary Cards Skeletons */}
                    {[1, 2, 3].map((item) => (
                        <Grid item xs={12} sm={6} md={4} key={item}>
                            <Skeleton
                                variant="rectangular"
                                height={160}
                                sx={{
                                    borderRadius: 3,
                                    boxShadow: theme.shadows[2]
                                }}
                            />
                        </Grid>
                    ))}

                    {/* Charts Skeletons */}
                    <Grid item xs={12} md={8}>
                        <Skeleton
                            variant="rectangular"
                            height={400}
                            sx={{
                                borderRadius: 3,
                                boxShadow: theme.shadows[2]
                            }}
                        />
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Skeleton
                            variant="rectangular"
                            height={400}
                            sx={{
                                borderRadius: 3,
                                boxShadow: theme.shadows[2]
                            }}
                        />
                    </Grid>

                    {/* Recent Transactions Skeleton */}
                    <Grid item xs={12}>
                        <Skeleton
                            variant="rectangular"
                            height={400}
                            sx={{
                                borderRadius: 3,
                                boxShadow: theme.shadows[2]
                            }}
                        />
                    </Grid>
                </Grid>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Paper
                    sx={{
                        p: 4,
                        borderRadius: 3,
                        bgcolor: alpha(theme.palette.error.main, 0.1),
                        color: theme.palette.error.main,
                        border: `1px solid ${theme.palette.error.main}`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        gap: 2
                    }}
                >
                    <ErrorIcon sx={{ fontSize: 60 }} />
                    <Typography variant="h5" fontWeight="bold">Error Loading Dashboard</Typography>
                    <Typography>{error}</Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => window.location.reload()}
                        startIcon={<AccessTimeIcon />}
                        sx={{ mt: 2 }}
                    >
                        Retry
                    </Button>
                </Paper>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 0, md: 2 } }}>
            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* Completed Payments */}
                <Grid item xs={12} sm={4}>
                    <AnimatedCard
                        custom={0}
                        initial="hidden"
                        animate="visible"
                        variants={cardVariants}
                        sx={{
                            height: '100%',
                            borderRadius: 3,
                            borderLeft: `6px solid ${theme.palette.success.main}`,
                            boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.2)}`,
                            transition: 'transform 0.3s, box-shadow 0.3s',
                            '&:hover': {
                                transform: 'translateY(-8px)',
                                boxShadow: `0 12px 20px ${alpha(theme.palette.success.main, 0.3)}`,
                            },
                        }}
                    >
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Completed Payments
                                    </Typography>
                                    {loading ? (
                                        <Skeleton variant="text" width={120} height={40} />
                                    ) : (
                                        <Typography variant="h4" fontWeight="bold">
                                            {formatCurrency(analytics?.summary.total_completed.amount || 0)}
                                        </Typography>
                                    )}
                                </Box>
                                <Avatar
                                    sx={{
                                        bgcolor: alpha(theme.palette.success.main, 0.1),
                                        color: theme.palette.success.main,
                                        width: 56,
                                        height: 56,
                                    }}
                                >
                                    <CheckCircleIcon />
                                </Avatar>
                            </Box>

                            <Divider sx={{ my: 1.5 }} />

                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="body2" color="text.secondary" mr={0.5}>
                                        {loading ? (
                                            <Skeleton variant="text" width={60} />
                                        ) : (
                                            `${analytics?.summary.total_completed.count || 0} transactions`
                                        )}
                                    </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    {calculateTrendPercentage('completed') > 0 ? (
                                        <>
                                            <TrendingUpIcon
                                                fontSize="small"
                                                sx={{ color: theme.palette.success.main, mr: 0.5 }}
                                            />
                                            <Typography
                                                variant="body2"
                                                sx={{ color: theme.palette.success.main, fontWeight: 'medium' }}
                                            >
                                                {Math.abs(calculateTrendPercentage('completed'))}%
                                            </Typography>
                                        </>
                                    ) : calculateTrendPercentage('completed') < 0 ? (
                                        <>
                                            <TrendingDownIcon
                                                fontSize="small"
                                                sx={{ color: theme.palette.error.main, mr: 0.5 }}
                                            />
                                            <Typography
                                                variant="body2"
                                                sx={{ color: theme.palette.error.main, fontWeight: 'medium' }}
                                            >
                                                {Math.abs(calculateTrendPercentage('completed'))}%
                                            </Typography>
                                        </>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            No change
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        </CardContent>
                    </AnimatedCard>
                </Grid>

                {/* Pending Payments */}
                <Grid item xs={12} sm={4}>
                    <AnimatedCard
                        custom={1}
                        initial="hidden"
                        animate="visible"
                        variants={cardVariants}
                        sx={{
                            height: '100%',
                            borderRadius: 3,
                            borderLeft: `6px solid ${theme.palette.warning.main}`,
                            boxShadow: `0 4px 12px ${alpha(theme.palette.warning.main, 0.2)}`,
                            transition: 'transform 0.3s, box-shadow 0.3s',
                            '&:hover': {
                                transform: 'translateY(-8px)',
                                boxShadow: `0 12px 20px ${alpha(theme.palette.warning.main, 0.3)}`,
                            },
                        }}
                    >
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Pending Payments
                                    </Typography>
                                    {loading ? (
                                        <Skeleton variant="text" width={120} height={40} />
                                    ) : (
                                        <Typography variant="h4" fontWeight="bold">
                                            {formatCurrency(analytics?.summary.total_pending.amount || 0)}
                                        </Typography>
                                    )}
                                </Box>
                                <Avatar
                                    sx={{
                                        bgcolor: alpha(theme.palette.warning.main, 0.1),
                                        color: theme.palette.warning.main,
                                        width: 56,
                                        height: 56,
                                    }}
                                >
                                    <PendingIcon />
                                </Avatar>
                            </Box>

                            <Divider sx={{ my: 1.5 }} />

                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="body2" color="text.secondary" mr={0.5}>
                                        {loading ? (
                                            <Skeleton variant="text" width={60} />
                                        ) : (
                                            `${analytics?.summary.total_pending.count || 0} transactions`
                                        )}
                                    </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    {calculateTrendPercentage('pending') > 0 ? (
                                        <>
                                            <TrendingUpIcon
                                                fontSize="small"
                                                sx={{ color: theme.palette.warning.main, mr: 0.5 }}
                                            />
                                            <Typography
                                                variant="body2"
                                                sx={{ color: theme.palette.warning.main, fontWeight: 'medium' }}
                                            >
                                                {Math.abs(calculateTrendPercentage('pending'))}%
                                            </Typography>
                                        </>
                                    ) : calculateTrendPercentage('pending') < 0 ? (
                                        <>
                                            <TrendingDownIcon
                                                fontSize="small"
                                                sx={{ color: theme.palette.success.main, mr: 0.5 }}
                                            />
                                            <Typography
                                                variant="body2"
                                                sx={{ color: theme.palette.success.main, fontWeight: 'medium' }}
                                            >
                                                {Math.abs(calculateTrendPercentage('pending'))}%
                                            </Typography>
                                        </>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            No change
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        </CardContent>
                    </AnimatedCard>
                </Grid>

                {/* Failed Payments */}
                <Grid item xs={12} sm={4}>
                    <AnimatedCard
                        custom={2}
                        initial="hidden"
                        animate="visible"
                        variants={cardVariants}
                        sx={{
                            height: '100%',
                            borderRadius: 3,
                            borderLeft: `6px solid ${theme.palette.error.main}`,
                            boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.2)}`,
                            transition: 'transform 0.3s, box-shadow 0.3s',
                            '&:hover': {
                                transform: 'translateY(-8px)',
                                boxShadow: `0 12px 20px ${alpha(theme.palette.error.main, 0.3)}`,
                            },
                        }}
                    >
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Failed Payments
                                    </Typography>
                                    {loading ? (
                                        <Skeleton variant="text" width={120} height={40} />
                                    ) : (
                                        <Typography variant="h4" fontWeight="bold">
                                            {formatCurrency(analytics?.summary.total_failed.amount || 0)}
                                        </Typography>
                                    )}
                                </Box>
                                <Avatar
                                    sx={{
                                        bgcolor: alpha(theme.palette.error.main, 0.1),
                                        color: theme.palette.error.main,
                                        width: 56,
                                        height: 56,
                                    }}
                                >
                                    <ErrorIcon />
                                </Avatar>
                            </Box>

                            <Divider sx={{ my: 1.5 }} />

                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="body2" color="text.secondary" mr={0.5}>
                                        {loading ? (
                                            <Skeleton variant="text" width={60} />
                                        ) : (
                                            `${analytics?.summary.total_failed.count || 0} transactions`
                                        )}
                                    </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    {calculateTrendPercentage('failed') > 0 ? (
                                        <>
                                            <TrendingUpIcon
                                                fontSize="small"
                                                sx={{ color: theme.palette.error.main, mr: 0.5 }}
                                            />
                                            <Typography
                                                variant="body2"
                                                sx={{ color: theme.palette.error.main, fontWeight: 'medium' }}
                                            >
                                                {Math.abs(calculateTrendPercentage('failed'))}%
                                            </Typography>
                                        </>
                                    ) : calculateTrendPercentage('failed') < 0 ? (
                                        <>
                                            <TrendingDownIcon
                                                fontSize="small"
                                                sx={{ color: theme.palette.success.main, mr: 0.5 }}
                                            />
                                            <Typography
                                                variant="body2"
                                                sx={{ color: theme.palette.success.main, fontWeight: 'medium' }}
                                            >
                                                {Math.abs(calculateTrendPercentage('failed'))}%
                                            </Typography>
                                        </>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            No change
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        </CardContent>
                    </AnimatedCard>
                </Grid>
            </Grid>

            {/* Charts and Tables */}
            <Grid container spacing={3}>
                {/* Daily Payment Totals */}
                <Grid item xs={12} md={8}>
                    <AnimatedCard
                        custom={3}
                        initial="hidden"
                        animate="visible"
                        variants={cardVariants}
                        sx={{
                            height: '100%',
                            borderRadius: 3,
                            boxShadow: theme.shadows[3],
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: theme.shadows[6],
                            },
                        }}
                    >
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" fontWeight="bold">Daily Payment Totals</Typography>
                                <Box>
                                    <Button
                                        size="small"
                                        variant={selectedPeriod === 'week' ? 'contained' : 'outlined'}
                                        onClick={() => setSelectedPeriod('week')}
                                        sx={{ mr: 1, minWidth: '60px' }}
                                    >
                                        Week
                                    </Button>
                                    <Button
                                        size="small"
                                        variant={selectedPeriod === 'month' ? 'contained' : 'outlined'}
                                        onClick={() => setSelectedPeriod('month')}
                                        sx={{ mr: 1, minWidth: '60px' }}
                                    >
                                        Month
                                    </Button>
                                    <Button
                                        size="small"
                                        variant={selectedPeriod === 'year' ? 'contained' : 'outlined'}
                                        onClick={() => setSelectedPeriod('year')}
                                        sx={{ minWidth: '60px' }}
                                    >
                                        Year
                                    </Button>
                                </Box>
                            </Box>

                            <Divider sx={{ mb: 3 }} />

                            <Box sx={{ height: 300 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={analytics?.daily_totals || []}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        />
                                        <YAxis
                                            tickFormatter={(value) => formatCurrency(value)}
                                        />
                                        <RechartsTooltip
                                            formatter={(value: number) => [formatCurrency(value), 'Amount']}
                                            labelFormatter={(label) => formatDate(label as string)}
                                            contentStyle={{
                                                backgroundColor: theme.palette.background.paper,
                                                border: `1px solid ${theme.palette.divider}`,
                                                borderRadius: 8,
                                                boxShadow: theme.shadows[3]
                                            }}
                                        />
                                        <Bar dataKey="total" fill={theme.palette.primary.main} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </AnimatedCard>
                </Grid>

                {/* Payment Methods Chart */}
                <Grid item xs={12} md={4}>
                    <AnimatedCard
                        custom={4}
                        initial="hidden"
                        animate="visible"
                        variants={cardVariants}
                        sx={{
                            height: '100%',
                            borderRadius: 3,
                            boxShadow: theme.shadows[3],
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: theme.shadows[6],
                            },
                        }}
                    >
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" fontWeight="bold">Payment Methods</Typography>
                                <CreditCardIcon color="primary" />
                            </Box>

                            <Divider sx={{ mb: 3 }} />

                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Box sx={{ height: 200, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={analytics?.payment_methods || []}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="total"
                                                    nameKey="provider"
                                                    label={renderCustomizedPieLabel}
                                                >
                                                    {analytics?.payment_methods.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip
                                                    formatter={(value: number) => [formatCurrency(value), 'Amount']}
                                                    labelFormatter={(label) => formatDate(label as string)}
                                                    contentStyle={{
                                                        backgroundColor: theme.palette.background.paper,
                                                        border: `1px solid ${theme.palette.divider}`,
                                                        borderRadius: 8,
                                                        boxShadow: theme.shadows[3]
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Box sx={{ mt: 2 }}>
                                        {analytics?.payment_methods.map((method) => (
                                            renderPaymentMethodItem(method.provider, method.total)
                                        ))}
                                    </Box>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </AnimatedCard>
                </Grid>

                {/* Recent Transactions */}
                <Grid item xs={12}>
                    <AnimatedCard
                        custom={5}
                        initial="hidden"
                        animate="visible"
                        variants={cardVariants}
                        sx={{
                            borderRadius: 3,
                            boxShadow: theme.shadows[3],
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: theme.shadows[6],
                            },
                        }}
                    >
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" fontWeight="bold">Recent Transactions</Typography>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    endIcon={<ArrowForwardIcon />}
                                    component={NextLink}
                                    href="/payments?tab=transactions"
                                >
                                    View All
                                </Button>
                            </Box>

                            <Divider sx={{ mb: 3 }} />

                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Transaction ID</TableCell>
                                            <TableCell>User</TableCell>
                                            <TableCell>Amount</TableCell>
                                            <TableCell>Provider</TableCell>
                                            <TableCell>Date</TableCell>
                                            <TableCell>Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {analytics?.recent_transactions.map((transaction) => (
                                            <TableRow
                                                key={transaction.id}
                                                hover
                                                sx={{
                                                    cursor: 'pointer',
                                                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) }
                                                }}
                                                onClick={() => window.location.href = `/payments/${transaction.id}`}
                                            >
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="medium">
                                                        {transaction.transaction_id}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {transaction.user.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {transaction.user.phone_number}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="medium">
                                                        {formatCurrency(transaction.amount)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Avatar
                                                            src={getProviderLogo(transaction.provider)}
                                                            alt={transaction.provider}
                                                            sx={{
                                                                width: 24,
                                                                height: 24,
                                                                bgcolor: 'background.paper',
                                                                border: `1px solid ${theme.palette.divider}`,
                                                                padding: '2px'
                                                            }}
                                                        />
                                                        <Typography variant="body2">
                                                            {transaction.provider}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {formatDate(transaction.created_at)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        icon={getStatusIcon(transaction.status)}
                                                        label={transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                                                        color={getStatusColor(transaction.status)}
                                                        size="small"
                                                        sx={{
                                                            fontWeight: 'medium',
                                                            '& .MuiChip-icon': {
                                                                marginLeft: '4px',
                                                                marginRight: '-4px'
                                                            }
                                                        }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}

                                        {/* Show empty state if no transactions */}
                                        {(!analytics?.recent_transactions || analytics.recent_transactions.length === 0) && (
                                            <TableRow>
                                                <TableCell {...{ colspan: 6 }} align="center" sx={{ py: 4 }}>
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                                        <PaymentsIcon sx={{ fontSize: 48, color: alpha(theme.palette.text.secondary, 0.5) }} />
                                                        <Typography variant="body1" color="text.secondary">
                                                            No transactions found
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Transactions will appear here once payments are processed
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {/* View more link */}
                            {analytics?.recent_transactions && analytics.recent_transactions.length > 0 && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                    <Button
                                        component={NextLink}
                                        href="/payments?tab=transactions"
                                        endIcon={<ArrowForwardIcon />}
                                        sx={{ textTransform: 'none' }}
                                    >
                                        View all transactions
                                    </Button>
                                </Box>
                            )}
                        </CardContent>
                    </AnimatedCard>
                </Grid>
            </Grid>
        </Box>
    );
}