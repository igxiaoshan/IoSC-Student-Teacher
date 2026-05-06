import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Chip,
    Alert,
    AlertTitle,
    Collapse,
    IconButton,
    Divider,
    LinearProgress,
    Stack,
    Tooltip
} from '@mui/material';
import {
    Warning as WarningIcon,
    Error as ErrorIcon,
    Info as InfoIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    TrendingDown as TrendingDownIcon,
    EventBusy as EventBusyIcon,
    School as SchoolIcon
} from '@mui/icons-material';
import { studentAPI } from '../../utils/apiClient';

const severityConfig = {
    critical: { color: 'error', icon: ErrorIcon, label: '严重', bgColor: '#ffebee' },
    high: { color: 'warning', icon: WarningIcon, label: '高危', bgColor: '#fff3e0' },
    medium: { color: 'info', icon: InfoIcon, label: '中等', bgColor: '#e3f2fd' },
    low: { color: 'default', icon: InfoIcon, label: '低', bgColor: '#f5f5f5' }
};

const alertTypeConfig = {
    consecutive_absence: { icon: EventBusyIcon, label: '连续缺勤' },
    subject_absence_rate: { icon: SchoolIcon, label: '科目缺勤' },
    overall_absence_rate: { icon: TrendingDownIcon, label: '总体出勤' }
};

const AttendanceAlertCard = ({ studentId, days = 30, showDetails = true }) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [expanded, setExpanded] = useState(true);
    const [error, setError] = useState(null);

    const fetchAlerts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await studentAPI.getAttendanceAlerts(studentId, { days });
            setData(response.data);
        } catch (err) {
            setError(err.message || '获取预警数据失败');
        } finally {
            setLoading(false);
        }
    }, [studentId, days]);

    useEffect(() => {
        if (!studentId) return;
        fetchAlerts();
    }, [studentId, days, fetchAlerts]);

    if (loading) {
        return (
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <Typography color="text.secondary">加载预警数据中...</Typography>
                    <LinearProgress sx={{ mt: 1 }} />
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mb: 2 }}>
                {error}
            </Alert>
        );
    }

    if (!data || data.alerts.length === 0) {
        return (
            <Card sx={{ mb: 2, bgcolor: '#e8f5e9' }}>
                <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="h6" color="success.main">
                            ✓ 出勤状态良好
                        </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                        近 {data?.period || days} 天内无出勤预警
                    </Typography>
                </CardContent>
            </Card>
        );
    }

    const { alerts, analysis } = data;

    const renderAlertItem = (alert, index) => {
        const config = severityConfig[alert.severity] || severityConfig.low;
        const typeConfig = alertTypeConfig[alert.type] || { icon: WarningIcon, label: '预警' };
        const IconComponent = config.icon;
        const TypeIcon = typeConfig.icon;

        return (
            <Box key={index} sx={{ mb: 1.5, p: 1.5, bgcolor: config.bgColor, borderRadius: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <TypeIcon fontSize="small" color={config.color} />
                    <Typography variant="body1" fontWeight="medium">
                        {alert.message}
                    </Typography>
                    <Chip
                        size="small"
                        label={config.label}
                        color={config.color}
                        sx={{ ml: 'auto' }}
                    />
                </Stack>
                {alert.details && showDetails && (
                    <Box sx={{ mt: 1, pl: 3 }}>
                        {alert.type === 'consecutive_absence' && (
                            <Typography variant="caption" color="text.secondary">
                                当前连续缺勤 {alert.details.currentStreak} 天
                                {alert.details.maxStreak > 0 && ` | 历史最长 ${alert.details.maxStreak} 天`}
                            </Typography>
                        )}
                        {alert.type === 'subject_absence_rate' && (
                            <Typography variant="caption" color="text.secondary">
                                出席 {alert.details.present} / 总计 {alert.details.total} 节课
                            </Typography>
                        )}
                        {alert.type === 'overall_absence_rate' && (
                            <Typography variant="caption" color="text.secondary">
                                出席 {alert.details.totalPresent} / 总计 {alert.details.totalRecords} 节课
                            </Typography>
                        )}
                    </Box>
                )}
            </Box>
        );
    };

    const renderSubjectSummary = () => {
        if (!analysis?.subjects || analysis.subjects.length === 0) return null;

        const highRisk = analysis.subjects.filter(s => s.absenceRate >= 40);

        if (highRisk.length === 0) return null;

        return (
            <Box sx={{ mt: 2 }}>
                <Divider sx={{ mb: 1 }} />
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    科目缺勤率
                </Typography>
                <Stack spacing={0.5}>
                    {highRisk.slice(0, 3).map((subject, idx) => (
                        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ minWidth: 80 }}>
                                {subject.subjectName}
                            </Typography>
                            <LinearProgress
                                variant="determinate"
                                value={subject.absenceRate}
                                color={subject.absenceRate >= 50 ? 'error' : 'warning'}
                                sx={{ flex: 1, height: 6, borderRadius: 1 }}
                            />
                            <Typography variant="caption" color="text.secondary">
                                {subject.absenceRate}%
                            </Typography>
                        </Box>
                    ))}
                </Stack>
            </Box>
        );
    };

    const hasCritical = alerts.some(a => a.severity === 'critical');
    const hasHigh = alerts.some(a => a.severity === 'high');

    return (
        <Card sx={{ mb: 2 }}>
            <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <WarningIcon color={hasCritical ? 'error' : hasHigh ? 'warning' : 'info'} />
                        <Typography variant="h6">
                            出勤预警
                        </Typography>
                        <Chip
                            size="small"
                            label={`${alerts.length} 条`}
                            color={hasCritical ? 'error' : hasHigh ? 'warning' : 'default'}
                        />
                    </Stack>
                    <Tooltip title={expanded ? '收起' : '展开'}>
                        <IconButton size="small" onClick={() => setExpanded(!expanded)}>
                            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                    </Tooltip>
                </Stack>

                <Collapse in={expanded}>
                    <Box sx={{ mt: 2 }}>
                        {alerts.map(renderAlertItem)}
                        {renderSubjectSummary()}
                    </Box>
                </Collapse>
            </CardContent>
        </Card>
    );
};

export default AttendanceAlertCard;
