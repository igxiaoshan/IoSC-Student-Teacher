import * as React from 'react';
import { Divider, ListItemButton, ListItemIcon, ListItemText, ListSubheader } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';

import HomeIcon from '@mui/icons-material/Home';
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";

import ClassOutlinedIcon from '@mui/icons-material/ClassOutlined';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ImageIcon from '@mui/icons-material/Image';
import VideocamIcon from '@mui/icons-material/Videocam';
import BuildIcon from '@mui/icons-material/Build';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import { useSelector } from 'react-redux';
import { getSafeClassName } from '../../utils/safeAccess';

const TeacherSideBar = () => {
    const { currentUser } = useSelector((state) => state.user);
    const { tNav, tTeacher, tClass, tCommon } = useTranslation();
    const sclassName = getSafeClassName(currentUser?.teachSclass) || tClass('unassignedClass');

    const location = useLocation();
    return (
        <>
            <React.Fragment>
                <ListItemButton component={Link} to="/">
                    <ListItemIcon>
                        <HomeIcon color={location.pathname === ("/" || "/Teacher/dashboard") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary={tNav('home')} />
                </ListItemButton>
                <ListItemButton component={Link} to="/Teacher/class">
                    <ListItemIcon>
                        <ClassOutlinedIcon color={location.pathname.startsWith("/Teacher/class") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary={`${sclassName}${tClass('classUnit')}`} />
                </ListItemButton>
                {/* <ListItemButton component={Link} to="/Teacher/complain">
                    <ListItemIcon>
                        <AnnouncementOutlinedIcon color={location.pathname.startsWith("/Teacher/complain") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary="投诉" />
                </ListItemButton> */}
            </React.Fragment>
            <Divider sx={{ my: 1 }} />
            <React.Fragment>
                <ListSubheader component="div" inset>
                    {tTeacher('aiTools')}
                </ListSubheader>
                <ListItemButton component={Link} to="/Teacher/ai-courseware">
                    <ListItemIcon>
                        <AutoAwesomeIcon color={location.pathname.startsWith("/Teacher/ai-courseware") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary={tTeacher('aiCourseware')} />
                </ListItemButton>
                <ListItemButton component={Link} to="/Teacher/practical-exercise">
                    <ListItemIcon>
                        <BuildIcon color={location.pathname.startsWith("/Teacher/practical-exercise") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary={tTeacher('practicalExerciseGenerator')} />
                </ListItemButton>
                <ListItemButton component={Link} to="/Teacher/jimeng-image">
                    <ListItemIcon>
                        <ImageIcon color={location.pathname.startsWith("/Teacher/jimeng-image") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary={tTeacher('aiImageGenerator')} />
                </ListItemButton>
                <ListItemButton component={Link} to="/Teacher/jimeng-video">
                    <ListItemIcon>
                        <VideocamIcon color={location.pathname.startsWith("/Teacher/jimeng-video") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary={tTeacher('aiVideoGenerator')} />
                </ListItemButton>
                <ListItemButton component={Link} to="/Teacher/knowledge-video">
                    <ListItemIcon>
                        <AutoAwesomeIcon color={location.pathname.startsWith("/Teacher/knowledge-video") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary={tTeacher('knowledgeVideoGenerator')} />
                </ListItemButton>
                {/* <ListItemButton component={Link} to="/Teacher/analytics">
                    <ListItemIcon>
                        <AnalyticsIcon color={location.pathname.startsWith("/Teacher/analytics") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary={tTeacher('studentAnalytics')} />
                </ListItemButton> */}
            </React.Fragment>
            <Divider sx={{ my: 1 }} />
            <React.Fragment>
                <ListSubheader component="div" inset>
                    {tNav('users')}
                </ListSubheader>
                <ListItemButton component={Link} to="/Teacher/profile">
                    <ListItemIcon>
                        <AccountCircleOutlinedIcon color={location.pathname.startsWith("/Teacher/profile") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary={tCommon('profile')} />
                </ListItemButton>
                <ListItemButton component={Link} to="/logout">
                    <ListItemIcon>
                        <ExitToAppIcon color={location.pathname.startsWith("/logout") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary={tCommon('logout')} />
                </ListItemButton>
            </React.Fragment>
        </>
    )
}

export default TeacherSideBar