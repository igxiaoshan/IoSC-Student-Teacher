import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Grid,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Chip,
    LinearProgress
} from '@mui/material';
import {
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    Remove as RemoveIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
    Error as ErrorIcon,
    Info as InfoIcon
} from '@mui/icons-material';

const DataSummaryPanel = ({ data, loading = false }) => {
    // 计算总体健康分数
    const calculateHealthScore = () => {
        if (!data) return 0;
        
        let score = 100;
        
        // 系统性能影响 (30%)
        if (data.system?.memory?.usagePercentage > 80) score -= 15;
        else if (data.system?.memory?.usagePercentage > 60) score -= 5;
        
        if (data.system?.cpu?.usage > 80) score -= 15;
        else if (data.system?.cpu?.usage > 60) score -= 5;
        
        // 用户活跃度影响 (25%)
        if (data.userBehavior?.userActivityRate < 50) score -= 15;
        else if (data.userBehavior?.userActivityRate < 70) score -= 8;
        
        // 业务指标影响 (25%)
        if (data.business?.examPassRate < 60) score -= 12;
        else if (data.business?.examPassRate < 80) score -= 6;
        
        // 增长趋势影响 (20%)
        if (data.growth?.totalGrowthRate < 0) score -= 10;
        else if (data.growth?.totalGrowthRate < 5) score -= 5;
        
        return Math.max(0, Math.min(100, score));
    };

    // 获取健康状态
    const getHealthStatus = (score) => {
        if (score >= 90) return { label: '优秀', color: 'success', icon: <CheckCircleIcon /> };
        if (score >= 75) return { label: '良好', color: 'info', icon: <InfoIcon /> };
        if (score >= 60) return { label: '一般', color: 'warning', icon: <WarningIcon /> };
        return { label: '需要关注', color: 'error', icon: <ErrorIcon /> };
    };

    // 获取趋势图标
    const getTrendIcon = (value, threshold = 0) => {
        if (value > threshold) return <TrendingUpIcon color="success" />;
        if (value < threshold) return <TrendingDownIcon color="error" />;
        return <RemoveIcon color="disabled" />;
    };

    // 生成关键洞察
    const generateInsights = () => {
        if (!data) return [];
        
        const insights = [];
        
        // 用户活跃度洞察
        if (data.userBehavior?.userActivityRate < 60) {
            insights.push({
                type: 'warning',
                title: '用户活跃度偏低',
                description: `当前用户活跃率为 ${data.userBehavior.userActivityRate.toFixed(1)}%，建议采取措施提升用户参与度`,
                priority: 'high'
            });
        }
        
        // 系统性能洞察
        if (data.system?.memory?.usagePercentage > 80) {
            insights.push({
                type: 'error',
                title: '内存使用率过高',
                description: `当前内存使用率为 ${data.system.memory.usagePercentage.toFixed(1)}%，建议优化系统资源`,
                priority: 'high'
            });
        }
        
        // 业务指标洞察
        if (data.business?.examPassRate > 85) {
            insights.push({
                type: 'success',
                title: '考试通过率优秀',
                description: `当前考试通过率为 ${data.business.examPassRate.toFixed(1)}%，教学效果显著`,
                priority: 'low'
            });
        }
        
        // 增长趋势洞察
        if (data.growth?.totalGrowthRate > 10) {
            insights.push({
                type: 'success',
                title: '用户增长强劲',
                description: `总增长率达到 ${data.growth.totalGrowthRate.toFixed(1)}%，发展势头良好`,
                priority: 'medium'
            });
        }
        
        return insights.slice(0, 5); // 最多显示5条洞察
    };

    const healthScore = calculateHealthScore();
    const healthStatus = getHealthStatus(healthScore);
    const insights = generateInsights();

    return (
        <Card elevation={2}>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    数据摘要与洞察
                </Typography>

                {/* 总体健康分数 */}
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle1">
                            系统健康分数
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {healthStatus.icon}
                            <Chip
                                label={healthStatus.label}
                                color={healthStatus.color}
                                size="small"
                                sx={{ ml: 1 }}
                            />
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h3" color={`${healthStatus.color}.main`} sx={{ mr: 1 }}>
                            {healthScore}
                        </Typography>
                        <Typography variant="h6" color="textSecondary">
                            / 100
                        </Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={healthScore}
                        color={healthStatus.color}
                        sx={{ height: 8, borderRadius: 4 }}
                    />
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* 关键指标概览 */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        关键指标概览
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h5" color="primary">
                                    {data?.userBehavior?.totalUsers || 0}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                    总用户数
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
                                    {getTrendIcon(data?.growth?.totalGrowthRate || 0)}
                                </Box>
                            </Box>
                        </Grid>
                        <Grid item xs={6}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h5" color="success.main">
                                    {data?.userBehavior?.userActivityRate?.toFixed(1) || 0}%
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                    用户活跃率
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
                                    {getTrendIcon(data?.userBehavior?.userActivityRate || 0, 70)}
                                </Box>
                            </Box>
                        </Grid>
                        <Grid item xs={6}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h5" color="info.main">
                                    {data?.business?.examPassRate?.toFixed(1) || 0}%
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                    考试通过率
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
                                    {getTrendIcon(data?.business?.examPassRate || 0, 80)}
                                </Box>
                            </Box>
                        </Grid>
                        <Grid item xs={6}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h5" color="warning.main">
                                    {data?.system?.memory?.usagePercentage?.toFixed(1) || 0}%
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                    内存使用率
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
                                    {getTrendIcon(80 - (data?.system?.memory?.usagePercentage || 0))}
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* 关键洞察 */}
                <Box>
                    <Typography variant="subtitle1" gutterBottom>
                        关键洞察
                    </Typography>
                    {insights.length > 0 ? (
                        <List dense>
                            {insights.map((insight, index) => (
                                <ListItem key={index} sx={{ px: 0 }}>
                                    <ListItemIcon>
                                        {insight.type === 'success' && <CheckCircleIcon color="success" />}
                                        {insight.type === 'warning' && <WarningIcon color="warning" />}
                                        {insight.type === 'error' && <ErrorIcon color="error" />}
                                        {insight.type === 'info' && <InfoIcon color="info" />}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={insight.title}
                                        secondary={insight.description}
                                        primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
                                        secondaryTypographyProps={{ variant: 'caption' }}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                            暂无特别洞察
                        </Typography>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
};

export default DataSummaryPanel;
