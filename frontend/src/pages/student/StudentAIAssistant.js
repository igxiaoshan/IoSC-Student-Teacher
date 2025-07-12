import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Tabs,
    Tab,
    Container
} from '@mui/material';
import StudyAssistant from '../../components/AiComponents/StudyAssistant';
import PracticeAssistant from '../../components/AiComponents/PracticeAssistant';
import LearningPath from '../../components/AiComponents/LearningPath';
import LearningCompanion from '../../components/AiComponents/LearningCompanion';

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`ai-tabpanel-${index}`}
            aria-labelledby={`ai-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

function a11yProps(index) {
    return {
        id: `ai-tab-${index}`,
        'aria-controls': `ai-tabpanel-${index}`,
    };
}

const StudentAIAssistant = () => {
    const [value, setValue] = useState(0);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    return (
        <Container maxWidth="xl">
            <Box sx={{ width: '100%', typography: 'body1' }}>
                <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
                    AI学习助手
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                    欢迎使用AI学习助手！这里提供了多种AI工具来帮助你更好地学习。
                </Typography>

                <Paper sx={{ width: '100%' }}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={value} onChange={handleChange} aria-label="AI助手功能">
                            <Tab label="学习助手" {...a11yProps(0)} />
                            <Tab label="练习助手" {...a11yProps(1)} />
                            <Tab label="学习路径" {...a11yProps(2)} />
                            <Tab label="学习伙伴" {...a11yProps(3)} />
                        </Tabs>
                    </Box>
                    <TabPanel value={value} index={0}>
                        <StudyAssistant />
                    </TabPanel>
                    <TabPanel value={value} index={1}>
                        <PracticeAssistant />
                    </TabPanel>
                    <TabPanel value={value} index={2}>
                        <LearningPath />
                    </TabPanel>
                    <TabPanel value={value} index={3}>
                        <LearningCompanion />
                    </TabPanel>
                </Paper>
            </Box>
        </Container>
    );
};

export default StudentAIAssistant;
