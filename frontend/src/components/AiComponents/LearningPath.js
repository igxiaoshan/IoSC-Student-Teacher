import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Stepper,
    Step,
    StepLabel,
    StepContent,
    Button,
    Card,
    CardContent,
    CardActions,
    Chip,
    LinearProgress,
    Grid,
    List,
    ListItem,
    ListItemIcon,
    ListItemText
} from '@mui/material';
import {
    CheckCircle,
    RadioButtonUnchecked,
    Book,
    Assignment,
    Quiz,
    VideoLibrary
} from '@mui/icons-material';

const LearningPath = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState(new Set());

    // 示例学习路径
    const learningSteps = [
        {
            title: "基础概念学习",
            description: "掌握基本概念和理论知识",
            estimatedTime: "2-3小时",
            resources: [
                { type: "video", title: "入门视频教程", duration: "45分钟" },
                { type: "reading", title: "基础概念文档", duration: "30分钟" },
                { type: "practice", title: "概念理解练习", duration: "20分钟" }
            ],
            objectives: [
                "理解核心概念",
                "掌握基本术语",
                "建立知识框架"
            ]
        },
        {
            title: "实践操作",
            description: "通过实际操作加深理解",
            estimatedTime: "3-4小时",
            resources: [
                { type: "tutorial", title: "实操教程", duration: "60分钟" },
                { type: "practice", title: "动手练习", duration: "90分钟" },
                { type: "project", title: "小项目实践", duration: "120分钟" }
            ],
            objectives: [
                "掌握基本操作",
                "完成实践项目",
                "解决常见问题"
            ]
        },
        {
            title: "进阶学习",
            description: "深入学习高级特性和最佳实践",
            estimatedTime: "4-5小时",
            resources: [
                { type: "reading", title: "进阶文档", duration: "60分钟" },
                { type: "video", title: "高级特性讲解", duration: "90分钟" },
                { type: "practice", title: "复杂场景练习", duration: "120分钟" }
            ],
            objectives: [
                "掌握高级特性",
                "理解最佳实践",
                "优化性能技巧"
            ]
        },
        {
            title: "综合应用",
            description: "综合运用所学知识完成复杂项目",
            estimatedTime: "5-6小时",
            resources: [
                { type: "project", title: "综合项目", duration: "240分钟" },
                { type: "review", title: "代码审查", duration: "60分钟" },
                { type: "test", title: "综合测试", duration: "30分钟" }
            ],
            objectives: [
                "完成综合项目",
                "通过技能测试",
                "获得实战经验"
            ]
        }
    ];

    const getResourceIcon = (type) => {
        switch (type) {
            case 'video':
                return <VideoLibrary />;
            case 'reading':
                return <Book />;
            case 'practice':
                return <Assignment />;
            case 'test':
                return <Quiz />;
            default:
                return <Book />;
        }
    };

    const handleStepComplete = (stepIndex) => {
        const newCompleted = new Set(completedSteps);
        newCompleted.add(stepIndex);
        setCompletedSteps(newCompleted);
        
        if (stepIndex === activeStep && stepIndex < learningSteps.length - 1) {
            setActiveStep(stepIndex + 1);
        }
    };

    const handleStepClick = (stepIndex) => {
        setActiveStep(stepIndex);
    };

    const calculateProgress = () => {
        return (completedSteps.size / learningSteps.length) * 100;
    };

    return (
        <Box sx={{ maxWidth: 1000, margin: '0 auto', padding: 2 }}>
            <Typography variant="h4" gutterBottom>
                学习路径
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
                AI为你定制的个性化学习路径，循序渐进地掌握知识技能。
            </Typography>

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        学习进度
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ width: '100%', mr: 1 }}>
                            <LinearProgress variant="determinate" value={calculateProgress()} />
                        </Box>
                        <Box sx={{ minWidth: 35 }}>
                            <Typography variant="body2" color="text.secondary">
                                {Math.round(calculateProgress())}%
                            </Typography>
                        </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        已完成 {completedSteps.size} / {learningSteps.length} 个学习阶段
                    </Typography>
                </CardContent>
            </Card>

            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            学习阶段
                        </Typography>
                        <Stepper activeStep={activeStep} orientation="vertical">
                            {learningSteps.map((step, index) => (
                                <Step key={index} completed={completedSteps.has(index)}>
                                    <StepLabel
                                        onClick={() => handleStepClick(index)}
                                        sx={{ cursor: 'pointer' }}
                                    >
                                        {step.title}
                                    </StepLabel>
                                </Step>
                            ))}
                        </Stepper>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h5" sx={{ flexGrow: 1 }}>
                                    {learningSteps[activeStep].title}
                                </Typography>
                                {completedSteps.has(activeStep) && (
                                    <Chip
                                        icon={<CheckCircle />}
                                        label="已完成"
                                        color="success"
                                        size="small"
                                    />
                                )}
                            </Box>

                            <Typography variant="body1" paragraph>
                                {learningSteps[activeStep].description}
                            </Typography>

                            <Chip
                                label={`预计时间: ${learningSteps[activeStep].estimatedTime}`}
                                variant="outlined"
                                size="small"
                                sx={{ mb: 2 }}
                            />

                            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                                学习目标
                            </Typography>
                            <List dense>
                                {learningSteps[activeStep].objectives.map((objective, index) => (
                                    <ListItem key={index}>
                                        <ListItemIcon>
                                            {completedSteps.has(activeStep) ? 
                                                <CheckCircle color="success" /> : 
                                                <RadioButtonUnchecked />
                                            }
                                        </ListItemIcon>
                                        <ListItemText primary={objective} />
                                    </ListItem>
                                ))}
                            </List>

                            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                                学习资源
                            </Typography>
                            <List>
                                {learningSteps[activeStep].resources.map((resource, index) => (
                                    <ListItem key={index}>
                                        <ListItemIcon>
                                            {getResourceIcon(resource.type)}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={resource.title}
                                            secondary={resource.duration}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </CardContent>
                        <CardActions>
                            {!completedSteps.has(activeStep) && (
                                <Button
                                    variant="contained"
                                    onClick={() => handleStepComplete(activeStep)}
                                >
                                    标记为完成
                                </Button>
                            )}
                            {activeStep > 0 && (
                                <Button
                                    onClick={() => setActiveStep(activeStep - 1)}
                                >
                                    上一步
                                </Button>
                            )}
                            {activeStep < learningSteps.length - 1 && (
                                <Button
                                    onClick={() => setActiveStep(activeStep + 1)}
                                >
                                    下一步
                                </Button>
                            )}
                        </CardActions>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default LearningPath;
