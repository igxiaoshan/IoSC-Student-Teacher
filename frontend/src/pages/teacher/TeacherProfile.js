import React from 'react';
import {
    Card, CardContent, Typography, Grid, Box, Avatar, Container, Divider
} from '@mui/material';
import { useSelector } from 'react-redux';
import { getSafeClassName, getSafeSubjectName, safeGet } from '../../utils/safeAccess';
import { useTranslation } from '../../hooks/useTranslation';

/**
 * 教师端个人资料页面
 */
const TeacherProfile = () => {
    const { currentUser, error } = useSelector((state) => state.user);
    const { tTeacher, tStudent, tCommon } = useTranslation();

    if (error) {
        console.error('Teacher profile error:', error);
    }

    const teachSclass = getSafeClassName(currentUser?.teachSclass) || tTeacher('unassignedClass');
    const teachSubject = getSafeSubjectName(currentUser?.teachSubject) || tTeacher('unassignedSubject');
    const teachSchool = safeGet(currentUser, 'school.schoolName', tTeacher('unknownSchool'));

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            {/* 头像卡片 */}
            <Card
                sx={{
                    marginBottom: 2,
                    padding: { xs: 2, sm: 3 },
                    borderRadius: 4,
                    textAlign: 'center'
                }}
            >
                <Box display="flex" justifyContent="center" mb={2}>
                    <Avatar
                        sx={{
                            width: { xs: 80, sm: 100 },
                            height: { xs: 80, sm: 100 },
                            bgcolor: '#7f56da',
                            fontSize: { xs: '2rem', sm: '2.5rem' }
                        }}
                    >
                        {String(safeGet(currentUser, 'name') || 'T').charAt(0)}
                    </Avatar>
                </Box>
                <Typography
                    variant="h5"
                    component="h2"
                    textAlign="center"
                    fontWeight={600}
                    sx={{ mb: 1 }}
                >
                    {safeGet(currentUser, 'name') || tCommon('none')}
                </Typography>
                <Typography
                    variant="subtitle1"
                    component="p"
                    textAlign="center"
                    color="text.secondary"
                >
                    {tTeacher('teacherInfo')}
                </Typography>
            </Card>

            {/* 信息卡片 */}
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        {tTeacher('teacherInfo')}
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="body1">
                                <strong>{tTeacher('teacherId')}:</strong> {safeGet(currentUser, 'teacherId') || tCommon('none')}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="body1">
                                <strong>{tCommon('email')}:</strong> {safeGet(currentUser, 'email') || tCommon('none')}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="body1">
                                <strong>{tTeacher('myClasses')}:</strong> {teachSclass}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="body1">
                                <strong>{tTeacher('mySubjects')}:</strong> {teachSubject}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="body1">
                                <strong>{tTeacher('phone')}:</strong> {safeGet(currentUser, 'phone') || tCommon('none')}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="body1">
                                <strong>{tTeacher('qualification')}:</strong> {safeGet(currentUser, 'qualification') || tCommon('none')}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="body1">
                                <strong>{tTeacher('position')}:</strong> {safeGet(currentUser, 'position') || tCommon('none')}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="body1">
                                <strong>{tStudent('school')}:</strong> {teachSchool}
                            </Typography>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        </Container>
    );
};

export default TeacherProfile;