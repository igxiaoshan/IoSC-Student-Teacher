import React from 'react';
import { Box, Typography, Chip, List, ListItem, ListItemIcon, ListItemText, Divider, Skeleton, Card, CardContent, Avatar, IconButton, Tooltip } from '@mui/material';
import { AccessTime as TimeIcon, School as SchoolIcon, CheckCircle as CheckIcon, Schedule as ScheduleIcon, Notifications as NotificationIcon, TrendingUp as TrendingUpIcon } from '@mui/icons-material';
import { useTranslation } from '../../hooks/useTranslation';

const SubjectTimeline = ({ records = [], nextCourse = null, loading = false, subjectId }) => {
    const { tStudent, tCommon } = useTranslation();

    if (loading) {
        return (
            <Box sx={{ py: 1 }}>
                {[1, 2, 3].map(i => (
                    <Skeleton key={i} height={32} sx={{ mb: 0.5 }} />
                ))}
            </Box>
        );
    }

    const displayRecords = records.slice(0, 3);

    const getActivityIcon = (type) => {
        switch (type) {
            case 'practice': return <CheckIcon fontSize="small" color="success" />;
            case 'exam': return <TimeIcon fontSize="small" color="error" />;
            case 'homework': return <ScheduleIcon fontSize="small" color="info" />;
            case 'learn': return <SchoolIcon fontSize="small" color="primary" />;
            default: return <SchoolIcon fontSize="small" />;
        }
    };

    const getActivityColor = (type) => {
        switch (type) {
            case 'practice': return 'success';
            case 'exam': return 'error';
            case 'homework': return 'info';
            default: return 'primary';
        }
    };

    const formatTime = (time) => {
        if (!time) return '';
        const date = new Date(time);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return tStudent('minutesAgo', { count: diffMins });
        if (diffHours < 24) return tStudent('hoursAgo', { count: diffHours });
        if (diffDays < 7) return tStudent('daysAgo', { count: diffDays });
        return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    };

    return (
        <Box sx={{ py: 1 }}>
            {/* 最近学习记录 */}
            {displayRecords.length > 0 ? (
                <List dense disablePadding>
                    {displayRecords.map((record, index) => (
                        <React.Fragment key={record._id || record.id || index}>
                            <ListItem sx={{ px: 0, py: 0.5 }} dense>
                                <ListItemIcon sx={{ minWidth: 28 }}>
                                    <Avatar sx={{ width: 24, height: 24, bgcolor: `${getActivityColor(record.type)}.light` }}>
                                        {getActivityIcon(record.type)}
                                    </Avatar>
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Typography variant="body2" noWrap sx={{ maxWidth: 120 }}>
                                            {record.title || record.topic || tStudent('learningActivity')}
                                        </Typography>
                                    }
                                    secondary={
                                        <Typography variant="caption" color="text.secondary">
                                            {formatTime(record.time || record.createdAt || record.completedAt)}
                                        </Typography>
                                    }
                                />
                                {record.score !== undefined && (
                                    <Chip
                                        label={tStudent('scoreValue', { score: record.score })}
                                        size="small"
                                        color={record.score >= 80 ? 'success' : record.score >= 60 ? 'warning' : 'error'}
                                        sx={{ height: 20, fontSize: '0.7rem' }}
                                    />
                                )}
                            </ListItem>
                            {index < displayRecords.length - 1 && <Divider sx={{ my: 0.5 }} />}
                        </React.Fragment>
                    ))}
                </List>
            ) : (
                <Typography variant="body2" color="text.secondary" sx={{ py: 1, textAlign: 'center' }}>
                    {tStudent('noLearningRecords')}
                </Typography>
            )}

            {/* 下次课程提醒 */}
            {nextCourse && (
                <Box sx={{ mt: 1.5, pt: 1.5, borderTop: 1, borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <NotificationIcon color="warning" fontSize="small" />
                        <Typography variant="caption" color="warning.main" fontWeight="medium">
                            {tStudent('nextClass')}
                        </Typography>
                    </Box>
                    <Box sx={{ mt: 0.5, pl: 3.5 }}>
                        <Typography variant="body2" fontWeight="medium">
                            {nextCourse.title || nextCourse.topic || tStudent('toBeArranged')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {nextCourse.time ? new Date(nextCourse.time).toLocaleString('zh-CN', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            }) : tStudent('timeTBD')}
                        </Typography>
                    </Box>
                </Box>
            )}
        </Box>
    );
};

// 科目时间线卡片包装器
export const SubjectTimelineCard = ({ subject, records, nextCourse, loading, onViewAll }) => {
    const { tStudent } = useTranslation();
    const subjectName = subject?.subName || tStudent('subject');

    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ScheduleIcon color="primary" sx={{ mr: 1 }} fontSize="small" />
                        <Typography variant="subtitle2">{subjectName} · {tStudent('learningRecords')}</Typography>
                    </Box>
                    {onViewAll && (
                        <Tooltip title={tStudent('viewAll')}>
                            <IconButton size="small" onClick={onViewAll}>
                                <TrendingUpIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
                <SubjectTimeline
                    records={records}
                    nextCourse={nextCourse}
                    loading={loading}
                    subjectId={subject?._id}
                />
            </CardContent>
        </Card>
    );
};

export default SubjectTimeline;
