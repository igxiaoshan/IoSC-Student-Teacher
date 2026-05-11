import axios from 'axios';
import {
    studyAssistantRequest,
    studyAssistantSuccess,
    studyAssistantFailure,
    practiceSessionStart,
    practiceAnswerSubmit,
    practiceRequest,
    practiceFailure,
    learningPathRequest,
    learningPathSuccess,
    learningPathFailure,
    companionRequest,
    companionSuccess,
    companionFailure,
    lessonPlanRequest,
    lessonPlanSuccess,
    lessonPlanFailure,
    questionGenerationRequest,
    questionGenerationSuccess,
    questionGenerationFailure,
    gradingRequest,
    gradingSuccess,
    gradingFailure,
    analyticsRequest,
    analyticsSuccess,
    analyticsFailure,
    qualityMonitorRequest,
    qualityMonitorSuccess,
    qualityMonitorFailure,
    decisionSupportRequest,
    decisionSupportSuccess,
    decisionSupportFailure
} from './aiSlice';

const REACT_APP_BASE_URL = process.env.REACT_APP_BASE_URL ?? "http://localhost:5000";

// 学习助手API
export const askStudyAssistant = (questionData) => async (dispatch) => {
    dispatch(studyAssistantRequest());
    try {
        const result = await axios.post(`${REACT_APP_BASE_URL}/api/study-assistant/ask`, questionData);

        console.log('Study Assistant Response:', result.data); // 调试日志

        // 处理不同的响应格式
        if (result.data) {
            let aiContent = '';
            let confidence = 0;

            if (result.data.data && result.data.data.answer) {
                // 后端实际格式: { message: "AI助手回答成功", data: { answer: "内容", confidence: 0.8 } }
                aiContent = result.data.data.answer;
                confidence = result.data.data.confidence || 0;
            } else if (result.data.success && result.data.answer) {
                // 标准格式
                aiContent = result.data.answer;
                confidence = result.data.confidence || 0;
            } else if (result.data.response) {
                // 备用格式
                aiContent = result.data.response;
                confidence = result.data.confidence || 0;
            } else if (result.data.answer) {
                // 简化格式
                aiContent = result.data.answer;
                confidence = result.data.confidence || 0;
            } else if (typeof result.data === 'string') {
                // 直接字符串
                aiContent = result.data;
            }

            if (aiContent) {
                dispatch(studyAssistantSuccess({
                    type: 'ai',
                    content: aiContent,
                    timestamp: new Date(),
                    confidence: confidence
                }));
            } else {
                dispatch(studyAssistantFailure('AI回复格式错误'));
                console.error('StudyAssistant响应结构:', JSON.stringify(result.data, null, 2));
            }
        } else {
            dispatch(studyAssistantFailure('未收到AI回复'));
        }
    } catch (error) {
        console.error('Study Assistant Error:', error);
        dispatch(studyAssistantFailure(error.response?.data?.message || error.message));
    }
};

export const getStudyGuidance = (studentId, subject) => async (dispatch) => {
    dispatch(studyAssistantRequest());
    try {
        const result = await axios.get(`${REACT_APP_BASE_URL}/api/study-assistant/${studentId}/guidance`, {
            params: { subject }
        });
        if (result.data) {
            dispatch(studyAssistantSuccess({
                type: 'guidance',
                content: result.data,
                timestamp: new Date()
            }));
        }
    } catch (error) {
        dispatch(studyAssistantFailure(error.response?.data?.message || error.message));
    }
};

// 练习助手API
export const startPracticeSession = (sessionData) => async (dispatch) => {
    dispatch(practiceRequest());
    try {
        console.log('[Frontend] 发送练习会话请求:', sessionData);
        const result = await axios.post(`${REACT_APP_BASE_URL}/api/practice-assistant/session/start`, sessionData);
        console.log('[Frontend] 练习会话响应:', result.data);

        if (result.data.success) {
            console.log('[Frontend] 练习会话启动成功:', {
                sessionId: result.data.sessionId,
                questionsCount: result.data.questions?.length
            });
            dispatch(practiceSessionStart({
                sessionId: result.data.sessionId,
                questions: result.data.questions
            }));
        } else {
            console.error('[Frontend] 练习会话启动失败:', result.data.message);
            dispatch(practiceFailure(result.data.message));
        }
    } catch (error) {
        console.error('[Frontend] 练习会话请求错误:', error);
        dispatch(practiceFailure(error.response?.data?.message || error.message));
    }
};

export const submitPracticeAnswer = (answerData) => async (dispatch) => {
    try {
        const result = await axios.post(`${REACT_APP_BASE_URL}/api/practice-assistant/session/submit`, answerData);
        if (result.data.success) {
            dispatch(practiceAnswerSubmit({
                questionId: answerData.questionId,
                answer: answerData.answer,
                feedback: result.data.feedback,
                isCorrect: result.data.isCorrect,
                score: result.data.score
            }));
        }
    } catch (error) {
        dispatch(practiceFailure(error.response?.data?.message || error.message));
    }
};

export const getPracticeHint = (hintData) => async (dispatch) => {
    try {
        const result = await axios.post(`${REACT_APP_BASE_URL}/api/practice-assistant/session/hint`, hintData);
        return result.data;
    } catch (error) {
        dispatch(practiceFailure(error.response?.data?.message || error.message));
    }
};

// 学习路径API
export const generateLearningPath = (studentId, pathData) => async (dispatch) => {
    dispatch(learningPathRequest());
    try {
        const result = await axios.post(`${REACT_APP_BASE_URL}/api/learning-path/${studentId}/generate`, pathData);
        if (result.data.success) {
            dispatch(learningPathSuccess(result.data.learningPath));
        } else {
            dispatch(learningPathFailure(result.data.message));
        }
    } catch (error) {
        dispatch(learningPathFailure(error.response?.data?.message || error.message));
    }
};

export const getLearningPathProgress = (studentId, subject) => async (dispatch) => {
    dispatch(learningPathRequest());
    try {
        const result = await axios.get(`${REACT_APP_BASE_URL}/api/learning-path/${studentId}/progress`, {
            params: { subject }
        });
        if (result.data) {
            dispatch(learningPathSuccess(result.data));
        }
    } catch (error) {
        dispatch(learningPathFailure(error.response?.data?.message || error.message));
    }
};

// 学习伙伴API
export const getCompanionStatus = (studentId) => async (dispatch) => {
    dispatch(companionRequest());
    try {
        const result = await axios.get(`${REACT_APP_BASE_URL}/api/learning-companion/${studentId}/status`);
        if (result.data) {
            dispatch(companionSuccess(result.data));
        }
    } catch (error) {
        dispatch(companionFailure(error.response?.data?.message || error.message));
    }
};

export const chatWithCompanion = (studentId, message) => async (dispatch) => {
    try {
        const result = await axios.post(`${REACT_APP_BASE_URL}/api/learning-companion/${studentId}/chat`, {
            message
        });
        return result.data;
    } catch (error) {
        dispatch(companionFailure(error.response?.data?.message || error.message));
    }
};

// 教师AI工具API
export const generateLessonPlan = (planData) => async (dispatch) => {
    dispatch(lessonPlanRequest());
    try {
        const result = await axios.post(`${REACT_APP_BASE_URL}/api/lesson-plan/generate`, planData);
        if (result.data.success) {
            dispatch(lessonPlanSuccess(result.data.lessonPlan));
        } else {
            dispatch(lessonPlanFailure(result.data.message));
        }
    } catch (error) {
        dispatch(lessonPlanFailure(error.response?.data?.message || error.message));
    }
};

export const generateQuestions = (questionData) => async (dispatch) => {
    dispatch(questionGenerationRequest());
    try {
        const result = await axios.post(`${REACT_APP_BASE_URL}/api/question/generate`, questionData);
        if (result.data.success) {
            dispatch(questionGenerationSuccess(result.data.questions));
        } else {
            dispatch(questionGenerationFailure(result.data.message));
        }
    } catch (error) {
        dispatch(questionGenerationFailure(error.response?.data?.message || error.message));
    }
};

export const analyzeAnswers = (analysisData) => async (dispatch) => {
    dispatch(gradingRequest());
    try {
        const result = await axios.post(`${REACT_APP_BASE_URL}/api/answer/analyze`, analysisData);
        if (result.data.success) {
            dispatch(gradingSuccess(result.data.analysis));
        } else {
            dispatch(gradingFailure(result.data.message));
        }
    } catch (error) {
        dispatch(gradingFailure(error.response?.data?.message || error.message));
    }
};

// 管理AI功能API
export const getAdminDashboard = (adminId, timeRange) => async (dispatch) => {
    dispatch(analyticsRequest());
    try {
        const result = await axios.get(`${REACT_APP_BASE_URL}/api/admin-dashboard/${adminId}`, {
            params: { timeRange }
        });
        if (result.data) {
            dispatch(analyticsSuccess(result.data));
        }
    } catch (error) {
        dispatch(analyticsFailure(error.response?.data?.message || error.message));
    }
};

export const getQualityOverview = (adminId, period, subject) => async (dispatch) => {
    dispatch(qualityMonitorRequest());
    try {
        const result = await axios.get(`${REACT_APP_BASE_URL}/api/quality-monitor/${adminId}/overview`, {
            params: { period, subject }
        });
        if (result.data) {
            dispatch(qualityMonitorSuccess(result.data));
        }
    } catch (error) {
        dispatch(qualityMonitorFailure(error.response?.data?.message || error.message));
    }
};

export const getDecisionSupport = (adminId, timeframe, focus) => async (dispatch) => {
    dispatch(decisionSupportRequest());
    try {
        const result = await axios.get(`${REACT_APP_BASE_URL}/api/decision-support/${adminId}/overview`, {
            params: { timeframe, focus }
        });
        if (result.data) {
            dispatch(decisionSupportSuccess(result.data));
        }
    } catch (error) {
        dispatch(decisionSupportFailure(error.response?.data?.message || error.message));
    }
};

// 学生仪表板API
export const getStudentDashboard = (studentId, timeRange) => async (dispatch) => {
    try {
        const result = await axios.get(`${REACT_APP_BASE_URL}/api/student-dashboard/${studentId}`, {
            params: { timeRange }
        });
        return result.data;
    } catch (error) {
        throw error;
    }
};

export const getPersonalizedSuggestions = (studentId, context) => async (dispatch) => {
    try {
        const result = await axios.get(`${REACT_APP_BASE_URL}/api/student-dashboard/${studentId}/suggestions`, {
            params: { context }
        });
        return result.data;
    } catch (error) {
        throw error;
    }
};

// 教师仪表板API
export const getTeacherDashboard = (teacherId, timeRange) => async (dispatch) => {
    try {
        const result = await axios.get(`${REACT_APP_BASE_URL}/api/teacher-dashboard/${teacherId}`, {
            params: { timeRange }
        });
        return result.data;
    } catch (error) {
        throw error;
    }
};

export const getTeachingInsights = (teacherId, subject) => async (dispatch) => {
    try {
        const result = await axios.get(`${REACT_APP_BASE_URL}/api/teacher-dashboard/${teacherId}/insights`, {
            params: { subject }
        });
        return result.data;
    } catch (error) {
        throw error;
    }
};

// ==================== 教师AI功能 ====================

// 智能备课设计
export const generateTeacherLessonPlan = (lessonData) => async (dispatch) => {
    dispatch(lessonPlanRequest());
    try {
        const result = await axios.post(`${REACT_APP_BASE_URL}/api/teacher-ai/lesson-plan/${lessonData.teacherId}`, lessonData);
        if (result.data.success) {
            dispatch(lessonPlanSuccess(result.data.data));
        } else {
            dispatch(lessonPlanFailure(result.data.message));
        }
        return result.data;
    } catch (error) {
        dispatch(lessonPlanFailure(error.response?.data?.message || error.message));
        throw error;
    }
};

// 考核内容生成
export const generateTeacherExamContent = (examData) => async (dispatch) => {
    dispatch(questionGenerationRequest());
    try {
        const result = await axios.post(`${REACT_APP_BASE_URL}/api/teacher-ai/exam-content/${examData.teacherId}`, examData);
        if (result.data.success) {
            dispatch(questionGenerationSuccess(result.data.data));
        } else {
            dispatch(questionGenerationFailure(result.data.message));
        }
        return result.data;
    } catch (error) {
        dispatch(questionGenerationFailure(error.response?.data?.message || error.message));
        throw error;
    }
};

// 学情数据分析
export const analyzeTeacherStudentPerformance = (analyticsData) => async (dispatch) => {
    dispatch(gradingRequest());
    try {
        const result = await axios.post(`${REACT_APP_BASE_URL}/api/teacher-ai/analytics/${analyticsData.teacherId}`, analyticsData);
        if (result.data.success) {
            dispatch(gradingSuccess(result.data.data));
        } else {
            dispatch(gradingFailure(result.data.message));
        }
        return result.data;
    } catch (error) {
        dispatch(gradingFailure(error.response?.data?.message || error.message));
        throw error;
    }
};
