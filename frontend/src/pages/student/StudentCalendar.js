import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Grid,
    Card,
    CardContent,
    List,
    ListItemText,
    ListItemIcon,
    Tooltip,
    CircularProgress,
    Badge,
    Avatar,
    Divider,
    Stack,
    ButtonGroup,
    Menu,
    ListItemButton,
    Switch,
    FormControlLabel,
    Skeleton,
    Slide
} from '@mui/material';
import {
    ChevronLeft,
    ChevronRight,
    Today,
    ViewWeek,
    ViewDay,
    Add,
    Event,
    School,
    Assignment,
    Quiz,
    Sync,
    Settings,
    FilterList,
    Search,
    MoreVert,
    CalendarMonth,
    Schedule,
    AutoAwesome,
    TrendingUp,
    CheckCircle,
    RadioButtonUnchecked,
    AccessTime,
    LocationOn,
    Close
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    startOfWeek,
    endOfWeek,
    addDays,
    isToday,
    isAfter,
    parseISO,
    formatDistanceToNow,
    startOfDay,
    endOfDay
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import axios from 'axios';
import { generateMockCalendarData, generateMockStatistics } from '../../utils/mockCalendarData';

const StudentCalendar = () => {
    const { currentUser } = useSelector(state => state.user);

    // 核心状态
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState('month');
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);

    // UI状态
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showEventDialog, setShowEventDialog] = useState(false);
    const [showAddEventDialog, setShowAddEventDialog] = useState(false);
    const [showAIDialog, setShowAIDialog] = useState(false);

    const [anchorEl, setAnchorEl] = useState(null);
    const [filterAnchorEl, setFilterAnchorEl] = useState(null);

    // 过滤和搜索状态
    const [searchTerm, setSearchTerm] = useState('');
    const [eventTypeFilter, setEventTypeFilter] = useState('all');
    const [showCompleted, setShowCompleted] = useState(false);

    // 统计数据
    const [statistics, setStatistics] = useState({});

    // 设置状态
    const [settings, setSettings] = useState({
        showWeekends: true,
        compactView: false,
        defaultReminder: 15,
        workingHours: { start: '08:00', end: '18:00' }
    });

    // 新事件表单状态
    const [newEvent, setNewEvent] = useState({
        title: '',
        description: '',
        eventType: 'study_plan',
        startTime: '',
        endTime: '',
        priority: 'medium',
        color: '#2196f3',
        location: '',
        reminders: [{ type: 'popup', minutesBefore: 15 }]
    });

    // AI学习计划状态
    const [aiPlanData, setAiPlanData] = useState({
        timeRange: 'week',
        goals: '',
        preferences: ''
    });

    // 计算过滤后的事件
    const filteredEvents = useMemo(() => {
        return events.filter(event => {
            // 搜索过滤
            if (searchTerm && !event.title.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false;
            }

            // 事件类型过滤
            if (eventTypeFilter !== 'all' && event.eventType !== eventTypeFilter) {
                return false;
            }

            // 完成状态过滤
            if (!showCompleted && event.status === 'completed') {
                return false;
            }

            return true;
        });
    }, [events, searchTerm, eventTypeFilter, showCompleted]);

    // 获取当前视图的日期范围
    const getViewDateRange = useCallback(() => {
        switch (view) {
            case 'week':
                return {
                    start: startOfWeek(currentDate, { weekStartsOn: 1 }),
                    end: endOfWeek(currentDate, { weekStartsOn: 1 })
                };
            case 'day':
                return {
                    start: startOfDay(currentDate),
                    end: endOfDay(currentDate)
                };
            default: // month
                return {
                    start: startOfMonth(currentDate),
                    end: endOfMonth(currentDate)
                };
        }
    }, [view, currentDate]);

    // 加载日历数据
    const loadCalendarData = useCallback(async () => {
        try {
            setLoading(true);
            const { start: startDate, end: endDate } = getViewDateRange();

            // 使用mock数据进行演示
            if (process.env.NODE_ENV === 'development' || !currentUser?._id) {
                // 生成mock数据
                const mockEvents = generateMockCalendarData(startDate, endDate);
                setEvents(mockEvents);
                return;
            }

            const response = await axios.get(
                `/student/${currentUser._id}/calendar?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&view=${view}`
            );

            if (response.data.success) {
                const eventsData = response.data.data.calendar.events || [];
                // 解析日期字符串为Date对象
                const parsedEvents = eventsData.map(event => ({
                    ...event,
                    startTime: parseISO(event.startTime),
                    endTime: parseISO(event.endTime)
                }));
                setEvents(parsedEvents);

                // 更新设置
                if (response.data.data.settings) {
                    setSettings(prev => ({ ...prev, ...response.data.data.settings.display }));
                }
            } else {
                // API失败时使用mock数据
                const mockEvents = generateMockCalendarData(startDate, endDate);
                setEvents(mockEvents);
            }
        } catch (error) {
            console.error('加载日历数据失败:', error);
            // 错误时使用mock数据
            const { start: startDate, end: endDate } = getViewDateRange();
            const mockEvents = generateMockCalendarData(startDate, endDate);
            setEvents(mockEvents);
        } finally {
            setLoading(false);
        }
    }, [currentUser._id, getViewDateRange, view]);

    const loadStatistics = useCallback(async () => {
        try {
            // 使用mock数据进行演示
            if (process.env.NODE_ENV === 'development' || !currentUser?._id) {
                // 基于当前events生成统计数据
                const mockStats = generateMockStatistics(events);
                setStatistics(mockStats);
                return;
            }

            const response = await axios.get(`/student/${currentUser._id}/calendar/statistics`);
            if (response.data.success) {
                setStatistics(response.data.data);
            } else {
                // API失败时使用mock数据
                const mockStats = generateMockStatistics(events);
                setStatistics(mockStats);
            }
        } catch (error) {
            console.error('加载统计数据失败:', error);
            // 错误时使用mock数据
            const mockStats = generateMockStatistics(events);
            setStatistics(mockStats);
        }
    }, [events, currentUser]);

    // 组件挂载时加载数据
    useEffect(() => {
        loadCalendarData();
    }, [loadCalendarData]);

    // 在events更新后加载统计数据
    useEffect(() => {
        if (events.length > 0) {
            loadStatistics();
        }
    }, [events, loadStatistics]);

    const syncAllData = useCallback(async () => {
        try {
            setSyncing(true);

            // 并行同步课程和考试
            const [coursesResult, examsResult] = await Promise.allSettled([
                axios.post(`/student/${currentUser._id}/calendar/sync/courses`),
                axios.post(`/student/${currentUser._id}/calendar/sync/exams`)
            ]);

            let successCount = 0;
            let messages = [];

            if (coursesResult.status === 'fulfilled') {
                successCount++;
                messages.push('课程同步成功');
            } else {
                messages.push('课程同步失败');
            }

            if (examsResult.status === 'fulfilled') {
                successCount++;
                messages.push('考试同步成功');
            } else {
                messages.push('考试同步失败');
            }

            await loadCalendarData();

            // 显示同步结果
            const message = messages.join('，');
            if (successCount > 0) {
                // 可以用更好的通知组件替换alert
                alert(message);
            }

        } catch (error) {
            console.error('同步数据失败:', error);
            alert('同步失败，请重试');
        } finally {
            setSyncing(false);
        }
    }, [currentUser._id, loadCalendarData]);

    const generateAIStudyPlan = useCallback(async () => {
        try {
            setSyncing(true);

            const response = await axios.post(`/student/${currentUser._id}/calendar/ai/study-plan`, aiPlanData);

            if (response.data.success) {
                await loadCalendarData();
                setShowAIDialog(false);
                alert(`AI学习计划生成成功！已添加 ${response.data.data.generatedEvents} 个学习任务`);
            }
        } catch (error) {
            console.error('生成AI学习计划失败:', error);
            alert('生成学习计划失败，请重试');
        } finally {
            setSyncing(false);
        }
    }, [currentUser._id, aiPlanData, loadCalendarData]);

    const addPersonalEvent = useCallback(async () => {
        try {
            // 验证表单数据
            if (!newEvent.title.trim()) {
                alert('请输入事件标题');
                return;
            }

            if (!newEvent.startTime || !newEvent.endTime) {
                alert('请选择开始和结束时间');
                return;
            }

            const startTime = new Date(newEvent.startTime);
            const endTime = new Date(newEvent.endTime);

            if (startTime >= endTime) {
                alert('结束时间必须晚于开始时间');
                return;
            }

            const eventData = {
                ...newEvent,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString()
            };

            await axios.post(`/student/${currentUser._id}/calendar/events`, eventData);
            await loadCalendarData();
            setShowAddEventDialog(false);

            // 重置表单
            setNewEvent({
                title: '',
                description: '',
                eventType: 'study_plan',
                startTime: '',
                endTime: '',
                priority: 'medium',
                color: '#2196f3',
                location: '',
                reminders: [{ type: 'popup', minutesBefore: 15 }]
            });

            alert('事件添加成功！');
        } catch (error) {
            console.error('添加事件失败:', error);
            alert('添加事件失败，请重试');
        }
    }, [newEvent, currentUser._id, loadCalendarData]);

    const updateEventStatus = useCallback(async (eventId, newStatus) => {
        try {
            await axios.put(`/student/${currentUser._id}/calendar/events/${eventId}/status`, {
                status: newStatus
            });

            // 更新本地状态
            setEvents(prev => prev.map(event =>
                event._id === eventId ? { ...event, status: newStatus } : event
            ));
        } catch (error) {
            console.error('更新事件状态失败:', error);
        }
    }, [currentUser._id]);

    // 工具函数
    const getEventsForDate = useCallback((date) => {
        return filteredEvents.filter(event =>
            isSameDay(event.startTime, date)
        );
    }, [filteredEvents]);



    // 事件类型相关工具函数
    const getEventTypeIcon = useCallback((eventType) => {
        const iconProps = { fontSize: "small" };
        switch (eventType) {
            case 'class': return <School {...iconProps} />;
            case 'exam': return <Quiz {...iconProps} />;
            case 'assignment': return <Assignment {...iconProps} />;
            case 'practice': return <Assignment {...iconProps} />;
            case 'study_plan': return <Schedule {...iconProps} />;
            case 'ai_suggestion': return <AutoAwesome {...iconProps} />;
            default: return <Event {...iconProps} />;
        }
    }, []);

    const getEventTypeColor = useCallback((eventType) => {
        switch (eventType) {
            case 'class': return '#2196f3';
            case 'exam': return '#f44336';
            case 'assignment': return '#ff9800';
            case 'practice': return '#4caf50';
            case 'study_plan': return '#9c27b0';
            case 'ai_suggestion': return '#00bcd4';
            default: return '#757575';
        }
    }, []);

    const getEventTypeLabel = useCallback((eventType) => {
        switch (eventType) {
            case 'class': return '课程';
            case 'exam': return '考试';
            case 'assignment': return '作业';
            case 'practice': return '练习';
            case 'study_plan': return '学习计划';
            case 'ai_suggestion': return 'AI建议';
            default: return '其他';
        }
    }, []);



    // 月份选择器状态
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [monthPickerAnchor, setMonthPickerAnchor] = useState(null);

    // 生成月份选择器数据
    const generateMonthPickerData = useCallback(() => {
        const currentYear = currentDate.getFullYear();
        const months = [];

        // 生成当前年份的所有月份
        for (let month = 0; month < 12; month++) {
            const monthDate = new Date(currentYear, month, 1);
            months.push({
                value: month,
                label: format(monthDate, 'MM月', { locale: zhCN }),
                fullLabel: format(monthDate, 'yyyy年MM月', { locale: zhCN }),
                isCurrentMonth: month === new Date().getMonth() && currentYear === new Date().getFullYear(),
                isSelectedMonth: month === currentDate.getMonth()
            });
        }

        return months;
    }, [currentDate]);

    // 处理月份选择
    const handleMonthSelect = useCallback((month) => {
        const newDate = new Date(currentDate.getFullYear(), month, 1);
        setCurrentDate(newDate);
        setShowMonthPicker(false);
        setMonthPickerAnchor(null);
    }, [currentDate]);

    // 渲染增强的日期导航
    const renderDateNavigation = () => {
        const monthsData = generateMonthPickerData();

        return (
            <Box display="flex" alignItems="center" gap={1}>
                <IconButton
                    onClick={() => setCurrentDate(prev =>
                        view === 'month' ? subMonths(prev, 1) :
                        view === 'week' ? addDays(prev, -7) :
                        addDays(prev, -1)
                    )}
                    size="small"
                    sx={{
                        bgcolor: 'action.hover',
                        '&:hover': { bgcolor: 'action.selected' }
                    }}
                >
                    <ChevronLeft />
                </IconButton>

                {/* 增强的日期显示 */}
                <Box
                    sx={{
                        minWidth: 220,
                        textAlign: 'center',
                        cursor: view === 'month' ? 'pointer' : 'default',
                        p: 1,
                        borderRadius: 1,
                        '&:hover': view === 'month' ? { bgcolor: 'action.hover' } : {}
                    }}
                    onClick={(e) => {
                        if (view === 'month') {
                            setMonthPickerAnchor(e.currentTarget);
                            setShowMonthPicker(true);
                        }
                    }}
                >
                    {view === 'month' && (
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                                {format(currentDate, 'yyyy年', { locale: zhCN })}
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', lineHeight: 1 }}>
                                {format(currentDate, 'MM月', { locale: zhCN })}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {format(currentDate, 'MMMM', { locale: zhCN })} •
                                {format(startOfMonth(currentDate), 'EEEE', { locale: zhCN })}开始 •
                                {format(endOfMonth(currentDate), 'd', { locale: zhCN })}天
                            </Typography>
                        </Box>
                    )}

                    {view === 'week' && (
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy年MM月', { locale: zhCN })}
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'dd日', { locale: zhCN })} -
                                {format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'dd日', { locale: zhCN })}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                第{Math.ceil(currentDate.getDate() / 7)}周
                            </Typography>
                        </Box>
                    )}

                    {view === 'day' && (
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {format(currentDate, 'yyyy年MM月', { locale: zhCN })}
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                {format(currentDate, 'dd日', { locale: zhCN })}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {format(currentDate, 'EEEE', { locale: zhCN })}
                            </Typography>
                        </Box>
                    )}
                </Box>

                <IconButton
                    onClick={() => setCurrentDate(prev =>
                        view === 'month' ? addMonths(prev, 1) :
                        view === 'week' ? addDays(prev, 7) :
                        addDays(prev, 1)
                    )}
                    size="small"
                    sx={{
                        bgcolor: 'action.hover',
                        '&:hover': { bgcolor: 'action.selected' }
                    }}
                >
                    <ChevronRight />
                </IconButton>

                <Tooltip title="回到今天">
                    <IconButton
                        onClick={() => setCurrentDate(new Date())}
                        size="small"
                        color={isToday(currentDate) ? 'primary' : 'default'}
                        sx={{
                            bgcolor: isToday(currentDate) ? 'primary.light' : 'action.hover',
                            '&:hover': {
                                bgcolor: isToday(currentDate) ? 'primary.main' : 'action.selected',
                                color: isToday(currentDate) ? 'white' : 'inherit'
                            }
                        }}
                    >
                        <Today />
                    </IconButton>
                </Tooltip>

                {/* 月份选择器 */}
                <Menu
                    anchorEl={monthPickerAnchor}
                    open={showMonthPicker}
                    onClose={() => {
                        setShowMonthPicker(false);
                        setMonthPickerAnchor(null);
                    }}
                    PaperProps={{
                        sx: {
                            maxWidth: 300,
                            p: 1
                        }
                    }}
                >
                    <Box sx={{ p: 1 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            选择月份
                        </Typography>
                        <Grid container spacing={1}>
                            {monthsData.map((month) => (
                                <Grid item xs={4} key={month.value}>
                                    <Button
                                        fullWidth
                                        variant={month.isSelectedMonth ? 'contained' : 'outlined'}
                                        color={month.isCurrentMonth ? 'primary' : 'inherit'}
                                        size="small"
                                        onClick={() => handleMonthSelect(month.value)}
                                        sx={{
                                            minHeight: 40,
                                            fontSize: '0.8rem',
                                            fontWeight: month.isSelectedMonth ? 600 : 400,
                                            bgcolor: month.isCurrentMonth && !month.isSelectedMonth ? 'primary.light' : undefined,
                                            '&:hover': {
                                                bgcolor: month.isSelectedMonth ? 'primary.dark' : 'action.hover'
                                            }
                                        }}
                                    >
                                        {month.label}
                                    </Button>
                                </Grid>
                            ))}
                        </Grid>

                        <Divider sx={{ my: 1 }} />

                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Button
                                size="small"
                                startIcon={<ChevronLeft />}
                                onClick={() => {
                                    const newDate = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1);
                                    setCurrentDate(newDate);
                                }}
                            >
                                {currentDate.getFullYear() - 1}年
                            </Button>

                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {currentDate.getFullYear()}年
                            </Typography>

                            <Button
                                size="small"
                                endIcon={<ChevronRight />}
                                onClick={() => {
                                    const newDate = new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1);
                                    setCurrentDate(newDate);
                                }}
                            >
                                {currentDate.getFullYear() + 1}年
                            </Button>
                        </Box>
                    </Box>
                </Menu>
            </Box>
        );
    };

    // 渲染日历头部
    const renderCalendarHeader = () => (
        <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                {/* 左侧：增强的日期导航 */}
                {renderDateNavigation()}

                {/* 中间：视图切换 */}
                <ButtonGroup variant="outlined" size="small">
                    <Button
                        onClick={() => setView('month')}
                        variant={view === 'month' ? 'contained' : 'outlined'}
                        startIcon={<CalendarMonth />}
                    >
                        月
                    </Button>
                    <Button
                        onClick={() => setView('week')}
                        variant={view === 'week' ? 'contained' : 'outlined'}
                        startIcon={<ViewWeek />}
                    >
                        周
                    </Button>
                    <Button
                        onClick={() => setView('day')}
                        variant={view === 'day' ? 'contained' : 'outlined'}
                        startIcon={<ViewDay />}
                    >
                        日
                    </Button>
                </ButtonGroup>

                {/* 右侧：操作按钮 */}
                <Box display="flex" alignItems="center" gap={1}>
                    <Tooltip title="搜索事件">
                        <TextField
                            size="small"
                            placeholder="搜索事件..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: <Search fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            }}
                            sx={{ width: 200 }}
                        />
                    </Tooltip>

                    <Tooltip title="过滤事件">
                        <IconButton onClick={(e) => setFilterAnchorEl(e.currentTarget)}>
                            <FilterList />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="同步数据">
                        <IconButton onClick={syncAllData} disabled={syncing}>
                            <Sync className={syncing ? 'rotating' : ''} />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="AI学习计划">
                        <Button
                            variant="outlined"
                            startIcon={<AutoAwesome />}
                            onClick={() => setShowAIDialog(true)}
                            size="small"
                        >
                            AI计划
                        </Button>
                    </Tooltip>

                    <Tooltip title="添加事件">
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => setShowAddEventDialog(true)}
                            size="small"
                        >
                            添加
                        </Button>
                    </Tooltip>

                    <Tooltip title="更多选项">
                        <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                            <MoreVert />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>
        </Paper>
    );

    // 渲染月视图
    const renderMonthView = () => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
        const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
        const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

        // 计算月份统计信息
        const currentMonthEvents = filteredEvents.filter(event =>
            isSameMonth(event.startTime, currentDate)
        );

        const monthStats = {
            totalEvents: currentMonthEvents.length,
            completedEvents: currentMonthEvents.filter(e => e.status === 'completed').length,
            upcomingEvents: currentMonthEvents.filter(e => isAfter(e.startTime, new Date())).length,
            eventsByType: currentMonthEvents.reduce((acc, event) => {
                acc[event.eventType] = (acc[event.eventType] || 0) + 1;
                return acc;
            }, {})
        };

        return (
            <Box>
                {/* 月份信息栏 */}
                <Paper elevation={1} sx={{ p: 2, mb: 2, bgcolor: 'primary.50' }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <Box display="flex" alignItems="center" gap={2}>
                                <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                                    <CalendarMonth />
                                </Avatar>
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                        {format(currentDate, 'yyyy年MM月', { locale: zhCN })}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {format(monthStart, 'MM月dd日', { locale: zhCN })} - {format(monthEnd, 'MM月dd日', { locale: zhCN })} •
                                        共{format(monthEnd, 'd')}天 •
                                        {Math.ceil(days.length / 7)}周显示
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Grid container spacing={2}>
                                <Grid item xs={3}>
                                    <Box textAlign="center">
                                        <Typography variant="h6" color="primary.main" sx={{ fontWeight: 700 }}>
                                            {monthStats.totalEvents}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            总事件
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={3}>
                                    <Box textAlign="center">
                                        <Typography variant="h6" color="success.main" sx={{ fontWeight: 700 }}>
                                            {monthStats.completedEvents}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            已完成
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={3}>
                                    <Box textAlign="center">
                                        <Typography variant="h6" color="warning.main" sx={{ fontWeight: 700 }}>
                                            {monthStats.upcomingEvents}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            即将到来
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={3}>
                                    <Box textAlign="center">
                                        <Typography variant="h6" color="info.main" sx={{ fontWeight: 700 }}>
                                            {Math.round((monthStats.completedEvents / Math.max(monthStats.totalEvents, 1)) * 100)}%
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            完成率
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </Paper>

                {/* 日历网格 */}
                <Paper elevation={1} sx={{ overflow: 'hidden' }}>
                    {/* 星期标题 */}
                    <Grid container sx={{ bgcolor: 'grey.50', borderBottom: '2px solid', borderColor: 'divider' }}>
                        {[
                            { short: '周一', full: '星期一' },
                            { short: '周二', full: '星期二' },
                            { short: '周三', full: '星期三' },
                            { short: '周四', full: '星期四' },
                            { short: '周五', full: '星期五' },
                            { short: '周六', full: '星期六' },
                            { short: '周日', full: '星期日' }
                        ].map((day, index) => (
                            <Grid item xs key={day.short}>
                                <Box sx={{ py: 2, textAlign: 'center' }}>
                                    <Typography
                                        variant="subtitle2"
                                        sx={{
                                            fontWeight: 600,
                                            color: index >= 5 ? 'error.main' : 'text.secondary',
                                            display: { xs: 'none', sm: 'block' }
                                        }}
                                    >
                                        {day.full}
                                    </Typography>
                                    <Typography
                                        variant="subtitle2"
                                        sx={{
                                            fontWeight: 600,
                                            color: index >= 5 ? 'error.main' : 'text.secondary',
                                            display: { xs: 'block', sm: 'none' }
                                        }}
                                    >
                                        {day.short}
                                    </Typography>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>

                {/* 日期网格 */}
                <Grid container>
                    {days.map(day => {
                        const dayEvents = getEventsForDate(day);
                        const isCurrentMonth = isSameMonth(day, currentDate);
                        const isDayToday = isToday(day);
                        const isSelected = selectedDate && isSameDay(day, selectedDate);

                        return (
                            <Grid item xs key={day.toString()}>
                                <Box
                                    sx={{
                                        minHeight: 120,
                                        p: 1,
                                        cursor: 'pointer',
                                        borderRight: '1px solid',
                                        borderBottom: '1px solid',
                                        borderColor: 'divider',
                                        bgcolor: isSelected ? 'primary.50' :
                                                isDayToday ? 'primary.25' :
                                                !isCurrentMonth ? 'grey.25' : 'background.paper',
                                        '&:hover': {
                                            bgcolor: isSelected ? 'primary.100' : 'grey.50',
                                            transition: 'background-color 0.2s'
                                        }
                                    }}
                                    onClick={() => {
                                        setSelectedDate(day);
                                        if (dayEvents.length > 0) {
                                            setSelectedEvent(dayEvents[0]);
                                            setShowEventDialog(true);
                                        }
                                    }}
                                >
                                    {/* 日期数字 */}
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontWeight: isDayToday ? 700 : isCurrentMonth ? 500 : 400,
                                                color: isDayToday ? 'primary.main' :
                                                       isCurrentMonth ? 'text.primary' : 'text.disabled',
                                                fontSize: isDayToday ? '0.9rem' : '0.8rem'
                                            }}
                                        >
                                            {format(day, 'd')}
                                        </Typography>

                                        {/* 事件数量指示器 */}
                                        {dayEvents.length > 0 && (
                                            <Badge
                                                badgeContent={dayEvents.length}
                                                color="primary"
                                                sx={{
                                                    '& .MuiBadge-badge': {
                                                        fontSize: '0.6rem',
                                                        minWidth: 16,
                                                        height: 16
                                                    }
                                                }}
                                            >
                                                <Box />
                                            </Badge>
                                        )}
                                    </Box>

                                    {/* 事件列表 */}
                                    <Stack spacing={0.25}>
                                        {dayEvents.slice(0, settings.compactView ? 2 : 3).map((event, index) => (
                                            <Chip
                                                key={event._id || index}
                                                label={event.title}
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedEvent(event);
                                                    setShowEventDialog(true);
                                                }}
                                                sx={{
                                                    fontSize: '0.65rem',
                                                    height: settings.compactView ? 16 : 20,
                                                    bgcolor: event.color || getEventTypeColor(event.eventType),
                                                    color: 'white',
                                                    '& .MuiChip-label': {
                                                        px: 0.5,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis'
                                                    },
                                                    '&:hover': {
                                                        opacity: 0.8,
                                                        transform: 'scale(1.02)'
                                                    },
                                                    transition: 'all 0.2s'
                                                }}
                                            />
                                        ))}

                                        {dayEvents.length > (settings.compactView ? 2 : 3) && (
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{ fontSize: '0.6rem', textAlign: 'center' }}
                                            >
                                                +{dayEvents.length - (settings.compactView ? 2 : 3)} 更多
                                            </Typography>
                                        )}
                                    </Stack>
                                </Box>
                            </Grid>
                        );
                    })}
                </Grid>
            </Paper>
        </Box>
        );
    };

    // 课程时间段配置 - 优化高度和布局
    const courseTimeSlots = [
        { id: 1, label: '第1节', time: '08:00-10:00', period: 'morning', height: 80 },
        { id: 2, label: '第2节', time: '10:20-12:20', period: 'morning', height: 80 },
        { id: 3, label: '第3节', time: '14:00-16:00', period: 'afternoon', height: 80 },
        { id: 4, label: '第4节', time: '16:20-18:20', period: 'afternoon', height: 80 },
        { id: 5, label: '第5节', time: '19:00-21:00', period: 'evening', height: 80 }
    ];

    // 获取事件对应的课程时段
    const getEventTimeSlot = (event) => {
        const startHour = event.startTime.getHours();
        const startMinute = event.startTime.getMinutes();

        // 根据开始时间匹配课程时段
        if (startHour === 8) return courseTimeSlots[0];
        if (startHour === 10 && startMinute >= 20) return courseTimeSlots[1];
        if (startHour === 14) return courseTimeSlots[2];
        if (startHour === 16 && startMinute >= 20) return courseTimeSlots[3];
        if (startHour === 19) return courseTimeSlots[4];

        // 其他时间的事件，根据时间范围分配
        if (startHour >= 8 && startHour < 12) return courseTimeSlots[0]; // 上午
        if (startHour >= 14 && startHour < 18) return courseTimeSlots[2]; // 下午
        if (startHour >= 19 && startHour < 21) return courseTimeSlots[4]; // 晚上

        return null;
    };

    // 渲染周视图
    const renderWeekView = () => {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

        return (
            <Paper elevation={1} sx={{
                overflow: 'auto',
                maxHeight: 500,
                borderRadius: 2,
                '& .MuiGrid-container': {
                    minWidth: 800 // 确保最小宽度
                }
            }}>
                <Grid container spacing={0}>
                    {/* 课程时段列 */}
                    <Grid item sx={{ width: 100, minWidth: 100 }}>
                        <Box sx={{
                            position: 'sticky',
                            left: 0,
                            bgcolor: 'background.paper',
                            zIndex: 2,
                            borderRight: '2px solid',
                            borderColor: 'divider'
                        }}>
                            {/* 头部空白 */}
                            <Box sx={{
                                height: 50,
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                                bgcolor: 'grey.100'
                            }} />
                            {courseTimeSlots.map(slot => (
                                <Box
                                    key={slot.id}
                                    sx={{
                                        height: slot.height,
                                        borderBottom: '1px solid',
                                        borderColor: 'divider',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: slot.period === 'morning' ? '#e3f2fd' :
                                               slot.period === 'afternoon' ? '#e8f5e8' : '#f3e5f5',
                                        px: 0.5
                                    }}
                                >
                                    <Typography variant="body2" sx={{
                                        fontWeight: 700,
                                        color: 'text.primary',
                                        fontSize: '0.75rem'
                                    }}>
                                        {slot.label}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{
                                        textAlign: 'center',
                                        fontSize: '0.65rem',
                                        lineHeight: 1.2
                                    }}>
                                        {slot.time}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Grid>

                    {/* 日期列 */}
                    {weekDays.map((day, dayIndex) => {
                        const dayEvents = getEventsForDate(day);
                        const isDayToday = isToday(day);
                        const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                        return (
                            <Grid item xs key={day.toString()}>
                                {/* 日期头部 */}
                                <Box
                                    sx={{
                                        height: 50,
                                        borderBottom: '1px solid',
                                        borderRight: dayIndex === weekDays.length - 1 ? 'none' : '1px solid',
                                        borderColor: 'divider',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: isDayToday ? 'primary.100' :
                                               isWeekend ? 'grey.50' : 'background.paper'
                                    }}
                                >
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                        {format(day, 'EEE', { locale: zhCN })}
                                    </Typography>
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            color: isDayToday ? 'primary.main' : 'text.primary',
                                            fontWeight: isDayToday ? 700 : 500,
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        {format(day, 'd')}
                                    </Typography>
                                </Box>

                                {/* 课程时段槽 */}
                                <Box sx={{ position: 'relative' }}>
                                    {courseTimeSlots.map((slot, slotIndex) => (
                                        <Box
                                            key={slot.id}
                                            sx={{
                                                height: slot.height,
                                                borderBottom: '1px solid',
                                                borderRight: dayIndex === weekDays.length - 1 ? 'none' : '1px solid',
                                                borderColor: 'divider',
                                                bgcolor: slot.period === 'morning' ? '#f8fbff' :
                                                        slot.period === 'afternoon' ? '#f8fff8' : '#faf8ff',
                                                '&:hover': {
                                                    bgcolor: slot.period === 'morning' ? '#e3f2fd' :
                                                            slot.period === 'afternoon' ? '#e8f5e8' : '#f3e5f5'
                                                }
                                            }}
                                        />
                                    ))}

                                    {/* 事件覆盖层 */}
                                    {dayEvents.map((event, index) => {
                                        const timeSlot = getEventTimeSlot(event);
                                        if (!timeSlot) return null;

                                        const slotIndex = courseTimeSlots.findIndex(s => s.id === timeSlot.id);
                                        const top = slotIndex * timeSlot.height + 2;
                                        const height = timeSlot.height - 4;

                                        return (
                                            <Box
                                                key={event._id || index}
                                                sx={{
                                                    position: 'absolute',
                                                    top: `${top}px`,
                                                    left: 2,
                                                    right: 2,
                                                    height: `${height}px`,
                                                    bgcolor: event.color || getEventTypeColor(event.eventType),
                                                    color: 'white',
                                                    borderRadius: 1,
                                                    p: 0.5,
                                                    cursor: 'pointer',
                                                    overflow: 'hidden',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    textAlign: 'center',
                                                    boxShadow: 1,
                                                    '&:hover': {
                                                        opacity: 0.9,
                                                        transform: 'scale(1.05)',
                                                        boxShadow: 3,
                                                        zIndex: 1
                                                    },
                                                    transition: 'all 0.2s ease-in-out'
                                                }}
                                                onClick={() => {
                                                    setSelectedEvent(event);
                                                    setShowEventDialog(true);
                                                }}
                                            >
                                                <Typography variant="caption" sx={{
                                                    fontWeight: 700,
                                                    fontSize: '0.7rem',
                                                    lineHeight: 1.2,
                                                    mb: 0.25
                                                }}>
                                                    {event.subject || event.title}
                                                </Typography>
                                                {event.teacher && (
                                                    <Typography variant="caption" sx={{
                                                        opacity: 0.9,
                                                        fontSize: '0.65rem',
                                                        lineHeight: 1.1
                                                    }}>
                                                        {event.teacher}
                                                    </Typography>
                                                )}
                                                {event.location && (
                                                    <Typography variant="caption" sx={{
                                                        opacity: 0.8,
                                                        fontSize: '0.6rem',
                                                        lineHeight: 1.1,
                                                        mt: 0.25
                                                    }}>
                                                        {event.location}
                                                    </Typography>
                                                )}
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </Grid>
                        );
                    })}
                </Grid>
            </Paper>
        );
    };

    // 渲染日视图
    const renderDayView = () => {
        const dayEvents = getEventsForDate(currentDate);

        return (
            <Paper elevation={1} sx={{ overflow: 'auto', maxHeight: 600 }}>
                <Box sx={{ display: 'flex' }}>
                    {/* 课程时段列 */}
                    <Box sx={{ width: 120, bgcolor: 'grey.50' }}>
                        {courseTimeSlots.map(slot => (
                            <Box
                                key={slot.id}
                                sx={{
                                    height: slot.height,
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: slot.period === 'morning' ? 'blue.50' :
                                           slot.period === 'afternoon' ? 'green.50' : 'purple.50',
                                    px: 1
                                }}
                            >
                                <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                    {slot.label}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 0.5 }}>
                                    {slot.time}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                                    ({slot.period === 'morning' ? '上午' : slot.period === 'afternoon' ? '下午' : '晚上'})
                                </Typography>
                            </Box>
                        ))}
                    </Box>

                    {/* 事件列 */}
                    <Box sx={{ flex: 1, position: 'relative' }}>
                        {courseTimeSlots.map(slot => (
                            <Box
                                key={slot.id}
                                sx={{
                                    height: slot.height,
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                    bgcolor: slot.period === 'morning' ? 'blue.25' :
                                            slot.period === 'afternoon' ? 'green.25' : 'purple.25'
                                }}
                            />
                        ))}

                        {/* 事件覆盖层 */}
                        {dayEvents.map((event, index) => {
                            const timeSlot = getEventTimeSlot(event);
                            if (!timeSlot) return null;

                            const slotIndex = courseTimeSlots.findIndex(s => s.id === timeSlot.id);
                            const top = slotIndex * timeSlot.height + 8;
                            const height = timeSlot.height - 16;

                            return (
                                <Card
                                    key={event._id || index}
                                    sx={{
                                        position: 'absolute',
                                        top: `${top}px`,
                                        left: 12,
                                        right: 12,
                                        height: `${height}px`,
                                        cursor: 'pointer',
                                        bgcolor: event.color || getEventTypeColor(event.eventType),
                                        color: 'white',
                                        '&:hover': {
                                            elevation: 6,
                                            transform: 'scale(1.02)',
                                            boxShadow: 4
                                        },
                                        transition: 'all 0.2s'
                                    }}
                                    onClick={() => {
                                        setSelectedEvent(event);
                                        setShowEventDialog(true);
                                    }}
                                >
                                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                                            {getEventTypeIcon(event.eventType)}
                                            <Typography variant="h6" sx={{ fontWeight: 700, color: 'white' }}>
                                                {event.subject || event.title}
                                            </Typography>
                                        </Box>

                                        {event.teacher && (
                                            <Typography variant="body2" sx={{ color: 'white', opacity: 0.9, mb: 0.5 }}>
                                                👨‍🏫 {event.teacher}
                                            </Typography>
                                        )}

                                        {event.location && (
                                            <Typography variant="body2" sx={{ color: 'white', opacity: 0.9, mb: 0.5 }}>
                                                📍 {event.location}
                                            </Typography>
                                        )}

                                        <Typography variant="body2" sx={{ color: 'white', opacity: 0.8, mt: 'auto' }}>
                                            {timeSlot.label} • {timeSlot.time}
                                        </Typography>

                                        {event.courseContent && (
                                            <Typography variant="caption" sx={{ color: 'white', opacity: 0.7, mt: 0.5 }}>
                                                {event.courseContent}
                                            </Typography>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </Box>
                </Box>
            </Paper>
        );
    };

    // 渲染即将到来的事件
    const renderUpcomingEvents = () => {
        const upcomingEvents = filteredEvents
            .filter(event => isAfter(event.startTime, new Date()))
            .sort((a, b) => a.startTime - b.startTime)
            .slice(0, 8);

        return (
            <Card elevation={1}>
                <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            即将到来
                        </Typography>
                        <Chip
                            label={upcomingEvents.length}
                            size="small"
                            color="primary"
                        />
                    </Box>

                    <List dense>
                        {upcomingEvents.map((event, index) => (
                            <ListItemButton
                                key={event._id || index}
                                onClick={() => {
                                    setSelectedEvent(event);
                                    setShowEventDialog(true);
                                }}
                                sx={{ borderRadius: 1, mb: 0.5 }}
                            >
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                    <Avatar
                                        sx={{
                                            width: 24,
                                            height: 24,
                                            bgcolor: event.color || getEventTypeColor(event.eventType)
                                        }}
                                    >
                                        {getEventTypeIcon(event.eventType)}
                                    </Avatar>
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            {event.title}
                                        </Typography>
                                    }
                                    secondary={
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                {format(event.startTime, 'MM月dd日 HH:mm', { locale: zhCN })}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                                ({formatDistanceToNow(event.startTime, { locale: zhCN, addSuffix: true })})
                                            </Typography>
                                        </Box>
                                    }
                                />
                                {event.priority === 'urgent' && (
                                    <Chip
                                        label="紧急"
                                        size="small"
                                        color="error"
                                        sx={{ ml: 1 }}
                                    />
                                )}
                            </ListItemButton>
                        ))}

                        {upcomingEvents.length === 0 && (
                            <Box textAlign="center" py={3}>
                                <Event sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                                <Typography variant="body2" color="text.secondary">
                                    暂无即将到来的事件
                                </Typography>
                            </Box>
                        )}
                    </List>
                </CardContent>
            </Card>
        );
    };

    // 渲染统计卡片
    const renderStatisticsCards = () => (
        <Grid container spacing={2} mb={3}>
            <Grid item xs={12} sm={6} md={3}>
                <Card elevation={1} sx={{ height: '100%' }}>
                    <CardContent>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Box>
                                <Typography color="text.secondary" variant="body2" gutterBottom>
                                    本周事件
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                    {statistics.totalEvents || 0}
                                </Typography>
                            </Box>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                                <Event />
                            </Avatar>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
                <Card elevation={1} sx={{ height: '100%' }}>
                    <CardContent>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Box>
                                <Typography color="text.secondary" variant="body2" gutterBottom>
                                    已完成
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                                    {statistics.completedEvents || 0}
                                </Typography>
                            </Box>
                            <Avatar sx={{ bgcolor: 'success.main' }}>
                                <CheckCircle />
                            </Avatar>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
                <Card elevation={1} sx={{ height: '100%' }}>
                    <CardContent>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Box>
                                <Typography color="text.secondary" variant="body2" gutterBottom>
                                    即将到来
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                                    {statistics.upcomingEvents || 0}
                                </Typography>
                            </Box>
                            <Avatar sx={{ bgcolor: 'warning.main' }}>
                                <Schedule />
                            </Avatar>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
                <Card elevation={1} sx={{ height: '100%' }}>
                    <CardContent>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Box>
                                <Typography color="text.secondary" variant="body2" gutterBottom>
                                    学习时长
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                                    {statistics.studyHours || 0}h
                                </Typography>
                            </Box>
                            <Avatar sx={{ bgcolor: 'info.main' }}>
                                <TrendingUp />
                            </Avatar>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );

    // 加载状态组件
    const renderLoadingSkeleton = () => (
        <Box>
            {renderCalendarHeader()}
            {renderStatisticsCards()}
            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2 }}>
                        <Skeleton variant="rectangular" height={400} />
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2 }}>
                        <Skeleton variant="rectangular" height={400} />
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );

    if (loading) {
        return (
            <Box sx={{ p: 3 }}>
                {renderLoadingSkeleton()}
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, minHeight: '100vh', bgcolor: 'grey.50' }}>
            {/* 页面标题 */}
            <Box mb={3}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
                    📅 课程日历
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    管理您的课程安排、考试时间和学习计划
                </Typography>
            </Box>

            {/* 日历头部控制栏 */}
            {renderCalendarHeader()}

            {/* 统计卡片 */}
            {renderStatisticsCards()}

            <Grid container spacing={3}>
                {/* 主日历区域 */}
                <Grid item xs={12} lg={8}>
                    {view === 'month' && renderMonthView()}
                    {view === 'week' && renderWeekView()}
                    {view === 'day' && renderDayView()}
                </Grid>

                {/* 侧边栏 */}
                <Grid item xs={12} lg={4}>
                    <Stack spacing={2}>
                        {renderUpcomingEvents()}

                        {/* 快速操作卡片 */}
                        <Card elevation={1}>
                            <CardContent>
                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                                    快速操作
                                </Typography>
                                <Stack spacing={1}>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        startIcon={<Add />}
                                        onClick={() => setShowAddEventDialog(true)}
                                    >
                                        添加事件
                                    </Button>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        startIcon={<AutoAwesome />}
                                        onClick={() => setShowAIDialog(true)}
                                    >
                                        AI学习计划
                                    </Button>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        startIcon={<Sync />}
                                        onClick={syncAllData}
                                        disabled={syncing}
                                    >
                                        {syncing ? '同步中...' : '同步数据'}
                                    </Button>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Stack>
                </Grid>
            </Grid>

            {/* 过滤菜单 */}
            <Menu
                anchorEl={filterAnchorEl}
                open={Boolean(filterAnchorEl)}
                onClose={() => setFilterAnchorEl(null)}
            >
                <Box sx={{ p: 2, minWidth: 200 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        事件类型过滤
                    </Typography>
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                        <Select
                            value={eventTypeFilter}
                            onChange={(e) => setEventTypeFilter(e.target.value)}
                        >
                            <MenuItem value="all">全部类型</MenuItem>
                            <MenuItem value="class">课程</MenuItem>
                            <MenuItem value="exam">考试</MenuItem>
                            <MenuItem value="assignment">作业</MenuItem>
                            <MenuItem value="practice">练习</MenuItem>
                            <MenuItem value="study_plan">学习计划</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControlLabel
                        control={
                            <Switch
                                checked={showCompleted}
                                onChange={(e) => setShowCompleted(e.target.checked)}
                            />
                        }
                        label="显示已完成"
                    />
                </Box>
            </Menu>

            {/* 更多选项菜单 */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
            >
                <MenuItem onClick={() => {
                    // TODO: 实现设置功能
                    setAnchorEl(null);
                }}>
                    <ListItemIcon>
                        <Settings fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>设置</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => {
                    // 导出功能
                    setAnchorEl(null);
                }}>
                    <ListItemIcon>
                        <Event fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>导出日历</ListItemText>
                </MenuItem>
            </Menu>

            {/* 添加事件对话框 */}
            <Dialog
                open={showAddEventDialog}
                onClose={() => setShowAddEventDialog(false)}
                maxWidth="sm"
                fullWidth
                TransitionComponent={Slide}
                TransitionProps={{ direction: "up" }}
            >
                <DialogTitle sx={{ pb: 1 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            添加新事件
                        </Typography>
                        <IconButton onClick={() => setShowAddEventDialog(false)} size="small">
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            fullWidth
                            label="事件标题"
                            value={newEvent.title}
                            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                            required
                        />

                        <TextField
                            fullWidth
                            label="事件描述"
                            value={newEvent.description}
                            onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                            multiline
                            rows={3}
                        />

                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <FormControl fullWidth>
                                    <InputLabel>事件类型</InputLabel>
                                    <Select
                                        value={newEvent.eventType}
                                        onChange={(e) => setNewEvent({ ...newEvent, eventType: e.target.value })}
                                    >
                                        <MenuItem value="study_plan">学习计划</MenuItem>
                                        <MenuItem value="assignment">作业</MenuItem>
                                        <MenuItem value="practice">练习</MenuItem>
                                        <MenuItem value="reminder">提醒</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={6}>
                                <FormControl fullWidth>
                                    <InputLabel>优先级</InputLabel>
                                    <Select
                                        value={newEvent.priority}
                                        onChange={(e) => setNewEvent({ ...newEvent, priority: e.target.value })}
                                    >
                                        <MenuItem value="low">低</MenuItem>
                                        <MenuItem value="medium">中</MenuItem>
                                        <MenuItem value="high">高</MenuItem>
                                        <MenuItem value="urgent">紧急</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>

                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    label="开始时间"
                                    type="datetime-local"
                                    value={newEvent.startTime}
                                    onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                    required
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    label="结束时间"
                                    type="datetime-local"
                                    value={newEvent.endTime}
                                    onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                    required
                                />
                            </Grid>
                        </Grid>

                        <TextField
                            fullWidth
                            label="地点"
                            value={newEvent.location}
                            onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setShowAddEventDialog(false)}>
                        取消
                    </Button>
                    <Button onClick={addPersonalEvent} variant="contained">
                        添加事件
                    </Button>
                </DialogActions>
            </Dialog>

            {/* AI学习计划对话框 */}
            <Dialog
                open={showAIDialog}
                onClose={() => setShowAIDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Box display="flex" alignItems="center" gap={1}>
                        <AutoAwesome color="primary" />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            AI智能学习计划
                        </Typography>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <FormControl fullWidth>
                            <InputLabel>计划时长</InputLabel>
                            <Select
                                value={aiPlanData.timeRange}
                                onChange={(e) => setAiPlanData({ ...aiPlanData, timeRange: e.target.value })}
                            >
                                <MenuItem value="week">一周计划</MenuItem>
                                <MenuItem value="month">一个月计划</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            label="学习目标"
                            value={aiPlanData.goals}
                            onChange={(e) => setAiPlanData({ ...aiPlanData, goals: e.target.value })}
                            multiline
                            rows={3}
                            placeholder="例如：提高数学成绩，掌握编程基础..."
                        />

                        <TextField
                            fullWidth
                            label="学习偏好"
                            value={aiPlanData.preferences}
                            onChange={(e) => setAiPlanData({ ...aiPlanData, preferences: e.target.value })}
                            multiline
                            rows={2}
                            placeholder="例如：喜欢上午学习，需要更多练习时间..."
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setShowAIDialog(false)}>
                        取消
                    </Button>
                    <Button
                        onClick={generateAIStudyPlan}
                        variant="contained"
                        disabled={syncing}
                        startIcon={syncing ? <CircularProgress size={16} /> : <AutoAwesome />}
                    >
                        {syncing ? '生成中...' : '生成计划'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 事件详情对话框 */}
            <Dialog
                open={showEventDialog}
                onClose={() => setShowEventDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                {selectedEvent && (
                    <>
                        <DialogTitle>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box display="flex" alignItems="center" gap={1}>
                                    {getEventTypeIcon(selectedEvent.eventType)}
                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                        {selectedEvent.title}
                                    </Typography>
                                </Box>
                                <Chip
                                    label={getEventTypeLabel(selectedEvent.eventType)}
                                    size="small"
                                    sx={{ bgcolor: selectedEvent.color || getEventTypeColor(selectedEvent.eventType), color: 'white' }}
                                />
                            </Box>
                        </DialogTitle>
                        <DialogContent>
                            <Stack spacing={2}>
                                {selectedEvent.description && (
                                    <Box>
                                        <Typography variant="subtitle2" gutterBottom>
                                            描述
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {selectedEvent.description}
                                        </Typography>
                                    </Box>
                                )}

                                <Box>
                                    <Typography variant="subtitle2" gutterBottom>
                                        时间
                                    </Typography>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <AccessTime fontSize="small" color="action" />
                                        <Typography variant="body2">
                                            {format(selectedEvent.startTime, 'yyyy年MM月dd日 HH:mm', { locale: zhCN })} -
                                            {format(selectedEvent.endTime, 'HH:mm', { locale: zhCN })}
                                        </Typography>
                                    </Box>
                                </Box>

                                {selectedEvent.location && (
                                    <Box>
                                        <Typography variant="subtitle2" gutterBottom>
                                            地点
                                        </Typography>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <LocationOn fontSize="small" color="action" />
                                            <Typography variant="body2">
                                                {selectedEvent.location}
                                            </Typography>
                                        </Box>
                                    </Box>
                                )}

                                <Box>
                                    <Typography variant="subtitle2" gutterBottom>
                                        状态
                                    </Typography>
                                    <Box display="flex" gap={1}>
                                        <Button
                                            size="small"
                                            variant={selectedEvent.status === 'completed' ? 'contained' : 'outlined'}
                                            color="success"
                                            startIcon={<CheckCircle />}
                                            onClick={() => updateEventStatus(selectedEvent._id, 'completed')}
                                        >
                                            已完成
                                        </Button>
                                        <Button
                                            size="small"
                                            variant={selectedEvent.status === 'scheduled' ? 'contained' : 'outlined'}
                                            startIcon={<RadioButtonUnchecked />}
                                            onClick={() => updateEventStatus(selectedEvent._id, 'scheduled')}
                                        >
                                            待完成
                                        </Button>
                                    </Box>
                                </Box>
                            </Stack>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setShowEventDialog(false)}>
                                关闭
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* 添加CSS动画 */}
            <style jsx>{`
                @keyframes rotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .rotating {
                    animation: rotate 1s linear infinite;
                }
            `}</style>
        </Box>
    );
};

export default StudentCalendar;
