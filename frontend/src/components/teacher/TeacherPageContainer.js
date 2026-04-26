import React from 'react';
import {
    Container, Paper, Box, Typography, Avatar, Chip
} from '@mui/material';

/**
 * 教师端响应式页面容器组件
 * 统一页面标题、统计卡片布局
 *
 * @param {Object} props
 * @param {string} props.title - 页面标题
 * @param {React.ReactNode} props.icon - 标题图标
 * @param {string} props.subtitle - 副标题
 * @param {React.ReactNode} props.actions - 右上角操作按钮
 * @param {Array} props.stats - 统计卡片数据 [{label, value, color}]
 * @param {React.ReactNode} props.children - 页面内容
 * @param {boolean} props.loading - 加载状态
 * @param {string} props.chipLabel - 右上角标签文字
 */
const TeacherPageContainer = ({
    title,
    icon,
    subtitle,
    actions,
    stats,
    children,
    loading = false,
    chipLabel,
    maxWidth = 'lg'
}) => {
    return (
        <Container maxWidth={maxWidth} sx={{ mt: 4, mb: 4 }}>
            {/* 页面标题 */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Box
                    display="flex"
                    flexDirection={{ xs: 'column', sm: 'row' }}
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    justifyContent="space-between"
                    gap={2}
                >
                    <Box display="flex" alignItems="center">
                        {icon && (
                            <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                                {icon}
                            </Avatar>
                        )}
                        <Box>
                            <Typography
                                variant="h5"
                                fontWeight={600}
                                component="h1"
                            >
                                {title}
                            </Typography>
                            {subtitle && (
                                <Typography variant="body2" color="text.secondary">
                                    {subtitle}
                                </Typography>
                            )}
                        </Box>
                    </Box>

                    <Box
                        display="flex"
                        alignItems="center"
                        gap={2}
                        alignSelf={{ xs: 'flex-start', sm: 'center' }}
                    >
                        {chipLabel && (
                            <Chip label={chipLabel} color="primary" variant="outlined" />
                        )}
                        {actions}
                    </Box>
                </Box>

                {/* 统计卡片行 */}
                {stats && stats.length > 0 && (
                    <Box mt={3}>
                        <Box
                            display="grid"
                            gridTemplateColumns={{
                                xs: 'repeat(2, 1fr)',
                                sm: 'repeat(2, 1fr)',
                                md: `repeat(${Math.min(stats.length, 4)}, 1fr)`
                            }}
                            gap={2}
                        >
                            {stats.map((stat, index) => (
                                <Box
                                    key={index}
                                    sx={{
                                        bgcolor: `${stat.color || 'primary'}.light`,
                                        borderRadius: 2,
                                        p: 2,
                                        textAlign: 'center'
                                    }}
                                >
                                    <Typography
                                        variant="h4"
                                        fontWeight={600}
                                        color={`${stat.color || 'primary'}.dark`}
                                    >
                                        {loading ? '-' : stat.value}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {stat.label}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                )}
            </Paper>

            {/* 页面内容 */}
            {children}
        </Container>
    );
};

export default TeacherPageContainer;
