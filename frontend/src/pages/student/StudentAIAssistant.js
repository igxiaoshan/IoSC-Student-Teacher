import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
    Box,
    Container,
    Typography,
    Paper,
    Grid,
    Tab,
    Tabs,
    Card,
    CardContent,
    Avatar,
    Chip
} from '@mui/material';
import {
    Psychology as PsychologyIcon,
    SmartToy as SmartToyIcon,
    Route as RouteIcon,
    EmojiEvents as CompanionIcon
} from '@mui/icons-material';

import StudyAssistant from '../../components/AIComponents/StudyAssistant';
import PracticeAssistant from '../../components/AIComponents/PracticeAssistant';
import LearningPath from '../../components/AIComponents/LearningPath';
import LearningCompanion from '../../components/AIComponents/LearningCompanion';

function TabPanel({ children, value, index, ...other }) {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`ai-tabpanel-${index}`}
            aria-labelledby={`ai-tab-${index}`}
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

const StudentAIAssistant = () => {
    const { currentUser } = useSelector(state => state.user);
    const [tabValue, setTabValue] = useState(0);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const aiFeatures = [
        {
            title: '智能学习助手',
            description: 'AI问答和学习指导',
            icon: <PsychologyIcon />,
            color: 'primary'
        },
        {
            title: '智能练习系统',
            description: '自适应练习和即时反馈',
            icon: <SmartToyIcon />,
            color: 'secondary'
        },
        {
            title: '学习路径规划',
            description: '个性化学习计划',
            icon: <RouteIcon />,
            color: 'success'
        },
        {
            title: 'AI学习伙伴',
            description: '情感化学习支持',
            icon: <CompanionIcon />,
            color: 'warning'
        }
    ];

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 3 }}>
                {/* 页面标题 */}
                <Paper elevation={2} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                            <PsychologyIcon sx={{ fontSize: 32 }} />
                        </Avatar>
                        <Box>
                            <Typography variant="h4" gutterBottom>
                                AI学习助手
                            </Typography>
                            <Typography variant="h6" sx={{ opacity: 0.9 }}>
                                你好，{currentUser?.name}！让AI助力你的学习之旅
                            </Typography>
                        </Box>
                    </Box>
                </Paper>

                {/* AI功能概览卡片 */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    {aiFeatures.map((feature, index) => (
                        <Grid item xs={12} sm={6} md={3} key={index}>
                            <Card 
                                elevation={2} 
                                sx={{ 
                                    height: '100%',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: 4
                                    }
                                }}
                                onClick={() => setTabValue(index)}
                            >
                                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                                    <Avatar 
                                        sx={{ 
                                            bgcolor: feature.color + '.main', 
                                            width: 56, 
                                            height: 56, 
                                            mx: 'auto', 
                                            mb: 2 
                                        }}
                                    >
                                        {feature.icon}
                                    </Avatar>
                                    <Typography variant="h6" gutterBottom>
                                        {feature.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {feature.description}
                                    </Typography>
                                    <Chip 
                                        label={tabValue === index ? '当前' : '点击切换'} 
                                        size="small" 
                                        color={tabValue === index ? feature.color : 'default'}
                                        sx={{ mt: 1 }}
                                    />
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {/* AI功能选项卡 */}
                <Paper elevation={2}>
                    <Tabs 
                        value={tabValue} 
                        onChange={handleTabChange}
                        variant="fullWidth"
                        sx={{ borderBottom: 1, borderColor: 'divider' }}
                    >
                        <Tab 
                            icon={<PsychologyIcon />} 
                            label="学习助手" 
                            iconPosition="start"
                        />
                        <Tab 
                            icon={<SmartToyIcon />} 
                            label="智能练习" 
                            iconPosition="start"
                        />
                        <Tab 
                            icon={<RouteIcon />} 
                            label="学习路径" 
                            iconPosition="start"
                        />
                        <Tab 
                            icon={<CompanionIcon />} 
                            label="学习伙伴" 
                            iconPosition="start"
                        />
                    </Tabs>

                    {/* 选项卡内容 */}
                    <TabPanel value={tabValue} index={0}>
                        <StudyAssistant 
                            studentId={currentUser?._id} 
                            subject={currentUser?.sclassName?.subName}
                        />
                    </TabPanel>

                    <TabPanel value={tabValue} index={1}>
                        <PracticeAssistant 
                            studentId={currentUser?._id} 
                            subject={currentUser?.sclassName?.subName}
                        />
                    </TabPanel>

                    <TabPanel value={tabValue} index={2}>
                        <LearningPath 
                            studentId={currentUser?._id} 
                            subject={currentUser?.sclassName?.subName}
                        />
                    </TabPanel>

                    <TabPanel value={tabValue} index={3}>
                        <LearningCompanion 
                            studentId={currentUser?._id}
                        />
                    </TabPanel>
                </Paper>
            </Box>
        </Container>
    );
};

export default StudentAIAssistant;
