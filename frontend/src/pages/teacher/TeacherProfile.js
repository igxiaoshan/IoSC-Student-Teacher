import React from 'react'
import styled from 'styled-components';
import { Card, CardContent, Typography, Grid, Box, Avatar, Container, Divider } from '@mui/material';
import { useSelector } from 'react-redux';
import { getSafeClassName, getSafeSubjectName, safeGet } from '../../utils/safeAccess';
import { useTranslation } from '../../hooks/useTranslation';

const TeacherProfile = () => {
  const { currentUser, response, error } = useSelector((state) => state.user);
  const { tTeacher, tStudent, tCommon } = useTranslation();

  if (response) { console.log(response) }
  else if (error) { console.log(error) }

  const teachSclass = getSafeClassName(currentUser?.teachSclass) || tTeacher('unassignedClass');
  const teachSubject = getSafeSubjectName(currentUser?.teachSubject) || tTeacher('unassignedSubject');
  const teachSchool = safeGet(currentUser, 'school.schoolName', tTeacher('unknownSchool'));

  return (
    <Container maxWidth="md">
      <StyledPaper elevation={3}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box display="flex" justifyContent="center">
              <Avatar sx={{ width: 100, height: 100, bgcolor: '#7f56da', fontSize: '2.5rem' }}>
                {String(safeGet(currentUser, 'name') || 'T').charAt(0)}
              </Avatar>
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Box display="flex" justifyContent="center">
              <Typography variant="h5" component="h2" textAlign="center" fontWeight={600}>
                {safeGet(currentUser, 'name') || tCommon('none')}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Box display="flex" justifyContent="center">
              <Typography variant="subtitle1" component="p" textAlign="center" color="text.secondary">
                {tTeacher('teacherInfo')}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </StyledPaper>
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
  )
}

export default TeacherProfile

const StyledPaper = styled(Card)`
  margin: 20px 0;
  padding: 24px;
  border-radius: 16px;
`;