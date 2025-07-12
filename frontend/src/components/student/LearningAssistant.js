/**
 * 学生学习助手组件
 * 提供AI驱动的学习问答功能
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    Paper,
    TextField,
    Button,
    Typography,
    List,
    ListItem,
    ListItemText,
    Avatar,
    Chip,
    CircularProgress,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    Send as SendIcon,
    Person as PersonIcon,
    SmartToy as AIIcon,
    Clear as ClearIcon,
    History as HistoryIcon,
    School as SchoolIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import aiService from '../../services/aiService';

const LearningAssistant = () => {
    const { currentUser } = useSelector(state => state.user);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [conversationId, setConversationId] = useState('');
    const messagesEndRef = useRef(null);

    // 学科选项
    const subjects = [
        '数学', '语文', '英语', '物理', '化学', '生物',
        '历史', '地理', '政治', '计算机', '通用'
    ];

    // 滚动到底部
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // 发送消息
    const handleSendMessage = async () => {
        if (!inputMessage.trim()) return;

        const userMessage = {
            id: Date.now(),
            type: 'user',
            content: inputMessage,
            timestamp: new Date(),
            subject: selectedSubject
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);
        setError('');

        try {
            const response = await aiService.studentAskQuestion(
                inputMessage,
                currentUser._id,
                selectedSubject
            );

            if (response.success) {
                const aiMessage = {
                    id: Date.now() + 1,
                    type: 'ai',
                    content: response.data.answer,
                    timestamp: new Date(),
                    conversationId: response.data.conversationId,
                    recordId: response.data.recordId
                };

                setMessages(prev => [...prev, aiMessage]);
                setConversationId(response.data.conversationId);
            } else {
                setError(response.error || '获取AI回复失败');
            }
        } catch (error) {
            console.error('发送消息失败:', error);
            setError('发送消息失败，请稍后重试');
        } finally {
            setIsLoading(false);
        }
    };

    // 清空对话
    const handleClearChat = () => {
        setMessages([]);
        setConversationId('');
        setError('');
    };

    // 处理回车键发送
    const handleKeyPress = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage();
        }
    };

    // 格式化时间
    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // 渲染消息内容
    const renderMessageContent = (content) => {
        // 简单的Markdown渲染
        let formatted = content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');

        return <div dangerouslySetInnerHTML={{ __html: formatted }} />;
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* 头部 */}
            <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <SchoolIcon color="primary" />
                        <Typography variant="h6">AI学习助手</Typography>
                        {conversationId && (
                            <Chip 
                                label="对话中" 
                                color="success" 
                                size="small" 
                                variant="outlined"
                            />
                        )}
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel>学科</InputLabel>
                            <Select
                                value={selectedSubject}
                                label="学科"
                                onChange={(e) => setSelectedSubject(e.target.value)}
                            >
                                {subjects.map((subject) => (
                                    <MenuItem key={subject} value={subject}>
                                        {subject}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        
                        <Tooltip title="清空对话">
                            <IconButton onClick={handleClearChat} disabled={messages.length === 0}>
                                <ClearIcon />
                            </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="学习历史">
                            <IconButton>
                                <HistoryIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
            </Paper>

            {/* 错误提示 */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {/* 消息列表 */}
            <Paper 
                elevation={1} 
                sx={{ 
                    flex: 1, 
                    overflow: 'auto', 
                    p: 1,
                    backgroundColor: '#f5f5f5'
                }}
            >
                {messages.length === 0 ? (
                    <Box 
                        sx={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            alignItems: 'center', 
                            justifyContent: 'center',
                            height: '100%',
                            color: 'text.secondary'
                        }}
                    >
                        <AIIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                        <Typography variant="h6" gutterBottom>
                            欢迎使用AI学习助手！
                        </Typography>
                        <Typography variant="body2" textAlign="center">
                            我可以帮助您解答学习问题、解释知识点、提供学习建议。
                            <br />
                            请选择学科并输入您的问题开始对话。
                        </Typography>
                    </Box>
                ) : (
                    <List sx={{ p: 0 }}>
                        {messages.map((message) => (
                            <ListItem
                                key={message.id}
                                sx={{
                                    display: 'flex',
                                    flexDirection: message.type === 'user' ? 'row-reverse' : 'row',
                                    alignItems: 'flex-start',
                                    mb: 2
                                }}
                            >
                                <Avatar
                                    sx={{
                                        bgcolor: message.type === 'user' ? 'primary.main' : 'secondary.main',
                                        mx: 1
                                    }}
                                >
                                    {message.type === 'user' ? <PersonIcon /> : <AIIcon />}
                                </Avatar>
                                
                                <Paper
                                    elevation={2}
                                    sx={{
                                        p: 2,
                                        maxWidth: '70%',
                                        bgcolor: message.type === 'user' ? 'primary.light' : 'white',
                                        color: message.type === 'user' ? 'primary.contrastText' : 'text.primary'
                                    }}
                                >
                                    <Box>
                                        {renderMessageContent(message.content)}
                                    </Box>
                                    
                                    <Box sx={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        mt: 1,
                                        opacity: 0.7
                                    }}>
                                        <Typography variant="caption">
                                            {formatTime(message.timestamp)}
                                        </Typography>
                                        
                                        {message.subject && (
                                            <Chip 
                                                label={message.subject} 
                                                size="small" 
                                                variant="outlined"
                                                sx={{ ml: 1 }}
                                            />
                                        )}
                                    </Box>
                                </Paper>
                            </ListItem>
                        ))}
                        
                        {/* 加载指示器 */}
                        {isLoading && (
                            <ListItem sx={{ justifyContent: 'flex-start' }}>
                                <Avatar sx={{ bgcolor: 'secondary.main', mx: 1 }}>
                                    <AIIcon />
                                </Avatar>
                                <Paper elevation={2} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CircularProgress size={16} />
                                    <Typography variant="body2" color="text.secondary">
                                        AI正在思考中...
                                    </Typography>
                                </Paper>
                            </ListItem>
                        )}
                    </List>
                )}
                <div ref={messagesEndRef} />
            </Paper>

            {/* 输入区域 */}
            <Paper elevation={2} sx={{ p: 2, mt: 2 }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                    <TextField
                        fullWidth
                        multiline
                        maxRows={4}
                        placeholder="请输入您的学习问题..."
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isLoading}
                        variant="outlined"
                        size="small"
                    />
                    
                    <Button
                        variant="contained"
                        endIcon={<SendIcon />}
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim() || isLoading}
                        sx={{ minWidth: 100 }}
                    >
                        发送
                    </Button>
                </Box>
                
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    按 Enter 发送，Shift + Enter 换行
                </Typography>
            </Paper>
        </Box>
    );
};

export default LearningAssistant;
