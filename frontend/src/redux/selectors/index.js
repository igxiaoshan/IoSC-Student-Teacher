/**
 * Redux Selector 工具函数
 * 使用 reselect 创建带缓存的 selector，优化性能
 */

import { createSelector } from 'reselect';

// ============================================
// User Selectors
// ============================================

// 基础 selector
const selectUserState = (state) => state.user;

export const selectCurrentUser = createSelector(
    [selectUserState],
    (user) => user?.currentUser
);

export const selectCurrentRole = createSelector(
    [selectUserState],
    (user) => user?.currentRole
);

export const selectIsAuthenticated = createSelector(
    [selectCurrentUser],
    (user) => !!user
);

export const selectUserLoading = createSelector(
    [selectUserState],
    (user) => user?.loading || user?.status === 'loading'
);

export const selectUserError = createSelector(
    [selectUserState],
    (user) => user?.error
);

// ============================================
// Student Selectors
// ============================================

const selectStudentState = (state) => state.student;

export const selectStudentsList = createSelector(
    [selectStudentState],
    (student) => student?.studentsList || []
);

export const selectStudentDetails = createSelector(
    [selectStudentState],
    (student) => student?.studentDetails
);

export const selectStudentLoading = createSelector(
    [selectStudentState],
    (student) => student?.loading
);

export const selectStudentError = createSelector(
    [selectStudentState],
    (student) => student?.error
);

// 按 ID 选择学生（带缓存）
export const selectStudentById = (studentId) => createSelector(
    [selectStudentsList],
    (students) => students.find(s => s._id === studentId || s.id === studentId)
);

// 按班级筛选学生
export const selectStudentsByClass = (classId) => createSelector(
    [selectStudentsList],
    (students) => students.filter(s => s.sclassName?._id === classId || s.sclassName === classId)
);

// ============================================
// Teacher Selectors
// ============================================

const selectTeacherState = (state) => state.teacher;

export const selectTeachersList = createSelector(
    [selectTeacherState],
    (teacher) => teacher?.teachersList || []
);

export const selectTeacherDetails = createSelector(
    [selectTeacherState],
    (teacher) => teacher?.teacherDetails
);

export const selectTeacherLoading = createSelector(
    [selectTeacherState],
    (teacher) => teacher?.loading
);

export const selectTeacherPagination = createSelector(
    [selectTeacherState],
    (teacher) => teacher?.pagination
);

// 按 ID 选择教师
export const selectTeacherById = (teacherId) => createSelector(
    [selectTeachersList],
    (teachers) => teachers.find(t => t._id === teacherId || t.id === teacherId)
);

// 按科目筛选教师
export const selectTeachersBySubject = (subjectId) => createSelector(
    [selectTeachersList],
    (teachers) => teachers.filter(t => t.teachSubject?._id === subjectId || t.teachSubject === subjectId)
);

// ============================================
// Class Selectors
// ============================================

const selectSclassState = (state) => state.sclass;

export const selectClassesList = createSelector(
    [selectSclassState],
    (sclass) => sclass?.sclassesList || []
);

export const selectClassDetails = createSelector(
    [selectSclassState],
    (sclass) => sclass?.sclassDetails
);

export const selectClassLoading = createSelector(
    [selectSclassState],
    (sclass) => sclass?.loading
);

// ============================================
// Subject Selectors
// ============================================

const selectSubjectState = (state) => state.subject;

export const selectSubjectsList = createSelector(
    [selectSubjectState],
    (subject) => subject?.subjectsList || []
);

export const selectSubjectDetails = createSelector(
    [selectSubjectState],
    (subject) => subject?.subjectDetails
);

// ============================================
// AI State Selectors
// ============================================

const selectAiState = (state) => state.ai;

// 学习助手
export const selectStudyAssistant = createSelector(
    [selectAiState],
    (ai) => ai?.studyAssistant
);

export const selectStudyAssistantLoading = createSelector(
    [selectStudyAssistant],
    (assistant) => assistant?.loading
);

export const selectStudyAssistantMessages = createSelector(
    [selectStudyAssistant],
    (assistant) => assistant?.messages || []
);

// 练习助手
export const selectPracticeAssistant = createSelector(
    [selectAiState],
    (ai) => ai?.practiceAssistant
);

export const selectPracticeQuestions = createSelector(
    [selectPracticeAssistant],
    (practice) => practice?.questions || []
);

// 教师AI工具
export const selectTeacherAI = createSelector(
    [selectAiState],
    (ai) => ai?.teacherAI
);

export const selectLessonPlan = createSelector(
    [selectTeacherAI],
    (teacherAI) => teacherAI?.lessonPlan
);

export const selectQuestionGeneration = createSelector(
    [selectTeacherAI],
    (teacherAI) => teacherAI?.questionGeneration
);

// ============================================
// Notice Selectors
// ============================================

const selectNoticeState = (state) => state.notice;

export const selectNoticesList = createSelector(
    [selectNoticeState],
    (notice) => notice?.noticesList || []
);

export const selectNoticeLoading = createSelector(
    [selectNoticeState],
    (notice) => notice?.loading
);

// ============================================
// Computed/Derived Selectors
// ============================================

// 统计数据
export const selectDashboardStats = createSelector(
    [selectStudentsList, selectTeachersList, selectClassesList, selectSubjectsList],
    (students, teachers, classes, subjects) => ({
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalClasses: classes.length,
        totalSubjects: subjects.length,
    })
);

// 教师与班级关联
export const selectTeachersWithClassInfo = createSelector(
    [selectTeachersList, selectClassesList],
    (teachers, classes) => teachers.map(teacher => ({
        ...teacher,
        className: classes.find(c => c._id === teacher.teachSclass?._id)?.sclassName || '未分配班级'
    }))
);

// 学生与班级关联
export const selectStudentsWithClassInfo = createSelector(
    [selectStudentsList, selectClassesList],
    (students, classes) => students.map(student => ({
        ...student,
        className: classes.find(c => c._id === student.sclassName?._id)?.sclassName || '未分配班级'
    }))
);

// ============================================
// Selector 工厂函数
// ============================================

/**
 * 创建参数化的 selector
 * 用于需要传入参数的 selector
 */
export const createParameterizedSelector = (selectorFn) => {
    const cache = new Map();

    return (param) => {
        // 简单的缓存键
        const key = typeof param === 'object' ? JSON.stringify(param) : param;

        if (!cache.has(key)) {
            cache.set(key, selectorFn(param));
        }

        return cache.get(key);
    };
};

export default {
    // User
    selectCurrentUser,
    selectCurrentRole,
    selectIsAuthenticated,
    // Student
    selectStudentsList,
    selectStudentById,
    selectStudentsByClass,
    // Teacher
    selectTeachersList,
    selectTeacherById,
    selectTeachersBySubject,
    // Class
    selectClassesList,
    // Subject
    selectSubjectsList,
    // Stats
    selectDashboardStats,
};