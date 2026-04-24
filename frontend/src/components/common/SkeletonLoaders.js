/**
 * 骨架屏组件
 * 用于加载状态，提升用户体验
 */

import React from 'react';
import { Box, Skeleton, Card, CardContent, Grid, Table, TableBody, TableCell, TableHead, TableRow, Paper } from '@mui/material';

// ============================================
// 基础骨架屏组件
// ============================================

/**
 * 文本骨架屏
 */
export const TextSkeleton = ({ lines = 3, width = '100%', height = 20, spacing = 1 }) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing }}>
        {Array.from({ length: lines }).map((_, index) => (
            <Skeleton
                key={index}
                variant="text"
                width={index === lines - 1 ? '60%' : width}
                height={height}
            />
        ))}
    </Box>
);

/**
 * 卡片骨架屏
 */
export const CardSkeleton = ({ height = 200, showActions = true }) => (
    <Card sx={{ height }}>
        <CardContent>
            <Skeleton variant="text" width="40%" height={30} />
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="text" width="80%" />
            <Skeleton variant="text" width="60%" />
            {showActions && (
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Skeleton variant="rectangular" width={80} height={36} sx={{ borderRadius: 1 }} />
                    <Skeleton variant="rectangular" width={80} height={36} sx={{ borderRadius: 1 }} />
                </Box>
            )}
        </CardContent>
    </Card>
);

/**
 * 头像骨架屏
 */
export const AvatarSkeleton = ({ size = 40 }) => (
    <Skeleton variant="circular" width={size} height={size} />
);

/**
 * 列表项骨架屏
 */
export const ListItemSkeleton = ({ showAvatar = true, lines = 2 }) => (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, p: 2 }}>
        {showAvatar && <AvatarSkeleton />}
        <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="30%" height={24} />
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton key={i} variant="text" width={i === lines - 1 ? '50%' : '100%'} />
            ))}
        </Box>
    </Box>
);

// ============================================
// 复合骨架屏组件
// ============================================

/**
 * 列表骨架屏
 */
export const ListSkeleton = ({ count = 5, showAvatar = true }) => (
    <Box>
        {Array.from({ length: count }).map((_, index) => (
            <ListItemSkeleton key={index} showAvatar={showAvatar} />
        ))}
    </Box>
);

/**
 * 网格卡片骨架屏
 */
export const GridCardSkeleton = ({ count = 6, columns = { xs: 12, sm: 6, md: 4 } }) => (
    <Grid container spacing={3}>
        {Array.from({ length: count }).map((_, index) => (
            <Grid item {...columns} key={index}>
                <CardSkeleton />
            </Grid>
        ))}
    </Grid>
);

/**
 * 表格骨架屏
 */
export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <Table>
            <TableHead>
                <TableRow>
                    {Array.from({ length: columns }).map((_, index) => (
                        <TableCell key={index}>
                            <Skeleton variant="text" width="80%" />
                        </TableCell>
                    ))}
                </TableRow>
            </TableHead>
            <TableBody>
                {Array.from({ length: rows }).map((_, rowIndex) => (
                    <TableRow key={rowIndex}>
                        {Array.from({ length: columns }).map((_, colIndex) => (
                            <TableCell key={colIndex}>
                                <Skeleton variant="text" width={colIndex === 0 ? '60%' : '80%'} />
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </Paper>
);

/**
 * 详情页骨架屏
 */
export const DetailSkeleton = () => (
    <Box sx={{ p: 3 }}>
        {/* 标题区 */}
        <Box sx={{ mb: 3 }}>
            <Skeleton variant="text" width="40%" height={40} />
            <Skeleton variant="text" width="60%" />
        </Box>

        {/* 信息卡片 */}
        <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
                <CardSkeleton height={250} />
            </Grid>
            <Grid item xs={12} md={6}>
                <CardSkeleton height={250} />
            </Grid>
        </Grid>

        {/* 内容区 */}
        <Box sx={{ mt: 3 }}>
            <Skeleton variant="rectangular" width="100%" height={300} sx={{ borderRadius: 1 }} />
        </Box>
    </Box>
);

/**
 * 仪表盘骨架屏
 */
export const DashboardSkeleton = () => (
    <Box sx={{ p: 3 }}>
        {/* 统计卡片 */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
            {[1, 2, 3, 4].map((item) => (
                <Grid item xs={12} sm={6} md={3} key={item}>
                    <Card sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Skeleton variant="circular" width={48} height={48} />
                            <Box sx={{ flex: 1 }}>
                                <Skeleton variant="text" width="60%" />
                                <Skeleton variant="text" width="40%" height={30} />
                            </Box>
                        </Box>
                    </Card>
                </Grid>
            ))}
        </Grid>

        {/* 图表区 */}
        <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
                <Card sx={{ p: 2 }}>
                    <Skeleton variant="text" width="30%" height={30} />
                    <Skeleton variant="rectangular" width="100%" height={300} sx={{ mt: 2, borderRadius: 1 }} />
                </Card>
            </Grid>
            <Grid item xs={12} md={4}>
                <Card sx={{ p: 2 }}>
                    <Skeleton variant="text" width="50%" height={30} />
                    <ListSkeleton count={5} showAvatar={false} />
                </Card>
            </Grid>
        </Grid>
    </Box>
);

/**
 * 表单骨架屏
 */
export const FormSkeleton = ({ fields = 6 }) => (
    <Box sx={{ p: 3 }}>
        {Array.from({ length: fields }).map((_, index) => (
            <Box key={index} sx={{ mb: 3 }}>
                <Skeleton variant="text" width="20%" height={24} />
                <Skeleton variant="rectangular" width="100%" height={56} sx={{ mt: 1, borderRadius: 1 }} />
            </Box>
        ))}
        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Skeleton variant="rectangular" width={120} height={40} sx={{ borderRadius: 1 }} />
            <Skeleton variant="rectangular" width={120} height={40} sx={{ borderRadius: 1 }} />
        </Box>
    </Box>
);

// ============================================
// 智能骨架屏组件
// ============================================

/**
 * 根据类型自动选择骨架屏
 */
export const SkeletonLoader = ({ type = 'list', ...props }) => {
    const skeletons = {
        text: TextSkeleton,
        card: CardSkeleton,
        list: ListSkeleton,
        grid: GridCardSkeleton,
        table: TableSkeleton,
        detail: DetailSkeleton,
        dashboard: DashboardSkeleton,
        form: FormSkeleton,
    };

    const Component = skeletons[type] || ListSkeleton;
    return <Component {...props} />;
};

export default SkeletonLoader;