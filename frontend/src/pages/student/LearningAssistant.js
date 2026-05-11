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
import SpeedIcon from '@mui/icons-material/Speed';
import StopIcon from '@mui/icons-material/Stop';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { safeGet } from '../../utils/safeAccess';

const LearningAssistant = () => {
    const { currentUser } = useSelector(state => state.user);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [conversationId, setConversationId] = useState('');
    const [subjects, setSubjects] = useState([]);
    const [subjectsLoading, setSubjectsLoading] = useState(false);
    const [useStreaming, setUseStreaming] = useState(true);
    const [streamingMessage, setStreamingMessage] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [eventSource, setEventSource] = useState(null);
    const messagesEndRef = useRef(null);

    // 获取学生的科目列表
    useEffect(() => {
        if (currentUser) {
            fetchSubjects();
        }
        // 添加欢迎消息
        setMessages([{
            id: 'welcome',
            type: 'ai',
            content: '你好！我是你的学习助手。我可以帮助你解答学习中遇到的问题，提供详细的解释和指导。请先选择一个科目，然后随时向我提问！',
            timestamp: new Date()
        }]);
    }, [currentUser]);

    // 自动滚动到最新消息
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchSubjects = async () => {
        setSubjectsLoading(true);
        try {
            // 获取学生的科目列表（包括班级科目和选修科目）
            const studentId = safeGet(currentUser, '_id');
            if (studentId) {
                console.log('获取学生科目，学生ID:', studentId);

                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/student/${studentId}/subjects`);

                if (response.data && response.data.success) {
                    console.log('获取到学生科目列表:', response.data.data.subjects);
                    setSubjects(response.data.data.subjects);

                    // 如果没有科目，提示用户选择科目
                    if (response.data.data.subjects.length === 0) {
                        setError('您还没有选择任何科目，请先到"课程管理"页面选择科目');
                    }
                } else {
                    console.log('获取科目失败:', response.data.message);
                    setSubjects([]);
                    setError('获取科目失败: ' + (response.data.message || '未知错误'));
                }
            } else {
                console.log('学生信息不完整，当前用户:', currentUser);
                setSubjects([]);
                setError('学生信息不完整');
            }
        } catch (err) {
            console.error('获取科目列表失败:', err);
            setSubjects([]);
            setError('获取科目列表失败: ' + err.message);
        } finally {
            setSubjectsLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // 停止流式响应
    const stopStreaming = () => {
        if (eventSource) {
            eventSource.close();
            setEventSource(null);
        }
        setIsStreaming(false);
        setStreamingMessage('');
    };

    // 流式消息发送
    const handleSendMessageStream = async () => {
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
        const currentMessage = inputMessage;
        setInputMessage('');
        setIsStreaming(true);
        setStreamingMessage('');
        setError('');

        try {
            const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/student/ai/ask/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    studentId: safeGet(currentUser, '_id'),
                    subjectId: selectedSubject,
                    question: currentMessage,
                    conversationId: conversationId
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let fullContent = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop();

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const jsonStr = line.slice(6);
                            if (jsonStr === '[DONE]') break;

                            const eventData = JSON.parse(jsonStr);

                            if (eventData.type === 'chunk' && eventData.content) {
                                fullContent += eventData.content;
                                setStreamingMessage(fullContent);
                            } else if (eventData.type === 'complete') {
                                const aiMessage = {
                                    id: eventData.messageId || Date.now() + 1,
                                    type: 'ai',
                                    content: eventData.fullContent || fullContent,
                                    timestamp: new Date()
                                };
                                setMessages(prev => [...prev, aiMessage]);
                                setConversationId(eventData.conversationId);
                                setStreamingMessage('');
                                setIsStreaming(false);
                                return;
                            } else if (eventData.type === 'error') {
                                setError(eventData.message || '流式响应错误');
                                setIsStreaming(false);
                                return;
                            }
                        } catch (parseError) {
                            console.warn('解析流式数据失败:', parseError.message);
                        }
                    }
                }
            }

            if (fullContent && isStreaming) {
                const aiMessage = {
                    id: Date.now() + 1,
                    type: 'ai',
                    content: fullContent,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, aiMessage]);
                setStreamingMessage('');
            }

        } catch (err) {
            setError('发送消息失败：' + err.message);
        } finally {
            setIsStreaming(false);
            setStreamingMessage('');
        }
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
            const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/student/ai/ask`, {
                studentId: safeGet(currentUser, '_id'),
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

    // 根据模式选择发送方法
    const handleSend = () => {
        if (useStreaming) {
            handleSendMessageStream();
        } else {
            handleSendMessage();
        }
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSend();
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
                                disabled={subjectsLoading}
                            >
                                {subjectsLoading ? (
                                    <MenuItem disabled>
                                        <CircularProgress size={16} sx={{ mr: 1 }} />
                                        加载科目中...
                                    </MenuItem>
                                ) : subjects.length > 0 ? (
                                    subjects.map(subject => (
                                        <MenuItem key={subject._id} value={subject._id}>
                                            {subject.subName}
                                        </MenuItem>
                                    ))
                                ) : (
                                    <MenuItem disabled>暂无可用科目</MenuItem>
                                )}
                            </Select>
                        </FormControl>

                        {/* 流式响应控制 */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Chip
                                icon={<SpeedIcon />}
                                label={useStreaming ? "流式响应" : "普通响应"}
                                color={useStreaming ? "primary" : "default"}
                                onClick={() => setUseStreaming(!useStreaming)}
                                clickable
                                size="small"
                            />
                            {isStreaming && (
                                <Button
                                    size="small"
                                    color="error"
                                    startIcon={<StopIcon />}
                                    onClick={stopStreaming}
                                >
                                    停止
                                </Button>
                            )}
                        </Box>
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
                            {/* 流式消息显示 */}
                            {isStreaming && streamingMessage && (
                                <ListItem sx={{ justifyContent: 'flex-start' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, maxWidth: '80%' }}>
                                        <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                                            <SmartToyIcon />
                                        </Avatar>
                                        <Paper sx={{ p: 2, bgcolor: 'grey.100', position: 'relative' }}>
                                            <Typography variant="body2">
                                                {formatMessage(streamingMessage)}
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                                <CircularProgress size={12} sx={{ mr: 1 }} />
                                                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                                                    正在输入...
                                                </Typography>
                                            </Box>
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
                            onClick={isStreaming ? stopStreaming : handleSend}
                            disabled={(loading || isStreaming) && !isStreaming || !inputMessage.trim() || !selectedSubject}
                            color={isStreaming ? "error" : "primary"}
                            sx={{ minWidth: 'auto', px: 2 }}
                        >
                            {isStreaming ? <StopIcon /> : <SendIcon />}
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
