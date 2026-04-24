import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getUserDetails } from '../../redux/userRelated/userHandle';
import { useNavigate, useParams } from 'react-router-dom'
import {
    Box, Button, Collapse, Table, TableBody, TableHead, Typography,
    Container, Card, CardContent, Grid, Divider, Chip, Paper
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { calculateOverallAttendancePercentage, calculateSubjectAttendancePercentage, groupAttendanceBySubject } from '../../components/attendanceCalculator';
import CustomPieChart from '../../components/CustomPieChart'
import { PurpleButton } from '../../components/buttonStyles';
import { StyledTableCell, StyledTableRow } from '../../components/styles';
import { useTranslation } from '../../hooks/useTranslation';
import { safeGet } from '../../utils/safeAccess';

const TeacherViewStudent = () => {

    const navigate = useNavigate()
    const params = useParams()
    const dispatch = useDispatch();
    const { currentUser, userDetails, response, loading, error } = useSelector((state) => state.user);
    const { tTeacher, tStudent, tCommon } = useTranslation();

    const address = "Student"
    const studentID = params.id
    const teachSubject = currentUser.teachSubject?.subName
    const teachSubjectID = currentUser.teachSubject?._id

    useEffect(() => {
        dispatch(getUserDetails(studentID, address));
    }, [dispatch, studentID]);

    if (response) { console.log(response) }
    else if (error) { console.log(error) }

    const [sclassName, setSclassName] = useState('');
    const [studentSchool, setStudentSchool] = useState('');
    const [subjectMarks, setSubjectMarks] = useState('');
    const [subjectAttendance, setSubjectAttendance] = useState([]);

    const [openStates, setOpenStates] = useState({});

    const handleOpen = (subId) => {
        setOpenStates((prevState) => ({
            ...prevState,
            [subId]: !prevState[subId],
        }));
    };

    useEffect(() => {
        if (userDetails) {
            setSclassName(userDetails.sclassName || '');
            setStudentSchool(userDetails.school || '');
            setSubjectMarks(userDetails.examResult || '');
            setSubjectAttendance(userDetails.attendance || []);
        }
    }, [userDetails]);

    const overallAttendancePercentage = calculateOverallAttendancePercentage(subjectAttendance);
    const overallAbsentPercentage = 100 - overallAttendancePercentage;

    const chartData = [
        { name: tTeacher('present'), value: overallAttendancePercentage },
        { name: tTeacher('absent'), value: overallAbsentPercentage }
    ];

    return (
        <>
            {loading
                ?
                <Container maxWidth="lg" sx={{ mt: 4 }}><Typography>{tCommon('loading')}</Typography></Container>
                :
                <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                    {/* 学生信息卡片 */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                            {tStudent('studentDetails')}
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6} md={3}>
                                <Typography variant="body2" color="text.secondary">{tStudent('studentName')}</Typography>
                                <Typography variant="body1" fontWeight="medium">{userDetails.name}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Typography variant="body2" color="text.secondary">{tTeacher('rollNum')}</Typography>
                                <Typography variant="body1" fontWeight="medium">{userDetails.rollNum}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Typography variant="body2" color="text.secondary">{tTeacher('className')}</Typography>
                                <Typography variant="body1" fontWeight="medium">{sclassName.sclassName}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Typography variant="body2" color="text.secondary">{tTeacher('school')}</Typography>
                                <Typography variant="body1" fontWeight="medium">{studentSchool.schoolName}</Typography>
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* 考勤信息 */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                    {tTeacher('attendance')}
                                </Typography>
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() => navigate(`/Teacher/class/student/attendance/${studentID}/${teachSubjectID}`)}
                                >
                                    {tTeacher('addAttendance')}
                                </Button>
                            </Box>
                            <Divider sx={{ mb: 2 }} />
                            {subjectAttendance && Array.isArray(subjectAttendance) && subjectAttendance.length > 0
                                ?
                                <>
                                    {Object.entries(groupAttendanceBySubject(subjectAttendance)).map(([subName, { present, allData, subId, sessions }], index) => {
                                        if (subName === teachSubject) {
                                            const subjectAttendancePercentage = calculateSubjectAttendancePercentage(present, sessions);

                                            return (
                                                <Box key={index} sx={{ mb: 2 }}>
                                                    <Table>
                                                        <TableHead>
                                                            <StyledTableRow>
                                                                <StyledTableCell>{tTeacher('subject')}</StyledTableCell>
                                                                <StyledTableCell>{tTeacher('present')}</StyledTableCell>
                                                                <StyledTableCell>{tTeacher('sessions')}</StyledTableCell>
                                                                <StyledTableCell>{tTeacher('attendancePercentage')}</StyledTableCell>
                                                                <StyledTableCell align="center">{tTeacher('actions')}</StyledTableCell>
                                                            </StyledTableRow>
                                                        </TableHead>

                                                        <TableBody>
                                                            <StyledTableRow>
                                                                <StyledTableCell>{subName}</StyledTableCell>
                                                                <StyledTableCell>{present}</StyledTableCell>
                                                                <StyledTableCell>{sessions}</StyledTableCell>
                                                                <StyledTableCell>
                                                                    <Chip
                                                                        label={`${subjectAttendancePercentage}%`}
                                                                        size="small"
                                                                        color={subjectAttendancePercentage >= 80 ? 'success' : subjectAttendancePercentage >= 60 ? 'warning' : 'error'}
                                                                    />
                                                                </StyledTableCell>
                                                                <StyledTableCell align="center">
                                                                    <Button variant="outlined" size="small" onClick={() => handleOpen(subId)}>
                                                                        {openStates[subId] ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                                                                        {tTeacher('details')}
                                                                    </Button>
                                                                </StyledTableCell>
                                                            </StyledTableRow>
                                                            <StyledTableRow>
                                                                <StyledTableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                                                                    <Collapse in={openStates[subId]} timeout="auto" unmountOnExit>
                                                                        <Box sx={{ margin: 1 }}>
                                                                            <Typography variant="subtitle2" gutterBottom>
                                                                                {tTeacher('attendanceDetails')}
                                                                            </Typography>
                                                                            <Table size="small">
                                                                                <TableHead>
                                                                                    <StyledTableRow>
                                                                                        <StyledTableCell>{tTeacher('date')}</StyledTableCell>
                                                                                        <StyledTableCell align="right">{tTeacher('status')}</StyledTableCell>
                                                                                    </StyledTableRow>
                                                                                </TableHead>
                                                                                <TableBody>
                                                                                    {allData.map((data, idx) => {
                                                                                        const date = new Date(data.date);
                                                                                        const dateString = date.toString() !== "Invalid Date" ? date.toISOString().substring(0, 10) : "Invalid Date";
                                                                                        return (
                                                                                            <StyledTableRow key={idx}>
                                                                                                <StyledTableCell component="th" scope="row">
                                                                                                    {dateString}
                                                                                                </StyledTableCell>
                                                                                                <StyledTableCell align="right">
                                                                                                    <Chip
                                                                                                        label={data.status === 'Present' ? tTeacher('present') : tTeacher('absent')}
                                                                                                        size="small"
                                                                                                        color={data.status === 'Present' ? 'success' : 'error'}
                                                                                                    />
                                                                                                </StyledTableCell>
                                                                                            </StyledTableRow>
                                                                                        );
                                                                                    })}
                                                                                </TableBody>
                                                                            </Table>
                                                                        </Box>
                                                                    </Collapse>
                                                                </StyledTableCell>
                                                            </StyledTableRow>
                                                        </TableBody>
                                                    </Table>
                                                </Box>
                                            )
                                        }
                                        return null
                                    })}
                                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Typography variant="body1">
                                            {tTeacher('totalAttendancePercentage')}: <strong>{overallAttendancePercentage.toFixed(2)}%</strong>
                                        </Typography>
                                    </Box>
                                    <Box sx={{ mt: 2, maxWidth: 300 }}>
                                        <CustomPieChart data={chartData} />
                                    </Box>
                                </>
                                :
                                <Typography color="text.secondary">{tStudent('noAttendanceRecord')}</Typography>
                            }
                        </CardContent>
                    </Card>

                    {/* 成绩信息 */}
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                    {tTeacher('subjectGrades')}
                                </Typography>
                                <PurpleButton
                                    variant="contained"
                                    size="small"
                                    onClick={() => navigate(`/Teacher/class/student/marks/${studentID}/${teachSubjectID}`)}
                                >
                                    {tTeacher('addGrade')}
                                </PurpleButton>
                            </Box>
                            <Divider sx={{ mb: 2 }} />
                            {subjectMarks && Array.isArray(subjectMarks) && subjectMarks.length > 0
                                ?
                                <>
                                    {subjectMarks.map((result, index) => {
                                        if (result.subName.subName === teachSubject) {
                                            return (
                                                <Table key={index}>
                                                    <TableHead>
                                                        <StyledTableRow>
                                                            <StyledTableCell>{tTeacher('subjectName')}</StyledTableCell>
                                                            <StyledTableCell>{tTeacher('grade')}</StyledTableCell>
                                                        </StyledTableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        <StyledTableRow>
                                                            <StyledTableCell>{result.subName.subName}</StyledTableCell>
                                                            <StyledTableCell>
                                                                <Chip
                                                                    label={result.marksObtained}
                                                                    color={result.marksObtained >= 90 ? 'success' : result.marksObtained >= 60 ? 'primary' : 'error'}
                                                                />
                                                            </StyledTableCell>
                                                        </StyledTableRow>
                                                    </TableBody>
                                                </Table>
                                            )
                                        }
                                        return null
                                    })}
                                </>
                                :
                                <Typography color="text.secondary">{tCommon('none')}</Typography>
                            }
                        </CardContent>
                    </Card>
                </Container>
            }
        </>
    )
}

export default TeacherViewStudent