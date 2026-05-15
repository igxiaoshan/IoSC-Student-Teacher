import React, { useState, useEffect, useCallback } from 'react';
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
    Tooltip
} from '@mui/material';
import {
    AutoFixHigh as AIIcon,
    Share as ShareIcon,
    History as HistoryIcon,
    Visibility as PreviewIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Description as WordIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import { aiAPI } from '../../utils/apiConfig';

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

    // SSE 流式状态
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingContent, setStreamingContent] = useState('');
    const [progressMessage, setProgressMessage] = useState('');

    // 历史记录
    const [coursewareHistory, setCoursewareHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

    // 分享对话框
    const [shareDialog, setShareDialog] = useState({ open: false, courseware: null, shareUrl: '' });

    // 预览对话框
    const [previewDialog, setPreviewDialog] = useState({ open: false, courseware: null });

    // 编辑对话框
    const [editDialog, setEditDialog] = useState({ open: false, courseware: null });

    // 删除确认对话框
    const [deleteDialog, setDeleteDialog] = useState({ open: false, courseware: null });

    // 编辑对话框标签页状态
    const [editTabValue, setEditTabValue] = useState(0);

    const courseLevels = ['初级', '中级', '高级'];
    const focusAreaOptions = [
        '理论基础', '实践应用', '案例分析', '技能训练', 
        '创新思维', '团队协作', '问题解决', '项目实战'
    ];

    // 获取课件历史记录
    const fetchCoursewareHistory = useCallback(async (page = 1) => {
        setHistoryLoading(true);
        try {
            const response = await aiAPI.getTeacherCoursewareHistory(currentUser._id);

            if (response.data.success) {
                setCoursewareHistory(response.data.data.coursewareList);
                setPagination(response.data.data.pagination);
            }
        } catch (err) {
            setError('获取历史记录失败：' + (err.response?.data?.message || err.message));
        } finally {
            setHistoryLoading(false);
        }
    }, [currentUser._id]);

    useEffect(() => {
        if (activeTab === 1) {
            fetchCoursewareHistory();
        }
    }, [activeTab, fetchCoursewareHistory]);

    // 生成课件 - SSE 流式模式
    const generateCourseware = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        setIsStreaming(true);
        setStreamingContent('');
        setProgressMessage('正在连接AI服务...');

        try {
            const response = await fetch(aiAPI.streamCoursewareUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, teacherId: currentUser._id })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));

                            if (data.type === 'connected') {
                                setProgressMessage('已连接，等待AI响应...');
                            } else if (data.type === 'progress') {
                                setProgressMessage(data.message);
                            } else if (data.type === 'chunk') {
                                setStreamingContent(prev => prev + data.content);
                                setProgressMessage('AI正在生成课件内容...');
                            } else if (data.type === 'complete') {
                                setGeneratedCourseware(data.courseware);
                                setSuccess('课件生成成功！');
                                setIsStreaming(false);
                                setProgressMessage('');
                                if (activeTab === 1) {
                                    fetchCoursewareHistory();
                                }
                                return;
                            } else if (data.type === 'error') {
                                throw new Error(data.message);
                            }
                        } catch (parseError) {
                            if (parseError.message && !parseError.message.includes('JSON')) {
                                throw parseError;
                            }
                        }
                    }
                }
            }
        } catch (err) {
            setError('生成课件时发生错误：' + (err.message || '未知错误'));
            setIsStreaming(false);
            setProgressMessage('');
        } finally {
            setLoading(false);
        }
    };

    // 导出Word文档
    const exportToWord = async (coursewareId) => {
        try {
            const response = await aiAPI.get(`/ai/courseware/${coursewareId}/export/word`, {
                responseType: 'blob'
            });

            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            });

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `课件详情_${Date.now()}.docx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            setSuccess('Word文档导出成功！');
        } catch (err) {
            setError('导出失败：' + (err.response?.data?.message || err.message));
        }
    };

    // 生成分享链接
    const generateShareLink = async (courseware) => {
        try {
            const response = await aiAPI.post(`/ai/courseware/${courseware._id}/share`, {
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
 const url = shareDialog.shareUrl;
 if (navigator.clipboard && window.isSecureContext) {
 navigator.clipboard.writeText(url).then(() => {
 setSuccess('分享链接已复制到剪贴板！');
 setShareDialog({ ...shareDialog, open: false });
 }).catch(() => {
 fallbackCopy(url);
 });
 } else {
 fallbackCopy(url);
 }
 };

 const fallbackCopy = (text) => {
 const textarea = document.createElement('textarea');
 textarea.value = text;
 textarea.style.position = 'fixed';
 textarea.style.opacity = '0';
 document.body.appendChild(textarea);
 textarea.select();
 try {
 document.execCommand('copy');
 setSuccess('分享链接已复制到剪贴板！');
 setShareDialog({ ...shareDialog, open: false });
 } catch {
 setError('复制失败，请手动复制链接');
 }
 document.body.removeChild(textarea);
 };
    // 详细预览
    const handleDetailPreview = (courseware) => {
        setPreviewDialog({
            open: true,
            courseware: courseware
        });
    };

    // 编辑课件
    const editCourseware = (courseware) => {
        setEditDialog({
            open: true,
            courseware: courseware
        });
        setEditTabValue(0); // 重置到第一个标签页
    };

    // 保存编辑
    const saveEditCourseware = async () => {
        try {
            // 收集基本信息
            const title = document.getElementById('edit-title')?.value || editDialog.courseware.title;
            const description = document.getElementById('edit-description')?.value || editDialog.courseware.description;
            const syllabus = document.getElementById('edit-syllabus')?.value || editDialog.courseware.syllabus;

            // 收集知识点数据
            const knowledgePoints = editDialog.courseware.knowledgePoints?.map((point, index) => ({
                title: document.getElementById(`edit-knowledge-title-${index}`)?.value || point.title,
                content: document.getElementById(`edit-knowledge-content-${index}`)?.value || point.content,
                difficulty: document.getElementById(`edit-knowledge-difficulty-${index}`)?.value || point.difficulty,
                estimatedTime: parseInt(document.getElementById(`edit-knowledge-time-${index}`)?.value) || point.estimatedTime
            })) || [];

            // 收集练习题数据
            const practiceExercises = editDialog.courseware.practiceExercises?.map((exercise, index) => ({
                title: document.getElementById(`edit-exercise-title-${index}`)?.value || exercise.title,
                description: document.getElementById(`edit-exercise-description-${index}`)?.value || exercise.description,
                difficulty: document.getElementById(`edit-exercise-difficulty-${index}`)?.value || exercise.difficulty,
                estimatedTime: parseInt(document.getElementById(`edit-exercise-time-${index}`)?.value) || exercise.estimatedTime
            })) || [];

            // 收集教学内容数据
            const teachingContent = {
                introduction: document.getElementById('edit-teaching-introduction')?.value || editDialog.courseware.teachingContent?.introduction,
                mainContent: document.getElementById('edit-teaching-main')?.value || editDialog.courseware.teachingContent?.mainContent,
                summary: document.getElementById('edit-teaching-summary')?.value || editDialog.courseware.teachingContent?.summary
            };

            const updatedData = {
                title,
                description,
                syllabus,
                knowledgePoints,
                practiceExercises,
                teachingContent
            };

            const response = await aiAPI.updateCourseware(editDialog.courseware._id, updatedData);

            if (response.data.success) {
                setSuccess('课件内容更新成功！');
                setEditDialog({ open: false, courseware: null });
                setEditTabValue(0); // 重置标签页
                // 刷新历史记录
                fetchCoursewareHistory();
            } else {
                setError('课件更新失败：' + response.data.message);
            }
        } catch (err) {
            setError('课件更新失败：' + (err.response?.data?.message || err.message));
        }
    };

    // 删除课件
    const deleteCourseware = (courseware) => {
        setDeleteDialog({
            open: true,
            courseware: courseware
        });
    };

    // 确认删除
    const confirmDeleteCourseware = async () => {
        try {
            const response = await aiAPI.deleteCourseware(deleteDialog.courseware._id);

            if (response.data.success) {
                setSuccess('课件删除成功！');
                setDeleteDialog({ open: false, courseware: null });
                // 刷新历史记录
                fetchCoursewareHistory();
            } else {
                setError('课件删除失败：' + response.data.message);
            }
        } catch (err) {
            setError('课件删除失败：' + (err.response?.data?.message || err.message));
        }
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

            {/* SSE 流式进度和内容预览 */}
            {isStreaming && (
                <Box sx={{ mt: 3 }}>
                    {progressMessage && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CircularProgress size={20} />
                                <Typography>{progressMessage}</Typography>
                            </Box>
                        </Alert>
                    )}
                    {streamingContent && (
                        <Paper sx={{ p: 2, maxHeight: 300, overflow: 'auto', bgcolor: '#f5f5f5' }}>
                            <Typography variant="subtitle2" gutterBottom>AI 生成内容预览</Typography>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                {streamingContent}
                            </Typography>
                        </Paper>
                    )}
                </Box>
            )}

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
                                startIcon={<WordIcon />}
                                onClick={() => exportToWord(generatedCourseware._id)}
                            >
                                导出Word
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
                                onClick={() => handleDetailPreview(generatedCourseware)}
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
                课件生成器
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
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleDetailPreview(courseware)}
                                                                >
                                                                    <PreviewIcon />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="导出Word">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => exportToWord(courseware._id)}
                                                                >
                                                                    <WordIcon />
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
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => editCourseware(courseware)}
                                                                >
                                                                    <EditIcon />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="删除">
                                                                <IconButton
                                                                    size="small"
                                                                    color="error"
                                                                    onClick={() => deleteCourseware(courseware)}
                                                                >
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

            {/* 详细预览对话框 */}
            <Dialog
                open={previewDialog.open}
                onClose={() => setPreviewDialog({ ...previewDialog, open: false })}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    课件详细预览
                </DialogTitle>
                <DialogContent>
                    {previewDialog.courseware && (
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                {previewDialog.courseware.title}
                            </Typography>
                            <Typography variant="body1" paragraph>
                                <strong>描述：</strong>{previewDialog.courseware.description}
                            </Typography>

                            {/* 知识点列表 */}
                            {previewDialog.courseware.knowledgePoints && (
                                <>
                                    <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                                        知识点
                                    </Typography>
                                    {previewDialog.courseware.knowledgePoints.map((point, index) => (
                                        <Card key={index} sx={{ mb: 2 }}>
                                            <CardContent>
                                                <Typography variant="subtitle1" gutterBottom>
                                                    {point.title}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" paragraph>
                                                    {point.content}
                                                </Typography>
                                                <Box sx={{ display: 'flex', gap: 2 }}>
                                                    <Chip
                                                        label={`难度: ${point.difficulty}`}
                                                        size="small"
                                                        color="primary"
                                                        variant="outlined"
                                                    />
                                                    <Chip
                                                        label={`时长: ${point.estimatedTime}分钟`}
                                                        size="small"
                                                        color="secondary"
                                                        variant="outlined"
                                                    />
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </>
                            )}

                            {/* 练习题列表 */}
                            {previewDialog.courseware.practiceExercises && (
                                <>
                                    <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                                        练习题
                                    </Typography>
                                    {previewDialog.courseware.practiceExercises.map((exercise, index) => (
                                        <Card key={index} sx={{ mb: 2 }}>
                                            <CardContent>
                                                <Typography variant="subtitle1" gutterBottom>
                                                    {exercise.title}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" paragraph>
                                                    {exercise.description}
                                                </Typography>
                                                <Box sx={{ display: 'flex', gap: 2 }}>
                                                    <Chip
                                                        label={`难度: ${exercise.difficulty}`}
                                                        size="small"
                                                        color="primary"
                                                        variant="outlined"
                                                    />
                                                    <Chip
                                                        label={`时长: ${exercise.estimatedTime}分钟`}
                                                        size="small"
                                                        color="secondary"
                                                        variant="outlined"
                                                    />
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </>
                            )}

                            {/* 生成信息 */}
                            <Divider sx={{ my: 3 }} />
                            <Typography variant="body2" color="text.secondary">
                                生成时间：{new Date(previewDialog.courseware.generatedAt).toLocaleString()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                生成类型：{previewDialog.courseware.generationType === 'overview' ? '概览' : '详细'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                AI提供商：{previewDialog.courseware.aiProvider}
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPreviewDialog({ ...previewDialog, open: false })}>
                        关闭
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 编辑课件对话框 */}
            <Dialog
                open={editDialog.open}
                onClose={() => setEditDialog({ open: false, courseware: null })}
                maxWidth="lg"
                fullWidth
                PaperProps={{ sx: { height: '90vh' } }}
            >
                <DialogTitle>编辑AI课件内容</DialogTitle>
                <DialogContent sx={{ p: 0 }}>
                    {editDialog.courseware && (
                        <Box sx={{ height: '100%' }}>
                            <Tabs value={editTabValue} onChange={(e, v) => setEditTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                <Tab label="基本信息" />
                                <Tab label="知识点" />
                                <Tab label="练习题" />
                                <Tab label="教学内容" />
                            </Tabs>

                            <Box sx={{ p: 3, height: 'calc(100% - 48px)', overflow: 'auto' }}>
                                {/* 基本信息标签页 */}
                                {editTabValue === 0 && (
                                    <Box>
                                        <TextField
                                            fullWidth
                                            label="课件标题"
                                            defaultValue={editDialog.courseware.title}
                                            margin="normal"
                                            id="edit-title"
                                        />
                                        <TextField
                                            fullWidth
                                            label="课件描述"
                                            defaultValue={editDialog.courseware.description}
                                            margin="normal"
                                            multiline
                                            rows={3}
                                            id="edit-description"
                                        />
                                        <TextField
                                            fullWidth
                                            label="课程大纲"
                                            defaultValue={editDialog.courseware.syllabus}
                                            margin="normal"
                                            multiline
                                            rows={6}
                                            id="edit-syllabus"
                                        />
                                    </Box>
                                )}

                                {/* 知识点标签页 */}
                                {editTabValue === 1 && (
                                    <Box>
                                        <Typography variant="h6" gutterBottom>
                                            编辑知识点
                                        </Typography>
                                        {editDialog.courseware.knowledgePoints?.map((point, index) => (
                                            <Card key={index} sx={{ mb: 2 }}>
                                                <CardContent>
                                                    <TextField
                                                        fullWidth
                                                        label={`知识点${index + 1}标题`}
                                                        defaultValue={point.title}
                                                        margin="normal"
                                                        id={`edit-knowledge-title-${index}`}
                                                    />
                                                    <TextField
                                                        fullWidth
                                                        label={`知识点${index + 1}内容`}
                                                        defaultValue={point.content}
                                                        margin="normal"
                                                        multiline
                                                        rows={4}
                                                        id={`edit-knowledge-content-${index}`}
                                                    />
                                                    <Grid container spacing={2} sx={{ mt: 1 }}>
                                                        <Grid item xs={6}>
                                                            <FormControl fullWidth>
                                                                <InputLabel>难度</InputLabel>
                                                                <Select
                                                                    defaultValue={point.difficulty}
                                                                    label="难度"
                                                                    id={`edit-knowledge-difficulty-${index}`}
                                                                >
                                                                    <MenuItem value="初级">初级</MenuItem>
                                                                    <MenuItem value="中级">中级</MenuItem>
                                                                    <MenuItem value="高级">高级</MenuItem>
                                                                </Select>
                                                            </FormControl>
                                                        </Grid>
                                                        <Grid item xs={6}>
                                                            <TextField
                                                                fullWidth
                                                                label="预估时间(分钟)"
                                                                type="number"
                                                                defaultValue={point.estimatedTime}
                                                                id={`edit-knowledge-time-${index}`}
                                                            />
                                                        </Grid>
                                                    </Grid>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </Box>
                                )}

                                {/* 练习题标签页 */}
                                {editTabValue === 2 && (
                                    <Box>
                                        <Typography variant="h6" gutterBottom>
                                            编辑练习题
                                        </Typography>
                                        {editDialog.courseware.practiceExercises?.map((exercise, index) => (
                                            <Card key={index} sx={{ mb: 2 }}>
                                                <CardContent>
                                                    <TextField
                                                        fullWidth
                                                        label={`练习题${index + 1}标题`}
                                                        defaultValue={exercise.title}
                                                        margin="normal"
                                                        id={`edit-exercise-title-${index}`}
                                                    />
                                                    <TextField
                                                        fullWidth
                                                        label={`练习题${index + 1}描述`}
                                                        defaultValue={exercise.description}
                                                        margin="normal"
                                                        multiline
                                                        rows={3}
                                                        id={`edit-exercise-description-${index}`}
                                                    />
                                                    <Grid container spacing={2} sx={{ mt: 1 }}>
                                                        <Grid item xs={6}>
                                                            <FormControl fullWidth>
                                                                <InputLabel>难度</InputLabel>
                                                                <Select
                                                                    defaultValue={exercise.difficulty}
                                                                    label="难度"
                                                                    id={`edit-exercise-difficulty-${index}`}
                                                                >
                                                                    <MenuItem value="初级">初级</MenuItem>
                                                                    <MenuItem value="中级">中级</MenuItem>
                                                                    <MenuItem value="高级">高级</MenuItem>
                                                                </Select>
                                                            </FormControl>
                                                        </Grid>
                                                        <Grid item xs={6}>
                                                            <TextField
                                                                fullWidth
                                                                label="预估时间(分钟)"
                                                                type="number"
                                                                defaultValue={exercise.estimatedTime}
                                                                id={`edit-exercise-time-${index}`}
                                                            />
                                                        </Grid>
                                                    </Grid>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </Box>
                                )}

                                {/* 教学内容标签页 */}
                                {editTabValue === 3 && (
                                    <Box>
                                        <Typography variant="h6" gutterBottom>
                                            编辑教学内容
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            label="课程引言"
                                            defaultValue={editDialog.courseware.teachingContent?.introduction}
                                            margin="normal"
                                            multiline
                                            rows={3}
                                            id="edit-teaching-introduction"
                                        />
                                        <TextField
                                            fullWidth
                                            label="主要内容"
                                            defaultValue={editDialog.courseware.teachingContent?.mainContent}
                                            margin="normal"
                                            multiline
                                            rows={5}
                                            id="edit-teaching-main"
                                        />
                                        <TextField
                                            fullWidth
                                            label="课程总结"
                                            defaultValue={editDialog.courseware.teachingContent?.summary}
                                            margin="normal"
                                            multiline
                                            rows={3}
                                            id="edit-teaching-summary"
                                        />
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialog({ open: false, courseware: null })}>
                        取消
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => saveEditCourseware()}
                    >
                        保存课件内容
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 删除确认对话框 */}
            <Dialog
                open={deleteDialog.open}
                onClose={() => setDeleteDialog({ open: false, courseware: null })}
            >
                <DialogTitle>确认删除</DialogTitle>
                <DialogContent>
                    <Typography>
                        确定要删除课件 "{deleteDialog.courseware?.title}" 吗？此操作不可撤销。
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog({ open: false, courseware: null })}>
                        取消
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={confirmDeleteCourseware}
                    >
                        删除
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default EnhancedAICoursewareGenerator;
