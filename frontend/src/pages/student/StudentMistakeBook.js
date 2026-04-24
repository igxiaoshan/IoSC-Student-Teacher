import React, { useEffect, useState } from 'react';
import {
    Container, Grid, Paper, Typography, Card, CardContent, Box, CardActions,
    List, ListItem, ListItemText, ListItemIcon, Chip, Avatar, Divider,
    FormControl, InputLabel, Select, MenuItem, Button, IconButton, Collapse,
    LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Tooltip, Skeleton, Alert, Tab, Tabs, Badge, Menu, MenuItem as MuiMenuItem
} from '@mui/material';
import {
    ErrorOutline as ErrorIcon,
    CheckCircle as CheckIcon,
    FilterList as FilterIcon,
    Sort as SortIcon,
    ExpandMore as ExpandIcon,
    ExpandLess as CollapseIcon,
    Lightbulb as TipIcon,
    AutoAwesome as AIIcon,
    Replay as ReplayIcon,
    Delete as DeleteIcon,
    Bookmark as BookmarkIcon,
    BookmarkBorder as BookmarkOutlineIcon,
    School as SchoolIcon,
    TrendingUp as TrendingUpIcon,
    Warning as WarningIcon,
    Insights as InsightsIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { safeGet } from '../../utils/safeAccess';
import { useTranslation } from '../../hooks/useTranslation';
import { studentAPI } from '../../utils/apiClient';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip as ChartTooltip,
    Legend
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, ChartTooltip, Legend);

// 错题详情卡片
const MistakeCard = ({ mistake, expanded, onExpand, onBookmark, onReplay }) => {
    const { tStudent } = useTranslation();
    const [showAnalysis, setShowAnalysis] = useState(false);

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'easy': return 'success';
            case 'medium': return 'warning';
            case 'hard': return 'error';
            default: return 'default';
        }
    };

    const getDifficultyLabel = (difficulty) => {
        switch (difficulty) {
            case 'easy': return '简单';
            case 'medium': return '中等';
            case 'hard': return '困难';
            default: return '未知';
        }
    };

    return (
        <Card sx={{ mb: 2, borderLeft: 4, borderColor: mistake.bookmarked ? 'warning.main' : 'error.main' }}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                        <Avatar sx={{ bgcolor: 'error.light', mr: 2 }}>
                            <ErrorIcon />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                                {mistake.question}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                <Chip label={mistake.subject} size="small" color="primary" variant="outlined" />
                                <Chip label={getDifficultyLabel(mistake.difficulty)} size="small" color={getDifficultyColor(mistake.difficulty)} />
                                <Chip label={mistake.knowledgePoint} size="small" variant="outlined" />
                            </Box>
                        </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                            错误次数: {mistake.errorCount || 1}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {mistake.lastErrorDate}
                        </Typography>
                    </Box>
                </Box>

                {/* 答案对比 */}
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Box sx={{ flex: 1, p: 1.5, bgcolor: 'error.50', borderRadius: 1 }}>
                        <Typography variant="caption" color="error.main">你的答案</Typography>
                        <Typography variant="body2">{mistake.studentAnswer || '未作答'}</Typography>
                    </Box>
                    <Box sx={{ flex: 1, p: 1.5, bgcolor: 'success.50', borderRadius: 1 }}>
                        <Typography variant="caption" color="success.main">正确答案</Typography>
                        <Typography variant="body2">{mistake.correctAnswer}</Typography>
                    </Box>
                </Box>

                {/* 展开的详细信息 */}
                <Collapse in={expanded}>
                    <Divider sx={{ my: 2 }} />

                    {/* AI 错因分析 */}
                    <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <AIIcon color="primary" sx={{ mr: 1 }} />
                            <Typography variant="subtitle2">AI 错因分析</Typography>
                        </Box>
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                            <Typography variant="body2" paragraph>
                                {mistake.aiAnalysis || '根据你的答题情况分析，这道题的错误主要原因是：'}
                            </Typography>
                            <List dense>
                                <ListItem sx={{ px: 0 }}>
                                    <ListItemIcon sx={{ minWidth: 28 }}><WarningIcon color="warning" fontSize="small" /></ListItemIcon>
                                    <ListItemText primary="概念理解不清晰" primaryTypographyProps={{ variant: 'body2' }} />
                                </ListItem>
                                <ListItem sx={{ px: 0 }}>
                                    <ListItemIcon sx={{ minWidth: 28 }}><TipIcon color="info" fontSize="small" /></ListItemIcon>
                                    <ListItemText primary="建议：重新复习相关知识点" primaryTypographyProps={{ variant: 'body2' }} />
                                </ListItem>
                            </List>
                        </Paper>
                    </Box>

                    {/* 关联知识点 */}
                    <Box>
                        <Typography variant="subtitle2" gutterBottom>关联知识点</Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {mistake.relatedKnowledge?.map((kp, idx) => (
                                <Chip key={idx} label={kp} size="small" variant="outlined" clickable />
                            )) || ['基础概念', '核心公式', '应用场景'].map((kp, idx) => (
                                <Chip key={idx} label={kp} size="small" variant="outlined" clickable />
                            ))}
                        </Box>
                    </Box>
                </Collapse>
            </CardContent>

            <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                <Box>
                    <Tooltip title={mistake.bookmarked ? "取消收藏" : "收藏"}>
                        <IconButton size="small" onClick={() => onBookmark(mistake.id)}>
                            {mistake.bookmarked ? <BookmarkIcon color="warning" /> : <BookmarkOutlineIcon />}
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="重做此题">
                        <IconButton size="small" onClick={() => onReplay(mistake.id)}>
                            <ReplayIcon color="primary" />
                        </IconButton>
                    </Tooltip>
                </Box>
                <Button
                    size="small"
                    endIcon={expanded ? <CollapseIcon /> : <ExpandIcon />}
                    onClick={() => onExpand(mistake.id)}
                >
                    {expanded ? '收起' : '查看详情'}
                </Button>
            </CardActions>
        </Card>
    );
};

// 错题统计图表
const MistakeStatistics = ({ data, loading }) => {
    const { tStudent } = useTranslation();

    // 按科目分布
    const subjectData = {
        labels: Object.keys(data?.bySubject || { '数学': 5, '英语': 3, '物理': 2, '化学': 1 }),
        datasets: [{
            label: '错题数量',
            data: Object.values(data?.bySubject || { '数学': 5, '英语': 3, '物理': 2, '化学': 1 }),
            backgroundColor: ['rgba(54, 162, 235, 0.8)', 'rgba(255, 99, 132, 0.8)', 'rgba(75, 192, 192, 0.8)', 'rgba(255, 206, 86, 0.8)'],
            borderRadius: 4
        }]
    };

    // 按知识点分布
    const knowledgeData = {
        labels: ['计算错误', '概念不清', '审题失误', '方法不当'],
        datasets: [{
            data: data?.byKnowledgePoint || [35, 25, 20, 20],
            backgroundColor: ['rgba(255, 99, 132, 0.8)', 'rgba(54, 162, 235, 0.8)', 'rgba(255, 206, 86, 0.8)', 'rgba(75, 192, 192, 0.8)'],
            borderWidth: 2,
            borderColor: '#fff'
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } }
    };

    return (
        <Card>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <InsightsIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">错题统计分析</Typography>
                </Box>
                {loading ? (
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Skeleton variant="rectangular" width="50%" height={200} />
                        <Skeleton variant="circular" width={200} height={200} />
                    </Box>
                ) : (
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" align="center" gutterBottom>按科目分布</Typography>
                            <Box sx={{ height: 200 }}>
                                <Bar data={subjectData} options={{ ...chartOptions, plugins: { legend: { display: false } } }} />
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" align="center" gutterBottom>错误类型占比</Typography>
                            <Box sx={{ height: 200 }}>
                                <Doughnut data={knowledgeData} options={chartOptions} />
                            </Box>
                        </Grid>
                    </Grid>
                )}
            </CardContent>
        </Card>
    );
};

// 学习进度追踪
const MasteryProgress = ({ progress }) => {
    return (
        <Card>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                    <Typography variant="h6">攻克进度</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">已攻克错题</Typography>
                        <Typography variant="body2" fontWeight="bold">{progress?.mastered || 12}/{progress?.total || 25}</Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={(progress?.mastered || 12) / (progress?.total || 25) * 100}
                        sx={{ height: 10, borderRadius: 5 }}
                        color="success"
                    />
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip icon={<CheckIcon />} label={`已攻克 ${progress?.mastered || 12}`} color="success" size="small" />
                    <Chip icon={<ErrorIcon />} label={`待攻克 ${progress?.pending || 13}`} color="error" size="small" variant="outlined" />
                </Box>
            </CardContent>
        </Card>
    );
};

const StudentMistakeBook = () => {
    const { tStudent } = useTranslation();
    const { currentUser } = useSelector((state) => state.user);

    const [mistakes, setMistakes] = useState([]);
    const [filteredMistakes, setFilteredMistakes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [tabValue, setTabValue] = useState(0);
    const [filterSubject, setFilterSubject] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortBy, setSortBy] = useState('date');
    const [statsData, setStatsData] = useState(null);
    const [replayDialog, setReplayDialog] = useState({ open: false, mistake: null });

    // 模拟数据
    const mockMistakes = [
        {
            id: 1,
            question: '已知函数 f(x) = x² - 2x + 1，求 f(x) 的最小值',
            subject: '数学',
            difficulty: 'medium',
            knowledgePoint: '二次函数',
            studentAnswer: '0',
            correctAnswer: '0（当x=1时）',
            errorCount: 2,
            lastErrorDate: '2024-01-15',
            bookmarked: true,
            mastered: false,
            aiAnalysis: '这道题考查的是二次函数的最值问题。你的答案数值正确，但缺少了对应的x值说明。',
            relatedKnowledge: ['二次函数', '配方法', '最值问题']
        },
        {
            id: 2,
            question: 'The teacher asked us ______ the homework by Friday.',
            subject: '英语',
            difficulty: 'easy',
            knowledgePoint: '动词不定式',
            studentAnswer: 'finish',
            correctAnswer: 'to finish',
            errorCount: 1,
            lastErrorDate: '2024-01-14',
            bookmarked: false,
            mastered: false,
            aiAnalysis: 'ask sb. to do sth. 是固定搭配，意为"要求某人做某事"。',
            relatedKnowledge: ['动词不定式', '固定搭配', 'ask用法']
        },
        {
            id: 3,
            question: '一个物体从高处自由落下，忽略空气阻力，求落地时的速度（已知高度h=20m）',
            subject: '物理',
            difficulty: 'hard',
            knowledgePoint: '自由落体运动',
            studentAnswer: 'v = 20m/s',
            correctAnswer: 'v = √(2gh) ≈ 19.8m/s',
            errorCount: 3,
            lastErrorDate: '2024-01-13',
            bookmarked: true,
            mastered: false,
            aiAnalysis: '自由落体运动的速度公式为 v = √(2gh)，不是简单的 v = h。需要掌握基本公式的推导和应用。',
            relatedKnowledge: ['自由落体', '动能定理', '机械能守恒']
        }
    ];

    useEffect(() => {
        fetchMistakes();
    }, [currentUser]);

    useEffect(() => {
        applyFilters();
    }, [mistakes, filterSubject, filterStatus, sortBy]);

    const fetchMistakes = async () => {
        setLoading(true);
        try {
            // 实际调用 API
            // const data = await studentAPI.getMistakes(currentUser._id);
            // setMistakes(data.mistakes);
            // setStatsData(data.statistics);

            // 使用模拟数据
            setTimeout(() => {
                setMistakes(mockMistakes);
                setStatsData({
                    bySubject: { '数学': 12, '英语': 8, '物理': 5 },
                    byKnowledgePoint: [35, 25, 20, 20]
                });
                setLoading(false);
            }, 500);
        } catch (err) {
            console.error('获取错题失败:', err);
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let result = [...mistakes];

        // 科目筛选
        if (filterSubject !== 'all') {
            result = result.filter(m => m.subject === filterSubject);
        }

        // 状态筛选
        if (filterStatus !== 'all') {
            result = result.filter(m => filterStatus === 'mastered' ? m.mastered : !m.mastered);
        }

        // 排序
        if (sortBy === 'date') {
            result.sort((a, b) => new Date(b.lastErrorDate) - new Date(a.lastErrorDate));
        } else if (sortBy === 'count') {
            result.sort((a, b) => b.errorCount - a.errorCount);
        }

        setFilteredMistakes(result);
    };

    const handleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const handleBookmark = (id) => {
        setMistakes(mistakes.map(m =>
            m.id === id ? { ...m, bookmarked: !m.bookmarked } : m
        ));
    };

    const handleReplay = (id) => {
        const mistake = mistakes.find(m => m.id === id);
        setReplayDialog({ open: true, mistake });
    };

    const subjects = ['all', ...new Set(mistakes.map(m => m.subject))];

    return (
        <Container maxWidth="lg" sx={{ mt: 3, mb: 4 }}>
            {/* 页面标题 */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ErrorIcon color="error" sx={{ fontSize: 32, mr: 1 }} />
                    <Typography variant="h4">{tStudent('mistakeBook') || '错题本'}</Typography>
                </Box>
                <Button variant="contained" startIcon={<ReplayIcon />} color="primary">
                    开始错题重练
                </Button>
            </Box>

            {/* 统计卡片 */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={8}>
                    <MistakeStatistics data={statsData} loading={loading} />
                </Grid>
                <Grid item xs={12} md={4}>
                    <MasteryProgress progress={{ mastered: 12, total: 25, pending: 13 }} />
                </Grid>
            </Grid>

            {/* 筛选栏 */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>科目筛选</InputLabel>
                            <Select
                                value={filterSubject}
                                label="科目筛选"
                                onChange={(e) => setFilterSubject(e.target.value)}
                            >
                                <MenuItem value="all">全部科目</MenuItem>
                                {subjects.filter(s => s !== 'all').map(s => (
                                    <MenuItem key={s} value={s}>{s}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>状态</InputLabel>
                            <Select
                                value={filterStatus}
                                label="状态"
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <MenuItem value="all">全部状态</MenuItem>
                                <MenuItem value="pending">待攻克</MenuItem>
                                <MenuItem value="mastered">已攻克</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>排序方式</InputLabel>
                            <Select
                                value={sortBy}
                                label="排序方式"
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <MenuItem value="date">按时间</MenuItem>
                                <MenuItem value="count">按错误次数</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <Button fullWidth variant="outlined" startIcon={<FilterIcon />} onClick={applyFilters}>
                            应用筛选
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* 错题列表 */}
            <Box>
                {loading ? (
                    [1, 2, 3].map(i => <Skeleton key={i} height={200} sx={{ mb: 2 }} />)
                ) : filteredMistakes.length > 0 ? (
                    filteredMistakes.map(mistake => (
                        <MistakeCard
                            key={mistake.id}
                            mistake={mistake}
                            expanded={expandedId === mistake.id}
                            onExpand={handleExpand}
                            onBookmark={handleBookmark}
                            onReplay={handleReplay}
                        />
                    ))
                ) : (
                    <Paper sx={{ p: 4, textAlign: 'center' }}>
                        <CheckIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                            {tStudent('noMistakes') || '太棒了！暂无错题记录'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            继续保持，加油！
                        </Typography>
                    </Paper>
                )}
            </Box>

            {/* 重练对话框 */}
            <Dialog open={replayDialog.open} onClose={() => setReplayDialog({ open: false, mistake: null })} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ReplayIcon color="primary" sx={{ mr: 1 }} />
                        错题重练
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {replayDialog.mistake && (
                        <Box>
                            <Typography variant="subtitle1" gutterBottom>
                                {replayDialog.mistake.question}
                            </Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                placeholder="请输入你的答案"
                                sx={{ mt: 2 }}
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setReplayDialog({ open: false, mistake: null })}>取消</Button>
                    <Button variant="contained" color="primary">提交答案</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default StudentMistakeBook;
