import React from 'react';
import { useSelector } from 'react-redux';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Avatar,
    Divider,
    Grid
} from '@mui/material';
import { useTranslation } from '../../hooks/useTranslation';
import { safeGet } from '../../utils/safeAccess';

const AdminProfile = () => {
    const { currentUser } = useSelector((state) => state.user);
    const { tAdmin, tCommon } = useTranslation();

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
                        {safeGet(currentUser, 'name', 'A').charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="h5" fontWeight={600}>
                        {safeGet(currentUser, 'name', tCommon('none'))}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        {tAdmin('adminPanel')}
                    </Typography>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <CardContent>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Box mb={2}>
                                <Typography variant="body1" fontWeight={500}>{tCommon('email')}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {safeGet(currentUser, 'email', tCommon('none'))}
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12}>
                            <Box mb={2}>
                                <Typography variant="body1" fontWeight={500}>{tAdmin('schoolManagement')}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {safeGet(currentUser, 'schoolName', tCommon('none'))}
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        </Box>
    );
};

export default AdminProfile;
