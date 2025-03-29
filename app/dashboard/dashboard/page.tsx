import UserMetricsCard from "@/app/components/dashboard/UserMetricsCard";
import { Container, Box, Typography } from "@mui/material";

    export default function DashboardPage() {
    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, fontFamily: '"Futura PT Bold", "Helvetica", "Arial", sans-serif' }}>Dashboard</Typography>
                
                <UserMetricsCard />
                
            </Box>
        </Container>
        
    )
}