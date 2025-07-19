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
    Chip,
    CircularProgress,
    Alert,
    Stepper,
    Step,
    StepLabel,
    Card,
    CardContent,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    LinearProgress
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import { useSelector } from 'react-redux';
import { aiAPI } from '../../utils/apiConfig';

const AICoursewareGenerator = () => {
    const { currentUser } = useSelector(state => state.user);
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // 表单数据
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        syllabus: '',
        courseLevel: '中级',
        studentCount: 30,
        duration: 90,
        focusAreas: []
    });

    // 生成结果
    const [generatedCourseware, setGeneratedCourseware] = useState(null);

    // 文件上传相关
    const [uploadedDocuments, setUploadedDocuments] = useState([]);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [editDialog, setEditDialog] = useState({ open: false, section: '', content: '' });

    const steps = ['基本信息', '文档上传', '课程设置', '生成课件', '预览结果'];

    const courseLevels = ['初级', '中级', '高级'];
    const commonFocusAreas = [
        '理论基础', '实践应用', '案例分析', '技能训练', 
        '创新思维', '团队协作', '问题解决', '项目实战'
    ];

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
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

    const handleNext = () => {
        if (activeStep === 3) {
            generateCourseware();
        } else {
            setActiveStep(prev => prev + 1);
        }
    };

    // 文件上传处理
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploadLoading(true);
        const formData = new FormData();
        formData.append('document', file);
        formData.append('coursewareId', generatedCourseware?._id || 'temp');

        try {
            const response = await axios.post('/api/upload/courseware-document', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                setUploadedDocuments(prev => [...prev, response.data.document]);
                setSuccess('文档上传成功！');
            } else {
                setError(response.data.message || '上传失败');
            }
        } catch (err) {
            setError('上传文档时发生错误：' + (err.response?.data?.message || err.message));
        } finally {
            setUploadLoading(false);
        }
    };

    // 删除文档
    const handleDeleteDocument = async (documentId) => {
        try {
            const response = await axios.delete(
                `/api/upload/courseware/${generatedCourseware._id}/document/${documentId}`
            );

            if (response.data.success) {
                setUploadedDocuments(prev => prev.filter(doc => doc._id !== documentId));
                setSuccess('文档删除成功！');
            }
        } catch (err) {
            setError('删除文档失败：' + (err.response?.data?.message || err.message));
        }
    };

    // 编辑内容
    const handleEditContent = (section, content) => {
        setEditDialog({ open: true, section, content, originalContent: content });
    };

    // 保存编辑
    const handleSaveEdit = async () => {
        try {
            const response = await axios.put(`/api/ai/courseware/${generatedCourseware._id}/adjust`, {
                section: editDialog.section,
                originalContent: editDialog.originalContent,
                adjustedContent: editDialog.content,
                reason: '手动调整',
                teacherId: currentUser._id
            });

            if (response.data.success) {
                setSuccess('内容调整成功！');
                setEditDialog({ open: false, section: '', content: '' });
                // 重新获取课件数据
                // fetchCoursewareDetails();
            }
        } catch (err) {
            setError('保存调整失败：' + (err.response?.data?.message || err.message));
        }
    };

    // 导出课件
    const handleExportCourseware = async (format) => {
        try {
            const response = await axios.get(`/api/ai/courseware/${generatedCourseware._id}/export?format=${format}`);

            if (response.data.success) {
                if (format === 'json') {
                    // 下载JSON文件
                    const dataStr = JSON.stringify(response.data.data, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${generatedCourseware.title}.json`;
                    link.click();
                } else {
                    setSuccess('导出内容已生成，请查看下载链接');
                }
            }
        } catch (err) {
            setError('导出失败：' + (err.response?.data?.message || err.message));
        }
    };

    const handleBack = () => {
        setActiveStep(prev => prev - 1);
    };

    const generateCourseware = async () => {
        setLoading(true);
        setError('');
        
        try {
            const response = await aiAPI.generateCourseware({
                ...formData,
                subjectId: currentUser.teachSubject._id,
                teacherId: currentUser._id
            });

            if (response.data.success) {
                setGeneratedCourseware(response.data.courseware);
                setSuccess('课件生成成功！');
                setActiveStep(3);
            } else {
                setError(response.data.message || '生成失败');
            }
        } catch (err) {
            setError('生成课件时发生错误：' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="课件标题"
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
                                label="课件描述"
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={6}
                                label="课程大纲"
                                placeholder="请输入详细的课程大纲，包括主要知识点和学习目标..."
                                value={formData.syllabus}
                                onChange={(e) => handleInputChange('syllabus', e.target.value)}
                                required
                            />
                        </Grid>
                    </Grid>
                );

            case 1:
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>
                                上传课程相关文档
                            </Typography>
                            <Typography variant="body2" color="textSecondary" paragraph>
                                支持上传PDF、Word、Excel、TXT等格式的课程大纲、知识库文档等，系统将自动提取内容用于智能生成。
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <input
                                accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
                                style={{ display: 'none' }}
                                id="document-upload"
                                type="file"
                                onChange={handleFileUpload}
                            />
                            <label htmlFor="document-upload">
                                <Button
                                    variant="outlined"
                                    component="span"
                                    startIcon={<CloudUploadIcon />}
                                    disabled={uploadLoading}
                                    fullWidth
                                >
                                    {uploadLoading ? '上传中...' : '选择文档上传'}
                                </Button>
                            </label>
                            {uploadLoading && <LinearProgress sx={{ mt: 1 }} />}
                        </Grid>

                        {uploadedDocuments.length > 0 && (
                            <Grid item xs={12}>
                                <Typography variant="subtitle1" gutterBottom>
                                    已上传文档 ({uploadedDocuments.length})
                                </Typography>
                                <List>
                                    {uploadedDocuments.map((doc, index) => (
                                        <ListItem key={index}>
                                            <ListItemText
                                                primary={doc.originalName}
                                                secondary={`${(doc.fileSize / 1024).toFixed(1)} KB - 已提取 ${doc.extractedLength} 字符`}
                                            />
                                            <ListItemSecondaryAction>
                                                <IconButton
                                                    edge="end"
                                                    onClick={() => handleDeleteDocument(doc._id)}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                    ))}
                                </List>
                            </Grid>
                        )}
                    </Grid>
                );

            case 2:
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth>
                                <InputLabel>课程级别</InputLabel>
                                <Select
                                    value={formData.courseLevel}
                                    onChange={(e) => handleInputChange('courseLevel', e.target.value)}
                                >
                                    {courseLevels.map(level => (
                                        <MenuItem key={level} value={level}>{level}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                type="number"
                                label="学生人数"
                                value={formData.studentCount}
                                onChange={(e) => handleInputChange('studentCount', parseInt(e.target.value))}
                                inputProps={{ min: 1, max: 100 }}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                type="number"
                                label="课程时长（分钟）"
                                value={formData.duration}
                                onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                                inputProps={{ min: 30, max: 300 }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>
                                重点领域选择
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {commonFocusAreas.map(area => (
                                    <Chip
                                        key={area}
                                        label={area}
                                        clickable
                                        color={formData.focusAreas.includes(area) ? 'primary' : 'default'}
                                        onClick={() => handleFocusAreaToggle(area)}
                                    />
                                ))}
                            </Box>
                        </Grid>
                    </Grid>
                );

            case 3:
                return (
                    <Box textAlign="center" py={4}>
                        <Typography variant="h6" gutterBottom>
                            准备生成AI课件
                        </Typography>
                        <Typography variant="body1" color="textSecondary" paragraph>
                            系统将根据您提供的信息自动生成详细的教学内容，包括知识讲解、实训练习和时间分布。
                        </Typography>
                        {loading && (
                            <Box mt={3}>
                                <CircularProgress />
                                <Typography variant="body2" mt={2}>
                                    正在生成课件，请稍候...
                                </Typography>
                            </Box>
                        )}
                    </Box>
                );

            case 4:
                return generatedCourseware && (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            生成结果预览
                        </Typography>
                        
                        <Card sx={{ mb: 2 }}>
                            <CardContent>
                                <Typography variant="h6" color="primary">
                                    {generatedCourseware.title}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    {generatedCourseware.description}
                                </Typography>
                            </CardContent>
                        </Card>

                        {generatedCourseware.knowledgePoints?.length > 0 && (
                            <Card sx={{ mb: 2 }}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        知识点 ({generatedCourseware.knowledgePoints.length}个)
                                    </Typography>
                                    {generatedCourseware.knowledgePoints.slice(0, 3).map((kp, index) => (
                                        <Box key={index} mb={1}>
                                            <Typography variant="subtitle2">
                                                {kp.title} ({kp.difficulty})
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                {kp.content?.substring(0, 100)}...
                                            </Typography>
                                        </Box>
                                    ))}
                                    {generatedCourseware.knowledgePoints.length > 3 && (
                                        <Typography variant="body2" color="primary">
                                            还有 {generatedCourseware.knowledgePoints.length - 3} 个知识点...
                                        </Typography>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    时间分布
                                </Typography>
                                {generatedCourseware.teachingContent?.timeDistribution && (
                                    <Grid container spacing={2}>
                                        <Grid item xs={3}>
                                            <Typography variant="body2">讲解时间</Typography>
                                            <Typography variant="h6" color="primary">
                                                {generatedCourseware.teachingContent.timeDistribution.lectureTime}分钟
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={3}>
                                            <Typography variant="body2">练习时间</Typography>
                                            <Typography variant="h6" color="primary">
                                                {generatedCourseware.teachingContent.timeDistribution.practiceTime}分钟
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={3}>
                                            <Typography variant="body2">讨论时间</Typography>
                                            <Typography variant="h6" color="primary">
                                                {generatedCourseware.teachingContent.timeDistribution.discussionTime}分钟
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={3}>
                                            <Typography variant="body2">评估时间</Typography>
                                            <Typography variant="h6" color="primary">
                                                {generatedCourseware.teachingContent.timeDistribution.assessmentTime}分钟
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                )}
                            </CardContent>
                        </Card>

                        {/* 操作按钮 */}
                        <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Button
                                variant="outlined"
                                startIcon={<EditIcon />}
                                onClick={() => handleEditContent('description', generatedCourseware.description)}
                            >
                                编辑内容
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<DownloadIcon />}
                                onClick={() => handleExportCourseware('json')}
                            >
                                导出JSON
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<DownloadIcon />}
                                onClick={() => handleExportCourseware('pdf')}
                            >
                                导出PDF
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                            >
                                发布课件
                            </Button>
                        </Box>
                    </Box>
                );

            default:
                return null;
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                AI课件生成器
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
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        {success}
                    </Alert>
                )}

                {renderStepContent(activeStep)}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                    <Button
                        disabled={activeStep === 0}
                        onClick={handleBack}
                    >
                        上一步
                    </Button>
                    
                    <Button
                        variant="contained"
                        onClick={handleNext}
                        disabled={loading || (activeStep === 0 && (!formData.title || !formData.description || !formData.syllabus))}
                    >
                        {activeStep === 3 ? '生成课件' : activeStep === 4 ? '完成' : '下一步'}
                    </Button>
                </Box>
            </Paper>

            {/* 编辑对话框 */}
            <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, section: '', content: '' })} maxWidth="md" fullWidth>
                <DialogTitle>编辑内容</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        multiline
                        rows={6}
                        value={editDialog.content}
                        onChange={(e) => setEditDialog(prev => ({ ...prev, content: e.target.value }))}
                        sx={{ mt: 1 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialog({ open: false, section: '', content: '' })}>
                        取消
                    </Button>
                    <Button onClick={handleSaveEdit} variant="contained">
                        保存
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default AICoursewareGenerator;
