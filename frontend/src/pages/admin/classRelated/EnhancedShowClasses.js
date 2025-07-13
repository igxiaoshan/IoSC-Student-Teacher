import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from "react-router-dom";
import { 
    getAllSclasses, 
    batchDeleteClasses, 
    updateFilters, 
    clearClassError,
    getClassStatistics 
} from '../../../redux/sclassRelated/sclassHandle';
import { deleteUser } from '../../../redux/userRelated/userHandle';
import {
    Paper, Box, IconButton, Checkbox, Typography, TextField, 
    MenuItem, Select, FormControl, InputLabel, Button, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions, Alert, 
    Pagination, Grid, Card, CardContent, Fab, Toolbar,
    Table, TableBody, TableCell, TableContainer, TableHead, 
    TableRow, TableSortLabel, Collapse, Tooltip
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Edit as EditIcon,
    Add as AddIcon,
    Search as SearchIcon,
    FilterList as FilterListIcon,
    Clear as ClearIcon,
    PostAdd as PostAddIcon,
    PersonAddAlt1 as PersonAddAlt1Icon,
    Visibility as VisibilityIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { BlueButton, GreenButton, RedButton } from '../../../components/buttonStyles';
import Popup from '../../../components/Popup';

const EnhancedShowClasses = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { 
        sclassesList, 
        pagination, 
        filters, 
        loading, 
        batchLoading, 
        error, 
        getresponse,
        classStatistics 
    } = useSelector((state) => state.sclass);
    const { currentUser } = useSelector(state => state.user);

    // 本地状态
    const [selectedClasses, setSelectedClasses] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [message, setMessage] = useState("");
    const [localFilters, setLocalFilters] = useState({
        search: '',
        grade: '',
        status: '',
        sortBy: 'sclassName',
        sortOrder: 'asc'
    });

    const adminID = currentUser._id;

    // 获取班级列表
    const fetchClasses = useCallback(() => {
        const queryFilters = {
            page: pagination.currentPage,
            limit: pagination.itemsPerPage,
            ...filters
        };
        dispatch(getAllSclasses(adminID, "Sclass", queryFilters));
    }, [dispatch, adminID, pagination.currentPage, pagination.itemsPerPage, filters]);

    useEffect(() => {
        fetchClasses();
    }, [fetchClasses]);

    useEffect(() => {
        if (error) {
            setMessage(error);
            setShowPopup(true);
            dispatch(clearClassError());
        }
    }, [error, dispatch]);

    // 处理搜索
    const handleSearch = () => {
        dispatch(updateFilters(localFilters));
    };

    // 清除筛选
    const handleClearFilters = () => {
        const resetFilters = {
            search: '',
            grade: '',
            status: '',
            sortBy: 'sclassName',
            sortOrder: 'asc'
        };
        setLocalFilters(resetFilters);
        dispatch(updateFilters(resetFilters));
    };

    // 处理分页
    const handlePageChange = (event, newPage) => {
        dispatch(updateFilters({ ...filters, page: newPage }));
    };

    // 处理排序
    const handleSort = (field) => {
        const isAsc = filters.sortBy === field && filters.sortOrder === 'asc';
        const newOrder = isAsc ? 'desc' : 'asc';
        dispatch(updateFilters({ 
            ...filters, 
            sortBy: field, 
            sortOrder: newOrder 
        }));
    };

    // 处理选择
    const handleSelectAll = (event) => {
        if (event.target.checked) {
            const newSelected = sclassesList.map((cls) => cls._id);
            setSelectedClasses(newSelected);
        } else {
            setSelectedClasses([]);
        }
    };

    const handleSelectOne = (classId) => {
        const selectedIndex = selectedClasses.indexOf(classId);
        let newSelected = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selectedClasses, classId);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selectedClasses.slice(1));
        } else if (selectedIndex === selectedClasses.length - 1) {
            newSelected = newSelected.concat(selectedClasses.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(
                selectedClasses.slice(0, selectedIndex),
                selectedClasses.slice(selectedIndex + 1),
            );
        }
        setSelectedClasses(newSelected);
    };

    // 删除处理
    const handleDelete = (classId) => {
        if (window.confirm('确定要删除这个班级吗？删除班级将同时删除该班级的所有学生、科目和教师数据。')) {
            dispatch(deleteUser(classId, "Sclass"))
                .then(() => {
                    fetchClasses();
                    setMessage("班级删除成功！");
                    setShowPopup(true);
                })
                .catch((error) => {
                    setMessage("删除失败：" + (error.message || "未知错误"));
                    setShowPopup(true);
                });
        }
    };

    // 批量删除
    const handleBatchDelete = () => {
        if (selectedClasses.length === 0) {
            setMessage("请选择要删除的班级");
            setShowPopup(true);
            return;
        }

        dispatch(batchDeleteClasses(adminID, selectedClasses))
            .then(() => {
                setSelectedClasses([]);
                setDeleteDialogOpen(false);
                fetchClasses();
                setMessage(`成功删除 ${selectedClasses.length} 个班级`);
                setShowPopup(true);
            })
            .catch((error) => {
                setMessage("批量删除失败：" + (error.message || "未知错误"));
                setShowPopup(true);
            });
    };

    const isSelected = (classId) => selectedClasses.indexOf(classId) !== -1;

    return (
        <Box sx={{ p: 3 }}>
            {/* 页面标题和操作栏 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    班级管理
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<FilterListIcon />}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        筛选
                    </Button>
                    <GreenButton
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => navigate("/Admin/addclass")}
                    >
                        添加班级
                    </GreenButton>
                    {selectedClasses.length > 0 && (
                        <RedButton
                            variant="contained"
                            startIcon={<DeleteIcon />}
                            onClick={() => setDeleteDialogOpen(true)}
                            disabled={batchLoading}
                        >
                            批量删除 ({selectedClasses.length})
                        </RedButton>
                    )}
                </Box>
            </Box>

            {/* 筛选面板 */}
            <Collapse in={showFilters}>
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={3}>
                            <TextField
                                fullWidth
                                label="搜索班级名称"
                                value={localFilters.search}
                                onChange={(e) => setLocalFilters({ ...localFilters, search: e.target.value })}
                                InputProps={{
                                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={2}>
                            <FormControl fullWidth>
                                <InputLabel>年级</InputLabel>
                                <Select
                                    value={localFilters.grade}
                                    label="年级"
                                    onChange={(e) => setLocalFilters({ ...localFilters, grade: e.target.value })}
                                >
                                    <MenuItem value="">全部</MenuItem>
                                    <MenuItem value="一年级">一年级</MenuItem>
                                    <MenuItem value="二年级">二年级</MenuItem>
                                    <MenuItem value="三年级">三年级</MenuItem>
                                    <MenuItem value="四年级">四年级</MenuItem>
                                    <MenuItem value="五年级">五年级</MenuItem>
                                    <MenuItem value="六年级">六年级</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={2}>
                            <FormControl fullWidth>
                                <InputLabel>状态</InputLabel>
                                <Select
                                    value={localFilters.status}
                                    label="状态"
                                    onChange={(e) => setLocalFilters({ ...localFilters, status: e.target.value })}
                                >
                                    <MenuItem value="">全部</MenuItem>
                                    <MenuItem value="active">活跃</MenuItem>
                                    <MenuItem value="inactive">非活跃</MenuItem>
                                    <MenuItem value="archived">已归档</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                    variant="contained"
                                    onClick={handleSearch}
                                    startIcon={<SearchIcon />}
                                >
                                    搜索
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={handleClearFilters}
                                    startIcon={<ClearIcon />}
                                >
                                    清除
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>
            </Collapse>

            {/* 班级列表 */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <Typography>加载中...</Typography>
                </Box>
            ) : getresponse ? (
                <Box sx={{ textAlign: 'center', p: 4 }}>
                    <Typography variant="h6" gutterBottom>
                        暂无班级数据
                    </Typography>
                    <GreenButton
                        variant="contained"
                        onClick={() => navigate("/Admin/addclass")}
                        startIcon={<AddIcon />}
                    >
                        创建第一个班级
                    </GreenButton>
                </Box>
            ) : (
                <>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            indeterminate={selectedClasses.length > 0 && selectedClasses.length < sclassesList.length}
                                            checked={sclassesList.length > 0 && selectedClasses.length === sclassesList.length}
                                            onChange={handleSelectAll}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={filters.sortBy === 'sclassName'}
                                            direction={filters.sortBy === 'sclassName' ? filters.sortOrder : 'asc'}
                                            onClick={() => handleSort('sclassName')}
                                        >
                                            班级名称
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>年级</TableCell>
                                    <TableCell>学生数量</TableCell>
                                    <TableCell>状态</TableCell>
                                    <TableCell>创建时间</TableCell>
                                    <TableCell align="center">操作</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sclassesList.map((sclass) => {
                                    const isItemSelected = isSelected(sclass._id);
                                    return (
                                        <TableRow
                                            key={sclass._id}
                                            hover
                                            selected={isItemSelected}
                                        >
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    checked={isItemSelected}
                                                    onChange={() => handleSelectOne(sclass._id)}
                                                />
                                            </TableCell>
                                            <TableCell>{sclass.sclassName}</TableCell>
                                            <TableCell>{sclass.grade || '-'}</TableCell>
                                            <TableCell>
                                                {sclass.currentStudents || 0} / {sclass.maxStudents || 50}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={sclass.status === 'active' ? '活跃' : sclass.status === 'inactive' ? '非活跃' : '已归档'}
                                                    color={sclass.status === 'active' ? 'success' : sclass.status === 'inactive' ? 'warning' : 'default'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {new Date(sclass.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                                    <Tooltip title="查看详情">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => navigate(`/Admin/classes/class/${sclass._id}`)}
                                                        >
                                                            <VisibilityIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="编辑班级">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => navigate(`/Admin/classes/edit/${sclass._id}`)}
                                                        >
                                                            <EditIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="添加学生">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => navigate(`/Admin/class/addstudents/${sclass._id}`)}
                                                        >
                                                            <PersonAddAlt1Icon />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="添加科目">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => navigate(`/Admin/addsubject/${sclass._id}`)}
                                                        >
                                                            <PostAddIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="删除班级">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleDelete(sclass._id)}
                                                            color="error"
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* 分页 */}
                    {pagination.totalPages > 1 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                            <Pagination
                                count={pagination.totalPages}
                                page={pagination.currentPage}
                                onChange={handlePageChange}
                                color="primary"
                                showFirstButton
                                showLastButton
                            />
                        </Box>
                    )}
                </>
            )}

            {/* 批量删除确认对话框 */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>确认批量删除</DialogTitle>
                <DialogContent>
                    <Typography>
                        您确定要删除选中的 {selectedClasses.length} 个班级吗？
                        此操作将同时删除这些班级的所有学生、科目和教师数据，且无法撤销。
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>取消</Button>
                    <RedButton
                        onClick={handleBatchDelete}
                        disabled={batchLoading}
                        autoFocus
                    >
                        {batchLoading ? '删除中...' : '确认删除'}
                    </RedButton>
                </DialogActions>
            </Dialog>

            <Popup message={message} setShowPopup={setShowPopup} showPopup={showPopup} />
        </Box>
    );
};

export default EnhancedShowClasses;
