import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getAllTeachers } from '../../../redux/teacherRelated/teacherHandle';
import {
    Paper,
    Table,
    TableBody,
    TableContainer,
    TableHead,
    TableRow,
    TableCell,
    TablePagination,
    Button,
    Box,
    IconButton,
    Alert,
    Typography,
    CircularProgress,
    Chip,
    Card,
    CardContent,
    Grid,
    TextField,
    InputAdornment,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
    Search as SearchIcon,
    PersonAdd as PersonAddIcon,
    School as SchoolIcon,
    Class as ClassIcon
} from '@mui/icons-material';
import { BlueButton, GreenButton, RedButton } from '../../../components/buttonStyles';
import { safeGet, mapSafeTeacherData } from '../../../utils/safeAccess';
import Popup from '../../../components/Popup';

const EnhancedTeacherList = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    const { teachersList, loading, error, response, pagination } = useSelector((state) => state.teacher);
    const { currentUser } = useSelector(state => state.user);

    // 本地状态
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showPopup, setShowPopup] = useState(false);
    const [message, setMessage] = useState('');

    const adminId = safeGet(currentUser, '_id');

    useEffect(() => {
        if (adminId) {
            dispatch(getAllTeachers(adminId));
        }
    }, [adminId, dispatch]);

    // 处理教师数据
    const processedTeachers = mapSafeTeacherData(teachersList || []);

    // 过滤教师数据
    const filteredTeachers = processedTeachers.filter(teacher => {
        const matchesSearch = !searchTerm || 
            teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            teacher.teachSubject.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || teacher.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    // 分页数据
    const paginatedTeachers = filteredTeachers.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleEdit = (teacherId) => {
        navigate(`/Admin/teachers/edit/${teacherId}`);
    };

    const handleView = (teacherId) => {
        navigate(`/Admin/teachers/teacher/${teacherId}`);
    };

    const handleDelete = (teacherId) => {
        setMessage('删除功能暂时禁用');
        setShowPopup(true);
    };

    const handleAddTeacher = () => {
        navigate('/Admin/teachers/chooseclass');
    };

    // 获取状态颜色
    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'success';
            case 'inactive': return 'default';
            case 'suspended': return 'error';
            default: return 'default';
        }
    };

    // 获取状态文本
    const getStatusText = (status) => {
        switch (status) {
            case 'active': return '在职';
            case 'inactive': return '离职';
            case 'suspended': return '停职';
            default: return '未知';
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <CircularProgress size={60} />
                <Typography sx={{ ml: 2, fontSize: '1.2rem' }}>加载教师列表中...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Paper sx={{ p: 3 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="h6">获取教师列表失败</Typography>
                    <Typography>{error}</Typography>
                </Alert>
                <Button 
                    variant="contained" 
                    onClick={() => dispatch(getAllTeachers(adminId))}
                    startIcon={<SearchIcon />}
                >
                    重新加载
                </Button>
            </Paper>
        );
    }

    if (response && (!teachersList || teachersList.length === 0)) {
        return (
            <Paper sx={{ p: 4 }}>
                <Box sx={{ textAlign: 'center' }}>
                    <SchoolIcon sx={{ fontSize: 80, color: 'grey.400', mb: 2 }} />
                    <Typography variant="h5" gutterBottom color="textSecondary">
                        暂无教师数据
                    </Typography>
                    <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
                        还没有添加任何教师，点击下方按钮开始添加教师
                    </Typography>
                    <GreenButton 
                        variant="contained" 
                        size="large"
                        onClick={handleAddTeacher}
                        startIcon={<PersonAddIcon />}
                    >
                        添加第一个教师
                    </GreenButton>
                </Box>
            </Paper>
        );
    }

    return (
        <Box>
            {/* 统计卡片 */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="primary">
                                {processedTeachers.length}
                            </Typography>
                            <Typography color="textSecondary">总教师数</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="success.main">
                                {processedTeachers.filter(t => t.status === 'active').length}
                            </Typography>
                            <Typography color="textSecondary">在职教师</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="info.main">
                                {processedTeachers.filter(t => t.classCount > 1).length}
                            </Typography>
                            <Typography color="textSecondary">多班级教师</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="warning.main">
                                {processedTeachers.filter(t => !t.teachSubject || t.teachSubject === '未分配科目').length}
                            </Typography>
                            <Typography color="textSecondary">未分配科目</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                {/* 搜索和筛选 */}
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6} md={4}>
                            <TextField
                                fullWidth
                                placeholder="搜索教师姓名、邮箱或科目..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth>
                                <InputLabel>状态筛选</InputLabel>
                                <Select
                                    value={statusFilter}
                                    label="状态筛选"
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <MenuItem value="all">全部状态</MenuItem>
                                    <MenuItem value="active">在职</MenuItem>
                                    <MenuItem value="inactive">离职</MenuItem>
                                    <MenuItem value="suspended">停职</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={12} md={5}>
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                <GreenButton
                                    variant="contained"
                                    onClick={handleAddTeacher}
                                    startIcon={<PersonAddIcon />}
                                >
                                    添加教师
                                </GreenButton>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>

                {/* 教师列表表格 */}
                <TableContainer>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell>教师姓名</TableCell>
                                <TableCell>邮箱</TableCell>
                                <TableCell>任教科目</TableCell>
                                <TableCell>主要班级</TableCell>
                                <TableCell>班级数量</TableCell>
                                <TableCell>所有班级</TableCell>
                                <TableCell>状态</TableCell>
                                <TableCell align="center">操作</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedTeachers.map((teacher) => (
                                <TableRow key={teacher.id} hover>
                                    <TableCell>
                                        <Typography variant="body1" fontWeight="medium">
                                            {teacher.name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{teacher.email}</TableCell>
                                    <TableCell>
                                        {teacher.teachSubject ? (
                                            <Chip 
                                                label={teacher.teachSubject} 
                                                color="primary" 
                                                variant="outlined" 
                                                size="small"
                                            />
                                        ) : (
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={() => navigate(`/Admin/teachers/choosesubject/${teacher.teachSclassID}/${teacher.id}`)}
                                            >
                                                分配科目
                                            </Button>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <ClassIcon sx={{ mr: 1, fontSize: 16, color: 'grey.600' }} />
                                            {teacher.teachSclass}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={teacher.classCount} 
                                            color={teacher.classCount > 1 ? 'info' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ maxWidth: 200 }}>
                                            {teacher.classNames}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={getStatusText(teacher.status)} 
                                            color={getStatusColor(teacher.status)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleView(teacher.id)}
                                                title="查看详情"
                                            >
                                                <ViewIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleEdit(teacher.id)}
                                                title="编辑教师"
                                                color="primary"
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDelete(teacher.id)}
                                                title="删除教师"
                                                color="error"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* 分页 */}
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={filteredTeachers.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="每页行数:"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} 共 ${count} 条`}
                />
            </Paper>

            <Popup message={message} setShowPopup={setShowPopup} showPopup={showPopup} />
        </Box>
    );
};

export default EnhancedTeacherList;
