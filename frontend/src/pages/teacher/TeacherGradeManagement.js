import React, { useEffect, useState } from 'react';
import {
    Container, Paper, Typography, Grid, Card, CardContent, Box,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TextField, Button, Chip, Avatar,
    FormControl, InputLabel, Select, MenuItem, Skeleton, Alert, Divider, LinearProgress,
    Tab, Tabs, Collapse, useMediaQuery, useTheme, Hidden,
    Dialog, DialogTitle, DialogContent, DialogActions, IconButton
} from '@mui/material';
import {
    Grade as GradeIcon,
    Download as DownloadIcon, Refresh as RefreshIcon, Close as CloseIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { getClassStudents, notifyGradeUpdate } from '../../redux/sclassRelated/sclassHandle';
import { useTranslation } from '../../hooks/useTranslation';
import { safeGet } from '../../utils/safeAccess';
import api from '../../utils/apiConfig';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement,
    LineElement, BarElement, ArcElement, Title, Legend, Filler, Tooltip as ChartTooltip
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement, BarElement,
    ArcElement, Title, ChartTooltip, Legend, Filler
);

const TeacherGradeManagement = () => {
    const dispatch = useDispatch();
    const { tTeacher, tStudent, tCommon } = useTranslation();
    const { sclassStudents, loading } = useSelector((state) => state.sclass);
    const { currentUser } = useSelector((state) => state.user);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const classID = safeGet(currentUser, 'teachSclass._id');
    const subjectID = safeGet(currentUser, 'teachSubject._id');
    const subjectName = safeGet(currentUser, 'teachSubject.subName', '');

    const [gradeData, setGradeData] = useState({});
    const [stats, setStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [tabValue, setTabValue] = useState(0);
    const [sortOrder, setSortOrder] = useState('desc'); // desc: 高分在前, asc: 低分在前
    const [showAll, setShowAll] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null); // 选中学生查看详情

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
            const res = await api.get('/ClassGradeStats', {
                params: { classId: classID, subjectId: subjectID }
            });
            setStats(res.data);  // axios 响应数据在 res.data 中
        } catch (err) {
            console.error('Fetch stats error:', err);
        } finally {
            setStatsLoading(false);
        }
    };

    const handleGradeChange = (studentId, value) => {
        const numValue = Math.max(0, Math.min(100, parseInt(value) || 0));
        setGradeData(prev => ({
            ...prev,
            [studentId]: numValue
        }));
    };

    const handleSubmit = async () => {
        if (Object.keys(gradeData).length === 0) {
            setMessage({ type: 'warning', text: '请至少输入一个学生的成绩' });
            return;
        }

        setSaving(true);
        try {
            const students = sclassStudents
                .filter(s => gradeData[s._id] !== undefined)
                .map(s => ({ studentId: s._id, marksObtained: gradeData[s._id] }));

            for (const item of students) {
                await api.put(`/UpdateExamResult/${item.studentId}`, {
                    subName: subjectID,
                    marksObtained: item.marksObtained
                });
            }

            setMessage({ type: 'success', text: '成绩录入成功！' });
            setGradeData({});
            fetchStats();
            // 通知其他页面刷新数据
            dispatch(notifyGradeUpdate());
        } catch (err) {
            setMessage({ type: 'error', text: '录入失败：' + (err.response?.data?.message || err.message) });
        } finally {
            setSaving(false);
        }
    };

    const handleExportCSV = () => {
        if (!stats?.studentGrades) return;
        const sortedGrades = [...stats.studentGrades].sort((a, b) =>
            sortOrder === 'desc' ? (b.grade || 0) - (a.grade || 0) : (a.grade || 0) - (b.grade || 0)
        );
        const csv = [
            ['排名', '姓名', '学号', '成绩', '状态'].join(','),
            ...sortedGrades.map((s, idx) => [
                idx + 1, s.name, s.rollNum, s.grade || '未录入',
                s.grade >= 90 ? '优秀' : s.grade >= 60 ? '合格' : '不合格'
            ].join(','))
        ].join('\n');

        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `成绩排名_${subjectName}.csv`;
        link.click();
    };

    // 预警学生
    const failStudents = stats?.studentGrades?.filter(s => s.grade !== null && s.grade < 60) || [];

    // 图表数据
    const distributionChartData = stats?.distribution ? {
        labels: [
            tTeacher('gradeExcellent') || '优秀(90+)',
            tTeacher('gradeGood') || '良好(80-89)',
            tTeacher('gradeAverage') || '中等(70-79)',
            tTeacher('gradePass') || '及格(60-69)',
            tTeacher('gradeFail') || '不及格(<60)'
        ],
        datasets: [{
            data: [
                stats.distribution.excellent,
                stats.distribution.good,
                stats.distribution.average,
                stats.distribution.pass,
                stats.distribution.fail
            ],
            backgroundColor: [
                'rgba(76, 175, 80, 0.8)',
                'rgba(33, 150, 243, 0.8)',
                'rgba(255, 193, 7, 0.8)',
                'rgba(156, 39, 176, 0.8)',
                'rgba(244, 67, 54, 0.8)'
            ],
            borderWidth: 2
        }]
    } : null;

    // 排序后的成绩数据
    const sortedGrades = stats?.studentGrades ? [...stats.studentGrades].sort((a, b) =>
        sortOrder === 'desc' ? (b.grade || 0) - (a.grade || 0) : (a.grade || 0) - (b.grade || 0)
    ) : [];

    const displayGrades = showAll ? sortedGrades : sortedGrades.slice(0, 10);

    const barChartData = {
        labels: displayGrades.filter(s => s.grade !== null).map(s => s.name),
        datasets: [{
            label: tTeacher('grade') || '成绩',
            data: displayGrades.filter(s => s.grade !== null).map(s => s.grade),
            backgroundColor: displayGrades.filter(s => s.grade !== null).map(s =>
                s.grade >= 90 ? 'rgba(76, 175, 80, 0.8)' :
                s.grade >= 60 ? 'rgba(33, 150, 243, 0.8)' :
                'rgba(244, 67, 54, 0.8)'
            )
        }]
    };

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
                        <Avatar sx={{ bgcolor: 'secondary.main', mr: 2, display: { xs: 'none', sm: 'flex' } }}>
                            <GradeIcon />
                        </Avatar>
                        <Box>
                            <Typography variant="h5" fontWeight={600} component="h1">
                                {tTeacher('gradeManagement') || '成绩管理'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {tTeacher('mySubjects')}: {subjectName}
                            </Typography>
                        </Box>
                    </Box>
                    <Box display="flex" alignItems="center" gap={2} alignSelf={{ xs: 'flex-start', sm: 'center' }}>
                        <Chip label={subjectName} color="secondary" variant="outlined" size={isMobile ? 'small' : 'medium'} />
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

            {/* 成绩预警 */}
            {failStudents.length > 0 && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    <Typography variant="body2">
                        <strong>{tTeacher('gradeWarning') || '成绩预警'}:</strong>
                        {failStudents.map(s => `${s.name}(${s.grade}分)`).join('、')} ({failStudents.length}{tTeacher('students') || '人'}不及格)
                    </Typography>
                </Alert>
            )}

            {/* Tab 切换 - 移动端使用下拉选择 */}
            <Paper sx={{ mb: 3 }}>
                <Hidden smDown implementation="css">
                    <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} variant="fullWidth">
                        <Tab label={tTeacher('addGrade') || '成绩录入'} />
                        <Tab label={tTeacher('gradeOverview') || '成绩概览'} />
                        <Tab label={tTeacher('gradeRanking') || '成绩排名'} />
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
                                <MenuItem value={0}>{tTeacher('addGrade') || '成绩录入'}</MenuItem>
                                <MenuItem value={1}>{tTeacher('gradeOverview') || '成绩概览'}</MenuItem>
                                <MenuItem value={2}>{tTeacher('gradeRanking') || '成绩排名'}</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </Hidden>
            </Paper>

            {/* Tab 1: 成绩录入 */}
            <Collapse in={tabValue === 0}>
                <Grid container spacing={3}>
                    {/* 成绩录入表格 */}
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
                                <Typography variant="h6">{tTeacher('addGrade') || '录入成绩'}</Typography>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => {
                                        const newData = {};
                                        sclassStudents.forEach(s => { newData[s._id] = 80; });
                                        setGradeData(newData);
                                    }}
                                >
                                    默认80分
                                </Button>
                            </Box>
                            <Divider sx={{ mb: 2 }} />

                            {loading ? (
                                <Box>{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} height={50} />)}</Box>
                            ) : (
                                <TableContainer sx={{ maxHeight: 400 }}>
                                    <Table stickyHeader size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ minWidth: { xs: 80, sm: 120 } }}>{tStudent('studentName')}</TableCell>
                                                <TableCell sx={{ minWidth: { xs: 60, sm: 80 } }}>{tStudent('studentId')}</TableCell>
                                                <TableCell align="center" sx={{ minWidth: 80 }}>{tTeacher('grade') || '成绩'}</TableCell>
                                                <TableCell align="center" sx={{ minWidth: 80 }}>{tTeacher('existingGrade') || '已有成绩'}</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {sclassStudents?.map((student) => {
                                                const existingGrade = stats?.studentGrades?.find(g => g.studentId === student._id)?.grade;
                                                return (
                                                    <TableRow key={student._id} hover>
                                                        <TableCell>{student.name}</TableCell>
                                                        <TableCell>{student.rollNum}</TableCell>
                                                        <TableCell align="center">
                                                            <TextField
                                                                type="number"
                                                                size="small"
                                                                value={gradeData[student._id] || ''}
                                                                onChange={(e) => handleGradeChange(student._id, e.target.value)}
                                                                placeholder="0-100"
                                                                sx={{ width: { xs: 60, sm: 100 } }}
                                                                inputProps={{ min: 0, max: 100 }}
                                                            />
                                                        </TableCell>
                                                        <TableCell align="center">
                                                            {existingGrade !== null && existingGrade !== undefined ? (
                                                                <Chip
                                                                    label={existingGrade}
                                                                    size="small"
                                                                    color={existingGrade >= 90 ? 'success' : existingGrade >= 60 ? 'primary' : 'error'}
                                                                />
                                                            ) : (
                                                                <Typography color="text.secondary">-</Typography>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}

                            <Box display="flex" gap={2} mt={2} flexDirection={{ xs: 'column', sm: 'row' }}>
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    onClick={handleSubmit}
                                    disabled={saving || Object.keys(gradeData).length === 0}
                                >
                                    {saving ? tCommon('loading') : tCommon('submit')}
                                </Button>
                                <Button variant="outlined" onClick={() => setGradeData({})}>
                                    {tCommon('reset')}
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* 成绩概览和图表 */}
                    <Grid item xs={12} lg={5}>
                        {/* 成绩概览 */}
                        <Card sx={{ mb: 3 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>{tTeacher('gradeOverview') || '成绩概览'}</Typography>
                                {statsLoading ? (
                                    <Skeleton variant="rectangular" height={100} />
                                ) : stats ? (
                                    <Grid container spacing={2}>
                                        <Grid item xs={6} sm={3} md={6}>
                                            <Box textAlign="center">
                                                <Typography variant="h4" color="primary">{stats.average}</Typography>
                                                <Typography variant="body2" color="text.secondary">{tTeacher('averageGrade') || '平均分'}</Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={6} sm={3} md={6}>
                                            <Box textAlign="center">
                                                <Typography variant="h4" color="success.main">{stats.passRate}%</Typography>
                                                <Typography variant="body2" color="text.secondary">{tTeacher('passRate') || '及格率'}</Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={6} sm={3} md={6}>
                                            <Box textAlign="center">
                                                <Typography variant="h5" color="success.main">{stats.max}</Typography>
                                                <Typography variant="body2" color="text.secondary">{tTeacher('highestGrade') || '最高分'}</Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={6} sm={3} md={6}>
                                            <Box textAlign="center">
                                                <Typography variant="h5" color="error.main">{stats.min}</Typography>
                                                <Typography variant="body2" color="text.secondary">{tTeacher('lowestGrade') || '最低分'}</Typography>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                ) : (
                                    <Typography color="text.secondary">{tCommon('none')}</Typography>
                                )}
                            </CardContent>
                        </Card>

                        {/* 成绩分布 */}
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>{tTeacher('gradeDistribution') || '成绩分布'}</Typography>
                                {statsLoading ? (
                                    <Skeleton variant="circular" width={150} height={150} sx={{ mx: 'auto' }} />
                                ) : distributionChartData ? (
                                    <Box sx={{ height: { xs: 150, sm: 200 }, display: 'flex', justifyContent: 'center' }}>
                                        <Doughnut data={distributionChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                                    </Box>
                                ) : (
                                    <Typography color="text.secondary">{tCommon('none')}</Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Collapse>

            {/* Tab 2: 成绩概览 */}
            <Collapse in={tabValue === 1}>
                <Grid container spacing={3}>
                    {/* 分布详情 */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>{tTeacher('gradeDistributionDetail') || '成绩分布详情'}</Typography>
                                {stats?.distribution && (
                                    <Box>
                                        {[
                                            { label: tTeacher('gradeExcellent') || '优秀(90+)', value: stats.distribution.excellent, color: 'success' },
                                            { label: tTeacher('gradeGood') || '良好(80-89)', value: stats.distribution.good, color: 'info' },
                                            { label: tTeacher('gradeAverage') || '中等(70-79)', value: stats.distribution.average, color: 'warning' },
                                            { label: tTeacher('gradePass') || '及格(60-69)', value: stats.distribution.pass, color: 'secondary' },
                                            { label: tTeacher('gradeFail') || '不及格(<60)', value: stats.distribution.fail, color: 'error' },
                                        ].map((item) => (
                                            <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', mb: 1, flexWrap: 'wrap' }}>
                                                <Chip label={item.label} size="small" color={item.color} sx={{ mr: 1, minWidth: { xs: 80, sm: 100 } }} />
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={stats.totalStudents > 0 ? (item.value / stats.totalStudents) * 100 : 0}
                                                    sx={{ flexGrow: 1, mr: 1 }}
                                                    color={item.color}
                                                />
                                                <Typography variant="body2" sx={{ minWidth: { xs: 30, sm: 40 } }}>
                                                    {item.value}{tTeacher('students') || '人'}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* 成绩统计 */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>{tTeacher('gradeStatistics') || '成绩统计'}</Typography>
                                {stats && (
                                    <Table size="small">
                                        <TableBody>
                                            <TableRow>
                                                <TableCell>{tTeacher('totalStudents') || '总人数'}</TableCell>
                                                <TableCell align="right">{stats.totalStudents}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>{tTeacher('passedStudents') || '及格人数'}</TableCell>
                                                <TableCell align="right">{stats.passCount}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>{tTeacher('failedStudents') || '不及格人数'}</TableCell>
                                                <TableCell align="right">{stats.failCount}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>{tTeacher('averageGrade') || '平均分'}</TableCell>
                                                <TableCell align="right">{stats.average}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>{tTeacher('passRate') || '及格率'}</TableCell>
                                                <TableCell align="right">{stats.passRate}%</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Collapse>

            {/* Tab 3: 成绩排名 */}
            <Collapse in={tabValue === 2}>
                <Paper sx={{ p: { xs: 1, sm: 2 } }}>
                    <Box
                        display="flex"
                        flexDirection={{ xs: 'column', sm: 'row' }}
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                        justifyContent="space-between"
                        mb={2}
                        gap={2}
                    >
                        <Typography variant="h6">{tTeacher('gradeRanking') || '成绩排名'}</Typography>
                        <Box
                            display="flex"
                            gap={2}
                            flexWrap="wrap"
                            alignSelf={{ xs: 'flex-start', sm: 'center' }}
                        >
                            <FormControl size="small" sx={{ minWidth: { xs: 100, sm: 120 } }}>
                                <InputLabel>{tTeacher('sortOrder') || '排序'}</InputLabel>
                                <Select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                                    <MenuItem value="desc">{tTeacher('highToLow') || '高分优先'}</MenuItem>
                                    <MenuItem value="asc">{tTeacher('lowToHigh') || '低分优先'}</MenuItem>
                                </Select>
                            </FormControl>
                            <Button variant="outlined" size="small" onClick={() => setShowAll(!showAll)}>
                                {showAll ? tTeacher('showTop10') || '仅显示前10' : tTeacher('showAll') || '显示全部'}
                            </Button>
                            <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={handleExportCSV}>
                                {tCommon('export')}
                            </Button>
                        </Box>
                    </Box>
                    <Divider sx={{ mb: 2 }} />

                    {statsLoading ? (
                        <Box>{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} height={50} />)}</Box>
                    ) : displayGrades ? (
                        <TableContainer sx={{ maxHeight: { xs: 300, sm: 400 } }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell align="center" sx={{ minWidth: { xs: 40, sm: 60 } }}>{tTeacher('rank') || '排名'}</TableCell>
                                        <TableCell sx={{ minWidth: { xs: 60, sm: 100 } }}>{tStudent('studentName')}</TableCell>
                                        <TableCell sx={{ minWidth: { xs: 50, sm: 80 } }}>{tStudent('studentId')}</TableCell>
                                        <TableCell align="center" sx={{ minWidth: { xs: 50, sm: 70 } }}>{tTeacher('grade')}</TableCell>
                                        <TableCell align="center" sx={{ minWidth: { xs: 60, sm: 80 } }}>{tTeacher('status')}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {displayGrades.map((student, idx) => (
                                        <TableRow
                                            key={student.studentId}
                                            hover
                                            onClick={() => setSelectedStudent(student)}
                                            sx={{ cursor: 'pointer' }}
                                        >
                                            <TableCell align="center">
                                                <Chip
                                                    label={idx + 1}
                                                    size="small"
                                                    color={idx < 3 ? 'success' : idx < 10 ? 'primary' : 'default'}
                                                />
                                            </TableCell>
                                            <TableCell>{student.name}</TableCell>
                                            <TableCell>{student.rollNum}</TableCell>
                                            <TableCell align="center">
                                                {student.grade !== null ? (
                                                    <Typography fontWeight="bold" color={student.grade >= 90 ? 'success.main' : student.grade >= 60 ? 'primary.main' : 'error.main'}>
                                                        {student.grade}
                                                    </Typography>
                                                ) : (
                                                    <Typography color="text.secondary">-</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell align="center">
                                                {student.grade !== null ? (
                                                    <Chip
                                                        label={student.grade >= 90 ? '优秀' : student.grade >= 80 ? '良好' : student.grade >= 60 ? '及格' : '不及格'}
                                                        size="small"
                                                        color={student.grade >= 90 ? 'success' : student.grade >= 60 ? 'primary' : 'error'}
                                                    />
                                                ) : (
                                                    <Chip label="未录入" size="small" variant="outlined" />
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

                {/* 成绩柱状图 */}
                <Card sx={{ mt: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>{tTeacher('gradeChart') || '成绩图表'}</Typography>
                        {barChartData && (
                            <Box sx={{ height: { xs: 200, sm: 300 } }}>
                                <Bar data={barChartData} options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: {
                                        y: { beginAtZero: true }
                                    }
                                }} />
                            </Box>
                        )}
                    </CardContent>
                </Card>
            </Collapse>

            {/* 学生成绩详情 Dialog */}
            <Dialog
                open={Boolean(selectedStudent)}
                onClose={() => setSelectedStudent(null)}
                maxWidth="sm"
                fullWidth
            >
                {selectedStudent && (
                    <>
                        <DialogTitle>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box display="flex" alignItems="center">
                                    <GradeIcon sx={{ mr: 1, color: 'secondary.main' }} />
                                    {selectedStudent.name} - {tTeacher('gradeDetails') || '成绩详情'}
                                </Box>
                                <IconButton onClick={() => setSelectedStudent(null)} size="small">
                                    <CloseIcon />
                                </IconButton>
                            </Box>
                        </DialogTitle>
                        <DialogContent dividers>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">{tStudent('studentId')}</Typography>
                                    <Typography variant="body1">{selectedStudent.rollNum}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">{tTeacher('currentGrade') || '当前成绩'}</Typography>
                                    <Typography
                                        variant="h4"
                                        color={selectedStudent.grade >= 90 ? 'success.main' : selectedStudent.grade >= 60 ? 'primary.main' : 'error.main'}
                                    >
                                        {selectedStudent.grade ?? '-'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>{tTeacher('status')}</Typography>
                                    <Chip
                                        label={selectedStudent.grade >= 90 ? '优秀' : selectedStudent.grade >= 80 ? '良好' : selectedStudent.grade >= 60 ? '及格' : selectedStudent.grade !== null ? '不及格' : '未录入'}
                                        color={selectedStudent.grade >= 90 ? 'success' : selectedStudent.grade >= 60 ? 'primary' : selectedStudent.grade !== null ? 'error' : 'default'}
                                    />
                                </Grid>
                            </Grid>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setSelectedStudent(null)}>{tCommon('close')}</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Container>
    );
};

export default TeacherGradeManagement;