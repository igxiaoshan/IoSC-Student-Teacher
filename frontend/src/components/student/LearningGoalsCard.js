import React from 'react';
import { Card, CardContent, Box, Typography, LinearProgress } from '@mui/material';
import { EmojiEvents as TrophyIcon } from '@mui/icons-material';
import { useTranslation } from '../../hooks/useTranslation';
import { Skeleton } from '@mui/material';

const LearningGoalsCard = ({ goals, loading }) => {
    const { tStudent } = useTranslation();

    const defaultGoals = [
        { id: 1, title: tStudent('goalMathChapter') || '完成数学第三章学习', progress: 75, target: 100 },
        { id: 2, title: tStudent('goalVocabulary500') || '英语词汇达到500个', progress: 320, target: 500 },
        { id: 3, title: tStudent('goalPhysicsReport') || '物理实验报告提交', progress: 60, target: 100 }
    ];

    const items = goals || defaultGoals;

    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TrophyIcon color="warning" sx={{ mr: 1 }} />
                    <Typography variant="h6">{tStudent('learningGoals') || '学习目标'}</Typography>
                </Box>
                {loading ? (
                    <Box>{[1, 2, 3].map(i => <Skeleton key={i} height={60} sx={{ mb: 1 }} />)}</Box>
                ) : (
                    <Box>
                        {items.map((goal) => {
                            const percentage = Math.round((goal.progress / goal.target) * 100);
                            return (
                                <Box key={goal.id} sx={{ mb: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="body2">{goal.title}</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {goal.progress}/{goal.target}
                                        </Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={percentage}
                                        sx={{ height: 8, borderRadius: 4 }}
                                        color={percentage >= 80 ? 'success' : percentage >= 50 ? 'primary' : 'warning'}
                                    />
                                </Box>
                            );
                        })}
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default LearningGoalsCard;
