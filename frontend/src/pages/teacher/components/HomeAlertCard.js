import React from 'react';
import {
    Card, CardContent, Box, Typography, List, ListItem,
    ListItemAvatar, ListItemText, Avatar, Chip, Skeleton, Button
} from '@mui/material';
import {
    Warning as WarningIcon,
    Error as ErrorIcon,
    ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../../hooks/useTranslation';

/**
 * 首页预警/关注卡片
 * 显示需要关注的学生数量和快捷入口
 */
const HomeAlertCard = ({ warningCount = 0, dangerCount = 0, loading = false }) => {
    const { tTeacher } = useTranslation();
    const navigate = useNavigate();

    const totalAlerts = warningCount + dangerCount;

    const handleViewWarnings = () => {
        navigate('/Teacher/progress');
    };

    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <WarningIcon color="warning" sx={{ mr: 1 }} />
                        <Typography variant="h6">
                            {tTeacher('studentAttention') || '学生关注'}
                        </Typography>
                    </Box>
                    {totalAlerts > 0 && (
                        <Chip
                            label={totalAlerts}
                            size="small"
                            color="error"
                            sx={{ fontWeight: 'bold' }}
                        />
                    )}
                </Box>

                {loading ? (
                    <Box>
                        <Skeleton variant="rectangular" height={60} sx={{ mb: 1 }} />
                        <Skeleton variant="rectangular" height={60} />
                    </Box>
                ) : totalAlerts === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                        <Avatar
                            sx={{
                                width: 56,
                                height: 56,
                                bgcolor: 'success.light',
                                mx: 'auto',
                                mb: 1
                            }}
                        >
                            <ErrorIcon sx={{ color: 'success.dark' }} />
                        </Avatar>
                        <Typography variant="body2" color="text.secondary">
                            {tTeacher('allStudentsNormal') || '暂无预警学生'}
                        </Typography>
                    </Box>
                ) : (
                    <List dense>
                        {dangerCount > 0 && (
                            <ListItem
                                sx={{
                                    bgcolor: 'error.light',
                                    borderRadius: 1,
                                    mb: 1
                                }}
                            >
                                <ListItemAvatar>
                                    <Avatar sx={{ bgcolor: 'error.main' }}>
                                        <ErrorIcon />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={dangerCount}
                                    secondary={tTeacher('criticalStudents') || '急需关注'}
                                    primaryTypographyProps={{ fontWeight: 'bold', color: 'error.dark' }}
                                />
                            </ListItem>
                        )}

                        {warningCount > 0 && (
                            <ListItem
                                sx={{
                                    bgcolor: 'warning.light',
                                    borderRadius: 1
                                }}
                            >
                                <ListItemAvatar>
                                    <Avatar sx={{ bgcolor: 'warning.main' }}>
                                        <WarningIcon />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={warningCount}
                                    secondary={tTeacher('atRiskStudents') || '风险学生'}
                                    primaryTypographyProps={{ fontWeight: 'bold', color: 'warning.dark' }}
                                />
                            </ListItem>
                        )}
                    </List>
                )}

                <Button
                    fullWidth
                    variant="outlined"
                    endIcon={<ArrowForwardIcon />}
                    onClick={handleViewWarnings}
                    sx={{ mt: 2 }}
                    disabled={totalAlerts === 0}
                >
                    {tTeacher('viewStudentProgress') || '查看详情'}
                </Button>
            </CardContent>
        </Card>
    );
};

export default HomeAlertCard;
