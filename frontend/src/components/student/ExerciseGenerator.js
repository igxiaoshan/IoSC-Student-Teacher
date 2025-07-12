/**
 * 练习生成器组件
 * 根据学生需求生成个性化练习题
 */

import React, { useState } from 'react';
import {
    Box,
    Paper,
    TextField,
    Button,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Slider,
    Card,
    CardContent,
    CardActions,
    Chip,
    Alert,
    CircularProgress,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    RadioGroup,
    FormControlLabel,
    Radio,
    Divider
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    Psychology as PsychologyIcon,
    Quiz as QuizIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import aiService from '../../services/aiService';

const ExerciseGenerator = () => {
    const { currentUser } = useSelector(state => state.user);
    const [requirements, setRequirements] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [difficulty, setDifficulty] = useState(3);
    const [exerciseType, setExerciseType] = useState('mixed');
    const [isGenerating, setIsGenerating] = useState(false);
    const [exercises, setExercises] = useState([]);
    const [error, setError] = useState('');
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState({});
    const [showResults, setShowResults] = useState(false);

    // 学科选项
    const subjects = [
        '数学', '语文', '英语', '物理', '化学', '生物',
        '历史', '地理', '政治', '计算机'
    ];

    // 练习类型选项
    const exerciseTypes = [
        { value: 'mixed', label: '混合题型' },
        { value: 'choice', label: '选择题' },
        { value: 'fill', label: '填空题' },
        { value: 'short', label: '简答题' },
        { value: 'calculation', label: '计算题' }
    ];

    // 难度标签
    const difficultyLabels = {
        1: '很简单',
        2: '简单',
        3: '中等',
        4: '困难',
        5: '很困难'
    };

    // 生成练习题
    const handleGenerateExercises = async () => {
        if (!requirements.trim() || !selectedSubject) {
            setError('请填写练习要求并选择学科');
            return;
        }

        setIsGenerating(true);
        setError('');
        setExercises([]);
        setUserAnswers({});
        setShowResults(false);

        try {
            const fullRequirements = `
                学科: ${selectedSubject}
                练习类型: ${exerciseTypes.find(t => t.value === exerciseType)?.label}
                难度等级: ${difficulty} (${difficultyLabels[difficulty]})
                具体要求: ${requirements}
                
                请生成3-5道练习题，每道题包含：
                1. 题目内容
                2. 选项（如果是选择题）
                3. 正确答案
                4. 详细解析
            `;

            const response = await aiService.generateExercise(
                fullRequirements,
                currentUser._id,
                selectedSubject,
                difficulty
            );

            if (response.success) {
                // 解析AI生成的练习题
                const parsedExercises = aiService.parseExerciseContent(response.data.exercises);
                
                if (parsedExercises.length > 0) {
                    setExercises(parsedExercises);
                    setCurrentExerciseIndex(0);
                } else {
                    // 如果解析失败，直接显示原始内容
                    const rawExercise = {
                        id: 1,
                        question: response.data.exercises,
                        options: [],
                        answer: '',
                        explanation: '',
                        type: 'text'
                    };
                    setExercises([rawExercise]);
                }
            } else {
                setError(response.error || '生成练习题失败');
            }
        } catch (error) {
            console.error('生成练习题失败:', error);
            setError('生成练习题失败，请稍后重试');
        } finally {
            setIsGenerating(false);
        }
    };

    // 处理答案选择
    const handleAnswerChange = (exerciseId, answer) => {
        setUserAnswers(prev => ({
            ...prev,
            [exerciseId]: answer
        }));
    };

    // 检查答案
    const handleCheckAnswers = async () => {
        setShowResults(true);
        
        // 这里可以调用AI服务来检查答案
        for (const exercise of exercises) {
            const userAnswer = userAnswers[exercise.id];
            if (userAnswer && exercise.question) {
                try {
                    await aiService.checkStudentAnswer(
                        exercise.question,
                        userAnswer,
                        currentUser._id,
                        exercise.answer,
                        selectedSubject
                    );
                } catch (error) {
                    console.error('检查答案失败:', error);
                }
            }
        }
    };

    // 重新生成
    const handleRegenerate = () => {
        setExercises([]);
        setUserAnswers({});
        setShowResults(false);
        setCurrentExerciseIndex(0);
    };

    // 渲染练习题
    const renderExercise = (exercise, index) => {
        const userAnswer = userAnswers[exercise.id];
        const isCorrect = showResults && userAnswer === exercise.answer;
        
        return (
            <Card key={exercise.id} sx={{ mb: 2 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ flexGrow: 1 }}>
                            题目 {index + 1}
                        </Typography>
                        {showResults && (
                            <Chip
                                icon={isCorrect ? <CheckCircleIcon /> : <CancelIcon />}
                                label={isCorrect ? '正确' : '错误'}
                                color={isCorrect ? 'success' : 'error'}
                                variant="outlined"
                            />
                        )}
                    </Box>
                    
                    <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                        {exercise.question}
                    </Typography>
                    
                    {/* 选择题选项 */}
                    {exercise.options && exercise.options.length > 0 && (
                        <FormControl component="fieldset" sx={{ width: '100%' }}>
                            <RadioGroup
                                value={userAnswer || ''}
                                onChange={(e) => handleAnswerChange(exercise.id, e.target.value)}
                            >
                                {exercise.options.map((option, optionIndex) => (
                                    <FormControlLabel
                                        key={optionIndex}
                                        value={option.charAt(0)} // 取选项标签 A, B, C, D
                                        control={<Radio />}
                                        label={option}
                                        disabled={showResults}
                                    />
                                ))}
                            </RadioGroup>
                        </FormControl>
                    )}
                    
                    {/* 填空题或简答题 */}
                    {(!exercise.options || exercise.options.length === 0) && (
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            placeholder="请输入您的答案..."
                            value={userAnswer || ''}
                            onChange={(e) => handleAnswerChange(exercise.id, e.target.value)}
                            disabled={showResults}
                            variant="outlined"
                        />
                    )}
                    
                    {/* 显示结果 */}
                    {showResults && (
                        <Box sx={{ mt: 2 }}>
                            <Divider sx={{ my: 2 }} />
                            
                            {exercise.answer && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2" color="primary" gutterBottom>
                                        正确答案:
                                    </Typography>
                                    <Typography variant="body2">
                                        {exercise.answer}
                                    </Typography>
                                </Box>
                            )}
                            
                            {exercise.explanation && (
                                <Box>
                                    <Typography variant="subtitle2" color="secondary" gutterBottom>
                                        详细解析:
                                    </Typography>
                                    <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                                        {exercise.explanation}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    )}
                </CardContent>
            </Card>
        );
    };

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
            {/* 头部 */}
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PsychologyIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h5">AI练习生成器</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                    根据您的学习需求，AI将为您生成个性化的练习题目
                </Typography>
            </Paper>

            {/* 配置区域 */}
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">练习配置</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {/* 学科选择 */}
                        <FormControl fullWidth>
                            <InputLabel>选择学科</InputLabel>
                            <Select
                                value={selectedSubject}
                                label="选择学科"
                                onChange={(e) => setSelectedSubject(e.target.value)}
                            >
                                {subjects.map((subject) => (
                                    <MenuItem key={subject} value={subject}>
                                        {subject}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* 练习类型 */}
                        <FormControl fullWidth>
                            <InputLabel>练习类型</InputLabel>
                            <Select
                                value={exerciseType}
                                label="练习类型"
                                onChange={(e) => setExerciseType(e.target.value)}
                            >
                                {exerciseTypes.map((type) => (
                                    <MenuItem key={type.value} value={type.value}>
                                        {type.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* 难度选择 */}
                        <Box>
                            <Typography gutterBottom>
                                难度等级: {difficultyLabels[difficulty]}
                            </Typography>
                            <Slider
                                value={difficulty}
                                onChange={(e, value) => setDifficulty(value)}
                                min={1}
                                max={5}
                                step={1}
                                marks
                                valueLabelDisplay="auto"
                                valueLabelFormat={(value) => difficultyLabels[value]}
                            />
                        </Box>

                        {/* 练习要求 */}
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label="练习要求"
                            placeholder="请描述您想要练习的具体内容，例如：二次函数的图像和性质、英语过去时态的用法等..."
                            value={requirements}
                            onChange={(e) => setRequirements(e.target.value)}
                            variant="outlined"
                        />

                        {/* 生成按钮 */}
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={isGenerating ? <CircularProgress size={20} /> : <QuizIcon />}
                            onClick={handleGenerateExercises}
                            disabled={isGenerating || !requirements.trim() || !selectedSubject}
                            sx={{ alignSelf: 'flex-start' }}
                        >
                            {isGenerating ? '生成中...' : '生成练习题'}
                        </Button>
                    </Box>
                </AccordionDetails>
            </Accordion>

            {/* 错误提示 */}
            {error && (
                <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {/* 练习题列表 */}
            {exercises.length > 0 && (
                <Box sx={{ mt: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">
                            练习题目 ({exercises.length} 道)
                        </Typography>
                        
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            {!showResults && (
                                <Button
                                    variant="contained"
                                    color="success"
                                    onClick={handleCheckAnswers}
                                    disabled={Object.keys(userAnswers).length === 0}
                                >
                                    检查答案
                                </Button>
                            )}
                            
                            <Button
                                variant="outlined"
                                startIcon={<RefreshIcon />}
                                onClick={handleRegenerate}
                            >
                                重新生成
                            </Button>
                        </Box>
                    </Box>

                    {exercises.map((exercise, index) => renderExercise(exercise, index))}
                </Box>
            )}
        </Box>
    );
};

export default ExerciseGenerator;
