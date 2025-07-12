import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { authLogout } from '../redux/userRelated/userSlice';
import styled from 'styled-components';

const Logout = () => {
    const currentUser = useSelector(state => state.user.currentUser);

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleLogout = () => {
        dispatch(authLogout());
        navigate('/');
    };

    const handleCancel = () => {
        navigate(-1);
    };

    return (
        <Wrapper>
            <LogoutCard>
                <UserName>{currentUser?.name || "User"}</UserName>
                <LogoutMessage>Are you sure you want to log out?</LogoutMessage>
                <ButtonGroup>
                    <LogoutButton className="logout" onClick={handleLogout}>
                        Log Out
                    </LogoutButton>
                    <LogoutButton className="cancel" onClick={handleCancel}>
                        Cancel
                    </LogoutButton>
                </ButtonGroup>
            </LogoutCard>
        </Wrapper>
    );
};

export default Logout;


const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const LogoutCard = styled.div`
  background: rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  padding: 40px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  text-align: center;
  color: white;
  background: linear-gradient(to right, #c33764, #1d2671);
`;

const UserName = styled.h2`
  margin-bottom: 10px;
  font-weight: 600;
`;

const LogoutMessage = styled.p`
  font-size: 16px;
  margin-bottom: 30px;
  color: #f0f0f0;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
`;

const LogoutButton = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;

  &.logout {
    background-color: #ff4b5c;
  }

  &.cancel {
    background-color: #4b3f72;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0,0,0,0.3);
  }
`;
