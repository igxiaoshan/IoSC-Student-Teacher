import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from "react-router-dom";
import {
    Paper, Box, Typography, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, Chip, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, List, ListItem, ListItemText, Tooltip,
    Card, CardContent, Grid, Alert, Pagination, TextField, MenuItem,
    FormControl, InputLabel, Select, Collapse
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as VisibilityIcon,
    Add as AddIcon,
    Class as ClassIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    School as SchoolIcon,
    Person as PersonIcon
} from '@mui/icons-material';
import { getAllTeachers } from '../../../redux/teacherRelated/teacherHandle';
import { deleteUser } from '../../../redux/userRelated/userHandle';
import { mapSafeTeacherData } from '../../../utils/safeAccess';
import { BlueButton, GreenButton, RedButton } from '../../../components/buttonStyles';
import Popup from '../../../components/Popup';

const EnhancedShowTeachers = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { teachersList, loading, error, response } = useSelector((state) => state.teacher);
    const { currentUser } = useSelector(state => state.user);

    // 本地状态
    const [processedTeachers, setProcessedTeachers] = useState([]);
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [classDetailOpen, setClassDetailOpen] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [message, setMessage] = useState("");
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [filters, setFilters] = useState({
        search: '',
        teacherType: '',
        status: 'active'
    });

    const adminID = currentUser._id;

    useEffect(() => {
        dispatch(getAllTeachers(adminID));
    }, [adminID, dispatch]);

    useEffect(() => {
        if (teachersList && Array.isArray(teachersList)) {
            const processed = mapSafeTeacherData(teachersList);
            setProcessedTeachers(processed);
        }
    }, [teachersList]);

    // 处理行展开/收缩
    const handleRowExpand = (teacherId) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(teacherId)) {
            newExpanded.delete(teacherId);
        } else {
            newExpanded.add(teacherId);
        }
        setExpandedRows(newExpanded);
    };

    // 显示班级详情
    const handleShowClassDetail = (teacher) => {
        setSelectedTeacher(teacher);
        setClassDetailOpen(true);
    };

    // 删除教师
    const handleDelete = (teacherId) => {
        if (window.confirm('确定要删除这个教师吗？')) {
            dispatch(deleteUser(teacherId, "Teacher"))
                .then(() => {
                    setMessage("教师删除成功！");
                    setShowPopup(true);
                    dispatch(getAllTeachers(adminID));
                })
                .catch((error) => {
                    setMessage("删除失败：" + (error.message || "未知错误"));
                    setShowPopup(true);
                });
        }
    };

    // 筛选教师
    const filteredTeachers = processedTeachers.filter(teacher => {
        const matchSearch = !filters.search || 
            teacher.name.toLowerCase().includes(filters.search.toLowerCase()) ||
            teacher.email.toLowerCase().includes(filters.search.toLowerCase());
        
        const matchType = !filters.teacherType || teacher.teacherType === filters.teacherType;
        const matchStatus = !filters.status || teacher.status === filters.status;
        
        return matchSearch && matchType && matchStatus;
    });

    // 获取教师类型颜色
    const getTeacherTypeColor = (type) => {
        switch (type) {
            case 'full-time': return 'primary';
            case 'part-time': return 'secondary';
            case 'substitute': return 'warning';
            case 'guest': return 'info';
            default: return 'default';
        }
    };

    // 获取状态颜色
    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'success';
            case 'inactive': return 'warning';
            case 'on-leave': return 'info';
            case 'retired': return 'default';
            default: return 'default';
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <Typography>加载中...</Typography>
            </Box>
        );
    }

    if (response) {
        return (
            <Box sx={{ textAlign: 'center', p: 4 }}>
                <Typography variant="h6" gutterBottom>
                    暂无教师数据
                </Typography>
                <GreenButton
                    variant="contained"
                    onClick={() => navigate("/Admin/teachers/chooseclass")}
                    startIcon={<AddIcon />}
                >
                    添加第一个教师
                </GreenButton>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* 页面标题和操作栏 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    教师管理 (增强版)
                </Typography>
                <GreenButton
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate("/Admin/teachers/chooseclass")}
                >
                    添加教师
                </GreenButton>
            </Box>

            {/* 筛选面板 */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                        <TextField
                            fullWidth
                            label="搜索教师"
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            placeholder="教师姓名或邮箱"
                        />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <FormControl fullWidth>
                            <InputLabel>教师类型</InputLabel>
                            <Select
                                value={filters.teacherType}
                                label="教师类型"
                                onChange={(e) => setFilters({ ...filters, teacherType: e.target.value })}
                            >
                                <MenuItem value="">全部</MenuItem>
                                <MenuItem value="full-time">全职</MenuItem>
                                <MenuItem value="part-time">兼职</MenuItem>
                                <MenuItem value="substitute">代课</MenuItem>
                                <MenuItem value="guest">客座</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <FormControl fullWidth>
                            <InputLabel>状态</InputLabel>
                            <Select
                                value={filters.status}
                                label="状态"
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            >
                                <MenuItem value="">全部</MenuItem>
                                <MenuItem value="active">在职</MenuItem>
                                <MenuItem value="inactive">非活跃</MenuItem>
                                <MenuItem value="on-leave">请假</MenuItem>
                                <MenuItem value="retired">退休</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <Button
                            fullWidth
                            variant="outlined"
                            onClick={() => setFilters({ search: '', teacherType: '', status: 'active' })}
                        >
                            清除筛选
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* 统计卡片 */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <PersonIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                            <Typography variant="h4">{processedTeachers.length}</Typography>
                            <Typography color="textSecondary">总教师数</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <ClassIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                            <Typography variant="h4">
                                {processedTeachers.filter(t => t.classCount > 1).length}
                            </Typography>
                            <Typography color="textSecondary">多班级教师</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <SchoolIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                            <Typography variant="h4">
                                {processedTeachers.filter(t => t.status === 'active').length}
                            </Typography>
                            <Typography color="textSecondary">在职教师</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <PersonIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                            <Typography variant="h4">
                                {processedTeachers.reduce((sum, t) => sum + t.classCount, 0)}
                            </Typography>
                            <Typography color="textSecondary">总班级关联</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* 教师列表 */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>展开</TableCell>
                            <TableCell>教师姓名</TableCell>
                            <TableCell>邮箱</TableCell>
                            <TableCell>任教科目</TableCell>
                            <TableCell>任教班级</TableCell>
                            <TableCell>类型</TableCell>
                            <TableCell>状态</TableCell>
                            <TableCell align="center">操作</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredTeachers.map((teacher) => (
                            <React.Fragment key={teacher.id}>
                                <TableRow hover>
                                    <TableCell>
                                        {teacher.classCount > 1 && (
                                            <IconButton
                                                size="small"
                                                onClick={() => handleRowExpand(teacher.id)}
                                            >
                                                {expandedRows.has(teacher.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                            </IconButton>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="subtitle2">{teacher.name}</Typography>
                                        {teacher.qualification && (
                                            <Typography variant="caption" color="textSecondary">
                                                {teacher.qualification}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>{teacher.email}</TableCell>
                                    <TableCell>{teacher.teachSubject || '未分配'}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Chip
                                                label={`${teacher.classCount} 个班级`}
                                                size="small"
                                                color={teacher.classCount > 1 ? 'primary' : 'default'}
                                            />
                                            {teacher.classCount > 1 && (
                                                <Button
                                                    size="small"
                                                    onClick={() => handleShowClassDetail(teacher)}
                                                >
                                                    查看详情
                                                </Button>
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={teacher.teacherType === 'full-time' ? '全职' : teacher.teacherType === 'part-time' ? '兼职' : teacher.teacherType === 'substitute' ? '代课' : '客座'}
                                            color={getTeacherTypeColor(teacher.teacherType)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={teacher.status === 'active' ? '在职' : teacher.status === 'inactive' ? '非活跃' : teacher.status === 'on-leave' ? '请假' : '退休'}
                                            color={getStatusColor(teacher.status)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                            <Tooltip title="查看详情">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => navigate(`/Admin/teachers/teacher/${teacher.id}`)}
                                                >
                                                    <VisibilityIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="编辑教师">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => navigate(`/Admin/teachers/edit/${teacher.id}`)}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="删除教师">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleDelete(teacher.id)}
                                                    color="error"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                                
                                {/* 展开的班级详情行 */}
                                {teacher.classCount > 1 && (
                                    <TableRow>
                                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
                                            <Collapse in={expandedRows.has(teacher.id)} timeout="auto" unmountOnExit>
                                                <Box sx={{ margin: 1 }}>
                                                    <Typography variant="h6" gutterBottom component="div">
                                                        任教班级详情
                                                    </Typography>
                                                    <Grid container spacing={1}>
                                                        {teacher.allClasses.map((classItem, index) => (
                                                            <Grid item key={index}>
                                                                <Chip
                                                                    label={classItem?.sclassName || '未知班级'}
                                                                    variant="outlined"
                                                                    size="small"
                                                                    color={index === 0 ? 'primary' : 'default'}
                                                                />
                                                            </Grid>
                                                        ))}
                                                    </Grid>
                                                </Box>
                                            </Collapse>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </React.Fragment>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* 班级详情对话框 */}
            <Dialog open={classDetailOpen} onClose={() => setClassDetailOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    教师班级关联详情 - {selectedTeacher?.name}
                </DialogTitle>
                <DialogContent>
                    {selectedTeacher && (
                        <List>
                            {selectedTeacher.allClasses.map((classItem, index) => (
                                <ListItem key={index} divider>
                                    <ListItemText
                                        primary={classItem?.sclassName || '未知班级'}
                                        secondary={`年级: ${classItem?.grade || '未设置'} ${index === 0 ? '(主班级)' : '(任教班级)'}`}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setClassDetailOpen(false)}>关闭</Button>
                </DialogActions>
            </Dialog>

            <Popup message={message} setShowPopup={setShowPopup} showPopup={showPopup} />
        </Box>
    );
};

export default EnhancedShowTeachers;
