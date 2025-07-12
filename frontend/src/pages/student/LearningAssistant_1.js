import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Container,
    Typography,
    TextField,
    Button,
    Paper,
    List,
    ListItem,
    Avatar,
    Chip,
    CircularProgress,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Card,
    CardContent,
    Divider
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import { useSelector } from 'react-redux';
import axios from 'axios';

const LearningAssistant = () => {
    const { currentUser } = useSelector(state => state.user);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [conversationId, setConversationId] = useState('');
    const [subjects, setSubjects] = useState([]);
    const messagesEndRef = useRef(null);

    // 获取学生的科目列表
    useEffect(() => {
        fetchSubjects();
        // 添加欢迎消息
        setMessages([{
            id: 'welcome',
            type: 'ai',
            content: '你好！我是你的学习助手。我可以帮助你解答学习中遇到的问题，提供详细的解释和指导。请先选择一个科目，然后随时向我提问！',
            timestamp: new Date()
        }]);
    }, []);

    // 自动滚动到最新消息
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchSubjects = async () => {
        try {
            // 这里需要根据学生的班级获取科目列表
            // 暂时使用模拟数据
            setSubjects([
                { _id: 'js', subName: 'TensorFlow.js' }
                // { _id: 'physics', subName: '物理' },
                // { _id: 'chemistry', subName: '化学' }
                // { _id: 'math', subName: '数学' },
                // { _id: 'chinese', subName: '语文' },
                // { _id: 'english', subName: '英语' },
                // { _id: 'physics', subName: '物理' },
                // { _id: 'chemistry', subName: '化学' }
            ]);
        } catch (err) {
            console.error('获取科目列表失败:', err);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim()) return;
        if (!selectedSubject) {
            setError('请先选择一个科目');
            return;
        }

        const userMessage = {
            id: Date.now(),
            type: 'user',
            content: inputMessage,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setLoading(true);
        setError('');

        try {
            const response = await axios.post('/api/student/ai/ask', {
                studentId: currentUser._id,
                subjectId: selectedSubject,
                question: inputMessage,
                conversationId: conversationId
            });

            if (response.data.success) {
                const aiMessage = {
                    id: response.data.messageId || Date.now() + 1,
                    type: 'ai',
                    content: response.data.answer,
                    timestamp: new Date()
                };

                setMessages(prev => [...prev, aiMessage]);
                setConversationId(response.data.conversationId);
            } else {
                setError(response.data.message || '获取回答失败');
            }
        } catch (err) {
            setError('发送消息失败：' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage();
        }
    };

    const formatMessage = (content) => {
        // 简单的消息格式化，支持换行
        return content.split('\n').map((line, index) => (
            <React.Fragment key={index}>
                {line}
                {index < content.split('\n').length - 1 && <br />}
            </React.Fragment>
        ));
    };

    const getQuickQuestions = () => {
        const subjectQuestions = {
            'math': [
                '这道数学题怎么解？',
                '二次函数的性质是什么？',
                '如何求导数？'
            ],
            'chinese': [
                '这篇文章的主旨是什么？',
                '如何写好议论文？',
                '古诗词的意境如何理解？'
            ],
            'english': [
                '这个语法点怎么用？',
                '如何提高英语写作？',
                '这个单词的用法是什么？'
            ],
            'physics': [
                '牛顿定律如何应用？',
                '电路分析方法有哪些？',
                '波的性质是什么？'
            ],
            'chemistry': [
                '化学反应方程式怎么配平？',
                '有机化学的基本概念？',
                '元素周期表的规律？'
            ]
        };

        return subjectQuestions[selectedSubject] || [];
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SchoolIcon color="primary" />
                在线学习助手
            </Typography>

            <Box sx={{ display: 'flex', gap: 3, height: 'calc(100vh - 200px)' }}>
                {/* 左侧：对话区域 */}
                <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
                    {/* 科目选择 */}
                    <Box sx={{ mb: 2 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>选择科目</InputLabel>
                            <Select
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                label="选择科目"
                            >
                                {subjects.map(subject => (
                                    <MenuItem key={subject._id} value={subject._id}>
                                        {subject.subName}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    {/* 消息列表 */}
                    <Box sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
                        <List>
                            {messages.map((message) => (
                                <ListItem
                                    key={message.id}
                                    sx={{
                                        flexDirection: 'column',
                                        alignItems: message.type === 'user' ? 'flex-end' : 'flex-start',
                                        mb: 1
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: 1,
                                            maxWidth: '80%',
                                            flexDirection: message.type === 'user' ? 'row-reverse' : 'row'
                                        }}
                                    >
                                        <Avatar
                                            sx={{
                                                bgcolor: message.type === 'user' ? 'primary.main' : 'secondary.main',
                                                width: 32,
                                                height: 32
                                            }}
                                        >
                                            {message.type === 'user' ? <PersonIcon /> : <SmartToyIcon />}
                                        </Avatar>
                                        <Paper
                                            sx={{
                                                p: 2,
                                                bgcolor: message.type === 'user' ? 'primary.light' : 'grey.100',
                                                color: message.type === 'user' ? 'white' : 'text.primary'
                                            }}
                                        >
                                            <Typography variant="body1">
                                                {formatMessage(message.content)}
                                            </Typography>
                                            <Typography variant="caption" sx={{ opacity: 0.7, mt: 1, display: 'block' }}>
                                                {message.timestamp.toLocaleTimeString()}
                                            </Typography>
                                        </Paper>
                                    </Box>
                                </ListItem>
                            ))}
                            {loading && (
                                <ListItem sx={{ justifyContent: 'flex-start' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                                            <SmartToyIcon />
                                        </Avatar>
                                        <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
                                            <CircularProgress size={20} />
                                            <Typography variant="body2" sx={{ ml: 1, display: 'inline' }}>
                                                正在思考...
                                            </Typography>
                                        </Paper>
                                    </Box>
                                </ListItem>
                            )}
                        </List>
                        <div ref={messagesEndRef} />
                    </Box>

                    {/* 错误提示 */}
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                            {error}
                        </Alert>
                    )}

                    {/* 输入区域 */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                            fullWidth
                            multiline
                            maxRows={3}
                            placeholder="输入你的问题..."
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={loading || !selectedSubject}
                        />
                        <Button
                            variant="contained"
                            onClick={handleSendMessage}
                            disabled={loading || !inputMessage.trim() || !selectedSubject}
                            sx={{ minWidth: 'auto', px: 2 }}
                        >
                            <SendIcon />
                        </Button>
                    </Box>
                </Paper>

                {/* 右侧：快捷问题和提示 */}
                <Box sx={{ width: 300 }}>
                    <Card sx={{ mb: 2 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                使用提示
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                • 选择对应的科目获得更准确的回答
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                • 描述问题时尽量详细和具体
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                • 可以上传题目图片或输入题目文字
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                • 支持数学公式、代码等多种格式
                            </Typography>
                        </CardContent>
                    </Card>

                    {selectedSubject && (
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    常见问题
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {getQuickQuestions().map((question, index) => (
                                        <Chip
                                            key={index}
                                            label={question}
                                            variant="outlined"
                                            clickable
                                            onClick={() => setInputMessage(question)}
                                            sx={{ justifyContent: 'flex-start', height: 'auto', py: 1 }}
                                        />
                                    ))}
                                </Box>
                            </CardContent>
                        </Card>
                    )}
                </Box>
            </Box>
        </Container>
    );
};

export default LearningAssistant;
