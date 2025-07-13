import React from 'react'
import styled from 'styled-components';
import { Card, CardContent, Typography } from '@mui/material';
import { useSelector } from 'react-redux';
import { getSafeClassName, getSafeSubjectName, safeGet } from '../../utils/safeAccess';

const TeacherProfile = () => {
  const { currentUser, response, error } = useSelector((state) => state.user);

  if (response) { console.log(response) }
  else if (error) { console.log(error) }

  const teachSclass = getSafeClassName(currentUser?.teachSclass) || '未分配班级';
  const teachSubject = getSafeSubjectName(currentUser?.teachSubject) || '未分配科目';
  const teachSchool = safeGet(currentUser, 'school.schoolName', '未知学校');

  return (
    <>
      <ProfileCard>
        <ProfileCardContent>
          <ProfileText>姓名: {currentUser?.name || '未知'}</ProfileText>
          <ProfileText>邮箱: {currentUser?.email || '未知'}</ProfileText>
          <ProfileText>班级: {teachSclass}</ProfileText>
          <ProfileText>课程: {teachSubject}</ProfileText>
          <ProfileText>学校: {teachSchool}</ProfileText>
        </ProfileCardContent>
      </ProfileCard>
    </>
  )
}

export default TeacherProfile

const ProfileCard = styled(Card)`
  margin: 20px;
  width: 400px;
  border-radius: 10px;
`;

const ProfileCardContent = styled(CardContent)`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ProfileText = styled(Typography)`
  margin: 10px;
`;