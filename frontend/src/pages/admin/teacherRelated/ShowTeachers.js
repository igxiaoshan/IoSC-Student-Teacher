import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom'
import { getAllTeachers } from '../../../redux/teacherRelated/teacherHandle';
import { useTranslation } from '../../../hooks/useTranslation';
import {
    Paper, Table, TableBody, TableContainer,
    TableHead, TablePagination, Button, Box, IconButton,
    Alert, Typography, CircularProgress
} from '@mui/material';

import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import { StyledTableCell, StyledTableRow } from '../../../components/styles';
import { BlueButton, GreenButton } from '../../../components/buttonStyles';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import SpeedDialTemplate from '../../../components/SpeedDialTemplate';
import Popup from '../../../components/Popup';
import { mapSafeTeacherData, safeGet } from '../../../utils/safeAccess';
import TeacherClassManager from './TeacherClassManager';

const ShowTeachers = () => {
    const { tTeacher, tCommon, tTable, tSubject, tClass } = useTranslation();
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { teachersList, loading, error, response } = useSelector((state) => state.teacher);
    const { currentUser } = useSelector((state) => state.user);

    useEffect(() => {
        const adminId = safeGet(currentUser, '_id');
        if (adminId) {
            dispatch(getAllTeachers(adminId));
        }
    }, [currentUser, dispatch]);

    const [showPopup, setShowPopup] = useState(false);
    const [message, setMessage] = useState("");
    const [classManagerOpen, setClassManagerOpen] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState(null);

    // 调试信息
    console.log('ShowTeachers - teachersList:', teachersList);
    console.log('ShowTeachers - loading:', loading);
    console.log('ShowTeachers - error:', error);
    console.log('ShowTeachers - response:', response);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>{tCommon('loading')}</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {tTeacher('getTeacherListFailed')}: {error}
                </Alert>
                <Button variant="contained" onClick={() => dispatch(getAllTeachers(safeGet(currentUser, '_id')))}>
                    {tCommon('retry')}
                </Button>
            </Box>
        );
    }

    if (response) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                    {response}
                </Alert>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                    <GreenButton variant="contained" onClick={() => navigate("/Admin/teachers/chooseclass")}>
                        {tTeacher('addTeacher')}
                    </GreenButton>
                </Box>
            </Box>
        );
    }

    const deleteHandler = (deleteID, address) => {
        console.log(deleteID);
        console.log(address);
        setMessage("Sorry the delete function has been disabled for now.")
        setShowPopup(true)

        // dispatch(deleteUser(deleteID, address)).then(() => {
        //     dispatch(getAllTeachers(currentUser._id));
        // });
    };

    const columns = [
        { id: 'name', label: tTeacher('teacherName'), minWidth: 170 },
        { id: 'teachSubject', label: tSubject('subjectName'), minWidth: 100 },
        { id: 'teachSclass', label: tClass('primaryClass'), minWidth: 150 },
        { id: 'classCount', label: tClass('classCount'), minWidth: 80 },
        { id: 'classNames', label: tClass('allClasses'), minWidth: 200 },
    ];

    // 使用安全映射函数处理教师数据
    const rows = mapSafeTeacherData(teachersList);

    console.log('ShowTeachers - processed rows:', rows);

    const handleManageClasses = (teacher) => {
        setSelectedTeacher(teacher);
        setClassManagerOpen(true);
    };

    const handleClassManagerUpdate = () => {
        // 重新获取教师列表
        dispatch(getAllTeachers(currentUser._id));
        setMessage("班级关联更新成功！");
        setShowPopup(true);
    };

    const actions = [
        {
            icon: <PersonAddAlt1Icon color="primary" />, name: tTeacher('addTeacher'),
            action: () => navigate("/Admin/teachers/chooseclass")
        },
        {
            icon: <PersonRemoveIcon color="error" />, name: tTeacher('deleteAllTeachers'),
            action: () => deleteHandler(currentUser._id, "Teachers")
        },
    ];

    // 如果没有教师数据，显示空状态
    if (!teachersList || teachersList.length === 0) {
        return (
            <Paper sx={{ width: '100%', overflow: 'hidden', p: 3 }}>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                        暂无教师数据
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                        还没有添加任何教师，点击下方按钮开始添加教师
                    </Typography>
                    <GreenButton variant="contained" onClick={() => navigate("/Admin/teachers/chooseclass")}>
                        添加教师
                    </GreenButton>
                </Box>
            </Paper>
        );
    }

    return (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            {/* 调试信息 */}
            <Box sx={{ p: 2, bgcolor: 'grey.100', borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="body2">
                    调试信息: 教师总数 {teachersList.length}, 处理后行数 {rows.length}
                </Typography>
            </Box>

            <TableContainer>
                <Table stickyHeader aria-label="sticky table">
                    <TableHead>
                        <StyledTableRow>
                            {columns.map((column) => (
                                <StyledTableCell
                                    key={column.id}
                                    align={column.align}
                                    style={{ minWidth: column.minWidth }}
                                >
                                    {column.label}
                                </StyledTableCell>
                            ))}
                            <StyledTableCell align="center">
                                {tTable('actions')}
                            </StyledTableCell>
                        </StyledTableRow>
                    </TableHead>
                    <TableBody>
                        {rows
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((row) => {
                                return (
                                    <StyledTableRow hover role="checkbox" tabIndex={-1} key={row.id}>
                                        {columns.map((column) => {
                                            const value = row[column.id];
                                            if (column.id === 'teachSubject') {
                                                return (
                                                    <StyledTableCell key={column.id} align={column.align}>
                                                        {value ? (
                                                            value
                                                        ) : (
                                                            <Button variant="contained"
                                                                onClick={() => {
                                                                    navigate(`/Admin/teachers/choosesubject/${row.teachSclassID}/${row.id}`)
                                                                }}>
                                                                Add Subject
                                                            </Button>
                                                        )}
                                                    </StyledTableCell>
                                                );
                                            }
                                            return (
                                                <StyledTableCell key={column.id} align={column.align}>
                                                    {column.format && typeof value === 'number' ? column.format(value) : value}
                                                </StyledTableCell>
                                            );
                                        })}
                                        <StyledTableCell align="center">
                                            <IconButton onClick={() => deleteHandler(row.id, "Teacher")}>
                                                <PersonRemoveIcon color="error" />
                                            </IconButton>
                                            <BlueButton variant="contained"
                                                onClick={() => navigate("/Admin/teachers/teacher/" + row.id)}>
                                                View
                                            </BlueButton>
                                            {row.classCount > 1 && (
                                                <GreenButton variant="outlined" size="small"
                                                    onClick={() => handleManageClasses(row)}
                                                    sx={{ ml: 1 }}>
                                                    Manage Classes
                                                </GreenButton>
                                            )}
                                        </StyledTableCell>
                                    </StyledTableRow>
                                );
                            })}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[5, 10, 25, 100]}
                component="div"
                count={rows.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(event, newPage) => setPage(newPage)}
                onRowsPerPageChange={(event) => {
                    setRowsPerPage(parseInt(event.target.value, 5));
                    setPage(0);
                }}
            />

            <SpeedDialTemplate actions={actions} />
            <Popup message={message} setShowPopup={setShowPopup} showPopup={showPopup} />

            {/* 教师班级管理对话框 */}
            <TeacherClassManager
                open={classManagerOpen}
                onClose={() => setClassManagerOpen(false)}
                teacher={selectedTeacher}
                onUpdate={handleClassManagerUpdate}
            />
        </Paper >
    );
};

export default ShowTeachers