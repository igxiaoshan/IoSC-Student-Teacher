/**
 * 学习历史记录组件
 * 显示学生的AI学习交互历史
 */

import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Button,
    Pagination,
    Card,
    CardContent,
    CardActions,
    Collapse,
    IconButton,
    Alert,
    CircularProgress,
    Divider
} from '@mui/material';
import {
    History as HistoryIcon,
    QuestionAnswer as QuestionIcon,
    Quiz as QuizIcon,
    CheckCircle as CheckIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Search as SearchIcon,
    FilterList as FilterIcon,
    School as SchoolIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import aiService from '../../services/aiService';

const LearningHistory = () => {
    const { currentUser } = useSelector(state => state.user);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedRecord, setExpandedRecord] = useState(null);
    
    // 过滤和分页状态
    const [filters, setFilters] = useState({
        subject: '',
        questionType: '',
        search: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
    });

    // 学科和问题类型选项
    const subjects = ['', '数学', '语文', '英语', '物理', '化学', '生物', '历史', '地理', '政治', '计算机', '通用'];
    const questionTypes = ['', '学习问答', '练习题目', '答案检查', '知识点查询'];

    // 获取学习历史
    const fetchLearningHistory = async (page = 1) => {
        setLoading(true);
        setError('');
        
        try {
            const queryParams = {
                page,
                limit: pagination.limit,
                ...filters
            };
            
            // 移除空值
            Object.keys(queryParams).forEach(key => {
                if (!queryParams[key]) delete queryParams[key];
            });

            const response = await aiService.getStudentLearningHistory(currentUser._id, queryParams);
            
            if (response.success) {
                setRecords(response.data.records);
                setPagination(prev => ({
                    ...prev,
                    ...response.data.pagination
                }));
            } else {
                setError(response.error || '获取学习历史失败');
            }
        } catch (error) {
            console.error('获取学习历史失败:', error);
            setError('获取学习历史失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    // 初始加载
    useEffect(() => {
        fetchLearningHistory();
    }, []);

    // 处理过滤器变化
    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // 应用过滤器
    const handleApplyFilters = () => {
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchLearningHistory(1);
    };

    // 处理分页
    const handlePageChange = (event, page) => {
        setPagination(prev => ({ ...prev, page }));
        fetchLearningHistory(page);
    };

    // 展开/收起记录详情
    const handleExpandRecord = (recordId) => {
        setExpandedRecord(expandedRecord === recordId ? null : recordId);
    };

    // 格式化时间
    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // 获取问题类型图标
    const getQuestionTypeIcon = (type) => {
        switch (type) {
            case '学习问答':
                return <QuestionIcon color="primary" />;
            case '练习题目':
                return <QuizIcon color="secondary" />;
            case '答案检查':
                return <CheckIcon color="success" />;
            default:
                return <SchoolIcon color="action" />;
        }
    };

    // 获取问题类型颜色
    const getQuestionTypeColor = (type) => {
        switch (type) {
            case '学习问答':
                return 'primary';
            case '练习题目':
                return 'secondary';
            case '答案检查':
                return 'success';
            default:
                return 'default';
        }
    };

    // 渲染学习记录
    const renderLearningRecord = (record) => {
        const isExpanded = expandedRecord === record._id;
        
        return (
            <Card key={record._id} sx={{ mb: 2 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                {getQuestionTypeIcon(record.questionType)}
                                <Typography variant="h6" sx={{ ml: 1, mr: 2 }}>
                                    {record.questionType}
                                </Typography>
                                <Chip 
                                    label={record.subject} 
                                    size="small" 
                                    color={getQuestionTypeColor(record.questionType)}
                                    variant="outlined"
                                />
                                {record.isCorrect !== null && (
                                    <Chip 
                                        label={record.isCorrect ? '正确' : '错误'}
                                        size="small"
                                        color={record.isCorrect ? 'success' : 'error'}
                                        sx={{ ml: 1 }}
                                    />
                                )}
                            </Box>
                            
                            <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
                                问题: {record.question.length > 100 ? 
                                    `${record.question.substring(0, 100)}...` : 
                                    record.question
                                }
                            </Typography>
                            
                            <Typography variant="caption" color="text.secondary">
                                {formatTime(record.createdAt)}
                                {record.studyDuration > 0 && (
                                    <span> • 学习时长: {record.studyDuration}秒</span>
                                )}
                            </Typography>
                        </Box>
                        
                        <IconButton
                            onClick={() => handleExpandRecord(record._id)}
                            size="small"
                        >
                            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                    </Box>
                </CardContent>
                
                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <CardContent sx={{ pt: 0 }}>
                        <Divider sx={{ mb: 2 }} />
                        
                        {/* 完整问题 */}
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="primary" gutterBottom>
                                完整问题:
                            </Typography>
                            <Typography variant="body2" sx={{ 
                                p: 2, 
                                bgcolor: 'grey.50', 
                                borderRadius: 1,
                                whiteSpace: 'pre-wrap'
                            }}>
                                {record.question}
                            </Typography>
                        </Box>
                        
                        {/* 学生答案 */}
                        {record.studentAnswer && (
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="secondary" gutterBottom>
                                    您的答案:
                                </Typography>
                                <Typography variant="body2" sx={{ 
                                    p: 2, 
                                    bgcolor: 'blue.50', 
                                    borderRadius: 1,
                                    whiteSpace: 'pre-wrap'
                                }}>
                                    {record.studentAnswer}
                                </Typography>
                            </Box>
                        )}
                        
                        {/* AI回复 */}
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="success.main" gutterBottom>
                                AI回复:
                            </Typography>
                            <Typography variant="body2" sx={{ 
                                p: 2, 
                                bgcolor: 'green.50', 
                                borderRadius: 1,
                                whiteSpace: 'pre-wrap',
                                lineHeight: 1.6
                            }}>
                                {record.aiResponse}
                            </Typography>
                        </Box>
                        
                        {/* 知识点标签 */}
                        {record.knowledgePoints && record.knowledgePoints.length > 0 && (
                            <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                    相关知识点:
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {record.knowledgePoints.map((point, index) => (
                                        <Chip 
                                            key={index}
                                            label={point}
                                            size="small"
                                            variant="outlined"
                                        />
                                    ))}
                                </Box>
                            </Box>
                        )}
                    </CardContent>
                </Collapse>
            </Card>
        );
    };

    return (
        <Box sx={{ maxWidth: 1000, mx: 'auto', p: 2 }}>
            {/* 头部 */}
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <HistoryIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h5">学习历史</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                    查看您与AI学习助手的所有交互记录，回顾学习过程
                </Typography>
            </Paper>

            {/* 过滤器 */}
            <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <FilterIcon sx={{ mr: 1 }} />
                    <Typography variant="h6">筛选条件</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <FormControl sx={{ minWidth: 120 }}>
                        <InputLabel>学科</InputLabel>
                        <Select
                            value={filters.subject}
                            label="学科"
                            onChange={(e) => handleFilterChange('subject', e.target.value)}
                        >
                            {subjects.map((subject) => (
                                <MenuItem key={subject} value={subject}>
                                    {subject || '全部'}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    
                    <FormControl sx={{ minWidth: 140 }}>
                        <InputLabel>问题类型</InputLabel>
                        <Select
                            value={filters.questionType}
                            label="问题类型"
                            onChange={(e) => handleFilterChange('questionType', e.target.value)}
                        >
                            {questionTypes.map((type) => (
                                <MenuItem key={type} value={type}>
                                    {type || '全部'}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    
                    <TextField
                        label="搜索关键词"
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        sx={{ minWidth: 200 }}
                    />
                    
                    <Button
                        variant="contained"
                        startIcon={<SearchIcon />}
                        onClick={handleApplyFilters}
                        disabled={loading}
                    >
                        搜索
                    </Button>
                </Box>
            </Paper>

            {/* 错误提示 */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {/* 加载状态 */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            )}

            {/* 学习记录列表 */}
            {!loading && records.length > 0 && (
                <Box>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        共找到 {pagination.total} 条记录
                    </Typography>
                    
                    {records.map(renderLearningRecord)}
                    
                    {/* 分页 */}
                    {pagination.pages > 1 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                            <Pagination
                                count={pagination.pages}
                                page={pagination.page}
                                onChange={handlePageChange}
                                color="primary"
                                size="large"
                            />
                        </Box>
                    )}
                </Box>
            )}

            {/* 空状态 */}
            {!loading && records.length === 0 && (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <HistoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        暂无学习记录
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        开始使用AI学习助手，您的学习历史将在这里显示
                    </Typography>
                </Paper>
            )}
        </Box>
    );
};

export default LearningHistory;
