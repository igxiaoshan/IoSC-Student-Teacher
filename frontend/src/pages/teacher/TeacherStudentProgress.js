import React, { useEffect, useState } from 'react';
import {
    Container, Paper, Typography, Grid, Card, CardContent, Box,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Chip, Avatar, Skeleton, Alert, Divider, LinearProgress,
    Tab, Tabs, Collapse, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import {
    TrendingUp as TrendingUpIcon, Warning as WarningIcon,
    CheckCircle as CheckIcon, Error as ErrorIcon,
    Refresh as RefreshIcon, Download as DownloadIcon,
    Lightbulb as LightbulbIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { getClassStudents } from '../../redux/sclassRelated/sclassHandle';
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

const TeacherStudentProgress = () => {
    const dispatch = useDispatch();
    const { tTeacher, tStudent, tCommon } = useTranslation();
    const { sclassStudents, loading } = useSelector((state) => state.sclass);
    const { currentUser } = useSelector((state) => state.user);

    const classID = safeGet(currentUser, 'teachSclass._id');
    const subjectID = safeGet(currentUser, 'teachSubject._id');
    const subjectName = safeGet(currentUser, 'teachSubject.subName', '');

    const [progressData, setProgressData] = useState(null);
    const [progressLoading, setProgressLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0);
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        if (classID) {
            dispatch(getClassStudents(classID));
        }
    }, [dispatch, classID]);

    useEffect(() => {
        if (classID && subjectID) {
            fetchProgress();
        }
    }, [classID, subjectID]);

    const fetchProgress = async () => {
        setProgressLoading(true);
        try {
            const res = await api.get('/StudentProgress', {
                params: { classId: classID, subjectId: subjectID }
            });
            setProgressData(res);
        } catch (err) {
            console.error('Fetch progress error:', err);
        } finally {
            setProgressLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'good': return 'success';
            case 'warning': return 'warning';
            case 'danger': return 'error';
            default: return 'default';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'good': return <CheckIcon />;
            case 'warning': return <WarningIcon />;
            case 'danger': return <ErrorIcon />;
            default: return null;
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'good': return tTeacher('progressGood') || '表现良好';
            case 'warning': return tTeacher('progressWarning') || '需要关注';
            case 'danger': return tTeacher('progressDanger') || '需要干预';
            default: return '-';
        }
    };

    const handleExportCSV = () => {
        if (!progressData?.students) return;
        const csv = [
            ['姓名', '学号', '出勤率', '成绩', '综合分数', '状态', '提醒'].join(','),
            ...progressData.students.map(s => [
                s.name, s.rollNum, `${s.attendanceRate}%`, s.grade || '未录入',
                s.progressScore, getStatusLabel(s.status), s.warnings?.join(';') || '-'
            ].join(','))
        ].join('\n');

        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `学生进度_${subjectName}.csv`;
        link.click();
    };

    // 筛选学生
    const filteredStudents = progressData?.students
        ? progressData.students.filter(s => filterStatus === 'all' || s.status === filterStatus)
        : [];

    // 干预建议
    const generateInterventions = () => {
        const interventions = [];
        const dangerStudents = progressData?.students?.filter(s => s.status === 'danger') || [];
        const warningStudents = progressData?.students?.filter(s => s.status === 'warning') || [];

        if (dangerStudents.length > 0) {
            interventions.push({
                type: 'danger',
                title: tTeacher('urgentIntervention') || '紧急干预',
                students: dangerStudents,
                suggestions: [
                    tTeacher('suggestion1') || '立即与学生进行一对一谈话，了解学习困难',
                    tTeacher('suggestion2') || '与家长沟通，共同制定学习计划',
                    tTeacher('suggestion3') || '安排课后辅导或补课'
                ]
            });
        }

        if (warningStudents.length > 0) {
            interventions.push({
                type: 'warning',
                title: tTeacher('attentionNeeded') || '需要关注',
                students: warningStudents,
                suggestions: [
                    tTeacher('suggestion4') || '定期检查学生作业完成情况',
                    tTeacher('suggestion5') || '课堂多关注，及时给予鼓励'
                ]
            });
        }

        return interventions;
    };

    const interventions = generateInterventions();

    // 图表数据
    const statusChartData = progressData ? {
        labels: [
            tTeacher('progressGood') || '良好',
            tTeacher('progressWarning') || '关注',
            tTeacher('progressDanger') || '干预'
        ],
        datasets: [{
            data: [progressData.goodCount, progressData.warningCount, progressData.dangerCount],
            backgroundColor: ['rgba(76, 175, 80, 0.8)', 'rgba(255, 152, 0, 0.8)', 'rgba(244, 67, 54, 0.8)'],
            borderWidth: 2
        }]
    } : null;

    const attendanceRateData = progressData?.students ? {
        labels: progressData.students.map(s => s.name),
        datasets: [{
            label: tTeacher('attendanceRate') || '出勤率',
            data: progressData.students.map(s => s.attendanceRate),
            backgroundColor: progressData.students.map(s =>
                s.attendanceRate >= 80 ? 'rgba(76, 175, 80, 0.8)' :
                s.attendanceRate >= 60 ? 'rgba(255, 152, 0, 0.8)' :
                'rgba(244, 67, 54, 0.8)'
            )
        }]
    } : null;

    const gradeDistributionData = progressData?.students ? {
        labels: progressData.students.filter(s => s.grade !== null).map(s => s.name),
        datasets: [{
            label: tTeacher('grade') || '成绩',
            data: progressData.students.filter(s => s.grade !== null).map(s => s.grade),
            backgroundColor: progressData.students.filter(s => s.grade !== null).map(s =>
                s.grade >= 90 ? 'rgba(76, 175, 80, 0.8)' :
                s.grade >= 60 ? 'rgba(33, 150, 243, 0.8)' :
                'rgba(244, 67, 54, 0.8)'
            )
        }]
    } : null;

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {/* 标题 */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center">
                        <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                            <TrendingUpIcon />
                        </Avatar>
                        <Box>
                            <Typography variant="h5" fontWeight={600}>
                                {tTeacher('studentProgress') || '学生进度追踪'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {tTeacher('mySubjects')}: {subjectName}
                            </Typography>
                        </Box>
                    </Box>
                    <Box display="flex" gap={2}>
                        <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={handleExportCSV}>
                            {tCommon('export')} CSV
                        </Button>
                        <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={fetchProgress}>
                            {tCommon('refresh')}
                        </Button>
                    </Box>
                </Box>
            </Paper>

            {/* 统计概览 */}
            {progressLoading ? (
                <Skeleton variant="rectangular" height={100} sx={{ mb: 3 }} />
            ) : progressData ? (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={3}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography variant="h4">{progressData.totalStudents}</Typography>
                                <Typography variant="body2" color="text.secondary">{tTeacher('totalStudents') || '总人数'}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" color="success.main">{progressData.goodCount}</Typography>
                                <Typography variant="body2" color="text.secondary">{tTeacher('progressGood') || '表现良好'}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" color="warning.main">{progressData.warningCount}</Typography>
                                <Typography variant="body2" color="text.secondary">{tTeacher('progressWarning') || '需要关注'}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" color="error.main">{progressData.dangerCount}</Typography>
                                <Typography variant="body2" color="text.secondary">{tTeacher('progressDanger') || '需要干预'}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            ) : (
                <Alert severity="info" sx={{ mb: 3 }}>{tCommon('none')}</Alert>
            )}

            {/* Tab 切换 */}
            <Paper sx={{ mb: 3 }}>
                <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                    <Tab label={tTeacher('progressOverview') || '进度概览'} />
                    <Tab label={tTeacher('studentDetail') || '学生详情'} />
                    <Tab label={tTeacher('interventionSuggestions') || '干预建议'} />
                </Tabs>
            </Paper>

            {/* Tab 1: 进度概览 */}
            <Collapse in={tabValue === 0}>
                <Grid container spacing={3}>
                    {/* 状态分布饼图 */}
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>{tTeacher('statusDistribution') || '状态分布'}</Typography>
                                {statusChartData && (
                                    <Box sx={{ height: 200, display: 'flex', justifyContent: 'center' }}>
                                        <Doughnut data={statusChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* 出勤率分布 */}
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>{tTeacher('attendanceRateDistribution') || '出勤率分布'}</Typography>
                                {attendanceRateData && (
                                    <Box sx={{ height: 200 }}>
                                        <Bar data={attendanceRateData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* 成绩分布 */}
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>{tTeacher('gradeDistribution') || '成绩分布'}</Typography>
                                {gradeDistributionData && (
                                    <Box sx={{ height: 200 }}>
                                        <Bar data={gradeDistributionData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Collapse>

            {/* Tab 2: 学生详情 */}
            <Collapse in={tabValue === 1}>
                <Paper sx={{ p: 2 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                        <Typography variant="h6">{tTeacher('studentProgressDetail') || '学生进度详情'}</Typography>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel>{tTeacher('filterStatus') || '筛选状态'}</InputLabel>
                            <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                                <MenuItem value="all">{tTeacher('all') || '全部'}</MenuItem>
                                <MenuItem value="good">{tTeacher('progressGood') || '良好'}</MenuItem>
                                <MenuItem value="warning">{tTeacher('progressWarning') || '关注'}</MenuItem>
                                <MenuItem value="danger">{tTeacher('progressDanger') || '干预'}</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                    <Divider sx={{ mb: 2 }} />

                    {progressLoading ? (
                        <Box>{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} height={60} />)}</Box>
                    ) : filteredStudents.length > 0 ? (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>{tStudent('studentName')}</TableCell>
                                        <TableCell>{tStudent('studentId')}</TableCell>
                                        <TableCell align="center">{tTeacher('attendanceRate') || '出勤率'}</TableCell>
                                        <TableCell align="center">{tTeacher('grade') || '成绩'}</TableCell>
                                        <TableCell align="center">{tTeacher('progressScore') || '综合分数'}</TableCell>
                                        <TableCell align="center">{tTeacher('status') || '状态'}</TableCell>
                                        <TableCell align="center">{tTeacher('warnings') || '提醒'}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredStudents.map((student) => (
                                        <TableRow key={student.studentId} hover>
                                            <TableCell>{student.name}</TableCell>
                                            <TableCell>{student.rollNum}</TableCell>
                                            <TableCell align="center">
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={student.attendanceRate}
                                                        sx={{ width: 60, mr: 1 }}
                                                        color={student.attendanceRate >= 80 ? 'success' : student.attendanceRate >= 60 ? 'warning' : 'error'}
                                                    />
                                                    <Typography variant="body2">{student.attendanceRate}%</Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="center">
                                                {student.grade !== null ? (
                                                    <Chip
                                                        label={student.grade}
                                                        size="small"
                                                        color={student.grade >= 90 ? 'success' : student.grade >= 60 ? 'primary' : 'error'}
                                                    />
                                                ) : (
                                                    <Typography color="text.secondary">-</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Typography fontWeight="bold">{student.progressScore}</Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    icon={getStatusIcon(student.status)}
                                                    label={getStatusLabel(student.status)}
                                                    color={getStatusColor(student.status)}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                {student.warnings?.length > 0 ? (
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                        {student.warnings.map((w, idx) => (
                                                            <Chip key={idx} label={w} size="small" variant="outlined" color="warning" />
                                                        ))}
                                                    </Box>
                                                ) : (
                                                    <Typography color="text.secondary">-</Typography>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <Typography color="text.secondary">{tCommon('none')}</Typography>
                    )}
                </Paper>
            </Collapse>

            {/* Tab 3: 干预建议 */}
            <Collapse in={tabValue === 2}>
                {interventions.length > 0 ? (
                    interventions.map((intervention, idx) => (
                        <Card key={idx} sx={{ mb: 3 }} color={intervention.type}>
                            <CardContent>
                                <Box display="flex" alignItems="center" gap={2} mb={2}>
                                    <Avatar sx={{ bgcolor: intervention.type === 'danger' ? 'error.main' : 'warning.main' }}>
                                        <LightbulbIcon />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h6">{intervention.title}</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {intervention.students.map(s => s.name).join('、')} ({intervention.students.length}{tTeacher('students') || '人'})
                                        </Typography>
                                    </Box>
                                </Box>
                                <Divider sx={{ mb: 2 }} />
                                <Typography variant="subtitle2" gutterBottom>{tTeacher('suggestions') || '建议措施'}:</Typography>
                                <Box component="ul" sx={{ pl: 2 }}>
                                    {intervention.suggestions.map((s, i) => (
                                        <Typography component="li" key={i} variant="body2" sx={{ mb: 1 }}>{s}</Typography>
                                    ))}
                                </Box>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <Alert severity="success">
                        <Typography>{tTeacher('allStudentsGood') || '所有学生表现良好，无需干预！'}</Typography>
                    </Alert>
                )}

                {/* 进度说明 */}
                <Paper sx={{ p: 2, mt: 3 }}>
                    <Typography variant="h6" gutterBottom>{tTeacher('progressExplanation') || '进度评分说明'}</Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                        {tTeacher('progressFormula') || '综合分数 = 出勤率 × 30% + 成绩 × 70%'}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="body2">
                            <Chip icon={<CheckIcon />} label={tTeacher('progressGood') || '表现良好'} color="success" size="small" sx={{ mr: 1 }} />
                            {tTeacher('progressGoodDesc') || '：出勤率≥70%且成绩≥70分'}
                        </Typography>
                        <Typography variant="body2">
                            <Chip icon={<WarningIcon />} label={tTeacher('progressWarning') || '需要关注'} color="warning" size="small" sx={{ mr: 1 }} />
                            {tTeacher('progressWarningDesc') || '：出勤率<70%或成绩60-69分'}
                        </Typography>
                        <Typography variant="body2">
                            <Chip icon={<ErrorIcon />} label={tTeacher('progressDanger') || '需要干预'} color="error" size="small" sx={{ mr: 1 }} />
                            {tTeacher('progressDangerDesc') || '：成绩<60分'}
                        </Typography>
                    </Box>
                </Paper>
            </Collapse>
        </Container>
    );
};

export default TeacherStudentProgress;