import React, { useEffect, useState } from 'react';
import {
    Container, Paper, Typography, Grid, Card, CardContent, Box,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TextField, Button, Chip, Avatar, IconButton, Tooltip,
    Skeleton, Alert, Divider, Collapse, LinearProgress, Tab, Tabs,
    useMediaQuery, useTheme, Hidden, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import {
    Event as EventIcon, Check as CheckIcon, Close as CloseIcon,
    Download as DownloadIcon, Refresh as RefreshIcon,
    Warning as WarningIcon, KeyboardArrowDown, KeyboardArrowUp
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { getClassStudents, notifyAttendanceUpdate } from '../../redux/sclassRelated/sclassHandle';
import { useTranslation } from '../../hooks/useTranslation';
import { safeGet } from '../../utils/safeAccess';
import api from '../../utils/apiConfig';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement,
    LineElement, BarElement, ArcElement, Title, Legend, Filler, Tooltip as ChartTooltip
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement, BarElement,
    ArcElement, Title, ChartTooltip, Legend, Filler
);

const TeacherAttendanceManagement = () => {
    const dispatch = useDispatch();
    const { tTeacher, tStudent, tCommon } = useTranslation();
    const { sclassStudents, loading } = useSelector((state) => state.sclass);
    const { currentUser } = useSelector((state) => state.user);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const classID = safeGet(currentUser, 'teachSclass._id');
    const subjectID = safeGet(currentUser, 'teachSubject._id');
    const subjectName = safeGet(currentUser, 'teachSubject.subName', '');

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceData, setAttendanceData] = useState({});
    const [stats, setStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [tabValue, setTabValue] = useState(0);
    const [expandedStudent, setExpandedStudent] = useState(null);

    useEffect(() => {
        if (classID) {
            dispatch(getClassStudents(classID));
        }
    }, [dispatch, classID]);

    useEffect(() => {
        if (classID && subjectID) {
            fetchStats();
        }
    }, [classID, subjectID]);

    const fetchStats = async () => {
        setStatsLoading(true);
        try {
            const res = await api.get('/ClassAttendanceStats', {
                params: { classId: classID, subjectId: subjectID, startDate, endDate }
            });
            setStats(res);
        } catch (err) {
            console.error('Fetch stats error:', err);
        } finally {
            setStatsLoading(false);
        }
    };

    const handleAttendanceChange = (studentId, status) => {
        setAttendanceData(prev => ({
            ...prev,
            [studentId]: status
        }));
    };

    const handleSubmit = async () => {
        if (Object.keys(attendanceData).length === 0) {
            setMessage({ type: 'warning', text: '请至少选择一个学生的考勤状态' });
            return;
        }

        setSaving(true);
        try {
            const students = sclassStudents
                .filter(s => attendanceData[s._id])
                .map(s => ({ studentId: s._id, status: attendanceData[s._id] }));

            await api.post('/BatchAttendance', {
                students,
                subName: subjectID,
                date: selectedDate
            });

            setMessage({ type: 'success', text: '考勤录入成功！' });
            setAttendanceData({});
            fetchStats();
            // 通知其他页面刷新数据
            dispatch(notifyAttendanceUpdate());
        } catch (err) {
            setMessage({ type: 'error', text: '录入失败：' + (err.response?.data?.message || err.message) });
        } finally {
            setSaving(false);
        }
    };

    const handleSetAllPresent = () => {
        const newData = {};
        sclassStudents.forEach(s => { newData[s._id] = 'Present'; });
        setAttendanceData(newData);
    };

    const handleExportCSV = () => {
        if (!stats?.studentStats) return;
        const csv = [
            ['姓名', '学号', '出勤次数', '缺勤次数', '出勤率'].join(','),
            ...stats.studentStats.map(s => [
                s.name, s.rollNum, s.presentCount, s.absentCount, `${s.attendanceRate}%`
            ].join(','))
        ].join('\n');

        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `考勤统计_${startDate}_${endDate}.csv`;
        link.click();
    };

    // 异常预警学生
    const warningStudents = stats?.studentStats?.filter(s => s.attendanceRate < 70) || [];

    // 图表数据
    const distributionChartData = stats ? {
        labels: [tTeacher('present'), tTeacher('absent')],
        datasets: [{
            data: [stats.totalPresent, stats.totalAbsent],
            backgroundColor: ['rgba(76, 175, 80, 0.8)', 'rgba(244, 67, 54, 0.8)'],
            borderWidth: 2
        }]
    } : null;

    const trendChartData = stats?.attendanceByDate ? {
        labels: Object.keys(stats.attendanceByDate),
        datasets: [
            {
                label: tTeacher('present'),
                data: Object.values(stats.attendanceByDate).map(d => d.present),
                backgroundColor: 'rgba(76, 175, 80, 0.8)'
            },
            {
                label: tTeacher('absent'),
                data: Object.values(stats.attendanceByDate).map(d => d.absent),
                backgroundColor: 'rgba(244, 67, 54, 0.8)'
            }
        ]
    } : null;

    // 出勤率趋势折线图
    const rateTrendData = stats?.attendanceByDate ? {
        labels: Object.keys(stats.attendanceByDate),
        datasets: [{
            label: tTeacher('attendanceRate') || '出勤率',
            data: Object.values(stats.attendanceByDate).map(d => {
                const total = d.present + d.absent;
                return total > 0 ? Math.round((d.present / total) * 100) : 0;
            }),
            borderColor: 'rgba(33, 150, 243, 1)',
            backgroundColor: 'rgba(33, 150, 243, 0.2)',
            fill: true,
            tension: 0.4
        }]
    } : null;

    return (
        <Container maxWidth={false} sx={{ mt: 2, mb: 4, px: { xs: 1, sm: 2, md: 3 } }}>
            {/* 标题 - 响应式布局 */}
            <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
                <Box
                    display="flex"
                    flexDirection={{ xs: 'column', sm: 'row' }}
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    justifyContent="space-between"
                    gap={2}
                >
                    <Box display="flex" alignItems="center">
                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2, display: { xs: 'none', sm: 'flex' } }}>
                            <EventIcon />
                        </Avatar>
                        <Box>
                            <Typography variant="h5" fontWeight={600} component="h1">
                                {tTeacher('attendanceManagement')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {tTeacher('mySubjects')}: {subjectName}
                            </Typography>
                        </Box>
                    </Box>
                    <Box display="flex" alignItems="center" gap={2} alignSelf={{ xs: 'flex-start', sm: 'center' }}>
                        <Chip
                            label={`${startDate} ~ ${endDate}`}
                            color="primary"
                            variant="outlined"
                            size={isMobile ? 'small' : 'medium'}
                        />
                        <Button size="small" startIcon={<RefreshIcon />} onClick={fetchStats} variant="outlined">
                            {tCommon('refresh')}
                        </Button>
                    </Box>
                </Box>
            </Paper>

            {message.text && (
                <Alert severity={message.type} onClose={() => setMessage({ type: '', text: '' })} sx={{ mb: 3 }}>
                    {message.text}
                </Alert>
            )}

            {/* 异常预警 */}
            {warningStudents.length > 0 && (
                <Alert severity="warning" sx={{ mb: 3 }} icon={<WarningIcon />}>
                    <Typography variant="body2">
                        <strong>{tTeacher('attendanceWarning') || '出勤预警'}:</strong>
                        {warningStudents.map(s => s.name).join('、')} ({warningStudents.length}{tTeacher('students') || '人'}出勤率低于70%)
                    </Typography>
                </Alert>
            )}

            {/* Tab 切换 - 移动端使用下拉选择 */}
            <Paper sx={{ mb: 3 }}>
                <Hidden smDown implementation="css">
                    <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} variant="fullWidth">
                        <Tab label={tTeacher('addAttendance') || '考勤录入'} />
                        <Tab label={tTeacher('attendanceStats') || '考勤统计'} />
                        <Tab label={tTeacher('studentDetail') || '学生详情'} />
                    </Tabs>
                </Hidden>
                <Hidden smUp implementation="css">
                    <Box sx={{ p: 2 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>{tTeacher('selectTab') || '选择功能'}</InputLabel>
                            <Select
                                value={tabValue}
                                label={tTeacher('selectTab') || '选择功能'}
                                onChange={(e) => setTabValue(e.target.value)}
                            >
                                <MenuItem value={0}>{tTeacher('addAttendance') || '考勤录入'}</MenuItem>
                                <MenuItem value={1}>{tTeacher('attendanceStats') || '考勤统计'}</MenuItem>
                                <MenuItem value={2}>{tTeacher('studentDetail') || '学生详情'}</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </Hidden>
            </Paper>

            {/* Tab 1: 考勤录入 */}
            <Collapse in={tabValue === 0}>
                <Grid container spacing={3}>
                    <Grid item xs={12} lg={7}>
                        <Paper sx={{ p: { xs: 1, sm: 2 } }}>
                            <Box
                                display="flex"
                                flexDirection={{ xs: 'column', sm: 'row' }}
                                alignItems={{ xs: 'flex-start', sm: 'center' }}
                                justifyContent="space-between"
                                mb={2}
                                gap={1}
                            >
                                <Typography variant="h6">{tTeacher('addAttendance')}</Typography>
                                <Box display="flex" gap={1} flexWrap="wrap">
                                    <TextField
                                        type="date"
                                        size="small"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                        sx={{ minWidth: { xs: 120, sm: 150 } }}
                                    />
                                    <Button variant="outlined" size="small" onClick={handleSetAllPresent}>
                                        全部出席
                                    </Button>
                                </Box>
                            </Box>
                            <Divider sx={{ mb: 2 }} />

                            {loading ? (
                                <Box>{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} height={50} />)}</Box>
                            ) : (
                                <TableContainer sx={{ maxHeight: 400 }}>
                                    <Table stickyHeader size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>{tStudent('studentName')}</TableCell>
                                                <TableCell>{tStudent('studentId')}</TableCell>
                                                <TableCell align="center">{tTeacher('attendanceStatus')}</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {sclassStudents?.map((student) => (
                                                <TableRow key={student._id} hover>
                                                    <TableCell>{student.name}</TableCell>
                                                    <TableCell>{student.rollNum}</TableCell>
                                                    <TableCell align="center">
                                                        <Box display="flex" gap={1} justifyContent="center">
                                                            <Tooltip title={tTeacher('present')}>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleAttendanceChange(student._id, 'Present')}
                                                                    sx={{
                                                                        bgcolor: attendanceData[student._id] === 'Present' ? 'success.main' : 'transparent',
                                                                        color: attendanceData[student._id] === 'Present' ? 'white' : 'success.main',
                                                                        border: 1,
                                                                        borderColor: 'success.main'
                                                                    }}
                                                                >
                                                                    <CheckIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title={tTeacher('absent')}>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleAttendanceChange(student._id, 'Absent')}
                                                                    sx={{
                                                                        bgcolor: attendanceData[student._id] === 'Absent' ? 'error.main' : 'transparent',
                                                                        color: attendanceData[student._id] === 'Absent' ? 'white' : 'error.main',
                                                                        border: 1,
                                                                        borderColor: 'error.main'
                                                                    }}
                                                                >
                                                                    <CloseIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}

                            <Box display="flex" gap={2} mt={2}>
                                <Button variant="contained" color="primary" onClick={handleSubmit} disabled={saving || Object.keys(attendanceData).length === 0}>
                                    {saving ? tCommon('loading') : tCommon('submit')}
                                </Button>
                                <Button variant="outlined" onClick={() => setAttendanceData({})}>
                                    {tCommon('reset')}
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={5}>
                        {/* 日期范围筛选 */}
                        <Card sx={{ mb: 3 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>{tTeacher('dateRange') || '日期范围'}</Typography>
                                <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
                                    <TextField
                                        type="date"
                                        size="small"
                                        label={tTeacher('startDate') || '开始日期'}
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                        sx={{ minWidth: { xs: '100%', sm: 130 } }}
                                    />
                                    <Typography sx={{ display: { xs: 'none', sm: 'block' } }}>~</Typography>
                                    <TextField
                                        type="date"
                                        size="small"
                                        label={tTeacher('endDate') || '结束日期'}
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                        sx={{ minWidth: { xs: '100%', sm: 130 } }}
                                    />
                                    <Button variant="contained" size="small" onClick={fetchStats}>
                                        {tCommon('search') || '查询'}
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>

                        {/* 出勤分布 */}
                        <Card sx={{ mb: 3 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>{tTeacher('attendanceDistribution') || '出勤分布'}</Typography>
                                {statsLoading ? (
                                    <Skeleton variant="circular" width={150} height={150} sx={{ mx: 'auto' }} />
                                ) : distributionChartData ? (
                                    <Box sx={{ height: { xs: 150, sm: 200 }, display: 'flex', justifyContent: 'center' }}>
                                        <Doughnut data={distributionChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                                    </Box>
                                ) : (
                                    <Typography color="text.secondary">{tCommon('none')}</Typography>
                                )}
                                {stats && (
                                    <Box mt={2}>
                                        <Typography variant="body2" color="text.secondary">
                                            {tTeacher('totalAttendancePercentage')}: <strong>{stats.averageAttendanceRate}%</strong>
                                        </Typography>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Collapse>

            {/* Tab 2: 考勤统计 */}
            <Collapse in={tabValue === 1}>
                <Grid container spacing={3}>
                    {/* 出勤趋势柱状图 */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>{tTeacher('attendanceTrend') || '出勤趋势'}</Typography>
                                {statsLoading ? (
                                    <Skeleton variant="rectangular" height={200} />
                                ) : trendChartData ? (
                                    <Box sx={{ height: { xs: 200, sm: 250 } }}>
                                        <Bar data={trendChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
                                    </Box>
                                ) : (
                                    <Typography color="text.secondary">{tCommon('none')}</Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* 出勤率趋势折线图 */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>{tTeacher('attendanceRateTrend') || '出勤率趋势'}</Typography>
                                {statsLoading ? (
                                    <Skeleton variant="rectangular" height={200} />
                                ) : rateTrendData ? (
                                    <Box sx={{ height: { xs: 200, sm: 250 } }}>
                                        <Line data={rateTrendData} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 100 } } }} />
                                    </Box>
                                ) : (
                                    <Typography color="text.secondary">{tCommon('none')}</Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* 导出按钮 */}
                    <Grid item xs={12}>
                        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportCSV} disabled={!stats?.studentStats}>
                            {tCommon('export')}
                        </Button>
                    </Grid>
                </Grid>
            </Collapse>

            {/* Tab 3: 学生详情 */}
            <Collapse in={tabValue === 2}>
                <Paper sx={{ p: { xs: 1, sm: 2 } }}>
                    <Typography variant="h6" gutterBottom>{tTeacher('studentAttendanceDetail') || '学生考勤详情'}</Typography>
                    <Divider sx={{ mb: 2 }} />
                    {statsLoading ? (
                        <Box>{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} height={50} />)}</Box>
                    ) : stats?.studentStats ? (
                        <TableContainer sx={{ maxHeight: { xs: 300, sm: 400 } }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ minWidth: { xs: 40, sm: 50 } }} />
                                        <TableCell sx={{ minWidth: { xs: 70, sm: 100 } }}>{tStudent('studentName')}</TableCell>
                                        <TableCell sx={{ minWidth: { xs: 60, sm: 80 } }}>{tStudent('studentId')}</TableCell>
                                        <TableCell align="center" sx={{ minWidth: { xs: 40, sm: 60 } }}>{tTeacher('present')}</TableCell>
                                        <TableCell align="center" sx={{ minWidth: { xs: 40, sm: 60 } }}>{tTeacher('absent')}</TableCell>
                                        <TableCell align="center" sx={{ minWidth: { xs: 80, sm: 100 } }}>{tTeacher('attendanceRate')}</TableCell>
                                        <TableCell align="center" sx={{ minWidth: { xs: 50, sm: 70 } }}>{tTeacher('status')}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {stats.studentStats.map((student) => (
                                        <React.Fragment key={student.studentId}>
                                            <TableRow hover>
                                                <TableCell>
                                                    <IconButton size="small" onClick={() => setExpandedStudent(expandedStudent === student.studentId ? null : student.studentId)}>
                                                        {expandedStudent === student.studentId ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                                                    </IconButton>
                                                </TableCell>
                                                <TableCell>{student.name}</TableCell>
                                                <TableCell>{student.rollNum}</TableCell>
                                                <TableCell align="center">{student.presentCount}</TableCell>
                                                <TableCell align="center">{student.absentCount}</TableCell>
                                                <TableCell align="center">
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <LinearProgress
                                                            variant="determinate"
                                                            value={student.attendanceRate}
                                                            sx={{ width: { xs: 40, sm: 60 } }}
                                                            color={student.attendanceRate >= 80 ? 'success' : student.attendanceRate >= 60 ? 'warning' : 'error'}
                                                        />
                                                        <Typography variant="body2">{student.attendanceRate}%</Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Chip
                                                        size="small"
                                                        label={student.attendanceRate >= 80 ? '良好' : student.attendanceRate >= 60 ? '一般' : '预警'}
                                                        color={student.attendanceRate >= 80 ? 'success' : student.attendanceRate >= 60 ? 'warning' : 'error'}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        </React.Fragment>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <Typography color="text.secondary">{tCommon('none')}</Typography>
                    )}
                </Paper>
            </Collapse>
        </Container>
    );
};

export default TeacherAttendanceManagement;
