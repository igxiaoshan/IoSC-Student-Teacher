import { useEffect } from "react";
import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom'
import { getClassStudents, getClassOverviewStats } from "../../redux/sclassRelated/sclassHandle";
import { useTranslation } from '../../hooks/useTranslation';
import useTeacherClassData from '../../hooks/useTeacherClassData';
import {
    Paper, Box, Typography, ButtonGroup, Button, Popper, Grow, ClickAwayListener,
    MenuList, MenuItem, Grid, Card, CardContent, Chip, Avatar, Divider, IconButton,
    Tooltip
} from '@mui/material';
import { BlackButton, BlueButton } from "../../components/buttonStyles";
import TableTemplate from "../../components/TableTemplate";
import { KeyboardArrowDown, KeyboardArrowUp, People as PeopleIcon,
    Assessment as AssessmentIcon, Event as EventIcon, TrendingUp as TrendingUpIcon } from "@mui/icons-material";
import { safeGet } from '../../utils/safeAccess';

const TeacherClassDetails = () => {
    const navigate = useNavigate()
    const dispatch = useDispatch();
    const { tStudent, tTeacher, tClass, tCommon, tDashboard } = useTranslation();
    const { sclassStudents, loading, error, getresponse, classOverviewStats, overviewLoading } = useSelector((state) => state.sclass);

    const { currentUser } = useSelector((state) => state.user);
    const classID = safeGet(currentUser, 'teachSclass._id');
    const subjectID = safeGet(currentUser, 'teachSubject._id');
    const className = safeGet(currentUser, 'teachSclass.sclassName', tClass('unassignedClass'));
    const subjectName = safeGet(currentUser, 'teachSubject.subName', tTeacher('unassignedSubject'));

    // 使用共享数据 hook 监听刷新触发器
    const { refreshTriggers } = useTeacherClassData(classID, {
        autoFetch: false,
        fetchStudents: false,
        fetchOverview: false // hook 只监听刷新触发器，不自动获取
    });

    // 组件自行管理数据获取
    useEffect(() => {
        if (classID) {
            dispatch(getClassStudents(classID));
            dispatch(getClassOverviewStats(classID));
        }
    }, [dispatch, classID])

    // 监听考勤/成绩更新，刷新数据
    useEffect(() => {
        if (refreshTriggers.attendance || refreshTriggers.grades) {
            dispatch(getClassStudents(classID));
            dispatch(getClassOverviewStats(classID));
        }
    }, [refreshTriggers.attendance, refreshTriggers.grades, dispatch, classID]);

    if (error) {
        console.log(error)
    }

    const studentColumns = [
        { id: 'name', label: tStudent('studentName'), minWidth: 170 },
        { id: 'rollNum', label: tStudent('studentId'), minWidth: 100 },
    ]

    const studentRows = (sclassStudents || []).map((student) => {
        return {
            name: student.name,
            rollNum: student.rollNum,
            id: student._id,
        };
    })

    // 使用真实统计数据（从 API 获取）
    const classStats = {
        totalStudents: classOverviewStats?.totalStudents || studentRows.length,
        presentToday: classOverviewStats?.presentToday || 0,
        avgScore: classOverviewStats?.avgScore ? classOverviewStats.avgScore.toFixed(1) : '-',
        completedLessons: classOverviewStats?.completedLessons || 0,
        attendanceRate: classOverviewStats?.attendanceRate ? (classOverviewStats.attendanceRate * 100).toFixed(1) : 0,
        passRate: classOverviewStats?.passRate ? (classOverviewStats.passRate * 100).toFixed(1) : 0
    };

    const StudentsButtonHaver = ({ row }) => {
        const options = [tStudent('attendance'), tStudent('provideGrades')];

        const [open, setOpen] = React.useState(false);
        const anchorRef = React.useRef(null);
        const [selectedIndex, setSelectedIndex] = React.useState(0);

        const handleClick = () => {
            console.info(`You clicked ${options[selectedIndex]}`);
            if (selectedIndex === 0) {
                handleAttendance();
            } else if (selectedIndex === 1) {
                handleMarks();
            }
        };

        const handleAttendance = () => {
            navigate(`/Teacher/class/student/attendance/${row.id}/${subjectID}`)
        }
        const handleMarks = () => {
            navigate(`/Teacher/class/student/marks/${row.id}/${subjectID}`)
        };

        const handleMenuItemClick = (event, index) => {
            setSelectedIndex(index);
            setOpen(false);
        };

        const handleToggle = () => {
            setOpen((prevOpen) => !prevOpen);
        };

        const handleClose = (event) => {
            if (anchorRef.current && anchorRef.current.contains(event.target)) {
                return;
            }

            setOpen(false);
        };
        return (
            <>
                <BlueButton
                    variant="contained"
                    onClick={() =>
                        navigate("/Teacher/class/student/" + row.id)
                    }
                >
                    {tCommon('view')}
                </BlueButton>
                <React.Fragment>
                    <ButtonGroup variant="contained" ref={anchorRef} aria-label="split button">
                        <Button onClick={handleClick}>{options[selectedIndex]}</Button>
                        <BlackButton
                            size="small"
                            aria-controls={open ? 'split-button-menu' : undefined}
                            aria-expanded={open ? 'true' : undefined}
                            aria-label="select merge strategy"
                            aria-haspopup="menu"
                            onClick={handleToggle}
                        >
                            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                        </BlackButton>
                    </ButtonGroup>
                    <Popper
                        sx={{
                            zIndex: 1,
                        }}
                        open={open}
                        anchorEl={anchorRef.current}
                        role={undefined}
                        transition
                        disablePortal
                    >
                        {({ TransitionProps, placement }) => (
                            <Grow
                                {...TransitionProps}
                                style={{
                                    transformOrigin:
                                        placement === 'bottom' ? 'center top' : 'center bottom',
                                }}
                            >
                                <Paper>
                                    <ClickAwayListener onClickAway={handleClose}>
                                        <MenuList id="split-button-menu" autoFocusItem>
                                            {options.map((option, index) => (
                                                <MenuItem
                                                    key={option}
                                                    disabled={index === 2}
                                                    selected={index === selectedIndex}
                                                    onClick={(event) => handleMenuItemClick(event, index)}
                                                >
                                                    {option}
                                                </MenuItem>
                                            ))}
                                        </MenuList>
                                    </ClickAwayListener>
                                </Paper>
                            </Grow>
                        )}
                    </Popper>
                </React.Fragment>
            </>
        );
    };

    // 快速操作卡片
    const quickActions = [
        { label: tTeacher('attendanceManagement'), icon: <EventIcon />, action: () => navigate('/Teacher/attendance') },
        { label: tTeacher('gradeManagement'), icon: <AssessmentIcon />, action: () => navigate('/Teacher/grades') },
        { label: tTeacher('studentProgress'), icon: <TrendingUpIcon />, action: () => navigate('/Teacher/progress') },
    ];

    return (
        <>
            {loading ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography>{tCommon('loading')}</Typography>
                </Box>
            ) : (
                <Box sx={{ p: 2 }}>
                    {/* 班级概览头部 */}
                    <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                            <Box display="flex" alignItems="center">
                                <Avatar sx={{ width: 56, height: 56, bgcolor: '#7f56da', mr: 2 }}>
                                    <PeopleIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="h5" fontWeight={600}>
                                        {className}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {tTeacher('mySubjects')}: {subjectName}
                                    </Typography>
                                </Box>
                            </Box>
                            <Chip label={tTeacher('classDetails')} color="primary" variant="outlined" />
                        </Box>

                        {/* 统计卡片 */}
                        <Grid container spacing={2}>
                            <Grid item xs={6} sm={3}>
                                <Card sx={{ bgcolor: 'primary.light', borderRadius: 2 }}>
                                    <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                                        <Typography variant="h4" fontWeight={600} color="primary.dark">
                                            {classStats.totalStudents}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {tClass('studentCount')}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <Card sx={{ bgcolor: 'success.light', borderRadius: 2 }}>
                                    <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                                        <Typography variant="h4" fontWeight={600} color="success.dark">
                                            {classStats.presentToday}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {tDashboard('todayAttendance')}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <Card sx={{ bgcolor: 'warning.light', borderRadius: 2 }}>
                                    <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                                        <Typography variant="h4" fontWeight={600} color="warning.dark">
                                            {classStats.avgScore}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {tTeacher('performanceAnalysis')}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <Card sx={{ bgcolor: 'info.light', borderRadius: 2 }}>
                                    <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                                        <Typography variant="h4" fontWeight={600} color="info.dark">
                                            {classStats.completedLessons}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {tTeacher('totalLessons')}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* 快速操作 */}
                    <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            {tDashboard('quickActions')}
                        </Typography>
                        <Box display="flex" gap={2} flexWrap="wrap">
                            {quickActions.map((action, index) => (
                                <Button
                                    key={index}
                                    variant="outlined"
                                    startIcon={action.icon}
                                    onClick={action.action}
                                    sx={{ borderRadius: 2 }}
                                >
                                    {action.label}
                                </Button>
                            ))}
                        </Box>
                    </Paper>

                    {/* 学生列表 */}
                    {getresponse ? (
                        <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
                            <PeopleIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
                            <Typography variant="h6" gutterBottom color="text.secondary">
                                {tStudent('noAttendanceRecord')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                {tTeacher('unassignedClass')}
                            </Typography>
                        </Paper>
                    ) : (
                        <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2 }}>
                            <Box display="flex" alignItems="center" justifyContent="space-between" p={2}>
                                <Typography variant="h6">
                                    {tStudent('studentList')} ({classStats.totalStudents})
                                </Typography>
                                <Box display="flex" gap={1}>
                                    <Tooltip title={tTeacher('batchAttendance') || '批量考勤'}>
                                        <IconButton color="primary" onClick={() => navigate('/Teacher/attendance')}>
                                            <EventIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title={tTeacher('batchGrades') || '批量成绩'}>
                                        <IconButton color="secondary" onClick={() => navigate('/Teacher/grades')}>
                                            <AssessmentIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title={tTeacher('studentProgress')}>
                                        <IconButton onClick={() => navigate('/Teacher/progress')}>
                                            <TrendingUpIcon />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </Box>
                            <Divider />
                            {Array.isArray(sclassStudents) && sclassStudents.length > 0 &&
                                <TableTemplate buttonHaver={StudentsButtonHaver} columns={studentColumns} rows={studentRows} />
                            }
                        </Paper>
                    )}
                </Box>
            )}
        </>
    );
};

export default TeacherClassDetails;