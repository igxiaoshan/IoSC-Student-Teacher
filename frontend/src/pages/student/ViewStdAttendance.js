import React, { useEffect, useState } from 'react'
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { BottomNavigation, BottomNavigationAction, Box, Button, Collapse, Paper, Table, TableBody, TableHead, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { getUserDetails } from '../../redux/userRelated/userHandle';
import { calculateOverallAttendancePercentage, calculateSubjectAttendancePercentage, groupAttendanceBySubject } from '../../components/attendanceCalculator';

import CustomBarChart from '../../components/CustomBarChart';
import { safeGet } from '../../utils/safeAccess';

import InsertChartIcon from '@mui/icons-material/InsertChart';
import InsertChartOutlinedIcon from '@mui/icons-material/InsertChartOutlined';
import TableChartIcon from '@mui/icons-material/TableChart';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import { StyledTableCell, StyledTableRow } from '../../components/styles';

const ViewStdAttendance = () => {
    const dispatch = useDispatch();

    const [openStates, setOpenStates] = useState({});

    const handleOpen = (subId) => {
        setOpenStates((prevState) => ({
            ...prevState,
            [subId]: !prevState[subId],
        }));
    };

    const { userDetails, currentUser, loading, response, error } = useSelector((state) => state.user);

    useEffect(() => {
        const userId = safeGet(currentUser, '_id');
        if (userId) {
            dispatch(getUserDetails(userId, "Student"));
        }
    }, [dispatch, currentUser]);

    if (response) { console.log(response) }
    else if (error) { console.log(error) }

    const [subjectAttendance, setSubjectAttendance] = useState([]);
    const [selectedSection, setSelectedSection] = useState('table');

    useEffect(() => {
        if (userDetails) {
            setSubjectAttendance(userDetails.attendance || []);
        }
    }, [userDetails])

    const attendanceBySubject = groupAttendanceBySubject(subjectAttendance)

    const overallAttendancePercentage = calculateOverallAttendancePercentage(subjectAttendance);

    const subjectData = Object.entries(attendanceBySubject).map(([subName, { subCode, present, sessions }]) => {
        const subjectAttendancePercentage = calculateSubjectAttendancePercentage(present, sessions);
        return {
            subject: subName,
            attendancePercentage: subjectAttendancePercentage,
            totalClasses: sessions,
            attendedClasses: present
        };
    });

    const handleSectionChange = (event, newSection) => {
        setSelectedSection(newSection);
    };

    const renderTableSection = () => {
        return (
            <>
                <Typography variant="h4" align="center" gutterBottom>
                    考勤
                </Typography>
                <Table>
                    <TableHead>
                        <StyledTableRow>
                            <StyledTableCell>科目</StyledTableCell>
                            <StyledTableCell>出席</StyledTableCell>
                            <StyledTableCell>总会议</StyledTableCell>
                            <StyledTableCell>出勤百分比</StyledTableCell>
                            <StyledTableCell align="center">操作</StyledTableCell>
                        </StyledTableRow>
                    </TableHead>
                    {Object.entries(attendanceBySubject).map(([subName, { present, allData, subId, sessions }], index) => {
                        const subjectAttendancePercentage = calculateSubjectAttendancePercentage(present, sessions);

                        return (
                            <TableBody key={index}>
                                <StyledTableRow>
                                    <StyledTableCell>{subName}</StyledTableCell>
                                    <StyledTableCell>{present}</StyledTableCell>
                                    <StyledTableCell>{sessions}</StyledTableCell>
                                    <StyledTableCell>{subjectAttendancePercentage}%</StyledTableCell>
                                    <StyledTableCell align="center">
                                        <Button variant="contained"
                                            onClick={() => handleOpen(subId)}>
                                            {openStates[subId] ? <KeyboardArrowUp /> : <KeyboardArrowDown />}详情
                                        </Button>
                                    </StyledTableCell>
                                </StyledTableRow>
                                <StyledTableRow>
                                    <StyledTableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                                        <Collapse in={openStates[subId]} timeout="auto" unmountOnExit>
                                            <Box sx={{ margin: 1 }}>
                                                <Typography variant="h6" gutterBottom component="div">
                                                    考勤详情
                                                </Typography>
                                                <Table size="small" aria-label="purchases">
                                                    <TableHead>
                                                        <StyledTableRow>
                                                            <StyledTableCell>日期</StyledTableCell>
                                                            <StyledTableCell align="right">状态</StyledTableCell>
                                                        </StyledTableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {allData.map((data, index) => {
                                                            const date = new Date(data.date);
                                                            const dateString = date.toString() !== "Invalid Date" ? date.toISOString().substring(0, 10) : "Invalid Date";
                                                            return (
                                                                <StyledTableRow key={index}>
                                                                    <StyledTableCell component="th" scope="row">
                                                                        {dateString}
                                                                    </StyledTableCell>
                                                                    <StyledTableCell align="right">{data.status}</StyledTableCell>
                                                                </StyledTableRow>
                                                            )
                                                        })}
                                                    </TableBody>
                                                </Table>
                                            </Box>
                                        </Collapse>
                                    </StyledTableCell>
                                </StyledTableRow>
                            </TableBody>
                        )
                    }
                    )}
                </Table>
                <div>
                    总考勤百分比: {overallAttendancePercentage.toFixed(2)}%
                </div>
            </>
        )
    }

    const renderChartSection = () => {
        return (
            <>
                <CustomBarChart chartData={subjectData} dataKey="attendancePercentage" />
            </>
        )
    };

    return (
        <>
            {loading
                ? (
                    <div>加载中...</div>
                )
                :
                <div>
                    {subjectAttendance && Array.isArray(subjectAttendance) && subjectAttendance.length > 0 ?
                        <>
                            {selectedSection === 'table' && renderTableSection()}
                            {selectedSection === 'chart' && renderChartSection()}

                            <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
                                <BottomNavigation value={selectedSection} onChange={handleSectionChange} showLabels>
                                    <BottomNavigationAction
                                        label="表格"
                                        value="table"
                                        icon={selectedSection === 'table' ? <TableChartIcon /> : <TableChartOutlinedIcon />}
                                    />
                                    <BottomNavigationAction
                                        label="图表"
                                        value="chart"
                                        icon={selectedSection === 'chart' ? <InsertChartIcon /> : <InsertChartOutlinedIcon />}
                                    />
                                </BottomNavigation>
                            </Paper>
                        </>
                        :
                        <>
                            <Typography variant="h6" gutterBottom component="div">
                                暂无更多考勤详细信息
                            </Typography>
                        </>
                    }
                </div>
            }
        </>
    )
}

export default ViewStdAttendance