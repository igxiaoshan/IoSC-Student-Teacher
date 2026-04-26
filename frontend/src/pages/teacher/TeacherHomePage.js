import React, { useEffect } from 'react';
import { Container, Box } from '@mui/material';
import { useSelector } from 'react-redux';
import { getSubjectDetails } from '../../redux/sclassRelated/sclassHandle';
import { safeGet } from '../../utils/safeAccess';
import useTeacherClassData from '../../hooks/useTeacherClassData';

// 导入提取的组件
import WelcomeBanner from './components/WelcomeBanner';
import StatCards from './components/StatCards';
import TeachingEfficiencyCard from './components/TeachingEfficiencyCard';
import GradeDistributionChart from './components/GradeDistributionChart';
import WeeklyTaskTimeline from './components/WeeklyTaskTimeline';
import HomeAlertCard from './components/HomeAlertCard';
import AttendanceTrendCard from './components/AttendanceTrendCard';

/**
 * 教师端首页仪表盘
 * 主容器组件 - 协调各子组件
 * 数据与考勤/成绩管理页面联动
 */
const TeacherHomePage = () => {
    const { currentUser } = useSelector((state) => state.user);
    const { subjectDetails } = useSelector((state) => state.sclass);

    const classID = safeGet(currentUser, 'teachSclass._id');
    const subjectID = safeGet(currentUser, 'teachSubject._id');

    // 使用统一数据 hook - 支持考勤/成绩提交后自动刷新
    const {
        overviewStats,
        students,
        overviewLoading,
        refreshTriggers,
        fetchOverviewStats
    } = useTeacherClassData(classID, {
        autoFetch: true,
        fetchStudents: true,
        fetchOverview: true
    });

    // 监听 refreshTriggers - 考勤/成绩提交后自动更新
    useEffect(() => {
        if (refreshTriggers.attendance || refreshTriggers.grades) {
            fetchOverviewStats();
        }
    }, [refreshTriggers.attendance, refreshTriggers.grades, fetchOverviewStats]);

    // 获取科目详情
    useEffect(() => {
        if (subjectID) {
            getSubjectDetails(subjectID, "Subject");
        }
    }, [subjectID]);

    // 计算统计数据
    const numberOfStudents = students?.length || 0;
    const numberOfSessions = subjectDetails?.sessions || 0;

    // 考勤率 (百分比)
    const attendanceRate = overviewStats?.attendanceRate
        ? (overviewStats.attendanceRate * 100).toFixed(1)
        : 0;

    // 计算教学效率数据
    const efficiencyData = {
        overallScore: overviewStats?.avgScore ? Math.round(overviewStats.avgScore) : 0,
        lessonCompletion: overviewStats?.completedLessons ? Math.min(100, overviewStats.completedLessons * 10) : 0,
        studentEngagement: attendanceRate || 0,
        averageScore: overviewStats?.avgScore?.toFixed(1) || '-',
        improvement: overviewStats?.improvement || 0
    };

    // 成绩分布数据 (模拟五段分布)
    const gradeDistribution = overviewStats?.gradeDistribution || [0, 0, 0, 0, 0];

    return (
        <Container maxWidth={false} sx={{ mt: 2, mb: 4, px: { xs: 1, sm: 2, md: 3 } }}>
            {/* 欢迎横幅 */}
            <WelcomeBanner currentUser={currentUser} />

            {/* 统计卡片行 */}
            <StatCards
                numberOfStudents={numberOfStudents}
                numberOfSessions={numberOfSessions}
                attendanceRate={attendanceRate}
                averageScore={overviewStats?.avgScore?.toFixed(1) || '-'}
                loading={overviewLoading}
            />

            {/* 主要内容区 - 使用 Grid 布局 */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
                    gap: 3
                }}
            >
                {/* 左侧列 */}
                <Box>
                    <Box sx={{ mb: 3 }}>
                        <TeachingEfficiencyCard
                            data={efficiencyData}
                            loading={overviewLoading}
                        />
                    </Box>
                </Box>

                {/* 中间列 */}
                <Box>
                    <Box sx={{ mb: 3 }}>
                        <GradeDistributionChart
                            data={gradeDistribution}
                            loading={overviewLoading}
                        />
                    </Box>
                    <WeeklyTaskTimeline
                        tasks={null}
                        loading={overviewLoading}
                    />
                </Box>

                {/* 右侧列 - 预警卡片 */}
                <Box>
                    <Box sx={{ mb: 3 }}>
                        <HomeAlertCard
                            warningCount={overviewStats?.warningCount || 0}
                            dangerCount={overviewStats?.dangerCount || 0}
                            loading={overviewLoading}
                        />
                    </Box>
                    <Box sx={{ mb: 3 }}>
                        <AttendanceTrendCard
                            attendanceByDate={overviewStats?.attendanceByDate}
                            loading={overviewLoading}
                        />
                    </Box>
                </Box>
            </Box>
        </Container>
    );
};

export default TeacherHomePage;