import { Container, Grid, Paper, Box, Typography, Avatar } from '@mui/material'
import SeeNotice from '../../components/SeeNotice';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { getAllSclasses } from '../../redux/sclassRelated/sclassHandle';
import { getAllStudents } from '../../redux/studentRelated/studentHandle';
import { getAllTeachers } from '../../redux/teacherRelated/teacherHandle';
import { safeGet } from '../../utils/safeAccess';
import MetricCard from '../../components/common/MetricCard';
import {
    TrendingUp as TrendingUpIcon,
    Speed as SpeedIcon,
    Memory as MemoryIcon,
    People as PeopleIcon,
    School as SchoolIcon,
    Groups as GroupsIcon,
    PersonOutline as PersonOutlineIcon,
    AttachMoney as AttachMoneyIcon
} from '@mui/icons-material';
import SystemStatusPanel from '../../components/dashboard/SystemStatusPanel';
import BusinessMetricsPanel from '../../components/dashboard/BusinessMetricsPanel';
import DashboardFilters from '../../components/dashboard/DashboardFilters';
import { exportDashboardData } from '../../utils/dataExport';
import { useTranslation } from '../../hooks/useTranslation';

const AdminHomePage = () => {
    const dispatch = useDispatch();
    const { tAdmin, tDashboard } = useTranslation();
    const { studentsList } = useSelector((state) => state.student);
    const { sclassesList } = useSelector((state) => state.sclass);
    const { teachersList } = useSelector((state) => state.teacher);
    const { currentUser } = useSelector(state => state.user);

    const adminID = safeGet(currentUser, '_id');
    const [dashboardData, setDashboardData] = useState(null);
    const [timeRange, setTimeRange] = useState('month');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        dispatch(getAllStudents(adminID));
        dispatch(getAllSclasses(adminID, "Sclass"));
        dispatch(getAllTeachers(adminID));
        if (adminID) fetchDashboardData();
    }, [adminID, dispatch, timeRange]);

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

    const handleExportData = () => {
        if (!dashboardData) return;
        exportDashboardData(dashboardData, timeRange);
    };

    const numberOfStudents = studentsList?.length || 0;
    const numberOfClasses = sclassesList?.length || 0;
    const numberOfTeachers = teachersList?.length || 0;
    const totalUsers = dashboardData?.userBehavior?.totalUsers || (numberOfStudents + numberOfTeachers);

    const activeUsers = dashboardData?.userBehavior?.activeUsers ||
        Math.floor(totalUsers * (0.6 + Math.random() * 0.25));

    const metrics = [
        { title: tAdmin('totalUsers'), value: totalUsers, change: '+5.2%', icon: <PeopleIcon />, color: 'primary' },
        { title: tAdmin('activeUsers'), value: activeUsers, change: '+12.1%', icon: <TrendingUpIcon />, color: 'success' },
        { title: tAdmin('systemHealth'), value: '99.9%', change: tAdmin('stable'), icon: <SpeedIcon />, color: 'info' },
        { title: tAdmin('memoryUsage'), value: dashboardData?.system?.memory?.usagePercentage ? `${dashboardData.system.memory.usagePercentage.toFixed(1)}%` : '0%', change: tAdmin('normal'), icon: <MemoryIcon />, color: 'success' },
        { title: tDashboard('totalClasses'), value: numberOfClasses, change: '+2.1%', icon: <SchoolIcon />, color: 'primary' },
        { title: tDashboard('totalStudents'), value: numberOfStudents, change: '+8.5%', icon: <GroupsIcon />, color: 'success' },
        { title: tDashboard('totalTeachers'), value: numberOfTeachers, change: '+1.2%', icon: <PersonOutlineIcon />, color: 'info' },
        { title: tAdmin('operatingExpenses'), value: '$10,000', change: '-3.2%', icon: <AttachMoneyIcon />, color: 'warning' }
    ];

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Typography variant="h4" component="h1" gutterBottom>{tAdmin('adminDashboard')}</Typography>
                    <Typography variant="body1" color="textSecondary">{tAdmin('dashboardSubtitle')}</Typography>
                </Grid>

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

                {metrics.map((metric, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                        <MetricCard {...metric} />
                    </Grid>
                ))}

                <Grid item xs={12} md={6}>
                    <BusinessMetricsPanel data={dashboardData?.business} loading={loading} />
                </Grid>
                <Grid item xs={12} md={6}>
                    <SystemStatusPanel data={dashboardData?.system} loading={loading} onRefresh={fetchDashboardData} />
                </Grid>

                <Grid item xs={12}>
                    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                        <SeeNotice />
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default AdminHomePage;
