import React, { useEffect, useState } from 'react';
import {
    Container, Grid, Paper, Card, CardContent, Box, Typography,
    LinearProgress, Chip, Avatar, List, ListItem, ListItemText, ListItemAvatar, ListItemIcon,
    Divider, Skeleton, Alert, Button, Badge
} from '@mui/material';
import {
    People as PeopleIcon,
    School as SchoolIcon,
    Assignment as AssignmentIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    EmojiEvents as TrophyIcon,
    CheckCircle as CheckIcon,
    AutoAwesome as AIIcon,
    CalendarToday as CalendarIcon,
    BarChart as ChartIcon,
    Notifications as NotificationIcon,
    Grade as GradeIcon,
    Speed as SpeedIcon,
    Timeline as TimelineIcon
} from '@mui/icons-material';
import SeeNotice from '../../components/SeeNotice';
import CountUp from 'react-countup';
import { useTranslation } from '../../hooks/useTranslation';
import Students from "../../assets/img1.png";
import Lessons from "../../assets/subjects.svg";
import Tests from "../../assets/assignment.svg";
import Time from "../../assets/time.svg";
import { getClassStudents, getSubjectDetails } from '../../redux/sclassRelated/sclassHandle';
import { useDispatch, useSelector } from 'react-redux';
import { safeGet } from '../../utils/safeAccess';
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

ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement, BarElement,
    ArcElement, Title, ChartTooltip, Legend, Filler
);

// 教学效率指标卡片
const TeachingEfficiencyCard = ({ data, loading }) => {
    const { tTeacher } = useTranslation();

    const metrics = data || {
        overallScore: 85,
        lessonCompletion: 92,
        studentEngagement: 78,
        averageScore: 82,
        improvement: 5
    };

    const getScoreColor = (score) => {
        if (score >= 85) return 'success';
        if (score >= 70) return 'warning';
        return 'error';
    };

    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <SpeedIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6">{tTeacher('teachingEfficiency') || '教学效率'}</Typography>
                    </Box>
                    <Chip
                        icon={metrics.improvement >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                        label={`${metrics.improvement >= 0 ? '+' : ''}${metrics.improvement}%`}
                        color={metrics.improvement >= 0 ? 'success' : 'error'}
                        size="small"
                    />
                </Box>

                {loading ? (
                    <Skeleton variant="circular" width={120} height={120} sx={{ mx: 'auto' }} />
                ) : (
                    <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <Typography variant="h2" color={`${getScoreColor(metrics.overallScore)}.main`} fontWeight="bold">
                            {metrics.overallScore}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">{tTeacher('overallScore')}</Typography>
                    </Box>
                )}

                <List dense>
                    <ListItem sx={{ px: 0 }}>
                        <ListItemText primary={tTeacher('lessonCompletionRate')} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                                variant="determinate"
                                value={metrics.lessonCompletion}
                                sx={{ width: 80, height: 6, borderRadius: 3 }}
                                color="primary"
                            />
                            <Typography variant="body2">{metrics.lessonCompletion}%</Typography>
                        </Box>
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                        <ListItemText primary={tTeacher('studentEngagement')} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                                variant="determinate"
                                value={metrics.studentEngagement}
                                sx={{ width: 80, height: 6, borderRadius: 3 }}
                                color="secondary"
                            />
                            <Typography variant="body2">{metrics.studentEngagement}%</Typography>
                        </Box>
                    </ListItem>
                </List>
            </CardContent>
        </Card>
    );
};

// 学生成绩分布图
const GradeDistributionChart = ({ data, loading }) => {
    const { tTeacher } = useTranslation();

    const chartData = {
        labels: [tTeacher('gradeExcellent'), tTeacher('gradeGood'), tTeacher('gradeAverage'), tTeacher('gradePass'), tTeacher('gradeFail')],
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
                    <Box sx={{ height: 220 }}>
                        <Bar data={chartData} options={options} />
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

// 本周教学任务时间线
const WeeklyTaskTimeline = ({ tasks, loading }) => {
    const { tTeacher } = useTranslation();

    const defaultTasks = [
        { id: 1, title: '批改第三章作业', deadline: '今天', type: 'grading', completed: false, urgent: true },
        { id: 2, title: '准备期中考试', deadline: '本周三', type: 'exam', completed: false, urgent: false },
        { id: 3, title: '学生家长会', deadline: '本周五', type: 'meeting', completed: false, urgent: false },
        { id: 4, title: '完成教学进度报告', deadline: '下周', type: 'report', completed: true, urgent: false }
    ];

    const items = tasks || defaultTasks;

    const getTypeIcon = (type) => {
        switch (type) {
            case 'grading': return <GradeIcon color="primary" />;
            case 'exam': return <AssignmentIcon color="error" />;
            case 'meeting': return <PeopleIcon color="info" />;
            default: return <SchoolIcon />;
        }
    };

    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TimelineIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6">{tTeacher('weeklyTasks') || '本周任务'}</Typography>
                    </Box>
                    <Badge badgeContent={items.filter(t => !t.completed).length} color="error">
                        <NotificationIcon color="action" />
                    </Badge>
                </Box>
                {loading ? (
                    <Box>{[1, 2, 3, 4].map(i => <Skeleton key={i} height={50} sx={{ mb: 1 }} />)}</Box>
                ) : (
                    <List dense>
                        {items.map((task, index) => (
                            <React.Fragment key={task.id}>
                                <ListItem sx={{ px: 0 }}
                                    secondaryAction={
                                        task.completed ? (
                                            <CheckIcon color="success" />
                                        ) : (
                                            <Chip label={task.deadline} size="small" color={task.urgent ? 'error' : 'default'} />
                                        )
                                    }
                                >
                                    <ListItemAvatar sx={{ minWidth: 36 }}>
                                        <Avatar sx={{ width: 28, height: 28, bgcolor: task.completed ? 'success.light' : 'grey.100' }}>
                                            {getTypeIcon(task.type)}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={task.title}
                                        primaryTypographyProps={{
                                            variant: 'body2',
                                            color: task.completed ? 'text.secondary' : 'text.primary',
                                            sx: { textDecoration: task.completed ? 'line-through' : 'none' }
                                        }}
                                    />
                                </ListItem>
                                {index < items.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                )}
            </CardContent>
        </Card>
    );
};

// AI 教学建议卡片
const AITeachingSuggestions = ({ suggestions, loading }) => {
    const { tTeacher } = useTranslation();

    const defaultSuggestions = [
        {
            id: 1,
            type: 'intervention',
            title: '学生张三成绩下滑',
            description: '最近三次测验成绩持续下降，建议安排一对一辅导',
            priority: 'high',
            action: '查看详情'
        },
        {
            id: 2,
            type: 'improvement',
            title: '教学进度建议',
            description: '当前进度落后计划2课时，建议加快教学节奏或调整计划',
            priority: 'medium',
            action: '调整计划'
        },
        {
            id: 3,
            type: 'resource',
            title: '优质资源推荐',
            description: '发现适合本章节的教学视频和练习题',
            priority: 'low',
            action: '查看资源'
        }
    ];

    const items = suggestions || defaultSuggestions;

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'error';
            case 'medium': return 'warning';
            default: return 'info';
        }
    };

    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AIIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">{tTeacher('aiSuggestions') || 'AI教学建议'}</Typography>
                </Box>
                {loading ? (
                    <Box>{[1, 2, 3].map(i => <Skeleton key={i} height={80} sx={{ mb: 1 }} />)}</Box>
                ) : (
                    <Box>
                        {items.map((suggestion, index) => (
                            <Box key={suggestion.id} sx={{ mb: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography variant="subtitle2">{suggestion.title}</Typography>
                                    <Chip label={suggestion.priority === 'high' ? tTeacher('priorityHigh') : suggestion.priority === 'medium' ? tTeacher('priorityMedium') : tTeacher('priorityLow')} size="small" color={getPriorityColor(suggestion.priority)} />
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    {suggestion.description}
                                </Typography>
                                <Button size="small" variant="text" color="primary">
                                    {suggestion.action}
                                </Button>
                            </Box>
                        ))}
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

// 班级整体进度追踪
const ClassProgressCard = ({ data, loading }) => {
    const { tTeacher } = useTranslation();

    const progress = data || {
        completedLessons: 12,
        totalLessons: 20,
        currentChapter: '第三章：函数与方程',
        nextExam: '期中考试',
        examDate: '2024-02-15'
    };

    const progressPercent = Math.round((progress.completedLessons / progress.totalLessons) * 100);

    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <SchoolIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">{tTeacher('classProgress') || '班级进度'}</Typography>
                </Box>

                {loading ? (
                    <Skeleton variant="rectangular" height={150} />
                ) : (
                    <Box>
                        <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2">{tTeacher('teachingProgress')}</Typography>
                                <Typography variant="body2" fontWeight="bold">{progressPercent}%</Typography>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={progressPercent}
                                sx={{ height: 10, borderRadius: 5 }}
                                color="primary"
                            />
                            <Typography variant="caption" color="text.secondary">
                                {tTeacher('lessonsCompleted', { completed: progress.completedLessons, total: progress.totalLessons })}
                            </Typography>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <List dense>
                            <ListItem sx={{ px: 0 }}>
                                <ListItemIcon sx={{ minWidth: 28 }}><SchoolIcon fontSize="small" /></ListItemIcon>
                                <ListItemText
                                    primary={tTeacher('currentChapter')}
                                    secondary={progress.currentChapter}
                                    primaryTypographyProps={{ variant: 'caption' }}
                                />
                            </ListItem>
                            <ListItem sx={{ px: 0 }}>
                                <ListItemIcon sx={{ minWidth: 28 }}><CalendarIcon fontSize="small" /></ListItemIcon>
                                <ListItemText
                                    primary={tTeacher('nextExam')}
                                    secondary={`${progress.nextExam} (${progress.examDate})`}
                                    primaryTypographyProps={{ variant: 'caption' }}
                                />
                            </ListItem>
                        </List>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

// 待批改作业提醒
const PendingGradingAlert = ({ count, loading }) => {
    const { tTeacher } = useTranslation();

    if (loading || count === 0) return null;

    return (
        <Alert
            severity="warning"
            icon={<GradeIcon />}
            action={
                <Button color="inherit" size="small">
                    {tTeacher('processNow')}
                </Button>
            }
            sx={{ mb: 3 }}
        >
            <Typography variant="body2">
                {tTeacher('pendingGradingAlert', { count })}
            </Typography>
        </Alert>
    );
};

const TeacherHomePage = () => {
    const dispatch = useDispatch();
    const { tTeacher, tClass } = useTranslation();

    const { currentUser } = useSelector((state) => state.user);
    const { subjectDetails, sclassStudents } = useSelector((state) => state.sclass);

    const [dashboardData, setDashboardData] = useState(null);
    const [dataLoading, setDataLoading] = useState(true);

    const classID = safeGet(currentUser, 'teachSclass._id');
    const subjectID = safeGet(currentUser, 'teachSubject._id');

    useEffect(() => {
        dispatch(getSubjectDetails(subjectID, "Subject"));
        dispatch(getClassStudents(classID));
        fetchDashboardData();
    }, [dispatch, subjectID, classID]);

    const fetchDashboardData = async () => {
        setDataLoading(true);
        try {
            // const data = await teacherAPI.getDashboard(teacherId);
            // setDashboardData(data);

            // 模拟数据
            setTimeout(() => {
                setDashboardData({
                    efficiency: { overallScore: 85, lessonCompletion: 92, studentEngagement: 78, averageScore: 82, improvement: 5 },
                    gradeDistribution: [8, 12, 10, 5, 2],
                    pendingGrading: 15,
                    weeklyTasks: null,
                    suggestions: null,
                    classProgress: null
                });
                setDataLoading(false);
            }, 500);
        } catch (err) {
            console.error('Dashboard data fetch error:', err);
            setDataLoading(false);
        }
    };

    const numberOfStudents = sclassStudents && sclassStudents.length;
    const numberOfSessions = subjectDetails && subjectDetails.sessions;

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
            label: tTeacher('completedTests'),
            value: 24,
            icon: Tests,
            alt: 'Tests',
            color: 'warning'
        },
        {
            label: tTeacher('totalHours'),
            value: 30,
            icon: Time,
            alt: 'Time',
            suffix: 'hrs',
            color: 'info'
        }
    ];

    return (
        <>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                {/* 欢迎横幅 */}
                <Paper
                    sx={{
                        p: 3,
                        mb: 3,
                        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
                        color: 'white'
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                            <Typography variant="h5" gutterBottom>
                                {tTeacher('welcomeBack') || '欢迎回来'}, {safeGet(currentUser, 'name', '老师')}!
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                {tTeacher('teachingSubject') || '任教科目'}: {safeGet(currentUser, 'teachSubject.subName', '未分配')} · {safeGet(currentUser, 'teachSclass.sclassName', '未分配班级')}
                            </Typography>
                        </Box>
                        <TrophyIcon sx={{ fontSize: 60, opacity: 0.8 }} />
                    </Box>
                </Paper>

                {/* 待批改作业提醒 */}
                <PendingGradingAlert count={dashboardData?.pendingGrading} loading={dataLoading} />

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
                                <Box component="img" src={stat.icon} alt={stat.alt} sx={{ width: 40, height: 40, mb: 1 }} />
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
                    {/* 左侧 */}
                    <Grid item xs={12} md={4}>
                        <Box sx={{ mb: 3 }}>
                            <TeachingEfficiencyCard data={dashboardData?.efficiency} loading={dataLoading} />
                        </Box>
                        <ClassProgressCard data={dashboardData?.classProgress} loading={dataLoading} />
                    </Grid>

                    {/* 中间 */}
                    <Grid item xs={12} md={4}>
                        <Box sx={{ mb: 3 }}>
                            <GradeDistributionChart data={dashboardData?.gradeDistribution} loading={dataLoading} />
                        </Box>
                        <WeeklyTaskTimeline tasks={dashboardData?.weeklyTasks} loading={dataLoading} />
                    </Grid>

                    {/* 右侧 */}
                    <Grid item xs={12} md={4}>
                        <Box sx={{ mb: 3 }}>
                            <AITeachingSuggestions suggestions={dashboardData?.suggestions} loading={dataLoading} />
                        </Box>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                    <NotificationIcon color="primary" sx={{ mr: 1 }} />
                                    {tTeacher('announcements') || '通知公告'}
                                </Typography>
                                <SeeNotice />
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        </>
    );
};

export default TeacherHomePage;
