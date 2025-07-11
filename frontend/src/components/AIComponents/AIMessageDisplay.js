import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Collapse,
    Button,
    Chip,
    Divider,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Psychology as ThinkingIcon,
    Visibility as ShowIcon,
    VisibilityOff as HideIcon
} from '@mui/icons-material';
import { parseAIResponse, formatThinkingText } from '../../utils/aiResponseParser';

/**
 * AI消息展示组件
 * 支持显示/隐藏AI思考过程
 */
const AIMessageDisplay = ({ 
    content, 
    timestamp, 
    confidence, 
    mood,
    showThinkingByDefault = false,
    allowToggleThinking = true 
}) => {
    const [showThinking, setShowThinking] = useState(showThinkingByDefault);
    
    // 解析AI回复内容
    const parsedContent = parseAIResponse(content);
    const { hasThinking, thinking, answer } = parsedContent;

    const handleToggleThinking = () => {
        setShowThinking(!showThinking);
    };

    return (
        <Paper 
            elevation={1} 
            sx={{ 
                p: 2, 
                bgcolor: 'grey.100',
                color: 'text.primary',
                position: 'relative'
            }}
        >
            {/* AI回答内容 */}
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: hasThinking ? 2 : 1 }}>
                {answer}
            </Typography>

            {/* 思考过程展示 */}
            {hasThinking && allowToggleThinking && (
                <Box>
                    <Divider sx={{ my: 1 }} />
                    
                    {/* 思考过程控制按钮 */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Button
                            size="small"
                            startIcon={<ThinkingIcon />}
                            endIcon={showThinking ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            onClick={handleToggleThinking}
                            sx={{ 
                                fontSize: '0.75rem',
                                color: 'text.secondary',
                                '&:hover': {
                                    bgcolor: 'action.hover'
                                }
                            }}
                        >
                            AI思考过程
                        </Button>
                        
                        <Chip 
                            label={showThinking ? '已展开' : '已折叠'} 
                            size="small" 
                            variant="outlined"
                            color={showThinking ? 'primary' : 'default'}
                            sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                    </Box>

                    {/* 思考过程内容 */}
                    <Collapse in={showThinking}>
                        <Paper 
                            elevation={0} 
                            sx={{ 
                                p: 2, 
                                bgcolor: 'primary.light',
                                color: 'primary.contrastText',
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'primary.main'
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <ThinkingIcon sx={{ fontSize: 16 }} />
                                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                    AI思考过程
                                </Typography>
                            </Box>
                            
                            <Typography 
                                variant="body2" 
                                sx={{ 
                                    whiteSpace: 'pre-wrap',
                                    fontSize: '0.85rem',
                                    lineHeight: 1.4,
                                    fontStyle: 'italic',
                                    opacity: 0.9
                                }}
                            >
                                {formatThinkingText(thinking)}
                            </Typography>
                        </Paper>
                    </Collapse>
                </Box>
            )}

            {/* 消息元信息 */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    {new Date(timestamp).toLocaleTimeString()}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {confidence && (
                        <Chip 
                            label={`置信度: ${(confidence * 100).toFixed(0)}%`} 
                            size="small" 
                            variant="outlined"
                            color={confidence > 0.8 ? 'success' : confidence > 0.6 ? 'warning' : 'error'}
                            sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                    )}
                    
                    {mood && (
                        <Chip 
                            label={mood} 
                            size="small" 
                            variant="outlined"
                            color="secondary"
                            sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                    )}
                    
                    {hasThinking && (
                        <Tooltip title={showThinking ? '隐藏思考过程' : '显示思考过程'}>
                            <IconButton 
                                size="small" 
                                onClick={handleToggleThinking}
                                sx={{ p: 0.5 }}
                            >
                                {showThinking ? <HideIcon fontSize="small" /> : <ShowIcon fontSize="small" />}
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            </Box>
        </Paper>
    );
};

export default AIMessageDisplay;
