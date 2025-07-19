import React, { useState } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    ToggleButton,
    ToggleButtonGroup,
    Grid,
    Chip
} from '@mui/material';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    ComposedChart,
    Bar
} from 'recharts';
import {
    TrendingUp as TrendingUpIcon,
    People as PeopleIcon,
    School as SchoolIcon
} from '@mui/icons-material';

const GrowthTrendChart = ({ data, loading = false }) => {
    const [chartType, setChartType] = useState('users');

    // 处理用户增长数据
    const processUserGrowthData = () => {
        const userGrowth = data?.userGrowthTrend || [];
        const teacherGrowth = data?.teacherGrowthTrend || [];
        const engagement = data?.engagementTrend || [];

        // 合并数据
        const dateMap = new Map();
        
        userGrowth.forEach(item => {
            const date = item._id.date || item._id;
            dateMap.set(date, { 
                date, 
                newStudents: item.newStudents || 0,
                newTeachers: 0,
                activeUsers: 0
            });
        });

        teacherGrowth.forEach(item => {
            const date = item._id.date || item._id;
            if (dateMap.has(date)) {
                dateMap.get(date).newTeachers = item.newTeachers || 0;
            } else {
                dateMap.set(date, { 
                    date, 
                    newStudents: 0,
                    newTeachers: item.newTeachers || 0,
                    activeUsers: 0
                });
            }
        });

        engagement.forEach(item => {
            const date = item._id.date || item._id;
            if (dateMap.has(date)) {
                dateMap.get(date).activeUsers = item.activeUsers || 0;
            } else {
                dateMap.set(date, { 
                    date, 
                    newStudents: 0,
                    newTeachers: 0,
                    activeUsers: item.activeUsers || 0
                });
            }
        });

        return Array.from(dateMap.values()).sort((a, b) => new Date(a.date) - new Date(b.date));
    };

    const chartData = processUserGrowthData();

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
                        p: 2,
                        boxShadow: 2
                    }}
                >
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                        日期: {new Date(label).toLocaleDateString()}
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

    // 格式化日期
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return `${date.getMonth() + 1}/${date.getDate()}`;
    };

    // 渲染不同类型的图表
    const renderChart = () => {
        switch (chartType) {
            case 'users':
                return (
                    <ComposedChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12 }}
                            tickFormatter={formatDate}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="newStudents" fill="#8884d8" name="新增学生" />
                        <Bar dataKey="newTeachers" fill="#82ca9d" name="新增教师" />
                    </ComposedChart>
                );
            case 'engagement':
                return (
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12 }}
                            tickFormatter={formatDate}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line 
                            type="monotone" 
                            dataKey="activeUsers" 
                            stroke="#ff7300" 
                            strokeWidth={2}
                            name="活跃用户"
                        />
                    </LineChart>
                );
            default:
                return null;
        }
    };

    return (
        <Card elevation={2}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6">
                        增长趋势分析
                    </Typography>
                    <ToggleButtonGroup
                        value={chartType}
                        exclusive
                        onChange={(event, newType) => newType && setChartType(newType)}
                        size="small"
                    >
                        <ToggleButton value="users">
                            用户增长
                        </ToggleButton>
                        <ToggleButton value="engagement">
                            活跃度
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Box>

                {/* 增长率指标 */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                                <TrendingUpIcon sx={{ mr: 0.5, color: 'primary.main' }} />
                                <Typography variant="caption" color="textSecondary">
                                    总增长率
                                </Typography>
                            </Box>
                            <Chip
                                label={`${data?.totalGrowthRate?.toFixed(1) || 0}%`}
                                color={data?.totalGrowthRate > 0 ? 'success' : 'default'}
                                size="small"
                            />
                        </Box>
                    </Grid>
                    <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                                <PeopleIcon sx={{ mr: 0.5, color: 'info.main' }} />
                                <Typography variant="caption" color="textSecondary">
                                    周增长率
                                </Typography>
                            </Box>
                            <Chip
                                label={`${data?.weeklyGrowthRate?.toFixed(1) || 0}%`}
                                color={data?.weeklyGrowthRate > 0 ? 'success' : 'default'}
                                size="small"
                            />
                        </Box>
                    </Grid>
                    <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                                <SchoolIcon sx={{ mr: 0.5, color: 'warning.main' }} />
                                <Typography variant="caption" color="textSecondary">
                                    月增长率
                                </Typography>
                            </Box>
                            <Chip
                                label={`${data?.monthlyGrowthRate?.toFixed(1) || 0}%`}
                                color={data?.monthlyGrowthRate > 0 ? 'success' : 'default'}
                                size="small"
                            />
                        </Box>
                    </Grid>
                </Grid>

                {/* 图表区域 */}
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        {renderChart()}
                    </ResponsiveContainer>
                ) : (
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        height: 300,
                        color: 'text.secondary'
                    }}>
                        <Typography variant="body2">
                            暂无增长趋势数据
                        </Typography>
                    </Box>
                )}

                {/* 数据摘要 */}
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={4}>
                            <Typography variant="caption" color="textSecondary" display="block">
                                数据点数量
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                                {chartData.length}
                            </Typography>
                        </Grid>
                        <Grid item xs={4}>
                            <Typography variant="caption" color="textSecondary" display="block">
                                最高新增
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                                {Math.max(...chartData.map(d => d.newStudents + d.newTeachers), 0)}
                            </Typography>
                        </Grid>
                        <Grid item xs={4}>
                            <Typography variant="caption" color="textSecondary" display="block">
                                平均活跃
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                                {chartData.length > 0 ? 
                                    Math.round(chartData.reduce((sum, d) => sum + d.activeUsers, 0) / chartData.length) : 0}
                            </Typography>
                        </Grid>
                    </Grid>
                </Box>
            </CardContent>
        </Card>
    );
};

export default GrowthTrendChart;
