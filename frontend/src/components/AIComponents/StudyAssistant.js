import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    Paper,
    TextField,
    Button,
    Typography,
    List,
    ListItem,
    Avatar,
    Chip,
    CircularProgress,
    Alert,
    Divider,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    Send as SendIcon,
    Psychology as PsychologyIcon,
    Clear as ClearIcon,
    SmartToy as SmartToyIcon,
    School as SchoolIcon
} from '@mui/icons-material';
import { askStudyAssistant } from '../../redux/aiRelated/aiHandle';
import { clearStudyAssistantMessages, addStudyAssistantMessage } from '../../redux/aiRelated/aiSlice';
import AIMessageDisplay from './AIMessageDisplay';
import StreamingMessageDisplay from './StreamingMessageDisplay';
import { streamStudyAssistant } from '../../utils/streamingAPI';

const StudyAssistant = ({ studentId, subject }) => {
    const dispatch = useDispatch();
    const { messages, loading, error } = useSelector(state => state.ai.studyAssistant);
    const [question, setQuestion] = useState('');
    const messagesEndRef = useRef(null);

    // 流式响应状态
    const [streamingContent, setStreamingContent] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingError, setStreamingError] = useState(null);
    const [cancelStreaming, setCancelStreaming] = useState(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (question.trim() && !loading && !isStreaming) {
            const questionText = question.trim();

            // 添加用户消息
            const userMessage = {
                type: 'user',
                content: questionText,
                timestamp: new Date()
            };
            dispatch(addStudyAssistantMessage(userMessage));

            // 重置流式状态
            setStreamingContent('');
            setStreamingError(null);
            setIsStreaming(true);

            // 启动流式AI响应
            const cancel = streamStudyAssistant(
                studentId,
                {
                    question: questionText,
                    subject,
                    context: {
                        previousMessages: messages.slice(-5)
                    }
                },
                // onContent - 内容更新回调
                (newContent, fullContent) => {
                    setStreamingContent(fullContent);
                },
                // onComplete - 完成回调
                (finalContent, metadata) => {
                    setIsStreaming(false);

                    // 添加AI回复到消息列表
                    const aiMessage = {
                        type: 'ai',
                        content: finalContent,
                        timestamp: new Date(),
                        confidence: metadata.confidence || 0,
                        conversationId: metadata.conversationId
                    };
                    dispatch(addStudyAssistantMessage(aiMessage));

                    // 清空流式内容
                    setStreamingContent('');
                },
                // onError - 错误回调
                (error) => {
                    setIsStreaming(false);
                    setStreamingError(error);
                    console.error('Streaming error:', error);
                }
            );

            setCancelStreaming(() => cancel);
            setQuestion('');
        }
    };

    const handleClearMessages = () => {
        dispatch(clearStudyAssistantMessages());
    };

    const formatMessage = (message) => {
        if (typeof message.content === 'string') {
            return message.content;
        }
        return message.content.answer || JSON.stringify(message.content);
    };

    const getMessageIcon = (type) => {
        switch (type) {
            case 'user':
                return <SchoolIcon />;
            case 'ai':
                return <SmartToyIcon />;
            case 'guidance':
                return <PsychologyIcon />;
            default:
                return <SmartToyIcon />;
        }
    };

    const getMessageColor = (type) => {
        switch (type) {
            case 'user':
                return 'primary';
            case 'ai':
                return 'secondary';
            case 'guidance':
                return 'success';
            default:
                return 'default';
        }
    };

    return (
        <Paper elevation={3} sx={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
            {/* 头部 */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SmartToyIcon color="primary" />
                    <Typography variant="h6">AI学习助手</Typography>
                    {subject && <Chip label={subject} size="small" color="primary" variant="outlined" />}
                </Box>
                <Tooltip title="清空对话">
                    <IconButton onClick={handleClearMessages} size="small">
                        <ClearIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* 消息列表 */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
                
                {messages.length === 0 && !loading && (
                    <Box sx={{ textAlign: 'center', mt: 4 }}>
                        <SmartToyIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                            你好！我是你的AI学习助手
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            有什么学习问题可以问我哦～
                        </Typography>
                    </Box>
                )}

                <List>
                    {messages.map((message, index) => (
                        <ListItem key={index} sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%', gap: 1 }}>
                                <Avatar
                                    sx={{
                                        bgcolor: getMessageColor(message.type) + '.main',
                                        width: 32,
                                        height: 32
                                    }}
                                >
                                    {getMessageIcon(message.type)}
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        {message.type === 'user' ? '你' : 'AI助手'} • {new Date(message.timestamp).toLocaleTimeString()}
                                    </Typography>

                                    {/* 根据消息类型选择渲染方式 */}
                                    {message.type === 'ai' ? (
                                        <AIMessageDisplay
                                            content={formatMessage(message)}
                                            timestamp={message.timestamp}
                                            confidence={message.confidence}
                                            mood={message.mood}
                                            showThinkingByDefault={false}
                                            allowToggleThinking={true}
                                        />
                                    ) : (
                                        <Paper
                                            elevation={1}
                                            sx={{
                                                p: 2,
                                                mt: 0.5,
                                                bgcolor: 'primary.light',
                                                color: 'primary.contrastText'
                                            }}
                                        >
                                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                                {formatMessage(message)}
                                            </Typography>
                                        </Paper>
                                    )}
                                </Box>
                            </Box>
                        </ListItem>
                    ))}
                </List>

                {/* 流式消息显示 */}
                {(isStreaming || streamingContent) && (
                    <Box sx={{ p: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                                <SmartToyIcon />
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                    AI助手 • {new Date().toLocaleTimeString()}
                                </Typography>
                                <StreamingMessageDisplay
                                    content={streamingContent}
                                    isStreaming={isStreaming}
                                    error={streamingError}
                                    timestamp={new Date()}
                                    showCursor={true}
                                />
                            </Box>
                        </Box>
                    </Box>
                )}

                {loading && !isStreaming && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2 }}>
                        <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                            <SmartToyIcon />
                        </Avatar>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircularProgress size={16} />
                            <Typography variant="body2" color="text.secondary">
                                AI正在思考中...
                            </Typography>
                        </Box>
                    </Box>
                )}

                <div ref={messagesEndRef} />
            </Box>

            <Divider />

            {/* 输入框 */}
            <Box component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="输入你的问题..."
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        disabled={loading}
                        multiline
                        maxRows={3}
                        size="small"
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={!question.trim() || loading}
                        sx={{ minWidth: 'auto', px: 2 }}
                    >
                        <SendIcon />
                    </Button>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    按 Enter 发送，Shift + Enter 换行
                </Typography>
            </Box>
        </Paper>
    );
};

export default StudyAssistant;
