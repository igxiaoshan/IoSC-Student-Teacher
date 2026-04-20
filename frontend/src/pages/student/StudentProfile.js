import React from 'react'
import styled from 'styled-components';
import { Card, CardContent, Typography, Grid, Box, Avatar, Container, Paper } from '@mui/material';
import { useSelector } from 'react-redux';
import { useTranslation } from '../../hooks/useTranslation';
import { safeGet } from '../../utils/safeAccess';

const StudentProfile = () => {
  const { currentUser, response, error } = useSelector((state) => state.user);
  const { tStudent, tClass, tCommon } = useTranslation();

  if (response) { console.log(response) }
  else if (error) { console.log(error) }

  const sclassName = safeGet(currentUser, 'sclassName.sclassName') || tClass('unassignedClass')
  const studentSchool = safeGet(currentUser, 'school.schoolName') || tStudent('unknownSchool')

  // 安全获取用户信息，使用翻译作为默认值
  const genderText = safeGet(currentUser, 'gender') ?
    (currentUser.gender === 'Male' ? tStudent('male') : currentUser.gender === 'Female' ? tStudent('female') : currentUser.gender)
    : tCommon('none');
  const birthDateText = safeGet(currentUser, 'birthDate') || tCommon('none');
  const emailText = safeGet(currentUser, 'email') || tCommon('none');
  const phoneText = safeGet(currentUser, 'phone') || tCommon('none');
  const addressText = safeGet(currentUser, 'address') || tCommon('none');
  const emergencyContactText = safeGet(currentUser, 'emergencyContact') || tCommon('none');

  return (
    <>
      <Container maxWidth="md">
        <StyledPaper elevation={3}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Box display="flex" justifyContent="center">
                <Avatar alt="Student Avatar" sx={{ width: 150, height: 150 }}>
                  {String(safeGet(currentUser, 'name') || 'S').charAt(0)}
                </Avatar>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box display="flex" justifyContent="center">
                <Typography variant="h5" component="h2" textAlign="center">
                  {safeGet(currentUser, 'name') || tCommon('none')}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box display="flex" justifyContent="center">
                <Typography variant="subtitle1" component="p" textAlign="center">
                  {tStudent('studentId')}: {safeGet(currentUser, 'rollNum') || tCommon('none')}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box display="flex" justifyContent="center">
                <Typography variant="subtitle1" component="p" textAlign="center">
                  {tStudent('className')}: {sclassName}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box display="flex" justifyContent="center">
                <Typography variant="subtitle1" component="p" textAlign="center">
                  {tStudent('school')}: {studentSchool}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </StyledPaper>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {tStudent('personalInfo')}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" component="p">
                  <strong>{tStudent('birthDate')}:</strong> {birthDateText}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" component="p">
                  <strong>{tStudent('gender')}:</strong> {genderText}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" component="p">
                  <strong>{tStudent('Email')}:</strong> {emailText}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" component="p">
                  <strong>{tStudent('Phone')}:</strong> {phoneText}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" component="p">
                  <strong>{tStudent('Address')}:</strong> {addressText}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" component="p">
                  <strong>{tStudent('Emergency Contact')}:</strong> {emergencyContactText}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Container>
    </>
  )
}

export default StudentProfile

const StyledPaper = styled(Paper)`
  padding: 20px;
  margin-bottom: 20px;
`;