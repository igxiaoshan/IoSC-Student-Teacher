import React from 'react';
import { useSelector } from 'react-redux';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Avatar,
    Divider
} from '@mui/material';

const AdminProfile = () => {
    const { currentUser } = useSelector((state) => state.user);

    return (
        <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
            padding={4}
        >
            <Card
                sx={{
                    maxWidth: 500,
                    width: '100%',
                    padding: 3,
                    borderRadius: 4,
                    boxShadow: 6,
                }}
            >
                <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
                    <Avatar sx={{ width: 80, height: 80, mb: 2, bgcolor: '#7f56da' }}>
                        {currentUser.name?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="h5" fontWeight={600}>
                        {currentUser.name}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        Admin
                    </Typography>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <CardContent>
                    <Box mb={2}>
                        <Typography variant="body1" fontWeight={500}>Email</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {currentUser.email}
                        </Typography>
                    </Box>

                    <Box mb={2}>
                        <Typography variant="body1" fontWeight={500}>School</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {currentUser.schoolName}
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default AdminProfile;
