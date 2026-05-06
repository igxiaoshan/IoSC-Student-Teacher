import React, { useMemo, memo } from 'react';
import { Box, Skeleton } from '@mui/material';
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

const WeeklyStudyChart = memo(({ data, loading }) => {
    const { tStudent } = useTranslation();

    const days = useMemo(() => [
        tStudent('monday') || '周一',
        tStudent('tuesday') || '周二',
        tStudent('wednesday') || '周三',
        tStudent('thursday') || '周四',
        tStudent('friday') || '周五',
        tStudent('saturday') || '周六',
        tStudent('sunday') || '周日'
    ], [tStudent]);

    const chartData = useMemo(() => ({
        labels: days,
        datasets: [{
            label: tStudent('studyMinutes') || '学习时长(分钟)',
            data: data || [45, 60, 30, 90, 75, 120, 60],
            fill: true,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            tension: 0.4
        }]
    }), [days, data, tStudent]);

    const options = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            y: { beginAtZero: true, title: { display: true, text: tStudent('minutes') || '分钟' } }
        }
    }), [tStudent]);

    return (
        <Box sx={{ height: 150 }}>
            {loading ? <Skeleton variant="rectangular" height={150} /> : <Line data={chartData} options={options} />}
        </Box>
    );
});

export default WeeklyStudyChart;
