import React from 'react';
import {
    Box,
    Chip,
    Typography,
    Avatar,
    Card,
    CardContent,
    IconButton,
    Tooltip,
    Badge,
    Stack
} from '@mui/material';
import {
    School,
    Quiz,
    Assignment,
    Schedule,
    AutoAwesome,
    Event,
    CheckCircle,
    RadioButtonUnchecked,
    Warning,
    LocationOn,
    AccessTime,
    Person,
    MoreVert
} from '@mui/icons-material';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// 事件类型图标映射
const EventTypeIcons = {
    class: School,
    exam: Quiz,
    assignment: Assignment,
    practice: Assignment,
    study_plan: Schedule,
    ai_suggestion: AutoAwesome,
    reminder: Event
};

// 事件类型颜色映射
const EventTypeColors = {
    class: '#2196f3',
    exam: '#f44336',
    assignment: '#ff9800',
    practice: '#4caf50',
    study_plan: '#9c27b0',
    ai_suggestion: '#00bcd4',
    reminder: '#757575'
};

// 优先级颜色映射
const PriorityColors = {
    urgent: '#f44336',
    high: '#ff9800',
    medium: '#2196f3',
    low: '#4caf50'
};

// 事件状态映射
const EventStatusConfig = {
    scheduled: { label: '待完成', color: 'default', icon: RadioButtonUnchecked },
    in_progress: { label: '进行中', color: 'primary', icon: Schedule },
    completed: { label: '已完成', color: 'success', icon: CheckCircle },
    cancelled: { label: '已取消', color: 'error', icon: Warning },
    missed: { label: '已错过', color: 'warning', icon: Warning }
};

/**
 * 事件芯片组件 - 用于月视图中的事件显示
 */
export const EventChip = ({ 
    event, 
    onClick, 
    compact = false,
    showTime = false,
    maxWidth = '100%'
}) => {
    const IconComponent = EventTypeIcons[event.eventType] || Event;
    const eventColor = event.color || EventTypeColors[event.eventType] || '#757575';
    
    return (
        <Chip
            label={
                <Box display="flex" alignItems="center" gap={0.5}>
                    {!compact && <IconComponent sx={{ fontSize: 12 }} />}
                    <Typography 
                        variant="caption" 
                        sx={{ 
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: compact ? 80 : 120
                        }}
                    >
                        {event.title}
                    </Typography>
                    {showTime && (
                        <Typography variant="caption" sx={{ opacity: 0.8, ml: 0.5 }}>
                            {format(event.startTime, 'HH:mm')}
                        </Typography>
                    )}
                </Box>
            }
            size="small"
            onClick={(e) => {
                e.stopPropagation();
                onClick?.(event);
            }}
            sx={{
                fontSize: compact ? '0.6rem' : '0.65rem',
                height: compact ? 16 : 20,
                maxWidth: maxWidth,
                bgcolor: eventColor,
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                    opacity: 0.8,
                    transform: 'scale(1.02)',
                },
                '& .MuiChip-label': {
                    px: compact ? 0.25 : 0.5,
                    overflow: 'hidden'
                }
            }}
        />
    );
};

/**
 * 事件卡片组件 - 用于时间视图中的事件显示
 */
export const EventCard = ({ 
    event, 
    onClick,
    style = {},
    showDetails = true,
    interactive = true
}) => {
    const IconComponent = EventTypeIcons[event.eventType] || Event;
    const eventColor = event.color || EventTypeColors[event.eventType] || '#757575';
    const statusConfig = EventStatusConfig[event.status] || EventStatusConfig.scheduled;
    
    return (
        <Card
            sx={{
                ...style,
                bgcolor: eventColor,
                color: 'white',
                cursor: interactive ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                '&:hover': interactive ? {
                    opacity: 0.9,
                    transform: 'scale(1.02)',
                    elevation: 4
                } : {},
                overflow: 'hidden'
            }}
            onClick={() => interactive && onClick?.(event)}
        >
            <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                <Box display="flex" alignItems="flex-start" justifyContent="space-between">
                    <Box flex={1} minWidth={0}>
                        {/* 事件标题 */}
                        <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                            <IconComponent sx={{ fontSize: 14 }} />
                            <Typography 
                                variant="caption" 
                                sx={{ 
                                    fontWeight: 600,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {event.title}
                            </Typography>
                        </Box>
                        
                        {/* 时间信息 */}
                        <Box display="flex" alignItems="center" gap={0.5} mb={showDetails ? 0.5 : 0}>
                            <AccessTime sx={{ fontSize: 12 }} />
                            <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                {format(event.startTime, 'HH:mm')} - {format(event.endTime, 'HH:mm')}
                            </Typography>
                        </Box>
                        
                        {/* 详细信息 */}
                        {showDetails && (
                            <>
                                {event.location && (
                                    <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                                        <LocationOn sx={{ fontSize: 12 }} />
                                        <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                            {event.location}
                                        </Typography>
                                    </Box>
                                )}
                                
                                {event.description && (
                                    <Typography 
                                        variant="caption" 
                                        sx={{ 
                                            opacity: 0.8,
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        {event.description}
                                    </Typography>
                                )}
                            </>
                        )}
                    </Box>
                    
                    {/* 状态和优先级指示器 */}
                    <Box display="flex" flexDirection="column" alignItems="flex-end" gap={0.5}>
                        {event.priority === 'urgent' && (
                            <Tooltip title="紧急">
                                <Warning sx={{ fontSize: 14, color: '#ffeb3b' }} />
                            </Tooltip>
                        )}
                        
                        <Tooltip title={statusConfig.label}>
                            <statusConfig.icon sx={{ fontSize: 14, opacity: 0.8 }} />
                        </Tooltip>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

/**
 * 事件列表项组件 - 用于侧边栏和列表视图
 */
export const EventListItem = ({ 
    event, 
    onClick,
    showDate = false,
    showStatus = true,
    compact = false
}) => {
    const IconComponent = EventTypeIcons[event.eventType] || Event;
    const eventColor = event.color || EventTypeColors[event.eventType] || '#757575';
    const statusConfig = EventStatusConfig[event.status] || EventStatusConfig.scheduled;
    
    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: compact ? 1 : 1.5,
                borderRadius: 1,
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
                '&:hover': {
                    bgcolor: 'action.hover'
                }
            }}
            onClick={() => onClick?.(event)}
        >
            {/* 事件图标 */}
            <Avatar 
                sx={{ 
                    width: compact ? 32 : 40, 
                    height: compact ? 32 : 40, 
                    bgcolor: eventColor 
                }}
            >
                <IconComponent sx={{ fontSize: compact ? 16 : 20 }} />
            </Avatar>
            
            {/* 事件信息 */}
            <Box flex={1} minWidth={0}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                    <Typography 
                        variant={compact ? "body2" : "subtitle2"} 
                        sx={{ 
                            fontWeight: 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {event.title}
                    </Typography>
                    
                    {event.priority === 'urgent' && (
                        <Chip 
                            label="紧急" 
                            size="small" 
                            color="error" 
                            sx={{ ml: 1, height: 20, fontSize: '0.6rem' }}
                        />
                    )}
                </Box>
                
                <Stack direction="row" spacing={1} alignItems="center">
                    {/* 时间信息 */}
                    <Box display="flex" alignItems="center" gap={0.5}>
                        <AccessTime sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                            {showDate 
                                ? format(event.startTime, 'MM月dd日 HH:mm', { locale: zhCN })
                                : format(event.startTime, 'HH:mm')
                            }
                        </Typography>
                    </Box>
                    
                    {/* 地点信息 */}
                    {event.location && (
                        <Box display="flex" alignItems="center" gap={0.5}>
                            <LocationOn sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                                {event.location}
                            </Typography>
                        </Box>
                    )}
                    
                    {/* 状态指示 */}
                    {showStatus && (
                        <Chip 
                            label={statusConfig.label}
                            size="small"
                            color={statusConfig.color}
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.6rem' }}
                        />
                    )}
                </Stack>
                
                {/* 描述信息 */}
                {!compact && event.description && (
                    <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ 
                            mt: 0.5,
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                        }}
                    >
                        {event.description}
                    </Typography>
                )}
            </Box>
            
            {/* 操作按钮 */}
            <IconButton size="small" sx={{ opacity: 0.6 }}>
                <MoreVert fontSize="small" />
            </IconButton>
        </Box>
    );
};

/**
 * 事件统计徽章组件
 */
export const EventBadge = ({ 
    count, 
    type = 'default',
    size = 'medium'
}) => {
    const colors = {
        default: 'primary',
        urgent: 'error',
        completed: 'success',
        pending: 'warning'
    };
    
    const sizes = {
        small: { width: 16, height: 16, fontSize: '0.6rem' },
        medium: { width: 20, height: 20, fontSize: '0.7rem' },
        large: { width: 24, height: 24, fontSize: '0.8rem' }
    };
    
    return (
        <Badge 
            badgeContent={count} 
            color={colors[type]}
            sx={{
                '& .MuiBadge-badge': {
                    ...sizes[size],
                    minWidth: sizes[size].width,
                    fontSize: sizes[size].fontSize
                }
            }}
        >
            <Box />
        </Badge>
    );
};

/**
 * 事件类型过滤器组件
 */
export const EventTypeFilter = ({ 
    selectedTypes = [], 
    onTypeToggle,
    showCounts = false,
    eventCounts = {}
}) => {
    const eventTypes = [
        { key: 'class', label: '课程', icon: School },
        { key: 'exam', label: '考试', icon: Quiz },
        { key: 'assignment', label: '作业', icon: Assignment },
        { key: 'practice', label: '练习', icon: Assignment },
        { key: 'study_plan', label: '学习计划', icon: Schedule },
        { key: 'ai_suggestion', label: 'AI建议', icon: AutoAwesome }
    ];
    
    return (
        <Stack direction="row" spacing={1} flexWrap="wrap">
            {eventTypes.map(({ key, label, icon: IconComponent }) => {
                const isSelected = selectedTypes.includes(key);
                const count = eventCounts[key] || 0;
                
                return (
                    <Chip
                        key={key}
                        label={
                            <Box display="flex" alignItems="center" gap={0.5}>
                                <IconComponent sx={{ fontSize: 14 }} />
                                <span>{label}</span>
                                {showCounts && count > 0 && (
                                    <Badge 
                                        badgeContent={count} 
                                        color="primary"
                                        sx={{ ml: 0.5 }}
                                    />
                                )}
                            </Box>
                        }
                        variant={isSelected ? 'filled' : 'outlined'}
                        color={isSelected ? 'primary' : 'default'}
                        onClick={() => onTypeToggle?.(key)}
                        sx={{
                            bgcolor: isSelected ? EventTypeColors[key] : 'transparent',
                            color: isSelected ? 'white' : 'inherit',
                            '&:hover': {
                                bgcolor: isSelected ? EventTypeColors[key] : 'action.hover'
                            }
                        }}
                    />
                );
            })}
        </Stack>
    );
};

/**
 * 空状态组件
 */
export const EmptyState = ({ 
    icon: IconComponent = Event,
    title = "暂无事件",
    description = "当前时间段没有安排任何事件",
    action = null
}) => {
    return (
        <Box 
            display="flex" 
            flexDirection="column" 
            alignItems="center" 
            justifyContent="center"
            py={4}
            textAlign="center"
        >
            <IconComponent 
                sx={{ 
                    fontSize: 64, 
                    color: 'text.disabled', 
                    mb: 2 
                }} 
            />
            <Typography variant="h6" color="text.secondary" gutterBottom>
                {title}
            </Typography>
            <Typography variant="body2" color="text.disabled" mb={2}>
                {description}
            </Typography>
            {action}
        </Box>
    );
};
