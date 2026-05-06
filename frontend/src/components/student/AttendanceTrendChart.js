import React, { useMemo, memo, useState } from 'react';
import { Box, Skeleton, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { Line } from 'react-chartjs-2';
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
import { useTranslation } from '../../hooks/useTranslation';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const VIEW_TYPES = { WEEK: 'week', MONTH: 'month', SEMESTER: 'semester' };

const AttendanceTrendChart = memo(({ data, loading }) => {
    const { tStudent } = useTranslation();
    const [viewType, setViewType] = useState(VIEW_TYPES.WEEK);

    const handleViewChange = (_, newView) => {
        if (newView) setViewType(newView);
    };

    const weekLabels = useMemo(() => [
        tStudent('monday') || '周一',
        tStudent('tuesday') || '周二',
        tStudent('wednesday') || '周三',
        tStudent('thursday') || '周四',
        tStudent('friday') || '周五',
        tStudent('saturday') || '周六',
        tStudent('sunday') || '周日'
    ], [tStudent]);

    const monthLabels = useMemo(() => {
        const labels = [];
        const today = new Date();
        for (let i = 3; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i * 7);
            labels.push(`${d.getMonth() + 1}/${d.getDate()}`);
        }
        return labels;
    }, []);

    const semesterLabels = useMemo(() => ['9月', '10月', '11月', '12月', '1月', '2月'], []);

    const labels = useMemo(() => {
        switch (viewType) {
            case VIEW_TYPES.MONTH: return monthLabels;
            case VIEW_TYPES.SEMESTER: return semesterLabels;
            default: return weekLabels;
        }
    }, [viewType, weekLabels, monthLabels, semesterLabels]);

    const chartData = useMemo(() => {
        const defaultData = {
            [VIEW_TYPES.WEEK]: [95, 88, 92, 100, 85, 90, 96],
            [VIEW_TYPES.MONTH]: [92, 88, 95, 91],
            [VIEW_TYPES.SEMESTER]: [95, 92, 88, 90, 93, 91]
        };
        return {
            labels,
            datasets: [{
                label: tStudent('attendanceRate') || '出勤率(%)',
                data: data?.[viewType] || defaultData[viewType],
                fill: true,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        };
    }, [labels, data, viewType, tStudent]);

    const options = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}%`
                }
            }
        },
        scales: {
            y: {
                beginAtZero: false,
                min: 60,
                max: 100,
                title: { display: true, text: '%' }
            }
        }
    }), []);

    return (
        <Box sx={{ height: 200 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                    {tStudent('attendanceTrend') || '出勤趋势'}
                </Typography>
                <ToggleButtonGroup value={viewType} exclusive onChange={handleViewChange} size="small">
                    <ToggleButton value={VIEW_TYPES.WEEK}>{tStudent('week') || '周'}</ToggleButton>
                    <ToggleButton value={VIEW_TYPES.MONTH}>{tStudent('month') || '月'}</ToggleButton>
                    <ToggleButton value={VIEW_TYPES.SEMESTER}>{tStudent('semester') || '学期'}</ToggleButton>
                </ToggleButtonGroup>
            </Box>
            {loading ? <Skeleton variant="rectangular" height={160} /> : <Line data={chartData} options={options} />}
        </Box>
    );
});

export default AttendanceTrendChart;
