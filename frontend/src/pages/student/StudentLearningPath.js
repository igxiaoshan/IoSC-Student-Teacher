import React from 'react';
import {
    Container,
    Typography,
    Box
} from '@mui/material';
import LearningPath from '../../components/AiComponents/LearningPath';

const StudentLearningPath = () => {
    return (
        <Container maxWidth="xl">
            <Box sx={{ py: 2 }}>
                <Typography variant="h4" gutterBottom>
                    AI学习路径
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                    AI为你定制的个性化学习路径，帮助你系统性地掌握知识技能。
                </Typography>
                <LearningPath />
            </Box>
        </Container>
    );
};

export default StudentLearningPath;
