import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Button,
    Paper,
    Grid,
    Card,
    CardContent,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Checkbox,
    FormControlLabel,
    FormGroup,
    Stepper,
    Step,
    StepLabel,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    LinearProgress,
    Chip,
    Radio,
    RadioGroup
} from '@mui/material';
import QuizIcon from '@mui/icons-material/Quiz';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { safeGet } from '../../utils/safeAccess';

const PracticeAssistant = () => {
    const { currentUser } = useSelector(state => state.user);
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // 配置状态
    const [practiceConfig, setPracticeConfig] = useState({
        subjectId: '',
        chapterContent: '',
        difficulty: '中等',
        questionCount: 5,
        questionTypes: ['选择题']
    });

    // 练习状态
    const [practiceData, setPracticeData] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [evaluations, setEvaluations] = useState({});
    const [practiceStats, setPracticeStats] = useState(null);

    // 其他状态
    const [subjects, setSubjects] = useState([]);
    const [subjectsLoading, setSubjectsLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);

    const steps = ['配置练习', '开始练习', '查看结果'];
    const difficulties = ['简单', '中等', '困难'];
    const questionTypes = ['选择题', '填空题', '简答题', '计算题'];

    useEffect(() => {
        if (currentUser) {
            fetchSubjects();
        }
    }, [currentUser]);

    const fetchSubjects = async () => {
        setSubjectsLoading(true);
        try {
            // 获取学生的科目列表（包括班级科目和选修科目）
            const studentId = safeGet(currentUser, '_id');
            if (studentId) {
                console.log('获取学生科目，学生ID:', studentId);

                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/student/${studentId}/subjects`);

                if (response.data && response.data.success) {
                    console.log('获取到学生科目列表:', response.data.data.subjects);
                    setSubjects(response.data.data.subjects);

                    // 如果没有科目，提示用户选择科目
                    if (response.data.data.subjects.length === 0) {
                        setError('您还没有选择任何科目，请先到"课程管理"页面选择科目');
                    }
                } else {
                    console.log('获取科目失败:', response.data.message);
                    setSubjects([]);
                    setError('获取科目失败: ' + (response.data.message || '未知错误'));
                }
            } else {
                console.log('学生信息不完整，当前用户:', currentUser);
                setSubjects([]);
                setError('学生信息不完整');
            }
        } catch (err) {
            console.error('获取科目列表失败:', err);
            setSubjects([]);
            setError('获取科目列表失败: ' + err.message);
        } finally {
            setSubjectsLoading(false);
        }
    };

    const handleConfigChange = (field, value) => {
        setPracticeConfig(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleQuestionTypeChange = (type, checked) => {
        setPracticeConfig(prev => ({
            ...prev,
            questionTypes: checked
                ? [...prev.questionTypes, type]
                : prev.questionTypes.filter(t => t !== type)
        }));
    };

    const generatePractice = async () => {
        setLoading(true);
        setError('');

        try {
            const studentId = safeGet(currentUser, '_id');
            if (!studentId) {
                setError('用户信息不完整，无法生成练习');
                return;
            }

            // 获取选中科目的详细信息
            const selectedSubject = subjects.find(s => s._id === practiceConfig.subjectId);

            const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/student/ai/practice/generate`, {
                studentId: studentId,
                subjectName: selectedSubject?.subName || '通用',
                ...practiceConfig
            });

            if (response.data.success) {
                console.log('练习生成响应:', response.data);

                // 验证返回的数据结构
                if (!response.data.questions || !Array.isArray(response.data.questions) || response.data.questions.length === 0) {
                    console.error('练习题目数据无效:', response.data);
                    setError('生成的练习题目为空，请重试');
                    return;
                }

                // 确保每个题目都有必要的字段
                const validatedQuestions = response.data.questions.map((question, index) => ({
                    questionId: question.questionId || `question_${index}_${Date.now()}`,
                    questionText: question.questionText || question.question || '题目内容缺失',
                    questionType: question.questionType || '选择题',
                    options: question.options || [],
                    difficulty: question.difficulty || '中等',
                    points: question.points || 10
                }));

                const practiceData = {
                    ...response.data,
                    questions: validatedQuestions
                };

                setPracticeData(practiceData);
                setAnswers({});
                setEvaluations({});
                setCurrentQuestionIndex(0);
                setActiveStep(1);
                setSuccess(`练习题目生成成功！共 ${validatedQuestions.length} 道题目`);
            } else {
                setError(response.data.message || '生成练习失败');
            }
        } catch (err) {
            setError('生成练习失败：' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerChange = (questionId, answer) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }));
    };

    const submitAnswer = async (questionId) => {
        const answer = answers[questionId];
        if (!answer) {
            setError('请先选择或输入答案');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const studentId = safeGet(currentUser, '_id');
            if (!studentId) {
                setError('用户信息不完整，无法提交答案');
                return;
            }

            const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/student/ai/practice/submit`, {
                studentId: studentId,
                subjectId: practiceConfig.subjectId,
                practiceId: practiceData.practiceId,
                questionId: questionId,
                studentAnswer: answer,
                timeTaken: 60 // 可以记录实际答题时间
            });

            if (response.data.success) {
                setEvaluations(prev => ({
                    ...prev,
                    [questionId]: response.data.evaluation
                }));

                if (response.data.isCompleted) {
                    setPracticeStats(response.data.practiceStats);
                    setActiveStep(2);
                    setShowResults(true);
                } else {
                    // 移动到下一题
                    if (currentQuestionIndex < practiceData.questions.length - 1) {
                        setCurrentQuestionIndex(prev => prev + 1);
                    }
                }
            } else {
                setError(response.data.message || '提交答案失败');
            }
        } catch (err) {
            setError('提交答案失败：' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const renderConfigStep = () => (
        <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                    <InputLabel>选择科目</InputLabel>
                    <Select
                        value={practiceConfig.subjectId}
                        onChange={(e) => handleConfigChange('subjectId', e.target.value)}
                        disabled={subjectsLoading}
                    >
                        {subjectsLoading ? (
                            <MenuItem disabled>
                                <CircularProgress size={16} sx={{ mr: 1 }} />
                                加载科目中...
                            </MenuItem>
                        ) : subjects.length > 0 ? (
                            subjects.map(subject => (
                                <MenuItem key={subject._id} value={subject._id}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {subject.subName}
                                        {subject.isRequired && (
                                            <Chip label="必修" color="primary" size="small" />
                                        )}
                                        {subject.source === 'class' && (
                                            <Chip label="班级课程" color="info" size="small" />
                                        )}
                                    </Box>
                                </MenuItem>
                            ))
                        ) : (
                            <MenuItem disabled>
                                暂无可用科目，请先到"课程管理"页面选择科目
                            </MenuItem>
                        )}
                    </Select>
                </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                    <InputLabel>难度等级</InputLabel>
                    <Select
                        value={practiceConfig.difficulty}
                        onChange={(e) => handleConfigChange('difficulty', e.target.value)}
                    >
                        {difficulties.map(level => (
                            <MenuItem key={level} value={level}>{level}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Grid>

            <Grid item xs={12}>
                <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="章节内容或学习重点"
                    placeholder="请输入你想练习的章节内容或知识点，例如：二次函数、古诗词鉴赏、英语语法等"
                    value={practiceConfig.chapterContent}
                    onChange={(e) => handleConfigChange('chapterContent', e.target.value)}
                />
            </Grid>

            <Grid item xs={12} md={6}>
                <TextField
                    fullWidth
                    type="number"
                    label="题目数量"
                    value={practiceConfig.questionCount}
                    onChange={(e) => handleConfigChange('questionCount', parseInt(e.target.value))}
                    inputProps={{ min: 1, max: 20 }}
                />
            </Grid>

            <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                    题目类型
                </Typography>
                <FormGroup row>
                    {questionTypes.map(type => (
                        <FormControlLabel
                            key={type}
                            control={
                                <Checkbox
                                    checked={practiceConfig.questionTypes.includes(type)}
                                    onChange={(e) => handleQuestionTypeChange(type, e.target.checked)}
                                />
                            }
                            label={type}
                        />
                    ))}
                </FormGroup>
            </Grid>

            <Grid item xs={12}>
                <Button
                    variant="contained"
                    onClick={generatePractice}
                    disabled={loading || !practiceConfig.subjectId || !practiceConfig.chapterContent}
                    fullWidth
                    size="large"
                >
                    {loading ? (
                        <>
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                            生成中...
                        </>
                    ) : (
                        '生成练习题目'
                    )}
                </Button>
            </Grid>
        </Grid>
    );

    const renderPracticeStep = () => {
        // 数据验证
        if (!practiceData || !practiceData.questions || !Array.isArray(practiceData.questions)) {
            return (
                <Alert severity="error">
                    练习数据加载失败，请重新生成练习题目。
                </Alert>
            );
        }

        // 检查当前题目索引是否有效
        if (currentQuestionIndex < 0 || currentQuestionIndex >= practiceData.questions.length) {
            return (
                <Alert severity="error">
                    题目索引错误，请重新开始练习。
                </Alert>
            );
        }

        const currentQuestion = practiceData.questions[currentQuestionIndex];

        // 检查当前题目是否存在
        if (!currentQuestion) {
            return (
                <Alert severity="error">
                    当前题目数据不存在，请重新生成练习。
                </Alert>
            );
        }

        // 确保questionId存在
        const questionId = currentQuestion.questionId || `question_${currentQuestionIndex}`;
        const evaluation = evaluations[questionId];

        return (
            <Box>
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">
                        题目 {currentQuestionIndex + 1} / {practiceData.questions.length}
                    </Typography>
                    <Chip 
                        label={currentQuestion.difficulty} 
                        color={currentQuestion.difficulty === '困难' ? 'error' : 
                               currentQuestion.difficulty === '中等' ? 'warning' : 'success'}
                        size="small"
                    />
                </Box>

                <LinearProgress 
                    variant="determinate" 
                    value={(currentQuestionIndex + 1) / practiceData.questions.length * 100} 
                    sx={{ mb: 3 }}
                />

                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            {currentQuestion.questionText}
                        </Typography>

                        {currentQuestion.questionType === '选择题' && currentQuestion.options && (
                            <FormControl component="fieldset" sx={{ mt: 2 }}>
                                <RadioGroup
                                    value={answers[questionId] || ''}
                                    onChange={(e) => handleAnswerChange(questionId, e.target.value)}
                                >
                                    {currentQuestion.options.map((option, index) => (
                                        <FormControlLabel
                                            key={index}
                                            value={option.text}
                                            control={<Radio />}
                                            label={option.text}
                                            disabled={!!evaluation}
                                        />
                                    ))}
                                </RadioGroup>
                            </FormControl>
                        )}

                        {currentQuestion.questionType !== '选择题' && (
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                placeholder="请输入你的答案..."
                                value={answers[questionId] || ''}
                                onChange={(e) => handleAnswerChange(questionId, e.target.value)}
                                disabled={!!evaluation}
                                sx={{ mt: 2 }}
                            />
                        )}

                        {evaluation && (
                            <Box sx={{ mt: 3 }}>
                                <Alert 
                                    severity={evaluation.isCorrect ? 'success' : 'error'}
                                    icon={evaluation.isCorrect ? <CheckCircleIcon /> : <ErrorIcon />}
                                >
                                    <Typography variant="subtitle2">
                                        {evaluation.isCorrect ? '回答正确！' : '回答错误'}
                                    </Typography>
                                    <Typography variant="body2">
                                        {evaluation.feedback}
                                    </Typography>
                                </Alert>

                                {evaluation.errorAnalysis && (
                                    <Alert severity="info" sx={{ mt: 2 }} icon={<TipsAndUpdatesIcon />}>
                                        <Typography variant="subtitle2">改进建议：</Typography>
                                        <Typography variant="body2">
                                            {evaluation.errorAnalysis.suggestion}
                                        </Typography>
                                    </Alert>
                                )}
                            </Box>
                        )}

                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                            <Button
                                disabled={currentQuestionIndex === 0}
                                onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                            >
                                上一题
                            </Button>

                            {!evaluation ? (
                                <Button
                                    variant="contained"
                                    onClick={() => submitAnswer(questionId)}
                                    disabled={loading || !answers[questionId]}
                                >
                                    {loading ? <CircularProgress size={20} /> : '提交答案'}
                                </Button>
                            ) : (
                                <Button
                                    variant="contained"
                                    onClick={() => {
                                        if (currentQuestionIndex < practiceData.questions.length - 1) {
                                            setCurrentQuestionIndex(prev => prev + 1);
                                        } else {
                                            setActiveStep(2);
                                            setShowResults(true);
                                        }
                                    }}
                                >
                                    {currentQuestionIndex < practiceData.questions.length - 1 ? '下一题' : '查看结果'}
                                </Button>
                            )}
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        );
    };

    const renderResultsStep = () => {
        if (!practiceStats) return null;

        return (
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Typography variant="h5" gutterBottom textAlign="center">
                        练习完成！
                    </Typography>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="primary">
                                {practiceStats.correctAnswers}
                            </Typography>
                            <Typography variant="body2">
                                正确题数
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="primary">
                                {practiceStats.accuracy?.toFixed(1)}%
                            </Typography>
                            <Typography variant="body2">
                                正确率
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="primary">
                                {practiceStats.totalScore}
                            </Typography>
                            <Typography variant="body2">
                                总得分
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="primary">
                                {practiceStats.averageTime?.toFixed(1)}s
                            </Typography>
                            <Typography variant="body2">
                                平均用时
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                        <Button
                            variant="outlined"
                            onClick={() => {
                                setActiveStep(0);
                                setPracticeData(null);
                                setAnswers({});
                                setEvaluations({});
                                setPracticeStats(null);
                                setShowResults(false);
                            }}
                        >
                            重新练习
                        </Button>
                        <Button variant="contained">
                            查看详细分析
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        );
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <QuizIcon color="primary" />
                实时练习评测助手
            </Typography>

            <Paper sx={{ p: 3 }}>
                <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

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

                {activeStep === 0 && renderConfigStep()}
                {activeStep === 1 && renderPracticeStep()}
                {activeStep === 2 && renderResultsStep()}
            </Paper>
        </Container>
    );
};

export default PracticeAssistant;
