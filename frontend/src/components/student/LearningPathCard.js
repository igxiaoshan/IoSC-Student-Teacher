import React, { useMemo } from 'react';
import {
    Card, CardContent, Box, Typography, Button, Stepper, Step, StepLabel,
    StepContent, Chip, LinearProgress, List, ListItem, ListItemIcon,
    ListItemText, Skeleton, Alert
} from '@mui/material';
import {
    Flag as FlagIcon, CheckCircle, RadioButtonUnchecked, AccessTime,
    Lightbulb, Add as AddIcon, School as SchoolIcon
} from '@mui/icons-material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useTranslation } from '../../hooks/useTranslation';

// 阶段进度组件
const PhaseProgress = ({ phases, currentPhase, onPhaseClick }) => {
    const getPhaseStatus = (index) => {
        if (index < currentPhase) return 'completed';
        if (index === currentPhase) return 'active';
        return 'pending';
    };

    return (
        <Stepper activeStep={currentPhase} orientation="vertical" sx={{ mt: 1 }}>
            {phases.map((phase, index) => {
                const status = getPhaseStatus(index);
                return (
                    <Step key={index} active={status !== 'pending'} completed={status === 'completed'}>
                        <StepLabel
                            StepIconComponent={() => (
                                <Box
                                    onClick={() => onPhaseClick?.(index)}
                                    sx={{
                                        width: 24, height: 24, borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        bgcolor: status === 'completed' ? 'success.main' :
                                            status === 'active' ? 'primary.main' : 'grey.300',
                                        color: status === 'pending' ? 'grey.500' : 'white',
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s',
                                        '&:hover': { transform: 'scale(1.1)' }
                                    }}
                                >
                                    {status === 'completed' ? <CheckCircle sx={{ fontSize: 16 }} /> : index + 1}
                                </Box>
                            )}
                        >
                            <Typography variant="body2" fontWeight={status === 'active' ? 'bold' : 'normal'}>
                                {phase.name}
                            </Typography>
                        </StepLabel>
                        <StepContent>
                            <Typography variant="caption" color="text.secondary">{phase.description}</Typography>
                            {phase.progress !== undefined && (
                                <LinearProgress
                                    variant="determinate"
                                    value={phase.progress}
                                    sx={{ mt: 1, height: 4, borderRadius: 2 }}
                                />
                            )}
                        </StepContent>
                    </Step>
                );
            })}
        </Stepper>
    );
};

// 里程碑列表组件
const MilestoneList = ({ milestones }) => (
    <List dense sx={{ py: 0 }}>
        {milestones.map((milestone, index) => (
            <ListItem key={index} sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                    <FlagIcon sx={{ fontSize: 18, color: milestone.completed ? 'success.main' : 'grey.400' }} />
                </ListItemIcon>
                <ListItemText
                    primary={milestone.title}
                    secondary={milestone.date && `目标日期: ${milestone.date}`}
                    primaryTypographyProps={{
                        variant: 'body2',
                        sx: { textDecoration: milestone.completed ? 'line-through' : 'none' }
                    }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                />
                {milestone.completed ? (
                    <CheckCircle color="success" sx={{ fontSize: 20 }} />
                ) : (
                    <RadioButtonUnchecked color="disabled" sx={{ fontSize: 20 }} />
                )}
            </ListItem>
        ))}
    </List>
);

// 每日推荐卡片
const DailyRecommendation = ({ recommendations }) => {
    if (!recommendations?.length) return null;

    return (
        <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                今日推荐
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {recommendations.map((rec, index) => (
                    <Chip
                        key={index}
                        icon={<Lightbulb sx={{ fontSize: 16 }} />}
                        label={rec.title}
                        onClick={() => rec.onClick?.()}
                        variant="outlined"
                        color={rec.priority === 'high' ? 'warning' : 'default'}
                        sx={{ justifyContent: 'flex-start' }}
                    />
                ))}
            </Box>
        </Box>
    );
};

// AI建议显示
const AIAdvice = ({ advice }) => {
    if (!advice) return null;

    return (
        <Alert
            severity="info"
            icon={<AutoAwesomeIcon />}
            sx={{ mt: 2, '& .MuiAlert-icon': { alignItems: 'center' } }}
        >
            <Typography variant="body2">
                <strong>AI建议：</strong>{advice}
            </Typography>
        </Alert>
    );
};

// 空状态引导
const EmptyState = ({ onCreatePath }) => {
    const { tStudent } = useTranslation();

    return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
            <SchoolIcon sx={{ fontSize: 48, color: 'grey.300', mb: 2 }} />
            <Typography variant="body1" color="text.secondary" gutterBottom>
                {tStudent('noLearningPath') || '还没有学习路径'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {tStudent('createLearningPathHint') || '创建个性化学习路径，规划你的学习之旅'}
            </Typography>
            <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={onCreatePath}
            >
                {tStudent('createLearningPath') || '创建学习路径'}
            </Button>
        </Box>
    );
};

const LearningPathCard = ({ learningPath, loading, onCreatePath, onPhaseClick }) => {
    const { tStudent } = useTranslation();

    const overallProgress = useMemo(() => {
        if (!learningPath?.phases?.length) return 0;
        const completed = learningPath.phases.filter(p => p.completed).length;
        return Math.round((completed / learningPath.phases.length) * 100);
    }, [learningPath?.phases]);

    const defaultPath = {
        name: tStudent('myLearningPath') || '我的学习路径',
        phases: [
            { name: '基础阶段', description: '掌握基础知识概念', progress: 100, completed: true },
            { name: '进阶阶段', description: '深入理解核心原理', progress: 60, completed: false },
            { name: '应用阶段', description: '实际项目练习', progress: 0, completed: false },
            { name: '精通阶段', description: '综合能力提升', progress: 0, completed: false }
        ],
        currentPhase: 1,
        milestones: [
            { title: '完成第一章节学习', date: '4月20日', completed: true },
            { title: '通过阶段测试', date: '5月1日', completed: true },
            { title: '完成项目实战', date: '5月15日', completed: false }
        ],
        dailyRecommendations: [
            { title: '复习昨日知识点', priority: 'high' },
            { title: '完成2道练习题', priority: 'normal' },
            { title: '观看教学视频', priority: 'low' }
        ],
        aiAdvice: '根据你的学习进度，建议今天重点复习函数概念，明天开始学习递归。'
    };

    const data = learningPath || defaultPath;

    if (loading) {
        return (
            <Card sx={{ height: '100%' }}>
                <CardContent>
                    <Skeleton variant="text" width="60%" height={32} />
                    <Skeleton variant="text" width="40%" />
                    <Skeleton variant="rectangular" height={200} sx={{ mt: 2, borderRadius: 1 }} />
                </CardContent>
            </Card>
        );
    }

    if (!data) {
        return (
            <Card sx={{ height: '100%' }}>
                <CardContent>
                    <EmptyState onCreatePath={onCreatePath} />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                {/* 标题区域 */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <FlagIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6">{data.name}</Typography>
                    </Box>
                    <Chip
                        label={`${overallProgress}%`}
                        size="small"
                        color={overallProgress >= 70 ? 'success' : overallProgress >= 40 ? 'warning' : 'default'}
                    />
                </Box>

                {/* 总体进度 */}
                <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">总体进度</Typography>
                        <Typography variant="caption" color="text.secondary">{overallProgress}%</Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={overallProgress}
                        sx={{ height: 8, borderRadius: 4 }}
                    />
                </Box>

                {/* 阶段进度 */}
                {data.phases && (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                            <AccessTime sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                            阶段进度
                        </Typography>
                        <PhaseProgress
                            phases={data.phases}
                            currentPhase={data.currentPhase || 0}
                            onPhaseClick={onPhaseClick}
                        />
                    </Box>
                )}

                {/* 里程碑列表 */}
                {data.milestones && <MilestoneList milestones={data.milestones} />}

                {/* 每日推荐 */}
                <DailyRecommendation recommendations={data.dailyRecommendations} />

                {/* AI建议 */}
                <AIAdvice advice={data.aiAdvice} />
            </CardContent>
        </Card>
    );
};

export default LearningPathCard;
