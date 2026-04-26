import React from 'react';
import {
    Card, CardContent, Box, Typography, Skeleton,
    useMediaQuery, useTheme
} from '@mui/material';
import {
    ShowChart as ShowChartIcon
} from '@mui/icons-material';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useTranslation } from '../../../hooks/useTranslation';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

/**
 * 出勤率趋势卡片组件
 * 显示最近7天的出勤率折线图
 */
const AttendanceTrendCard = ({ attendanceByDate, loading }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { tTeacher } = useTranslation();

    // 处理趋势数据
    const trendData = React.useMemo(() => {
        if (!attendanceByDate || Object.keys(attendanceByDate).length === 0) {
            return null;
        }

        // 按日期排序
        const sortedDates = Object.keys(attendanceByDate).sort();
        const labels = sortedDates.map(date => {
            const d = new Date(date);
            return `${d.getMonth() + 1}/${d.getDate()}`;
        });

        const rates = sortedDates.map(date => attendanceByDate[date].rate || 0);
        const presents = sortedDates.map(date => attendanceByDate[date].present || 0);
        const totals = sortedDates.map(date => attendanceByDate[date].total || 0);

        return {
            labels,
            datasets: [
                {
                    label: tTeacher('attendanceRate') || '出勤率',
                    data: rates,
                    borderColor: 'rgba(33, 150, 243, 1)',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: isMobile ? 3 : 5,
                    pointHoverRadius: isMobile ? 5 : 7,
                    yAxisID: 'y'
                },
                {
                    label: tTeacher('presentCount') || '出勤人数',
                    data: presents,
                    borderColor: 'rgba(76, 175, 80, 1)',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    fill: false,
                    tension: 0.4,
                    pointRadius: isMobile ? 3 : 5,
                    pointHoverRadius: isMobile ? 5 : 7,
                    yAxisID: 'y1'
                }
            ],
            totals
        };
    }, [attendanceByDate, isMobile, tTeacher]);

    // 计算趋势指标
    const trendIndicator = React.useMemo(() => {
        if (!trendData || trendData.labels.length < 2) return null;

        const rates = trendData.datasets[0].data;
        const firstRate = rates[0];
        const lastRate = rates[rates.length - 1];
        const diff = lastRate - firstRate;

        return {
            direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable',
            value: Math.abs(diff),
            isPositive: diff >= 0
        };
    }, [trendData]);

    // 图表选项
    const options = React.useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false
        },
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    boxWidth: 12,
                    padding: isMobile ? 10 : 20,
                    font: { size: isMobile ? 10 : 12 }
                }
            },
            tooltip: {
                callbacks: {
                    afterLabel: (context) => {
                        const idx = context.dataIndex;
                        const total = trendData?.totals?.[idx] || 0;
                        return `${tTeacher('totalAttendanceRecords') || '总考勤人次'}: ${total}`;
                    }
                }
            }
        },
        scales: {
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                min: 0,
                max: 100,
                title: {
                    display: true,
                    text: tTeacher('attendanceRatePercent') || '出勤率(%)',
                    font: { size: isMobile ? 10 : 12 }
                },
                grid: { color: 'rgba(0,0,0,0.05)' }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                min: 0,
                title: {
                    display: true,
                    text: tTeacher('present') || '人数',
                    font: { size: isMobile ? 10 : 12 }
                },
                grid: { drawOnChartArea: false }
            },
            x: {
                grid: { display: false }
            }
        }
    }), [isMobile, tTeacher, trendData]);

    return (
        <Card sx={{ height: '100%', minHeight: { xs: 300, sm: 350 } }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* 标题 */}
                <Box display="flex" alignItems="center" mb={2}>
                    <ShowChartIcon sx={{ mr: 1, color: 'primary.main', fontSize: { xs: 20, sm: 24 } }} />
                    <Typography variant="h6" component="h2" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                        {tTeacher('attendanceTrendCard') || '出勤率趋势'}
                    </Typography>
                    {trendIndicator && (
                        <Typography
                            variant="body2"
                            sx={{
                                ml: 'auto',
                                color: trendIndicator.isPositive ? 'success.main' : 'error.main',
                                fontWeight: 600,
                                fontSize: { xs: '0.75rem', sm: '0.875rem' }
                            }}
                        >
                            {trendIndicator.direction === 'up' ? '↑' : trendIndicator.direction === 'down' ? '↓' : '→'}
                            {trendIndicator.value}%
                            {trendIndicator.isPositive ? ` ${tTeacher('trendUp') || '上升'}` : ` ${tTeacher('trendDown') || '下降'}`}
                        </Typography>
                    )}
                </Box>

                {/* 图表内容 */}
                <Box sx={{ flex: 1, minHeight: { xs: 200, sm: 250 } }}>
                    {loading ? (
                        <Skeleton variant="rectangular" width="100%" height="100%" />
                    ) : trendData ? (
                        <Line data={trendData} options={options} />
                    ) : (
                        <Box
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            height="100%"
                            color="text.secondary"
                        >
                            <Typography variant="body2" color="text.secondary">
                                {tTeacher('noAttendanceData') || '暂无出勤数据'}
                            </Typography>
                        </Box>
                    )}
                </Box>

                {/* 底部说明 */}
                {!loading && trendData && (
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mt: 1, textAlign: 'center', fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                    >
                        {tTeacher('last7Days') || '近7天'}{tTeacher('attendanceTrendCard') || '出勤率趋势'} | {tTeacher('attendanceRatePercent') || '出勤率(%)'}
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
};

export default AttendanceTrendCard;
