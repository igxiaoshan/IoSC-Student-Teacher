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
    People as PeopleIcon
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
                    <Grid item xs={12} md={6}>
                        <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <AssignmentIcon sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography variant="subtitle1">
                                    考试统计
                                </Typography>
                            </Box>
                            
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h4" color="primary">
                                            {data?.examCompletionRate?.toFixed(1) || 0}%
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            完成率
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h4" color="success.main">
                                            {data?.examPassRate?.toFixed(1) || 0}%
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            通过率
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12}>
                                    <Box sx={{ mt: 1 }}>
                                        <Typography variant="body2" color="textSecondary" gutterBottom>
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

                    {/* 教师工作负载 */}
                    <Grid item xs={12} md={6}>
                        <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <PeopleIcon sx={{ mr: 1, color: 'info.main' }} />
                                <Typography variant="subtitle1">
                                    教师工作负载
                                </Typography>
                            </Box>
                            
                            <Grid container spacing={2}>
                                <Grid item xs={4}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h6" color="primary">
                                            {data?.teacherWorkload?.average?.toFixed(1) || 0}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            平均负载
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={4}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h6" color="warning.main">
                                            {data?.teacherWorkload?.max?.toFixed(1) || 0}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            最高负载
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={4}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h6" color="success.main">
                                            {data?.teacherWorkload?.totalTeachers || 0}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            教师总数
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
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
