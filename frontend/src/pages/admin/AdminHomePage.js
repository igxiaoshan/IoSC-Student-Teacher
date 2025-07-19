import { Container, Grid, Paper, Box, Typography, Button, Card, CardContent, CardActions, Chip, FormControl, Select, MenuItem } from '@mui/material'
import SeeNotice from '../../components/SeeNotice';
import Students from "../../assets/img1.png";
import Classes from "../../assets/img2.png";
import Teachers from "../../assets/img3.png";
import Fees from "../../assets/img4.png";
import styled from 'styled-components';
import CountUp from 'react-countup';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAllSclasses } from '../../redux/sclassRelated/sclassHandle';
import { getAllStudents } from '../../redux/studentRelated/studentHandle';
import { getAllTeachers } from '../../redux/teacherRelated/teacherHandle';
import { safeGet } from '../../utils/safeAccess';
import {
    Add as AddIcon,
    Class as ClassIcon,
    Person as PersonIcon,
    Assignment as AssignmentIcon,
    Visibility as VisibilityIcon,
    BarChart as BarChartIcon,
    TrendingUp as TrendingUpIcon,
    Speed as SpeedIcon,
    Memory as MemoryIcon,
    People as PeopleIcon
} from '@mui/icons-material';
import { BlueButton, GreenButton } from '../../components/buttonStyles';
import UserActivityChart from '../../components/dashboard/UserActivityChart';
import SystemStatusPanel from '../../components/dashboard/SystemStatusPanel';
import BusinessMetricsPanel from '../../components/dashboard/BusinessMetricsPanel';
import GrowthTrendChart from '../../components/dashboard/GrowthTrendChart';
import DashboardFilters from '../../components/dashboard/DashboardFilters';
import DataSummaryPanel from '../../components/dashboard/DataSummaryPanel';
import { exportDashboardData, exportDashboardJSON } from '../../utils/dataExport';

const AdminHomePage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { studentsList } = useSelector((state) => state.student);
    const { sclassesList } = useSelector((state) => state.sclass);
    const { teachersList } = useSelector((state) => state.teacher);

    const { currentUser } = useSelector(state => state.user)

    const adminID = safeGet(currentUser, '_id');

    // 新增状态管理
    const [dashboardData, setDashboardData] = useState(null);
    const [timeRange, setTimeRange] = useState('month');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        dispatch(getAllStudents(adminID));
        dispatch(getAllSclasses(adminID, "Sclass"));
        dispatch(getAllTeachers(adminID));

        // 获取仪表板数据
        if (adminID) {
            fetchDashboardData();
        }
    }, [adminID, dispatch, timeRange]);

    // 获取仪表板数据
    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_BASE_URL}/adminDashboard/${adminID}?timeRange=${timeRange}`
            );
            setDashboardData(response.data);
        } catch (error) {
            console.error('获取仪表板数据失败:', error);
        } finally {
            setLoading(false);
        }
    };

    // 导出数据功能
    const handleExportData = () => {
        if (!dashboardData) return;

        // 导出CSV格式的分类数据
        exportDashboardData(dashboardData, timeRange);
    };

    // 导出JSON格式的完整数据
    const handleExportJSON = () => {
        if (!dashboardData) return;
        exportDashboardJSON(dashboardData, timeRange);
    };

    const numberOfStudents = studentsList && studentsList.length;
    const numberOfClasses = sclassesList && sclassesList.length;
    const numberOfTeachers = teachersList && teachersList.length;

    // 快捷操作配置
    const quickActions = [
        {
            title: '创建班级',
            description: '添加新的班级到系统中',
            icon: <AddIcon />,
            color: 'success',
            action: () => navigate('/Admin/addclass')
        },
        {
            title: '管理班级',
            description: '查看和管理所有班级',
            icon: <ClassIcon />,
            color: 'primary',
            action: () => navigate('/Admin/classes')
        },
        {
            title: '添加学生',
            description: '为班级添加新学生',
            icon: <PersonIcon />,
            color: 'info',
            action: () => navigate('/Admin/students')
        },
        {
            title: '管理科目',
            description: '设置班级科目和课程',
            icon: <AssignmentIcon />,
            color: 'warning',
            action: () => navigate('/Admin/subjects')
        }
    ];

    // 关键指标卡片配置
    const keyMetricsCards = [
        {
            title: '总用户数',
            value: dashboardData?.userBehavior?.totalUsers || (numberOfStudents + numberOfTeachers),
            change: '+5.2%',
            icon: <PeopleIcon />,
            color: 'primary'
        },
        {
            title: '活跃用户',
            value: dashboardData?.userBehavior?.activeUsers || 0,
            change: '+12.1%',
            icon: <TrendingUpIcon />,
            color: 'success'
        },
        {
            title: '系统健康度',
            value: '99.9%',
            change: '稳定',
            icon: <SpeedIcon />,
            color: 'info'
        },
        {
            title: '内存使用率',
            value: dashboardData?.system?.memory?.usagePercentage ?
                `${dashboardData.system.memory.usagePercentage.toFixed(1)}%` : '0%',
            change: dashboardData?.system?.memory?.usagePercentage < 80 ? '正常' : '偏高',
            icon: <MemoryIcon />,
            color: dashboardData?.system?.memory?.usagePercentage < 80 ? 'success' : 'warning'
        }
    ];

    return (
        <>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Grid container spacing={3}>
                    {/* 页面标题 */}
                    <Grid item xs={12}>
                        <Typography variant="h4" component="h1" gutterBottom>
                            管理员仪表板
                        </Typography>
                        <Typography variant="body1" color="textSecondary" gutterBottom>
                            实时监控系统运行状态和业务关键指标
                        </Typography>
                    </Grid>

                    {/* 过滤器组件 */}
                    <Grid item xs={12}>
                        <DashboardFilters
                            timeRange={timeRange}
                            onTimeRangeChange={setTimeRange}
                            onRefresh={fetchDashboardData}
                            onExport={handleExportData}
                            loading={loading}
                            lastUpdated={dashboardData?.lastUpdated}
                        />
                    </Grid>

                    {/* 关键指标卡片 */}
                    {keyMetricsCards.map((metric, index) => (
                        <Grid item xs={12} sm={6} md={3} key={index}>
                            <Card elevation={2}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Box>
                                            <Typography color="textSecondary" gutterBottom variant="body2">
                                                {metric.title}
                                            </Typography>
                                            <Typography variant="h4" component="div">
                                                {metric.value}
                                            </Typography>
                                            <Chip
                                                label={metric.change}
                                                color={metric.color}
                                                size="small"
                                                sx={{ mt: 1 }}
                                            />
                                        </Box>
                                        <Box sx={{ color: `${metric.color}.main` }}>
                                            {metric.icon}
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}

                    {/* 原有的统计卡片 */}
                    <Grid item xs={12} md={3} lg={3}>
                        <StyledPaper>
                            <img src={Students} alt="Students" />
                            <Title>
                                学生总数
                            </Title>
                            <Data start={0} end={numberOfStudents} duration={2.5} />
                        </StyledPaper>
                    </Grid>
                    <Grid item xs={12} md={3} lg={3}>
                        <StyledPaper onClick={() => navigate('/Admin/classes')} style={{ cursor: 'pointer' }}>
                            <img src={Classes} alt="Classes" />
                            <Title>
                                班级总数
                            </Title>
                            <Data start={0} end={numberOfClasses} duration={5} />
                            <Typography variant="caption" color="textSecondary">
                                点击查看详情
                            </Typography>
                        </StyledPaper>
                    </Grid>
                    <Grid item xs={12} md={3} lg={3}>
                        <StyledPaper>
                            <img src={Teachers} alt="Teachers" />
                            <Title>
                                教师总数
                            </Title>
                            <Data start={0} end={numberOfTeachers} duration={2.5} />
                        </StyledPaper>
                    </Grid>
                    <Grid item xs={12} md={3} lg={3}>
                        <StyledPaper>
                            <img src={Fees} alt="Fees" />
                            <Title>
                                学费收缴
                            </Title>
                            <Data start={0} end={23000} duration={2.5} prefix="$" />                        </StyledPaper>
                    </Grid>
                    {/* 数据可视化区域 */}
                    <Grid item xs={12} md={8}>
                        <UserActivityChart
                            data={dashboardData?.userBehavior}
                            loading={loading}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <SystemStatusPanel
                            data={dashboardData?.system}
                            loading={loading}
                        />
                    </Grid>

                    {/* 业务指标面板 */}
                    <Grid item xs={12} md={8}>
                        <BusinessMetricsPanel
                            data={dashboardData?.business}
                            loading={loading}
                        />
                    </Grid>

                    {/* 数据摘要与洞察 */}
                    <Grid item xs={12} md={4}>
                        <DataSummaryPanel
                            data={dashboardData}
                            loading={loading}
                        />
                    </Grid>

                    {/* 增长趋势图表 */}
                    <Grid item xs={12}>
                        <GrowthTrendChart
                            data={dashboardData?.growth}
                            loading={loading}
                        />
                    </Grid>

                    {/* 快捷操作区域 */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 3, mb: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                快捷操作
                            </Typography>
                            <Grid container spacing={2}>
                                {quickActions.map((action, index) => (
                                    <Grid item xs={12} sm={6} md={3} key={index}>
                                        <Card
                                            sx={{
                                                height: '100%',
                                                cursor: 'pointer',
                                                '&:hover': {
                                                    boxShadow: 3,
                                                    transform: 'translateY(-2px)',
                                                    transition: 'all 0.3s ease'
                                                }
                                            }}
                                            onClick={action.action}
                                        >
                                            <CardContent sx={{ textAlign: 'center', pb: 1 }}>
                                                <Box sx={{ color: `${action.color}.main`, mb: 1 }}>
                                                    {action.icon}
                                                </Box>
                                                <Typography variant="h6" component="div" gutterBottom>
                                                    {action.title}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {action.description}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        </Paper>
                    </Grid>

                    {/* 班级管理快捷入口 */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 3, mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">
                                    班级管理
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <GreenButton
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        onClick={() => navigate('/Admin/addclass')}
                                    >
                                        创建班级
                                    </GreenButton>
                                    <BlueButton
                                        variant="outlined"
                                        startIcon={<VisibilityIcon />}
                                        onClick={() => navigate('/Admin/classes')}
                                    >
                                        查看所有班级
                                    </BlueButton>
                                </Box>
                            </Box>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={4}>
                                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                                        <Typography variant="h4" color="success.contrastText">
                                            {numberOfClasses || 0}
                                        </Typography>
                                        <Typography variant="body2" color="success.contrastText">
                                            总班级数
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                                        <Typography variant="h4" color="primary.contrastText">
                                            {numberOfStudents || 0}
                                        </Typography>
                                        <Typography variant="body2" color="primary.contrastText">
                                            总学生数
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                                        <Typography variant="h4" color="warning.contrastText">
                                            {numberOfTeachers || 0}
                                        </Typography>
                                        <Typography variant="body2" color="warning.contrastText">
                                            总教师数
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={12} lg={12}>
                        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                            <SeeNotice />
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </>
    );
};


const StyledPaper = styled(Paper)`
  padding: 16px;
  display: flex;
  flex-direction: column;
  height: 200px;
  justify-content: space-between;
  align-items: center;
  text-align: center;
`;

const Title = styled.p`
  font-size: 1.25rem;
`;

const Data = styled(CountUp)`
  font-size: calc(1.3rem + .6vw);
  color: green;
`;

export default AdminHomePage