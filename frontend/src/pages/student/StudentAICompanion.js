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
    EmojiEvents as CompanionIcon
} from '@mui/icons-material';

import LearningCompanion from '../../components/AIComponents/LearningCompanion';

const StudentAICompanion = () => {
    const { currentUser } = useSelector(state => state.user);

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 3 }}>
                {/* 页面标题 */}
                <Paper elevation={2} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                            <CompanionIcon sx={{ fontSize: 32 }} />
                        </Avatar>
                        <Box>
                            <Typography variant="h4" gutterBottom>
                                AI学习伙伴
                            </Typography>
                            <Typography variant="h6" sx={{ opacity: 0.9 }}>
                                你的专属学习伙伴，陪伴你的学习之旅
                            </Typography>
                        </Box>
                    </Box>
                </Paper>

                {/* AI学习伙伴组件 */}
                <LearningCompanion 
                    studentId={currentUser?._id}
                />
            </Box>
        </Container>
    );
};

export default StudentAICompanion;
