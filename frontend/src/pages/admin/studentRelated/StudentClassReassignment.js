import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllStudents } from '../../../redux/studentRelated/studentHandle';
import { getAllSclasses } from '../../../redux/sclassRelated/sclassHandle';
import { updateUser } from '../../../redux/userRelated/userHandle';
import {
    Container,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Checkbox,
    Button,
    Box,
    Alert,
    Chip,
    Grid,
    Card,
    CardContent,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    LinearProgress
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { BlueButton, GreenButton, RedButton } from '../../../components/buttonStyles';
import Popup from '../../../components/Popup';
import { safeGet } from '../../../utils/safeAccess';

const StudentClassReassignment = () => {
    const dispatch = useDispatch();
    const { studentsList, loading } = useSelector((state) => state.student);
    const { sclassesList } = useSelector((state) => state.sclass);
    const { currentUser } = useSelector(state => state.user);

    const [selectedStudents, setSelectedStudents] = useState([]);
    const [targetClass, setTargetClass] = useState('');
    const [filterClass, setFilterClass] = useState('unassigned');
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [message, setMessage] = useState('');
    const [processedCount, setProcessedCount] = useState(0);

    const adminID = safeGet(currentUser, '_id');

    useEffect(() => {
        if (adminID) {
            dispatch(getAllStudents(adminID));
            dispatch(getAllSclasses(adminID, "Sclass"));
        }
    }, [dispatch, adminID]);

    // 过滤学生
    const getFilteredStudents = () => {
        if (!studentsList || !Array.isArray(studentsList)) return [];
        
        return studentsList.filter(student => {
            if (filterClass === 'unassigned') {
                return !safeGet(student, 'sclassName._id');
            } else if (filterClass === 'all') {
                return true;
            } else {
                return safeGet(student, 'sclassName._id') === filterClass;
            }
        });
    };

    const filteredStudents = getFilteredStudents();

    // 处理学生选择
    const handleStudentSelect = (studentId) => {
        setSelectedStudents(prev => {
            if (prev.includes(studentId)) {
                return prev.filter(id => id !== studentId);
            } else {
                return [...prev, studentId];
            }
        });
    };

    // 全选/取消全选
    const handleSelectAll = () => {
        if (selectedStudents.length === filteredStudents.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(filteredStudents.map(student => student._id));
        }
    };

    // 确认重新分配
    const handleReassign = () => {
        if (selectedStudents.length === 0) {
            setMessage('请选择要重新分配的学生');
            setShowPopup(true);
            return;
        }
        if (!targetClass) {
            setMessage('请选择目标班级');
            setShowPopup(true);
            return;
        }
        setShowConfirmDialog(true);
    };

    // 执行批量重新分配
    const executeReassignment = async () => {
        setShowConfirmDialog(false);
        setProcessing(true);
        setProcessedCount(0);

        try {
            const promises = selectedStudents.map(async (studentId, index) => {
                const updateData = { sclassName: targetClass };
                await dispatch(updateUser(updateData, studentId, "Student"));
                setProcessedCount(index + 1);
                return studentId;
            });

            await Promise.all(promises);

            setMessage(`成功重新分配 ${selectedStudents.length} 名学生到新班级！`);
            setShowPopup(true);
            setSelectedStudents([]);
            setTargetClass('');
            
            // 重新获取学生列表
            dispatch(getAllStudents(adminID));
        } catch (error) {
            setMessage('批量重新分配失败：' + (error.message || '未知错误'));
            setShowPopup(true);
        } finally {
            setProcessing(false);
        }
    };

    const getTargetClassName = () => {
        if (!targetClass || !sclassesList) return '';
        const targetClassObj = sclassesList.find(cls => cls._id === targetClass);
        return targetClassObj ? targetClassObj.sclassName : '';
    };

    const getUnassignedCount = () => {
        if (!studentsList) return 0;
        return studentsList.filter(student => !safeGet(student, 'sclassName._id')).length;
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center">
                学生班级重新分配
            </Typography>

            {/* 统计信息 */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="primary">
                                {studentsList ? studentsList.length : 0}
                            </Typography>
                            <Typography color="textSecondary">总学生数</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="warning.main">
                                {getUnassignedCount()}
                            </Typography>
                            <Typography color="textSecondary">未分配班级</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="success.main">
                                {selectedStudents.length}
                            </Typography>
                            <Typography color="textSecondary">已选择学生</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {getUnassignedCount() > 0 && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                    发现 {getUnassignedCount()} 名学生未分配班级，建议优先处理这些学生。
                </Alert>
            )}

            <Paper elevation={3} sx={{ p: 3 }}>
                {/* 筛选和操作区域 */}
                <Box sx={{ mb: 3 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={4}>
                            <FormControl fullWidth>
                                <InputLabel>筛选班级</InputLabel>
                                <Select
                                    value={filterClass}
                                    label="筛选班级"
                                    onChange={(e) => setFilterClass(e.target.value)}
                                >
                                    <MenuItem value="unassigned">未分配班级</MenuItem>
                                    <MenuItem value="all">所有学生</MenuItem>
                                    {sclassesList && sclassesList.map((classItem) => (
                                        <MenuItem key={classItem._id} value={classItem._id}>
                                            {classItem.sclassName}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <FormControl fullWidth>
                                <InputLabel>目标班级</InputLabel>
                                <Select
                                    value={targetClass}
                                    label="目标班级"
                                    onChange={(e) => setTargetClass(e.target.value)}
                                    disabled={processing}
                                >
                                    <MenuItem value="">
                                        <em>请选择目标班级</em>
                                    </MenuItem>
                                    {sclassesList && sclassesList.map((classItem) => (
                                        <MenuItem key={classItem._id} value={classItem._id}>
                                            {classItem.sclassName}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                    variant="outlined"
                                    onClick={handleSelectAll}
                                    disabled={processing || filteredStudents.length === 0}
                                >
                                    {selectedStudents.length === filteredStudents.length ? '取消全选' : '全选'}
                                </Button>
                                <GreenButton
                                    variant="contained"
                                    onClick={handleReassign}
                                    disabled={processing || selectedStudents.length === 0 || !targetClass}
                                >
                                    重新分配
                                </GreenButton>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>

                {processing && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" gutterBottom>
                            正在处理: {processedCount} / {selectedStudents.length}
                        </Typography>
                        <LinearProgress 
                            variant="determinate" 
                            value={(processedCount / selectedStudents.length) * 100} 
                        />
                    </Box>
                )}

                {/* 学生列表 */}
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        indeterminate={selectedStudents.length > 0 && selectedStudents.length < filteredStudents.length}
                                        checked={filteredStudents.length > 0 && selectedStudents.length === filteredStudents.length}
                                        onChange={handleSelectAll}
                                        disabled={processing}
                                    />
                                </TableCell>
                                <TableCell>学生姓名</TableCell>
                                <TableCell>学号</TableCell>
                                <TableCell>当前班级</TableCell>
                                <TableCell>状态</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredStudents.map((student) => (
                                <TableRow key={student._id} hover>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={selectedStudents.includes(student._id)}
                                            onChange={() => handleStudentSelect(student._id)}
                                            disabled={processing}
                                        />
                                    </TableCell>
                                    <TableCell>{student.name}</TableCell>
                                    <TableCell>{student.rollNum}</TableCell>
                                    <TableCell>
                                        {safeGet(student, 'sclassName.sclassName') || (
                                            <Chip label="未分配" color="warning" size="small" />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {selectedStudents.includes(student._id) ? (
                                            <Chip label="已选择" color="primary" size="small" />
                                        ) : (
                                            <Chip label="未选择" variant="outlined" size="small" />
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {filteredStudents.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="h6" color="textSecondary">
                            {filterClass === 'unassigned' ? '没有未分配班级的学生' : '没有找到符合条件的学生'}
                        </Typography>
                    </Box>
                )}
            </Paper>

            {/* 确认对话框 */}
            <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)}>
                <DialogTitle>确认批量重新分配</DialogTitle>
                <DialogContent>
                    <Typography>
                        您确定要将 <strong>{selectedStudents.length}</strong> 名学生重新分配到 
                        <strong>"{getTargetClassName()}"</strong> 班级吗？
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                        此操作将影响学生的课程安排和考勤记录，请谨慎操作。
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowConfirmDialog(false)}>取消</Button>
                    <RedButton onClick={executeReassignment} autoFocus>
                        确认重新分配
                    </RedButton>
                </DialogActions>
            </Dialog>

            <Popup message={message} setShowPopup={setShowPopup} showPopup={showPopup} />
        </Container>
    );
};

export default StudentClassReassignment;
