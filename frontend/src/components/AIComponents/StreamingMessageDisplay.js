import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    LinearProgress,
    Fade,
    Chip
} from '@mui/material';
import {
    AutoFixHigh as StreamingIcon
} from '@mui/icons-material';
import AIMessageDisplay from './AIMessageDisplay';

/**
 * 流式消息展示组件
 * 支持实时显示AI回复的流式内容
 */
const StreamingMessageDisplay = ({ 
    content, 
    isStreaming, 
    error,
    confidence,
    mood,
    timestamp,
    showCursor = true,
    typingSpeed = 30
}) => {
    const [displayContent, setDisplayContent] = useState('');
    const [showTypingCursor, setShowTypingCursor] = useState(false);

    // 打字机效果
    useEffect(() => {
        if (!content) {
            setDisplayContent('');
            return;
        }

        if (isStreaming) {
            // 流式模式：直接显示内容
            setDisplayContent(content);
        } else {
            // 非流式模式：打字机效果
            let currentIndex = 0;
            setDisplayContent('');
            
            const timer = setInterval(() => {
                if (currentIndex < content.length) {
                    setDisplayContent(content.substring(0, currentIndex + 1));
                    currentIndex++;
                } else {
                    clearInterval(timer);
                }
            }, typingSpeed);

            return () => clearInterval(timer);
        }
    }, [content, isStreaming, typingSpeed]);

    // 光标闪烁效果
    useEffect(() => {
        if (!showCursor || !isStreaming) {
            setShowTypingCursor(false);
            return;
        }

        const cursorTimer = setInterval(() => {
            setShowTypingCursor(prev => !prev);
        }, 500);

        return () => clearInterval(cursorTimer);
    }, [showCursor, isStreaming]);

    if (error) {
        return (
            <Paper 
                elevation={1} 
                sx={{ 
                    p: 2, 
                    bgcolor: 'error.light',
                    color: 'error.contrastText'
                }}
            >
                <Typography variant="body2">
                    ❌ {error.message || '流式响应出错'}
                </Typography>
            </Paper>
        );
    }

    if (!content && !isStreaming) {
        return null;
    }

    return (
        <Box>
            {/* 流式状态指示器 */}
            {isStreaming && (
                <Fade in={isStreaming}>
                    <Box sx={{ mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <StreamingIcon 
                                sx={{ 
                                    fontSize: 16, 
                                    color: 'primary.main',
                                    animation: 'pulse 1.5s ease-in-out infinite'
                                }} 
                            />
                            <Typography variant="caption" color="primary">
                                AI正在回复中...
                            </Typography>
                        </Box>
                        <LinearProgress 
                            sx={{ 
                                height: 2, 
                                borderRadius: 1,
                                '& .MuiLinearProgress-bar': {
                                    animation: 'wave 1.5s ease-in-out infinite'
                                }
                            }} 
                        />
                    </Box>
                </Fade>
            )}

            {/* 消息内容 */}
            {displayContent && (
                <Box>
                    {isStreaming ? (
                        // 流式模式：简单显示
                        <Paper 
                            elevation={1} 
                            sx={{ 
                                p: 2, 
                                bgcolor: 'grey.100',
                                color: 'text.primary',
                                position: 'relative'
                            }}
                        >
                            <Typography 
                                variant="body2" 
                                sx={{ 
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word'
                                }}
                            >
                                {displayContent}
                                {showTypingCursor && (
                                    <Box 
                                        component="span" 
                                        sx={{ 
                                            display: 'inline-block',
                                            width: '2px',
                                            height: '1.2em',
                                            bgcolor: 'primary.main',
                                            ml: 0.5,
                                            animation: 'blink 1s step-end infinite'
                                        }} 
                                    />
                                )}
                            </Typography>

                            {/* 流式状态标签 */}
                            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Chip 
                                    label="实时回复中" 
                                    size="small" 
                                    color="primary" 
                                    variant="outlined"
                                    icon={<StreamingIcon />}
                                    sx={{ fontSize: '0.7rem', height: 20 }}
                                />
                                
                                {timestamp && (
                                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                                        {new Date(timestamp).toLocaleTimeString()}
                                    </Typography>
                                )}
                            </Box>
                        </Paper>
                    ) : (
                        // 完成模式：使用完整的AI消息展示组件
                        <AIMessageDisplay
                            content={displayContent}
                            timestamp={timestamp}
                            confidence={confidence}
                            mood={mood}
                            showThinkingByDefault={false}
                            allowToggleThinking={true}
                        />
                    )}
                </Box>
            )}

            {/* CSS动画 */}
            <style jsx>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                
                @keyframes wave {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                
                @keyframes blink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0; }
                }
            `}</style>
        </Box>
    );
};

export default StreamingMessageDisplay;
