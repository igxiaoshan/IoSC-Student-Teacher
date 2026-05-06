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