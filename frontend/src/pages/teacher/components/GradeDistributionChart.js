import React from 'react';
import {
    Card, CardContent, Box, Typography, Skeleton
} from '@mui/material';
import { BarChart as ChartIcon } from '@mui/icons-material';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip as ChartTooltip,
    Legend,
    Filler
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useTranslation } from '../../../hooks/useTranslation';

ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement, BarElement,
    ArcElement, Title, ChartTooltip, Legend, Filler
);

/**
 * 学生成绩分布图组件
 */
const GradeDistributionChart = ({ data, loading }) => {
    const { tTeacher } = useTranslation();

    const chartData = {
        labels: [
            tTeacher('gradeExcellent'),
            tTeacher('gradeGood'),
            tTeacher('gradeAverage'),
            tTeacher('gradePass'),
            tTeacher('gradeFail')
        ],
        datasets: [{
            label: tTeacher('studentCount'),
            data: data || [8, 12, 10, 5, 2],
            backgroundColor: [
                'rgba(76, 175, 80, 0.8)',
                'rgba(33, 150, 243, 0.8)',
                'rgba(255, 193, 7, 0.8)',
                'rgba(255, 152, 0, 0.8)',
                'rgba(244, 67, 54, 0.8)'
            ],
            borderRadius: 4
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
    };

    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <ChartIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">{tTeacher('gradeDistribution') || '成绩分布'}</Typography>
                </Box>
                {loading ? (
                    <Skeleton variant="rectangular" height={200} />
                ) : (
                    <Box sx={{ height: { xs: 180, sm: 220 } }}>
                        <Bar data={chartData} options={options} />
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default GradeDistributionChart;