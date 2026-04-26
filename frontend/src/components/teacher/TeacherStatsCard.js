import React from 'react';
import { Card, CardContent, Box, Typography, Skeleton } from '@mui/material';
import CountUp from 'react-countup';

/**
 * 教师端通用统计卡片组件
 *
 * @param {Object} props
 * @param {string} props.label - 卡片标签
 * @param {number|string} props.value - 卡片数值
 * @param {string} props.icon - 图片路径
 * @param {string} props.alt - 图片alt文本
 * @param {string} props.color - 主题色 (primary, success, warning, info)
 * @param {string} props.suffix - 数值后缀
 * @param {boolean} props.loading - 加载状态
 * @param {boolean} props.hover - 是否显示悬停效果
 */
const TeacherStatsCard = ({
    label,
    value,
    icon,
    alt = '',
    color = 'primary',
    suffix = '',
    loading = false,
    hover = true
}) => {
    return (
        <Card
            sx={{
                height: 140,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': hover ? { transform: 'translateY(-4px)', boxShadow: 4 } : {},
                borderRadius: 2
            }}
        >
            <CardContent sx={{ textAlign: 'center', width: '100%' }}>
                {icon && (
                    <Box
                        component="img"
                        src={icon}
                        alt={alt}
                        sx={{ width: 40, height: 40, mb: 1 }}
                    />
                )}
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 0.5 }}
                >
                    {label}
                </Typography>
                {loading ? (
                    <Skeleton variant="text" width={60} sx={{ mx: 'auto' }} />
                ) : (
                    <Typography
                        variant="h5"
                        fontWeight="bold"
                        color={`${color}.main`}
                    >
                        <CountUp
                            start={0}
                            end={value}
                            duration={2}
                            suffix={suffix}
                        />
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
};

export default TeacherStatsCard;