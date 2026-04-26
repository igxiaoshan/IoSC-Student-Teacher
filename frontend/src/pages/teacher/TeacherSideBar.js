import React from 'react';
import {
    Divider, ListItemButton, ListItemIcon, ListItemText, ListSubheader,
    Hidden
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';

import HomeIcon from '@mui/icons-material/Home';
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";

import ClassOutlinedIcon from '@mui/icons-material/ClassOutlined';
import EventIcon from '@mui/icons-material/Event';
import GradeIcon from '@mui/icons-material/Grade';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ImageIcon from '@mui/icons-material/Image';
import BuildIcon from '@mui/icons-material/Build';
import { useSelector } from 'react-redux';
import { getSafeClassName } from '../../utils/safeAccess';

/**
 * 教师端导航栏组件
 * 支持响应式布局 - 移动端隐藏文字仅显示图标
 */
const TeacherSideBar = () => {
    const { currentUser } = useSelector((state) => state.user);
    const { tNav, tTeacher, tClass, tCommon } = useTranslation();
    const sclassName = getSafeClassName(currentUser?.teachSclass) || tClass('unassignedClass');

    const location = useLocation();

    // 检查当前路径是否匹配
    const isActive = (path) => {
        if (path === '/') {
            return location.pathname === '/' || location.pathname === '/Teacher/dashboard';
        }
        return location.pathname.startsWith(path);
    };

    // 导航项配置
    const mainNavItems = [
        { path: '/', icon: <HomeIcon />, label: tNav('home') },
        { path: '/Teacher/class', icon: <ClassOutlinedIcon />, label: `${sclassName}${tClass('classUnit')}`, exclude: '/Teacher/class/student' },
        { path: '/Teacher/attendance', icon: <EventIcon />, label: tTeacher('attendanceManagement') || '考勤管理' },
        { path: '/Teacher/grades', icon: <GradeIcon />, label: tTeacher('gradeManagement') || '成绩管理' },
        { path: '/Teacher/progress', icon: <TrendingUpIcon />, label: tTeacher('studentProgress') || '学生进度' },
    ];

    const aiNavItems = [
        { path: '/Teacher/ai-courseware', icon: <AutoAwesomeIcon />, label: tTeacher('aiCourseware') },
        { path: '/Teacher/practical-exercise', icon: <BuildIcon />, label: tTeacher('practicalExerciseGenerator') },
        { path: '/Teacher/jimeng-image', icon: <ImageIcon />, label: tTeacher('aiImageGenerator') },
        { path: '/Teacher/knowledge-video', icon: <AutoAwesomeIcon />, label: tTeacher('knowledgeVideoGenerator') },
    ];

    const userNavItems = [
        { path: '/Teacher/profile', icon: <AccountCircleOutlinedIcon />, label: tCommon('profile') },
        { path: '/logout', icon: <ExitToAppIcon />, label: tCommon('logout') },
    ];

    // 渲染导航项
    const renderNavItem = (item) => {
        const active = item.exclude
            ? location.pathname.startsWith(item.path) && !location.pathname.startsWith(item.exclude)
            : isActive(item.path);

        return (
            <ListItemButton
                component={Link}
                to={item.path}
                key={item.path}
            >
                <ListItemIcon>
                    {React.cloneElement(item.icon, {
                        color: active ? 'primary' : 'inherit'
                    })}
                </ListItemIcon>
                <Hidden smDown implementation="css">
                    <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                            noWrap: true,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}
                    />
                </Hidden>
            </ListItemButton>
        );
    };

    return (
        <>
            {/* 主要导航 */}
            <React.Fragment>
                {mainNavItems.map(renderNavItem)}
            </React.Fragment>

            <Divider sx={{ my: 1 }} />

            {/* AI 工具 */}
            <React.Fragment>
                <Hidden smDown implementation="css">
                    <ListSubheader component="div" inset>
                        {tTeacher('aiTools')}
                    </ListSubheader>
                </Hidden>
                {aiNavItems.map(renderNavItem)}
            </React.Fragment>

            <Divider sx={{ my: 1 }} />

            {/* 用户导航 */}
            <React.Fragment>
                {userNavItems.map(renderNavItem)}
            </React.Fragment>
        </>
    );
};

export default TeacherSideBar;