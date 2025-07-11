import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    Paper,
    Typography,
    Avatar,
    Button,
    TextField,
    Card,
    CardContent,
    Chip,
    Grid,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Dialog,
    DialogTitle,
    DialogContent,
    LinearProgress,
    Fab,
    Badge,
    Tooltip
} from '@mui/material';
import {
    Favorite as HeartIcon,
    EmojiEvents as TrophyIcon,
    Psychology as BrainIcon,
    Chat as ChatIcon,
    Star as StarIcon,
    TrendingUp as TrendingUpIcon,
    School as SchoolIcon,
    Close as CloseIcon,
    Send as SendIcon
} from '@mui/icons-material';
import {
    getCompanionStatus,
    chatWithCompanion
} from '../../redux/aiRelated/aiHandle';
import { addCompanionMessage, updateCompanionMood } from '../../redux/aiRelated/aiSlice';
import AIMessageDisplay from './AIMessageDisplay';
import StreamingMessageDisplay from './StreamingMessageDisplay';
import { streamLearningCompanion } from '../../utils/streamingAPI';

const LearningCompanion = ({ studentId }) => {
    const dispatch = useDispatch();
    const { loading, companionState, conversations, mood, achievements, error } = useSelector(state => state.ai.learningCompanion);

    const [chatOpen, setChatOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // 流式响应状态
    const [streamingContent, setStreamingContent] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingError, setStreamingError] = useState(null);
    const [cancelStreaming, setCancelStreaming] = useState(null);

    useEffect(() => {
        if (studentId) {
            dispatch(getCompanionStatus(studentId));
        }
    }, [dispatch, studentId]);

    useEffect(() => {
        scrollToBottom();
    }, [conversations]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSendMessage = async () => {
        if (!message.trim() || chatLoading || isStreaming) return;

        const messageText = message.trim();
        const userMessage = {
            type: 'user',
            content: messageText,
            timestamp: new Date()
        };

        dispatch(addCompanionMessage(userMessage));

        // 重置流式状态
        setStreamingContent('');
        setStreamingError(null);
        setIsStreaming(true);

        // 启动流式AI响应
        const cancel = streamLearningCompanion(
            studentId,
            messageText,
            // onContent - 内容更新回调
            (newContent, fullContent) => {
                setStreamingContent(fullContent);
            },
            // onComplete - 完成回调
            (finalContent, metadata) => {
                setIsStreaming(false);

                // 添加AI回复到消息列表
                const companionMessage = {
                    type: 'companion',
                    content: finalContent,
                    mood: metadata.companionMood || 'friendly',
                    timestamp: new Date(),
                    conversationId: metadata.conversationId
                };
                dispatch(addCompanionMessage(companionMessage));
                dispatch(updateCompanionMood(metadata.companionMood || 'friendly'));

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
        setMessage('');
    };

    const getMoodEmoji = (moodType) => {
        const moodMap = {
            happy: '😊',
            excited: '🤩',
            encouraging: '💪',
            supportive: '🤗',
            proud: '🥳',
            neutral: '😐',
            concerned: '😟',
            motivating: '🔥'
        };
        return moodMap[moodType] || '😊';
    };

    const getMoodColor = (moodType) => {
        const colorMap = {
            happy: 'success',
            excited: 'warning',
            encouraging: 'primary',
            supportive: 'info',
            proud: 'secondary',
            neutral: 'default',
            concerned: 'error',
            motivating: 'warning'
        };
        return colorMap[moodType] || 'primary';
    };

    const renderCompanionCard = () => {
        return (
            <Card elevation={3} sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar 
                            sx={{ 
                                width: 60, 
                                height: 60, 
                                bgcolor: getMoodColor(mood) + '.main',
                                fontSize: '2rem'
                            }}
                        >
                            {getMoodEmoji(mood)}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h6">
                                你的AI学习伙伴
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                我是小智，你的专属学习伙伴！
                            </Typography>
                            <Chip 
                                label={`心情：${mood}`} 
                                size="small" 
                                color={getMoodColor(mood)}
                                sx={{ mt: 1 }}
                            />
                        </Box>
                        <Button
                            variant="contained"
                            startIcon={<ChatIcon />}
                            onClick={() => setChatOpen(true)}
                        >
                            聊天
                        </Button>
                    </Box>

                    {companionState && (
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h6" color="primary">
                                        {companionState.studyDays || 0}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        陪伴学习天数
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h6" color="success.main">
                                        {companionState.encouragements || 0}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        给予鼓励次数
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h6" color="warning.main">
                                        {companionState.achievements || 0}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        见证成就数
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    )}
                </CardContent>
            </Card>
        );
    };

    const renderAchievements = () => {
        const mockAchievements = [
            { id: 1, title: '连续学习7天', icon: '🔥', date: '2024-01-15', type: 'streak' },
            { id: 2, title: '完成第一个练习', icon: '🎯', date: '2024-01-10', type: 'milestone' },
            { id: 3, title: '获得满分', icon: '⭐', date: '2024-01-08', type: 'performance' },
            { id: 4, title: '提问达人', icon: '❓', date: '2024-01-05', type: 'engagement' }
        ];

        return (
            <Card elevation={2}>
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrophyIcon color="warning" />
                        最近成就
                    </Typography>
                    
                    <List>
                        {mockAchievements.map((achievement) => (
                            <ListItem key={achievement.id} sx={{ px: 0 }}>
                                <ListItemIcon>
                                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'warning.light' }}>
                                        {achievement.icon}
                                    </Avatar>
                                </ListItemIcon>
                                <ListItemText
                                    primary={achievement.title}
                                    secondary={new Date(achievement.date).toLocaleDateString()}
                                />
                                <Chip 
                                    label={achievement.type} 
                                    size="small" 
                                    variant="outlined"
                                />
                            </ListItem>
                        ))}
                    </List>
                </CardContent>
            </Card>
        );
    };

    const renderLearningStats = () => {
        const stats = [
            { label: '本周学习时长', value: '12.5小时', icon: <SchoolIcon />, color: 'primary' },
            { label: '学习进度', value: '75%', icon: <TrendingUpIcon />, color: 'success' },
            { label: '答题正确率', value: '88%', icon: <StarIcon />, color: 'warning' },
            { label: '学习专注度', value: '优秀', icon: <BrainIcon />, color: 'info' }
        ];

        return (
            <Card elevation={2} sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        学习统计
                    </Typography>
                    
                    <Grid container spacing={2}>
                        {stats.map((stat, index) => (
                            <Grid item xs={6} md={3} key={index}>
                                <Box sx={{ textAlign: 'center', p: 1 }}>
                                    <Avatar sx={{ bgcolor: stat.color + '.light', mx: 'auto', mb: 1 }}>
                                        {stat.icon}
                                    </Avatar>
                                    <Typography variant="h6" color={stat.color + '.main'}>
                                        {stat.value}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {stat.label}
                                    </Typography>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </CardContent>
            </Card>
        );
    };

    const renderChatDialog = () => {
        return (
            <Dialog 
                open={chatOpen} 
                onClose={() => setChatOpen(false)} 
                maxWidth="sm" 
                fullWidth
                PaperProps={{
                    sx: { height: '80vh', display: 'flex', flexDirection: 'column' }
                }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ bgcolor: getMoodColor(mood) + '.main' }}>
                            {getMoodEmoji(mood)}
                        </Avatar>
                        <Typography variant="h6">小智</Typography>
                    </Box>
                    <Button onClick={() => setChatOpen(false)}>
                        <CloseIcon />
                    </Button>
                </DialogTitle>
                
                <DialogContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 0 }}>
                    {/* 消息列表 */}
                    <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                        {conversations.length === 0 && (
                            <Box sx={{ textAlign: 'center', mt: 4 }}>
                                <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 2, width: 60, height: 60 }}>
                                    {getMoodEmoji(mood)}
                                </Avatar>
                                <Typography variant="h6" gutterBottom>
                                    你好！我是小智
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    我是你的AI学习伙伴，有什么学习问题都可以问我哦！
                                </Typography>
                            </Box>
                        )}
                        
                        {conversations.map((conv, index) => (
                            <Box
                                key={index}
                                sx={{
                                    display: 'flex',
                                    mb: 2,
                                    justifyContent: conv.type === 'user' ? 'flex-end' : 'flex-start'
                                }}
                            >
                                {conv.type === 'companion' && (
                                    <Avatar sx={{ bgcolor: getMoodColor(conv.mood || mood) + '.main', mr: 1 }}>
                                        {getMoodEmoji(conv.mood || mood)}
                                    </Avatar>
                                )}

                                {/* 根据消息类型选择渲染方式 */}
                                <Box sx={{ maxWidth: '70%' }}>
                                    {conv.type === 'companion' ? (
                                        <AIMessageDisplay
                                            content={conv.content}
                                            timestamp={conv.timestamp}
                                            mood={conv.mood}
                                            showThinkingByDefault={false}
                                            allowToggleThinking={true}
                                        />
                                    ) : (
                                        <Paper
                                            elevation={1}
                                            sx={{
                                                p: 2,
                                                bgcolor: 'primary.light',
                                                color: 'primary.contrastText'
                                            }}
                                        >
                                            <Typography variant="body2">
                                                {conv.content}
                                            </Typography>
                                            <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mt: 0.5 }}>
                                                {new Date(conv.timestamp).toLocaleTimeString()}
                                            </Typography>
                                        </Paper>
                                    )}
                                </Box>

                                {conv.type === 'user' && (
                                    <Avatar sx={{ bgcolor: 'primary.main', ml: 1 }}>
                                        <SchoolIcon />
                                    </Avatar>
                                )}
                            </Box>
                        ))}

                        {/* 流式消息显示 */}
                        {(isStreaming || streamingContent) && (
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
                                <Avatar sx={{ bgcolor: getMoodColor(mood) + '.main' }}>
                                    {getMoodEmoji(mood)}
                                </Avatar>
                                <Box sx={{ maxWidth: '70%' }}>
                                    <StreamingMessageDisplay
                                        content={streamingContent}
                                        isStreaming={isStreaming}
                                        error={streamingError}
                                        mood={mood}
                                        timestamp={new Date()}
                                        showCursor={true}
                                    />
                                </Box>
                            </Box>
                        )}

                        {chatLoading && !isStreaming && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar sx={{ bgcolor: getMoodColor(mood) + '.main' }}>
                                    {getMoodEmoji(mood)}
                                </Avatar>
                                <Paper elevation={1} sx={{ p: 2, bgcolor: 'grey.100' }}>
                                    <Typography variant="body2">小智正在思考...</Typography>
                                </Paper>
                            </Box>
                        )}
                        
                        <div ref={messagesEndRef} />
                    </Box>
                    
                    {/* 输入框 */}
                    <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                placeholder="和小智聊聊吧..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                disabled={chatLoading}
                                size="small"
                            />
                            <Button
                                variant="contained"
                                onClick={handleSendMessage}
                                disabled={!message.trim() || chatLoading}
                                sx={{ minWidth: 'auto', px: 2 }}
                            >
                                <SendIcon />
                            </Button>
                        </Box>
                    </Box>
                </DialogContent>
            </Dialog>
        );
    };

    return (
        <Box>
            {renderCompanionCard()}
            {renderLearningStats()}
            {renderAchievements()}
            {renderChatDialog()}
            
            {/* 浮动聊天按钮 */}
            <Fab
                color="primary"
                sx={{ position: 'fixed', bottom: 16, right: 16 }}
                onClick={() => setChatOpen(true)}
            >
                <Badge badgeContent={conversations.length} color="error">
                    <ChatIcon />
                </Badge>
            </Fab>
        </Box>
    );
};

export default LearningCompanion;
