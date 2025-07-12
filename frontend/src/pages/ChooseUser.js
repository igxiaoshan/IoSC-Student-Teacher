import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Paper,
  Box,
  Container,
  CircularProgress,
  Backdrop,
} from '@mui/material';
import { AccountCircle, School, Group } from '@mui/icons-material';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../redux/userRelated/userHandle';
import Popup from '../components/Popup';

const ChooseUser = ({ visitor }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const password = 'zxc';

  const { status, currentUser, currentRole } = useSelector((state) => state.user);

  const [loader, setLoader] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [message, setMessage] = useState('');

  const navigateHandler = (user) => {
    if (user === 'Admin') {
      if (visitor === 'guest') {
        const email = 'yogendra@12';
        const fields = { email, password };
        setLoader(true);
        dispatch(loginUser(fields, user));
      } else {
        navigate('/Adminlogin');
      }
    } else if (user === 'Student') {
      if (visitor === 'guest') {
        const rollNum = '1';
        const studentName = 'Dipesh Awasthi';
        const fields = { rollNum, studentName, password };
        setLoader(true);
        dispatch(loginUser(fields, user));
      } else {
        navigate('/Studentlogin');
      }
    } else if (user === 'Teacher') {
      if (visitor === 'guest') {
        const email = 'tony@12';
        const fields = { email, password };
        setLoader(true);
        dispatch(loginUser(fields, user));
      } else {
        navigate('/Teacherlogin');
      }
    }
  };

  useEffect(() => {
    if (status === 'success' || currentUser !== null) {
      if (currentRole === 'Admin') {
        navigate('/Admin/dashboard');
      } else if (currentRole === 'Student') {
        navigate('/Student/dashboard');
      } else if (currentRole === 'Teacher') {
        navigate('/Teacher/dashboard');
      }
    } else if (status === 'error') {
      setLoader(false);
      setMessage('Network Error');
      setShowPopup(true);
    }
  }, [status, currentRole, navigate, currentUser]);

  return (
    <PageWrapper>
      <Container>
        <Grid container spacing={4} justifyContent="center">
          <Grid item xs={12} sm={6} md={4}>
            <UserCard onClick={() => navigateHandler('Admin')}>
              <IconCircle>
                <AccountCircle fontSize="large" />
              </IconCircle>
              <UserTitle>Admin</UserTitle>
              <UserDesc>
                Log in as an administrator to manage and oversee school operations.
              </UserDesc>
            </UserCard>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <UserCard onClick={() => navigateHandler('Student')}>
              <IconCircle>
                <School fontSize="large" />
              </IconCircle>
              <UserTitle>Student</UserTitle>
              <UserDesc>
                Access learning materials, view attendance, and track your progress.
              </UserDesc>
            </UserCard>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <UserCard onClick={() => navigateHandler('Teacher')}>
              <IconCircle>
                <Group fontSize="large" />
              </IconCircle>
              <UserTitle>Teacher</UserTitle>
              <UserDesc>
                Manage your classes, assignments, and student performance.
              </UserDesc>
            </UserCard>
          </Grid>
        </Grid>
      </Container>

      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loader}>
        <CircularProgress color="inherit" />
        Please Wait
      </Backdrop>
      <Popup message={message} setShowPopup={setShowPopup} showPopup={showPopup} />
    </PageWrapper>
  );
};

export default ChooseUser;

// Styled Components
const PageWrapper = styled.div`
  background: linear-gradient(145deg, #eaeaff, #ffffff);
  min-height: 85vh;
  padding: 60px 20px;
  display: flex;
  align-items: center;
`;

const UserCard = styled(Paper)`
  && {
    padding: 30px;
    text-align: center;
    border-radius: 20px;
    transition: all 0.3s ease;
    cursor: pointer;
    background-color: white;
    box-shadow: 0px 6px 18px rgba(0, 0, 0, 0.1);
    &:hover {
      transform: translateY(-5px);
      box-shadow: 0px 10px 24px rgba(0, 0, 0, 0.15);
    }
  }
`;

const IconCircle = styled(Box)`
  background: linear-gradient(135deg,rgb(92, 66, 237),rgb(71, 30, 255));
  width: 60px;
  height: 60px;
  margin: 0 auto 16px auto;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const UserTitle = styled.h2`
  margin-bottom: 10px;
  color:rgb(27, 27, 170);
  font-weight: 700;
`;

const UserDesc = styled.p`
  font-size: 0.95rem;
  color: #555;
`;

