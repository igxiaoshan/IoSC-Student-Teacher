import React from 'react';
import { Card, CardContent, Box, Typography, Chip, Avatar, List, ListItem, ListItemAvatar, ListItemText, Divider, Skeleton } from '@mui/material';
import { Assignment as AssignmentIcon } from '@mui/icons-material';
import { useTranslation } from '../../hooks/useTranslation';

const TodoTasksCard = ({ tasks, loading }) => {
    const { tStudent } = useTranslation();

    const defaultTasks = [
        { id: 1, title: tStudent('mathHomework') || '数学作业第三章', deadline: tStudent('tomorrow') || '明天', type: 'homework', urgent: true },
        { id: 2, title: tStudent('englishQuiz') || '英语单词测验', deadline: tStudent('thisFriday') || '本周五', type: 'exam', urgent: false },
        { id: 3, title: tStudent('physicsReport') || '物理实验报告', deadline: tStudent('nextMonday') || '下周一', type: 'homework', urgent: false }
    ];

    const items = tasks || defaultTasks;

    const getTypeColor = (type) => {
        switch (type) {
            case 'exam': return 'error';
            case 'homework': return 'primary';
            default: return 'default';
        }
    };

    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AssignmentIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6">{tStudent('pendingTasks') || '待办任务'}</Typography>
                    </Box>
                    <Chip label={items.length} size="small" color="primary" />
                </Box>
                {loading ? (
                    <Box>{[1, 2, 3].map(i => <Skeleton key={i} height={50} sx={{ mb: 1 }} />)}</Box>
                ) : (
                    <List dense sx={{ px: 0 }}>
                        {items.map((task, index) => (
                            <React.Fragment key={task.id}>
                                <ListItem sx={{ px: 0 }}
                                    secondaryAction={
                                        <Chip
                                            label={task.deadline}
                                            size="small"
                                            color={task.urgent ? 'error' : 'default'}
                                        />
                                    }
                                >
                                    <ListItemAvatar sx={{ minWidth: 36 }}>
                                        <Avatar sx={{ width: 28, height: 28, bgcolor: `${getTypeColor(task.type)}.light` }}>
                                            {task.type === 'exam' ? tStudent('exam') || '测' : tStudent('homework') || '作'}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={task.title}
                                        primaryTypographyProps={{
                                            variant: 'body2',
                                            fontWeight: task.urgent ? 'bold' : 'normal'
                                        }}
                                    />
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

export default TodoTasksCard;
