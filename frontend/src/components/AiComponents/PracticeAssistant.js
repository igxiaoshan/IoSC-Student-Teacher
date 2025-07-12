import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Card,
    CardContent,
    CardActions,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    FormLabel,
    Chip,
    Grid,
    LinearProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';

const PracticeCard = styled(Card)(({ theme }) => ({
    marginBottom: theme.spacing(2),
    padding: theme.spacing(2),
}));

const PracticeAssistant = () => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState('');
    const [showResult, setShowResult] = useState(false);
    const [score, setScore] = useState(0);
    const [answers, setAnswers] = useState([]);

    // 示例练习题
    const questions = [
        {
            id: 1,
            question: "React中的useState Hook的作用是什么？",
            options: [
                "管理组件的生命周期",
                "管理组件的状态",
                "处理组件的事件",
                "优化组件性能"
            ],
            correct: 1,
            explanation: "useState Hook用于在函数组件中添加状态管理功能。"
        },
        {
            id: 2,
            question: "JavaScript中的闭包是什么？",
            options: [
                "一种数据类型",
                "一种循环结构",
                "函数和其词法环境的组合",
                "一种异步操作"
            ],
            correct: 2,
            explanation: "闭包是函数和声明该函数的词法环境的组合，可以访问外部函数的变量。"
        },
        {
            id: 3,
            question: "CSS中的flexbox布局的主要用途是什么？",
            options: [
                "创建动画效果",
                "设置字体样式",
                "创建灵活的布局",
                "处理表单验证"
            ],
            correct: 2,
            explanation: "Flexbox是一种CSS布局方法，用于创建灵活和响应式的布局。"
        }
    ];

    const handleAnswerChange = (event) => {
        setSelectedAnswer(event.target.value);
    };

    const handleNextQuestion = () => {
        const newAnswers = [...answers];
        newAnswers[currentQuestion] = {
            selected: parseInt(selectedAnswer),
            correct: questions[currentQuestion].correct
        };
        setAnswers(newAnswers);

        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
            setSelectedAnswer('');
        } else {
            // 计算分数
            const correctCount = newAnswers.reduce((count, answer) => {
                return count + (answer.selected === answer.correct ? 1 : 0);
            }, 0);
            setScore(correctCount);
            setShowResult(true);
        }
    };

    const resetPractice = () => {
        setCurrentQuestion(0);
        setSelectedAnswer('');
        setShowResult(false);
        setScore(0);
        setAnswers([]);
    };

    const progress = ((currentQuestion + 1) / questions.length) * 100;

    if (showResult) {
        return (
            <Box sx={{ maxWidth: 800, margin: '0 auto', padding: 2 }}>
                <Typography variant="h4" gutterBottom>
                    练习结果
                </Typography>
                <PracticeCard>
                    <CardContent>
                        <Typography variant="h5" gutterBottom>
                            你的得分: {score}/{questions.length}
                        </Typography>
                        <Typography variant="body1" color="text.secondary" paragraph>
                            正确率: {((score / questions.length) * 100).toFixed(1)}%
                        </Typography>
                        
                        {score === questions.length && (
                            <Chip label="完美！" color="success" sx={{ mb: 2 }} />
                        )}
                        {score >= questions.length * 0.7 && score < questions.length && (
                            <Chip label="很好！" color="primary" sx={{ mb: 2 }} />
                        )}
                        {score < questions.length * 0.7 && (
                            <Chip label="需要加强" color="warning" sx={{ mb: 2 }} />
                        )}

                        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                            答题详情:
                        </Typography>
                        {questions.map((question, index) => (
                            <Box key={question.id} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                <Typography variant="body1" fontWeight="bold">
                                    {index + 1}. {question.question}
                                </Typography>
                                <Typography variant="body2" color={answers[index]?.selected === question.correct ? 'success.main' : 'error.main'}>
                                    你的答案: {question.options[answers[index]?.selected]}
                                    {answers[index]?.selected === question.correct ? ' ✓' : ' ✗'}
                                </Typography>
                                {answers[index]?.selected !== question.correct && (
                                    <Typography variant="body2" color="success.main">
                                        正确答案: {question.options[question.correct]}
                                    </Typography>
                                )}
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    解释: {question.explanation}
                                </Typography>
                            </Box>
                        ))}
                    </CardContent>
                    <CardActions>
                        <Button variant="contained" onClick={resetPractice}>
                            重新练习
                        </Button>
                    </CardActions>
                </PracticeCard>
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 800, margin: '0 auto', padding: 2 }}>
            <Typography variant="h4" gutterBottom>
                练习助手
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
                通过AI生成的练习题来巩固你的学习成果。
            </Typography>

            <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary">
                    进度: {currentQuestion + 1}/{questions.length}
                </Typography>
                <LinearProgress variant="determinate" value={progress} sx={{ mt: 1 }} />
            </Box>

            <PracticeCard>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        问题 {currentQuestion + 1}
                    </Typography>
                    <Typography variant="body1" paragraph>
                        {questions[currentQuestion].question}
                    </Typography>

                    <FormControl component="fieldset">
                        <FormLabel component="legend">选择答案:</FormLabel>
                        <RadioGroup
                            value={selectedAnswer}
                            onChange={handleAnswerChange}
                        >
                            {questions[currentQuestion].options.map((option, index) => (
                                <FormControlLabel
                                    key={index}
                                    value={index.toString()}
                                    control={<Radio />}
                                    label={option}
                                />
                            ))}
                        </RadioGroup>
                    </FormControl>
                </CardContent>
                <CardActions>
                    <Button
                        variant="contained"
                        onClick={handleNextQuestion}
                        disabled={selectedAnswer === ''}
                    >
                        {currentQuestion < questions.length - 1 ? '下一题' : '完成练习'}
                    </Button>
                </CardActions>
            </PracticeCard>
        </Box>
    );
};

export default PracticeAssistant;
