import React from 'react';
import { Grid } from '@mui/material';
import TeacherStatsCard from '../../../components/teacher/TeacherStatsCard';
import { useTranslation } from '../../../hooks/useTranslation';
import Students from "../../../assets/img1.png";
import Lessons from "../../../assets/subjects.svg";
import Attendance from "../../../assets/assignment.svg";
import Score from "../../../assets/time.svg";

/**
 * 教师端首页统计卡片组组件
 */
const StatCards = ({
    numberOfStudents,
    numberOfSessions,
    attendanceRate = 0,
    averageScore = '-',
    loading = false
}) => {
    const { tClass, tTeacher } = useTranslation();

    const statCards = [
        {
            label: tClass('classStudents'),
            value: numberOfStudents,
            icon: Students,
            alt: 'Students',
            color: 'primary'
        },
        {
            label: tTeacher('totalLessons'),
            value: numberOfSessions,
            icon: Lessons,
            alt: 'Lessons',
            color: 'success'
        },
        {
            label: tTeacher('attendanceRate') || '出勤率',
            value: attendanceRate,
            icon: Attendance,
            alt: 'Attendance',
            color: 'warning',
            suffix: '%'
        },
        {
            label: tTeacher('averageScore') || '平均分',
            value: averageScore,
            icon: Score,
            alt: 'Score',
            color: 'info'
        }
    ];

    return (
        <Grid container spacing={3} sx={{ mb: 3 }}>
            {statCards.map((stat, index) => (
                <Grid item xs={6} sm={6} md={3} key={index}>
                    <TeacherStatsCard
                        label={stat.label}
                        value={stat.value}
                        icon={stat.icon}
                        alt={stat.alt}
                        color={stat.color}
                        suffix={stat.suffix}
                        loading={loading}
                    />
                </Grid>
            ))}
        </Grid>
    );
};

export default StatCards;