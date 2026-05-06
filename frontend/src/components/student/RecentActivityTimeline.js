import React from 'react';
import { Card, CardContent, Box, Typography, Avatar, List, ListItem, ListItemAvatar, ListItemText, Chip, Divider, Skeleton } from '@mui/material';
import { School as SchoolIcon, Assignment as AssignmentIcon, AccessTime as TimeIcon, CheckCircle as CheckIcon, PlayArrow as PlayIcon } from '@mui/icons-material';
import { useTranslation } from '../../hooks/useTranslation';

const RecentActivityTimeline = ({ activities, loading }) => {
    const { tStudent } = useTranslation();

    const defaultActivities = [
        { id: 1, type: 'practice', title: tStudent('completedMathPractice') || '完成数学练习', time: tStudent('tenMinAgo') || '10分钟前', score: 85 },
        { id: 2, type: 'learn', title: tStudent('studiedEnglish') || '学习英语课程', time: tStudent('oneHourAgo') || '1小时前', duration: tStudent('duration45Min') || '45分钟' },
        { id: 3, type: 'homework', title: tStudent('submittedPhysics') || '提交物理作业', time: tStudent('yesterday') || '昨天', status: 'completed' }
    ];

    const items = activities || defaultActivities;

    const getActivityIcon = (type) => {
        switch (type) {
            case 'practice': return <CheckIcon color="success" />;
            case 'learn': return <PlayIcon color="primary" />;
            case 'homework': return <AssignmentIcon color="info" />;
            default: return <SchoolIcon />;
        }
    };

    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TimeIcon color="action" sx={{ mr: 1 }} />
                    <Typography variant="h6">{tStudent('recentActivity') || '最近学习'}</Typography>
                </Box>
                {loading ? (
                    <Box>{[1, 2, 3].map(i => <Skeleton key={i} height={50} sx={{ mb: 1 }} />)}</Box>
                ) : (
                    <List dense>
                        {items.map((activity, index) => (
                            <React.Fragment key={activity.id}>
                                <ListItem sx={{ px: 0 }}>
                                    <ListItemAvatar sx={{ minWidth: 36 }}>
                                        <Avatar sx={{ width: 28, height: 28 }}>
                                            {getActivityIcon(activity.type)}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={activity.title}
                                        secondary={activity.time}
                                        primaryTypographyProps={{ variant: 'body2' }}
                                        secondaryTypographyProps={{ variant: 'caption' }}
                                    />
                                    {activity.score && (
                                        <Chip label={`${activity.score}${tStudent('points') || '分'}`} size="small" color="success" />
                                    )}
                                </ListItem>
                                {index < items.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                )}
            </CardContent>
        </Card>
    );
};

export default RecentActivityTimeline;
