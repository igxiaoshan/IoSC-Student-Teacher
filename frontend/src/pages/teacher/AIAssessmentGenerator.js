import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    TextField,
    Button,
    Paper,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Checkbox,
    FormControlLabel,
    FormGroup,
    CircularProgress,
    Alert,
    Card,
    CardContent,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useSelector } from 'react-redux';
import axios from 'axios';

const AIAssessmentGenerator = () => {
    const { currentUser } = useSelector(state => state.user);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [coursewareList, setCoursewareList] = useState([]);
    
    // 表单数据
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

    // 生成结果
    const [generatedAssessment, setGeneratedAssessment] = useState(null);

    const difficulties = ['初级', '中级', '高级'];
    const questionTypes = ['选择题', '填空题', '简答题', '编程题', '实操题'];
    const commonFocusAreas = [
        '基础概念', '实际应用', '问题分析', '代码实现', 
        '系统设计', '算法思维', '调试能力', '优化技巧'
    ];

    // 获取课件列表
    useEffect(() => {
        fetchCourseware();
    }, []);

    const fetchCourseware = async () => {
        try {
            const response = await axios.get(`/api/ai/courseware/teacher/${currentUser._id}`);
            if (response.data.success) {
                setCoursewareList(response.data.courseware);
            }
        } catch (err) {
            console.error('获取课件列表失败:', err);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleQuestionTypeChange = (type, checked) => {
        setFormData(prev => ({
            ...prev,
            questionTypes: checked
                ? [...prev.questionTypes, type]
                : prev.questionTypes.filter(t => t !== type)
        }));
    };

    const handleFocusAreaToggle = (area) => {
        setFormData(prev => ({
            ...prev,
            focusAreas: prev.focusAreas.includes(area)
                ? prev.focusAreas.filter(item => item !== area)
                : [...prev.focusAreas, area]
        }));
    };

    const generateAssessment = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        
        try {
            const response = await axios.post('/api/ai/assessment/generate', {
                ...formData,
                subjectId: currentUser.teachSubject._id,
                teacherId: currentUser._id
            });

            if (response.data.success) {
                setGeneratedAssessment(response.data.assessment);
                setSuccess('考核题目生成成功！');
            } else {
                setError(response.data.message || '生成失败');
            }
        } catch (err) {
            setError('生成考核时发生错误：' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const isFormValid = () => {
        return formData.title && 
               formData.description && 
               formData.questionTypes.length > 0 && 
               formData.questionCount > 0 && 
               formData.duration > 0;
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                AI考核生成器
            </Typography>
            
            <Grid container spacing={3}>
                {/* 左侧：配置表单 */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            考核配置
                        </Typography>

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

                        <Grid container spacing={2}>
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
                                        {difficulties.map(level => (
                                            <MenuItem key={level} value={level}>{level}</MenuItem>
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

                            <Grid item xs={12}>
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
                                    重点领域
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {commonFocusAreas.map(area => (
                                        <Chip
                                            key={area}
                                            label={area}
                                            clickable
                                            size="small"
                                            color={formData.focusAreas.includes(area) ? 'primary' : 'default'}
                                            onClick={() => handleFocusAreaToggle(area)}
                                        />
                                    ))}
                                </Box>
                            </Grid>

                            <Grid item xs={12}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    onClick={generateAssessment}
                                    disabled={loading || !isFormValid()}
                                    sx={{ mt: 2 }}
                                >
                                    {loading ? (
                                        <>
                                            <CircularProgress size={20} sx={{ mr: 1 }} />
                                            生成中...
                                        </>
                                    ) : (
                                        '生成考核题目'
                                    )}
                                </Button>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* 右侧：生成结果 */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            生成结果
                        </Typography>

                        {!generatedAssessment ? (
                            <Box 
                                sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    height: 200,
                                    color: 'text.secondary'
                                }}
                            >
                                <Typography>
                                    配置完成后点击生成按钮查看结果
                                </Typography>
                            </Box>
                        ) : (
                            <Box>
                                <Card sx={{ mb: 2 }}>
                                    <CardContent>
                                        <Typography variant="h6" color="primary">
                                            {generatedAssessment.title}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            {generatedAssessment.description}
                                        </Typography>
                                        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                                            <Chip label={`${generatedAssessment.questions?.length || 0}题`} size="small" />
                                            <Chip label={`${generatedAssessment.totalPoints}分`} size="small" />
                                            <Chip label={`${generatedAssessment.duration}分钟`} size="small" />
                                        </Box>
                                    </CardContent>
                                </Card>

                                {generatedAssessment.questions?.slice(0, 3).map((question, index) => (
                                    <Accordion key={index} sx={{ mb: 1 }}>
                                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                            <Typography variant="subtitle2">
                                                题目 {index + 1}: {question.questionType} ({question.points}分)
                                            </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <Typography variant="body2" paragraph>
                                                {question.questionText}
                                            </Typography>
                                            
                                            {question.options && question.options.length > 0 && (
                                                <Box>
                                                    <Typography variant="caption" display="block">选项:</Typography>
                                                    {question.options.map((option, optIndex) => (
                                                        <Typography 
                                                            key={optIndex} 
                                                            variant="body2" 
                                                            color={option.isCorrect ? 'primary' : 'textSecondary'}
                                                        >
                                                            {String.fromCharCode(65 + optIndex)}. {option.text}
                                                        </Typography>
                                                    ))}
                                                </Box>
                                            )}

                                            {question.correctAnswer && (
                                                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                                    答案: {question.correctAnswer}
                                                </Typography>
                                            )}
                                        </AccordionDetails>
                                    </Accordion>
                                ))}

                                {generatedAssessment.questions?.length > 3 && (
                                    <Typography variant="body2" color="primary" textAlign="center">
                                        还有 {generatedAssessment.questions.length - 3} 道题目...
                                    </Typography>
                                )}

                                <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                                    <Button variant="outlined" size="small">
                                        编辑题目
                                    </Button>
                                    <Button variant="contained" size="small">
                                        发布考核
                                    </Button>
                                </Box>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default AIAssessmentGenerator;
