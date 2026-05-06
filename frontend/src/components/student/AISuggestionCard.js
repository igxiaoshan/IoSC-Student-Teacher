import React from 'react';
import { Card, CardContent, Box, Typography, List, ListItem, ListItemAvatar, ListItemText, Skeleton } from '@mui/material';
import { Lightbulb, Warning, EmojiEvents as Trophy } from '@mui/icons-material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useTranslation } from '../../hooks/useTranslation';

const AISuggestionCard = ({ suggestions, loading }) => {
    const { tStudent } = useTranslation();

    const defaultSuggestions = [
        { type: 'tip', content: tStudent('tipDailyReview') || '建议每天固定时间复习数学，效果更佳', icon: <Lightbulb color="warning" /> },
        { type: 'warning', content: tStudent('tipVocabulary') || '英语词汇掌握率较低，建议增加练习', icon: <Warning color="error" /> },
        { type: 'achievement', content: tStudent('tipStudyHours') || '本周学习时长超过80%的同学，继续保持！', icon: <Trophy color="success" /> }
    ];

    const items = suggestions || defaultSuggestions;

    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AutoAwesomeIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">{tStudent('aiSuggestions') || 'AI学习建议'}</Typography>
                </Box>
                {loading ? (
                    <Box>
                        {[1, 2, 3].map(i => <Skeleton key={i} height={40} sx={{ mb: 1 }} />)}
                    </Box>
                ) : (
                    <List dense>
                        {items.map((item, index) => (
                            <ListItem key={index} sx={{ px: 0 }}>
                                <ListItemAvatar sx={{ minWidth: 36 }}>{item.icon}</ListItemAvatar>
                                <ListItemText
                                    primary={item.content}
                                    primaryTypographyProps={{ variant: 'body2' }}
                                />
                            </ListItem>
                        ))}
                    </List>
                )}
            </CardContent>
        </Card>
    );
};

export default AISuggestionCard;
