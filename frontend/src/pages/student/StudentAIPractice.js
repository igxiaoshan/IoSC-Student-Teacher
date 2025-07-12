import React from 'react';
import {
    Container,
    Typography,
    Box
} from '@mui/material';
import PracticeAssistant from '../../components/AiComponents/PracticeAssistant';

const StudentAIPractice = () => {
    return (
        <Container maxWidth="xl">
            <Box sx={{ py: 2 }}>
                <Typography variant="h4" gutterBottom>
                    AI练习助手
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                    通过AI生成的个性化练习题来巩固你的学习成果。
                </Typography>
                <PracticeAssistant />
            </Box>
        </Container>
    );
};

export default StudentAIPractice;
