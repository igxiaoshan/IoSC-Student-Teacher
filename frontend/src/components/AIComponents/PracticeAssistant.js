import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    Paper,
    Typography,
    Button,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    FormLabel,
    TextField,
    LinearProgress,
    Alert,
    Card,
    CardContent,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    Stepper,
    Step,
    StepLabel
} from '@mui/material';
import {
    PlayArrow as PlayIcon,
    CheckCircle as CheckIcon,
    Cancel as CancelIcon,
    Lightbulb as HintIcon,
    Assessment as AssessmentIcon
} from '@mui/icons-material';
import { 
    startPracticeSession, 
    submitPracticeAnswer, 
    getPracticeHint 
} from '../../redux/aiRelated/aiHandle';
import { practiceNextQuestion, practiceSessionComplete } from '../../redux/aiRelated/aiSlice';

const PracticeAssistant = ({ studentId, subject }) => {
    const dispatch = useDispatch();
    const { 
        loading, 
        currentSession, 
        questions, 
        currentQuestion, 
        answers, 
        feedback, 
        score, 
        error 
    } = useSelector(state => state.ai.practiceAssistant);

    const [selectedAnswer, setSelectedAnswer] = useState('');
    const [textAnswer, setTextAnswer] = useState('');
    const [showFeedback, setShowFeedback] = useState(false);
    const [sessionConfig, setSessionConfig] = useState({
        difficulty: 'medium',
        questionCount: 10,
        timeLimit: 30
    });
    const [showConfig, setShowConfig] = useState(false);
    const [hint, setHint] = useState('');

    const currentQ = questions[currentQuestion];
    const progress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;

    const handleStartSession = () => {
        dispatch(startPracticeSession({
            studentId,
            subject,
            practiceType: 'adaptive', // 添加练习类型
            ...sessionConfig
        }));
        setShowConfig(false);
    };

    const handleSubmitAnswer = () => {
        const answer = currentQ?.type === 'multiple_choice' ? selectedAnswer : textAnswer;
        
        if (!answer.trim()) return;

        dispatch(submitPracticeAnswer({
            sessionId: currentSession,
            questionId: currentQ.id,
            answer: answer,
            timeSpent: 60 // 可以添加计时功能
        }));

        setShowFeedback(true);
    };

    const handleNextQuestion = () => {
        if (currentQuestion < questions.length - 1) {
            dispatch(practiceNextQuestion());
            setSelectedAnswer('');
            setTextAnswer('');
            setShowFeedback(false);
            setHint('');
        } else {
            // 完成练习
            dispatch(practiceSessionComplete({ score: calculateScore() }));
        }
    };

    const handleGetHint = async () => {
        try {
            const result = await dispatch(getPracticeHint({
                sessionId: currentSession,
                questionId: currentQ.id,
                currentAnswer: currentQ?.type === 'multiple_choice' ? selectedAnswer : textAnswer
            }));
            setHint(result.hint);
        } catch (error) {
            console.error('获取提示失败:', error);
        }
    };

    const calculateScore = () => {
        const correctAnswers = answers.filter(a => a.isCorrect).length;
        return Math.round((correctAnswers / answers.length) * 100);
    };

    const renderQuestion = () => {
        if (!currentQ) return null;

        return (
            <Card elevation={2}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">
                            题目 {currentQuestion + 1} / {questions.length}
                        </Typography>
                        <Chip 
                            label={currentQ.difficulty} 
                            color={currentQ.difficulty === 'easy' ? 'success' : currentQ.difficulty === 'medium' ? 'warning' : 'error'}
                            size="small"
                        />
                    </Box>

                    <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6 }}>
                        {currentQ.question || currentQ.content}
                    </Typography>

                    {currentQ.type === 'multiple_choice' ? (
                        <FormControl component="fieldset" fullWidth>
                            <RadioGroup
                                value={selectedAnswer}
                                onChange={(e) => setSelectedAnswer(e.target.value)}
                            >
                                {currentQ.options?.map((option, index) => (
                                    <FormControlLabel
                                        key={index}
                                        value={option}
                                        control={<Radio />}
                                        label={option}
                                        disabled={showFeedback}
                                    />
                                ))}
                            </RadioGroup>
                        </FormControl>
                    ) : (
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            variant="outlined"
                            placeholder="请输入你的答案..."
                            value={textAnswer}
                            onChange={(e) => setTextAnswer(e.target.value)}
                            disabled={showFeedback}
                        />
                    )}

                    {hint && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                            <Typography variant="body2">
                                💡 提示：{hint}
                            </Typography>
                        </Alert>
                    )}

                    {showFeedback && feedback && (
                        <Alert 
                            severity={feedback.isCorrect ? 'success' : 'error'} 
                            sx={{ mt: 2 }}
                            icon={feedback.isCorrect ? <CheckIcon /> : <CancelIcon />}
                        >
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {feedback.isCorrect ? '回答正确！' : '回答错误'}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                {feedback.feedback}
                            </Typography>
                            {feedback.suggestions && feedback.suggestions.length > 0 && (
                                <Box sx={{ mt: 1 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                        建议：
                                    </Typography>
                                    <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                                        {feedback.suggestions.map((suggestion, index) => (
                                            <li key={index}>
                                                <Typography variant="caption">{suggestion}</Typography>
                                            </li>
                                        ))}
                                    </ul>
                                </Box>
                            )}
                        </Alert>
                    )}

                    <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
                        {!showFeedback ? (
                            <>
                                <Button
                                    variant="contained"
                                    onClick={handleSubmitAnswer}
                                    disabled={!selectedAnswer && !textAnswer.trim()}
                                >
                                    提交答案
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<HintIcon />}
                                    onClick={handleGetHint}
                                    disabled={!!hint}
                                >
                                    获取提示
                                </Button>
                            </>
                        ) : (
                            <Button
                                variant="contained"
                                onClick={handleNextQuestion}
                            >
                                {currentQuestion < questions.length - 1 ? '下一题' : '完成练习'}
                            </Button>
                        )}
                    </Box>
                </CardContent>
            </Card>
        );
    };

    const renderSessionComplete = () => {
        const finalScore = calculateScore();
        return (
            <Card elevation={2}>
                <CardContent sx={{ textAlign: 'center' }}>
                    <AssessmentIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h4" sx={{ mb: 2 }}>
                        练习完成！
                    </Typography>
                    <Typography variant="h5" color="primary" sx={{ mb: 3 }}>
                        得分：{finalScore}分
                    </Typography>
                    
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={4}>
                            <Typography variant="h6">{questions.length}</Typography>
                            <Typography variant="body2" color="text.secondary">总题数</Typography>
                        </Grid>
                        <Grid item xs={4}>
                            <Typography variant="h6" color="success.main">
                                {answers.filter(a => a.isCorrect).length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">正确</Typography>
                        </Grid>
                        <Grid item xs={4}>
                            <Typography variant="h6" color="error.main">
                                {answers.filter(a => !a.isCorrect).length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">错误</Typography>
                        </Grid>
                    </Grid>

                    <Button
                        variant="contained"
                        onClick={() => setShowConfig(true)}
                        sx={{ mr: 1 }}
                    >
                        再次练习
                    </Button>
                    <Button variant="outlined">
                        查看详细报告
                    </Button>
                </CardContent>
            </Card>
        );
    };

    if (!currentSession && !showConfig) {
        return (
            <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
                <PlayIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" sx={{ mb: 2 }}>
                    AI智能练习
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    开始个性化练习，AI会根据你的表现自动调整难度
                </Typography>
                <Button
                    variant="contained"
                    size="large"
                    startIcon={<PlayIcon />}
                    onClick={() => setShowConfig(true)}
                >
                    开始练习
                </Button>
            </Paper>
        );
    }

    return (
        <Box>
            {/* 进度条 */}
            {currentSession && questions.length > 0 && (
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">练习进度</Typography>
                        <Typography variant="body2">{Math.round(progress)}%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={progress} />
                </Box>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {loading && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography>正在生成个性化练习...</Typography>
                </Box>
            )}

            {currentSession && !loading && (
                currentQuestion < questions.length ? renderQuestion() : renderSessionComplete()
            )}

            {/* 配置对话框 */}
            <Dialog open={showConfig} onClose={() => setShowConfig(false)} maxWidth="sm" fullWidth>
                <DialogTitle>练习设置</DialogTitle>
                <DialogContent>
                    <Grid container spacing={3} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <FormControl component="fieldset">
                                <FormLabel component="legend">难度等级</FormLabel>
                                <RadioGroup
                                    value={sessionConfig.difficulty}
                                    onChange={(e) => setSessionConfig({...sessionConfig, difficulty: e.target.value})}
                                    row
                                >
                                    <FormControlLabel value="easy" control={<Radio />} label="简单" />
                                    <FormControlLabel value="medium" control={<Radio />} label="中等" />
                                    <FormControlLabel value="hard" control={<Radio />} label="困难" />
                                </RadioGroup>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="题目数量"
                                type="number"
                                value={sessionConfig.questionCount}
                                onChange={(e) => setSessionConfig({...sessionConfig, questionCount: parseInt(e.target.value)})}
                                inputProps={{ min: 5, max: 50 }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="时间限制(分钟)"
                                type="number"
                                value={sessionConfig.timeLimit}
                                onChange={(e) => setSessionConfig({...sessionConfig, timeLimit: parseInt(e.target.value)})}
                                inputProps={{ min: 10, max: 120 }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowConfig(false)}>取消</Button>
                    <Button variant="contained" onClick={handleStartSession}>
                        开始练习
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PracticeAssistant;
