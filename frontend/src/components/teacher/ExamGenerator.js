/**
 * 考核生成器组件
 * 根据教学内容自动生成考核题目和答案
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
    Card,
    CardContent,
    CardActions,
    Alert,
    CircularProgress,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip,
    Divider,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControlLabel,
    Checkbox,
    Slider
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    Quiz as QuizIcon,
    Save as SaveIcon,
    Download as DownloadIcon,
    Preview as PreviewIcon,
    Print as PrintIcon,
    AutoAwesome as AIIcon,
    Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import aiService from '../../services/aiService';

const ExamGenerator = () => {
    const { currentUser } = useSelector(state => state.user);
    const [teachingContent, setTeachingContent] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [examTitle, setExamTitle] = useState('');
    const [examType, setExamType] = useState('mixed');
    const [questionCount, setQuestionCount] = useState(10);
    const [includeAnswerKey, setIncludeAnswerKey] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedExam, setGeneratedExam] = useState('');
    const [error, setError] = useState('');
    const [previewOpen, setPreviewOpen] = useState(false);

    // 学科选项
    const subjects = [
        '数学', '语文', '英语', '物理', '化学', '生物',
        '历史', '地理', '政治', '计算机', '音乐', '美术', '体育'
    ];

    // 考核类型选项
    const examTypes = [
        { value: 'mixed', label: '混合题型' },
        { value: 'choice', label: '选择题为主' },
        { value: 'short_answer', label: '简答题为主' },
        { value: 'calculation', label: '计算题为主' },
        { value: 'programming', label: '编程题为主' },
        { value: 'essay', label: '论述题为主' }
    ];

    // 生成考核内容
    const handleGenerateExam = async () => {
        if (!teachingContent.trim() || !selectedSubject) {
            setError('请填写教学内容并选择学科');
            return;
        }

        setIsGenerating(true);
        setError('');
        setGeneratedExam('');

        try {
            const examTypeLabel = examTypes.find(t => t.value === examType)?.label || '混合题型';
            
            const enhancedContent = `
                学科: ${selectedSubject}
                考核类型: ${examTypeLabel}
                题目数量: 约${questionCount}道
                是否包含答案: ${includeAnswerKey ? '是' : '否'}
                
                教学内容:
                ${teachingContent}
                
                请生成一套完整的考核试卷，包括：
                1. 试卷标题和说明
                2. 多样化的题目类型
                3. 每道题的分值
                4. ${includeAnswerKey ? '标准答案和评分标准' : ''}
                
                确保题目难度适中，覆盖主要知识点。
            `;

            const response = await aiService.generateExam(
                enhancedContent,
                currentUser._id,
                examType,
                selectedSubject,
                examTitle
            );

            if (response.success) {
                setGeneratedExam(response.data.examContent);
            } else {
                setError(response.error || '生成考核内容失败');
            }
        } catch (error) {
            console.error('生成考核内容失败:', error);
            setError('生成考核内容失败，请稍后重试');
        } finally {
            setIsGenerating(false);
        }
    };

    // 保存考核内容
    const handleSaveExam = async () => {
        // 这里可以调用保存API
        console.log('保存考核内容:', generatedExam);
        // 实际实现中会调用后端API保存到数据库
    };

    // 下载考核内容
    const handleDownloadExam = () => {
        const element = document.createElement('a');
        const file = new Blob([generatedExam], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `${examTitle || selectedSubject}_考核试卷.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    // 预览考核内容
    const handlePreview = () => {
        setPreviewOpen(true);
    };

    // 打印考核内容
    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>${examTitle || selectedSubject + '考核试卷'}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                        h1, h2, h3 { color: #333; }
                        .question { margin-bottom: 20px; }
                        .answer { color: #666; font-style: italic; }
                    </style>
                </head>
                <body>
                    <pre>${generatedExam}</pre>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    // 格式化显示内容
    const formatContent = (content) => {
        return content.split('\n').map((line, index) => {
            if (line.trim().startsWith('#')) {
                return (
                    <Typography key={index} variant="h6" sx={{ mt: 2, mb: 1, color: 'primary.main' }}>
                        {line.replace(/^#+\s*/, '')}
                    </Typography>
                );
            } else if (line.trim().match(/^\d+[\.\)]/)) {
                return (
                    <Typography key={index} variant="body1" sx={{ mt: 1, mb: 0.5, fontWeight: 500 }}>
                        {line}
                    </Typography>
                );
            } else if (line.trim().startsWith('答案:') || line.trim().startsWith('解析:')) {
                return (
                    <Typography key={index} variant="body2" sx={{ ml: 2, color: 'text.secondary', fontStyle: 'italic' }}>
                        {line}
                    </Typography>
                );
            } else if (line.trim()) {
                return (
                    <Typography key={index} variant="body2" sx={{ mb: 0.5, lineHeight: 1.6 }}>
                        {line}
                    </Typography>
                );
            }
            return <br key={index} />;
        });
    };

    return (
        <Box sx={{ maxWidth: 1000, mx: 'auto', p: 2 }}>
            {/* 头部 */}
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <QuizIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h5">AI考核生成器</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                    基于教学内容，AI将为您生成多样化的考核题目，包括标准答案和评分标准
                </Typography>
            </Paper>

            {/* 配置区域 */}
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">考核配置</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {/* 基本信息 */}
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <FormControl sx={{ minWidth: 200 }}>
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

                            <TextField
                                label="考核标题"
                                value={examTitle}
                                onChange={(e) => setExamTitle(e.target.value)}
                                placeholder="例如：第三章单元测试"
                                sx={{ flex: 1 }}
                            />
                        </Box>

                        {/* 考核类型和设置 */}
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <FormControl sx={{ minWidth: 200 }}>
                                <InputLabel>考核类型</InputLabel>
                                <Select
                                    value={examType}
                                    label="考核类型"
                                    onChange={(e) => setExamType(e.target.value)}
                                >
                                    {examTypes.map((type) => (
                                        <MenuItem key={type.value} value={type.value}>
                                            {type.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Box sx={{ minWidth: 200 }}>
                                <Typography gutterBottom>
                                    题目数量: {questionCount}道
                                </Typography>
                                <Slider
                                    value={questionCount}
                                    onChange={(e, value) => setQuestionCount(value)}
                                    min={5}
                                    max={30}
                                    step={1}
                                    marks={[
                                        { value: 5, label: '5' },
                                        { value: 15, label: '15' },
                                        { value: 30, label: '30' }
                                    ]}
                                    valueLabelDisplay="auto"
                                />
                            </Box>

                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={includeAnswerKey}
                                        onChange={(e) => setIncludeAnswerKey(e.target.checked)}
                                    />
                                }
                                label="包含答案和解析"
                            />
                        </Box>

                        {/* 教学内容输入 */}
                        <TextField
                            fullWidth
                            multiline
                            rows={8}
                            label="教学内容"
                            placeholder="请输入需要考核的教学内容，包括：&#10;1. 主要知识点&#10;2. 重点难点&#10;3. 学习目标&#10;4. 实践应用&#10;5. 其他考核要求"
                            value={teachingContent}
                            onChange={(e) => setTeachingContent(e.target.value)}
                            variant="outlined"
                        />

                        {/* 生成按钮 */}
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={isGenerating ? <CircularProgress size={20} /> : <AIIcon />}
                            onClick={handleGenerateExam}
                            disabled={isGenerating || !teachingContent.trim() || !selectedSubject}
                            sx={{ alignSelf: 'flex-start' }}
                        >
                            {isGenerating ? '生成中...' : '生成考核试卷'}
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

            {/* 生成的考核内容 */}
            {generatedExam && (
                <Card sx={{ mt: 3 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">
                                生成的考核试卷
                            </Typography>
                            
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Tooltip title="预览">
                                    <IconButton onClick={handlePreview}>
                                        <PreviewIcon />
                                    </IconButton>
                                </Tooltip>
                                
                                <Tooltip title="保存">
                                    <IconButton onClick={handleSaveExam}>
                                        <SaveIcon />
                                    </IconButton>
                                </Tooltip>
                                
                                <Tooltip title="下载">
                                    <IconButton onClick={handleDownloadExam}>
                                        <DownloadIcon />
                                    </IconButton>
                                </Tooltip>
                                
                                <Tooltip title="打印">
                                    <IconButton onClick={handlePrint}>
                                        <PrintIcon />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Box>

                        <Divider sx={{ mb: 2 }} />

                        {/* 考核内容显示 */}
                        <Box sx={{ 
                            p: 2, 
                            bgcolor: 'grey.50', 
                            borderRadius: 1,
                            maxHeight: 600,
                            overflow: 'auto'
                        }}>
                            {formatContent(generatedExam)}
                        </Box>
                    </CardContent>

                    <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip label={selectedSubject} color="primary" size="small" />
                            <Chip label={examTypes.find(t => t.value === examType)?.label} color="secondary" size="small" />
                            <Chip label={`${questionCount}道题`} variant="outlined" size="small" />
                            {includeAnswerKey && (
                                <Chip label="含答案" color="success" size="small" />
                            )}
                        </Box>
                        
                        <Typography variant="caption" color="text.secondary">
                            生成时间: {new Date().toLocaleString('zh-CN')}
                        </Typography>
                    </CardActions>
                </Card>
            )}

            {/* 预览对话框 */}
            <Dialog
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AssignmentIcon sx={{ mr: 1 }} />
                        考核试卷预览
                        {examTitle && ` - ${examTitle}`}
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ py: 1 }}>
                        {formatContent(generatedExam)}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPreviewOpen(false)}>
                        关闭
                    </Button>
                    <Button variant="outlined" onClick={handlePrint}>
                        打印
                    </Button>
                    <Button variant="contained" onClick={handleDownloadExam}>
                        下载
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ExamGenerator;
