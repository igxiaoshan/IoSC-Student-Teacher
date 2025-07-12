import React from 'react';
import {
    Container,
    Typography,
    Box
} from '@mui/material';
import LearningCompanion from '../../components/AiComponents/LearningCompanion';

const StudentAICompanion = () => {
    return (
        <Container maxWidth="xl">
            <Box sx={{ py: 2 }}>
                <Typography variant="h4" gutterBottom>
                    AI学习伙伴
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                    你的专属AI学习伙伴，提供个性化的学习建议和动机激励。
                </Typography>
                <LearningCompanion />
            </Box>
        </Container>
    );
};

export default StudentAICompanion;
