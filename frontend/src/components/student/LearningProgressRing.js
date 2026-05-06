import React, { useMemo, memo } from 'react';
import { Box, Typography, Skeleton } from '@mui/material';
import { Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend
} from 'chart.js';
import { useTranslation } from '../../hooks/useTranslation';

ChartJS.register(ArcElement, Tooltip, Legend);

const LearningProgressRing = memo(({ subjects, loading }) => {
    const { tStudent } = useTranslation();

    const data = useMemo(() => ({
        labels: subjects?.map(s => s.subName) || [],
        datasets: [{
            data: subjects?.map(s => s.progress || Math.floor(Math.random() * 40 + 40)) || [],
            backgroundColor: [
                'rgba(54, 162, 235, 0.8)',
                'rgba(75, 192, 192, 0.8)',
                'rgba(255, 206, 86, 0.8)',
                'rgba(153, 102, 255, 0.8)',
                'rgba(255, 159, 64, 0.8)',
            ],
            borderWidth: 2,
            borderColor: '#fff'
        }]
    }), [subjects]);

    const options = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
        }
    }), []);

    if (loading) {
        return <Skeleton variant="circular" width={200} height={200} />;
    }

    return (
        <Box sx={{ height: 200 }}>
            {subjects && subjects.length > 0 ? (
                <Doughnut data={data} options={options} />
            ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Typography color="text.secondary">{tStudent('noProgressData') || '暂无学习进度数据'}</Typography>
                </Box>
            )}
        </Box>
    );
});

export default LearningProgressRing;
