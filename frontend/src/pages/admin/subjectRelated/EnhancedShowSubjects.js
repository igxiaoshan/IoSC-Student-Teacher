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
    Assignment as AssignmentIcon
} from '@mui/icons-material';
import { getSubjectList } from '../../../redux/sclassRelated/sclassHandle';
import { deleteUser } from '../../../redux/userRelated/userHandle';
import { mapSafeSubjectData } from '../../../utils/safeAccess';
import { BlueButton, GreenButton, RedButton } from '../../../components/buttonStyles';
import Popup from '../../../components/Popup';

const EnhancedShowSubjects = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { subjectsList, loading, error, response } = useSelector((state) => state.sclass);
    const { currentUser } = useSelector(state => state.user);

    // 本地状态
    const [processedSubjects, setProcessedSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [classDetailOpen, setClassDetailOpen] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [message, setMessage] = useState("");
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [filters, setFilters] = useState({
        search: '',
        subjectType: '',
        status: 'active'
    });

    const adminID = currentUser._id;

    useEffect(() => {
        dispatch(getSubjectList(adminID, "AllSubjects"));
    }, [adminID, dispatch]);

    useEffect(() => {
        if (subjectsList && Array.isArray(subjectsList)) {
            const processed = mapSafeSubjectData(subjectsList);
            setProcessedSubjects(processed);
        }
    }, [subjectsList]);

    // 处理行展开/收缩
    const handleRowExpand = (subjectId) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(subjectId)) {
            newExpanded.delete(subjectId);
        } else {
            newExpanded.add(subjectId);
        }
        setExpandedRows(newExpanded);
    };

    // 显示班级详情
    const handleShowClassDetail = (subject) => {
        setSelectedSubject(subject);
        setClassDetailOpen(true);
    };

    // 删除科目
    const handleDelete = (subjectId) => {
        if (window.confirm('确定要删除这个科目吗？')) {
            dispatch(deleteUser(subjectId, "Subject"))
                .then(() => {
                    setMessage("科目删除成功！");
                    setShowPopup(true);
                    dispatch(getSubjectList(adminID, "AllSubjects"));
                })
                .catch((error) => {
                    setMessage("删除失败：" + (error.message || "未知错误"));
                    setShowPopup(true);
                });
        }
    };

    // 筛选科目
    const filteredSubjects = processedSubjects.filter(subject => {
        const matchSearch = !filters.search || 
            subject.subName.toLowerCase().includes(filters.search.toLowerCase()) ||
            subject.subCode.toLowerCase().includes(filters.search.toLowerCase());
        
        const matchType = !filters.subjectType || subject.subjectType === filters.subjectType;
        const matchStatus = !filters.status || subject.status === filters.status;
        
        return matchSearch && matchType && matchStatus;
    });

    // 获取科目类型颜色
    const getSubjectTypeColor = (type) => {
        switch (type) {
            case 'core': return 'primary';
            case 'elective': return 'secondary';
            case 'extracurricular': return 'info';
            default: return 'default';
        }
    };

    // 获取状态颜色
    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'success';
            case 'inactive': return 'warning';
            case 'archived': return 'default';
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
                    暂无科目数据
                </Typography>
                <GreenButton
                    variant="contained"
                    onClick={() => navigate("/Admin/subjects/chooseclass")}
                    startIcon={<AddIcon />}
                >
                    创建第一个科目
                </GreenButton>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* 页面标题和操作栏 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    科目管理 (增强版)
                </Typography>
                <GreenButton
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate("/Admin/subjects/chooseclass")}
                >
                    添加科目
                </GreenButton>
            </Box>

            {/* 筛选面板 */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                        <TextField
                            fullWidth
                            label="搜索科目"
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            placeholder="科目名称或代码"
                        />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <FormControl fullWidth>
                            <InputLabel>科目类型</InputLabel>
                            <Select
                                value={filters.subjectType}
                                label="科目类型"
                                onChange={(e) => setFilters({ ...filters, subjectType: e.target.value })}
                            >
                                <MenuItem value="">全部</MenuItem>
                                <MenuItem value="core">核心课程</MenuItem>
                                <MenuItem value="elective">选修课程</MenuItem>
                                <MenuItem value="extracurricular">课外活动</MenuItem>
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
                                <MenuItem value="active">活跃</MenuItem>
                                <MenuItem value="inactive">非活跃</MenuItem>
                                <MenuItem value="archived">已归档</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <Button
                            fullWidth
                            variant="outlined"
                            onClick={() => setFilters({ search: '', subjectType: '', status: 'active' })}
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
                            <AssignmentIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                            <Typography variant="h4">{processedSubjects.length}</Typography>
                            <Typography color="textSecondary">总科目数</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <ClassIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                            <Typography variant="h4">
                                {processedSubjects.filter(s => s.classCount > 1).length}
                            </Typography>
                            <Typography color="textSecondary">多班级科目</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <SchoolIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                            <Typography variant="h4">
                                {processedSubjects.filter(s => s.status === 'active').length}
                            </Typography>
                            <Typography color="textSecondary">活跃科目</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <AssignmentIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                            <Typography variant="h4">
                                {processedSubjects.reduce((sum, s) => sum + s.classCount, 0)}
                            </Typography>
                            <Typography color="textSecondary">总班级关联</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* 科目列表 */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>展开</TableCell>
                            <TableCell>科目名称</TableCell>
                            <TableCell>科目代码</TableCell>
                            <TableCell>课时</TableCell>
                            <TableCell>关联班级</TableCell>
                            <TableCell>类型</TableCell>
                            <TableCell>状态</TableCell>
                            <TableCell align="center">操作</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredSubjects.map((subject) => (
                            <React.Fragment key={subject.id}>
                                <TableRow hover>
                                    <TableCell>
                                        {subject.classCount > 1 && (
                                            <IconButton
                                                size="small"
                                                onClick={() => handleRowExpand(subject.id)}
                                            >
                                                {expandedRows.has(subject.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                            </IconButton>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="subtitle2">{subject.subName}</Typography>
                                        {subject.description && (
                                            <Typography variant="caption" color="textSecondary">
                                                {subject.description}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>{subject.subCode}</TableCell>
                                    <TableCell>{subject.sessions}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Chip
                                                label={`${subject.classCount} 个班级`}
                                                size="small"
                                                color={subject.classCount > 1 ? 'primary' : 'default'}
                                            />
                                            {subject.classCount > 1 && (
                                                <Button
                                                    size="small"
                                                    onClick={() => handleShowClassDetail(subject)}
                                                >
                                                    查看详情
                                                </Button>
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={subject.subjectType === 'core' ? '核心' : subject.subjectType === 'elective' ? '选修' : '课外'}
                                            color={getSubjectTypeColor(subject.subjectType)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={subject.status === 'active' ? '活跃' : subject.status === 'inactive' ? '非活跃' : '已归档'}
                                            color={getStatusColor(subject.status)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                            <Tooltip title="查看详情">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => navigate(`/Admin/subjects/subject/${subject.sclassID}/${subject.id}`)}
                                                >
                                                    <VisibilityIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="编辑科目">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => navigate(`/Admin/subjects/edit/${subject.id}`)}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="删除科目">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleDelete(subject.id)}
                                                    color="error"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                                
                                {/* 展开的班级详情行 */}
                                {subject.classCount > 1 && (
                                    <TableRow>
                                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
                                            <Collapse in={expandedRows.has(subject.id)} timeout="auto" unmountOnExit>
                                                <Box sx={{ margin: 1 }}>
                                                    <Typography variant="h6" gutterBottom component="div">
                                                        关联班级详情
                                                    </Typography>
                                                    <Grid container spacing={1}>
                                                        {subject.allClasses.map((classItem, index) => (
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
                    科目班级关联详情 - {selectedSubject?.subName}
                </DialogTitle>
                <DialogContent>
                    {selectedSubject && (
                        <List>
                            {selectedSubject.allClasses.map((classItem, index) => (
                                <ListItem key={index} divider>
                                    <ListItemText
                                        primary={classItem?.sclassName || '未知班级'}
                                        secondary={`年级: ${classItem?.grade || '未设置'} ${index === 0 ? '(主班级)' : '(关联班级)'}`}
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

export default EnhancedShowSubjects;
