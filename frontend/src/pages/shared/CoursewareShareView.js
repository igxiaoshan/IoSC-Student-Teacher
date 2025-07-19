import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    Box,
    Card,
    CardContent,
    Chip,
    Button,
    Alert,
    CircularProgress,
    Divider,
    Grid
} from '@mui/material';
import {
    School as SchoolIcon,
    Person as TeacherIcon,
    AccessTime as TimeIcon,
    CalendarToday as DateIcon,
    Download as DownloadIcon
} from '@mui/icons-material';
import { aiAPI } from '../../utils/apiConfig';

const CoursewareShareView = () => {
    const { token } = useParams();
    const [courseware, setCourseware] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // 获取分享的课件数据
    useEffect(() => {
        const fetchSharedCourseware = async () => {
            try {
                setLoading(true);
                const response = await aiAPI.get(`/ai/courseware/share/${token}`);
                
                if (response.data.success) {
                    setCourseware(response.data.courseware);
                } else {
                    setError(response.data.message || '课件不存在或已过期');
                }
            } catch (err) {
                setError('获取课件失败：' + (err.response?.data?.message || err.message));
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchSharedCourseware();
        }
    }, [token]);

    // 导出Word文档
    const exportToWord = async () => {
        try {
            const response = await aiAPI.get(`/ai/courseware/${courseware._id}/export/word`, {
                responseType: 'blob'
            });

            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            });

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${courseware.title}_${Date.now()}.docx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            setSuccess('Word文档导出成功！');
        } catch (err) {
            setError('导出失败：' + (err.response?.data?.message || err.message));
        }
    };

    if (loading) {
        return (
            <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
                <CircularProgress size={60} />
                <Typography variant="h6" sx={{ mt: 2 }}>
                    正在加载课件内容...
                </Typography>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Alert severity="error">
                    {error}
                </Alert>
            </Container>
        );
    }

    if (!courseware) {
        return (
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Alert severity="warning">
                    课件不存在或分享链接已过期
                </Alert>
            </Container>
        );
    }

    return (
        <Box sx={{
            minHeight: '100vh',
            backgroundColor: '#f5f5f5',
            py: 4
        }}>
            <Container maxWidth="lg">
                {/* 页面头部 */}
                <Box sx={{
                    textAlign: 'center',
                    mb: 4,
                    py: 3,
                    backgroundColor: 'white',
                    borderRadius: 2,
                    boxShadow: 1
                }}>
                    <Typography variant="h4" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                        📚 AI课件分享
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        通过分享链接访问的课件详情
                    </Typography>
                </Box>

                {success && (
                    <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
                        {success}
                    </Alert>
                )}

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 3 }}>
                    {/* 课件标题和基本信息 */}
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h3" gutterBottom sx={{
                            color: 'primary.main',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            mb: 3
                        }}>
                            {courseware.title}
                        </Typography>
                    
                    <Typography variant="h6" color="text.secondary" paragraph>
                        {courseware.description}
                    </Typography>

                    <Grid container spacing={2} sx={{ mt: 2 }}>
                        <Grid item xs={12} sm={6} md={3}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <SchoolIcon color="primary" />
                                <Typography variant="body2">
                                    <strong>科目：</strong>{courseware.subject?.subName || '未知科目'}
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TeacherIcon color="primary" />
                                <Typography variant="body2">
                                    <strong>教师：</strong>{courseware.teacher?.name || '未知教师'}
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <DateIcon color="primary" />
                                <Typography variant="body2">
                                    <strong>生成时间：</strong>{new Date(courseware.generatedAt).toLocaleDateString()}
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TimeIcon color="primary" />
                                <Typography variant="body2">
                                    <strong>类型：</strong>{courseware.generationType === 'overview' ? '概览' : '详细'}
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>

                    {/* 导出按钮 */}
                    <Box sx={{ mt: 3, textAlign: 'center' }}>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<DownloadIcon />}
                            onClick={exportToWord}
                            sx={{
                                px: 4,
                                py: 1.5,
                                fontSize: '1.1rem',
                                borderRadius: 3,
                                boxShadow: 3,
                                '&:hover': {
                                    boxShadow: 6,
                                    transform: 'translateY(-2px)'
                                },
                                transition: 'all 0.3s ease'
                            }}
                        >
                            📄 导出Word文档
                        </Button>
                    </Box>
                </Box>

                <Divider sx={{ my: 4 }} />

                {/* 知识点部分 */}
                {courseware.knowledgePoints && courseware.knowledgePoints.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h4" gutterBottom sx={{ color: 'primary.main' }}>
                            📚 知识点详解
                        </Typography>
                        
                        <Grid container spacing={3}>
                            {courseware.knowledgePoints.map((point, index) => (
                                <Grid item xs={12} key={index}>
                                    <Card sx={{ height: '100%' }}>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom sx={{ color: 'primary.dark' }}>
                                                {index + 1}. {point.title}
                                            </Typography>
                                            <Typography variant="body1" paragraph>
                                                {point.content}
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                <Chip 
                                                    label={`难度: ${point.difficulty}`} 
                                                    size="small" 
                                                    color="primary" 
                                                    variant="outlined"
                                                />
                                                <Chip 
                                                    label={`时长: ${point.estimatedTime}分钟`} 
                                                    size="small" 
                                                    color="secondary" 
                                                    variant="outlined"
                                                />
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                )}

                {/* 练习题部分 */}
                {courseware.practiceExercises && courseware.practiceExercises.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h4" gutterBottom sx={{ color: 'primary.main' }}>
                            🎯 练习题目
                        </Typography>
                        
                        <Grid container spacing={3}>
                            {courseware.practiceExercises.map((exercise, index) => (
                                <Grid item xs={12} md={6} key={index}>
                                    <Card sx={{ height: '100%' }}>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom sx={{ color: 'primary.dark' }}>
                                                {index + 1}. {exercise.title}
                                            </Typography>
                                            <Typography variant="body1" paragraph>
                                                {exercise.description}
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                <Chip 
                                                    label={`难度: ${exercise.difficulty}`} 
                                                    size="small" 
                                                    color="primary" 
                                                    variant="outlined"
                                                />
                                                <Chip 
                                                    label={`时长: ${exercise.estimatedTime}分钟`} 
                                                    size="small" 
                                                    color="secondary" 
                                                    variant="outlined"
                                                />
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                )}

                {/* 页脚信息 */}
                <Divider sx={{ my: 4 }} />
                <Box sx={{
                    textAlign: 'center',
                    color: 'text.secondary',
                    py: 3,
                    backgroundColor: '#f8f9fa',
                    borderRadius: 2,
                    mt: 4
                }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        🤖 本课件由AI智能生成，通过分享链接访问
                    </Typography>
                    <Typography variant="body2">
                        📅 生成时间：{new Date(courseware.generatedAt).toLocaleString()}
                    </Typography>
                    <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                        AI课件生成系统 - 让教学更智能
                    </Typography>
                </Box>
            </Paper>
            </Container>
        </Box>
    );
};

export default CoursewareShareView;
