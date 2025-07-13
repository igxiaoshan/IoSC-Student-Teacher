import React from 'react';
import {
    Box, Paper, Typography, Grid, Card, CardContent, CardActionArea,
    Chip, Avatar
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Add as AddIcon,
    Class as ClassIcon,
    BarChart as BarChartIcon,
    Settings as SettingsIcon,
    Visibility as VisibilityIcon,
    Speed as SpeedIcon
} from '@mui/icons-material';

const ClassManagementNav = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const navigationItems = [
        {
            title: '班级列表',
            description: '查看和管理所有班级',
            icon: <ClassIcon />,
            path: '/Admin/classes',
            color: 'primary',
            features: ['查看班级', '编辑信息', '删除班级']
        },
        {
            title: '创建班级',
            description: '添加新的班级到系统',
            icon: <AddIcon />,
            path: '/Admin/addclass',
            color: 'success',
            features: ['基础信息', '详细配置', '快速创建']
        },
        {
            title: '高级管理',
            description: '增强版班级管理功能',
            icon: <SettingsIcon />,
            path: '/Admin/classes/enhanced',
            color: 'info',
            features: ['搜索筛选', '批量操作', '高级功能']
        },
        {
            title: '统计报表',
            description: '班级数据统计和分析',
            icon: <BarChartIcon />,
            path: '/Admin/classes/statistics',
            color: 'warning',
            features: ['数据概览', '图表分析', '趋势报告']
        },
        {
            title: '分步创建',
            description: '引导式班级创建流程',
            icon: <SpeedIcon />,
            path: '/Admin/addclass/enhanced',
            color: 'secondary',
            features: ['分步引导', '智能验证', '预览确认']
        }
    ];

    const isCurrentPath = (path) => {
        return location.pathname === path;
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                班级管理中心
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
                选择下面的功能模块来管理您的班级
            </Typography>

            <Grid container spacing={3}>
                {navigationItems.map((item, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card 
                            sx={{ 
                                height: '100%',
                                border: isCurrentPath(item.path) ? 2 : 0,
                                borderColor: isCurrentPath(item.path) ? `${item.color}.main` : 'transparent',
                                '&:hover': {
                                    boxShadow: 6,
                                    transform: 'translateY(-4px)',
                                    transition: 'all 0.3s ease'
                                }
                            }}
                        >
                            <CardActionArea 
                                onClick={() => navigate(item.path)}
                                sx={{ height: '100%' }}
                            >
                                <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Avatar 
                                            sx={{ 
                                                bgcolor: `${item.color}.main`, 
                                                mr: 2,
                                                width: 48,
                                                height: 48
                                            }}
                                        >
                                            {item.icon}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="h6" component="div">
                                                {item.title}
                                            </Typography>
                                            {isCurrentPath(item.path) && (
                                                <Chip 
                                                    label="当前页面" 
                                                    size="small" 
                                                    color={item.color}
                                                    variant="outlined"
                                                />
                                            )}
                                        </Box>
                                    </Box>
                                    
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                                        {item.description}
                                    </Typography>
                                    
                                    <Box>
                                        <Typography variant="subtitle2" gutterBottom>
                                            主要功能：
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {item.features.map((feature, featureIndex) => (
                                                <Chip
                                                    key={featureIndex}
                                                    label={feature}
                                                    size="small"
                                                    variant="outlined"
                                                    color={item.color}
                                                />
                                            ))}
                                        </Box>
                                    </Box>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* 快捷操作区域 */}
            <Paper sx={{ p: 3, mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                    快捷操作
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card 
                            sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                            onClick={() => navigate('/Admin/addclass')}
                        >
                            <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                <AddIcon color="success" sx={{ fontSize: 32, mb: 1 }} />
                                <Typography variant="body2">
                                    快速创建班级
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card 
                            sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                            onClick={() => navigate('/Admin/classes')}
                        >
                            <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                <VisibilityIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
                                <Typography variant="body2">
                                    查看所有班级
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card 
                            sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                            onClick={() => navigate('/Admin/classes/statistics')}
                        >
                            <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                <BarChartIcon color="warning" sx={{ fontSize: 32, mb: 1 }} />
                                <Typography variant="body2">
                                    统计数据
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card 
                            sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                            onClick={() => navigate('/Admin/classes/enhanced')}
                        >
                            <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                <SettingsIcon color="info" sx={{ fontSize: 32, mb: 1 }} />
                                <Typography variant="body2">
                                    高级管理
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
};

export default ClassManagementNav;
