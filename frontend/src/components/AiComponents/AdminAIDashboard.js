import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    LinearProgress,
    Chip,
    Avatar,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Tabs,
    Tab
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    TrendingUp as TrendingUpIcon,
    School as SchoolIcon,
    People as PeopleIcon,
    Assessment as AssessmentIcon,
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon,
    Psychology as PsychologyIcon,
    Analytics as AnalyticsIcon,
    Insights as InsightsIcon
} from '@mui/icons-material';
import { 
    getAdminDashboard, 
    getQualityOverview, 
    getDecisionSupport 
} from '../../redux/aiRelated/aiHandle';

function TabPanel({ children, value, index, ...other }) {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`admin-ai-tabpanel-${index}`}
            aria-labelledby={`admin-ai-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ py: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const AdminAIDashboard = ({ adminId }) => {
    const dispatch = useDispatch();
    const { adminAI } = useSelector(state => state.ai);
    const [tabValue, setTabValue] = useState(0);
    const [timeRange, setTimeRange] = useState('month');

    useEffect(() => {
        if (adminId) {
            dispatch(getAdminDashboard(adminId, timeRange));
            dispatch(getQualityOverview(adminId, timeRange));
            dispatch(getDecisionSupport(adminId, timeRange, 'all'));
        }
    }, [dispatch, adminId, timeRange]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const renderOverviewCards = () => {
        const mockData = adminAI.analytics.dashboardData || {
            overviewStats: {
                users: { totalStudents: 1250, totalTeachers: 85, studentActivityRate: 88.0, teacherActivityRate: 91.8 },
                content: { totalSubjects: 12, totalQuestions: 2500, contentGrowthRate: 15.5 },
                teaching: { averageScore: 78.5, passRate: 85.2 },
                learning: { accuracy: 80.0, completionRate: 90.0 }
            }
        };

        const cards = [
            {
                title: '学生总数',
                value: mockData.overviewStats.users.totalStudents,
                change: '+12%',
                icon: <SchoolIcon />,
                color: 'primary'
            },
            {
                title: '教师总数',
                value: mockData.overviewStats.users.totalTeachers,
                change: '+5%',
                icon: <PeopleIcon />,
                color: 'secondary'
            },
            {
                title: '平均成绩',
                value: `${mockData.overviewStats.teaching.averageScore}分`,
                change: '+3.2%',
                icon: <AssessmentIcon />,
                color: 'success'
            },
            {
                title: '学习完成率',
                value: `${mockData.overviewStats.learning.completionRate}%`,
                change: '+8.1%',
                icon: <TrendingUpIcon />,
                color: 'warning'
            }
        ];

        return (
            <Grid container spacing={3} sx={{ mb: 3 }}>
                {cards.map((card, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                        <Card elevation={2}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography variant="h4" color={card.color + '.main'}>
                                            {card.value}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {card.title}
                                        </Typography>
                                        <Chip 
                                            label={card.change} 
                                            size="small" 
                                            color="success" 
                                            sx={{ mt: 1 }}
                                        />
                                    </Box>
                                    <Avatar sx={{ bgcolor: card.color + '.light' }}>
                                        {card.icon}
                                    </Avatar>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        );
    };

    const renderQualityMonitor = () => {
        const qualityData = adminAI.qualityMonitor.qualityData || {
            qualityMetrics: { overallQuality: 82.3 },
            teacherRankings: [
                { name: '张老师', performanceScore: 88.5 },
                { name: '李老师', performanceScore: 85.2 },
                { name: '王老师', performanceScore: 82.1 }
            ]
        };

        return (
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Card elevation={2}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                整体教学质量
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h3" color="primary">
                                    {qualityData.qualityMetrics.overallQuality}
                                </Typography>
                                <Typography variant="h6" sx={{ ml: 1 }}>
                                    分
                                </Typography>
                            </Box>
                            <LinearProgress 
                                variant="determinate" 
                                value={qualityData.qualityMetrics.overallQuality} 
                                sx={{ height: 8, borderRadius: 4 }}
                            />
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                较上月提升 3.2%
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                    <Card elevation={2}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                教师表现排名
                            </Typography>
                            <List dense>
                                {qualityData.teacherRankings.map((teacher, index) => (
                                    <ListItem key={index}>
                                        <ListItemIcon>
                                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light' }}>
                                                {index + 1}
                                            </Avatar>
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={teacher.name}
                                            secondary={`综合分数: ${teacher.performanceScore}`}
                                        />
                                        <Chip 
                                            label={index === 0 ? '优秀' : index === 1 ? '良好' : '合格'} 
                                            size="small"
                                            color={index === 0 ? 'success' : index === 1 ? 'primary' : 'default'}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        );
    };

    const renderDecisionSupport = () => {
        const decisionData = adminAI.decisionSupport.recommendations || [
            {
                id: 1,
                priority: 'high',
                title: '加强AI技术应用',
                category: 'strategic',
                description: '基于当前数据分析，建议加大AI技术在教学中的应用',
                expectedImpact: 'high',
                timeline: '6个月'
            },
            {
                id: 2,
                priority: 'medium',
                title: '优化资源配置',
                category: 'operational',
                description: '重新配置教学资源以提升整体效率',
                expectedImpact: 'medium',
                timeline: '3个月'
            }
        ];

        const insights = [
            { type: 'trend', title: '学习效果持续提升', confidence: 0.92, impact: 'positive' },
            { type: 'risk', title: '部分学科参与度下降', confidence: 0.78, impact: 'negative' },
            { type: 'opportunity', title: 'AI工具显著提升教学效率', confidence: 0.94, impact: 'positive' }
        ];

        return (
            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Card elevation={2}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                AI决策建议
                            </Typography>
                            <List>
                                {decisionData.map((recommendation) => (
                                    <ListItem key={recommendation.id} sx={{ bgcolor: 'grey.50', mb: 1, borderRadius: 1 }}>
                                        <ListItemIcon>
                                            <Avatar sx={{ 
                                                bgcolor: recommendation.priority === 'high' ? 'error.light' : 
                                                         recommendation.priority === 'medium' ? 'warning.light' : 'success.light'
                                            }}>
                                                <PsychologyIcon />
                                            </Avatar>
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={recommendation.title}
                                            secondary={
                                                <Box>
                                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                                        {recommendation.description}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                                        <Chip 
                                                            label={recommendation.priority} 
                                                            size="small"
                                                            color={recommendation.priority === 'high' ? 'error' : 
                                                                   recommendation.priority === 'medium' ? 'warning' : 'success'}
                                                        />
                                                        <Chip 
                                                            label={recommendation.timeline} 
                                                            size="small" 
                                                            variant="outlined"
                                                        />
                                                    </Box>
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>
                
                <Grid item xs={12} md={4}>
                    <Card elevation={2}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                AI洞察
                            </Typography>
                            <List dense>
                                {insights.map((insight, index) => (
                                    <ListItem key={index}>
                                        <ListItemIcon>
                                            {insight.impact === 'positive' ? 
                                                <CheckCircleIcon color="success" /> : 
                                                <WarningIcon color="warning" />
                                            }
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={insight.title}
                                            secondary={`置信度: ${(insight.confidence * 100).toFixed(0)}%`}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        );
    };

    return (
        <Box>
            {/* 时间范围选择 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5">
                    AI管理仪表板
                </Typography>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>时间范围</InputLabel>
                    <Select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                    >
                        <MenuItem value="week">本周</MenuItem>
                        <MenuItem value="month">本月</MenuItem>
                        <MenuItem value="quarter">本季度</MenuItem>
                        <MenuItem value="year">本年</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            {/* 错误提示 */}
            {(adminAI.analytics.error || adminAI.qualityMonitor.error || adminAI.decisionSupport.error) && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    数据加载失败，请稍后重试
                </Alert>
            )}

            {/* 概览卡片 */}
            {renderOverviewCards()}

            {/* 选项卡 */}
            <Paper elevation={2}>
                <Tabs 
                    value={tabValue} 
                    onChange={handleTabChange}
                    variant="fullWidth"
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab
                        icon={<AnalyticsIcon />}
                        label="数据分析"
                        iconPosition="start"
                    />
                    <Tab
                        icon={<AssessmentIcon />}
                        label="统计报告"
                        iconPosition="start"
                    />
                </Tabs>

                <TabPanel value={tabValue} index={0}>
                    <Typography variant="h6" gutterBottom>
                        数据分析大屏
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        这里显示详细的数据可视化图表和统计信息
                    </Typography>
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                    <Typography variant="h6" gutterBottom>
                        统计报告
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        这里显示各类统计报告和数据摘要
                    </Typography>
                </TabPanel>
            </Paper>
        </Box>
    );
};

export default AdminAIDashboard;
