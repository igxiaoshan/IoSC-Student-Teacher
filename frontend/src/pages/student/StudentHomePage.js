import React, { useEffect, useState } from 'react'
import {
    Container, Grid, Paper, Typography, Card, CardContent, Box, CardActions,
    LinearProgress, Chip, Avatar, List, ListItem, ListItemText, ListItemAvatar,
    Divider, IconButton, Tooltip, Skeleton, Alert
} from '@mui/material'
import {
    School as SchoolIcon,
    Assignment as AssignmentIcon,
    AccessTime as TimeIcon,
    TrendingUp as TrendingUpIcon,
    EmojiEvents as TrophyIcon,
    Lightbulb as LightbulbIcon,
    CalendarToday as CalendarIcon,
    CheckCircle as CheckIcon,
    Warning as WarningIcon,
    PlayArrow as PlayIcon,
    AutoAwesome as AIIcon
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
import { Line, Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement, BarElement,
    ArcElement, Title, ChartTooltip, Legend, Filler
);

// 学习进度环形图组件
const LearningProgressRing = ({ subjects, loading }) => {
    const { tStudent } = useTranslation();

    if (loading) {
        return <Skeleton variant="circular" width={200} height={200} />;
    }

    const data = {
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
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
        }
    };

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
};

// 本周学习时长图表
const WeeklyStudyChart = ({ data, loading }) => {
    const { tStudent } = useTranslation();
    const days = [tStudent('monday') || '周一', tStudent('tuesday') || '周二', tStudent('wednesday') || '周三', tStudent('thursday') || '周四', tStudent('friday') || '周五', tStudent('saturday') || '周六', tStudent('sunday') || '周日'];

    const chartData = {
        labels: days,
        datasets: [{
            label: tStudent('studyMinutes') || '学习时长(分钟)',
            data: data || [45, 60, 30, 90, 75, 120, 60],
            fill: true,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            tension: 0.4
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            y: { beginAtZero: true, title: { display: true, text: tStudent('minutes') || '分钟' } }
        }
    };

    return (
        <Box sx={{ height: 150 }}>
            {loading ? <Skeleton variant="rectangular" height={150} /> : <Line data={chartData} options={options} />}
        </Box>
    );
};

// AI 学习建议卡片
const AISuggestionCard = ({ suggestions, loading }) => {
    const { tStudent } = useTranslation();

    const defaultSuggestions = [
        { type: 'tip', content: tStudent('tipDailyReview') || '建议每天固定时间复习数学，效果更佳', icon: <LightbulbIcon color="warning" /> },
        { type: 'warning', content: tStudent('tipVocabulary') || '英语词汇掌握率较低，建议增加练习', icon: <WarningIcon color="error" /> },
        { type: 'achievement', content: tStudent('tipStudyHours') || '本周学习时长超过80%的同学，继续保持！', icon: <TrophyIcon color="success" /> }
    ];

    const items = suggestions || defaultSuggestions;

    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AIIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">{tStudent('aiSuggestions') || 'AI学习建议'}</Typography>
                </Box>
                {loading ? (
                    <Box>
                        {[1, 2, 3].map(i => <Skeleton key={i} height={40} sx={{ mb: 1 }} />)}
                    </Box>
                ) : (
                    <List dense>
                        {items.map((item, index) => (
                            <ListItem key={index} sx={{ px: 0 }}>
                                <ListItemAvatar sx={{ minWidth: 36 }}>{item.icon}</ListItemAvatar>
                                <ListItemText
                                    primary={item.content}
                                    primaryTypographyProps={{ variant: 'body2' }}
                                />
                            </ListItem>
                        ))}
                    </List>
                )}
            </CardContent>
        </Card>
    );
};

// 待办任务卡片
const TodoTasksCard = ({ tasks, loading }) => {
    const { tStudent } = useTranslation();

    const defaultTasks = [
        { id: 1, title: tStudent('mathHomework') || '数学作业第三章', deadline: tStudent('tomorrow') || '明天', type: 'homework', urgent: true },
        { id: 2, title: tStudent('englishQuiz') || '英语单词测验', deadline: tStudent('thisFriday') || '本周五', type: 'exam', urgent: false },
        { id: 3, title: tStudent('physicsReport') || '物理实验报告', deadline: tStudent('nextMonday') || '下周一', type: 'homework', urgent: false }
    ];

    const items = tasks || defaultTasks;

    const getTypeColor = (type) => {
        switch (type) {
            case 'exam': return 'error';
            case 'homework': return 'primary';
            default: return 'default';
        }
    };

    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AssignmentIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6">{tStudent('pendingTasks') || '待办任务'}</Typography>
                    </Box>
                    <Chip label={items.length} size="small" color="primary" />
                </Box>
                {loading ? (
                    <Box>{[1, 2, 3].map(i => <Skeleton key={i} height={50} sx={{ mb: 1 }} />)}</Box>
                ) : (
                    <List dense sx={{ px: 0 }}>
                        {items.map((task, index) => (
                            <React.Fragment key={task.id}>
                                <ListItem sx={{ px: 0 }}
                                    secondaryAction={
                                        <Chip
                                            label={task.deadline}
                                            size="small"
                                            color={task.urgent ? 'error' : 'default'}
                                        />
                                    }
                                >
                                    <ListItemAvatar sx={{ minWidth: 36 }}>
                                        <Avatar sx={{ width: 28, height: 28, bgcolor: `${getTypeColor(task.type)}.light` }}>
                                            {task.type === 'exam' ? '测' : '作'}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={task.title}
                                        primaryTypographyProps={{
                                            variant: 'body2',
                                            fontWeight: task.urgent ? 'bold' : 'normal'
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

// 学习目标进度卡片
const LearningGoalsCard = ({ goals, loading }) => {
    const { tStudent } = useTranslation();

    const defaultGoals = [
        { id: 1, title: '完成数学第三章学习', progress: 75, target: 100 },
        { id: 2, title: '英语词汇达到500个', progress: 320, target: 500 },
        { id: 3, title: '物理实验报告提交', progress: 60, target: 100 }
    ];

    const items = goals || defaultGoals;

    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TrophyIcon color="warning" sx={{ mr: 1 }} />
                    <Typography variant="h6">{tStudent('learningGoals') || '学习目标'}</Typography>
                </Box>
                {loading ? (
                    <Box>{[1, 2, 3].map(i => <Skeleton key={i} height={60} sx={{ mb: 1 }} />)}</Box>
                ) : (
                    <Box>
                        {items.map((goal) => {
                            const percentage = Math.round((goal.progress / goal.target) * 100);
                            return (
                                <Box key={goal.id} sx={{ mb: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="body2">{goal.title}</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {goal.progress}/{goal.target}
                                        </Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={percentage}
                                        sx={{ height: 8, borderRadius: 4 }}
                                        color={percentage >= 80 ? 'success' : percentage >= 50 ? 'primary' : 'warning'}
                                    />
                                </Box>
                            );
                        })}
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

// 最近学习活动时间线
const RecentActivityTimeline = ({ activities, loading }) => {
    const { tStudent } = useTranslation();

    const defaultActivities = [
        { id: 1, type: 'practice', title: tStudent('completedMathPractice') || '完成数学练习', time: tStudent('tenMinAgo') || '10分钟前', score: 85 },
        { id: 2, type: 'learn', title: tStudent('studiedEnglish') || '学习英语课程', time: tStudent('oneHourAgo') || '1小时前', duration: '45分钟' },
        { id: 3, type: 'homework', title: tStudent('submittedPhysics') || '提交物理作业', time: tStudent('yesterday') || '昨天', status: 'completed' }
    ];

    const items = activities || defaultActivities;

    const getActivityIcon = (type) => {
        switch (type) {
            case 'practice': return <CheckIcon color="success" />;
            case 'learn': return <PlayIcon color="primary" />;
            case 'homework': return <AssignmentIcon color="info" />;
            default: return <SchoolIcon />;
        }
    };

    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TimeIcon color="action" sx={{ mr: 1 }} />
                    <Typography variant="h6">{tStudent('recentActivity') || '最近学习'}</Typography>
                </Box>
                {loading ? (
                    <Box>{[1, 2, 3].map(i => <Skeleton key={i} height={50} sx={{ mb: 1 }} />)}</Box>
                ) : (
                    <List dense>
                        {items.map((activity, index) => (
                            <React.Fragment key={activity.id}>
                                <ListItem sx={{ px: 0 }}>
                                    <ListItemAvatar sx={{ minWidth: 36 }}>
                                        <Avatar sx={{ width: 28, height: 28 }}>
                                            {getActivityIcon(activity.type)}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={activity.title}
                                        secondary={activity.time}
                                        primaryTypographyProps={{ variant: 'body2' }}
                                        secondaryTypographyProps={{ variant: 'caption' }}
                                    />
                                    {activity.score && (
                                        <Chip label={`${activity.score}${tStudent('points') || '分'}`} size="small" color="success" />
                                    )}
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

const StudentHomePage = () => {
    const dispatch = useDispatch();
    const { tStudent, tSubject, tDashboard } = useTranslation();

    const { userDetails, currentUser, loading, response } = useSelector((state) => state.user);
    const { subjectsList } = useSelector((state) => state.sclass);

    const [subjectAttendance, setSubjectAttendance] = useState([]);
    const [studyStats, setStudyStats] = useState(null);
    const [dashboardData, setDashboardData] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);

    const classID = safeGet(currentUser, 'sclassName._id');
    const studentId = safeGet(currentUser, '_id');

    useEffect(() => {
        if (studentId) {
            dispatch(getUserDetails(studentId, "Student"));
            fetchDashboardData();
        }
        if (classID) {
            dispatch(getSubjectList(classID, "ClassSubjects"));
        }
    }, [dispatch, currentUser, classID]);

    const fetchDashboardData = async () => {
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
    };

    const numberOfSubjects = subjectsList && subjectsList.length;

    useEffect(() => {
        if (userDetails) {
            setSubjectAttendance(userDetails.attendance || []);
        }
    }, [userDetails])

    const overallAttendancePercentage = calculateOverallAttendancePercentage(subjectAttendance);
    const overallAbsentPercentage = 100 - overallAttendancePercentage;

    const chartData = [
        { name: tStudent('present') || 'Present', value: overallAttendancePercentage },
        { name: tStudent('absent') || 'Absent', value: overallAbsentPercentage }
    ];

    // 统计卡片数据
    const statCards = [
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
    ];

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
                                        <Typography variant="body2" color="text.secondary">暂无出勤数据</Typography>
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
                                        累计 <Typography component="span" color="primary" fontWeight="bold">
                                            {studyStats?.totalMinutes || 480}
                                        </Typography> 分钟
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
                        <RecentActivityTimeline activities={dashboardData?.recentActivities} loading={statsLoading} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2, height: '100%' }}>
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
}

export default StudentHomePage
