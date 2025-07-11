import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    // 学习助手状态
    studyAssistant: {
        loading: false,
        messages: [],
        currentSession: null,
        error: null
    },
    
    // 练习助手状态
    practiceAssistant: {
        loading: false,
        currentSession: null,
        questions: [],
        currentQuestion: 0,
        answers: [],
        feedback: null,
        score: 0,
        error: null
    },
    
    // 学习路径状态
    learningPath: {
        loading: false,
        currentPath: null,
        progress: {},
        recommendations: [],
        error: null
    },
    
    // 学习伙伴状态
    learningCompanion: {
        loading: false,
        companionState: null,
        conversations: [],
        mood: 'neutral',
        achievements: [],
        error: null
    },
    
    // 教师AI工具状态
    teacherAI: {
        // 智能备课
        lessonPlan: {
            loading: false,
            currentPlan: null,
            templates: [],
            error: null
        },
        
        // 智能出题
        questionGeneration: {
            loading: false,
            generatedQuestions: [],
            templates: [],
            error: null
        },
        
        // 智能阅卷
        grading: {
            loading: false,
            results: [],
            analytics: null,
            error: null
        }
    },
    
    // 管理AI功能状态
    adminAI: {
        // 数据分析
        analytics: {
            loading: false,
            dashboardData: null,
            reports: [],
            error: null
        },
        
        // 质量监控
        qualityMonitor: {
            loading: false,
            qualityData: null,
            alerts: [],
            error: null
        },
        
        // 决策支持
        decisionSupport: {
            loading: false,
            recommendations: [],
            insights: [],
            error: null
        }
    },
    
    // 通用AI状态
    common: {
        aiFeatures: {
            chatbot: true,
            personalizedExercise: true,
            answerAnalysis: true,
            performanceAnalysis: true,
            lessonPlanGeneration: true,
            questionGeneration: true
        },
        loading: false,
        error: null
    }
};

const aiSlice = createSlice({
    name: 'ai',
    initialState,
    reducers: {
        // 学习助手相关
        studyAssistantRequest: (state) => {
            state.studyAssistant.loading = true;
            state.studyAssistant.error = null;
        },
        studyAssistantSuccess: (state, action) => {
            state.studyAssistant.loading = false;
            state.studyAssistant.messages.push(action.payload);
        },
        studyAssistantFailure: (state, action) => {
            state.studyAssistant.loading = false;
            state.studyAssistant.error = action.payload;
        },
        addStudyAssistantMessage: (state, action) => {
            state.studyAssistant.messages.push(action.payload);
        },
        clearStudyAssistantMessages: (state) => {
            state.studyAssistant.messages = [];
        },
        
        // 练习助手相关
        practiceSessionStart: (state, action) => {
            state.practiceAssistant.loading = false;
            state.practiceAssistant.currentSession = action.payload.sessionId;
            state.practiceAssistant.questions = action.payload.questions;
            state.practiceAssistant.currentQuestion = 0;
            state.practiceAssistant.answers = [];
            state.practiceAssistant.score = 0;
        },
        practiceAnswerSubmit: (state, action) => {
            state.practiceAssistant.answers.push(action.payload);
            state.practiceAssistant.feedback = action.payload.feedback;
        },
        practiceNextQuestion: (state) => {
            state.practiceAssistant.currentQuestion += 1;
            state.practiceAssistant.feedback = null;
        },
        practiceSessionComplete: (state, action) => {
            state.practiceAssistant.score = action.payload.score;
            state.practiceAssistant.currentSession = null;
        },
        practiceRequest: (state) => {
            state.practiceAssistant.loading = true;
            state.practiceAssistant.error = null;
        },
        practiceFailure: (state, action) => {
            state.practiceAssistant.loading = false;
            state.practiceAssistant.error = action.payload;
        },
        
        // 学习路径相关
        learningPathRequest: (state) => {
            state.learningPath.loading = true;
            state.learningPath.error = null;
        },
        learningPathSuccess: (state, action) => {
            state.learningPath.loading = false;
            state.learningPath.currentPath = action.payload;
        },
        learningPathFailure: (state, action) => {
            state.learningPath.loading = false;
            state.learningPath.error = action.payload;
        },
        updateLearningProgress: (state, action) => {
            state.learningPath.progress = { ...state.learningPath.progress, ...action.payload };
        },
        
        // 学习伙伴相关
        companionRequest: (state) => {
            state.learningCompanion.loading = true;
            state.learningCompanion.error = null;
        },
        companionSuccess: (state, action) => {
            state.learningCompanion.loading = false;
            state.learningCompanion.companionState = action.payload;
        },
        companionFailure: (state, action) => {
            state.learningCompanion.loading = false;
            state.learningCompanion.error = action.payload;
        },
        addCompanionMessage: (state, action) => {
            state.learningCompanion.conversations.push(action.payload);
        },
        updateCompanionMood: (state, action) => {
            state.learningCompanion.mood = action.payload;
        },
        
        // 教师AI工具相关
        lessonPlanRequest: (state) => {
            state.teacherAI.lessonPlan.loading = true;
            state.teacherAI.lessonPlan.error = null;
        },
        lessonPlanSuccess: (state, action) => {
            state.teacherAI.lessonPlan.loading = false;
            state.teacherAI.lessonPlan.currentPlan = action.payload;
        },
        lessonPlanFailure: (state, action) => {
            state.teacherAI.lessonPlan.loading = false;
            state.teacherAI.lessonPlan.error = action.payload;
        },
        
        questionGenerationRequest: (state) => {
            state.teacherAI.questionGeneration.loading = true;
            state.teacherAI.questionGeneration.error = null;
        },
        questionGenerationSuccess: (state, action) => {
            state.teacherAI.questionGeneration.loading = false;
            state.teacherAI.questionGeneration.generatedQuestions = action.payload;
        },
        questionGenerationFailure: (state, action) => {
            state.teacherAI.questionGeneration.loading = false;
            state.teacherAI.questionGeneration.error = action.payload;
        },
        
        gradingRequest: (state) => {
            state.teacherAI.grading.loading = true;
            state.teacherAI.grading.error = null;
        },
        gradingSuccess: (state, action) => {
            state.teacherAI.grading.loading = false;
            state.teacherAI.grading.results = action.payload;
        },
        gradingFailure: (state, action) => {
            state.teacherAI.grading.loading = false;
            state.teacherAI.grading.error = action.payload;
        },
        
        // 管理AI功能相关
        analyticsRequest: (state) => {
            state.adminAI.analytics.loading = true;
            state.adminAI.analytics.error = null;
        },
        analyticsSuccess: (state, action) => {
            state.adminAI.analytics.loading = false;
            state.adminAI.analytics.dashboardData = action.payload;
        },
        analyticsFailure: (state, action) => {
            state.adminAI.analytics.loading = false;
            state.adminAI.analytics.error = action.payload;
        },
        
        qualityMonitorRequest: (state) => {
            state.adminAI.qualityMonitor.loading = true;
            state.adminAI.qualityMonitor.error = null;
        },
        qualityMonitorSuccess: (state, action) => {
            state.adminAI.qualityMonitor.loading = false;
            state.adminAI.qualityMonitor.qualityData = action.payload;
        },
        qualityMonitorFailure: (state, action) => {
            state.adminAI.qualityMonitor.loading = false;
            state.adminAI.qualityMonitor.error = action.payload;
        },
        
        decisionSupportRequest: (state) => {
            state.adminAI.decisionSupport.loading = true;
            state.adminAI.decisionSupport.error = null;
        },
        decisionSupportSuccess: (state, action) => {
            state.adminAI.decisionSupport.loading = false;
            state.adminAI.decisionSupport.recommendations = action.payload;
        },
        decisionSupportFailure: (state, action) => {
            state.adminAI.decisionSupport.loading = false;
            state.adminAI.decisionSupport.error = action.payload;
        },
        
        // 通用操作
        clearError: (state, action) => {
            const { module } = action.payload;
            if (state[module]) {
                state[module].error = null;
            }
        },
        
        setAIFeatures: (state, action) => {
            state.common.aiFeatures = { ...state.common.aiFeatures, ...action.payload };
        }
    }
});

export const {
    // 学习助手
    studyAssistantRequest,
    studyAssistantSuccess,
    studyAssistantFailure,
    addStudyAssistantMessage,
    clearStudyAssistantMessages,
    
    // 练习助手
    practiceSessionStart,
    practiceAnswerSubmit,
    practiceNextQuestion,
    practiceSessionComplete,
    practiceRequest,
    practiceFailure,
    
    // 学习路径
    learningPathRequest,
    learningPathSuccess,
    learningPathFailure,
    updateLearningProgress,
    
    // 学习伙伴
    companionRequest,
    companionSuccess,
    companionFailure,
    addCompanionMessage,
    updateCompanionMood,
    
    // 教师AI工具
    lessonPlanRequest,
    lessonPlanSuccess,
    lessonPlanFailure,
    questionGenerationRequest,
    questionGenerationSuccess,
    questionGenerationFailure,
    gradingRequest,
    gradingSuccess,
    gradingFailure,
    
    // 管理AI功能
    analyticsRequest,
    analyticsSuccess,
    analyticsFailure,
    qualityMonitorRequest,
    qualityMonitorSuccess,
    qualityMonitorFailure,
    decisionSupportRequest,
    decisionSupportSuccess,
    decisionSupportFailure,
    
    // 通用
    clearError,
    setAIFeatures
} = aiSlice.actions;

export const aiReducer = aiSlice.reducer;
