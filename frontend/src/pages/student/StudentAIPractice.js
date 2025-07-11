import React from 'react';
import { useSelector } from 'react-redux';
import {
    Box,
    Container,
    Typography,
    Paper,
    Avatar
} from '@mui/material';
import {
    SmartToy as SmartToyIcon
} from '@mui/icons-material';

import PracticeAssistant from '../../components/AIComponents/PracticeAssistant';

const StudentAIPractice = () => {
    const { currentUser } = useSelector(state => state.user);

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 3 }}>
                {/* 页面标题 */}
                <Paper elevation={2} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                            <SmartToyIcon sx={{ fontSize: 32 }} />
                        </Avatar>
                        <Box>
                            <Typography variant="h4" gutterBottom>
                                AI智能练习
                            </Typography>
                            <Typography variant="h6" sx={{ opacity: 0.9 }}>
                                个性化练习，智能反馈，让学习更高效
                            </Typography>
                        </Box>
                    </Box>
                </Paper>

                {/* AI练习组件 */}
                <PracticeAssistant 
                    studentId={currentUser?._id} 
                    subject={currentUser?.sclassName?.subName}
                />
            </Box>
        </Container>
    );
};

export default StudentAIPractice;
