import React from 'react';
import { Paper, Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import { EmojiEvents as TrophyIcon } from '@mui/icons-material';
import { useTranslation } from '../../../hooks/useTranslation';
import { safeGet } from '../../../utils/safeAccess';

/**
 * 教师端首页欢迎横幅组件
 */
const WelcomeBanner = ({ currentUser }) => {
    const { tTeacher } = useTranslation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <Paper
            sx={{
                p: { xs: 2, sm: 3 },
                mb: 3,
                background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
                color: 'white',
                borderRadius: 2
            }}
        >
            <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                flexDirection={{ xs: 'column', sm: 'row' }}
                gap={2}
            >
                <Box>
                    <Typography variant="h5" gutterBottom>
                        {tTeacher('welcomeBack') || '欢迎回来'}, {safeGet(currentUser, 'name', tTeacher('teacher') || '老师')}!
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {tTeacher('teachingSubject') || '任教科目'}: {safeGet(currentUser, 'teachSubject.subName', tTeacher('unassigned') || '未分配')} · {safeGet(currentUser, 'teachSclass.sclassName', tTeacher('unassignedClass') || '未分配班级')}
                    </Typography>
                </Box>
                {!isMobile && (
                    <TrophyIcon sx={{ fontSize: 60, opacity: 0.8 }} />
                )}
            </Box>
        </Paper>
    );
};

export default WelcomeBanner;