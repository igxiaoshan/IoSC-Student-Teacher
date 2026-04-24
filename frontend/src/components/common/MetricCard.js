import { Card, CardContent, Box, Typography, Chip, Avatar } from '@mui/material';

const MetricCard = ({ title, value, change, icon, color = 'primary' }) => {
    return (
        <Card elevation={2}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography color="textSecondary" gutterBottom variant="body2">
                            {title}
                        </Typography>
                        <Typography variant="h4" component="div">
                            {value}
                        </Typography>
                        <Chip
                            label={change}
                            color={color}
                            size="small"
                            sx={{ mt: 1 }}
                        />
                    </Box>
                    <Avatar sx={{ bgcolor: `${color}.light`, width: 48, height: 48 }}>
                        {icon}
                    </Avatar>
                </Box>
            </CardContent>
        </Card>
    );
};

export default MetricCard;
