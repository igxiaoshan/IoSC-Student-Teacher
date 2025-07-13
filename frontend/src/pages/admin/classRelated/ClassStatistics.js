import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box, Typography, Grid, Card, CardContent, Paper,
    CircularProgress, Alert, Chip, LinearProgress
} from '@mui/material';
import {
    School as SchoolIcon,
    Group as GroupIcon,
    Class as ClassIcon,
    TrendingUp as TrendingUpIcon,
    Assignment as AssignmentIcon
} from '@mui/icons-material';
import { getClassStatistics } from '../../../redux/sclassRelated/sclassHandle';

const ClassStatistics = () => {
    const dispatch = useDispatch();
    const { classStatistics, statsLoading, error } = useSelector((state) => state.sclass);
    const { currentUser } = useSelector(state => state.user);

    useEffect(() => {
        if (currentUser?._id) {
            dispatch(getClassStatistics(currentUser._id));
        }
    }, [dispatch, currentUser]);

    if (statsLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ m: 2 }}>
                获取统计数据失败: {error}
            </Alert>
        );
    }

    if (!classStatistics) {
        return (
            <Alert severity="info" sx={{ m: 2 }}>
                暂无统计数据
            </Alert>
        );
    }

    const { overview, gradeStatistics, classDetails } = classStatistics;

    // 状态颜色映射
    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'success';
            case 'inactive': return 'warning';
            case 'archived': return 'default';
            default: return 'default';
        }
    };

    // 状态文本映射
    const getStatusText = (status) => {
        switch (status) {
            case 'active': return '活跃';
            case 'inactive': return '非活跃';
            case 'archived': return '已归档';
            default: return status;
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                班级统计概览
            </Typography>

            {/* 概览卡片 */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <ClassIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>
                                        总班级数
                                    </Typography>
                                    <Typography variant="h4">
                                        {overview.totalClasses}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <GroupIcon sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>
                                        总学生数
                                    </Typography>
                                    <Typography variant="h4">
                                        {overview.totalStudents}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <TrendingUpIcon sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>
                                        平均班级规模
                                    </Typography>
                                    <Typography variant="h4">
                                        {overview.averageClassSize}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <SchoolIcon sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>
                                        活跃班级数
                                    </Typography>
                                    <Typography variant="h4">
                                        {overview.activeClasses}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* 状态分布 */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            班级状态分布
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2">活跃班级</Typography>
                                <Typography variant="body2">{overview.activeClasses}</Typography>
                            </Box>
                            <LinearProgress 
                                variant="determinate" 
                                value={(overview.activeClasses / overview.totalClasses) * 100} 
                                sx={{ mb: 2, height: 8, borderRadius: 4 }}
                                color="success"
                            />

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2">非活跃班级</Typography>
                                <Typography variant="body2">{overview.inactiveClasses}</Typography>
                            </Box>
                            <LinearProgress 
                                variant="determinate" 
                                value={(overview.inactiveClasses / overview.totalClasses) * 100} 
                                sx={{ mb: 2, height: 8, borderRadius: 4 }}
                                color="warning"
                            />

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2">已归档班级</Typography>
                                <Typography variant="body2">{overview.archivedClasses}</Typography>
                            </Box>
                            <LinearProgress 
                                variant="determinate" 
                                value={(overview.archivedClasses / overview.totalClasses) * 100} 
                                sx={{ height: 8, borderRadius: 4 }}
                                color="inherit"
                            />
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            年级分布统计
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                            {Object.entries(gradeStatistics).map(([grade, stats]) => (
                                <Box key={grade} sx={{ mb: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2">{grade}</Typography>
                                        <Typography variant="body2">
                                            {stats.classCount} 班级 / {stats.studentCount} 学生
                                        </Typography>
                                    </Box>
                                    <LinearProgress 
                                        variant="determinate" 
                                        value={(stats.classCount / overview.totalClasses) * 100} 
                                        sx={{ height: 6, borderRadius: 3 }}
                                    />
                                </Box>
                            ))}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* 班级详情列表 */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    班级详细信息
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    {classDetails.map((classItem) => (
                        <Grid item xs={12} sm={6} md={4} key={classItem._id}>
                            <Card variant="outlined">
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Typography variant="h6" component="div">
                                            {classItem.sclassName}
                                        </Typography>
                                        <Chip 
                                            label={getStatusText(classItem.status)} 
                                            color={getStatusColor(classItem.status)}
                                            size="small"
                                        />
                                    </Box>
                                    
                                    {classItem.grade && (
                                        <Typography color="text.secondary" gutterBottom>
                                            年级: {classItem.grade}
                                        </Typography>
                                    )}
                                    
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                                        <Typography variant="body2">
                                            学生数量
                                        </Typography>
                                        <Typography variant="body2" fontWeight="bold">
                                            {classItem.studentCount} / {classItem.maxStudents}
                                        </Typography>
                                    </Box>
                                    
                                    <LinearProgress 
                                        variant="determinate" 
                                        value={(classItem.studentCount / classItem.maxStudents) * 100} 
                                        sx={{ mt: 1, height: 6, borderRadius: 3 }}
                                        color={classItem.studentCount >= classItem.maxStudents ? "error" : "primary"}
                                    />
                                    
                                    {classItem.studentCount >= classItem.maxStudents && (
                                        <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                                            班级已满
                                        </Typography>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Paper>
        </Box>
    );
};

export default ClassStatistics;
