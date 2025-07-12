import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Card,
    CardContent,
    CardActions,
    Button,
    Avatar,
    Chip,
    Grid,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    LinearProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField
} from '@mui/material';
import {
    Psychology,
    TrendingUp,
    Schedule,
    EmojiEvents,
    Lightbulb,
    Chat,
    Assignment,
    BookmarkBorder
} from '@mui/icons-material';

const LearningCompanion = () => {
    const [openMotivation, setOpenMotivation] = useState(false);
    const [openGoalSetting, setOpenGoalSetting] = useState(false);
    const [newGoal, setNewGoal] = useState('');
    const [goals, setGoals] = useState([
        { id: 1, text: "完成React基础学习", progress: 75, deadline: "2024-01-15" },
        { id: 2, text: "掌握JavaScript ES6特性", progress: 60, deadline: "2024-01-20" },
        { id: 3, text: "完成项目实战练习", progress: 30, deadline: "2024-01-25" }
    ]);

    const [studyStats, setStudyStats] = useState({
        todayStudyTime: 120, // 分钟
        weeklyGoal: 600, // 分钟
        streak: 5, // 连续学习天数
        completedTasks: 12,
        totalTasks: 20
    });

    const motivationalMessages = [
        "你今天的学习表现很棒！继续保持这个节奏！",
        "每一步的努力都在让你变得更强！",
        "学习是一个持续的过程，你正在稳步前进！",
        "今天又是充满收获的一天，为自己点赞！",
        "坚持就是胜利，你已经走了这么远！"
    ];

    const learningTips = [
        {
            icon: <Schedule />,
            title: "时间管理建议",
            content: "建议使用番茄工作法，25分钟专注学习，5分钟休息。"
        },
        {
            icon: <Psychology />,
            title: "记忆技巧",
            content: "尝试费曼学习法：用简单的话解释复杂概念。"
        },
        {
            icon: <TrendingUp />,
            title: "进度跟踪",
            content: "定期回顾学习进度，调整学习计划和目标。"
        },
        {
            icon: <Lightbulb />,
            title: "学习策略",
            content: "结合理论学习和实践操作，加深理解。"
        }
    ];

    const handleAddGoal = () => {
        if (newGoal.trim()) {
            const goal = {
                id: goals.length + 1,
                text: newGoal,
                progress: 0,
                deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            };
            setGoals([...goals, goal]);
            setNewGoal('');
            setOpenGoalSetting(false);
        }
    };

    const calculateWeeklyProgress = () => {
        return (studyStats.todayStudyTime / studyStats.weeklyGoal) * 100;
    };

    return (
        <Box sx={{ maxWidth: 1200, margin: '0 auto', padding: 2 }}>
            <Typography variant="h4" gutterBottom>
                学习伙伴
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
                你的AI学习伙伴，提供个性化的学习建议、目标跟踪和动机激励。
            </Typography>

            <Grid container spacing={3}>
                {/* 学习统计 */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                今日学习统计
                            </Typography>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    学习时间: {studyStats.todayStudyTime} 分钟
                                </Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={calculateWeeklyProgress()}
                                    sx={{ mt: 1 }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                    周目标进度: {Math.round(calculateWeeklyProgress())}%
                                </Typography>
                            </Box>
                            
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h4" color="primary">
                                            {studyStats.streak}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            连续学习天数
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h4" color="success.main">
                                            {studyStats.completedTasks}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            已完成任务
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </CardContent>
                        <CardActions>
                            <Button
                                startIcon={<EmojiEvents />}
                                onClick={() => setOpenMotivation(true)}
                            >
                                获取鼓励
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>

                {/* 学习目标 */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                学习目标
                            </Typography>
                            <List>
                                {goals.slice(0, 3).map((goal) => (
                                    <ListItem key={goal.id}>
                                        <ListItemAvatar>
                                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                                                <Assignment />
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={goal.text}
                                            secondary={
                                                <Box>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={goal.progress}
                                                        sx={{ mt: 1, mb: 1 }}
                                                    />
                                                    <Typography variant="caption">
                                                        进度: {goal.progress}% | 截止: {goal.deadline}
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </CardContent>
                        <CardActions>
                            <Button
                                startIcon={<BookmarkBorder />}
                                onClick={() => setOpenGoalSetting(true)}
                            >
                                设置目标
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>

                {/* 学习建议 */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                个性化学习建议
                            </Typography>
                            <Grid container spacing={2}>
                                {learningTips.map((tip, index) => (
                                    <Grid item xs={12} sm={6} md={3} key={index}>
                                        <Paper sx={{ p: 2, height: '100%' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                {tip.icon}
                                                <Typography variant="subtitle2" sx={{ ml: 1 }}>
                                                    {tip.title}
                                                </Typography>
                                            </Box>
                                            <Typography variant="body2" color="text.secondary">
                                                {tip.content}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                ))}
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* 学习成就 */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                学习成就
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <Chip
                                    icon={<EmojiEvents />}
                                    label="连续学习5天"
                                    color="primary"
                                    variant="outlined"
                                />
                                <Chip
                                    icon={<TrendingUp />}
                                    label="完成10个练习"
                                    color="success"
                                    variant="outlined"
                                />
                                <Chip
                                    icon={<Psychology />}
                                    label="掌握基础概念"
                                    color="info"
                                    variant="outlined"
                                />
                                <Chip
                                    icon={<Schedule />}
                                    label="时间管理达人"
                                    color="warning"
                                    variant="outlined"
                                />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* 激励对话框 */}
            <Dialog open={openMotivation} onClose={() => setOpenMotivation(false)}>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <EmojiEvents sx={{ mr: 1, color: 'primary.main' }} />
                        学习鼓励
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1">
                        {motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenMotivation(false)}>
                        谢谢鼓励！
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 目标设置对话框 */}
            <Dialog open={openGoalSetting} onClose={() => setOpenGoalSetting(false)}>
                <DialogTitle>设置新的学习目标</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="学习目标"
                        fullWidth
                        variant="outlined"
                        value={newGoal}
                        onChange={(e) => setNewGoal(e.target.value)}
                        placeholder="例如：完成JavaScript高级特性学习"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenGoalSetting(false)}>
                        取消
                    </Button>
                    <Button onClick={handleAddGoal} variant="contained">
                        添加目标
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default LearningCompanion;
