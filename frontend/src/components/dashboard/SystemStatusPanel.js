import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    LinearProgress,
    Chip,
    Grid,
    Divider,
    CircularProgress,
    Tooltip,
    IconButton
} from '@mui/material';
import {
    Memory as MemoryIcon,
    Speed as SpeedIcon,
    Computer as ComputerIcon,
    Timeline as TimelineIcon,
    Storage as StorageIcon,
    NetworkCheck as NetworkIcon,
    Refresh as RefreshIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    DeviceThermostat as ThermostatIcon
} from '@mui/icons-material';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    Area,
    AreaChart
} from 'recharts';

const SystemStatusPanel = ({ data, loading = false, onRefresh }) => {
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);

    useEffect(() => {
        if (data?.lastUpdated) {
            setLastUpdate(new Date(data.lastUpdated));
        }
    }, [data]);

    // 格式化运行时间
    const formatUptime = (seconds) => {
        if (!seconds) return '0分钟';

        const days = Math.floor(seconds / (24 * 3600));
        const hours = Math.floor((seconds % (24 * 3600)) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (days > 0) {
            return `${days}天 ${hours}小时`;
        } else if (hours > 0) {
            return `${hours}小时 ${minutes}分钟`;
        } else {
            return `${minutes}分钟`;
        }
    };

    // 格式化内存大小
    const formatMemory = (bytes) => {
        if (!bytes) return '0 MB';

        const gb = bytes / (1024 * 1024 * 1024);
        if (gb >= 1) {
            return `${gb.toFixed(2)} GB`;
        }

        const mb = bytes / (1024 * 1024);
        return `${mb.toFixed(0)} MB`;
    };

    // 格式化存储大小
    const formatStorage = (gb) => {
        if (!gb) return '0 GB';
        if (gb >= 1024) {
            return `${(gb / 1024).toFixed(2)} TB`;
        }
        return `${gb.toFixed(1)} GB`;
    };

    // 获取状态颜色
    const getStatusColor = (percentage) => {
        if (percentage < 60) return 'success';
        if (percentage < 80) return 'warning';
        return 'error';
    };

    // 获取趋势图标
    const getTrendIcon = (current, previous) => {
        if (!previous) return null;
        if (current > previous) return <TrendingUpIcon fontSize="small" color="error" />;
        if (current < previous) return <TrendingDownIcon fontSize="small" color="success" />;
        return null;
    };

    // 处理刷新
    const handleRefresh = async () => {
        if (onRefresh) {
            setRefreshing(true);
            await onRefresh();
            setTimeout(() => setRefreshing(false), 1000);
        }
    };

    // 准备历史数据图表
    const prepareChartData = () => {
        if (!data?.history) return [];
        return data.history.slice(-12).map(item => ({
            time: new Date(item.time).getHours() + ':00',
            cpu: item.cpu,
            memory: item.memory,
            network: item.network
        }));
    };

    const systemInfo = data?.system || {};
    const memoryInfo = data?.memory || {};
    const cpuInfo = data?.cpu || {};
    const diskInfo = data?.disk || {};
    const networkInfo = data?.network || {};
    const performanceInfo = data?.performance || {};
    const chartData = prepareChartData();

    if (loading) {
        return (
            <Card elevation={2}>
                <CardContent>
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                        系统状态监控
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {lastUpdate && (
                            <Typography variant="caption" color="textSecondary">
                                {lastUpdate.toLocaleTimeString()}
                            </Typography>
                        )}
                        <Tooltip title="刷新数据">
                            <IconButton
                                size="small"
                                onClick={handleRefresh}
                                disabled={refreshing}
                            >
                                <RefreshIcon sx={{
                                    animation: refreshing ? 'spin 1s linear infinite' : 'none',
                                    '@keyframes spin': {
                                        '0%': { transform: 'rotate(0deg)' },
                                        '100%': { transform: 'rotate(360deg)' }
                                    }
                                }} />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                {/* 系统运行时间和基本信息 */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <TimelineIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="subtitle2">运行时间</Typography>
                        </Box>
                        <Typography variant="h6" color="primary">
                            {formatUptime(data?.uptime)}
                        </Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <ThermostatIcon sx={{ mr: 1, color: 'warning.main' }} />
                            <Typography variant="subtitle2">CPU温度</Typography>
                        </Box>
                        <Typography variant="h6" color="warning.main">
                            {cpuInfo.temperature?.toFixed(1) || 0}°C
                        </Typography>
                    </Grid>
                </Grid>

                {/* 资源使用率 */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    {/* CPU使用率 */}
                    <Grid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <ComputerIcon sx={{ mr: 1, color: 'warning.main' }} />
                                <Typography variant="subtitle2">CPU</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Chip
                                    label={`${cpuInfo.usage?.toFixed(1) || 0}%`}
                                    color={getStatusColor(cpuInfo.usage || 0)}
                                    size="small"
                                />
                                {getTrendIcon(cpuInfo.usage, 50)}
                            </Box>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={cpuInfo.usage || 0}
                            color={getStatusColor(cpuInfo.usage || 0)}
                            sx={{ height: 8, borderRadius: 4, mb: 1 }}
                        />
                        <Typography variant="caption" color="textSecondary">
                            {cpuInfo.cores || 0} 核心 @ {cpuInfo.frequency?.toFixed(1) || 0} GHz
                        </Typography>
                    </Grid>

                    {/* 内存使用率 */}
                    <Grid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <MemoryIcon sx={{ mr: 1, color: 'info.main' }} />
                                <Typography variant="subtitle2">内存</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Chip
                                    label={`${memoryInfo.usagePercentage?.toFixed(1) || 0}%`}
                                    color={getStatusColor(memoryInfo.usagePercentage || 0)}
                                    size="small"
                                />
                                {getTrendIcon(memoryInfo.usagePercentage, 60)}
                            </Box>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={memoryInfo.usagePercentage || 0}
                            color={getStatusColor(memoryInfo.usagePercentage || 0)}
                            sx={{ height: 8, borderRadius: 4, mb: 1 }}
                        />
                        <Typography variant="caption" color="textSecondary">
                            {formatMemory(memoryInfo.used)} / {formatMemory(memoryInfo.total)}
                        </Typography>
                    </Grid>
                </Grid>

                {/* 存储和网络 */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    {/* 磁盘使用率 */}
                    <Grid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <StorageIcon sx={{ mr: 1, color: 'secondary.main' }} />
                                <Typography variant="subtitle2">磁盘</Typography>
                            </Box>
                            <Chip
                                label={`${diskInfo.usage?.toFixed(1) || 0}%`}
                                color={getStatusColor(diskInfo.usage || 0)}
                                size="small"
                            />
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={diskInfo.usage || 0}
                            color={getStatusColor(diskInfo.usage || 0)}
                            sx={{ height: 8, borderRadius: 4, mb: 1 }}
                        />
                        <Typography variant="caption" color="textSecondary">
                            {formatStorage(diskInfo.used)} / {formatStorage(diskInfo.total)}
                        </Typography>
                    </Grid>

                    {/* 网络延迟 */}
                    <Grid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <NetworkIcon sx={{ mr: 1, color: 'success.main' }} />
                                <Typography variant="subtitle2">网络</Typography>
                            </Box>
                            <Chip
                                label={`${networkInfo.latency?.toFixed(1) || 0}ms`}
                                color={networkInfo.latency < 50 ? 'success' : networkInfo.latency < 100 ? 'warning' : 'error'}
                                size="small"
                            />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                            <Typography variant="caption" color="textSecondary">
                                ↓ {networkInfo.downloadSpeed?.toFixed(1) || 0} Mbps
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                ↑ {networkInfo.uploadSpeed?.toFixed(1) || 0} Mbps
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                {/* 性能指标网格 */}
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <SpeedIcon sx={{ mr: 1, color: 'success.main' }} />
                        <Typography variant="subtitle2">性能指标</Typography>
                    </Box>

                    <Grid container spacing={2}>
                        <Grid item xs={4}>
                            <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'primary.light', borderRadius: 1 }}>
                                <Typography variant="h6" color="primary.contrastText">
                                    {performanceInfo.responseTime || 0}ms
                                </Typography>
                                <Typography variant="caption" color="primary.contrastText">
                                    响应时间
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={4}>
                            <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'success.light', borderRadius: 1 }}>
                                <Typography variant="h6" color="success.contrastText">
                                    {performanceInfo.throughput || 0}
                                </Typography>
                                <Typography variant="caption" color="success.contrastText">
                                    吞吐量/秒
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={4}>
                            <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'warning.light', borderRadius: 1 }}>
                                <Typography variant="h6" color="warning.contrastText">
                                    {performanceInfo.activeConnections || 0}
                                </Typography>
                                <Typography variant="caption" color="warning.contrastText">
                                    活跃连接
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>

                {/* 历史趋势图表 */}
                {chartData.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            资源使用趋势 (最近12小时)
                        </Typography>
                        <Box sx={{ height: 200, mt: 2 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ff7300" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#ff7300" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorMemory" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="time"
                                        tick={{ fontSize: 10 }}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 10 }}
                                        domain={[0, 100]}
                                    />
                                    <RechartsTooltip
                                        formatter={(value, name) => [`${value.toFixed(1)}%`, name === 'cpu' ? 'CPU' : name === 'memory' ? '内存' : '网络']}
                                        labelFormatter={(label) => `时间: ${label}`}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="cpu"
                                        stroke="#ff7300"
                                        fillOpacity={1}
                                        fill="url(#colorCpu)"
                                        strokeWidth={2}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="memory"
                                        stroke="#8884d8"
                                        fillOpacity={1}
                                        fill="url(#colorMemory)"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </Box>
                    </Box>
                )}

                {/* 系统信息 */}
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Grid container spacing={1}>
                        <Grid item xs={6}>
                            <Typography variant="caption" color="textSecondary" display="block">
                                系统: {systemInfo.platform || 'Unknown'} ({systemInfo.arch || 'Unknown'})
                            </Typography>
                            <Typography variant="caption" color="textSecondary" display="block">
                                主机: {systemInfo.hostname || 'Unknown'}
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="caption" color="textSecondary" display="block">
                                Node.js: {systemInfo.nodeVersion || 'Unknown'}
                            </Typography>
                            <Typography variant="caption" color="textSecondary" display="block">
                                缓存命中率: {performanceInfo.cacheHitRate?.toFixed(1) || 0}%
                            </Typography>
                        </Grid>
                    </Grid>
                </Box>
            </CardContent>
        </Card>
    );
};

export default SystemStatusPanel;
