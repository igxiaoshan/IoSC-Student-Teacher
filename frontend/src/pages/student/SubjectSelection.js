import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    CardActions,
    Button,
    Chip,
    Box,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Tabs,
    Tab,
    CircularProgress,
    Divider
} from '@mui/material';
import {
    School as SchoolIcon,
    Add as AddIcon,
    Remove as RemoveIcon,
    Settings as SettingsIcon,
    AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { safeGet } from '../../utils/safeAccess';
import Popup from '../../components/Popup';

const SubjectSelection = () => {
    const { currentUser } = useSelector(state => state.user);
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [availableSubjects, setAvailableSubjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [tabValue, setTabValue] = useState(0);
    const [showPreferencesDialog, setShowPreferencesDialog] = useState(false);
    const [currentSubject, setCurrentSubject] = useState(null);
    const [preferences, setPreferences] = useState({
        difficulty: 'intermediate',
        studyGoals: '',
        preferredLearningStyle: 'visual'
    });
    const [showPopup, setShowPopup] = useState(false);
    const [message, setMessage] = useState('');

    const studentId = safeGet(currentUser, '_id');

    useEffect(() => {
        if (studentId) {
            fetchStudentSubjects();
            fetchAvailableSubjects();
        }
    }, [studentId]);

    const fetchStudentSubjects = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/student/${studentId}/subjects`);
            if (response.data.success) {
                setSelectedSubjects(response.data.data.subjects);
            }
        } catch (error) {
            console.error('获取学生科目失败:', error);
            setMessage('获取学生科目失败');
            setShowPopup(true);
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableSubjects = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/student/${studentId}/subjects/available`);
            if (response.data.success) {
                setAvailableSubjects(response.data.data.subjects);
            }
        } catch (error) {
            console.error('获取可选科目失败:', error);
        }
    };

    const handleSelectSubject = async (subjectId) => {
        try {
            const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/student/${studentId}/subjects/select`, {
                subjectId,
                learningPreferences: preferences
            });
            
            if (response.data.success) {
                setMessage('科目选择成功！');
                setShowPopup(true);
                fetchStudentSubjects();
                fetchAvailableSubjects();
            }
        } catch (error) {
            setMessage('科目选择失败: ' + (error.response?.data?.message || error.message));
            setShowPopup(true);
        }
    };

    const handleUnselectSubject = async (subjectId) => {
        try {
            const response = await axios.delete(`${process.env.REACT_APP_BASE_URL}/student/${studentId}/subjects/${subjectId}`);
            
            if (response.data.success) {
                setMessage('取消选择成功！');
                setShowPopup(true);
                fetchStudentSubjects();
                fetchAvailableSubjects();
            }
        } catch (error) {
            setMessage('取消选择失败: ' + (error.response?.data?.message || error.message));
            setShowPopup(true);
        }
    };

    const handleAutoAssign = async () => {
        try {
            const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/student/${studentId}/subjects/auto-assign`);
            
            if (response.data.success) {
                setMessage(response.data.message);
                setShowPopup(true);
                fetchStudentSubjects();
                fetchAvailableSubjects();
            }
        } catch (error) {
            setMessage('自动分配失败: ' + (error.response?.data?.message || error.message));
            setShowPopup(true);
        }
    };

    const handleUpdatePreferences = async () => {
        try {
            const response = await axios.put(
                `${process.env.REACT_APP_BASE_URL}/student/${studentId}/subjects/${currentSubject._id}/preferences`,
                { learningPreferences: preferences }
            );
            
            if (response.data.success) {
                setMessage('学习偏好更新成功！');
                setShowPopup(true);
                setShowPreferencesDialog(false);
                fetchStudentSubjects();
            }
        } catch (error) {
            setMessage('更新失败: ' + (error.response?.data?.message || error.message));
            setShowPopup(true);
        }
    };

    const openPreferencesDialog = (subject) => {
        setCurrentSubject(subject);
        setPreferences(subject.learningPreferences || {
            difficulty: 'intermediate',
            studyGoals: '',
            preferredLearningStyle: 'visual'
        });
        setShowPreferencesDialog(true);
    };

    const getSubjectTypeColor = (type) => {
        switch (type) {
            case 'core': return 'primary';
            case 'elective': return 'secondary';
            case 'extracurricular': return 'info';
            default: return 'default';
        }
    };

    const getSubjectTypeText = (type) => {
        switch (type) {
            case 'core': return '核心课程';
            case 'elective': return '选修课程';
            case 'extracurricular': return '课外活动';
            default: return '其他';
        }
    };

    const renderSubjectCard = (subject, isSelected = false) => (
        <Card key={subject._id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" component="h3">
                        {subject.subName}
                    </Typography>
                    <Chip 
                        label={getSubjectTypeText(subject.subjectType)} 
                        color={getSubjectTypeColor(subject.subjectType)}
                        size="small"
                    />
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    课程代码: {subject.subCode}
                </Typography>
                
                {subject.description && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        {subject.description}
                    </Typography>
                )}
                
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <Chip label={`${subject.credits} 学分`} size="small" variant="outlined" />
                    {subject.isRequired && (
                        <Chip label="必修" color="error" size="small" />
                    )}
                    {isSelected && subject.source === 'class' && (
                        <Chip label="班级课程" color="info" size="small" />
                    )}
                </Box>

                {isSelected && subject.learningPreferences && (
                    <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                            学习偏好: {subject.learningPreferences.difficulty} | {subject.learningPreferences.preferredLearningStyle}
                        </Typography>
                    </Box>
                )}
            </CardContent>
            
            <CardActions>
                {isSelected ? (
                    <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                        <Button
                            size="small"
                            startIcon={<SettingsIcon />}
                            onClick={() => openPreferencesDialog(subject)}
                        >
                            设置偏好
                        </Button>
                        {!subject.isRequired && (
                            <Button
                                size="small"
                                color="error"
                                startIcon={<RemoveIcon />}
                                onClick={() => handleUnselectSubject(subject._id)}
                            >
                                取消选择
                            </Button>
                        )}
                    </Box>
                ) : (
                    <Button
                        size="small"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => handleSelectSubject(subject._id)}
                    >
                        选择课程
                    </Button>
                )}
            </CardActions>
        </Card>
    );

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <SchoolIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
                    <Typography variant="h4" component="h1">
                        我的课程管理
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="body1" color="text.secondary">
                        管理您的课程选择和学习偏好
                    </Typography>
                    <Button
                        variant="outlined"
                        startIcon={<AutoAwesomeIcon />}
                        onClick={handleAutoAssign}
                    >
                        自动分配班级课程
                    </Button>
                </Box>

                <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
                    <Tab label={`我的课程 (${selectedSubjects.length})`} />
                    <Tab label={`可选课程 (${availableSubjects.length})`} />
                </Tabs>

                {tabValue === 0 && (
                    <Box>
                        {selectedSubjects.length === 0 ? (
                            <Alert severity="info" sx={{ mb: 2 }}>
                                您还没有选择任何课程。点击"可选课程"标签页选择课程，或使用"自动分配班级课程"按钮。
                            </Alert>
                        ) : (
                            <Grid container spacing={3}>
                                {selectedSubjects.map(subject => (
                                    <Grid item xs={12} sm={6} md={4} key={subject._id}>
                                        {renderSubjectCard(subject, true)}
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </Box>
                )}

                {tabValue === 1 && (
                    <Box>
                        {availableSubjects.length === 0 ? (
                            <Alert severity="info">
                                暂无可选择的课程。
                            </Alert>
                        ) : (
                            <Grid container spacing={3}>
                                {availableSubjects.map(subject => (
                                    <Grid item xs={12} sm={6} md={4} key={subject._id}>
                                        {renderSubjectCard(subject, false)}
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </Box>
                )}
            </Paper>

            {/* 学习偏好设置对话框 */}
            <Dialog open={showPreferencesDialog} onClose={() => setShowPreferencesDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    设置学习偏好 - {currentSubject?.subName}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <FormControl fullWidth sx={{ mb: 3 }}>
                            <InputLabel>学习难度</InputLabel>
                            <Select
                                value={preferences.difficulty}
                                label="学习难度"
                                onChange={(e) => setPreferences(prev => ({ ...prev, difficulty: e.target.value }))}
                            >
                                <MenuItem value="beginner">初级</MenuItem>
                                <MenuItem value="intermediate">中级</MenuItem>
                                <MenuItem value="advanced">高级</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl fullWidth sx={{ mb: 3 }}>
                            <InputLabel>学习风格</InputLabel>
                            <Select
                                value={preferences.preferredLearningStyle}
                                label="学习风格"
                                onChange={(e) => setPreferences(prev => ({ ...prev, preferredLearningStyle: e.target.value }))}
                            >
                                <MenuItem value="visual">视觉学习</MenuItem>
                                <MenuItem value="auditory">听觉学习</MenuItem>
                                <MenuItem value="kinesthetic">动手学习</MenuItem>
                                <MenuItem value="reading">阅读学习</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            label="学习目标"
                            multiline
                            rows={3}
                            value={preferences.studyGoals}
                            onChange={(e) => setPreferences(prev => ({ ...prev, studyGoals: e.target.value }))}
                            placeholder="描述您在这门课程中的学习目标..."
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowPreferencesDialog(false)}>取消</Button>
                    <Button onClick={handleUpdatePreferences} variant="contained">保存</Button>
                </DialogActions>
            </Dialog>

            <Popup message={message} setShowPopup={setShowPopup} showPopup={showPopup} />
        </Container>
    );
};

export default SubjectSelection;
