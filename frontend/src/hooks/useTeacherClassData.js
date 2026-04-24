import { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    getClassOverviewStats,
    getClassStudents,
    notifyAttendanceUpdate,
    notifyGradeUpdate,
    clearRefreshTrigger
} from '../redux/sclassRelated/sclassHandle';

/**
 * 教师班级数据共享 Hook
 * 用于班级详情、考勤管理、成绩管理等页面间的数据同步
 */
const useTeacherClassData = (classId, options = {}) => {
    const {
        autoFetch = true,
        fetchStudents = true,
        fetchOverview = true
    } = options;

    const dispatch = useDispatch();
    const {
        classOverviewStats,
        sclassStudents,
        lastDataUpdate,
        refreshTriggers,
        overviewLoading,
        loading
    } = useSelector((state) => state.sclass);

    // 获取班级概览统计
    const fetchOverviewStats = useCallback(() => {
        if (classId && fetchOverview) {
            dispatch(getClassOverviewStats(classId));
        }
    }, [classId, fetchOverview, dispatch]);

    // 获取班级学生列表
    const fetchStudentsList = useCallback(() => {
        if (classId && fetchStudents) {
            dispatch(getClassStudents(classId));
        }
    }, [classId, fetchStudents, dispatch]);

    // 刷新所有数据
    const refreshAll = useCallback(() => {
        fetchOverviewStats();
        fetchStudentsList();
    }, [fetchOverviewStats, fetchStudentsList]);

    // 考勤提交后调用
    const onAttendanceSubmitted = useCallback(() => {
        dispatch(notifyAttendanceUpdate());
        fetchOverviewStats();
    }, [dispatch, fetchOverviewStats]);

    // 成绩提交后调用
    const onGradeSubmitted = useCallback(() => {
        dispatch(notifyGradeUpdate());
        fetchOverviewStats();
    }, [dispatch, fetchOverviewStats]);

    // 监听刷新触发器
    useEffect(() => {
        if (refreshTriggers.attendance) {
            fetchOverviewStats();
            dispatch(clearRefreshTrigger('attendance'));
        }
    }, [refreshTriggers.attendance, fetchOverviewStats, dispatch]);

    useEffect(() => {
        if (refreshTriggers.grades) {
            fetchOverviewStats();
            dispatch(clearRefreshTrigger('grades'));
        }
    }, [refreshTriggers.grades, fetchOverviewStats, dispatch]);

    // 自动获取数据
    useEffect(() => {
        if (autoFetch && classId) {
            if (fetchOverview) fetchOverviewStats();
            if (fetchStudents) fetchStudentsList();
        }
    }, [autoFetch, classId]); // eslint-disable-line react-hooks/exhaustive-deps

    return {
        // 数据
        overviewStats: classOverviewStats,
        students: sclassStudents,
        lastUpdate: lastDataUpdate,

        // 加载状态
        overviewLoading,
        studentsLoading: loading,

        // 方法
        refreshAll,
        fetchOverviewStats,
        fetchStudentsList,
        onAttendanceSubmitted,
        onGradeSubmitted,

        // 刷新状态
        refreshTriggers
    };
};

export default useTeacherClassData;
