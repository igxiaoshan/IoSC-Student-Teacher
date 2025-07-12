/**
 * 学情分析组件
 * 分析学生学习数据，提供教学建议
 */

import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Card,
    CardContent,
    Button,
    Alert,
    CircularProgress,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Grid,
    Chip,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    LinearProgress
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    Analytics as AnalyticsIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    School as SchoolIcon,
    Person as PersonIcon,
    Assignment as AssignmentIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
    Lightbulb as LightbulbIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import aiService from '../../services/aiService';

const StudentAnalytics = () => {
    const { currentUser } = useSelector(state => state.user);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [studentData, setStudentData] = useState([]);
    const [analysisResult, setAnalysisResult] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // 模拟数据 - 实际应用中从API获取
    const mockStudentData = [
        {
            id: 1,
            name: '张三',
            subject: '数学',
            totalQuestions: 50,
            correctAnswers: 42,
            accuracy: 0.84,
            averageTime: 120,
            weakPoints: ['二次函数', '几何证明'],
            strongPoints: ['基础运算', '代数方程'],
            recentScores: [85, 88, 82, 90, 87]
        },
        {
            id: 2,
            name: '李四',
            subject: '数学',
            totalQuestions: 48,
            correctAnswers: 35,
            accuracy: 0.73,
            averageTime: 150,
            weakPoints: ['函数图像', '立体几何', '概率统计'],
            strongPoints: ['基础运算'],
            recentScores: [72, 75, 68, 78, 74]
        },
        {
            id: 3,
            name: '王五',
            subject: '数学',
            totalQuestions: 52,
            correctAnswers: 48,
            accuracy: 0.92,
            averageTime: 95,
            weakPoints: ['应用题'],
            strongPoints: ['代数运算', '几何证明', '函数分析'],
            recentScores: [92, 89, 95, 91, 93]
        }
    ];

    const classes = ['高一(1)班', '高一(2)班', '高一(3)班'];
    const subjects = ['数学', '物理', '化学', '英语', '语文'];

    // 获取学生数据
    const fetchStudentData = async () => {
        setLoading(true);
        try {
            // 模拟API调用
            setTimeout(() => {
                setStudentData(mockStudentData);
                setLoading(false);
            }, 1000);
        } catch (error) {
            setError('获取学生数据失败');
            setLoading(false);
        }
    };

    // 分析学生表现
    const handleAnalyzePerformance = async () => {
        if (studentData.length === 0) {
            setError('请先选择班级和学科获取学生数据');
            return;
        }

        setIsAnalyzing(true);
        setError('');
        setAnalysisResult('');

        try {
            const response = await aiService.analyzeStudentPerformance(
                {
                    class: selectedClass,
                    subject: selectedSubject,
                    students: studentData,
                    analysisDate: new Date().toISOString()
                },
                currentUser._id
            );

            if (response.success) {
                setAnalysisResult(response.data.analysis);
            } else {
                setError(response.error || '分析失败');
            }
        } catch (error) {
            console.error('学情分析失败:', error);
            setError('学情分析失败，请稍后重试');
        } finally {
            setIsAnalyzing(false);
        }
    };

    // 获取表现等级颜色
    const getPerformanceColor = (accuracy) => {
        if (accuracy >= 0.9) return 'success';
        if (accuracy >= 0.8) return 'info';
        if (accuracy >= 0.7) return 'warning';
        return 'error';
    };

    // 获取表现等级文本
    const getPerformanceText = (accuracy) => {
        if (accuracy >= 0.9) return '优秀';
        if (accuracy >= 0.8) return '良好';
        if (accuracy >= 0.7) return '中等';
        return '需要提高';
    };

    // 格式化AI分析结果
    const formatAnalysisResult = (content) => {
        return content.split('\n').map((line, index) => {
            if (line.trim().startsWith('#')) {
                return (
                    <Typography key={index} variant="h6" sx={{ mt: 2, mb: 1, color: 'primary.main' }}>
                        {line.replace(/^#+\s*/, '')}
                    </Typography>
                );
            } else if (line.trim().startsWith('-') || line.trim().match(/^\d+\./)) {
                return (
                    <Typography key={index} variant="body2" sx={{ ml: 2, mb: 0.5 }}>
                        {line}
                    </Typography>
                );
            } else if (line.trim()) {
                return (
                    <Typography key={index} variant="body1" sx={{ mb: 1, lineHeight: 1.6 }}>
                        {line}
                    </Typography>
                );
            }
            return <br key={index} />;
        });
    };

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
            {/* 头部 */}
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AnalyticsIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h5">学情数据分析</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                    分析学生学习数据，识别学习模式，提供个性化教学建议
                </Typography>
            </Paper>

            {/* 选择器 */}
            <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                        <FormControl fullWidth>
                            <InputLabel>选择班级</InputLabel>
                            <Select
                                value={selectedClass}
                                label="选择班级"
                                onChange={(e) => setSelectedClass(e.target.value)}
                            >
                                {classes.map((cls) => (
                                    <MenuItem key={cls} value={cls}>
                                        {cls}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} sm={4}>
                        <FormControl fullWidth>
                            <InputLabel>选择学科</InputLabel>
                            <Select
                                value={selectedSubject}
                                label="选择学科"
                                onChange={(e) => setSelectedSubject(e.target.value)}
                            >
                                {subjects.map((subject) => (
                                    <MenuItem key={subject} value={subject}>
                                        {subject}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} sm={4}>
                        <Button
                            variant="contained"
                            onClick={fetchStudentData}
                            disabled={!selectedClass || !selectedSubject || loading}
                            fullWidth
                        >
                            {loading ? <CircularProgress size={20} /> : '获取数据'}
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* 错误提示 */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {/* 学生数据概览 */}
            {studentData.length > 0 && (
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    {/* 整体统计 */}
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    整体统计
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <PersonIcon sx={{ mr: 1 }} />
                                    <Typography>学生人数: {studentData.length}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <AssignmentIcon sx={{ mr: 1 }} />
                                    <Typography>
                                        平均正确率: {Math.round(studentData.reduce((sum, s) => sum + s.accuracy, 0) / studentData.length * 100)}%
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <SchoolIcon sx={{ mr: 1 }} />
                                    <Typography>
                                        平均用时: {Math.round(studentData.reduce((sum, s) => sum + s.averageTime, 0) / studentData.length)}秒
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* 表现分布 */}
                    <Grid item xs={12} md={8}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    表现分布
                                </Typography>
                                <Grid container spacing={2}>
                                    {['优秀', '良好', '中等', '需要提高'].map((level, index) => {
                                        const ranges = [
                                            (s) => s.accuracy >= 0.9,
                                            (s) => s.accuracy >= 0.8 && s.accuracy < 0.9,
                                            (s) => s.accuracy >= 0.7 && s.accuracy < 0.8,
                                            (s) => s.accuracy < 0.7
                                        ];
                                        const count = studentData.filter(ranges[index]).length;
                                        const percentage = Math.round(count / studentData.length * 100);
                                        
                                        return (
                                            <Grid item xs={3} key={level}>
                                                <Box sx={{ textAlign: 'center' }}>
                                                    <Typography variant="h4" color={
                                                        ['success.main', 'info.main', 'warning.main', 'error.main'][index]
                                                    }>
                                                        {count}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {level} ({percentage}%)
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* 学生详细数据表格 */}
            {studentData.length > 0 && (
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            学生详细数据
                        </Typography>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>姓名</TableCell>
                                        <TableCell>答题数量</TableCell>
                                        <TableCell>正确率</TableCell>
                                        <TableCell>平均用时</TableCell>
                                        <TableCell>表现等级</TableCell>
                                        <TableCell>薄弱知识点</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {studentData.map((student) => (
                                        <TableRow key={student.id}>
                                            <TableCell>{student.name}</TableCell>
                                            <TableCell>{student.totalQuestions}</TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Box sx={{ width: '100%', mr: 1 }}>
                                                        <LinearProgress
                                                            variant="determinate"
                                                            value={student.accuracy * 100}
                                                            color={getPerformanceColor(student.accuracy)}
                                                        />
                                                    </Box>
                                                    <Typography variant="body2">
                                                        {Math.round(student.accuracy * 100)}%
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>{student.averageTime}秒</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={getPerformanceText(student.accuracy)}
                                                    color={getPerformanceColor(student.accuracy)}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {student.weakPoints.slice(0, 2).map((point, index) => (
                                                        <Chip
                                                            key={index}
                                                            label={point}
                                                            size="small"
                                                            variant="outlined"
                                                            color="warning"
                                                        />
                                                    ))}
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            )}

            {/* AI分析按钮 */}
            {studentData.length > 0 && (
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={isAnalyzing ? <CircularProgress size={20} /> : <AnalyticsIcon />}
                        onClick={handleAnalyzePerformance}
                        disabled={isAnalyzing}
                    >
                        {isAnalyzing ? 'AI分析中...' : '开始AI学情分析'}
                    </Button>
                </Box>
            )}

            {/* AI分析结果 */}
            {analysisResult && (
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            AI分析报告
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Box sx={{ lineHeight: 1.8 }}>
                            {formatAnalysisResult(analysisResult)}
                        </Box>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
};

export default StudentAnalytics;
