import * as React from 'react';
import { Divider, ListItemButton, ListItemIcon, ListItemText, ListSubheader, Collapse, List } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { ExpandLess, ExpandMore } from '@mui/icons-material';

import HomeIcon from "@mui/icons-material/Home";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import AnnouncementOutlinedIcon from '@mui/icons-material/AnnouncementOutlined';
import ClassOutlinedIcon from '@mui/icons-material/ClassOutlined';
import SupervisorAccountOutlinedIcon from '@mui/icons-material/SupervisorAccountOutlined';
import ReportIcon from '@mui/icons-material/Report';
import AssignmentIcon from '@mui/icons-material/Assignment';

const SideBar = () => {
    const location = useLocation();
    const [classMenuOpen, setClassMenuOpen] = React.useState(false);
    const [studentMenuOpen, setStudentMenuOpen] = React.useState(false);

    const handleClassMenuClick = () => {
        setClassMenuOpen(!classMenuOpen);
    };

    const handleStudentMenuClick = () => {
        setStudentMenuOpen(!studentMenuOpen);
    };

    return (
        <>
            <React.Fragment>
                <ListItemButton component={Link} to="/">
                    <ListItemIcon>
                        <HomeIcon color={location.pathname === ("/" || "/Admin/dashboard") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary="首页" />
                </ListItemButton>

                {/* 班级管理菜单 */}
                <ListItemButton onClick={handleClassMenuClick}>
                    <ListItemIcon>
                        <ClassOutlinedIcon color={location.pathname.startsWith('/Admin/classes') || location.pathname.startsWith('/Admin/addclass') ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary="班级管理" />
                    {classMenuOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
                <Collapse in={classMenuOpen} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        <ListItemButton sx={{ pl: 4 }} component={Link} to="/Admin/class-management">
                            <ListItemIcon>
                                <ClassOutlinedIcon color={location.pathname === '/Admin/class-management' ? 'primary' : 'inherit'} />
                            </ListItemIcon>
                            <ListItemText primary="管理中心" />
                        </ListItemButton>
                        <ListItemButton sx={{ pl: 4 }} component={Link} to="/Admin/classes">
                            <ListItemIcon>
                                <ClassOutlinedIcon color={location.pathname === '/Admin/classes' ? 'primary' : 'inherit'} />
                            </ListItemIcon>
                            <ListItemText primary="班级列表" />
                        </ListItemButton>
                        <ListItemButton sx={{ pl: 4 }} component={Link} to="/Admin/addclass">
                            <ListItemIcon>
                                <ClassOutlinedIcon color={location.pathname === '/Admin/addclass' ? 'primary' : 'inherit'} />
                            </ListItemIcon>
                            <ListItemText primary="创建班级" />
                        </ListItemButton>
                        <ListItemButton sx={{ pl: 4 }} component={Link} to="/Admin/classes/enhanced">
                            <ListItemIcon>
                                <ClassOutlinedIcon color={location.pathname === '/Admin/classes/enhanced' ? 'primary' : 'inherit'} />
                            </ListItemIcon>
                            <ListItemText primary="高级管理" />
                        </ListItemButton>
                        <ListItemButton sx={{ pl: 4 }} component={Link} to="/Admin/classes/statistics">
                            <ListItemIcon>
                                <ClassOutlinedIcon color={location.pathname === '/Admin/classes/statistics' ? 'primary' : 'inherit'} />
                            </ListItemIcon>
                            <ListItemText primary="统计报表" />
                        </ListItemButton>
                    </List>
                </Collapse>
                <ListItemButton component={Link} to="/Admin/subjects">
                    <ListItemIcon>
                        <AssignmentIcon color={location.pathname.startsWith("/Admin/subjects") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary="科目" />
                </ListItemButton>
                <ListItemButton component={Link} to="/Admin/teachers">
                    <ListItemIcon>
                        <SupervisorAccountOutlinedIcon color={location.pathname.startsWith("/Admin/teachers") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary="教师" />
                </ListItemButton>
                {/* 学生管理菜单 */}
                <ListItemButton onClick={handleStudentMenuClick}>
                    <ListItemIcon>
                        <PersonOutlineIcon color={location.pathname.startsWith('/Admin/students') ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary="学生管理" />
                    {studentMenuOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
                <Collapse in={studentMenuOpen} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        <ListItemButton sx={{ pl: 4 }} component={Link} to="/Admin/students">
                            <ListItemIcon>
                                <PersonOutlineIcon color={location.pathname === '/Admin/students' ? 'primary' : 'inherit'} />
                            </ListItemIcon>
                            <ListItemText primary="学生列表" />
                        </ListItemButton>
                        <ListItemButton sx={{ pl: 4 }} component={Link} to="/Admin/addstudents">
                            <ListItemIcon>
                                <PersonOutlineIcon color={location.pathname === '/Admin/addstudents' ? 'primary' : 'inherit'} />
                            </ListItemIcon>
                            <ListItemText primary="添加学生" />
                        </ListItemButton>
                        <ListItemButton sx={{ pl: 4 }} component={Link} to="/Admin/students/reassign">
                            <ListItemIcon>
                                <PersonOutlineIcon color={location.pathname === '/Admin/students/reassign' ? 'primary' : 'inherit'} />
                            </ListItemIcon>
                            <ListItemText primary="班级重新分配" />
                        </ListItemButton>
                    </List>
                </Collapse>
                <ListItemButton component={Link} to="/Admin/notices">
                    <ListItemIcon>
                        <AnnouncementOutlinedIcon color={location.pathname.startsWith("/Admin/notices") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary="通知" />
                </ListItemButton>
                {/* <ListItemButton component={Link} to="/Admin/complains">
                    <ListItemIcon>
                        <ReportIcon color={location.pathname.startsWith("/Admin/complains") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary="投诉" />
                </ListItemButton> */}
            </React.Fragment>
            <Divider sx={{ my: 1 }} />
            <React.Fragment>
                <ListSubheader component="div" inset>
                    用户
                </ListSubheader>
                <ListItemButton component={Link} to="/Admin/profile">
                    <ListItemIcon>
                        <AccountCircleOutlinedIcon color={location.pathname.startsWith("/Admin/profile") ? 'primary' : 'inherit'} />
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

export default SideBar
