import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { getSubjectList } from '../../redux/sclassRelated/sclassHandle';
import {
    BottomNavigation, BottomNavigationAction, Container, Paper, Table, TableBody, TableHead, Typography,
    Card, CardContent, CardActions, Box, Grid, LinearProgress, Chip, Avatar, List, ListItem, ListItemText,
    ListItemIcon, Collapse, IconButton, Divider, Tooltip, Skeleton, Tab, Tabs, Button, Badge
} from '@mui/material';
import { getUserDetails } from '../../redux/userRelated/userHandle';
import CustomBarChart from '../../components/CustomBarChart';
import { safeGet } from '../../utils/safeAccess';
import { useTranslation } from '../../hooks/useTranslation';
import { studentAPI } from '../../utils/apiClient';

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
import { StyledTableCell, StyledTableRow } from '../../components/styles';

// 科目卡片组件
const SubjectCard = ({ subject, marks, progress, onClick, expanded, onExpand }) => {
    const { tSubject } = useTranslation();

    const subjectName = safeGet(subject, 'subName', '未知科目');
    const subjectCode = safeGet(subject, 'subCode', '');
    const sessions = safeGet(subject, 'sessions', 0);
    const marksObtained = marks?.marksObtained || 0;
    const maxMarks = 100;

    // 根据成绩计算颜色
    const getScoreColor = (score) => {
        if (score >= 85) return 'success';
        if (score >= 60) return 'warning';
        return 'error';
    };

    // 知识点数据（模拟）
    const knowledgePoints = [
        { name: '基础概念', mastery: 85, status: 'mastered' },
        { name: '核心原理', mastery: 70, status: 'learning' },
        { name: '应用实践', mastery: 45, status: 'weak' },
        { name: '综合运用', mastery: 30, status: 'weak' }
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
                                {subjectCode} · {sessions}课时
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h4" color={`${getScoreColor(marksObtained)}.main`}>
                            {marksObtained}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">分</Typography>
                    </Box>
                </Box>

                {/* 进度条 */}
                <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">学习进度</Typography>
                        <Typography variant="body2" color="text.secondary">{progress || 65}%</Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={progress || 65}
                        color={getScoreColor(marksObtained)}
                        sx={{ height: 8, borderRadius: 4 }}
                    />
                </Box>

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
                        <Chip icon={<TrendingUpIcon />} label="表现优秀" color="success" size="small" />
                    ) : marksObtained >= 60 ? (
                        <Chip icon={<TrendingUpIcon />} label="继续努力" color="primary" size="small" />
                    ) : (
                        <Chip icon={<TrendingDownIcon />} label="需要加强" color="warning" size="small" />
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
                    <Typography variant="subtitle2" gutterBottom>知识点掌握详情</Typography>
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
        { id: 1, subject: '数学', topic: '二次函数', score: 85, time: '今天 14:30', correct: 17, total: 20 },
        { id: 2, subject: '英语', topic: '词汇练习', score: 72, time: '昨天 16:00', correct: 18, total: 25 },
        { id: 3, subject: '物理', topic: '力学基础', score: 90, time: '前天 10:15', correct: 9, total: 10 }
    ];

    const items = practices || defaultPractices;

    return (
        <Card>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <HistoryIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">{tStudent('recentPractice') || '最近练习'}</Typography>
                </Box>
                <List dense>
                    {items.map((practice, index) => (
                        <React.Fragment key={practice.id}>
                            <ListItem sx={{ px: 0 }}
                                secondaryAction={
                                    <Box sx={{ textAlign: 'right' }}>
                                        <Typography variant="body2" fontWeight="bold" color={practice.score >= 80 ? 'success.main' : 'warning.main'}>
                                            {practice.score}分
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
                                    secondary={`${practice.subject} · ${practice.correct}/${practice.total}正确`}
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
            title: '重点复习：物理力学',
            description: '根据练习记录，力学部分正确率较低，建议多做相关练习',
            priority: 'high',
            action: '开始练习'
        },
        {
            id: 2,
            type: 'suggestion',
            title: '巩固英语词汇',
            description: '词汇量已达到本周目标的80%，继续加油！',
            priority: 'medium',
            action: '继续学习'
        },
        {
            id: 3,
            type: 'preview',
            title: '预习数学新章节',
            description: '建议提前了解三角函数的基础概念',
            priority: 'low',
            action: '开始预习'
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

    return (
        <Card>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AutoAwesomeIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">{tStudent('aiRecommendations') || 'AI学习推荐'}</Typography>
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
                                    <Chip label={rec.priority === 'high' ? '重要' : rec.priority === 'medium' ? '建议' : '可选'} size="small" color={getPriorityColor(rec.priority)} />
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
    if (!weakPoints || weakPoints.length === 0) return null;

    return (
        <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>薄弱知识点提醒</Typography>
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
        setExpandedSubject(expandedSubject === subjectId ? null : subjectId);
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
                            {tSubject('mySubjects') || '我的科目'}
                        </Typography>

                        {subjectMarks && subjectMarks.length > 0 ? (
                            subjectMarks.map((result, index) => {
                                if (!result.subName) return null;
                                return (
                                    <SubjectCard
                                        key={index}
                                        subject={result.subName}
                                        marks={result}
                                        progress={subjectProgress[safeGet(result, 'subName._id')] || Math.floor(Math.random() * 40 + 40)}
                                        expanded={expandedSubject === index}
                                        onExpand={() => handleSubjectExpand(index)}
                                        onClick={() => handleSubjectExpand(index)}
                                    />
                                );
                            })
                        ) : (
                            <Card sx={{ p: 3, textAlign: 'center' }}>
                                <Typography color="text.secondary">暂无科目成绩记录</Typography>
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
                    {tSubject('subjects') || '科目'}
                </Typography>
                <Table>
                    <TableHead>
                        <StyledTableRow>
                            <StyledTableCell>{tSubject('subjectName') || '课程名称'}</StyledTableCell>
                            <StyledTableCell>{tSubject('score') || '成绩'}</StyledTableCell>
                            <StyledTableCell>{tSubject('status') || '状态'}</StyledTableCell>
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
                                    <StyledTableCell>{safeGet(result, 'subName.subName', '未知科目')}</StyledTableCell>
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
                                            label={score >= 85 ? '优秀' : score >= 60 ? '及格' : '需加强'}
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
                    {tStudent('classDetails') || '班级详情'}
                </Typography>
                <Typography variant="h5" gutterBottom>
                    {tStudent('currentClass') || '你目前在班级'} {safeGet(sclassDetails, 'sclassName', '未分配班级')}
                </Typography>
                <Typography variant="h6" gutterBottom>
                    {tStudent('theseAreSubjects') || '这些是科目'}:
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
                                            {safeGet(subject, 'subName', '未知科目')}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {safeGet(subject, 'subCode', '无代码')} · {safeGet(subject, 'sessions', 0)}课时
                                        </Typography>
                                    </Box>
                                </Box>
                                <Button size="small" variant="outlined">开始学习</Button>
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
