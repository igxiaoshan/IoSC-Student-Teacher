import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { getSubjectList } from '../../redux/sclassRelated/sclassHandle';
import {
    BottomNavigation, BottomNavigationAction, Container, Paper, Table, TableBody, TableHead, Typography,
    Card, CardContent, CardActions, Box, Grid, LinearProgress, Chip, Avatar, List, ListItem, ListItemText,
    ListItemIcon, ListItemAvatar, Collapse, IconButton, Divider, Tooltip, Skeleton, Tab, Tabs, Button, Badge, Alert
} from '@mui/material';
import { getUserDetails } from '../../redux/userRelated/userHandle';
import CustomBarChart from '../../components/CustomBarChart';
import { safeGet } from '../../utils/safeAccess';
import { useTranslation } from '../../hooks/useTranslation';
import { studentAPI } from '../../utils/apiClient';
import { SubjectTimeline } from '../../components/student';

import InsertChartIcon from '@mui/icons-material/InsertChart';
import InsertChartOutlinedIcon from '@mui/icons-material/InsertChartOutlined';
import TableChartIcon from '@mui/icons-material/TableChart';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import SchoolIcon from '@mui/icons-material/School';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import HistoryIcon from '@mui/icons-material/History';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import VideocamIcon from '@mui/icons-material/Videocam';
import DescriptionIcon from '@mui/icons-material/Description';
import ImageIcon from '@mui/icons-material/Image';
import LinkIcon from '@mui/icons-material/Link';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { StyledTableCell, StyledTableRow } from '../../components/styles';

// 学习风格图标和标签映射
const useLearningStyleConfig = (tStudent) => ({
    visual: { icon: <VisibilityIcon />, label: tStudent('visualLearner'), color: 'primary', description: tStudent('visualPriority') },
    auditory: { icon: <PlayArrowIcon />, label: tStudent('auditoryLearner'), color: 'secondary', description: tStudent('auditoryPriority') },
    reading: { icon: <MenuBookIcon />, label: tStudent('readingLearner'), color: 'success', description: tStudent('readingPriority') },
    kinesthetic: { icon: <SchoolIcon />, label: tStudent('kinestheticLearner'), color: 'warning', description: tStudent('kinestheticPriority') }
});

// 难度配置
const useDifficultyConfig = (tStudent) => ({
    beginner: { label: tStudent('beginner'), color: 'success' },
    intermediate: { label: tStudent('intermediate'), color: 'warning' },
    advanced: { label: tStudent('advanced'), color: 'error' }
});

// 资源类型图标
const RESOURCE_TYPE_ICONS = {
    video: <VideocamIcon fontSize="small" />,
    document: <DescriptionIcon fontSize="small" />,
    image: <ImageIcon fontSize="small" />,
    link: <LinkIcon fontSize="small" />
};

// 科目卡片组件
const SubjectCard = ({ subject, marks, progress, onClick, expanded, onExpand, timeline, timelineLoading, nextCourse }) => {
    const { tStudent, tSubject } = useTranslation();
    const LEARNING_STYLE_CONFIG = useLearningStyleConfig(tStudent);
    const DIFFICULTY_CONFIG = useDifficultyConfig(tStudent);

    const subjectName = safeGet(subject, 'subName', tStudent('unknownSubject'));
    const subjectCode = safeGet(subject, 'subCode', '');
    const sessions = safeGet(subject, 'sessions', 0);
    const marksObtained = marks?.marksObtained || 0;
    const maxMarks = 100;

    // 学习偏好信息
    const preferenceInfo = subject.preferenceInfo || {};
    const learningStyle = preferenceInfo.learningStyle || 'visual';
    const difficulty = preferenceInfo.difficulty || 'intermediate';
    const styleConfig = LEARNING_STYLE_CONFIG[learningStyle] || LEARNING_STYLE_CONFIG.visual;
    const difficultyConfig = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.intermediate;

    // 排序后的资源
    const sortedResources = subject.sortedResources || [];
    const filteredResources = subject.filteredResources || sortedResources;

    // 根据成绩计算颜色
    const getScoreColor = (score) => {
        if (score >= 85) return 'success';
        if (score >= 60) return 'warning';
        return 'error';
    };

    // 知识点数据（模拟）
    const knowledgePoints = [
        { name: tStudent('basicConcepts'), mastery: 85, status: 'mastered' },
        { name: tStudent('corePrinciples'), mastery: 70, status: 'learning' },
        { name: tStudent('applicationPractice'), mastery: 45, status: 'weak' },
        { name: tStudent('comprehensiveApplication'), mastery: 30, status: 'weak' }
    ];

    return (
        <Card sx={{ mb: 2, cursor: 'pointer', transition: 'all 0.2s', '&:hover': { boxShadow: 4 } }} onClick={onClick}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ bgcolor: `${getScoreColor(marksObtained)}.light`, mr: 2 }}>
                            <SchoolIcon />
                        </Avatar>
                        <Box>
                            <Typography variant="h6">{subjectName}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {subjectCode} · {sessions}{tStudent('sessions')}
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h4" color={`${getScoreColor(marksObtained)}.main`}>
                            {marksObtained}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">{tStudent('points')}</Typography>
                    </Box>
                </Box>

                {/* 学习偏好状态 */}
                <Box sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Tooltip title={tStudent('learningStyleLabel', { style: styleConfig.description })}>
                        <Chip
                            icon={styleConfig.icon}
                            label={styleConfig.label}
                            size="small"
                            color={styleConfig.color}
                            variant="outlined"
                        />
                    </Tooltip>
                    <Tooltip title={tStudent('difficultyLabel', { level: '' })}>
                        <Chip
                            label={tStudent('difficultyLabel', { level: difficultyConfig.label })}
                            size="small"
                            color={difficultyConfig.color}
                        />
                    </Tooltip>
                    {sortedResources.length > 0 && (
                        <Tooltip title={tStudent('totalResources', { count: preferenceInfo.totalResources || sortedResources.length })}>
                            <Chip
                                label={tStudent('resourceCount', { count: sortedResources.length })}
                                size="small"
                                variant="outlined"
                            />
                        </Tooltip>
                    )}
                </Box>

                {/* 进度条 */}
                <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">{tStudent('learningProgress')}</Typography>
                        <Typography variant="body2" color="text.secondary">{progress || 65}%</Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={progress || 65}
                        color={getScoreColor(marksObtained)}
                        sx={{ height: 8, borderRadius: 4 }}
                    />
                </Box>

                {/* 资源类型分布 */}
                {preferenceInfo.resourceTypeDistribution && (
                    <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
                        {Object.entries(preferenceInfo.resourceTypeDistribution).map(([type, count]) => (
                            count > 0 && (
                                <Box key={type} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    {RESOURCE_TYPE_ICONS[type]}
                                    <Typography variant="caption" color="text.secondary">{count}</Typography>
                                </Box>
                            )
                        ))}
                    </Box>
                )}

                {/* 知识点概览 */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                    {knowledgePoints.slice(0, 3).map((kp, idx) => (
                        <Chip
                            key={idx}
                            label={kp.name}
                            size="small"
                            color={kp.status === 'mastered' ? 'success' : kp.status === 'learning' ? 'primary' : 'warning'}
                            variant={kp.status === 'weak' ? 'outlined' : 'filled'}
                            icon={kp.status === 'mastered' ? <CheckCircleIcon /> : kp.status === 'weak' ? <WarningIcon /> : null}
                        />
                    ))}
                </Box>
            </CardContent>

            <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {marksObtained >= 85 ? (
                        <Chip icon={<TrendingUpIcon />} label={tStudent('excellentPerformance')} color="success" size="small" />
                    ) : marksObtained >= 60 ? (
                        <Chip icon={<TrendingUpIcon />} label={tStudent('keepWorking')} color="primary" size="small" />
                    ) : (
                        <Chip icon={<TrendingDownIcon />} label={tStudent('needStrengthen')} color="warning" size="small" />
                    )}
                </Box>
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); onExpand(); }}>
                    {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
            </CardActions>

            {/* 展开的详细信息 */}
            <Collapse in={expanded}>
                <Divider />
                <CardContent>
                    {/* 学习时间线 */}
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <HistoryIcon fontSize="small" color="primary" />
                            {tStudent('recentLearningRecords')}
                        </Typography>
                        <SubjectTimeline
                            records={timeline || []}
                            nextCourse={nextCourse}
                            loading={timelineLoading}
                            subjectId={subject?._id}
                        />
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="subtitle2" gutterBottom>{tStudent('knowledgeMasteryDetails')}</Typography>
                    <List dense>
                        {knowledgePoints.map((kp, idx) => (
                            <ListItem key={idx} sx={{ px: 0 }}>
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                    {kp.status === 'mastered' ? (
                                        <CheckCircleIcon color="success" fontSize="small" />
                                    ) : kp.status === 'weak' ? (
                                        <WarningIcon color="warning" fontSize="small" />
                                    ) : (
                                        <PlayArrowIcon color="primary" fontSize="small" />
                                    )}
                                </ListItemIcon>
                                <ListItemText
                                    primary={kp.name}
                                    secondary={
                                        <LinearProgress
                                            variant="determinate"
                                            value={kp.mastery}
                                            sx={{ height: 4, borderRadius: 2, mt: 0.5 }}
                                            color={kp.mastery >= 80 ? 'success' : kp.mastery >= 50 ? 'primary' : 'warning'}
                                        />
                                    }
                                />
                                <Typography variant="body2" color="text.secondary">{kp.mastery}%</Typography>
                            </ListItem>
                        ))}
                    </List>

                    {/* 按偏好排序的资源列表 */}
                    {filteredResources.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {styleConfig.icon}
                                {tStudent('learningResources')} ({styleConfig.description})
                            </Typography>
                            <List dense>
                                {filteredResources.slice(0, 5).map((resource, idx) => (
                                    <ListItem key={idx || resource.id} sx={{ px: 0 }}>
                                        <ListItemIcon sx={{ minWidth: 36 }}>
                                            {RESOURCE_TYPE_ICONS[resource.type] || <LinkIcon fontSize="small" />}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={resource.title}
                                            secondary={resource.description || resource.type}
                                            primaryTypographyProps={{ variant: 'body2' }}
                                        />
                                        <Chip
                                            label={DIFFICULTY_CONFIG[resource.difficulty]?.label || tStudent('intermediate')}
                                            size="small"
                                            color={(DIFFICULTY_CONFIG[resource.difficulty]?.color) || 'warning'}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                            {filteredResources.length > 5 && (
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                                    {tStudent('moreResources', { count: filteredResources.length - 5 })}
                                </Typography>
                            )}
                        </Box>
                    )}
                </CardContent>
            </Collapse>
        </Card>
    );
};

// 最近练习记录组件
const RecentPracticeList = ({ practices, loading }) => {
    const { tStudent } = useTranslation();

    if (loading) {
        return <Box>{[1, 2, 3].map(i => <Skeleton key={i} height={60} sx={{ mb: 1 }} />)}</Box>;
    }

    const defaultPractices = [
        { id: 1, subject: tStudent('subject') || '数学', topic: tStudent('basicConcepts'), score: 85, time: tStudent('today'), correct: 17, total: 20 },
        { id: 2, subject: tStudent('subject') || '英语', topic: tStudent('corePrinciples'), score: 72, time: tStudent('yesterday'), correct: 18, total: 25 },
        { id: 3, subject: tStudent('subject') || '物理', topic: tStudent('applicationPractice'), score: 90, time: tStudent('daysAgo', { count: 2 }), correct: 9, total: 10 }
    ];

    const items = practices || defaultPractices;

    return (
        <Card>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <HistoryIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">{tStudent('recentPractice')}</Typography>
                </Box>
                <List dense>
                    {items.map((practice, index) => (
                        <React.Fragment key={practice.id}>
                            <ListItem sx={{ px: 0 }}
                                secondaryAction={
                                    <Box sx={{ textAlign: 'right' }}>
                                        <Typography variant="body2" fontWeight="bold" color={practice.score >= 80 ? 'success.main' : 'warning.main'}>
                                            {practice.score}{tStudent('points')}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">{practice.time}</Typography>
                                    </Box>
                                }
                            >
                                <ListItemAvatar>
                                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light' }}>
                                        {practice.subject.charAt(0)}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={practice.topic}
                                    secondary={`${practice.subject} · ${tStudent('correctRatio', { correct: practice.correct, total: practice.total })}`}
                                    primaryTypographyProps={{ variant: 'body2' }}
                                />
                            </ListItem>
                            {index < items.length - 1 && <Divider />}
                        </React.Fragment>
                    ))}
                </List>
            </CardContent>
        </Card>
    );
};

// AI 学习推荐组件
const AIRecommendations = ({ recommendations, loading }) => {
    const { tStudent } = useTranslation();

    const defaultRecs = [
        {
            id: 1,
            type: 'weakness',
            title: tStudent('weakPointsAlert'),
            description: tStudent('tipDailyReview'),
            priority: 'high',
            action: tStudent('startLearning')
        },
        {
            id: 2,
            type: 'suggestion',
            title: tStudent('learningGoals'),
            description: tStudent('tipVocabulary'),
            priority: 'medium',
            action: tStudent('keepWorking')
        },
        {
            id: 3,
            type: 'preview',
            title: tStudent('learningPath'),
            description: tStudent('tipStudyHours'),
            priority: 'low',
            action: tStudent('startLearning')
        }
    ];

    const items = recommendations || defaultRecs;

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'error';
            case 'medium': return 'warning';
            default: return 'info';
        }
    };

    const getPriorityLabel = (priority) => {
        switch (priority) {
            case 'high': return tStudent('important');
            case 'medium': return tStudent('suggested');
            default: return tStudent('optional');
        }
    };

    return (
        <Card>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AutoAwesomeIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">{tStudent('aiRecommendations')}</Typography>
                </Box>
                {loading ? (
                    <Box>{[1, 2, 3].map(i => <Skeleton key={i} height={80} sx={{ mb: 1 }} />)}</Box>
                ) : (
                    <Box>
                        {items.map((rec, index) => (
                            <Box key={rec.id} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        {rec.type === 'weakness' && <WarningIcon color="error" sx={{ mr: 1 }} fontSize="small" />}
                                        {rec.type === 'suggestion' && <LightbulbIcon color="warning" sx={{ mr: 1 }} fontSize="small" />}
                                        {rec.type === 'preview' && <SchoolIcon color="info" sx={{ mr: 1 }} fontSize="small" />}
                                        <Typography variant="subtitle2">{rec.title}</Typography>
                                    </Box>
                                    <Chip label={getPriorityLabel(rec.priority)} size="small" color={getPriorityColor(rec.priority)} />
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    {rec.description}
                                </Typography>
                                <Button size="small" variant="outlined" color="primary">
                                    {rec.action}
                                </Button>
                            </Box>
                        ))}
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

// 薄弱知识点提示组件
const WeakPointsAlert = ({ weakPoints }) => {
    const { tStudent } = useTranslation();
    if (!weakPoints || weakPoints.length === 0) return null;

    return (
        <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>{tStudent('weakPointsAlert')}</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {weakPoints.map((wp, idx) => (
                    <Chip key={idx} label={wp} size="small" color="warning" variant="outlined" />
                ))}
            </Box>
        </Alert>
    );
};

const StudentSubjects = () => {
    const dispatch = useDispatch();
    const { tStudent, tSubject, tCommon } = useTranslation();
    const { subjectsList, sclassDetails } = useSelector((state) => state.sclass);
    const { userDetails, currentUser, loading, response, error } = useSelector((state) => state.user);

    const [subjectMarks, setSubjectMarks] = useState([]);
    const [selectedSection, setSelectedSection] = useState('cards');
    const [expandedSubject, setExpandedSubject] = useState(null);
    const [subjectProgress, setSubjectProgress] = useState({});
    const [recentPractices, setRecentPractices] = useState(null);
    const [recommendations, setRecommendations] = useState(null);
    const [dataLoading, setDataLoading] = useState(false);
    const [tabValue, setTabValue] = useState(0);
    const [subjectTimelines, setSubjectTimelines] = useState({});
    const [timelinesLoading, setTimelinesLoading] = useState({});

    useEffect(() => {
        dispatch(getUserDetails(currentUser._id, "Student"));
        fetchSubjectData();
    }, [dispatch, currentUser._id])

    const fetchSubjectData = async () => {
        setDataLoading(true);
        try {
            const studentId = currentUser._id;
            const stats = await studentAPI.getStatistics(studentId, { period: 'month' });
            setSubjectProgress(stats?.subjectProgress || {});
            setRecentPractices(stats?.recentPractices || null);
            setRecommendations(stats?.recommendations || null);
        } catch (err) {
            console.log('Subject data fetch error:', err);
        } finally {
            setDataLoading(false);
        }
    };

    if (response) { console.log(response) }
    else if (error) { console.log(error) }

    useEffect(() => {
        if (userDetails) {
            setSubjectMarks(userDetails.examResult || []);
        }
    }, [userDetails])

    useEffect(() => {
        const classId = safeGet(currentUser, 'sclassName._id');
        if (subjectMarks.length === 0 && classId) {
            dispatch(getSubjectList(classId, "ClassSubjects"));
        }
    }, [subjectMarks, dispatch, currentUser]);

    const handleSectionChange = (event, newSection) => {
        setSelectedSection(newSection);
    };

    const handleSubjectExpand = (subjectId) => {
        const newExpanded = expandedSubject === subjectId ? null : subjectId;
        setExpandedSubject(newExpanded);

        // 展开时加载该科目的学习记录
        if (newExpanded !== null) {
            fetchSubjectTimeline(subjectId);
        }
    };

    const fetchSubjectTimeline = async (subjectIndex) => {
        const result = subjectMarks[subjectIndex];
        if (!result) return;

        const subjectId = safeGet(result, 'subName._id');
        if (!subjectId || subjectTimelines[subjectId]) return;

        setTimelinesLoading(prev => ({ ...prev, [subjectId]: true }));
        try {
            const timelineData = await studentAPI.getSubjectTimeline(currentUser._id, subjectId);
            setSubjectTimelines(prev => ({
                ...prev,
                [subjectId]: timelineData?.records || []
            }));
        } catch (err) {
            console.log('Timeline fetch error:', err);
            // 使用模拟数据
            setSubjectTimelines(prev => ({
                ...prev,
                [subjectId]: [
                    { _id: '1', type: 'practice', title: '完成练习', time: new Date(Date.now() - 3600000), score: 85 },
                    { _id: '2', type: 'learn', title: '观看视频', time: new Date(Date.now() - 86400000) },
                    { _id: '3', type: 'homework', title: '提交作业', time: new Date(Date.now() - 172800000), score: 78 }
                ]
            }));
        } finally {
            setTimelinesLoading(prev => ({ ...prev, [subjectId]: false }));
        }
    };

    // 获取薄弱知识点
    const weakPoints = subjectMarks
        .filter(m => m.marksObtained < 70)
        .map(m => safeGet(m, 'subName.subName', ''))
        .filter(Boolean);

    const renderCardsSection = () => {
        return (
            <Container maxWidth="lg" sx={{ mt: 3, mb: 10 }}>
                {/* 薄弱知识点提醒 */}
                <WeakPointsAlert weakPoints={weakPoints} />

                <Grid container spacing={3}>
                    {/* 左侧 - 科目卡片 */}
                    <Grid item xs={12} md={8}>
                        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                            <SchoolIcon color="primary" sx={{ mr: 1 }} />
                            {tStudent('mySubjects')}
                        </Typography>

                        {subjectMarks && subjectMarks.length > 0 ? (
                            subjectMarks.map((result, index) => {
                                if (!result.subName) return null;
                                const subjectId = safeGet(result, 'subName._id');
                                return (
                                    <SubjectCard
                                        key={index}
                                        subject={result.subName}
                                        marks={result}
                                        progress={subjectProgress[subjectId] || Math.floor(Math.random() * 40 + 40)}
                                        expanded={expandedSubject === index}
                                        onExpand={() => handleSubjectExpand(index)}
                                        onClick={() => handleSubjectExpand(index)}
                                        timeline={subjectTimelines[subjectId] || []}
                                        timelineLoading={timelinesLoading[subjectId] || false}
                                        nextCourse={null}
                                    />
                                );
                            })
                        ) : (
                            <Card sx={{ p: 3, textAlign: 'center' }}>
                                <Typography color="text.secondary">{tStudent('noSubjectGrades')}</Typography>
                            </Card>
                        )}
                    </Grid>

                    {/* 右侧 - 练习记录和推荐 */}
                    <Grid item xs={12} md={4}>
                        <Box sx={{ mb: 3 }}>
                            <RecentPracticeList practices={recentPractices} loading={dataLoading} />
                        </Box>
                        <AIRecommendations recommendations={recommendations} loading={dataLoading} />
                    </Grid>
                </Grid>
            </Container>
        );
    };

    const renderTableSection = () => {
        return (
            <>
                <Typography variant="h4" align="center" gutterBottom>
                    {tSubject('subjectList') || tSubject('subjectName')}
                </Typography>
                <Table>
                    <TableHead>
                        <StyledTableRow>
                            <StyledTableCell>{tSubject('subjectName')}</StyledTableCell>
                            <StyledTableCell>{tStudent('avgScore')}</StyledTableCell>
                            <StyledTableCell>{tCommon('status')}</StyledTableCell>
                        </StyledTableRow>
                    </TableHead>
                    <TableBody>
                        {subjectMarks.map((result, index) => {
                            if (!result.subName || !result.marksObtained) {
                                return null;
                            }
                            const score = result.marksObtained;
                            return (
                                <StyledTableRow key={index}>
                                    <StyledTableCell>{safeGet(result, 'subName.subName', tStudent('unknownSubject'))}</StyledTableCell>
                                    <StyledTableCell>
                                        <Typography
                                            color={score >= 85 ? 'success.main' : score >= 60 ? 'warning.main' : 'error.main'}
                                            fontWeight="bold"
                                        >
                                            {score}
                                        </Typography>
                                    </StyledTableCell>
                                    <StyledTableCell>
                                        <Chip
                                            label={score >= 85 ? tStudent('excellent') : score >= 60 ? tStudent('pass') : tStudent('needImprove')}
                                            size="small"
                                            color={score >= 85 ? 'success' : score >= 60 ? 'warning' : 'error'}
                                        />
                                    </StyledTableCell>
                                </StyledTableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </>
        );
    };

    const renderChartSection = () => {
        return <CustomBarChart chartData={subjectMarks} dataKey="marksObtained" />;
    };

    const renderClassDetailsSection = () => {
        return (
            <Container>
                <Typography variant="h4" align="center" gutterBottom>
                    {tStudent('classDetails')}
                </Typography>
                <Typography variant="h5" gutterBottom>
                    {tStudent('currentClass')} {safeGet(sclassDetails, 'sclassName', tStudent('unassignedClass'))}
                </Typography>
                <Typography variant="h6" gutterBottom>
                    {tStudent('theseAreSubjects')}:
                </Typography>
                {subjectsList && Array.isArray(subjectsList) &&
                    subjectsList.map((subject, index) => (
                        <Card key={index} sx={{ mb: 1, p: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.light' }}>
                                        <SchoolIcon fontSize="small" />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="subtitle1">
                                            {safeGet(subject, 'subName', tStudent('unknownSubject'))}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {safeGet(subject, 'subCode', tStudent('noCode'))} · {safeGet(subject, 'sessions', 0)}{tStudent('sessions')}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Button size="small" variant="outlined">{tStudent('startLearning')}</Button>
                            </Box>
                        </Card>
                    ))}
            </Container>
        );
    };

    return (
        <>
            {loading ? (
                <Box sx={{ p: 3 }}>
                    <Skeleton variant="rectangular" height={100} sx={{ mb: 2 }} />
                    <Skeleton variant="rectangular" height={200} />
                </Box>
            ) : (
                <div>
                    {subjectMarks && Array.isArray(subjectMarks) && subjectMarks.length > 0
                        ?
                        (<>
                            {selectedSection === 'cards' && renderCardsSection()}
                            {selectedSection === 'table' && renderTableSection()}
                            {selectedSection === 'chart' && renderChartSection()}

                            <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
                                <BottomNavigation value={selectedSection} onChange={handleSectionChange} showLabels>
                                    <BottomNavigationAction
                                        label={tStudent('cardView') || '卡片'}
                                        value="cards"
                                        icon={<SchoolIcon />}
                                    />
                                    <BottomNavigationAction
                                        label={tStudent('tableView') || '表格'}
                                        value="table"
                                        icon={selectedSection === 'table' ? <TableChartIcon /> : <TableChartOutlinedIcon />}
                                    />
                                    <BottomNavigationAction
                                        label={tStudent('chartView') || '图表'}
                                        value="chart"
                                        icon={selectedSection === 'chart' ? <InsertChartIcon /> : <InsertChartOutlinedIcon />}
                                    />
                                </BottomNavigation>
                            </Paper>
                        </>)
                        :
                        (<>
                            {renderClassDetailsSection()}
                        </>)
                    }
                </div>
            )}
        </>
    );
};

export default StudentSubjects;
