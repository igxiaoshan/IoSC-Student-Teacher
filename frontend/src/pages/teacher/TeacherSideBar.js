import * as React from 'react';
import { Divider, ListItemButton, ListItemIcon, ListItemText, ListSubheader } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';

import HomeIcon from '@mui/icons-material/Home';
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import AnnouncementOutlinedIcon from '@mui/icons-material/AnnouncementOutlined';
import ClassOutlinedIcon from '@mui/icons-material/ClassOutlined';
import SchoolIcon from '@mui/icons-material/School';
import QuizIcon from '@mui/icons-material/Quiz';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import FolderIcon from '@mui/icons-material/Folder';
import { useSelector } from 'react-redux';

const TeacherSideBar = () => {
    const { currentUser } = useSelector((state) => state.user);
    const sclassName = currentUser.teachSclass

    const location = useLocation();
    return (
        <>
            <React.Fragment>
                <ListItemButton component={Link} to="/">
                    <ListItemIcon>
                        <HomeIcon color={location.pathname === ("/" || "/Teacher/dashboard") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary="首页" />
                </ListItemButton>
                <ListItemButton component={Link} to="/Teacher/class">
                    <ListItemIcon>
                        <ClassOutlinedIcon color={location.pathname.startsWith("/Teacher/class") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary={`班级 ${sclassName.sclassName}`} />
                </ListItemButton>
                <ListItemButton component={Link} to="/Teacher/complain">
                    <ListItemIcon>
                        <AnnouncementOutlinedIcon color={location.pathname.startsWith("/Teacher/complain") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary="投诉处理" />
                </ListItemButton>
            </React.Fragment>
            <Divider sx={{ my: 1 }} />
            <React.Fragment>
                <ListSubheader component="div" inset>
                    AI教学助手
                </ListSubheader>
                <ListItemButton component={Link} to="/Teacher/lesson-planner">
                    <ListItemIcon>
                        <SchoolIcon color={location.pathname.startsWith("/Teacher/lesson-planner") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary="智能备课" />
                </ListItemButton>
                <ListItemButton component={Link} to="/Teacher/exam-generator">
                    <ListItemIcon>
                        <QuizIcon color={location.pathname.startsWith("/Teacher/exam-generator") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary="考核生成" />
                </ListItemButton>
                <ListItemButton component={Link} to="/Teacher/student-analytics">
                    <ListItemIcon>
                        <AnalyticsIcon color={location.pathname.startsWith("/Teacher/student-analytics") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary="学情分析" />
                </ListItemButton>
                <ListItemButton component={Link} to="/Teacher/resources">
                    <ListItemIcon>
                        <FolderIcon color={location.pathname.startsWith("/Teacher/resources") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary="资源管理" />
                </ListItemButton>
            </React.Fragment>
            <Divider sx={{ my: 1 }} />
            <React.Fragment>
                <ListSubheader component="div" inset>
                    用户
                </ListSubheader>
                <ListItemButton component={Link} to="/Teacher/profile">
                    <ListItemIcon>
                        <AccountCircleOutlinedIcon color={location.pathname.startsWith("/Teacher/profile") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary="个人资料" />
                </ListItemButton>
                <ListItemButton component={Link} to="/logout">
                    <ListItemIcon>
                        <ExitToAppIcon color={location.pathname.startsWith("/logout") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary="退出登录" />
                </ListItemButton>
            </React.Fragment>
        </>
    )
}

export default TeacherSideBar