const Joi = require('joi');

// 教学计划生成验证
const lessonPlanValidation = Joi.object({
    subject: Joi.string().required().min(1).max(100),
    grade: Joi.string().required().min(1).max(50),
    duration: Joi.number().integer().min(10).max(300).required(),
    objectives: Joi.string().required().min(10).max(1000),
    outline: Joi.string().required().min(20).max(5000),
    knowledgeBase: Joi.array().items(
        Joi.object({
            title: Joi.string().required(),
            content: Joi.string().required(),
            type: Joi.string().valid('text', 'pdf', 'doc', 'ppt', 'video', 'audio')
        })
    ).max(20),
    difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced').default('intermediate'),
    contentType: Joi.string().valid('theory', 'practical', 'mixed').default('mixed')
});

// 题目生成验证
const questionGenerationValidation = Joi.object({
    subject: Joi.string().required().min(1).max(100),
    difficulty: Joi.string().valid('easy', 'medium', 'hard').required(),
    questionCount: Joi.number().integer().min(1).max(50).required(),
    questionTypes: Joi.array().items(
        Joi.string().valid('multiple_choice', 'true_false', 'short_answer', 'essay', 'coding', 'fill_blank')
    ).min(1).required(),
    knowledgePoints: Joi.array().items(Joi.string()).min(1).max(20).required(),
    duration: Joi.number().integer().min(5).max(300).required(),
    grade: Joi.string().required(),
    examType: Joi.string().valid('quiz', 'midterm', 'final', 'practice').default('quiz')
});

// 答案分析验证
const answerAnalysisValidation = Joi.object({
    questionId: Joi.string().required(),
    question: Joi.string().required().min(5).max(2000),
    answer: Joi.alternatives().try(
        Joi.string(),
        Joi.array(),
        Joi.object()
    ).required(),
    correctAnswer: Joi.alternatives().try(
        Joi.string(),
        Joi.array(),
        Joi.object()
    ).required(),
    questionType: Joi.string().valid('multiple_choice', 'true_false', 'short_answer', 'essay', 'coding', 'fill_blank').required(),
    subject: Joi.string().required(),
    maxScore: Joi.number().min(0).required(),
    studentId: Joi.string().required(),
    timeSpent: Joi.number().min(0).optional()
});

// 个性化练习生成验证
const personalizedExerciseValidation = Joi.object({
    studentId: Joi.string().required(),
    subject: Joi.string().required(),
    level: Joi.string().valid('beginner', 'intermediate', 'advanced').required(),
    weakPoints: Joi.array().items(Joi.string()).min(1).max(10).required(),
    strengths: Joi.array().items(Joi.string()).max(10).optional(),
    practiceGoal: Joi.string().valid('review', 'practice', 'challenge', 'assessment').default('practice'),
    questionCount: Joi.number().integer().min(3).max(20).default(10),
    timeLimit: Joi.number().integer().min(0).max(300).default(0), // 0 means no limit
    difficulty: Joi.string().valid('adaptive', 'easy', 'medium', 'hard').default('adaptive'),
    history: Joi.object({
        recentScores: Joi.array().items(Joi.number().min(0).max(100)).max(10),
        commonErrors: Joi.array().items(Joi.string()).max(20),
        learningPattern: Joi.string().valid('visual', 'auditory', 'kinesthetic', 'mixed').optional()
    }).optional()
});

// 学习表现分析验证
const performanceAnalysisValidation = Joi.object({
    studentId: Joi.string().required(),
    subject: Joi.string().required(),
    timeRange: Joi.object({
        startDate: Joi.date().required(),
        endDate: Joi.date().min(Joi.ref('startDate')).required()
    }).required(),
    analysisType: Joi.string().valid('individual', 'comparative', 'predictive').default('individual'),
    includeRecommendations: Joi.boolean().default(true),
    dataPoints: Joi.object({
        examScores: Joi.array().items(
            Joi.object({
                examId: Joi.string().required(),
                score: Joi.number().min(0).max(100).required(),
                date: Joi.date().required(),
                subject: Joi.string().required()
            })
        ).optional(),
        practiceRecords: Joi.array().items(
            Joi.object({
                recordId: Joi.string().required(),
                score: Joi.number().min(0).max(100).required(),
                timeSpent: Joi.number().min(0).required(),
                date: Joi.date().required()
            })
        ).optional(),
        attendanceData: Joi.array().items(
            Joi.object({
                date: Joi.date().required(),
                status: Joi.string().valid('Present', 'Absent').required()
            })
        ).optional()
    }).required()
});

// 聊天机器人验证
const chatbotValidation = Joi.object({
    message: Joi.string().required().min(1).max(1000),
    conversationId: Joi.string().optional(),
    context: Joi.object({
        userId: Joi.string().required(),
        userType: Joi.string().valid('admin', 'teacher', 'student').required(),
        subject: Joi.string().optional(),
        currentPage: Joi.string().optional(),
        sessionData: Joi.object().optional()
    }).required(),
    messageType: Joi.string().valid('question', 'request', 'feedback', 'general').default('question')
});

// 知识库查询验证
const knowledgeBaseQueryValidation = Joi.object({
    query: Joi.string().required().min(1).max(500),
    subject: Joi.string().optional(),
    filters: Joi.object({
        fileType: Joi.array().items(Joi.string().valid('text', 'pdf', 'doc', 'ppt', 'video', 'audio')).optional(),
        tags: Joi.array().items(Joi.string()).optional(),
        dateRange: Joi.object({
            start: Joi.date().optional(),
            end: Joi.date().optional()
        }).optional()
    }).optional(),
    limit: Joi.number().integer().min(1).max(50).default(10),
    offset: Joi.number().integer().min(0).default(0)
});

// 内容生成通用验证
const contentGenerationValidation = Joi.object({
    contentType: Joi.string().valid('lesson_plan', 'question', 'exercise', 'explanation', 'summary').required(),
    parameters: Joi.object().required(),
    userId: Joi.string().required(),
    userType: Joi.string().valid('admin', 'teacher', 'student').required(),
    priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
    deadline: Joi.date().optional()
});

// 批量处理验证
const batchProcessValidation = Joi.object({
    requests: Joi.array().items(
        Joi.object({
            id: Joi.string().required(),
            type: Joi.string().valid('lesson_plan', 'question_generation', 'answer_analysis', 'personalized_exercise', 'performance_analysis').required(),
            data: Joi.object().required()
        })
    ).min(1).max(10).required(),
    priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
    callback: Joi.object({
        url: Joi.string().uri().optional(),
        method: Joi.string().valid('POST', 'PUT').default('POST'),
        headers: Joi.object().optional()
    }).optional()
});

module.exports = {
    lessonPlanValidation,
    questionGenerationValidation,
    answerAnalysisValidation,
    personalizedExerciseValidation,
    performanceAnalysisValidation,
    chatbotValidation,
    knowledgeBaseQueryValidation,
    contentGenerationValidation,
    batchProcessValidation
};
