import React, { useEffect, useState } from 'react';
import { Container, Box } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { getClassStudents, getSubjectDetails } from '../../redux/sclassRelated/sclassHandle';
import { safeGet } from '../../utils/safeAccess';

// 导入提取的组件
import WelcomeBanner from './components/WelcomeBanner';
import StatCards from './components/StatCards';
import TeachingEfficiencyCard from './components/TeachingEfficiencyCard';
import GradeDistributionChart from './components/GradeDistributionChart';
import WeeklyTaskTimeline from './components/WeeklyTaskTimeline';

/**
 * 教师端首页仪表盘
 * 主容器组件 - 协调各子组件
 */
const TeacherHomePage = () => {
    const dispatch = useDispatch();

    const { currentUser } = useSelector((state) => state.user);
    const { subjectDetails, sclassStudents } = useSelector((state) => state.sclass);

    const [dashboardData, setDashboardData] = useState(null);
    const [dataLoading, setDataLoading] = useState(true);

    const classID = safeGet(currentUser, 'teachSclass._id');
    const subjectID = safeGet(currentUser, 'teachSubject._id');

    useEffect(() => {
        if (subjectID) {
            dispatch(getSubjectDetails(subjectID, "Subject"));
        }
        if (classID) {
            dispatch(getClassStudents(classID));
        }
        fetchDashboardData();
    }, [dispatch, subjectID, classID]);

    const fetchDashboardData = async () => {
        setDataLoading(true);
        try {
            // 模拟数据获取
            setTimeout(() => {
                setDashboardData({
                    efficiency: { overallScore: 85, lessonCompletion: 92, studentEngagement: 78, averageScore: 82, improvement: 5 },
                    gradeDistribution: [8, 12, 10, 5, 2],
                    pendingGrading: 15,
                    weeklyTasks: null,
                    suggestions: null,
                    classProgress: null
                });
                setDataLoading(false);
            }, 500);
        } catch (err) {
            console.error('Dashboard data fetch error:', err);
            setDataLoading(false);
        }
    };

    const numberOfStudents = sclassStudents && sclassStudents.length;
    const numberOfSessions = subjectDetails && subjectDetails.sessions;

    return (
        <Container maxWidth={false} sx={{ mt: 2, mb: 4, px: { xs: 1, sm: 2, md: 3 } }}>
            {/* 欢迎横幅 */}
            <WelcomeBanner currentUser={currentUser} />

            {/* 统计卡片行 */}
            <StatCards
                numberOfStudents={numberOfStudents}
                numberOfSessions={numberOfSessions}
                loading={dataLoading}
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
                            data={dashboardData?.efficiency}
                            loading={dataLoading}
                        />
                    </Box>
                </Box>

                {/* 中间列 */}
                <Box>
                    <Box sx={{ mb: 3 }}>
                        <GradeDistributionChart
                            data={dashboardData?.gradeDistribution}
                            loading={dataLoading}
                        />
                    </Box>
                    <WeeklyTaskTimeline
                        tasks={dashboardData?.weeklyTasks}
                        loading={dataLoading}
                    />
                </Box>

                {/* 右侧列 */}
                <Box>
                    <Box sx={{ mb: 3 }}>
                        {/* 占位 - 未来可添加 AI 建议卡片 */}
                    </Box>
                </Box>
            </Box>
        </Container>
    );
};

export default TeacherHomePage;