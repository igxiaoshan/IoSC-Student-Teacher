import React from 'react';
import {
    Card, CardContent, Box, Typography, LinearProgress,
    List, ListItem, ListItemText, Skeleton
} from '@mui/material';
import {
    Speed as SpeedIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon
} from '@mui/icons-material';
import { useTranslation } from '../../../hooks/useTranslation';

/**
 * 教学效率指标卡片组件
 */
const TeachingEfficiencyCard = ({ data, loading }) => {
    const { tTeacher } = useTranslation();

    const metrics = data || {
        overallScore: 85,
        lessonCompletion: 92,
        studentEngagement: 78,
        averageScore: 82,
        improvement: 5
    };

    const getScoreColor = (score) => {
        if (score >= 85) return 'success';
        if (score >= 70) return 'warning';
        return 'error';
    };

    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <SpeedIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6">{tTeacher('teachingEfficiency') || '教学效率'}</Typography>
                    </Box>
                    <Box
                        component="span"
                        sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            bgcolor: metrics.improvement >= 0 ? 'success.light' : 'error.light',
                            color: metrics.improvement >= 0 ? 'success.dark' : 'error.dark'
                        }}
                    >
                        {metrics.improvement >= 0 ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />}
                        <Typography variant="body2" sx={{ ml: 0.5, fontWeight: 'bold' }}>
                            {metrics.improvement >= 0 ? '+' : ''}{metrics.improvement}%
                        </Typography>
                    </Box>
                </Box>

                {loading ? (
                    <Skeleton variant="circular" width={120} height={120} sx={{ mx: 'auto' }} />
                ) : (
                    <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <Typography
                            variant="h2"
                            color={`${getScoreColor(metrics.overallScore)}.main`}
                            fontWeight="bold"
                        >
                            {metrics.overallScore}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {tTeacher('overallScore')}
                        </Typography>
                    </Box>
                )}

                <List dense>
                    <ListItem sx={{ px: 0 }}>
                        <ListItemText primary={tTeacher('lessonCompletionRate')} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                                variant="determinate"
                                value={metrics.lessonCompletion}
                                sx={{ width: { xs: 60, sm: 80 }, height: 6, borderRadius: 3 }}
                                color="primary"
                            />
                            <Typography variant="body2">{metrics.lessonCompletion}%</Typography>
                        </Box>
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                        <ListItemText primary={tTeacher('studentEngagement')} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                                variant="determinate"
                                value={metrics.studentEngagement}
                                sx={{ width: { xs: 60, sm: 80 }, height: 6, borderRadius: 3 }}
                                color="secondary"
                            />
                            <Typography variant="body2">{metrics.studentEngagement}%</Typography>
                        </Box>
                    </ListItem>
                </List>
            </CardContent>
        </Card>
    );
};

export default TeachingEfficiencyCard;