import React from 'react';
import {
    Box,
    FormControl,
    Select,
    MenuItem,
    InputLabel,
    Chip,
    Button,
    Grid,
    Paper,
    Typography,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    Download as DownloadIcon,
    FilterList as FilterIcon,
    DateRange as DateRangeIcon
} from '@mui/icons-material';

const DashboardFilters = ({ 
    timeRange, 
    onTimeRangeChange, 
    onRefresh, 
    onExport,
    loading = false,
    lastUpdated 
}) => {
    const timeRanges = [
        { value: 'day', label: '今日', description: '显示今日数据' },
        { value: 'week', label: '本周', description: '显示本周数据' },
        { value: 'month', label: '本月', description: '显示本月数据' },
        { value: 'quarter', label: '本季度', description: '显示本季度数据' },
        { value: 'year', label: '本年', description: '显示本年数据' },
        { value: 'custom', label: '自定义', description: '自定义时间范围' }
    ];

    // 格式化最后更新时间
    const formatLastUpdated = (date) => {
        if (!date) return '未知';
        
        const now = new Date();
        const updated = new Date(date);
        const diffMs = now - updated;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        
        if (diffMins < 1) return '刚刚';
        if (diffMins < 60) return `${diffMins}分钟前`;
        if (diffHours < 24) return `${diffHours}小时前`;
        return updated.toLocaleDateString();
    };

    // 获取当前时间范围的描述
    const getCurrentRangeDescription = () => {
        const range = timeRanges.find(r => r.value === timeRange);
        return range ? range.description : '显示数据';
    };

    return (
        <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
                {/* 标题和描述 */}
                <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1, md: 0 } }}>
                        <FilterIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Box>
                            <Typography variant="h6" component="div">
                                数据筛选
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                {getCurrentRangeDescription()}
                            </Typography>
                        </Box>
                    </Box>
                </Grid>

                {/* 时间范围选择器 */}
                <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                        <InputLabel>时间范围</InputLabel>
                        <Select
                            value={timeRange}
                            label="时间范围"
                            onChange={(e) => onTimeRangeChange(e.target.value)}
                            startAdornment={<DateRangeIcon sx={{ mr: 1, color: 'action.active' }} />}
                        >
                            {timeRanges.map((range) => (
                                <MenuItem key={range.value} value={range.value}>
                                    <Box>
                                        <Typography variant="body2">
                                            {range.label}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            {range.description}
                                        </Typography>
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                {/* 操作按钮 */}
                <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="刷新数据">
                            <IconButton
                                onClick={onRefresh}
                                disabled={loading}
                                color="primary"
                                size="small"
                            >
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="导出数据">
                            <IconButton
                                onClick={onExport}
                                disabled={loading}
                                color="secondary"
                                size="small"
                            >
                                <DownloadIcon />
                            </IconButton>
                        </Tooltip>
                        
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={onRefresh}
                            disabled={loading}
                            startIcon={<RefreshIcon />}
                        >
                            {loading ? '刷新中...' : '刷新'}
                        </Button>
                    </Box>
                </Grid>

                {/* 状态信息 */}
                <Grid item xs={12} md={2}>
                    <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                        <Typography variant="caption" color="textSecondary" display="block">
                            最后更新
                        </Typography>
                        <Chip
                            label={formatLastUpdated(lastUpdated)}
                            size="small"
                            color={loading ? 'default' : 'success'}
                            variant="outlined"
                        />
                    </Box>
                </Grid>
            </Grid>

            {/* 快捷时间范围按钮 */}
            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="caption" color="textSecondary" sx={{ mr: 1, alignSelf: 'center' }}>
                    快捷选择:
                </Typography>
                {timeRanges.slice(0, 5).map((range) => (
                    <Chip
                        key={range.value}
                        label={range.label}
                        size="small"
                        clickable
                        color={timeRange === range.value ? 'primary' : 'default'}
                        variant={timeRange === range.value ? 'filled' : 'outlined'}
                        onClick={() => onTimeRangeChange(range.value)}
                    />
                ))}
            </Box>

            {/* 数据状态指示器 */}
            {loading && (
                <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="primary">
                        正在加载数据...
                    </Typography>
                </Box>
            )}
        </Paper>
    );
};

export default DashboardFilters;
