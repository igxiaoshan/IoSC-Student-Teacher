import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    List,
    ListItem,
    ListItemText,
    Divider,
    CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';

const ChatContainer = styled(Paper)(({ theme }) => ({
    height: '500px',
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing(2),
}));

const MessageList = styled(List)(({ theme }) => ({
    flexGrow: 1,
    overflow: 'auto',
    marginBottom: theme.spacing(2),
}));

const StudyAssistant = () => {
    const [messages, setMessages] = useState([
        {
            id: 1,
            text: "你好！我是你的学习助手。我可以帮助你解答学习问题、制定学习计划、解释概念等。有什么我可以帮助你的吗？",
            sender: 'assistant',
            timestamp: new Date()
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSendMessage = async () => {
        if (!inputMessage.trim()) return;

        const userMessage = {
            id: messages.length + 1,
            text: inputMessage,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);

        try {
            // 模拟AI响应
            setTimeout(() => {
                const assistantMessage = {
                    id: messages.length + 2,
                    text: `我理解你的问题："${inputMessage}"。让我来帮助你解答这个问题。这是一个很好的学习问题，我建议你可以从以下几个方面来思考...`,
                    sender: 'assistant',
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, assistantMessage]);
                setIsLoading(false);
            }, 1000);
        } catch (error) {
            console.error('Error sending message:', error);
            setIsLoading(false);
        }
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <Box sx={{ maxWidth: 800, margin: '0 auto', padding: 2 }}>
            <Typography variant="h4" gutterBottom>
                学习助手
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
                与AI学习助手对话，获得个性化的学习指导和答疑解惑。
            </Typography>

            <ChatContainer elevation={3}>
                <MessageList>
                    {messages.map((message) => (
                        <React.Fragment key={message.id}>
                            <ListItem
                                sx={{
                                    flexDirection: 'column',
                                    alignItems: message.sender === 'user' ? 'flex-end' : 'flex-start',
                                }}
                            >
                                <Box
                                    sx={{
                                        maxWidth: '70%',
                                        padding: 1.5,
                                        borderRadius: 2,
                                        backgroundColor: message.sender === 'user' ? 'primary.main' : 'grey.100',
                                        color: message.sender === 'user' ? 'white' : 'text.primary',
                                    }}
                                >
                                    <ListItemText
                                        primary={message.text}
                                        secondary={message.timestamp.toLocaleTimeString()}
                                        secondaryTypographyProps={{
                                            color: message.sender === 'user' ? 'rgba(255,255,255,0.7)' : 'text.secondary'
                                        }}
                                    />
                                </Box>
                            </ListItem>
                            <Divider />
                        </React.Fragment>
                    ))}
                    {isLoading && (
                        <ListItem>
                            <CircularProgress size={20} />
                            <Typography variant="body2" sx={{ ml: 1 }}>
                                AI正在思考中...
                            </Typography>
                        </ListItem>
                    )}
                </MessageList>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                        fullWidth
                        multiline
                        maxRows={3}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="输入你的学习问题..."
                        disabled={isLoading}
                    />
                    <Button
                        variant="contained"
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim() || isLoading}
                        sx={{ minWidth: 80 }}
                    >
                        发送
                    </Button>
                </Box>
            </ChatContainer>
        </Box>
    );
};

export default StudyAssistant;
