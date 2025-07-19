import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    LinearProgress,
    Chip,
    Grid,
    Divider
} from '@mui/material';
import {
    Memory as MemoryIcon,
    Speed as SpeedIcon,
    Computer as ComputerIcon,
    Timeline as TimelineIcon
} from '@mui/icons-material';

const SystemStatusPanel = ({ data, loading = false }) => {
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

    // 获取状态颜色
    const getStatusColor = (percentage) => {
        if (percentage < 60) return 'success';
        if (percentage < 80) return 'warning';
        return 'error';
    };

    const systemInfo = data?.system || {};
    const memoryInfo = data?.memory || {};
    const cpuInfo = data?.cpu || {};
    const performanceInfo = data?.performance || {};

    return (
        <Card elevation={2}>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    系统状态监控
                </Typography>
                
                {/* 系统运行时间 */}
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <TimelineIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="subtitle2">
                            系统运行时间
                        </Typography>
                    </Box>
                    <Typography variant="h6" color="primary">
                        {formatUptime(data?.uptime)}
                    </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* 内存使用情况 */}
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <MemoryIcon sx={{ mr: 1, color: 'info.main' }} />
                            <Typography variant="subtitle2">
                                内存使用率
                            </Typography>
                        </Box>
                        <Chip
                            label={`${memoryInfo.usagePercentage?.toFixed(1) || 0}%`}
                            color={getStatusColor(memoryInfo.usagePercentage || 0)}
                            size="small"
                        />
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
                </Box>

                {/* CPU使用情况 */}
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <ComputerIcon sx={{ mr: 1, color: 'warning.main' }} />
                            <Typography variant="subtitle2">
                                CPU使用率
                            </Typography>
                        </Box>
                        <Chip
                            label={`${cpuInfo.usage?.toFixed(1) || 0}%`}
                            color={getStatusColor(cpuInfo.usage || 0)}
                            size="small"
                        />
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={cpuInfo.usage || 0}
                        color={getStatusColor(cpuInfo.usage || 0)}
                        sx={{ height: 8, borderRadius: 4, mb: 1 }}
                    />
                    <Typography variant="caption" color="textSecondary">
                        {cpuInfo.cores || 0} 核心处理器
                    </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* 性能指标 */}
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <SpeedIcon sx={{ mr: 1, color: 'success.main' }} />
                        <Typography variant="subtitle2">
                            性能指标
                        </Typography>
                    </Box>
                    
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h6" color="primary">
                                    {performanceInfo.responseTime}ms
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                    响应时间
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={6}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h6" color="success.main">
                                    {performanceInfo.errorRate}%
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                    错误率
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>

                {/* 系统信息 */}
                <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="caption" color="textSecondary" display="block">
                        系统: {systemInfo.platform || 'windows'} ({systemInfo.arch || 'windows'})
                    </Typography>
                    <Typography variant="caption" color="textSecondary" display="block">
                        Node.js: {systemInfo.nodeVersion || '16.18.1'}
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
};

export default SystemStatusPanel;
