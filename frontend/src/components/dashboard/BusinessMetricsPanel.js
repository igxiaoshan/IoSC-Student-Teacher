import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Grid,
    LinearProgress,
    Chip,
    List,
    ListItem,
    ListItemText,
    ListItemIcon
} from '@mui/material';
import {
    Assignment as AssignmentIcon,
    TrendingUp as TrendingUpIcon,
    School as SchoolIcon,
    Grade as GradeIcon,
    People as PeopleIcon,
    Login as LoginIcon,
    Psychology as PsychologyIcon,
    PlayCircle as PlayCircleIcon,
    Assignment as HomeworkIcon,
    OnlinePredicationIcon,
    AccessTime as AccessTimeIcon,
    QuestionAnswer as QuestionAnswerIcon,
    Speed as SpeedIcon
} from '@mui/icons-material';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip
} from 'recharts';

const BusinessMetricsPanel = ({ data, loading = false }) => {
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

    // 处理成绩分布数据
    const gradeDistributionData = data?.gradeDistribution?.map((item, index) => ({
        name: item.range,
        value: item.count,
        color: COLORS[index % COLORS.length]
    })) || [];

    // 处理科目受欢迎程度数据
    const subjectPopularityData = data?.subjectPopularity?.map(item => ({
        name: item.subName,
        students: item.studentCount,
        sessions: item.sessions
    })) || [];

    // 自定义Tooltip
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <Box
                    sx={{
                        backgroundColor: 'background.paper',
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        p: 1,
                        boxShadow: 2
                    }}
                >
                    <Typography variant="body2" color="textSecondary">
                        {label}
                    </Typography>
                    {payload.map((entry, index) => (
                        <Typography key={index} variant="body2" style={{ color: entry.color }}>
                            {`${entry.name}: ${entry.value}`}
                        </Typography>
                    ))}
                </Box>
            );
        }
        return null;
    };

    // 获取状态颜色
    const getStatusColor = (value, threshold = 70) => {
        if (value >= threshold) return 'success';
        if (value >= threshold * 0.7) return 'warning';
        return 'error';
    };

    return (
        <Card elevation={2}>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    业务关键指标
                </Typography>

                <Grid container spacing={3}>
                    {/* 考试统计 */}
                    <Grid item xs={12} md={6} lg={4}>
                        <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <AssignmentIcon sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography variant="subtitle1">
                                    考试统计
                                </Typography>
                            </Box>

                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Box sx={{ textAlign: 'center', py: 1 }}>
                                        <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', fontSize: '1.5rem' }}>
                                            {data?.examCompletionRate?.toFixed(1) || 0}%
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                                            完成率
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Box sx={{ textAlign: 'center', py: 1 }}>
                                        <Typography variant="h6" color="success.main" sx={{ fontWeight: 'bold', fontSize: '1.5rem' }}>
                                            {data?.examPassRate?.toFixed(1) || 0}%
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                                            通过率
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12}>
                                    <Box sx={{ mt: 2, px: 1 }}>
                                        <Typography variant="body2" color="textSecondary" gutterBottom sx={{ fontSize: '0.875rem' }}>
                                            平均分数: {data?.averageExamScore?.toFixed(1) || 0}分
                                        </Typography>
                                        <LinearProgress
                                            variant="determinate"
                                            value={data?.averageExamScore || 0}
                                            color={getStatusColor(data?.averageExamScore || 0)}
                                            sx={{ height: 6, borderRadius: 3 }}
                                        />
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>
                    </Grid>

                    {/* 登录统计 */}
                    <Grid item xs={12} md={6} lg={4}>
                        <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <LoginIcon sx={{ mr: 1, color: 'info.main' }} />
                                <Typography variant="subtitle1">
                                    登录统计
                                </Typography>
                            </Box>

                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h5" color="info.main">
                                            {data?.loginStats?.studentLogins || 0}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            学生登录
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h5" color="warning.main">
                                            {data?.loginStats?.teacherLogins || 0}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            教师登录
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12}>
                                    <Box sx={{ mt: 1, textAlign: 'center' }}>
                                        <Typography variant="body2" color="textSecondary">
                                            日均登录: {data?.loginStats?.dailyAverageLogins || 0} 次
                                        </Typography>
                                        <Chip
                                            label={`增长率 +${data?.loginStats?.loginGrowthRate?.toFixed(1) || 0}%`}
                                            color="success"
                                            size="small"
                                            sx={{ mt: 1 }}
                                        />
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>
                    </Grid>

                    {/* AI问答统计 */}
                    <Grid item xs={12} md={6} lg={4}>
                        <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <PsychologyIcon sx={{ mr: 1, color: 'secondary.main' }} />
                                <Typography variant="subtitle1">
                                    AI问答统计
                                </Typography>
                            </Box>

                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h5" color="secondary.main">
                                            {data?.aiStats?.totalQuestions || 0}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            总问题数
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h5" color="success.main">
                                            {data?.aiStats?.successRate?.toFixed(1) || 0}%
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            成功率
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12}>
                                    <Box sx={{ mt: 1, textAlign: 'center' }}>
                                        <Typography variant="body2" color="textSecondary">
                                            平均响应: {data?.aiStats?.averageResponseTime?.toFixed(1) || 0}秒
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            日均问题: {data?.aiStats?.dailyQuestions || 0} 个
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>
                    </Grid>

                    {/* 课程活跃度 */}
                    <Grid item xs={12} md={6} lg={4}>
                        <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <PlayCircleIcon sx={{ mr: 1, color: 'success.main' }} />
                                <Typography variant="subtitle1">
                                    课程活跃度
                                </Typography>
                            </Box>

                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h5" color="success.main">
                                            {data?.courseActivity?.activeRate?.toFixed(1) || 0}%
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            活跃率
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h5" color="primary.main">
                                            {data?.courseActivity?.activeCourses || 0}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            活跃课程
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12}>
                                    <Box sx={{ mt: 1, textAlign: 'center' }}>
                                        <Typography variant="body2" color="textSecondary">
                                            平均学生数: {data?.courseActivity?.averageStudentsPerCourse || 0}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            完成率: {data?.courseActivity?.completionRate?.toFixed(1) || 0}%
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>
                    </Grid>

                    {/* 作业统计 */}
                    <Grid item xs={12} md={6} lg={4}>
                        <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <HomeworkIcon sx={{ mr: 1, color: 'warning.main' }} />
                                <Typography variant="subtitle1">
                                    作业统计
                                </Typography>
                            </Box>

                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h5" color="warning.main">
                                            {data?.homeworkStats?.submissionRate?.toFixed(1) || 0}%
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            提交率
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h5" color="success.main">
                                            {data?.homeworkStats?.averageGrade?.toFixed(1) || 0}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            平均分
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12}>
                                    <Box sx={{ mt: 1, textAlign: 'center' }}>
                                        <Typography variant="body2" color="textSecondary">
                                            总作业: {data?.homeworkStats?.totalAssignments || 0} 份
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            迟交: {data?.homeworkStats?.lateSubmissions || 0} 份
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>
                    </Grid>

                    {/* 实时统计 */}
                    <Grid item xs={12} md={6} lg={4}>
                        <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <SpeedIcon sx={{ mr: 1, color: 'error.main' }} />
                                <Typography variant="subtitle1">
                                    实时统计
                                </Typography>
                            </Box>

                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h5" color="error.main">
                                            {data?.realTimeStats?.onlineStudents || 0}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            在线学生
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h5" color="info.main">
                                            {data?.realTimeStats?.onlineTeachers || 0}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            在线教师
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12}>
                                    <Box sx={{ mt: 1, textAlign: 'center' }}>
                                        <Typography variant="body2" color="textSecondary">
                                            活跃班级: {data?.realTimeStats?.activeClasses || 0} 个
                                        </Typography>
                                        <LinearProgress
                                            variant="determinate"
                                            value={data?.realTimeStats?.systemLoad || 0}
                                            color={getStatusColor(data?.realTimeStats?.systemLoad || 0, 80)}
                                            sx={{ height: 4, borderRadius: 2, mt: 1 }}
                                        />
                                        <Typography variant="caption" color="textSecondary">
                                            系统负载: {data?.realTimeStats?.systemLoad?.toFixed(1) || 0}%
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>
                    </Grid>

                    {/* AI热门话题 */}
                    <Grid item xs={12} md={6}>
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <QuestionAnswerIcon sx={{ mr: 1, color: 'secondary.main' }} />
                                <Typography variant="subtitle1">
                                    AI热门话题
                                </Typography>
                            </Box>

                            {data?.aiStats?.popularTopics?.length > 0 ? (
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={data.aiStats.popularTopics}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="topic"
                                            tick={{ fontSize: 12 }}
                                            angle={-45}
                                            textAnchor="end"
                                            height={60}
                                        />
                                        <YAxis tick={{ fontSize: 12 }} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="count" fill="#9c27b0" />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
                                    暂无数据
                                </Typography>
                            )}
                        </Box>
                    </Grid>

                    {/* 科目受欢迎程度 */}
                    <Grid item xs={12} md={6}>
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <SchoolIcon sx={{ mr: 1, color: 'warning.main' }} />
                                <Typography variant="subtitle1">
                                    热门科目排行
                                </Typography>
                            </Box>

                            {subjectPopularityData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={subjectPopularityData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="name"
                                            tick={{ fontSize: 12 }}
                                            angle={-45}
                                            textAnchor="end"
                                            height={60}
                                        />
                                        <YAxis tick={{ fontSize: 12 }} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="students" fill="#8884d8" />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
                                    暂无数据
                                </Typography>
                            )}
                        </Box>
                    </Grid>

                    {/* 成绩分布 */}
                    <Grid item xs={12} md={6}>
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <GradeIcon sx={{ mr: 1, color: 'success.main' }} />
                                <Typography variant="subtitle1">
                                    成绩分布
                                </Typography>
                            </Box>
                            
                            {gradeDistributionData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie
                                            data={gradeDistributionData}
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={60}
                                            fill="#8884d8"
                                            dataKey="value"
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {gradeDistributionData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
                                    暂无数据
                                </Typography>
                            )}
                        </Box>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};

export default BusinessMetricsPanel;
