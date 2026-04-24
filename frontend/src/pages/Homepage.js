import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Grid, Box, Typography, Button } from '@mui/material';
import styled from 'styled-components';
import Students from '../assets/student.jpg';
import { useTranslation } from '../hooks/useTranslation';

const Homepage = () => {
  const { t, tCommon } = useTranslation();

  return (
    <FullHeightContainer>
      <ResponsiveGrid container>
        <Grid item xs={12} md={6} className="image-section" />
        <Grid item xs={12} md={6}>
          <ContentBox>
            <StyledTitle>
              {t("hero.welcome")} <br />
              <PurpleText>{t("hero.schoolManagement")}</PurpleText> <br />
              {t("hero.system")}
            </StyledTitle>
            <StyledText>
              {t("hero.description")}
            </StyledText>
            <StyledLink to="/choose">
              <IndigoButton variant="contained" fullWidth>
                {tCommon("login")}
              </IndigoButton>
            </StyledLink>
            <StyledLink to="/Adminregister">
              <WhiteButton variant="outlined" fullWidth>
                {tCommon("register")}
              </WhiteButton>
            </StyledLink>
          </ContentBox>
        </Grid>
      </ResponsiveGrid>
    </FullHeightContainer>
  );
};

export default Homepage;

const FullHeightContainer = styled(Container)`
  height: 100vh;
  padding: 0;
  max-width: 100% !important;
`;

const ResponsiveGrid = styled(Grid)`
  height: 100vh;

  .image-section {
    background-image: linear-gradient(135deg, rgba(25, 118, 210, 0.85) 0%, rgba(106, 76, 147, 0.85) 100%), url(${Students});
    background-size: cover;
    background-position: center;
    height: 100vh;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 200px;
      background: linear-gradient(to top, rgba(0,0,0,0.3), transparent);
    }
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
    background-color: rgba(255, 255, 255, 0.85);
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
  color: #1976d2;
`;

const StyledText = styled.p`
  font-size: 1.1rem;
  color: #555;
  margin-bottom: 40px;
  line-height: 1.6;
`;

const StyledLink = styled(Link)`
  text-decoration: none;
  margin-bottom: 20px;
  width: 80%;
  align-self: center;

  @media (max-width: 900px) {
    width: 100%;
  }
`;

const IndigoButton = styled(Button)`
  && {
    background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
    color: white;
    padding: 14px 32px;
    font-size: 1rem;
    font-weight: 600;
    box-shadow: 0 4px 16px rgba(25, 118, 210, 0.4);
    transition: all 0.3s ease;

    &:hover {
      background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%);
      box-shadow: 0 6px 24px rgba(25, 118, 210, 0.5);
      transform: translateY(-2px);
    }
  }
`;

const WhiteButton = styled(Button)`
  && {
    background-color: transparent;
    color: #1976d2;
    border: 2px solid #1976d2;
    padding: 14px 32px;
    font-size: 1rem;
    font-weight: 600;
    transition: all 0.3s ease;

    &:hover {
      background-color: rgba(25, 118, 210, 0.08);
      border-color: #1565c0;
      color: #1565c0;
      transform: translateY(-2px);
    }
  }
`;
