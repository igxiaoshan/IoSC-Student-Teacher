/**
 * 资源概览组件
 * 管理员查看和管理系统中的所有教学资源
 */

import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    CardActions,
    Button,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    CircularProgress,
    Avatar,
    Box as MuiBox
} from '@mui/material';
import {
    Folder as FolderIcon,
    Visibility as ViewIcon,
    Download as DownloadIcon,
    Share as ShareIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Search as SearchIcon,
    FilterList as FilterIcon,
    School as SchoolIcon,
    Quiz as QuizIcon,
    Assignment as AssignmentIcon,
    Description as DescriptionIcon
} from '@mui/icons-material';
import aiService from '../../services/aiService';

const ResourceOverview = () => {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedResource, setSelectedResource] = useState(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    
    // 过滤和分页状态
    const [filters, setFilters] = useState({
        resourceType: '',
        subject: '',
        search: ''
    });
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // 模拟数据
    const mockResources = [
        {
            _id: '1',
            title: '二次函数的图像与性质 - 教学方案',
            subject: '数学',
            resourceType: '教案',
            teacherId: { name: '张老师' },
            content: '# 二次函数的图像与性质\n\n## 教学目标\n1. 理解二次函数的概念\n2. 掌握二次函数的图像特征\n3. 能够分析二次函数的性质\n\n## 教学重点\n- 二次函数的标准形式\n- 抛物线的开口方向\n- 对称轴和顶点坐标\n\n## 教学难点\n- 二次函数图像的平移变换\n- 根据图像确定函数解析式',
            isAIGenerated: true,
            isShared: true,
            status: '已发布',
            usageStats: { viewCount: 45, downloadCount: 12, shareCount: 8 },
            ratings: { averageRating: 4.5, ratingCount: 15 },
            createdAt: '2025-01-10T10:30:00Z',
            updatedAt: '2025-01-11T15:20:00Z'
        },
        {
            _id: '2',
            title: '英语语法综合练习题',
            subject: '英语',
            resourceType: '练习',
            teacherId: { name: '李老师' },
            content: '# 英语语法综合练习\n\n## 第一部分：时态练习\n1. Choose the correct tense...\n2. Fill in the blanks...\n\n## 第二部分：语态练习\n1. Change the following sentences...\n2. Complete the sentences...',
            isAIGenerated: true,
            isShared: false,
            status: '草稿',
            usageStats: { viewCount: 23, downloadCount: 5, shareCount: 2 },
            ratings: { averageRating: 4.2, ratingCount: 8 },
            createdAt: '2025-01-09T14:15:00Z',
            updatedAt: '2025-01-09T16:45:00Z'
        },
        {
            _id: '3',
            title: '物理力学单元测试',
            subject: '物理',
            resourceType: '考核',
            teacherId: { name: '王老师' },
            content: '# 物理力学单元测试\n\n## 一、选择题（每题5分，共50分）\n1. 关于力的概念，下列说法正确的是...\n2. 牛顿第一定律又称为...\n\n## 二、计算题（每题25分，共50分）\n1. 一个质量为2kg的物体...',
            isAIGenerated: true,
            isShared: true,
            status: '已发布',
            usageStats: { viewCount: 67, downloadCount: 28, shareCount: 15 },
            ratings: { averageRating: 4.8, ratingCount: 22 },
            createdAt: '2025-01-08T09:20:00Z',
            updatedAt: '2025-01-10T11:30:00Z'
        }
    ];

    const subjects = ['', '数学', '语文', '英语', '物理', '化学', '生物', '历史', '地理', '政治', '计算机'];
    const resourceTypes = ['', '课件', '练习', '考核', '教案', '素材'];

    // 获取资源数据
    const fetchResources = async () => {
        setLoading(true);
        try {
            // 模拟API调用
            setTimeout(() => {
                let filteredResources = mockResources;
                
                // 应用过滤器
                if (filters.resourceType) {
                    filteredResources = filteredResources.filter(r => r.resourceType === filters.resourceType);
                }
                if (filters.subject) {
                    filteredResources = filteredResources.filter(r => r.subject === filters.subject);
                }
                if (filters.search) {
                    filteredResources = filteredResources.filter(r => 
                        r.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                        r.content.toLowerCase().includes(filters.search.toLowerCase())
                    );
                }
                
                setResources(filteredResources);
                setLoading(false);
            }, 1000);
        } catch (error) {
            setError('获取资源数据失败');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResources();
    }, [filters]);

    // 处理过滤器变化
    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
        setPage(0);
    };

    // 预览资源
    const handlePreview = (resource) => {
        setSelectedResource(resource);
        setPreviewOpen(true);
    };

    // 下载资源
    const handleDownload = (resource) => {
        const element = document.createElement('a');
        const file = new Blob([resource.content], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `${resource.title}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    // 获取资源类型图标
    const getResourceIcon = (type) => {
        switch (type) {
            case '课件':
                return <SchoolIcon />;
            case '练习':
                return <QuizIcon />;
            case '考核':
                return <AssignmentIcon />;
            case '教案':
                return <DescriptionIcon />;
            default:
                return <FolderIcon />;
        }
    };

    // 获取状态颜色
    const getStatusColor = (status) => {
        switch (status) {
            case '已发布':
                return 'success';
            case '草稿':
                return 'warning';
            case '已归档':
                return 'default';
            default:
                return 'default';
        }
    };

    // 格式化时间
    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Box sx={{ maxWidth: 1400, mx: 'auto', p: 2 }}>
            {/* 头部 */}
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <FolderIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h5">资源管理</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                    查看和管理系统中的所有教学资源，包括AI生成和教师创建的内容
                </Typography>
            </Paper>

            {/* 统计卡片 */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <FolderIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="h4" color="primary">
                                {resources.length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                总资源数
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <SchoolIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="h4" color="success.main">
                                {resources.filter(r => r.isAIGenerated).length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                AI生成资源
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <ShareIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="h4" color="info.main">
                                {resources.filter(r => r.isShared).length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                共享资源
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <ViewIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="h4" color="secondary.main">
                                {resources.reduce((sum, r) => sum + r.usageStats.viewCount, 0)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                总浏览次数
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* 过滤器 */}
            <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <FilterIcon sx={{ mr: 1 }} />
                    <Typography variant="h6">筛选条件</Typography>
                </Box>
                
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth>
                            <InputLabel>资源类型</InputLabel>
                            <Select
                                value={filters.resourceType}
                                label="资源类型"
                                onChange={(e) => handleFilterChange('resourceType', e.target.value)}
                            >
                                {resourceTypes.map((type) => (
                                    <MenuItem key={type} value={type}>
                                        {type || '全部'}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth>
                            <InputLabel>学科</InputLabel>
                            <Select
                                value={filters.subject}
                                label="学科"
                                onChange={(e) => handleFilterChange('subject', e.target.value)}
                            >
                                {subjects.map((subject) => (
                                    <MenuItem key={subject} value={subject}>
                                        {subject || '全部'}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={4}>
                        <TextField
                            fullWidth
                            label="搜索关键词"
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            InputProps={{
                                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                            }}
                        />
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={2}>
                        <Button
                            variant="outlined"
                            onClick={fetchResources}
                            disabled={loading}
                            fullWidth
                        >
                            {loading ? <CircularProgress size={20} /> : '刷新'}
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* 错误提示 */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {/* 资源表格 */}
            <Paper>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>资源信息</TableCell>
                                <TableCell>创建者</TableCell>
                                <TableCell>类型</TableCell>
                                <TableCell>状态</TableCell>
                                <TableCell>使用统计</TableCell>
                                <TableCell>评分</TableCell>
                                <TableCell>创建时间</TableCell>
                                <TableCell>操作</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {resources
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((resource) => (
                                <TableRow key={resource._id}>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Avatar sx={{ mr: 2, bgcolor: 'primary.light' }}>
                                                {getResourceIcon(resource.resourceType)}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="subtitle2">
                                                    {resource.title}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {resource.subject}
                                                </Typography>
                                                {resource.isAIGenerated && (
                                                    <Chip 
                                                        label="AI生成" 
                                                        size="small" 
                                                        color="secondary" 
                                                        sx={{ ml: 1 }}
                                                    />
                                                )}
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>{resource.teacherId.name}</TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={resource.resourceType} 
                                            size="small" 
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={resource.status} 
                                            size="small" 
                                            color={getStatusColor(resource.status)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" display="block">
                                            浏览: {resource.usageStats.viewCount}
                                        </Typography>
                                        <Typography variant="caption" display="block">
                                            下载: {resource.usageStats.downloadCount}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            ⭐ {resource.ratings.averageRating.toFixed(1)}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            ({resource.ratings.ratingCount} 评价)
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption">
                                            {formatTime(resource.createdAt)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            <Tooltip title="预览">
                                                <IconButton 
                                                    size="small" 
                                                    onClick={() => handlePreview(resource)}
                                                >
                                                    <ViewIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="下载">
                                                <IconButton 
                                                    size="small" 
                                                    onClick={() => handleDownload(resource)}
                                                >
                                                    <DownloadIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={resources.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(event, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(event) => {
                        setRowsPerPage(parseInt(event.target.value, 10));
                        setPage(0);
                    }}
                />
            </Paper>

            {/* 预览对话框 */}
            <Dialog
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    资源预览 - {selectedResource?.title}
                </DialogTitle>
                <DialogContent>
                    {selectedResource && (
                        <Box sx={{ py: 1 }}>
                            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                                {selectedResource.content}
                            </pre>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPreviewOpen(false)}>
                        关闭
                    </Button>
                    <Button 
                        variant="contained" 
                        onClick={() => handleDownload(selectedResource)}
                    >
                        下载
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ResourceOverview;
