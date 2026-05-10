import * as React from 'react';
import { Divider, ListItemButton, ListItemIcon, ListItemText, ListSubheader } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';

import HomeIcon from '@mui/icons-material/Home';
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import ClassOutlinedIcon from '@mui/icons-material/ClassOutlined';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SchoolIcon from '@mui/icons-material/School';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import QuizIcon from '@mui/icons-material/Quiz';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';

const StudentSideBar = () => {
    const location = useLocation();
    const { tNav, tStudent, tCommon } = useTranslation();
    return (
        <>
            <React.Fragment>
                <ListItemButton component={Link} to="/">
                    <ListItemIcon>
                        <HomeIcon color={location.pathname === ("/" || "/Student/dashboard") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary={tNav('home')} />
                </ListItemButton>
                <ListItemButton component={Link} to="/Student/subjects">
                    <ListItemIcon>
                        <AssignmentIcon color={location.pathname.startsWith("/Student/subjects") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary={tStudent('myGrades')} />
                </ListItemButton>
                <ListItemButton component={Link} to="/Student/subject-selection">
                    <ListItemIcon>
                        <SchoolIcon color={location.pathname.startsWith("/Student/subject-selection") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary={tStudent('courseManagement')} />
                </ListItemButton>
                <ListItemButton component={Link} to="/Student/attendance">
                    <ListItemIcon>
                        <ClassOutlinedIcon color={location.pathname.startsWith("/Student/attendance") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary={tStudent('myAttendance')} />
                </ListItemButton>
                <ListItemButton component={Link} to="/Student/calendar">
                    <ListItemIcon>
                        <CalendarTodayIcon color={location.pathname.startsWith("/Student/calendar") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary={tStudent('courseCalendar')} />
                </ListItemButton>
            </React.Fragment>
            <Divider sx={{ my: 1 }} />
            {/* AI学习助手模块 */}
            <React.Fragment>
                <ListSubheader component="div" inset>
                    {tStudent('aiAssistant')}
                </ListSubheader>
                <ListItemButton component={Link} to="/Student/learning-assistant">
                    <ListItemIcon>
                        <SmartToyIcon color={location.pathname.startsWith("/Student/learning-assistant") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary={tStudent('learningAssistant')} />
                </ListItemButton>
                <ListItemButton component={Link} to="/Student/practice-assistant">
                    <ListItemIcon>
                        <QuizIcon color={location.pathname.startsWith("/Student/practice-assistant") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary={tStudent('practiceAssistant')} />
                </ListItemButton>
                <ListItemButton component={Link} to="/Student/ai-image-generator">
                    <ListItemIcon>
                        <AutoAwesomeIcon color={location.pathname.startsWith("/Student/ai-image-generator") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary={tStudent('aiImageGenerator')} />
                </ListItemButton>
                <ListItemButton component={Link} to="/Student/knowledge-video-generator">
                    <ListItemIcon>
                        <VideoLibraryIcon color={location.pathname.startsWith("/Student/knowledge-video-generator") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary={tStudent('knowledgeVideo')} />
                </ListItemButton>
            </React.Fragment>
            <Divider sx={{ my: 1 }} />
            <React.Fragment>
                <ListSubheader component="div" inset>
                    {tNav('users')}
                </ListSubheader>
                <ListItemButton component={Link} to="/Student/profile">
                    <ListItemIcon>
                        <AccountCircleOutlinedIcon color={location.pathname.startsWith("/Student/profile") ? 'primary' : 'inherit'} />
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

export default StudentSideBar