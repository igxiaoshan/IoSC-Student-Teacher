import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    CircularProgress
} from '@mui/material';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';

const UserActivityChart = ({ data, loading = false }) => {
    // 处理数据格式
    const chartData = data?.dailyActiveUsers?.map(item => ({
        date: item._id.date || item._id,
        activeUsers: item.count || item.activeUsers || 0
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
                        {`日期: ${label}`}
                    </Typography>
                    <Typography variant="body2" color="primary">
                        {`活跃用户: ${payload[0].value}人`}
                    </Typography>
                </Box>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        用户活跃度趋势
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card elevation={2}>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    用户活跃度趋势
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    显示每日活跃用户数量变化
                </Typography>
                
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                                dataKey="date" 
                                tick={{ fontSize: 12 }}
                                tickFormatter={(value) => {
                                    const date = new Date(value);
                                    return `${date.getMonth() + 1}/${date.getDate()}`;
                                }}
                            />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="activeUsers"
                                stroke="#8884d8"
                                fillOpacity={1}
                                fill="url(#colorUsers)"
                                strokeWidth={2}
                            />
                        </AreaChart>
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
                            暂无数据
                        </Typography>
                    </Box>
                )}
                
                {/* 统计摘要 */}
                {data && (
                    <Box sx={{ mt: 2, display: 'flex', gap: 3 }}>
                        <Box>
                            <Typography variant="caption" color="textSecondary">
                                总用户数
                            </Typography>
                            <Typography variant="h6">
                                {data.totalUsers || 0}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="textSecondary">
                                活跃用户数
                            </Typography>
                            <Typography variant="h6">
                                {data.activeUsers || 0}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="textSecondary">
                                活跃率
                            </Typography>
                            <Typography variant="h6">
                                {data.userActivityRate ? `${data.userActivityRate.toFixed(1)}%` : '0%'}
                            </Typography>
                        </Box>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default UserActivityChart;
