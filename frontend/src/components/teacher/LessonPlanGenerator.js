/**
 * 智能备课生成器组件
 * 帮助教师基于课程大纲生成详细的教学方案
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
    DialogActions
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    School as SchoolIcon,
    Save as SaveIcon,
    Download as DownloadIcon,
    Edit as EditIcon,
    Preview as PreviewIcon,
    Share as ShareIcon,
    AutoAwesome as AIIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import aiService from '../../services/aiService';

const LessonPlanGenerator = () => {
    const { currentUser } = useSelector(state => state.user);
    const [courseOutline, setCourseOutline] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [lessonTitle, setLessonTitle] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedPlan, setGeneratedPlan] = useState('');
    const [error, setError] = useState('');
    const [previewOpen, setPreviewOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editedPlan, setEditedPlan] = useState('');

    // 学科选项
    const subjects = [
        '数学', '语文', '英语', '物理', '化学', '生物',
        '历史', '地理', '政治', '计算机', '音乐', '美术', '体育'
    ];

    // 生成备课方案
    const handleGenerateLessonPlan = async () => {
        if (!courseOutline.trim() || !selectedSubject) {
            setError('请填写课程大纲并选择学科');
            return;
        }

        setIsGenerating(true);
        setError('');
        setGeneratedPlan('');

        try {
            const response = await aiService.generateLessonPlan(
                courseOutline,
                currentUser._id,
                selectedSubject,
                lessonTitle
            );

            if (response.success) {
                setGeneratedPlan(response.data.lessonPlan);
                setEditedPlan(response.data.lessonPlan);
            } else {
                setError(response.error || '生成备课方案失败');
            }
        } catch (error) {
            console.error('生成备课方案失败:', error);
            setError('生成备课方案失败，请稍后重试');
        } finally {
            setIsGenerating(false);
        }
    };

    // 保存备课方案
    const handleSavePlan = async () => {
        // 这里可以调用保存API
        console.log('保存备课方案:', editedPlan);
        // 实际实现中会调用后端API保存到数据库
    };

    // 下载备课方案
    const handleDownloadPlan = () => {
        const element = document.createElement('a');
        const file = new Blob([editedPlan], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `${lessonTitle || selectedSubject}_备课方案.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    // 切换编辑模式
    const handleToggleEditMode = () => {
        setEditMode(!editMode);
        if (!editMode) {
            setEditedPlan(generatedPlan);
        }
    };

    // 预览备课方案
    const handlePreview = () => {
        setPreviewOpen(true);
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
            } else if (line.trim().startsWith('-') || line.trim().match(/^\d+\./)) {
                return (
                    <Typography key={index} variant="body2" sx={{ ml: 2, mb: 0.5 }}>
                        {line}
                    </Typography>
                );
            } else if (line.trim()) {
                return (
                    <Typography key={index} variant="body1" sx={{ mb: 1, lineHeight: 1.6 }}>
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
                    <SchoolIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h5">AI智能备课助手</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                    基于课程大纲，AI将为您生成详细的教学方案，包括教学目标、内容结构、实训安排等
                </Typography>
            </Paper>

            {/* 输入配置区域 */}
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">备课配置</Typography>
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
                                label="课程标题"
                                value={lessonTitle}
                                onChange={(e) => setLessonTitle(e.target.value)}
                                placeholder="例如：二次函数的图像与性质"
                                sx={{ flex: 1 }}
                            />
                        </Box>

                        {/* 课程大纲输入 */}
                        <TextField
                            fullWidth
                            multiline
                            rows={8}
                            label="课程大纲"
                            placeholder="请输入详细的课程大纲，包括：&#10;1. 教学内容要点&#10;2. 学习目标&#10;3. 重点难点&#10;4. 课时安排&#10;5. 其他特殊要求"
                            value={courseOutline}
                            onChange={(e) => setCourseOutline(e.target.value)}
                            variant="outlined"
                        />

                        {/* 生成按钮 */}
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={isGenerating ? <CircularProgress size={20} /> : <AIIcon />}
                            onClick={handleGenerateLessonPlan}
                            disabled={isGenerating || !courseOutline.trim() || !selectedSubject}
                            sx={{ alignSelf: 'flex-start' }}
                        >
                            {isGenerating ? '生成中...' : '生成备课方案'}
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

            {/* 生成的备课方案 */}
            {generatedPlan && (
                <Card sx={{ mt: 3 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">
                                生成的备课方案
                            </Typography>
                            
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Tooltip title="预览">
                                    <IconButton onClick={handlePreview}>
                                        <PreviewIcon />
                                    </IconButton>
                                </Tooltip>
                                
                                <Tooltip title={editMode ? "退出编辑" : "编辑"}>
                                    <IconButton onClick={handleToggleEditMode}>
                                        <EditIcon color={editMode ? "primary" : "inherit"} />
                                    </IconButton>
                                </Tooltip>
                                
                                <Tooltip title="保存">
                                    <IconButton onClick={handleSavePlan}>
                                        <SaveIcon />
                                    </IconButton>
                                </Tooltip>
                                
                                <Tooltip title="下载">
                                    <IconButton onClick={handleDownloadPlan}>
                                        <DownloadIcon />
                                    </IconButton>
                                </Tooltip>
                                
                                <Tooltip title="分享">
                                    <IconButton>
                                        <ShareIcon />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Box>

                        <Divider sx={{ mb: 2 }} />

                        {/* 编辑模式 */}
                        {editMode ? (
                            <TextField
                                fullWidth
                                multiline
                                rows={20}
                                value={editedPlan}
                                onChange={(e) => setEditedPlan(e.target.value)}
                                variant="outlined"
                                sx={{ fontFamily: 'monospace' }}
                            />
                        ) : (
                            /* 显示模式 */
                            <Box sx={{ 
                                p: 2, 
                                bgcolor: 'grey.50', 
                                borderRadius: 1,
                                maxHeight: 600,
                                overflow: 'auto'
                            }}>
                                {formatContent(generatedPlan)}
                            </Box>
                        )}
                    </CardContent>

                    <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip label={selectedSubject} color="primary" size="small" />
                            <Chip label="AI生成" color="secondary" size="small" />
                            {lessonTitle && (
                                <Chip label={lessonTitle} variant="outlined" size="small" />
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
                    备课方案预览
                    {lessonTitle && ` - ${lessonTitle}`}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ py: 1 }}>
                        {formatContent(editedPlan)}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPreviewOpen(false)}>
                        关闭
                    </Button>
                    <Button variant="contained" onClick={handleDownloadPlan}>
                        下载
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default LessonPlanGenerator;
