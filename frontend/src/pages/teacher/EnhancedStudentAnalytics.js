import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Tabs,
    Tab,
    Alert,
    CircularProgress,
    Chip,
    LinearProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Badge,
    Tooltip
} from '@mui/material';

import {
    ExpandMore as ExpandMoreIcon,
    Analytics as AnalyticsIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon,
    School as SchoolIcon,
    Person as PersonIcon,
    Assessment as AssessmentIcon,
    Refresh as RefreshIcon,
    Download as DownloadIcon,
    Notifications as NotificationsIcon
} from '@mui/icons-material';

import { useSelector } from 'react-redux';
import axios from 'axios';

const EnhancedStudentAnalytics = () => {
    const { currentUser } = useSelector(state => state.user);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState(0);
    
    // 分析数据状态
    const [classAnalytics, setClassAnalytics] = useState(null);
    const [realtimeData, setRealtimeData] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentDetailDialog, setStudentDetailDialog] = useState(false);
    
    // 筛选条件
    const [timeRange, setTimeRange] = useState('month');
    const [analysisType, setAnalysisType] = useState('comprehensive');
    const [alertLevel, setAlertLevel] = useState('all');

    useEffect(() => {
        fetchClassAnalytics();
        fetchRealtimeData();
        
        // 设置定时刷新实时数据
        const interval = setInterval(fetchRealtimeData, 30000); // 30秒刷新一次
        return () => clearInterval(interval);
    }, [timeRange, analysisType]);

    const fetchClassAnalytics = async () => {
        setLoading(true);
        setError('');
        
        try {
            const response = await axios.get(
                `/api/enhanced-analytics/class/${currentUser._id}`,
                {
                    params: {
                        timeRange,
                        analysisType,
                        subject: currentUser.teachSubject._id,
                        includeIndividual: true
                    }
                }
            );

            if (response.data.success) {
                setClassAnalytics(response.data);
            } else {
                setError(response.data.message || '获取班级分析失败');
            }
        } catch (err) {
            setError('获取班级分析时发生错误：' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const fetchRealtimeData = async () => {
        try {
            const response = await axios.get(
                `/api/enhanced-analytics/realtime/${currentUser._id}`,
                { params: { alertLevel } }
            );

            if (response.data.success) {
                setRealtimeData(response.data.monitoringData);
            }
        } catch (err) {
            console.error('获取实时数据失败:', err);
        }
    };

    const handleStudentDetail = async (student) => {
        try {
            const response = await axios.get(
                `/api/enhanced-analytics/student/${currentUser._id}/${student.studentId}`,
                {
                    params: {
                        timeRange,
                        includeRecommendations: true
                    }
                }
            );

            if (response.data.success) {
                setSelectedStudent({
                    ...student,
                    detailData: response.data.studentData,
                    recommendations: response.data.recommendations
                });
                setStudentDetailDialog(true);
            }
        } catch (err) {
            setError('获取学生详情失败：' + (err.response?.data?.message || err.message));
        }
    };

    const getPerformanceColor = (score) => {
        if (score >= 90) return 'success';
        if (score >= 80) return 'info';
        if (score >= 70) return 'warning';
        return 'error';
    };

    const getTrendIcon = (trend) => {
        switch (trend) {
            case '上升':
                return <TrendingUpIcon color="success" />;
            case '下降':
                return <TrendingDownIcon color="error" />;
            default:
                return <TrendingUpIcon color="disabled" />;
        }
    };

    const renderOverviewTab = () => (
        <Grid container spacing={3}>
            {/* 班级统计卡片 */}
            <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        班级概览
                    </Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={6} md={3}>
                            <Card>
                                <CardContent sx={{ textAlign: 'center' }}>
                                    <Typography variant="h4" color="primary">
                                        {classAnalytics?.classInfo?.studentCount || 0}
                                    </Typography>
                                    <Typography variant="body2">总人数</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Card>
                                <CardContent sx={{ textAlign: 'center' }}>
                                    <Typography variant="h4" color="success.main">
                                        {classAnalytics?.overallStats?.averageScore?.toFixed(1) || 0}
                                    </Typography>
                                    <Typography variant="body2">平均分</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Card>
                                <CardContent sx={{ textAlign: 'center' }}>
                                    <Typography variant="h4" color="info.main">
                                        {classAnalytics?.overallStats?.accuracy?.toFixed(1) || 0}%
                                    </Typography>
                                    <Typography variant="body2">正确率</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Card>
                                <CardContent sx={{ textAlign: 'center' }}>
                                    <Typography variant="h4" color="warning.main">
                                        {realtimeData?.alerts?.length || 0}
                                    </Typography>
                                    <Typography variant="body2">待关注</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Paper>
            </Grid>

            {/* AI分析结果 */}
            {classAnalytics?.aiAnalysis && (
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            <AnalyticsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                            AI深度分析
                        </Typography>
                        
                        {/* 整体表现分析 */}
                        {classAnalytics.aiAnalysis.overallPerformance && (
                            <Accordion>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography variant="subtitle2">整体表现分析</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="body2" gutterBottom>
                                                <strong>平均分：</strong>
                                                {classAnalytics.aiAnalysis.overallPerformance.averageScore}分
                                            </Typography>
                                            <Typography variant="body2" gutterBottom>
                                                <strong>及格率：</strong>
                                                {classAnalytics.aiAnalysis.overallPerformance.passRate}%
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>趋势：</strong>
                                                {classAnalytics.aiAnalysis.overallPerformance.performanceTrend}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="body2" gutterBottom>
                                                <strong>分数分布：</strong>
                                            </Typography>
                                            {classAnalytics.aiAnalysis.overallPerformance.scoreDistribution?.map((range, index) => (
                                                <Box key={index} sx={{ mb: 1 }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <Typography variant="caption">{range.range}分</Typography>
                                                        <Typography variant="caption">{range.count}人</Typography>
                                                    </Box>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={(range.count / classAnalytics.classInfo.studentCount) * 100}
                                                        sx={{ height: 6, borderRadius: 3 }}
                                                    />
                                                </Box>
                                            ))}
                                        </Grid>
                                    </Grid>
                                </AccordionDetails>
                            </Accordion>
                        )}

                        {/* 知识点分析 */}
                        {classAnalytics.aiAnalysis.knowledgePointAnalysis && (
                            <Accordion>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography variant="subtitle2">知识点掌握情况</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    {Object.entries(classAnalytics.aiAnalysis.knowledgePointAnalysis).map(([point, stats]) => {
                                        const masteryRate = stats.total > 0 ? (stats.mastered / stats.total * 100) : 0;
                                        return (
                                            <Box key={point} sx={{ mb: 2 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                    <Typography variant="body2">{point}</Typography>
                                                    <Typography variant="body2">{masteryRate.toFixed(1)}%</Typography>
                                                </Box>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={masteryRate}
                                                    color={masteryRate >= 80 ? 'success' : masteryRate >= 60 ? 'warning' : 'error'}
                                                />
                                                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                                    <Chip label={`掌握${stats.mastered}`} size="small" color="success" />
                                                    <Chip label={`未掌握${stats.notMastered}`} size="small" color="error" />
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </AccordionDetails>
                            </Accordion>
                        )}

                        {/* 教学建议 */}
                        {classAnalytics.aiAnalysis.recommendations && (
                            <Accordion>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography variant="subtitle2">AI教学建议</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="subtitle3" gutterBottom>
                                                <strong>教学调整建议：</strong>
                                            </Typography>
                                            {classAnalytics.aiAnalysis.recommendations.teachingAdjustments?.map((suggestion, index) => (
                                                <Typography key={index} variant="body2" paragraph>
                                                    • {suggestion}
                                                </Typography>
                                            ))}
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="subtitle3" gutterBottom>
                                                <strong>重点关注领域：</strong>
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                {classAnalytics.aiAnalysis.recommendations.focusAreas?.map((area, index) => (
                                                    <Chip key={index} label={area} color="warning" size="small" />
                                                ))}
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </AccordionDetails>
                            </Accordion>
                        )}
                    </Paper>
                </Grid>
            )}

            {/* 实时监控 */}
            <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">
                            <NotificationsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                            实时监控
                        </Typography>
                        <Button
                            size="small"
                            startIcon={<RefreshIcon />}
                            onClick={fetchRealtimeData}
                        >
                            刷新
                        </Button>
                    </Box>
                    
                    {realtimeData && (
                        <>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    当前活跃学生：{realtimeData.realtimeStats.activeStudents}人
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    24小时活动：{realtimeData.realtimeStats.totalActivities}次
                                </Typography>
                            </Box>
                            
                            {realtimeData.alerts?.length > 0 && (
                                <Box>
                                    <Typography variant="subtitle2" gutterBottom>
                                        需要关注的学生：
                                    </Typography>
                                    {realtimeData.alerts.slice(0, 5).map((alert, index) => (
                                        <Alert key={index} severity={alert.level} sx={{ mb: 1 }}>
                                            <Typography variant="body2">
                                                {alert.studentName}: {alert.message}
                                            </Typography>
                                        </Alert>
                                    ))}
                                </Box>
                            )}
                        </>
                    )}
                </Paper>
            </Grid>
        </Grid>
    );

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    智能学情分析
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>时间范围</InputLabel>
                        <Select
                            value={timeRange}
                            label="时间范围"
                            onChange={(e) => setTimeRange(e.target.value)}
                        >
                            <MenuItem value="week">最近一周</MenuItem>
                            <MenuItem value="month">最近一月</MenuItem>
                            <MenuItem value="semester">本学期</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>分析类型</InputLabel>
                        <Select
                            value={analysisType}
                            label="分析类型"
                            onChange={(e) => setAnalysisType(e.target.value)}
                        >
                            <MenuItem value="comprehensive">综合分析</MenuItem>
                            <MenuItem value="knowledge">知识点分析</MenuItem>
                            <MenuItem value="behavior">学习行为</MenuItem>
                        </Select>
                    </FormControl>
                    <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        disabled={!classAnalytics}
                    >
                        导出报告
                    </Button>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Box sx={{ width: '100%' }}>
                    <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                        <Tab label="班级概览" />
                        <Tab label="个体分析" />
                        <Tab label="趋势预测" />
                        <Tab label="教学建议" />
                    </Tabs>
                    
                    <Box sx={{ mt: 3 }}>
                        {activeTab === 0 && renderOverviewTab()}
                        {activeTab === 1 && <Typography>个体分析功能开发中...</Typography>}
                        {activeTab === 2 && <Typography>趋势预测功能开发中...</Typography>}
                        {activeTab === 3 && <Typography>教学建议功能开发中...</Typography>}
                    </Box>
                </Box>
            )}
        </Container>
    );
};

export default EnhancedStudentAnalytics;
