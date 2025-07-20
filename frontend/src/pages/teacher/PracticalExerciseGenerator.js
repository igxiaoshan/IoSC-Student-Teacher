import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Grid,
    Card,
    CardContent,
    CardActions,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tabs,
    Tab,
    Alert,
    CircularProgress,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    List,
    ListItem,
    ListItemText,
    Divider,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    Add as AddIcon,
    Download as DownloadIcon,
    Share as ShareIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as VisibilityIcon,
    Code as CodeIcon,
    Assignment as AssignmentIcon,
    Build as BuildIcon,
    Psychology as PsychologyIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { aiAPI } from '../../utils/apiConfig';

const PracticalExerciseGenerator = () => {
    const { currentUser } = useSelector(state => state.user);
    
    // 状态管理
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // 表单数据
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        coursewareId: '',
        difficulty: '中级',
        questionCount: 5,
        questionTypes: ['实操题'],
        duration: 120,
        focusAreas: ['基础概念'],
        targetSkills: [],
        exerciseType: '综合实训'
    });
    
    // 生成结果
    const [generatedExercise, setGeneratedExercise] = useState(null);
    const [showGeneratedResult, setShowGeneratedResult] = useState(false);
    
    // 历史记录
    const [exerciseHistory, setExerciseHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    
    // 课件列表
    const [coursewareList, setCoursewareList] = useState([]);
    const [coursewareLoading, setCoursewareLoading] = useState(false);
    
    // 预览对话框
    const [previewDialog, setPreviewDialog] = useState(false);
    const [previewExercise, setPreviewExercise] = useState(null);

    // 选项配置
    const difficultyOptions = ['初级', '中级', '高级'];
    const questionTypeOptions = ['实操题', '编程题', '案例分析', '项目实战', '调试题', '设计题'];
    const exerciseTypeOptions = ['综合实训', '专项练习', '项目实战', '技能考核'];
    const focusAreaOptions = ['基础概念', '实际应用', '问题分析', '代码实现', '系统设计', '调试技能'];
    const skillOptions = ['编程能力', '系统分析', '问题解决', '项目管理', '团队协作', '创新思维'];

    // 通用的选项文本提取函数
    const getOptionText = (option) => {
        if (typeof option === 'string') {
            return option;
        }
        if (typeof option === 'object' && option !== null) {
            return option.text || option.content || String(option);
        }
        return String(option);
    };

    // 获取课件列表
    useEffect(() => {
        fetchCoursewareList();
    }, []);

    // 获取历史记录
    useEffect(() => {
        if (activeTab === 1) {
            fetchExerciseHistory();
        }
    }, [activeTab]);

    const fetchCoursewareList = async () => {
        setCoursewareLoading(true);
        try {
            const response = await aiAPI.getTeacherCourseware(currentUser._id);
            console.log('课件API响应:', response.data);

            if (response.data.success) {
                // 根据后端实际返回的数据结构调整
                const coursewareData = response.data.data?.coursewareList || response.data.courseware || [];
                setCoursewareList(coursewareData);
                console.log('获取到的课件列表:', coursewareData);

                if (coursewareData.length === 0) {
                    setError('暂无可用课件，请先创建课件');
                }
            } else {
                console.warn('获取课件列表失败:', response.data.message);
                setError('获取课件列表失败');
            }
        } catch (error) {
            console.error('获取课件列表失败:', error);
            setError('获取课件列表失败，请检查网络连接');
        } finally {
            setCoursewareLoading(false);
        }
    };

    const fetchExerciseHistory = async () => {
        setHistoryLoading(true);
        try {
            const response = await aiAPI.getTeacherPracticalExercises(currentUser._id);
            if (response.data.success) {
                setExerciseHistory(response.data.exercises || []);
            }
        } catch (error) {
            console.error('获取实训练习历史失败:', error);
            setError('获取历史记录失败');
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        setError('');
        setSuccess('');
    };

    const handleArrayFieldChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: Array.isArray(value) ? value : [value]
        }));
    };

    const generateExercise = async () => {
        if (!formData.title.trim()) {
            setError('请输入实训练习标题');
            return;
        }

        if (!formData.coursewareId) {
            setError('请选择关联的课件');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await aiAPI.generatePracticalExercise(currentUser._id, {
                ...formData,
                subjectId: currentUser.teachSubject,
                teacherId: currentUser._id
            });

            if (response.data.success) {
                setGeneratedExercise(response.data.exercise);
                setShowGeneratedResult(true);
                setSuccess(`实训练习生成成功！数据源：${response.data.dataSource === 'dify' ? 'Dify AI' : '本地智能生成'}`);
                
                // 刷新历史记录
                if (activeTab === 1) {
                    fetchExerciseHistory();
                }
            } else {
                setError(response.data.message || '生成失败');
            }
        } catch (error) {
            console.error('生成实训练习失败:', error);
            setError(error.response?.data?.message || '生成失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    const handlePreview = (exercise) => {
        setPreviewExercise(exercise);
        setPreviewDialog(true);
    };

    const handleDownload = async (exercise) => {
        try {
            const response = await aiAPI.exportPracticalExerciseToWord(exercise);

            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            });

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `实训练习_${exercise.title}_${Date.now()}.docx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            setSuccess('实训练习下载成功');
        } catch (error) {
            console.error('下载失败:', error);
            setError('下载失败，请稍后重试');
        }
    };

    const handleDelete = async (exerciseId) => {
        if (!window.confirm('确定要删除这个实训练习吗？')) {
            return;
        }

        try {
            const response = await aiAPI.deletePracticalExercise(exerciseId);
            if (response.data.success) {
                setSuccess('实训练习删除成功');
                fetchExerciseHistory();
            }
        } catch (error) {
            console.error('删除失败:', error);
            setError('删除失败，请稍后重试');
        }
    };

    const getQuestionTypeIcon = (type) => {
        switch (type) {
            case '编程题': return <CodeIcon />;
            case '实操题': return <BuildIcon />;
            case '案例分析': return <PsychologyIcon />;
            case '项目实战': return <AssignmentIcon />;
            default: return <BuildIcon />;
        }
    };

    const renderGenerationForm = () => (
        <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
                生成实训练习
            </Typography>
            
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="实训练习标题"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="例如：Web开发综合实训"
                    />
                </Grid>
                
                <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                        <InputLabel>关联课件</InputLabel>
                        <Select
                            value={formData.coursewareId}
                            onChange={(e) => handleInputChange('coursewareId', e.target.value)}
                            displayEmpty
                            disabled={coursewareLoading}
                        >
                            <MenuItem value="">
                                <em>{coursewareLoading ? '加载中...' : '请选择课件'}</em>
                            </MenuItem>
                            {coursewareLoading ? (
                                <MenuItem disabled>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CircularProgress size={16} />
                                        <em>正在加载课件列表...</em>
                                    </Box>
                                </MenuItem>
                            ) : coursewareList.length === 0 ? (
                                <MenuItem disabled>
                                    <em>暂无可用课件</em>
                                </MenuItem>
                            ) : (
                                coursewareList.map((courseware) => (
                                    <MenuItem key={courseware._id} value={courseware._id}>
                                        <Box>
                                            <Typography variant="body2">
                                                {courseware.title}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                {courseware.subject?.subName || '未知学科'} |
                                                状态：{courseware.status || '草稿'} |
                                                创建时间：{courseware.generatedAt ? new Date(courseware.generatedAt).toLocaleDateString() : '未知'}
                                            </Typography>
                                        </Box>
                                    </MenuItem>
                                ))
                            )}
                        </Select>
                    </FormControl>
                    {!coursewareLoading && coursewareList.length === 0 && (
                        <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                                提示：请先创建课件，然后再生成实训练习
                            </Typography>
                            <Button
                                size="small"
                                onClick={fetchCoursewareList}
                                sx={{ mt: 0.5 }}
                            >
                                刷新课件列表
                            </Button>
                        </Box>
                    )}
                </Grid>

                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="实训描述"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="描述实训的目标、要求和预期成果..."
                    />
                </Grid>

                <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                        <InputLabel>难度等级</InputLabel>
                        <Select
                            value={formData.difficulty}
                            onChange={(e) => handleInputChange('difficulty', e.target.value)}
                        >
                            {difficultyOptions.map((option) => (
                                <MenuItem key={option} value={option}>{option}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                        <InputLabel>实训类型</InputLabel>
                        <Select
                            value={formData.exerciseType}
                            onChange={(e) => handleInputChange('exerciseType', e.target.value)}
                        >
                            {exerciseTypeOptions.map((option) => (
                                <MenuItem key={option} value={option}>{option}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                    <TextField
                        fullWidth
                        type="number"
                        label="题目数量"
                        value={formData.questionCount}
                        onChange={(e) => handleInputChange('questionCount', parseInt(e.target.value))}
                        inputProps={{ min: 1, max: 20 }}
                    />
                </Grid>

                <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                        <InputLabel>题目类型</InputLabel>
                        <Select
                            multiple
                            value={formData.questionTypes}
                            onChange={(e) => handleArrayFieldChange('questionTypes', e.target.value)}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((value) => (
                                        <Chip key={value} label={value} size="small" />
                                    ))}
                                </Box>
                            )}
                        >
                            {questionTypeOptions.map((option) => (
                                <MenuItem key={option} value={option}>{option}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        type="number"
                        label="建议时长（分钟）"
                        value={formData.duration}
                        onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                        inputProps={{ min: 30, max: 480 }}
                    />
                </Grid>

                <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                        <InputLabel>关注领域</InputLabel>
                        <Select
                            multiple
                            value={formData.focusAreas}
                            onChange={(e) => handleArrayFieldChange('focusAreas', e.target.value)}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((value) => (
                                        <Chip key={value} label={value} size="small" />
                                    ))}
                                </Box>
                            )}
                        >
                            {focusAreaOptions.map((option) => (
                                <MenuItem key={option} value={option}>{option}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                        <InputLabel>目标技能</InputLabel>
                        <Select
                            multiple
                            value={formData.targetSkills}
                            onChange={(e) => handleArrayFieldChange('targetSkills', e.target.value)}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((value) => (
                                        <Chip key={value} label={value} size="small" />
                                    ))}
                                </Box>
                            )}
                        >
                            {skillOptions.map((option) => (
                                <MenuItem key={option} value={option}>{option}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                    variant="contained"
                    onClick={generateExercise}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
                >
                    {loading ? '生成中...' : '生成实训练习'}
                </Button>
            </Box>
        </Paper>
    );

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                AI实训练习生成器
            </Typography>
            
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}
            
            {success && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
                    {success}
                </Alert>
            )}

            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
                <Tab label="生成实训练习" />
                <Tab label="历史记录" />
            </Tabs>

            {activeTab === 0 && (
                <>
                    {renderGenerationForm()}
                    
                    {showGeneratedResult && generatedExercise && (
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                生成结果预览
                            </Typography>
                            
                            <Card>
                                <CardContent>
                                    <Typography variant="h6">{generatedExercise.title}</Typography>
                                    <Typography color="textSecondary" gutterBottom>
                                        {generatedExercise.description}
                                    </Typography>
                                    
                                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                        <Chip label={`难度：${generatedExercise.difficulty}`} size="small" />
                                        <Chip label={`类型：${generatedExercise.exerciseType}`} size="small" />
                                        <Chip label={`时长：${generatedExercise.duration}分钟`} size="small" />
                                        <Chip label={`题目：${generatedExercise.questions?.length || 0}道`} size="small" />
                                    </Box>

                                    {generatedExercise.questions && generatedExercise.questions.length > 0 && (
                                        <Box>
                                            <Typography variant="subtitle2" gutterBottom>
                                                题目预览：
                                            </Typography>
                                            {generatedExercise.questions.slice(0, 2).map((question, index) => (
                                                <Box key={index} sx={{ ml: 2, mb: 1 }}>
                                                    <Typography variant="body2">
                                                        {question.questionNumber}. {question.questionText || question.question}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        类型：{question.questionType || question.type} | 分值：{question.points}分
                                                    </Typography>
                                                </Box>
                                            ))}
                                            {generatedExercise.questions.length > 2 && (
                                                <Typography variant="caption" color="textSecondary">
                                                    ...还有{generatedExercise.questions.length - 2}道题目
                                                </Typography>
                                            )}
                                        </Box>
                                    )}
                                </CardContent>
                                
                                <CardActions>
                                    <Button
                                        startIcon={<VisibilityIcon />}
                                        onClick={() => handlePreview(generatedExercise)}
                                    >
                                        详细预览
                                    </Button>
                                    <Button
                                        startIcon={<DownloadIcon />}
                                        onClick={() => handleDownload(generatedExercise)}
                                    >
                                        下载Word
                                    </Button>
                                </CardActions>
                            </Card>
                        </Paper>
                    )}
                </>
            )}

            {activeTab === 1 && (
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        历史实训练习
                    </Typography>
                    
                    {historyLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                            <CircularProgress />
                        </Box>
                    ) : exerciseHistory.length === 0 ? (
                        <Typography color="textSecondary" sx={{ textAlign: 'center', p: 3 }}>
                            暂无历史记录
                        </Typography>
                    ) : (
                        <Grid container spacing={2}>
                            {exerciseHistory.map((exercise) => (
                                <Grid item xs={12} md={6} lg={4} key={exercise._id}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6" noWrap>
                                                {exercise.title}
                                            </Typography>
                                            <Typography color="textSecondary" gutterBottom>
                                                {exercise.description?.substring(0, 100)}...
                                            </Typography>
                                            
                                            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                                <Chip label={exercise.difficulty} size="small" />
                                                <Chip label={exercise.exerciseType} size="small" />
                                            </Box>
                                            
                                            <Typography variant="caption" color="textSecondary">
                                                创建时间：{new Date(exercise.createdAt).toLocaleDateString()}
                                            </Typography>
                                        </CardContent>
                                        
                                        <CardActions>
                                            <Tooltip title="预览">
                                                <IconButton onClick={() => handlePreview(exercise)}>
                                                    <VisibilityIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="下载">
                                                <IconButton onClick={() => handleDownload(exercise)}>
                                                    <DownloadIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="删除">
                                                <IconButton onClick={() => handleDelete(exercise._id)}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </CardActions>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Paper>
            )}

            {/* 预览对话框 */}
            <Dialog
                open={previewDialog}
                onClose={() => setPreviewDialog(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    实训练习详情预览
                </DialogTitle>
                <DialogContent>
                    {previewExercise && (
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                {previewExercise.title}
                            </Typography>
                            <Typography paragraph>
                                {previewExercise.description}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                                <Chip label={`难度：${previewExercise.difficulty}`} />
                                <Chip label={`类型：${previewExercise.exerciseType}`} />
                                <Chip label={`时长：${previewExercise.duration}分钟`} />
                                <Chip label={`总分：${previewExercise.totalPoints}分`} />
                            </Box>

                            {previewExercise.questions && previewExercise.questions.map((question, index) => (
                                <Accordion key={index}>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {getQuestionTypeIcon(question.questionType || question.type)}
                                            <Typography>
                                                题目{question.questionNumber}: {question.questionType || question.type}
                                            </Typography>
                                            <Chip label={`${question.points}分`} size="small" />
                                        </Box>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Typography variant="subtitle2" gutterBottom>
                                            题目内容：
                                        </Typography>
                                        <Typography paragraph>
                                            {question.questionText || question.question}
                                        </Typography>

                                        {question.requirements && question.requirements.length > 0 && (
                                            <>
                                                <Typography variant="subtitle2" gutterBottom>
                                                    实训要求：
                                                </Typography>
                                                <List dense>
                                                    {question.requirements.map((req, reqIndex) => (
                                                        <ListItem key={reqIndex}>
                                                            <ListItemText
                                                                primary={`步骤${req.step}: ${req.description}`}
                                                                secondary={req.expectedOutput ? `预期输出：${req.expectedOutput}` : ''}
                                                            />
                                                        </ListItem>
                                                    ))}
                                                </List>
                                            </>
                                        )}

                                        {question.codeTemplate && (
                                            <>
                                                <Typography variant="subtitle2" gutterBottom>
                                                    代码模板：
                                                </Typography>
                                                <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
                                                    <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace' }}>
                                                        {question.codeTemplate.template}
                                                    </Typography>
                                                </Paper>
                                            </>
                                        )}

                                        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                                            参考答案：
                                        </Typography>
                                        <Typography paragraph>
                                            {question.referenceAnswer || question.answer}
                                        </Typography>

                                        <Typography variant="subtitle2" gutterBottom>
                                            解析说明：
                                        </Typography>
                                        <Typography>
                                            {question.explanation}
                                        </Typography>
                                    </AccordionDetails>
                                </Accordion>
                            ))}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPreviewDialog(false)}>
                        关闭
                    </Button>
                    {previewExercise && (
                        <Button
                            variant="contained"
                            startIcon={<DownloadIcon />}
                            onClick={() => {
                                handleDownload(previewExercise);
                                setPreviewDialog(false);
                            }}
                        >
                            下载Word
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PracticalExerciseGenerator;
