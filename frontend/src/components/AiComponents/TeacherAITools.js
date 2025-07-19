import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    Paper,
    Typography,
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
    List,
    ListItem,
    ListItemText,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Alert,
    Tabs,
    Tab,
    Avatar
} from '@mui/material';
import {
    AutoFixHigh as LessonPlanIcon,
    Quiz as QuestionIcon,
    Grading as GradingIcon,
    Add as AddIcon,
    Download as DownloadIcon,
    Edit as EditIcon
} from '@mui/icons-material';
import {
    generateLessonPlan,
    generateQuestions,
    analyzeAnswers,
    generateTeacherLessonPlan,
    generateTeacherExamContent,
    analyzeTeacherStudentPerformance
} from '../../redux/aiRelated/aiHandle';

function TabPanel({ children, value, index, ...other }) {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`teacher-ai-tabpanel-${index}`}
            aria-labelledby={`teacher-ai-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ py: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const TeacherAITools = ({ teacherId }) => {
    const dispatch = useDispatch();
    const { teacherAI } = useSelector(state => state.ai);
    const [tabValue, setTabValue] = useState(0);
    
    // 教学计划生成状态
    const [lessonPlanForm, setLessonPlanForm] = useState({
        subject: '',
        grade: '',
        topic: '',
        duration: 45,
        studentLevel: 'intermediate',
        requirements: ''
    });
    
    // 题目生成状态
    const [questionForm, setQuestionForm] = useState({
        subject: '',
        knowledgePoints: [],
        questionType: 'multiple_choice',
        difficulty: 'medium',
        count: 10,
        additionalRequirements: ''
    });
    
    // 阅卷分析状态
    const [gradingForm, setGradingForm] = useState({
        examId: '',
        analysisType: 'comprehensive'
    });

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleGenerateLessonPlan = () => {
        dispatch(generateLessonPlan({
            teacherId,
            ...lessonPlanForm
        }));
    };

    const handleGenerateQuestions = () => {
        dispatch(generateQuestions({
            teacherId,
            ...questionForm
        }));
    };

    const handleAnalyzeAnswers = () => {
        dispatch(analyzeAnswers({
            teacherId,
            ...gradingForm
        }));
    };

    const renderLessonPlanGenerator = () => {
        return (
            <Card elevation={2}>
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LessonPlanIcon color="primary" />
                        AI智能备课助手
                    </Typography>
                    
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="学科"
                                value={lessonPlanForm.subject}
                                onChange={(e) => setLessonPlanForm({...lessonPlanForm, subject: e.target.value})}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="年级"
                                value={lessonPlanForm.grade}
                                onChange={(e) => setLessonPlanForm({...lessonPlanForm, grade: e.target.value})}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="课程主题"
                                value={lessonPlanForm.topic}
                                onChange={(e) => setLessonPlanForm({...lessonPlanForm, topic: e.target.value})}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="课时(分钟)"
                                type="number"
                                value={lessonPlanForm.duration}
                                onChange={(e) => setLessonPlanForm({...lessonPlanForm, duration: parseInt(e.target.value)})}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>学生水平</InputLabel>
                                <Select
                                    value={lessonPlanForm.studentLevel}
                                    onChange={(e) => setLessonPlanForm({...lessonPlanForm, studentLevel: e.target.value})}
                                >
                                    <MenuItem value="beginner">初级</MenuItem>
                                    <MenuItem value="intermediate">中级</MenuItem>
                                    <MenuItem value="advanced">高级</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="特殊要求"
                                multiline
                                rows={3}
                                value={lessonPlanForm.requirements}
                                onChange={(e) => setLessonPlanForm({...lessonPlanForm, requirements: e.target.value})}
                                placeholder="描述任何特殊的教学要求或目标..."
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Button
                                variant="contained"
                                startIcon={teacherAI.lessonPlan.loading ? <CircularProgress size={20} /> : <AddIcon />}
                                onClick={handleGenerateLessonPlan}
                                disabled={teacherAI.lessonPlan.loading || !lessonPlanForm.subject || !lessonPlanForm.topic}
                                size="large"
                            >
                                {teacherAI.lessonPlan.loading ? '生成中...' : '生成教学计划'}
                            </Button>
                        </Grid>
                    </Grid>

                    {teacherAI.lessonPlan.error && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {teacherAI.lessonPlan.error}
                        </Alert>
                    )}

                    {teacherAI.lessonPlan.currentPlan && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                生成的教学计划
                            </Typography>
                            <Paper elevation={1} sx={{ p: 2, bgcolor: 'grey.50' }}>
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                    {JSON.stringify(teacherAI.lessonPlan.currentPlan, null, 2)}
                                </Typography>
                            </Paper>
                            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                                <Button variant="outlined" startIcon={<EditIcon />}>
                                    编辑
                                </Button>
                                <Button variant="outlined" startIcon={<DownloadIcon />}>
                                    导出
                                </Button>
                            </Box>
                        </Box>
                    )}
                </CardContent>
            </Card>
        );
    };

    const renderQuestionGenerator = () => {
        return (
            <Card elevation={2}>
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <QuestionIcon color="primary" />
                        AI智能出题系统
                    </Typography>
                    
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="学科"
                                value={questionForm.subject}
                                onChange={(e) => setQuestionForm({...questionForm, subject: e.target.value})}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>题目类型</InputLabel>
                                <Select
                                    value={questionForm.questionType}
                                    onChange={(e) => setQuestionForm({...questionForm, questionType: e.target.value})}
                                >
                                    <MenuItem value="multiple_choice">选择题</MenuItem>
                                    <MenuItem value="fill_blank">填空题</MenuItem>
                                    <MenuItem value="short_answer">简答题</MenuItem>
                                    <MenuItem value="essay">论述题</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>难度等级</InputLabel>
                                <Select
                                    value={questionForm.difficulty}
                                    onChange={(e) => setQuestionForm({...questionForm, difficulty: e.target.value})}
                                >
                                    <MenuItem value="easy">简单</MenuItem>
                                    <MenuItem value="medium">中等</MenuItem>
                                    <MenuItem value="hard">困难</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="题目数量"
                                type="number"
                                value={questionForm.count}
                                onChange={(e) => setQuestionForm({...questionForm, count: parseInt(e.target.value)})}
                                inputProps={{ min: 1, max: 50 }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="知识点"
                                placeholder="输入知识点，用逗号分隔"
                                value={questionForm.knowledgePoints.join(', ')}
                                onChange={(e) => setQuestionForm({
                                    ...questionForm, 
                                    knowledgePoints: e.target.value.split(',').map(kp => kp.trim()).filter(kp => kp)
                                })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="附加要求"
                                multiline
                                rows={3}
                                value={questionForm.additionalRequirements}
                                onChange={(e) => setQuestionForm({...questionForm, additionalRequirements: e.target.value})}
                                placeholder="描述任何特殊要求..."
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Button
                                variant="contained"
                                startIcon={teacherAI.questionGeneration.loading ? <CircularProgress size={20} /> : <AddIcon />}
                                onClick={handleGenerateQuestions}
                                disabled={teacherAI.questionGeneration.loading || !questionForm.subject}
                                size="large"
                            >
                                {teacherAI.questionGeneration.loading ? '生成中...' : '生成题目'}
                            </Button>
                        </Grid>
                    </Grid>

                    {teacherAI.questionGeneration.error && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {teacherAI.questionGeneration.error}
                        </Alert>
                    )}

                    {teacherAI.questionGeneration.generatedQuestions.length > 0 && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                生成的题目 ({teacherAI.questionGeneration.generatedQuestions.length}道)
                            </Typography>
                            <List>
                                {teacherAI.questionGeneration.generatedQuestions.map((question, index) => (
                                    <ListItem key={index} sx={{ bgcolor: 'grey.50', mb: 1, borderRadius: 1 }}>
                                        <ListItemText
                                            primary={`${index + 1}. ${question.question}`}
                                            secondary={
                                                <Box sx={{ mt: 1 }}>
                                                    {question.options && (
                                                        <Box sx={{ ml: 2 }}>
                                                            {question.options.map((option, optIndex) => (
                                                                <Typography key={optIndex} variant="body2">
                                                                    {String.fromCharCode(65 + optIndex)}. {typeof option === 'string' ? option : option.text || option}
                                                                </Typography>
                                                            ))}
                                                        </Box>
                                                    )}
                                                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                                        <Chip label={question.difficulty} size="small" />
                                                        <Chip label={question.type} size="small" variant="outlined" />
                                                    </Box>
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                ))}
                            </List>
                            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                                <Button variant="outlined" startIcon={<EditIcon />}>
                                    编辑题目
                                </Button>
                                <Button variant="outlined" startIcon={<DownloadIcon />}>
                                    导出题目
                                </Button>
                            </Box>
                        </Box>
                    )}
                </CardContent>
            </Card>
        );
    };

    const renderGradingAnalysis = () => {
        return (
            <Card elevation={2}>
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <GradingIcon color="primary" />
                        AI智能阅卷分析
                    </Typography>
                    
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="考试ID"
                                value={gradingForm.examId}
                                onChange={(e) => setGradingForm({...gradingForm, examId: e.target.value})}
                                placeholder="输入要分析的考试ID"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>分析类型</InputLabel>
                                <Select
                                    value={gradingForm.analysisType}
                                    onChange={(e) => setGradingForm({...gradingForm, analysisType: e.target.value})}
                                >
                                    <MenuItem value="comprehensive">综合分析</MenuItem>
                                    <MenuItem value="individual">个人分析</MenuItem>
                                    <MenuItem value="knowledge_point">知识点分析</MenuItem>
                                    <MenuItem value="difficulty">难度分析</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <Button
                                variant="contained"
                                startIcon={teacherAI.grading.loading ? <CircularProgress size={20} /> : <AddIcon />}
                                onClick={handleAnalyzeAnswers}
                                disabled={teacherAI.grading.loading || !gradingForm.examId}
                                size="large"
                            >
                                {teacherAI.grading.loading ? '分析中...' : '开始分析'}
                            </Button>
                        </Grid>
                    </Grid>

                    {teacherAI.grading.error && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {teacherAI.grading.error}
                        </Alert>
                    )}

                    {teacherAI.grading.results.length > 0 && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                分析结果
                            </Typography>
                            <Paper elevation={1} sx={{ p: 2, bgcolor: 'grey.50' }}>
                                <Typography variant="body2">
                                    分析完成，共处理 {teacherAI.grading.results.length} 份答卷
                                </Typography>
                                {/* 这里可以添加更详细的分析结果展示 */}
                            </Paper>
                        </Box>
                    )}
                </CardContent>
            </Card>
        );
    };

    return (
        <Box>
            <Paper elevation={2}>
                <Tabs 
                    value={tabValue} 
                    onChange={handleTabChange}
                    variant="fullWidth"
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab 
                        icon={<LessonPlanIcon />} 
                        label="智能备课" 
                        iconPosition="start"
                    />
                    <Tab 
                        icon={<QuestionIcon />} 
                        label="智能出题" 
                        iconPosition="start"
                    />
                    <Tab 
                        icon={<GradingIcon />} 
                        label="智能阅卷" 
                        iconPosition="start"
                    />
                </Tabs>

                <TabPanel value={tabValue} index={0}>
                    {renderLessonPlanGenerator()}
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                    {renderQuestionGenerator()}
                </TabPanel>

                <TabPanel value={tabValue} index={2}>
                    {renderGradingAnalysis()}
                </TabPanel>
            </Paper>
        </Box>
    );
};

export default TeacherAITools;
