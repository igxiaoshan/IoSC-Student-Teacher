/**
 * 使用情况仪表板组件
 * 显示系统使用统计和分析数据
 */

import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    CircularProgress,
    Alert,
    Chip,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    TrendingUp as TrendingUpIcon,
    People as PeopleIcon,
    School as SchoolIcon,
    Quiz as QuizIcon,
    Analytics as AnalyticsIcon,
    SmartToy as AIIcon,
    AccessTime as TimeIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon
} from '@mui/icons-material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    ResponsiveContainer
} from 'recharts';

const UsageDashboard = () => {
    const [timeRange, setTimeRange] = useState(30);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [dashboardData, setDashboardData] = useState({
        overview: {},
        userActivity: [],
        featureUsage: [],
        aiUsage: {},
        trends: []
    });

    // 模拟数据 - 实际应用中从API获取
    const mockDashboardData = {
        overview: {
            totalUsers: 156,
            activeUsers: 89,
            totalSessions: 1247,
            avgSessionTime: 25.6,
            aiInteractions: 3456,
            successRate: 0.94
        },
        userActivity: [
            { role: '学生', activeUsers: 45, totalUsers: 89, usageHours: 234 },
            { role: '教师', activeUsers: 32, totalUsers: 45, usageHours: 189 },
            { role: '管理员', activeUsers: 12, totalUsers: 22, usageHours: 67 }
        ],
        featureUsage: [
            { feature: '学习助手', usage: 1234, users: 45 },
            { feature: '练习生成', usage: 987, users: 38 },
            { feature: '智能备课', usage: 756, users: 28 },
            { feature: '考核生成', usage: 543, users: 22 },
            { feature: '学情分析', usage: 432, users: 19 },
            { feature: '学习历史', usage: 321, users: 35 }
        ],
        aiUsage: {
            totalInteractions: 3456,
            successfulInteractions: 3248,
            failedInteractions: 208,
            avgResponseTime: 2.3,
            topFeatures: [
                { name: '学习问答', count: 1456 },
                { name: '智能备课', count: 756 },
                { name: '练习生成', count: 654 },
                { name: '考核生成', count: 543 },
                { name: '学情分析', count: 47 }
            ]
        },
        trends: [
            { date: '2025-01-06', users: 67, sessions: 156, aiCalls: 234 },
            { date: '2025-01-07', users: 72, sessions: 178, aiCalls: 267 },
            { date: '2025-01-08', users: 69, sessions: 165, aiCalls: 245 },
            { date: '2025-01-09', users: 78, sessions: 189, aiCalls: 289 },
            { date: '2025-01-10', users: 85, sessions: 203, aiCalls: 312 },
            { date: '2025-01-11', users: 89, sessions: 218, aiCalls: 345 },
            { date: '2025-01-12', users: 92, sessions: 234, aiCalls: 378 }
        ]
    };

    // 获取仪表板数据
    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // 模拟API调用
            setTimeout(() => {
                setDashboardData(mockDashboardData);
                setLoading(false);
            }, 1000);
        } catch (error) {
            setError('获取数据失败');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [timeRange]);

    // 图表颜色配置
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

    // 格式化数字
    const formatNumber = (num) => {
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 1400, mx: 'auto', p: 2 }}>
            {/* 头部 */}
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <DashboardIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h5">系统使用统计</Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel>时间范围</InputLabel>
                            <Select
                                value={timeRange}
                                label="时间范围"
                                onChange={(e) => setTimeRange(e.target.value)}
                            >
                                <MenuItem value={7}>最近7天</MenuItem>
                                <MenuItem value={30}>最近30天</MenuItem>
                                <MenuItem value={90}>最近90天</MenuItem>
                            </Select>
                        </FormControl>
                        
                        <Button variant="outlined" onClick={fetchDashboardData}>
                            刷新数据
                        </Button>
                    </Box>
                </Box>
            </Paper>

            {/* 错误提示 */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {/* 概览卡片 */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={2}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <PeopleIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="h4" color="primary">
                                {dashboardData.overview.totalUsers}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                总用户数
                            </Typography>
                            <Chip 
                                label={`活跃: ${dashboardData.overview.activeUsers}`} 
                                size="small" 
                                color="success" 
                                sx={{ mt: 1 }}
                            />
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <TrendingUpIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="h4" color="success.main">
                                {formatNumber(dashboardData.overview.totalSessions)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                总会话数
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                平均时长: {dashboardData.overview.avgSessionTime}分钟
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <AIIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="h4" color="secondary.main">
                                {formatNumber(dashboardData.overview.aiInteractions)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                AI交互次数
                            </Typography>
                            <Chip 
                                label={`成功率: ${Math.round(dashboardData.overview.successRate * 100)}%`} 
                                size="small" 
                                color="info" 
                                sx={{ mt: 1 }}
                            />
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                AI服务状态
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                                <Typography variant="body2">
                                    成功: {dashboardData.aiUsage.successfulInteractions}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <ErrorIcon color="error" sx={{ mr: 1 }} />
                                <Typography variant="body2">
                                    失败: {dashboardData.aiUsage.failedInteractions}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <TimeIcon color="info" sx={{ mr: 1 }} />
                                <Typography variant="body2">
                                    平均响应: {dashboardData.aiUsage.avgResponseTime}秒
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                热门AI功能
                            </Typography>
                            <List dense>
                                {dashboardData.aiUsage.topFeatures.slice(0, 3).map((feature, index) => (
                                    <ListItem key={index} sx={{ px: 0 }}>
                                        <ListItemIcon sx={{ minWidth: 32 }}>
                                            <Chip 
                                                label={index + 1} 
                                                size="small" 
                                                color="primary"
                                                sx={{ width: 24, height: 24 }}
                                            />
                                        </ListItemIcon>
                                        <ListItemText 
                                            primary={feature.name}
                                            secondary={`${feature.count} 次使用`}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* 图表区域 */}
            <Grid container spacing={3}>
                {/* 用户活跃度 */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                用户活跃度分析
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={dashboardData.userActivity}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="role" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="activeUsers" fill="#8884d8" name="活跃用户" />
                                    <Bar dataKey="totalUsers" fill="#82ca9d" name="总用户" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </Grid>

                {/* 功能使用排行 */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                功能使用排行
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={dashboardData.featureUsage}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ feature, percent }) => `${feature} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="usage"
                                    >
                                        {dashboardData.featureUsage.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </Grid>

                {/* 使用趋势 */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                使用趋势分析
                            </Typography>
                            <ResponsiveContainer width="100%" height={400}>
                                <LineChart data={dashboardData.trends}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="users" stroke="#8884d8" name="活跃用户" />
                                    <Line type="monotone" dataKey="sessions" stroke="#82ca9d" name="会话数" />
                                    <Line type="monotone" dataKey="aiCalls" stroke="#ffc658" name="AI调用" />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default UsageDashboard;
