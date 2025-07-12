import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Chip,
    LinearProgress,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    Divider,
    Badge
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import BatchIcon from '@mui/icons-material/PlaylistAddCheck';
import PersonIcon from '@mui/icons-material/Person';
import RecommendIcon from '@mui/icons-material/Lightbulb';
import { useSelector } from 'react-redux';
import axios from 'axios';

const StudentAnalytics = () => {
    const { currentUser } = useSelector(state => state.user);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [assessments, setAssessments] = useState([]);
    const [selectedAssessment, setSelectedAssessment] = useState('');
    const [analysisReport, setAnalysisReport] = useState(null);
    const [batchProcessing, setBatchProcessing] = useState(false);
    const [studentDialog, setStudentDialog] = useState({ open: false, student: null, recommendations: null });

    // 获取考核列表
    useEffect(() => {
        fetchAssessments();
    }, []);

    const fetchAssessments = async () => {
        try {
            const response = await axios.get(`/api/ai/assessment/teacher/${currentUser._id}?status=已发布`);
            if (response.data.success) {
                setAssessments(response.data.assessments);
            }
        } catch (err) {
            console.error('获取考核列表失败:', err);
        }
    };

    const generateAnalysisReport = async () => {
        if (!selectedAssessment) return;

        setLoading(true);
        setError('');
        
        try {
            const response = await axios.get(
                `/api/ai/analysis/class/${currentUser._id}/${currentUser.teachSubject._id}/${selectedAssessment}`
            );

            if (response.data.success) {
                setAnalysisReport(response.data.report);
            } else {
                setError(response.data.message || '生成报告失败');
            }
        } catch (err) {
            setError('生成分析报告时发生错误：' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    // 批量分析提交
    const handleBatchAnalysis = async () => {
        if (!selectedAssessment) return;

        setBatchProcessing(true);
        setError('');

        try {
            const response = await axios.post(
                `/api/ai/analysis/batch/${selectedAssessment}/${currentUser._id}`
            );

            if (response.data.success) {
                setSuccess(`批量分析完成！处理了 ${response.data.processed}/${response.data.total} 个提交`);
                // 重新生成报告
                generateAnalysisReport();
            } else {
                setError(response.data.message || '批量分析失败');
            }
        } catch (err) {
            setError('批量分析时发生错误：' + (err.response?.data?.message || err.message));
        } finally {
            setBatchProcessing(false);
        }
    };

    // 查看学生个性化建议
    const handleViewStudentRecommendations = async (student) => {
        try {
            const response = await axios.get(
                `/api/ai/analysis/recommendations/${student.studentId}/${currentUser.teachSubject._id}`
            );

            if (response.data.success) {
                setStudentDialog({
                    open: true,
                    student: student,
                    recommendations: response.data.recommendations
                });
            } else {
                setError('获取学习建议失败');
            }
        } catch (err) {
            setError('获取学习建议时发生错误：' + (err.response?.data?.message || err.message));
        }
    };

    const getScoreColor = (percentage) => {
        if (percentage >= 85) return 'success';
        if (percentage >= 70) return 'warning';
        return 'error';
    };

    const getMasteryColor = (level) => {
        switch (level) {
            case '熟练掌握': return 'success';
            case '基本掌握': case '部分掌握': return 'warning';
            default: return 'error';
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                学情数据分析
            </Typography>

            {/* 选择考核 */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                            <InputLabel>选择考核</InputLabel>
                            <Select
                                value={selectedAssessment}
                                onChange={(e) => setSelectedAssessment(e.target.value)}
                            >
                                {assessments.map(assessment => (
                                    <MenuItem key={assessment._id} value={assessment._id}>
                                        {assessment.title} ({assessment.usageStats?.assignedCount || 0}人参与)
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Button
                            variant="contained"
                            onClick={generateAnalysisReport}
                            disabled={!selectedAssessment || loading}
                            fullWidth
                        >
                            {loading ? (
                                <>
                                    <CircularProgress size={20} sx={{ mr: 1 }} />
                                    分析中...
                                </>
                            ) : (
                                '生成分析报告'
                            )}
                        </Button>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Button
                            variant="outlined"
                            startIcon={<BatchIcon />}
                            onClick={handleBatchAnalysis}
                            disabled={!selectedAssessment || batchProcessing}
                            fullWidth
                        >
                            {batchProcessing ? (
                                <>
                                    <CircularProgress size={20} sx={{ mr: 1 }} />
                                    批量分析中...
                                </>
                            ) : (
                                '批量分析提交'
                            )}
                        </Button>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Button
                            variant="outlined"
                            color="info"
                            disabled={!selectedAssessment}
                            fullWidth
                        >
                            导出报告
                        </Button>
                    </Grid>
                </Grid>

                {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                    </Alert>
                )}
            </Paper>

            {/* 分析报告 */}
            {analysisReport && (
                <Grid container spacing={3}>
                    {/* 班级统计概览 */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                班级统计概览
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={6} md={3}>
                                    <Card>
                                        <CardContent sx={{ textAlign: 'center' }}>
                                            <Typography variant="h4" color="primary">
                                                {analysisReport.classStats.totalStudents}
                                            </Typography>
                                            <Typography variant="body2">
                                                总人数
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Card>
                                        <CardContent sx={{ textAlign: 'center' }}>
                                            <Typography variant="h4" color="primary">
                                                {analysisReport.classStats.averageScore}
                                            </Typography>
                                            <Typography variant="body2">
                                                平均分
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Card>
                                        <CardContent sx={{ textAlign: 'center' }}>
                                            <Typography variant="h4" color="success.main">
                                                {analysisReport.classStats.passRate}%
                                            </Typography>
                                            <Typography variant="body2">
                                                及格率
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Card>
                                        <CardContent sx={{ textAlign: 'center' }}>
                                            <Typography variant="h4" color="warning.main">
                                                {analysisReport.classStats.needsHelp}
                                            </Typography>
                                            <Typography variant="body2">
                                                需要帮助
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>

                    {/* 知识点掌握情况 */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                知识点掌握情况
                            </Typography>
                            {Object.entries(analysisReport.knowledgePointStats).map(([point, stats]) => {
                                const masteryRate = ((stats.mastered + stats.partiallyMastered) / stats.total * 100).toFixed(1);
                                return (
                                    <Box key={point} sx={{ mb: 2 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2">{point}</Typography>
                                            <Typography variant="body2">{masteryRate}%</Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={parseFloat(masteryRate)}
                                            color={masteryRate >= 70 ? 'success' : masteryRate >= 50 ? 'warning' : 'error'}
                                        />
                                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                            <Chip label={`掌握${stats.mastered}`} size="small" color="success" />
                                            <Chip label={`部分${stats.partiallyMastered}`} size="small" color="warning" />
                                            <Chip label={`未掌握${stats.notMastered}`} size="small" color="error" />
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Paper>
                    </Grid>

                    {/* 教学建议 */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                AI教学建议
                            </Typography>
                            
                            {analysisReport.teachingAdvice.assessment && (
                                <Accordion>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Typography variant="subtitle2">教学效果评估</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Typography variant="body2">
                                            {analysisReport.teachingAdvice.assessment}
                                        </Typography>
                                    </AccordionDetails>
                                </Accordion>
                            )}

                            {analysisReport.teachingAdvice.focusAreas?.length > 0 && (
                                <Accordion>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Typography variant="subtitle2">重点关注领域</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        {analysisReport.teachingAdvice.focusAreas.map((area, index) => (
                                            <Chip key={index} label={area} sx={{ mr: 1, mb: 1 }} />
                                        ))}
                                    </AccordionDetails>
                                </Accordion>
                            )}

                            {analysisReport.teachingAdvice.improvementSuggestions?.length > 0 && (
                                <Accordion>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Typography variant="subtitle2">改进建议</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        {analysisReport.teachingAdvice.improvementSuggestions.map((suggestion, index) => (
                                            <Typography key={index} variant="body2" paragraph>
                                                • {suggestion}
                                            </Typography>
                                        ))}
                                    </AccordionDetails>
                                </Accordion>
                            )}
                        </Paper>
                    </Grid>

                    {/* 学生详细表现 */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                学生详细表现
                            </Typography>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>学号</TableCell>
                                            <TableCell>姓名</TableCell>
                                            <TableCell>得分</TableCell>
                                            <TableCell>百分比</TableCell>
                                            <TableCell>状态</TableCell>
                                            <TableCell>趋势</TableCell>
                                            <TableCell>操作</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {analysisReport.studentDetails.map((student, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{student.rollNum}</TableCell>
                                                <TableCell>{student.studentName}</TableCell>
                                                <TableCell>{student.score}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={`${student.percentage}%`}
                                                        color={getScoreColor(parseFloat(student.percentage))}
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={student.status}
                                                        color={student.status === '及格' ? 'success' : 'error'}
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {parseFloat(student.percentage) >= 70 ? (
                                                        <TrendingUpIcon color="success" />
                                                    ) : (
                                                        <TrendingDownIcon color="error" />
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        size="small"
                                                        startIcon={<RecommendIcon />}
                                                        onClick={() => handleViewStudentRecommendations(student)}
                                                    >
                                                        学习建议
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Grid>
                </Grid>
            )}

            {/* 学生个性化建议对话框 */}
            <Dialog
                open={studentDialog.open}
                onClose={() => setStudentDialog({ open: false, student: null, recommendations: null })}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon />
                        {studentDialog.student?.studentName} 的学习建议
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {studentDialog.recommendations ? (
                        <Box>
                            {/* 学习优势 */}
                            {studentDialog.recommendations.strengths && (
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="h6" gutterBottom color="success.main">
                                        学习优势
                                    </Typography>
                                    <List dense>
                                        {studentDialog.recommendations.strengths.map((strength, index) => (
                                            <ListItem key={index}>
                                                <ListItemText primary={`• ${strength}`} />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Box>
                            )}

                            <Divider sx={{ my: 2 }} />

                            {/* 改进领域 */}
                            {studentDialog.recommendations.improvements && (
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="h6" gutterBottom color="warning.main">
                                        需要改进的领域
                                    </Typography>
                                    <List dense>
                                        {studentDialog.recommendations.improvements.map((improvement, index) => (
                                            <ListItem key={index}>
                                                <ListItemText primary={`• ${improvement}`} />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Box>
                            )}

                            <Divider sx={{ my: 2 }} />

                            {/* 学习建议 */}
                            {studentDialog.recommendations.suggestions && (
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="h6" gutterBottom color="primary">
                                        具体学习建议
                                    </Typography>
                                    <List dense>
                                        {studentDialog.recommendations.suggestions.map((suggestion, index) => (
                                            <ListItem key={index}>
                                                <ListItemText primary={`• ${suggestion}`} />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Box>
                            )}

                            {/* 推荐资源 */}
                            {studentDialog.recommendations.resources && studentDialog.recommendations.resources.length > 0 && (
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="h6" gutterBottom color="info.main">
                                        推荐学习资源
                                    </Typography>
                                    <List dense>
                                        {studentDialog.recommendations.resources.map((resource, index) => (
                                            <ListItem key={index}>
                                                <ListItemText primary={`• ${resource}`} />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Box>
                            )}

                            {/* 下一步计划 */}
                            {studentDialog.recommendations.nextSteps && (
                                <Box>
                                    <Typography variant="h6" gutterBottom color="secondary">
                                        下一步学习计划
                                    </Typography>
                                    <List dense>
                                        {studentDialog.recommendations.nextSteps.map((step, index) => (
                                            <ListItem key={index}>
                                                <ListItemText primary={`${index + 1}. ${step}`} />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Box>
                            )}
                        </Box>
                    ) : (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <CircularProgress />
                            <Typography variant="body2" sx={{ mt: 2 }}>
                                正在生成个性化学习建议...
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setStudentDialog({ open: false, student: null, recommendations: null })}>
                        关闭
                    </Button>
                    <Button variant="contained" color="primary">
                        发送给学生
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default StudentAnalytics;
