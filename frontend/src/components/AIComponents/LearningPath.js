import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    Paper,
    Typography,
    Button,
    Stepper,
    Step,
    StepLabel,
    StepContent,
    Card,
    CardContent,
    LinearProgress,
    Chip,
    Grid,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert
} from '@mui/material';
import {
    Route as RouteIcon,
    CheckCircle as CheckIcon,
    RadioButtonUnchecked as UncheckedIcon,
    PlayArrow as PlayIcon,
    School as SchoolIcon,
    Timeline as TimelineIcon,
    Flag as TargetIcon,
    Psychology as PsychologyIcon
} from '@mui/icons-material';
import { generateLearningPath, getLearningPathProgress } from '../../redux/aiRelated/aiHandle';
import { updateLearningProgress } from '../../redux/aiRelated/aiSlice';

const LearningPath = ({ studentId, subject }) => {
    const dispatch = useDispatch();
    const { loading, currentPath, progress, error } = useSelector(state => state.ai.learningPath);
    
    const [showGenerator, setShowGenerator] = useState(false);
    const [pathConfig, setPathConfig] = useState({
        subject: subject || '',
        currentLevel: 'beginner',
        targetLevel: 'intermediate',
        availableTime: 10, // hours per week
        learningStyle: 'visual',
        goals: '',
        timeframe: 12 // weeks
    });

    useEffect(() => {
        if (studentId && subject) {
            dispatch(getLearningPathProgress(studentId, subject));
        }
    }, [dispatch, studentId, subject]);

    const handleGeneratePath = () => {
        dispatch(generateLearningPath(studentId, pathConfig));
        setShowGenerator(false);
    };

    const handleStartPhase = (phaseId) => {
        // 开始学习阶段
        dispatch(updateLearningProgress({
            [phaseId]: { status: 'in_progress', startedAt: new Date() }
        }));
    };

    const handleCompletePhase = (phaseId) => {
        // 完成学习阶段
        dispatch(updateLearningProgress({
            [phaseId]: { status: 'completed', completedAt: new Date() }
        }));
    };

    const getPhaseStatus = (phaseId) => {
        return progress[phaseId]?.status || 'not_started';
    };

    const getPhaseProgress = (phaseId) => {
        const phaseProgress = progress[phaseId];
        if (!phaseProgress) return 0;
        
        if (phaseProgress.status === 'completed') return 100;
        if (phaseProgress.status === 'in_progress') return phaseProgress.progress || 30;
        return 0;
    };

    const renderPathOverview = () => {
        if (!currentPath) return null;

        const totalPhases = currentPath.learningPath?.phases?.length || 0;
        const completedPhases = Object.values(progress).filter(p => p.status === 'completed').length;
        const overallProgress = totalPhases > 0 ? (completedPhases / totalPhases) * 100 : 0;

        return (
            <Card elevation={2} sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <RouteIcon color="primary" />
                        <Typography variant="h6">学习路径概览</Typography>
                    </Box>
                    
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                整体进度
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LinearProgress 
                                    variant="determinate" 
                                    value={overallProgress} 
                                    sx={{ flex: 1, height: 8, borderRadius: 4 }}
                                />
                                <Typography variant="body2" sx={{ minWidth: 35 }}>
                                    {Math.round(overallProgress)}%
                                </Typography>
                            </Box>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h6" color="primary">
                                        {totalPhases}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        总阶段
                                    </Typography>
                                </Box>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h6" color="success.main">
                                        {completedPhases}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        已完成
                                    </Typography>
                                </Box>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h6" color="warning.main">
                                        {currentPath.estimatedDuration || 0}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        预计周数
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        );
    };

    const renderLearningPhases = () => {
        if (!currentPath?.learningPath?.phases) return null;

        return (
            <Card elevation={2}>
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TimelineIcon color="primary" />
                        学习阶段
                    </Typography>
                    
                    <Stepper orientation="vertical">
                        {currentPath.learningPath.phases.map((phase, index) => {
                            const phaseId = `phase_${index}`;
                            const status = getPhaseStatus(phaseId);
                            const phaseProgress = getPhaseProgress(phaseId);
                            
                            return (
                                <Step key={index} active={status !== 'not_started'} completed={status === 'completed'}>
                                    <StepLabel>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="subtitle1">
                                                {phase.phaseName}
                                            </Typography>
                                            <Chip 
                                                label={phase.duration} 
                                                size="small" 
                                                variant="outlined"
                                            />
                                        </Box>
                                    </StepLabel>
                                    <StepContent>
                                        <Box sx={{ mb: 2 }}>
                                            {/* 阶段进度 */}
                                            {status === 'in_progress' && (
                                                <Box sx={{ mb: 2 }}>
                                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                                        阶段进度
                                                    </Typography>
                                                    <LinearProgress 
                                                        variant="determinate" 
                                                        value={phaseProgress} 
                                                        sx={{ height: 6, borderRadius: 3 }}
                                                    />
                                                </Box>
                                            )}
                                            
                                            {/* 学习目标 */}
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                学习目标：
                                            </Typography>
                                            <List dense>
                                                {phase.objectives?.map((objective, objIndex) => (
                                                    <ListItem key={objIndex} sx={{ py: 0.5 }}>
                                                        <ListItemIcon sx={{ minWidth: 32 }}>
                                                            <TargetIcon fontSize="small" color="primary" />
                                                        </ListItemIcon>
                                                        <ListItemText 
                                                            primary={objective}
                                                            primaryTypographyProps={{ variant: 'body2' }}
                                                        />
                                                    </ListItem>
                                                ))}
                                            </List>
                                            
                                            {/* 学习主题 */}
                                            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 1 }}>
                                                学习主题：
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                                                {phase.topics?.map((topic, topicIndex) => (
                                                    <Chip 
                                                        key={topicIndex}
                                                        label={topic} 
                                                        size="small" 
                                                        variant="outlined"
                                                        color="primary"
                                                    />
                                                ))}
                                            </Box>
                                            
                                            {/* 操作按钮 */}
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                {status === 'not_started' && (
                                                    <Button
                                                        variant="contained"
                                                        size="small"
                                                        startIcon={<PlayIcon />}
                                                        onClick={() => handleStartPhase(phaseId)}
                                                    >
                                                        开始学习
                                                    </Button>
                                                )}
                                                {status === 'in_progress' && (
                                                    <>
                                                        <Button
                                                            variant="contained"
                                                            size="small"
                                                            color="success"
                                                            startIcon={<CheckIcon />}
                                                            onClick={() => handleCompletePhase(phaseId)}
                                                        >
                                                            标记完成
                                                        </Button>
                                                        <Button
                                                            variant="outlined"
                                                            size="small"
                                                        >
                                                            查看资源
                                                        </Button>
                                                    </>
                                                )}
                                                {status === 'completed' && (
                                                    <Chip 
                                                        label="已完成" 
                                                        color="success" 
                                                        icon={<CheckIcon />}
                                                        size="small"
                                                    />
                                                )}
                                            </Box>
                                        </Box>
                                    </StepContent>
                                </Step>
                            );
                        })}
                    </Stepper>
                </CardContent>
            </Card>
        );
    };

    if (!currentPath && !loading) {
        return (
            <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
                <PsychologyIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" sx={{ mb: 2 }}>
                    AI学习路径规划
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    让AI为你制定个性化的学习计划，科学规划学习路径
                </Typography>
                <Button
                    variant="contained"
                    size="large"
                    startIcon={<RouteIcon />}
                    onClick={() => setShowGenerator(true)}
                >
                    生成学习路径
                </Button>
            </Paper>
        );
    }

    return (
        <Box>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {loading && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography>AI正在为你规划学习路径...</Typography>
                </Box>
            )}

            {currentPath && (
                <Box>
                    {renderPathOverview()}
                    {renderLearningPhases()}
                    
                    <Box sx={{ mt: 3, textAlign: 'center' }}>
                        <Button
                            variant="outlined"
                            onClick={() => setShowGenerator(true)}
                        >
                            重新规划路径
                        </Button>
                    </Box>
                </Box>
            )}

            {/* 路径生成配置对话框 */}
            <Dialog open={showGenerator} onClose={() => setShowGenerator(false)} maxWidth="md" fullWidth>
                <DialogTitle>学习路径配置</DialogTitle>
                <DialogContent>
                    <Grid container spacing={3} sx={{ mt: 1 }}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="学科"
                                value={pathConfig.subject}
                                onChange={(e) => setPathConfig({...pathConfig, subject: e.target.value})}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>当前水平</InputLabel>
                                <Select
                                    value={pathConfig.currentLevel}
                                    onChange={(e) => setPathConfig({...pathConfig, currentLevel: e.target.value})}
                                >
                                    <MenuItem value="beginner">初学者</MenuItem>
                                    <MenuItem value="intermediate">中级</MenuItem>
                                    <MenuItem value="advanced">高级</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>目标水平</InputLabel>
                                <Select
                                    value={pathConfig.targetLevel}
                                    onChange={(e) => setPathConfig({...pathConfig, targetLevel: e.target.value})}
                                >
                                    <MenuItem value="intermediate">中级</MenuItem>
                                    <MenuItem value="advanced">高级</MenuItem>
                                    <MenuItem value="expert">专家</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="每周可用时间(小时)"
                                type="number"
                                value={pathConfig.availableTime}
                                onChange={(e) => setPathConfig({...pathConfig, availableTime: parseInt(e.target.value)})}
                                inputProps={{ min: 1, max: 40 }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>学习风格</InputLabel>
                                <Select
                                    value={pathConfig.learningStyle}
                                    onChange={(e) => setPathConfig({...pathConfig, learningStyle: e.target.value})}
                                >
                                    <MenuItem value="visual">视觉型</MenuItem>
                                    <MenuItem value="auditory">听觉型</MenuItem>
                                    <MenuItem value="kinesthetic">动手型</MenuItem>
                                    <MenuItem value="mixed">混合型</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="学习周期(周)"
                                type="number"
                                value={pathConfig.timeframe}
                                onChange={(e) => setPathConfig({...pathConfig, timeframe: parseInt(e.target.value)})}
                                inputProps={{ min: 4, max: 52 }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="学习目标"
                                multiline
                                rows={3}
                                value={pathConfig.goals}
                                onChange={(e) => setPathConfig({...pathConfig, goals: e.target.value})}
                                placeholder="描述你的学习目标和期望..."
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowGenerator(false)}>取消</Button>
                    <Button variant="contained" onClick={handleGeneratePath}>
                        生成路径
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default LearningPath;
