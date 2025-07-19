import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
    Container,
    Paper,
    Typography,
    Box,
    Button,
    Grid,
    Card,
    CardContent,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Tabs,
    Tab,
    Divider,
    Tooltip,
    Pagination
} from '@mui/material';
import {
    AutoFixHigh as AIIcon,
    Download as DownloadIcon,
    Share as ShareIcon,
    History as HistoryIcon,
    Visibility as PreviewIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    FileDownload as ExcelIcon,
    Link as LinkIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from 'axios';

const EnhancedAICoursewareGenerator = () => {
    const { currentUser } = useSelector(state => state.user);
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // 生成表单数据
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        syllabus: '',
        courseLevel: '中级',
        studentCount: 30,
        duration: 45,
        focusAreas: [],
        generateType: 'overview'
    });

    // 生成结果
    const [generatedCourseware, setGeneratedCourseware] = useState(null);
    
    // 历史记录
    const [coursewareHistory, setCoursewareHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

    // 分享对话框
    const [shareDialog, setShareDialog] = useState({ open: false, courseware: null, shareUrl: '' });

    const courseLevels = ['初级', '中级', '高级'];
    const focusAreaOptions = [
        '理论基础', '实践应用', '案例分析', '技能训练', 
        '创新思维', '团队协作', '问题解决', '项目实战'
    ];

    useEffect(() => {
        if (activeTab === 1) {
            fetchCoursewareHistory();
        }
    }, [activeTab]);

    // 获取课件历史记录
    const fetchCoursewareHistory = async (page = 1) => {
        setHistoryLoading(true);
        try {
            const response = await axios.get(`/ai/courseware/teacher/${currentUser._id}/history`, {
                params: { page, limit: pagination.pageSize }
            });

            if (response.data.success) {
                setCoursewareHistory(response.data.data.coursewareList);
                setPagination(response.data.data.pagination);
            }
        } catch (err) {
            setError('获取历史记录失败：' + (err.response?.data?.message || err.message));
        } finally {
            setHistoryLoading(false);
        }
    };

    // 生成课件
    const generateCourseware = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        
        try {
            const response = await axios.post('/ai/courseware/generate', {
                ...formData,
                teacherId: currentUser._id
            });

            if (response.data.success) {
                setGeneratedCourseware(response.data.courseware);
                setSuccess('课件生成成功！');
                
                // 如果在历史记录页面，刷新历史记录
                if (activeTab === 1) {
                    fetchCoursewareHistory();
                }
            } else {
                setError(response.data.message || '生成失败');
            }
        } catch (err) {
            setError('生成课件时发生错误：' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    // 导出Excel
    const exportToExcel = async (coursewareId) => {
        try {
            const response = await axios.get(`/ai/courseware/${coursewareId}/export/excel`, {
                responseType: 'blob'
            });

            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `课件_${Date.now()}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            setSuccess('Excel文件导出成功！');
        } catch (err) {
            setError('导出失败：' + (err.response?.data?.message || err.message));
        }
    };

    // 生成分享链接
    const generateShareLink = async (courseware) => {
        try {
            const response = await axios.post(`/ai/courseware/${courseware._id}/share`, {
                expiresIn: 7 // 7天过期
            });

            if (response.data.success) {
                setShareDialog({
                    open: true,
                    courseware: courseware,
                    shareUrl: response.data.shareUrl
                });
            }
        } catch (err) {
            setError('生成分享链接失败：' + (err.response?.data?.message || err.message));
        }
    };

    // 复制分享链接
    const copyShareLink = () => {
        navigator.clipboard.writeText(shareDialog.shareUrl);
        setSuccess('分享链接已复制到剪贴板！');
        setShareDialog({ ...shareDialog, open: false });
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleFocusAreaChange = (area) => {
        setFormData(prev => ({
            ...prev,
            focusAreas: prev.focusAreas.includes(area)
                ? prev.focusAreas.filter(item => item !== area)
                : [...prev.focusAreas, area]
        }));
    };

    // 根据教师科目自动填充表单
    const autoFillFromSubject = () => {
        if (currentUser.teachSubject) {
            const subjectName = currentUser.teachSubject.subName;
            setFormData(prev => ({
                ...prev,
                title: `${subjectName}课程概览`,
                description: `${subjectName}科目的综合课程内容，包含核心知识点和实践应用`,
                syllabus: `${subjectName}课程大纲\n1. 基础理论学习\n2. 核心概念掌握\n3. 实践应用训练\n4. 综合能力提升`
            }));
            setSuccess(`已根据您的科目"${subjectName}"自动填充表单！`);
        }
    };

    const renderGeneratorTab = () => (
        <Box>
            <Typography variant="h6" gutterBottom>
                AI课件生成器 - 根据科目智能生成
            </Typography>
            
            {currentUser.teachSubject && (
                <Alert severity="info" sx={{ mb: 3 }}>
                    您的科目：{currentUser.teachSubject.subName}
                    <Button 
                        size="small" 
                        onClick={autoFillFromSubject}
                        sx={{ ml: 2 }}
                    >
                        自动填充表单
                    </Button>
                </Alert>
            )}

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="课件标题"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder={`例如：${currentUser.teachSubject?.subName || '数学'}基础概览`}
                        sx={{ mb: 2 }}
                    />
                    
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="课件描述"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="描述课件的主要内容和目标"
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="课程大纲"
                        value={formData.syllabus}
                        onChange={(e) => handleInputChange('syllabus', e.target.value)}
                        placeholder="输入课程的主要章节和内容安排"
                        sx={{ mb: 2 }}
                    />
                </Grid>

                <Grid item xs={12} md={6}>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>生成类型</InputLabel>
                        <Select
                            value={formData.generateType}
                            onChange={(e) => handleInputChange('generateType', e.target.value)}
                        >
                            <MenuItem value="overview">科目概览</MenuItem>
                            <MenuItem value="detailed">详细课件</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>课程级别</InputLabel>
                        <Select
                            value={formData.courseLevel}
                            onChange={(e) => handleInputChange('courseLevel', e.target.value)}
                        >
                            {courseLevels.map(level => (
                                <MenuItem key={level} value={level}>{level}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                type="number"
                                label="学生人数"
                                value={formData.studentCount}
                                onChange={(e) => handleInputChange('studentCount', parseInt(e.target.value))}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                type="number"
                                label="课程时长(分钟)"
                                value={formData.duration}
                                onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                            />
                        </Grid>
                    </Grid>

                    <Typography variant="subtitle2" gutterBottom>
                        重点领域（可多选）
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                        {focusAreaOptions.map(area => (
                            <Chip
                                key={area}
                                label={area}
                                onClick={() => handleFocusAreaChange(area)}
                                color={formData.focusAreas.includes(area) ? 'primary' : 'default'}
                                sx={{ m: 0.5 }}
                            />
                        ))}
                    </Box>
                </Grid>
            </Grid>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Button
                    variant="contained"
                    size="large"
                    startIcon={loading ? <CircularProgress size={20} /> : <AIIcon />}
                    onClick={generateCourseware}
                    disabled={loading || !formData.title}
                    sx={{ minWidth: 200 }}
                >
                    {loading ? '生成中...' : '生成课件'}
                </Button>
            </Box>

            {/* 生成结果预览 */}
            {generatedCourseware && (
                <Card sx={{ mt: 4 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            生成结果预览
                        </Typography>
                        <Typography variant="body1" paragraph>
                            <strong>标题：</strong>{generatedCourseware.title}
                        </Typography>
                        <Typography variant="body1" paragraph>
                            <strong>描述：</strong>{generatedCourseware.description}
                        </Typography>
                        
                        <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Button
                                variant="outlined"
                                startIcon={<ExcelIcon />}
                                onClick={() => exportToExcel(generatedCourseware._id)}
                            >
                                导出Excel
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<ShareIcon />}
                                onClick={() => generateShareLink(generatedCourseware)}
                            >
                                生成分享链接
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<PreviewIcon />}
                            >
                                详细预览
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            )}
        </Box>
    );

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                AI课件生成器 - 增强版
            </Typography>
            
            <Paper sx={{ p: 3 }}>
                <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
                    <Tab label="生成课件" icon={<AIIcon />} />
                    <Tab label="历史记录" icon={<HistoryIcon />} />
                </Tabs>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        {success}
                    </Alert>
                )}

                {activeTab === 0 && renderGeneratorTab()}
                {activeTab === 1 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            课件历史记录
                        </Typography>

                        {historyLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <>
                                {coursewareHistory.length === 0 ? (
                                    <Alert severity="info">
                                        暂无课件历史记录，请先生成一些课件。
                                    </Alert>
                                ) : (
                                    <>
                                        <Grid container spacing={2} sx={{ mb: 3 }}>
                                            <Grid item xs={12} sm={6} md={3}>
                                                <Card>
                                                    <CardContent sx={{ textAlign: 'center' }}>
                                                        <Typography variant="h4" color="primary">
                                                            {pagination.total}
                                                        </Typography>
                                                        <Typography variant="body2" color="textSecondary">
                                                            总课件数
                                                        </Typography>
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                            <Grid item xs={12} sm={6} md={3}>
                                                <Card>
                                                    <CardContent sx={{ textAlign: 'center' }}>
                                                        <Typography variant="h4" color="success.main">
                                                            {coursewareHistory.filter(c => c.status === '已发布').length}
                                                        </Typography>
                                                        <Typography variant="body2" color="textSecondary">
                                                            已发布
                                                        </Typography>
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                            <Grid item xs={12} sm={6} md={3}>
                                                <Card>
                                                    <CardContent sx={{ textAlign: 'center' }}>
                                                        <Typography variant="h4" color="warning.main">
                                                            {coursewareHistory.filter(c => c.status === '草稿').length}
                                                        </Typography>
                                                        <Typography variant="body2" color="textSecondary">
                                                            草稿
                                                        </Typography>
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                            <Grid item xs={12} sm={6} md={3}>
                                                <Card>
                                                    <CardContent sx={{ textAlign: 'center' }}>
                                                        <Typography variant="h4" color="info.main">
                                                            {coursewareHistory.filter(c => c.generationType === 'overview').length}
                                                        </Typography>
                                                        <Typography variant="body2" color="textSecondary">
                                                            概览类型
                                                        </Typography>
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                        </Grid>

                                        <List>
                                            {coursewareHistory.map((courseware, index) => (
                                                <ListItem key={courseware._id || index} divider>
                                                    <ListItemText
                                                        primary={
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <Typography variant="h6">
                                                                    {courseware.title}
                                                                </Typography>
                                                                <Chip
                                                                    label={courseware.status}
                                                                    size="small"
                                                                    color={courseware.status === '已发布' ? 'success' : 'default'}
                                                                />
                                                                <Chip
                                                                    label={courseware.generationType === 'overview' ? '概览' : '详细'}
                                                                    size="small"
                                                                    variant="outlined"
                                                                />
                                                            </Box>
                                                        }
                                                        secondary={
                                                            <Box>
                                                                <Typography variant="body2" color="textSecondary">
                                                                    {courseware.description}
                                                                </Typography>
                                                                <Typography variant="caption" color="textSecondary">
                                                                    生成时间: {new Date(courseware.generatedAt).toLocaleString()}
                                                                </Typography>
                                                            </Box>
                                                        }
                                                    />
                                                    <ListItemSecondaryAction>
                                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                                            <Tooltip title="预览">
                                                                <IconButton size="small">
                                                                    <PreviewIcon />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="导出Excel">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => exportToExcel(courseware._id)}
                                                                >
                                                                    <ExcelIcon />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="分享">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => generateShareLink(courseware)}
                                                                >
                                                                    <ShareIcon />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="编辑">
                                                                <IconButton size="small">
                                                                    <EditIcon />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="删除">
                                                                <IconButton size="small" color="error">
                                                                    <DeleteIcon />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Box>
                                                    </ListItemSecondaryAction>
                                                </ListItem>
                                            ))}
                                        </List>

                                        {pagination.pages > 1 && (
                                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                                                <Button
                                                    disabled={pagination.current === 1}
                                                    onClick={() => fetchCoursewareHistory(pagination.current - 1)}
                                                    startIcon={<RefreshIcon />}
                                                >
                                                    上一页
                                                </Button>
                                                <Typography sx={{ mx: 2, alignSelf: 'center' }}>
                                                    第 {pagination.current} 页，共 {pagination.pages} 页
                                                </Typography>
                                                <Button
                                                    disabled={pagination.current === pagination.pages}
                                                    onClick={() => fetchCoursewareHistory(pagination.current + 1)}
                                                    endIcon={<RefreshIcon />}
                                                >
                                                    下一页
                                                </Button>
                                            </Box>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </Box>
                )}
            </Paper>

            {/* 分享对话框 */}
            <Dialog open={shareDialog.open} onClose={() => setShareDialog({ ...shareDialog, open: false })}>
                <DialogTitle>分享课件</DialogTitle>
                <DialogContent>
                    <Typography variant="body1" gutterBottom>
                        课件：{shareDialog.courseware?.title}
                    </Typography>
                    <TextField
                        fullWidth
                        label="分享链接"
                        value={shareDialog.shareUrl}
                        InputProps={{ readOnly: true }}
                        sx={{ mt: 2 }}
                    />
                    <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                        链接有效期：7天
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShareDialog({ ...shareDialog, open: false })}>
                        取消
                    </Button>
                    <Button onClick={copyShareLink} variant="contained">
                        复制链接
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default EnhancedAICoursewareGenerator;
