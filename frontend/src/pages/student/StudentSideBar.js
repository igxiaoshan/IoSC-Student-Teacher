import * as React from 'react';
import { Divider, ListItemButton, ListItemIcon, ListItemText, ListSubheader } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';

import HomeIcon from '@mui/icons-material/Home';
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import AnnouncementOutlinedIcon from '@mui/icons-material/AnnouncementOutlined';
import ClassOutlinedIcon from '@mui/icons-material/ClassOutlined';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PsychologyIcon from '@mui/icons-material/Psychology';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import RouteIcon from '@mui/icons-material/Route';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

const StudentSideBar = () => {
    const location = useLocation();
    return (
        <>
            <React.Fragment>
                <ListItemButton component={Link} to="/">
                    <ListItemIcon>
                        <HomeIcon color={location.pathname === ("/" || "/Student/dashboard") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary="Home" />
                </ListItemButton>
                <ListItemButton component={Link} to="/Student/subjects">
                    <ListItemIcon>
                        <AssignmentIcon color={location.pathname.startsWith("/Student/subjects") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary="Subjects" />
                </ListItemButton>
                <ListItemButton component={Link} to="/Student/attendance">
                    <ListItemIcon>
                        <ClassOutlinedIcon color={location.pathname.startsWith("/Student/attendance") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary="Attendance" />
                </ListItemButton>
                <ListItemButton component={Link} to="/Student/complain">
                    <ListItemIcon>
                        <AnnouncementOutlinedIcon color={location.pathname.startsWith("/Student/complain") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary="Complain" />
                </ListItemButton>
            </React.Fragment>
            <Divider sx={{ my: 1 }} />
            <React.Fragment>
                <ListSubheader component="div" inset>
                    AI Learning Assistant
                </ListSubheader>
                <ListItemButton component={Link} to="/Student/ai-assistant">
                    <ListItemIcon>
                        <PsychologyIcon color={location.pathname.startsWith("/Student/ai-assistant") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary="Study Assistant" />
                </ListItemButton>
                <ListItemButton component={Link} to="/Student/ai-practice">
                    <ListItemIcon>
                        <SmartToyIcon color={location.pathname.startsWith("/Student/ai-practice") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary="AI Practice" />
                </ListItemButton>
                <ListItemButton component={Link} to="/Student/learning-path">
                    <ListItemIcon>
                        <RouteIcon color={location.pathname.startsWith("/Student/learning-path") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary="Learning Path" />
                </ListItemButton>
                <ListItemButton component={Link} to="/Student/ai-companion">
                    <ListItemIcon>
                        <EmojiEventsIcon color={location.pathname.startsWith("/Student/ai-companion") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary="AI Companion" />
                </ListItemButton>
            </React.Fragment>
            <Divider sx={{ my: 1 }} />
            <React.Fragment>
                <ListSubheader component="div" inset>
                    User
                </ListSubheader>
                <ListItemButton component={Link} to="/Student/profile">
                    <ListItemIcon>
                        <AccountCircleOutlinedIcon color={location.pathname.startsWith("/Student/profile") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary="Profile" />
                </ListItemButton>
                <ListItemButton component={Link} to="/logout">
                    <ListItemIcon>
                        <ExitToAppIcon color={location.pathname.startsWith("/logout") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary="Logout" />
                </ListItemButton>
            </React.Fragment>
        </>
    )
}

export default StudentSideBar