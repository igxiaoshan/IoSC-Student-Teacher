/**
 * 共享 Dashboard 布局组件
 * 提取 Admin/Teacher/Student Dashboard 的共同布局逻辑
 */

import React, { useState } from 'react';
import {
    CssBaseline,
    Box,
    Toolbar,
    List,
    Typography,
    Divider,
    IconButton,
    useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { Outlet } from 'react-router-dom';
import AccountMenu from '../AccountMenu';
import { AppBar, Drawer } from '../styles';

/**
 * Dashboard 布局组件
 * @param {Object} props
 * @param {React.ReactNode} props.sidebar - 侧边栏组件
 * @param {string} props.title - 顶部标题
 * @param {Object} props.sx - 额外样式
 */
const DashboardLayout = ({ sidebar, title = 'Dashboard', sx = {} }) => {
    const [open, setOpen] = useState(true);
    const theme = useTheme();

    const toggleDrawer = () => {
        setOpen(!open);
    };

    const styles = {
        boxStyled: {
            backgroundColor: theme.palette.mode === 'light'
                ? theme.palette.grey[100]
                : theme.palette.grey[900],
            flexGrow: 1,
            height: '100vh',
            overflow: 'auto',
            ...sx.main,
        },
        toolBarStyled: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            px: [1],
        },
        drawerStyled: {
            display: 'flex',
            ...sx.drawer,
        },
        hideDrawer: {
            display: 'flex',
            '@media (max-width: 600px)': {
                display: 'none',
            },
            ...sx.drawerHidden,
        },
        appBar: {
            position: 'absolute',
            ...sx.appBar,
        },
    };

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />

            {/* 顶部应用栏 */}
            <AppBar open={open} position="absolute" sx={styles.appBar}>
                <Toolbar sx={{ pr: '24px' }}>
                    <IconButton
                        edge="start"
                        color="inherit"
                        aria-label="打开侧边栏"
                        onClick={toggleDrawer}
                        sx={{
                            marginRight: '36px',
                            ...(open && { display: 'none' }),
                        }}
                    >
                        <MenuIcon />
                    </IconButton>

                    <Typography
                        component="h1"
                        variant="h6"
                        color="inherit"
                        noWrap
                        sx={{ flexGrow: 1 }}
                    >
                        {title}
                    </Typography>

                    <AccountMenu />
                </Toolbar>
            </AppBar>

            {/* 侧边栏 */}
            <Drawer
                variant="permanent"
                open={open}
                sx={open ? styles.drawerStyled : styles.hideDrawer}
            >
                <Toolbar sx={styles.toolBarStyled}>
                    <IconButton onClick={toggleDrawer}>
                        <ChevronLeftIcon />
                    </IconButton>
                </Toolbar>
                <Divider />
                <List component="nav">
                    {sidebar}
                </List>
            </Drawer>

            {/* 主内容区 */}
            <Box component="main" sx={styles.boxStyled}>
                <Toolbar />
                <Outlet />
            </Box>
        </Box>
    );
};

/**
 * 高阶组件：为 Dashboard 添加布局
 * @param {React.ComponentType} WrappedComponent - 被包装的组件
 * @param {Object} options - 配置选项
 */
export const withDashboardLayout = (WrappedComponent, options = {}) => {
    return function WithDashboardLayoutWrapper(props) {
        const { sidebar, title } = options;

        if (sidebar) {
            return (
                <DashboardLayout sidebar={sidebar} title={title}>
                    <WrappedComponent {...props} />
                </DashboardLayout>
            );
        }

        return <WrappedComponent {...props} />;
    };
};

/**
 * 使用 Dashboard 布局的 Hook
 * 返回布局相关的状态和方法
 */
export const useDashboardLayout = () => {
    const [open, setOpen] = useState(true);

    const toggleDrawer = () => setOpen(!open);
    const openDrawer = () => setOpen(true);
    const closeDrawer = () => setOpen(false);

    return {
        open,
        toggleDrawer,
        openDrawer,
        closeDrawer,
    };
};

export default DashboardLayout;