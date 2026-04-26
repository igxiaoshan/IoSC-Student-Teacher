import React from 'react';
import {
    Card, CardContent, Box, Typography, List, ListItem,
    ListItemAvatar, ListItemText, Badge, Skeleton, Chip
} from '@mui/material';
import {
    Timeline as TimelineIcon,
    CheckCircle as CheckIcon,
    Grade as GradeIcon,
    Assignment as AssignmentIcon,
    People as PeopleIcon,
    School as SchoolIcon,
    Notifications as NotificationIcon
} from '@mui/icons-material';
import { useTranslation } from '../../../hooks/useTranslation';

/**
 * 本周教学任务时间线组件
 */
const WeeklyTaskTimeline = ({ tasks, loading }) => {
    const { tTeacher } = useTranslation();

    const defaultTasks = [
        { id: 1, title: '批改第三章作业', deadline: '今天', type: 'grading', completed: false, urgent: true },
        { id: 2, title: '准备期中考试', deadline: '本周三', type: 'exam', completed: false, urgent: false },
        { id: 3, title: '学生家长会', deadline: '本周五', type: 'meeting', completed: false, urgent: false },
        { id: 4, title: '完成教学进度报告', deadline: '下周', type: 'report', completed: true, urgent: false }
    ];

    const items = tasks || defaultTasks;

    const getTypeIcon = (type) => {
        switch (type) {
            case 'grading': return <GradeIcon color="primary" />;
            case 'exam': return <AssignmentIcon color="error" />;
            case 'meeting': return <PeopleIcon color="info" />;
            default: return <SchoolIcon />;
        }
    };

    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TimelineIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6">{tTeacher('weeklyTasks') || '本周任务'}</Typography>
                    </Box>
                    <Badge badgeContent={items.filter(t => !t.completed).length} color="error">
                        <NotificationIcon color="action" />
                    </Badge>
                </Box>
                {loading ? (
                    <Box>{[1, 2, 3, 4].map(i => <Skeleton key={i} height={50} sx={{ mb: 1 }} />)}</Box>
                ) : (
                    <List dense>
                        {items.map((task, index) => (
                            <React.Fragment key={task.id}>
                                <ListItem
                                    sx={{ px: 0 }}
                                    secondaryAction={
                                        task.completed ? (
                                            <CheckIcon color="success" />
                                        ) : (
                                            <Chip
                                                label={task.deadline}
                                                size="small"
                                                color={task.urgent ? 'error' : 'default'}
                                                variant={task.urgent ? 'filled' : 'outlined'}
                                            />
                                        )
                                    }
                                >
                                    <ListItemAvatar sx={{ minWidth: 36 }}>
                                        <Box
                                            component="span"
                                            sx={{
                                                width: 28,
                                                height: 28,
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                bgcolor: task.completed ? 'success.light' : 'grey.100'
                                            }}
                                        >
                                            {getTypeIcon(task.type)}
                                        </Box>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={task.title}
                                        primaryTypographyProps={{
                                            variant: 'body2',
                                            color: task.completed ? 'text.secondary' : 'text.primary',
                                            sx: { textDecoration: task.completed ? 'line-through' : 'none' }
                                        }}
                                    />
                                </ListItem>
                            </React.Fragment>
                        ))}
                    </List>
                )}
            </CardContent>
        </Card>
    );
};

export default WeeklyTaskTimeline;