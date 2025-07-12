import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Grid, Box } from '@mui/material';
import styled from 'styled-components';
import Students from '../assets/student.jpg';
import { IndigoButton, WhiteWithIndigoBorderButton } from '../components/buttonStyles';

const Homepage = () => {
  return (
    <FullHeightContainer>
      <ResponsiveGrid container>
        <Grid item xs={12} md={6} className="image-section" />
        <Grid item xs={12} md={6}>
          <ContentBox>
            <StyledTitle>
              Welcome to <br />
              <PurpleText>School Management</PurpleText> <br />
              System
            </StyledTitle>
            <StyledText>
                Streamline your school's processes with one integrated platform. Seamlessly admit students and staff, track attendance, keep tabs on academic performance, and automate communication—all in one location.
            </StyledText>
            <StyledLink to="/choose">
              <IndigoButton variant="contained" fullWidth>
                Login
              </IndigoButton>
            </StyledLink>
            <StyledLink to="/Adminregister">
              <WhiteWithIndigoBorderButton variant="outlined" fullWidth>
                Sign Up
              </WhiteWithIndigoBorderButton>
            </StyledLink>
          </ContentBox>
        </Grid>
      </ResponsiveGrid>
    </FullHeightContainer>
  );
};

export default Homepage;

// ---------------------- Styled Components ----------------------

const FullHeightContainer = styled(Container)`
  height: 100vh;
  padding: 0;
  max-width: 100% !important;
`;

const ResponsiveGrid = styled(Grid)`
  height: 100vh;

  .image-section {
    background-image: url(${Students});
    background-size: cover;
    background-position: center;
    height: 100vh;
  }

  @media (max-width: 900px) {
    flex-direction: column-reverse;

    .image-section {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: -1;
      opacity: 0.4;
    }
  }
`;

const ContentBox = styled(Box)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100vh;
  padding: 0 100px;
  background-color: #fff;

  @media (max-width: 900px) {
    background-color: rgba(255, 255, 255, 0.49);
    padding: 40px 20px;
    text-align: center;
  }
`;

const StyledTitle = styled.h1`
  font-size: 3rem;
  font-weight: 800;
  color: #333;
  line-height: 1.2;
  margin-bottom: 24px;

  @media (max-width: 900px) {
    font-size: 2.2rem;
  }
`;

const PurpleText = styled.span`
  color:rgb(56, 48, 222);
`;

const StyledText = styled.p`
  font-size: 1.1rem;
  color: #555;
  margin-bottom: 40px;
  line-height: 1.6;
`;

const StyledLink = styled(Link)`
  text-decoration: none;
  margin-bottom: 30px;
  width: 80%;
  align-self: center;

  @media (max-width: 900px) {
    width: 100%;
  }
`;
