import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    sclassesList: [],
    sclassStudents: [],
    sclassTeachers: [],
    sclassDetails: [],
    subjectsList: [],
    subjectDetails: [],
    classStatistics: null,
    // 班级概览统计（用于班级详情页面）
    classOverviewStats: {
        totalStudents: 0,
        presentToday: 0,
        avgScore: 0,
        completedLessons: 0,
        attendanceRate: 0,
        passRate: 0
    },
    // 数据更新时间戳（用于跨页面数据同步）
    lastDataUpdate: {
        attendance: null,
        grades: null
    },
    // 刷新触发器（用于通知其他页面刷新数据）
    refreshTriggers: {
        attendance: false,
        grades: false
    },
    pagination: {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: 10
    },
    filters: {
        search: '',
        grade: '',
        status: '',
        sortBy: 'sclassName',
        sortOrder: 'asc'
    },
    loading: false,
    subloading: false,
    statsLoading: false,
    batchLoading: false,
    overviewLoading: false,
    error: null,
    response: null,
    getresponse: null,
    batchResponse: null,
};

const sclassSlice = createSlice({
    name: 'sclass',
    initialState,
    reducers: {
        getRequest: (state) => {
            state.loading = true;
            state.error = null;
        },
        getSubDetailsRequest: (state) => {
            state.subloading = true;
            state.error = null;
        },
        getStatsRequest: (state) => {
            state.statsLoading = true;
            state.error = null;
        },
        getBatchRequest: (state) => {
            state.batchLoading = true;
            state.error = null;
        },
        getSuccess: (state, action) => {
            if (action.payload.data) {
                state.sclassesList = action.payload.data;
                state.pagination = action.payload.pagination || state.pagination;
            } else {
                // 兼容旧格式
                state.sclassesList = action.payload;
            }
            state.loading = false;
            state.error = null;
            state.getresponse = null;
        },
        getStudentsSuccess: (state, action) => {
            state.sclassStudents = action.payload.data || action.payload;
            state.loading = false;
            state.error = null;
            state.getresponse = null;
        },
        getTeachersSuccess: (state, action) => {
            state.sclassTeachers = action.payload.data || action.payload;
            state.loading = false;
            state.error = null;
            state.getresponse = null;
        },
        getSubjectsSuccess: (state, action) => {
            state.subjectsList = action.payload.data || action.payload;
            state.loading = false;
            state.error = null;
            state.response = null;
        },
        getStatsSuccess: (state, action) => {
            state.classStatistics = action.payload.data || action.payload;
            state.statsLoading = false;
            state.error = null;
        },
        getBatchSuccess: (state, action) => {
            state.batchResponse = action.payload;
            state.batchLoading = false;
            state.error = null;
        },
        getFailed: (state, action) => {
            state.subjectsList = [];
            state.response = action.payload;
            state.loading = false;
            state.error = null;
        },
        getFailedTwo: (state, action) => {
            state.sclassesList = [];
            state.sclassStudents = [];
            state.sclassTeachers = [];
            state.getresponse = action.payload;
            state.loading = false;
            state.error = null;
        },
        getError: (state, action) => {
            state.loading = false;
            state.subloading = false;
            state.statsLoading = false;
            state.batchLoading = false;
            state.error = action.payload;
        },
        detailsSuccess: (state, action) => {
            state.sclassDetails = action.payload.data || action.payload;
            state.loading = false;
            state.error = null;
        },
        getSubDetailsSuccess: (state, action) => {
            state.subjectDetails = action.payload.data || action.payload;
            state.subloading = false;
            state.error = null;
        },
        setFilters: (state, action) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        resetFilters: (state) => {
            state.filters = {
                search: '',
                grade: '',
                status: '',
                sortBy: 'sclassName',
                sortOrder: 'asc'
            };
        },
        resetSubjects: (state) => {
            state.subjectsList = [];
            state.sclassesList = [];
        },
        clearError: (state) => {
            state.error = null;
        },
        clearResponse: (state) => {
            state.response = null;
            state.getresponse = null;
            state.batchResponse = null;
        },
        // 班级概览统计相关
        getOverviewRequest: (state) => {
            state.overviewLoading = true;
            state.error = null;
        },
        getOverviewSuccess: (state, action) => {
            state.classOverviewStats = {
                ...state.classOverviewStats,
                ...action.payload
            };
            state.overviewLoading = false;
            state.error = null;
        },
        // 刷新触发器相关
        triggerAttendanceRefresh: (state) => {
            state.refreshTriggers.attendance = true;
            state.lastDataUpdate.attendance = Date.now();
        },
        triggerGradesRefresh: (state) => {
            state.refreshTriggers.grades = true;
            state.lastDataUpdate.grades = Date.now();
        },
        resetRefreshTrigger: (state, action) => {
            if (action.payload === 'attendance') {
                state.refreshTriggers.attendance = false;
            } else if (action.payload === 'grades') {
                state.refreshTriggers.grades = false;
            }
        },
    },
});

export const {
    getRequest,
    getSuccess,
    getFailed,
    getError,
    getStudentsSuccess,
    getTeachersSuccess,
    getSubjectsSuccess,
    detailsSuccess,
    getFailedTwo,
    resetSubjects,
    getSubDetailsSuccess,
    getSubDetailsRequest,
    getStatsRequest,
    getStatsSuccess,
    getBatchRequest,
    getBatchSuccess,
    setFilters,
    resetFilters,
    clearError,
    clearResponse,
    getOverviewRequest,
    getOverviewSuccess,
    triggerAttendanceRefresh,
    triggerGradesRefresh,
    resetRefreshTrigger
} = sclassSlice.actions;

export const sclassReducer = sclassSlice.reducer;