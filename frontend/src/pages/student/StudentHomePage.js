import React, { useEffect, useState, useCallback, useMemo, memo } from 'react'
import {
    Container, Grid, Paper, Typography, Card, CardContent, Box, Skeleton
} from '@mui/material'
import {
    School as SchoolIcon,
    AccessTime as TimeIcon,
    TrendingUp as TrendingUpIcon,
    EmojiEvents as TrophyIcon,
    CalendarToday as CalendarIcon
} from '@mui/icons-material'
import { useDispatch, useSelector } from 'react-redux';
import { calculateOverallAttendancePercentage } from '../../components/attendanceCalculator';
import CustomPieChart from '../../components/CustomPieChart';
import { getUserDetails } from '../../redux/userRelated/userHandle';
import SeeNotice from '../../components/SeeNotice';
import CountUp from 'react-countup';
import Subject from "../../assets/subjects.svg";
import Assignment from "../../assets/assignment.svg";
import { getSubjectList } from '../../redux/sclassRelated/sclassHandle';
import { safeGet } from '../../utils/safeAccess';
import { useTranslation } from '../../hooks/useTranslation';
import { studentAPI } from '../../utils/apiClient';
import {
    LearningProgressRing,
    WeeklyStudyChart,
    AISuggestionCard,
    TodoTasksCard,
    LearningGoalsCard,
    RecentActivityTimeline,
    LearningPathCard
} from '../../components/student';

const StudentHomePage = memo(() => {
    const dispatch = useDispatch();
    const { tStudent, tSubject, tDashboard } = useTranslation();

    const { userDetails, currentUser, loading, response } = useSelector((state) => state.user);
    const { subjectsList } = useSelector((state) => state.sclass);

    const [subjectAttendance, setSubjectAttendance] = useState([]);
    const [studyStats, setStudyStats] = useState(null);
    const [dashboardData, setDashboardData] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [learningPath, setLearningPath] = useState(null);
    const [pathLoading, setPathLoading] = useState(true);

    const classID = safeGet(currentUser, 'sclassName._id');
    const studentId = safeGet(currentUser, '_id');

    const fetchDashboardData = useCallback(async () => {
        if (!studentId) return;
        setStatsLoading(true);
        try {
            const res = await studentAPI.getDashboard(studentId);
            setDashboardData(res);
            setStudyStats(res?.studyStats || null);
        } catch (err) {
            console.log('Dashboard data fetch error:', err);
        } finally {
            setStatsLoading(false);
        }
    }, [studentId]);

    const fetchLearningPath = useCallback(async () => {
        if (!studentId) return;
        setPathLoading(true);
        try {
            const res = await studentAPI.getLearningPath(studentId);
            setLearningPath(res?.learningPath || null);
        } catch (err) {
            console.log('Learning path fetch error:', err);
        } finally {
            setPathLoading(false);
        }
    }, [studentId]);

    const handleCreateLearningPath = useCallback(async () => {
        if (!studentId) return;
        try {
            const res = await studentAPI.createLearningPath(studentId, { autoGenerate: true });
            setLearningPath(res?.learningPath || null);
        } catch (err) {
            console.log('Create learning path error:', err);
        }
    }, [studentId]);

    const handlePhaseClick = useCallback(async (phaseIndex) => {
        if (!studentId || !learningPath) return;
        try {
            await studentAPI.updatePhaseProgress(studentId, phaseIndex, { viewed: true });
        } catch (err) {
            console.log('Update phase progress error:', err);
        }
    }, [studentId, learningPath]);

    useEffect(() => {
        if (studentId) {
            dispatch(getUserDetails(studentId, "Student"));
            fetchDashboardData();
            fetchLearningPath();
        }
        if (classID) {
            dispatch(getSubjectList(classID, "ClassSubjects"));
        }
    }, [dispatch, studentId, classID, fetchDashboardData, fetchLearningPath]);

    const numberOfSubjects = subjectsList && subjectsList.length;

    useEffect(() => {
        if (userDetails) {
            setSubjectAttendance(userDetails.attendance || []);
        }
    }, [userDetails])

    const overallAttendancePercentage = calculateOverallAttendancePercentage(subjectAttendance);
    const overallAbsentPercentage = 100 - overallAttendancePercentage;

    const chartData = useMemo(() => [
        { name: tStudent('present') || 'Present', value: overallAttendancePercentage },
        { name: tStudent('absent') || 'Absent', value: overallAbsentPercentage }
    ], [tStudent, overallAttendancePercentage, overallAbsentPercentage]);

    const statCards = useMemo(() => [
        {
            label: tSubject('totalSubjects'),
            value: numberOfSubjects,
            icon: Subject,
            alt: 'Subjects',
            color: 'primary'
        },
        {
            label: tStudent('totalAssignments'),
            value: studyStats?.totalAssignments || 15,
            icon: Assignment,
            alt: 'Assignments',
            color: 'success'
        },
        {
            label: tStudent('weeklyStudyHours') || '本周学习',
            value: studyStats?.weeklyHours || 8.5,
            icon: null,
            suffix: tStudent('hours') || '小时',
            color: 'info',
            customIcon: <TimeIcon />
        },
        {
            label: tStudent('avgScore') || '平均成绩',
            value: studyStats?.avgScore || 85,
            icon: null,
            suffix: tStudent('points') || '分',
            color: 'warning',
            customIcon: <TrendingUpIcon />
        }
    ], [tSubject, tStudent, numberOfSubjects, studyStats]);

    return (
        <>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                {/* 欢迎横幅 */}
                <Paper
                    sx={{
                        p: 3,
                        mb: 3,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white'
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                            <Typography variant="h5" gutterBottom>
                                {tStudent('welcomeBack') || '欢迎回来'}, {safeGet(currentUser, 'name', '同学')}!
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                {tStudent('keepLearning') || '继续加油，今天也要进步一点点！'}
                            </Typography>
                        </Box>
                        <TrophyIcon sx={{ fontSize: 60, opacity: 0.8 }} />
                    </Box>
                </Paper>

                {/* 统计卡片行 */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    {statCards.map((stat, index) => (
                        <Grid item xs={12} sm={6} md={3} key={index}>
                            <Card sx={{
                                height: 140,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                p: 2,
                                transition: 'transform 0.2s',
                                '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 }
                            }}>
                                {stat.customIcon ? (
                                    <Box sx={{ color: `${stat.color}.main`, mb: 1 }}>{stat.customIcon}</Box>
                                ) : (
                                    <Box component="img" src={stat.icon} alt={stat.alt} sx={{ width: 40, height: 40, mb: 1 }} />
                                )}
                                <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
                                <CountUp
                                    start={0}
                                    end={stat.value}
                                    duration={2}
                                    suffix={stat.suffix || ''}
                                    style={{ fontSize: '1.5rem', color: `${stat.color}.main`, fontWeight: 'bold' }}
                                />
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {/* 主要内容区 */}
                <Grid container spacing={3}>
                    {/* 左侧 - 学习进度和考勤 */}
                    <Grid item xs={12} md={4}>
                        <Card sx={{ height: 300, mb: 3 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                    <SchoolIcon color="primary" sx={{ mr: 1 }} />
                                    {tStudent('subjectProgress') || '科目学习进度'}
                                </Typography>
                                <LearningProgressRing subjects={subjectsList} loading={loading} />
                            </CardContent>
                        </Card>

                        <Card sx={{ height: 240 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>{tStudent('attendance') || '出勤统计'}</Typography>
                                {response ? (
                                    <Typography variant="body2" color="text.secondary">{tStudent('noAttendanceRecord')}</Typography>
                                ) : loading ? (
                                    <Skeleton variant="circular" width={150} height={150} />
                                ) : (
                                    subjectAttendance && Array.isArray(subjectAttendance) && subjectAttendance.length > 0 ? (
                                        <CustomPieChart data={chartData} />
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">{tStudent('noAttendanceData') || '暂无出勤数据'}</Typography>
                                    )
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* 中间 - 本周学习和待办任务 */}
                    <Grid item xs={12} md={4}>
                        <Card sx={{ height: 270, mb: 3 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                    <TimeIcon color="info" sx={{ mr: 1 }} />
                                    {tStudent('weeklyStudyTime') || '本周学习时长'}
                                </Typography>
                                <WeeklyStudyChart data={studyStats?.weeklyData} loading={statsLoading} />
                                <Box sx={{ mt: 1, textAlign: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        {tStudent('total') || '累计'} <Typography component="span" color="primary" fontWeight="bold">
                                            {studyStats?.totalMinutes || 480}
                                        </Typography> {tStudent('minutes') || '分钟'}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>

                        <TodoTasksCard tasks={dashboardData?.pendingTasks} loading={statsLoading} />
                    </Grid>

                    {/* 右侧 - AI建议和学习目标 */}
                    <Grid item xs={12} md={4}>
                        <Box sx={{ mb: 3 }}>
                            <AISuggestionCard suggestions={dashboardData?.aiSuggestions} loading={statsLoading} />
                        </Box>
                        <LearningGoalsCard goals={dashboardData?.learningGoals} loading={statsLoading} />
                    </Grid>
                </Grid>

                {/* 最近学习活动和通知 */}
                <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid item xs={12} md={6}>
                        <LearningPathCard
                            learningPath={learningPath}
                            loading={pathLoading}
                            onCreatePath={handleCreateLearningPath}
                            onPhaseClick={handlePhaseClick}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <RecentActivityTimeline activities={dashboardData?.recentActivities} loading={statsLoading} />
                    </Grid>
                </Grid>

                {/* 通知公告 */}
                <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                <CalendarIcon color="primary" sx={{ mr: 1 }} />
                                {tStudent('announcements') || '通知公告'}
                            </Typography>
                            <SeeNotice />
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </>
    )
});

export default StudentHomePage;
