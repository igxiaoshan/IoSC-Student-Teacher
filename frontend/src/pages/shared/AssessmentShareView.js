import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Alert,
    CircularProgress,
    Divider
} from '@mui/material';
import {
    School as SchoolIcon,
    Person as TeacherIcon,
    AccessTime as TimeIcon,
    CalendarToday as DateIcon,
    Download as DownloadIcon
} from '@mui/icons-material';
import { aiAPI } from '../../utils/apiConfig';

const AssessmentShareView = () => {
    const { token } = useParams();
    const [assessment, setAssessment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchSharedAssessment = async () => {
            try {
                const response = await aiAPI.get(`/ai/assessment/share/${token}`);
                if (response.data.success) {
                    setAssessment(response.data.assessment);
                } else {
                    setError(response.data.message || '获取考核失败');
                }
            } catch (err) {
                setError('获取分享考核失败：' + (err.response?.data?.message || err.message));
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchSharedAssessment();
        }
    }, [token]);

    // 导出Word文档
    const exportToWord = async () => {
        try {
            const response = await aiAPI.get(`/ai/assessment/${assessment._id}/export/word`, {
                responseType: 'blob'
            });

            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            });

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `考核题目_${Date.now()}.docx`;
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
            <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
                <CircularProgress />
                <Typography variant="h6" sx={{ mt: 2 }}>
                    正在加载考核内容...
                </Typography>
            </Container>
        );
    }

    if (error && !assessment) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="error">
                    {error}
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
                        🎯 AI考核分享
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        通过分享链接访问的考核题目
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
                    {/* 考核标题和基本信息 */}
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h3" gutterBottom sx={{ 
                            color: 'primary.main', 
                            fontWeight: 'bold',
                            textAlign: 'center',
                            mb: 3
                        }}>
                            {assessment.title}
                        </Typography>

                        <Typography variant="body1" color="text.secondary" paragraph sx={{ textAlign: 'center' }}>
                            {assessment.description}
                        </Typography>

                        {/* 基本信息卡片 */}
                        <Card sx={{ mb: 3, backgroundColor: '#f8f9fa' }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <SchoolIcon sx={{ mr: 1, color: 'primary.main' }} />
                                        <Typography variant="body2">
                                            科目：{assessment.subject?.subName || '未知科目'}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <TeacherIcon sx={{ mr: 1, color: 'primary.main' }} />
                                        <Typography variant="body2">
                                            教师：{assessment.teacher?.name || '未知教师'}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <TimeIcon sx={{ mr: 1, color: 'primary.main' }} />
                                        <Typography variant="body2">
                                            时长：{assessment.duration}分钟
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <DateIcon sx={{ mr: 1, color: 'primary.main' }} />
                                        <Typography variant="body2">
                                            生成时间：{new Date(assessment.createdAt).toLocaleString()}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>

                        {/* 考核统计 */}
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
                            <Chip 
                                label={`难度: ${assessment.difficulty}`} 
                                color="primary" 
                                variant="outlined"
                            />
                            <Chip 
                                label={`题目: ${assessment.questions?.length || 0}题`} 
                                color="secondary" 
                                variant="outlined"
                            />
                            <Chip 
                                label={`总分: ${assessment.questions?.reduce((sum, q) => sum + (q.points || 0), 0) || 0}分`} 
                                color="success" 
                                variant="outlined"
                            />
                        </Box>

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

                    {/* 题目列表 */}
                    <Box>
                        <Typography variant="h5" gutterBottom sx={{ 
                            color: 'primary.main', 
                            fontWeight: 'bold',
                            mb: 3
                        }}>
                            📝 考核题目
                        </Typography>

                        {assessment.questions?.map((question, index) => (
                            <Card key={index} sx={{ mb: 3, borderLeft: 4, borderColor: 'primary.main' }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                            第{index + 1}题
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Chip label={question.type} size="small" color="primary" />
                                            <Chip label={`${question.points}分`} size="small" color="secondary" />
                                        </Box>
                                    </Box>

                                    <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem' }}>
                                        {question.question}
                                    </Typography>

                                    {/* 选择题选项 */}
                                    {question.options && question.options.length > 0 && (
                                        <Box sx={{ ml: 2, mb: 2 }}>
                                            {question.options.map((option, optIndex) => (
                                                <Typography key={optIndex} variant="body2" sx={{ mb: 0.5 }}>
                                                    {String.fromCharCode(65 + optIndex)}. {option}
                                                </Typography>
                                            ))}
                                        </Box>
                                    )}

                                    {/* 参考答案 */}
                                    <Box sx={{ mt: 2, p: 2, backgroundColor: '#f0f7ff', borderRadius: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                            参考答案：{question.correctAnswer}
                                        </Typography>
                                        {question.explanation && (
                                            <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                                                解析：{question.explanation}
                                            </Typography>
                                        )}
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>

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
                            🤖 本考核由AI智能生成，通过分享链接访问
                        </Typography>
                        <Typography variant="body2">
                            📅 生成时间：{new Date(assessment.createdAt).toLocaleString()}
                        </Typography>
                        <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                            AI考核生成系统 - 让考核更智能
                        </Typography>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default AssessmentShareView;
