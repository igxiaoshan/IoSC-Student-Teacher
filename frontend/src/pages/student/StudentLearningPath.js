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
    Route as RouteIcon
} from '@mui/icons-material';

import LearningPath from '../../components/AIComponents/LearningPath';

const StudentLearningPath = () => {
    const { currentUser } = useSelector(state => state.user);

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 3 }}>
                {/* 页面标题 */}
                <Paper elevation={2} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                            <RouteIcon sx={{ fontSize: 32 }} />
                        </Avatar>
                        <Box>
                            <Typography variant="h4" gutterBottom>
                                AI学习路径
                            </Typography>
                            <Typography variant="h6" sx={{ opacity: 0.9 }}>
                                个性化学习规划，科学的学习路径指导
                            </Typography>
                        </Box>
                    </Box>
                </Paper>

                {/* AI学习路径组件 */}
                <LearningPath
                    studentId={currentUser?._id}
                    subject={currentUser?.sclassName?.subName}
                />
            </Box>
        </Container>
    );
};

export default StudentLearningPath;
