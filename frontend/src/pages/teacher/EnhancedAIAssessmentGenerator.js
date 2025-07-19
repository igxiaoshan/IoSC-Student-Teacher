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
    Checkbox,
    FormControlLabel,
    FormGroup,
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
    Quiz as AssessmentIcon,
    Share as ShareIcon,
    History as HistoryIcon,
    Visibility as PreviewIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Description as WordIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import { aiAPI } from '../../utils/apiConfig';

const EnhancedAIAssessmentGenerator = () => {
    const { currentUser } = useSelector(state => state.user);
    
    // 基础状态
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState(0);
    
    // 生成表单数据
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        coursewareId: '',
        difficulty: '中级',
        questionCount: 10,
        questionTypes: ['选择题'],
        duration: 60,
        focusAreas: []
    });
    
    // 课件列表
    const [coursewareList, setCoursewareList] = useState([]);
    
    // 生成结果
    const [generatedAssessment, setGeneratedAssessment] = useState(null);
    
    // 历史记录
    const [historyLoading, setHistoryLoading] = useState(false);
    const [assessmentHistory, setAssessmentHistory] = useState([]);
    
    // 预览对话框
    const [previewDialog, setPreviewDialog] = useState({ open: false, assessment: null });
    
    // 编辑对话框
    const [editDialog, setEditDialog] = useState({ open: false, assessment: null });
    const [editTabValue, setEditTabValue] = useState(0);
    
    // 删除确认对话框
    const [deleteDialog, setDeleteDialog] = useState({ open: false, assessment: null });
    
    // 分享对话框
    const [shareDialog, setShareDialog] = useState({ open: false, assessment: null, shareUrl: '' });

    // 常量定义
    const difficulties = ['初级', '中级', '高级'];
    const questionTypes = ['选择题', '填空题', '简答题', '编程题', '实操题'];
    const commonFocusAreas = [
        '基础概念', '实际应用', '问题分析', '代码实现', 
        '系统设计', '算法思维', '调试能力', '优化技巧'
    ];

    // 获取课件列表
    useEffect(() => {
        if (currentUser?._id) {
            fetchCoursewareList();
        }
    }, [currentUser]);

    // 获取历史记录
    const fetchAssessmentHistory = useCallback(async (page = 1) => {
        if (!currentUser?._id) return;
        
        setHistoryLoading(true);
        try {
            const response = await aiAPI.get(`/ai/assessment/teacher/${currentUser._id}/history`);
            if (response.data.success) {
                setAssessmentHistory(response.data.data.assessmentList || []);
            }
        } catch (err) {
            console.error('获取考核历史失败:', err);
            setError('获取历史记录失败：' + (err.response?.data?.message || err.message));
        } finally {
            setHistoryLoading(false);
        }
    }, [currentUser._id]);

    useEffect(() => {
        if (activeTab === 1) {
            fetchAssessmentHistory();
        }
    }, [activeTab, fetchAssessmentHistory]);

    // 获取课件列表
    const fetchCoursewareList = async () => {
        try {
            const response = await aiAPI.getTeacherCourseware(currentUser._id);
            if (response.data.success) {
                setCoursewareList(response.data.courseware || []);
            }
        } catch (err) {
            console.error('获取课件列表失败:', err);
        }
    };

    // 处理表单输入
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // 处理题型选择
    const handleQuestionTypeChange = (type, checked) => {
        setFormData(prev => ({
            ...prev,
            questionTypes: checked 
                ? [...prev.questionTypes, type]
                : prev.questionTypes.filter(t => t !== type)
        }));
    };

    // 处理关注领域选择
    const handleFocusAreaChange = (area, checked) => {
        setFormData(prev => ({
            ...prev,
            focusAreas: checked 
                ? [...prev.focusAreas, area]
                : prev.focusAreas.filter(a => a !== area)
        }));
    };

    // 生成考核
    const generateAssessment = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        
        try {
            const subjectId = currentUser?.teachSubject?._id;
            const teacherId = currentUser?._id;

            if (!subjectId || !teacherId) {
                setError('用户信息不完整，无法生成考核');
                return;
            }

            const response = await aiAPI.post('/ai/assessment/generate', {
                ...formData,
                subjectId: subjectId,
                teacherId: teacherId
            });

            if (response.data.success) {
                setGeneratedAssessment(response.data.assessment);
                setSuccess('考核题目生成成功！');
                // 刷新历史记录
                if (activeTab === 1) {
                    fetchAssessmentHistory();
                }
            } else {
                setError(response.data.message || '生成失败');
            }
        } catch (err) {
            setError('生成考核时发生错误：' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    // 详细预览
    const handleDetailPreview = (assessment) => {
        setPreviewDialog({
            open: true,
            assessment: assessment
        });
    };

    // 编辑考核
    const editAssessment = (assessment) => {
        setEditDialog({
            open: true,
            assessment: assessment
        });
        setEditTabValue(0);
    };

    // 保存编辑
    const saveEditAssessment = async () => {
        try {
            // 收集基本信息
            const title = document.getElementById('edit-title')?.value || editDialog.assessment.title;
            const description = document.getElementById('edit-description')?.value || editDialog.assessment.description;
            const duration = parseInt(document.getElementById('edit-duration')?.value) || editDialog.assessment.duration;

            // 收集题目数据
            const questions = editDialog.assessment.questions?.map((question, index) => ({
                question: document.getElementById(`edit-question-${index}`)?.value || question.question,
                type: document.getElementById(`edit-question-type-${index}`)?.value || question.type,
                options: question.options || [],
                correctAnswer: document.getElementById(`edit-question-answer-${index}`)?.value || question.correctAnswer,
                points: parseInt(document.getElementById(`edit-question-points-${index}`)?.value) || question.points,
                explanation: document.getElementById(`edit-question-explanation-${index}`)?.value || question.explanation
            })) || [];

            const updatedData = {
                title,
                description,
                duration,
                questions
            };

            const response = await aiAPI.put(`/ai/assessment/${editDialog.assessment._id}`, updatedData);

            if (response.data.success) {
                setSuccess('考核内容更新成功！');
                setEditDialog({ open: false, assessment: null });
                setEditTabValue(0);
                fetchAssessmentHistory();
            } else {
                setError('考核更新失败：' + response.data.message);
            }
        } catch (err) {
            setError('考核更新失败：' + (err.response?.data?.message || err.message));
        }
    };

    // 删除考核
    const deleteAssessment = (assessment) => {
        setDeleteDialog({
            open: true,
            assessment: assessment
        });
    };

    // 确认删除
    const confirmDeleteAssessment = async () => {
        try {
            const response = await aiAPI.delete(`/ai/assessment/${deleteDialog.assessment._id}`);

            if (response.data.success) {
                setSuccess('考核删除成功！');
                setDeleteDialog({ open: false, assessment: null });
                fetchAssessmentHistory();
            } else {
                setError('考核删除失败：' + response.data.message);
            }
        } catch (err) {
            setError('考核删除失败：' + (err.response?.data?.message || err.message));
        }
    };

    // 导出Word
    const exportToWord = async (assessmentId) => {
        try {
            const response = await aiAPI.get(`/ai/assessment/${assessmentId}/export/word`, {
                responseType: 'blob'
            });

            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            });

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `考核题目_${Date.now()}.docx`;
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
    const generateShareLink = async (assessment) => {
        try {
            const response = await aiAPI.post(`/ai/assessment/${assessment._id}/share`, {
                expiresIn: 7
            });

            if (response.data.success) {
                setShareDialog({
                    open: true,
                    assessment: assessment,
                    shareUrl: response.data.shareUrl
                });
                setSuccess('分享链接生成成功！');
            } else {
                setError('分享链接生成失败：' + response.data.message);
            }
        } catch (err) {
            setError('分享链接生成失败：' + (err.response?.data?.message || err.message));
        }
    };

    // 复制分享链接
    const copyShareLink = () => {
        navigator.clipboard.writeText(shareDialog.shareUrl);
        setSuccess('分享链接已复制到剪贴板！');
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {success && (
                <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
                    {success}
                </Alert>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            <Paper sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <AssessmentIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                        AI考核生成器
                    </Typography>
                </Box>

                <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 3 }}>
                    <Tab label="生成考核" />
                    <Tab label="历史记录" />
                </Tabs>

                {/* 生成考核标签页 */}
                {activeTab === 0 && (
                    <Box>
                        {/* 生成表单内容 */}
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="考核标题"
                                    value={formData.title}
                                    onChange={(e) => handleInputChange('title', e.target.value)}
                                    required
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    label="考核描述"
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    required
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <InputLabel>基于课件（可选）</InputLabel>
                                    <Select
                                        value={formData.coursewareId}
                                        onChange={(e) => handleInputChange('coursewareId', e.target.value)}
                                    >
                                        <MenuItem value="">不基于特定课件</MenuItem>
                                        {coursewareList.map(courseware => (
                                            <MenuItem key={courseware._id} value={courseware._id}>
                                                {courseware.title}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={6}>
                                <FormControl fullWidth>
                                    <InputLabel>难度等级</InputLabel>
                                    <Select
                                        value={formData.difficulty}
                                        onChange={(e) => handleInputChange('difficulty', e.target.value)}
                                    >
                                        {difficulties.map(difficulty => (
                                            <MenuItem key={difficulty} value={difficulty}>
                                                {difficulty}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="题目数量"
                                    value={formData.questionCount}
                                    onChange={(e) => handleInputChange('questionCount', parseInt(e.target.value))}
                                    inputProps={{ min: 1, max: 50 }}
                                />
                            </Grid>

                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="考试时长（分钟）"
                                    value={formData.duration}
                                    onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                                    inputProps={{ min: 10, max: 300 }}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <Typography variant="subtitle1" gutterBottom>
                                    题目类型
                                </Typography>
                                <FormGroup row>
                                    {questionTypes.map(type => (
                                        <FormControlLabel
                                            key={type}
                                            control={
                                                <Checkbox
                                                    checked={formData.questionTypes.includes(type)}
                                                    onChange={(e) => handleQuestionTypeChange(type, e.target.checked)}
                                                />
                                            }
                                            label={type}
                                        />
                                    ))}
                                </FormGroup>
                            </Grid>

                            <Grid item xs={12}>
                                <Typography variant="subtitle1" gutterBottom>
                                    关注领域
                                </Typography>
                                <FormGroup row>
                                    {commonFocusAreas.map(area => (
                                        <FormControlLabel
                                            key={area}
                                            control={
                                                <Checkbox
                                                    checked={formData.focusAreas.includes(area)}
                                                    onChange={(e) => handleFocusAreaChange(area, e.target.checked)}
                                                />
                                            }
                                            label={area}
                                        />
                                    ))}
                                </FormGroup>
                            </Grid>
                        </Grid>

                        <Box sx={{ mt: 3, textAlign: 'center' }}>
                            <Button
                                variant="contained"
                                size="large"
                                onClick={generateAssessment}
                                disabled={loading || !formData.title}
                                startIcon={loading ? <CircularProgress size={20} /> : <AssessmentIcon />}
                                sx={{ px: 4, py: 1.5 }}
                            >
                                {loading ? '生成中...' : '生成考核题目'}
                            </Button>
                        </Box>
                    </Box>
                )}

                {/* 历史记录标签页 */}
                {activeTab === 1 && (
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h6">考核历史记录</Typography>
                            <Button
                                startIcon={<RefreshIcon />}
                                onClick={() => fetchAssessmentHistory()}
                                disabled={historyLoading}
                            >
                                刷新
                            </Button>
                        </Box>

                        {historyLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <List>
                                {assessmentHistory.map((assessment, index) => (
                                    <ListItem key={assessment._id} divider>
                                        <ListItemText
                                            primary={assessment.title}
                                            secondary={
                                                <Box>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {assessment.description}
                                                    </Typography>
                                                    <Box sx={{ mt: 1 }}>
                                                        <Chip label={assessment.status} size="small" sx={{ mr: 1 }} />
                                                        <Chip label={`${assessment.questions?.length || 0}题`} size="small" sx={{ mr: 1 }} />
                                                        <Chip label={`${assessment.duration}分钟`} size="small" />
                                                    </Box>
                                                </Box>
                                            }
                                        />
                                        <ListItemSecondaryAction>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Tooltip title="预览">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDetailPreview(assessment)}
                                                    >
                                                        <PreviewIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="导出Word">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => exportToWord(assessment._id)}
                                                    >
                                                        <WordIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="分享">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => generateShareLink(assessment)}
                                                    >
                                                        <ShareIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="编辑">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => editAssessment(assessment)}
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="删除">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => deleteAssessment(assessment)}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Box>
                )}
            </Paper>

            {/* 预览对话框 */}
            <Dialog
                open={previewDialog.open}
                onClose={() => setPreviewDialog({ open: false, assessment: null })}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>考核详情预览</DialogTitle>
                <DialogContent>
                    {previewDialog.assessment && (
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                {previewDialog.assessment.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                {previewDialog.assessment.description}
                            </Typography>

                            <Box sx={{ mb: 2 }}>
                                <Chip label={`难度: ${previewDialog.assessment.difficulty}`} sx={{ mr: 1 }} />
                                <Chip label={`时长: ${previewDialog.assessment.duration}分钟`} sx={{ mr: 1 }} />
                                <Chip label={`题目: ${previewDialog.assessment.questions?.length || 0}题`} />
                            </Box>

                            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                                题目列表:
                            </Typography>
                            {previewDialog.assessment.questions?.map((question, index) => (
                                <Card key={index} sx={{ mb: 2 }}>
                                    <CardContent>
                                        <Typography variant="subtitle2" gutterBottom>
                                            第{index + 1}题 ({question.type}) - {question.points}分
                                        </Typography>
                                        <Typography variant="body1" paragraph>
                                            {question.question}
                                        </Typography>
                                        {question.options && question.options.length > 0 && (
                                            <Box sx={{ ml: 2 }}>
                                                {question.options.map((option, optIndex) => (
                                                    <Typography key={optIndex} variant="body2">
                                                        {String.fromCharCode(65 + optIndex)}. {option}
                                                    </Typography>
                                                ))}
                                            </Box>
                                        )}
                                        {question.explanation && (
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                                解析: {question.explanation}
                                            </Typography>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPreviewDialog({ open: false, assessment: null })}>
                        关闭
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 编辑考核对话框 */}
            <Dialog
                open={editDialog.open}
                onClose={() => setEditDialog({ open: false, assessment: null })}
                maxWidth="lg"
                fullWidth
                PaperProps={{ sx: { height: '90vh' } }}
            >
                <DialogTitle>编辑AI考核内容</DialogTitle>
                <DialogContent sx={{ p: 0 }}>
                    {editDialog.assessment && (
                        <Box sx={{ height: '100%' }}>
                            <Tabs value={editTabValue} onChange={(e, v) => setEditTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                <Tab label="基本信息" />
                                <Tab label="题目编辑" />
                            </Tabs>

                            <Box sx={{ p: 3, height: 'calc(100% - 48px)', overflow: 'auto' }}>
                                {/* 基本信息标签页 */}
                                {editTabValue === 0 && (
                                    <Box>
                                        <TextField
                                            fullWidth
                                            label="考核标题"
                                            defaultValue={editDialog.assessment.title}
                                            margin="normal"
                                            id="edit-title"
                                        />
                                        <TextField
                                            fullWidth
                                            label="考核描述"
                                            defaultValue={editDialog.assessment.description}
                                            margin="normal"
                                            multiline
                                            rows={3}
                                            id="edit-description"
                                        />
                                        <TextField
                                            fullWidth
                                            label="考试时长(分钟)"
                                            type="number"
                                            defaultValue={editDialog.assessment.duration}
                                            margin="normal"
                                            id="edit-duration"
                                        />
                                    </Box>
                                )}

                                {/* 题目编辑标签页 */}
                                {editTabValue === 1 && (
                                    <Box>
                                        <Typography variant="h6" gutterBottom>
                                            编辑题目
                                        </Typography>
                                        {editDialog.assessment.questions?.map((question, index) => (
                                            <Card key={index} sx={{ mb: 2 }}>
                                                <CardContent>
                                                    <Typography variant="subtitle1" gutterBottom>
                                                        第{index + 1}题
                                                    </Typography>
                                                    <TextField
                                                        fullWidth
                                                        label="题目内容"
                                                        defaultValue={question.question}
                                                        margin="normal"
                                                        multiline
                                                        rows={2}
                                                        id={`edit-question-${index}`}
                                                    />
                                                    <Grid container spacing={2} sx={{ mt: 1 }}>
                                                        <Grid item xs={4}>
                                                            <FormControl fullWidth>
                                                                <InputLabel>题目类型</InputLabel>
                                                                <Select
                                                                    defaultValue={question.type}
                                                                    label="题目类型"
                                                                    id={`edit-question-type-${index}`}
                                                                >
                                                                    {questionTypes.map(type => (
                                                                        <MenuItem key={type} value={type}>{type}</MenuItem>
                                                                    ))}
                                                                </Select>
                                                            </FormControl>
                                                        </Grid>
                                                        <Grid item xs={4}>
                                                            <TextField
                                                                fullWidth
                                                                label="分值"
                                                                type="number"
                                                                defaultValue={question.points}
                                                                id={`edit-question-points-${index}`}
                                                            />
                                                        </Grid>
                                                        <Grid item xs={4}>
                                                            <TextField
                                                                fullWidth
                                                                label="正确答案"
                                                                defaultValue={question.correctAnswer}
                                                                id={`edit-question-answer-${index}`}
                                                            />
                                                        </Grid>
                                                    </Grid>
                                                    <TextField
                                                        fullWidth
                                                        label="题目解析"
                                                        defaultValue={question.explanation}
                                                        margin="normal"
                                                        multiline
                                                        rows={2}
                                                        id={`edit-question-explanation-${index}`}
                                                    />
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialog({ open: false, assessment: null })}>
                        取消
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => saveEditAssessment()}
                    >
                        保存考核内容
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 删除确认对话框 */}
            <Dialog
                open={deleteDialog.open}
                onClose={() => setDeleteDialog({ open: false, assessment: null })}
            >
                <DialogTitle>确认删除</DialogTitle>
                <DialogContent>
                    <Typography>
                        确定要删除考核 "{deleteDialog.assessment?.title}" 吗？此操作不可撤销。
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog({ open: false, assessment: null })}>
                        取消
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={confirmDeleteAssessment}
                    >
                        删除
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 分享对话框 */}
            <Dialog
                open={shareDialog.open}
                onClose={() => setShareDialog({ open: false, assessment: null, shareUrl: '' })}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>分享考核</DialogTitle>
                <DialogContent>
                    <Typography variant="body1" gutterBottom>
                        考核 "{shareDialog.assessment?.title}" 的分享链接已生成：
                    </Typography>
                    <TextField
                        fullWidth
                        value={shareDialog.shareUrl}
                        margin="normal"
                        InputProps={{
                            readOnly: true,
                        }}
                        onClick={(e) => e.target.select()}
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        链接有效期：7天
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShareDialog({ open: false, assessment: null, shareUrl: '' })}>
                        关闭
                    </Button>
                    <Button variant="contained" onClick={copyShareLink}>
                        复制链接
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default EnhancedAIAssessmentGenerator;
