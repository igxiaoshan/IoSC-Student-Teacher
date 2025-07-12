module.exports = {
    // Dify API 配置
    dify: {
        apiUrl: process.env.DIFY_API_URL || 'http://localhost:3001/v1',
        apiKey: process.env.DIFY_API_KEY || 'your-dify-api-key',
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000
    },

    // Ollama 配置
    ollama: {
        url: process.env.OLLAMA_URL || 'http://localhost:11434',
        defaultModel: process.env.OLLAMA_MODEL || 'llama2',
        timeout: 60000
    },

    // AI 功能开关
    features: {
        lessonPlanGeneration: process.env.AI_LESSON_PLAN !== 'false',
        questionGeneration: process.env.AI_QUESTION_GEN !== 'false',
        answerAnalysis: process.env.AI_ANSWER_ANALYSIS !== 'false',
        personalizedExercise: process.env.AI_PERSONALIZED !== 'false',
        performanceAnalysis: process.env.AI_PERFORMANCE !== 'false',
        chatbot: process.env.AI_CHATBOT !== 'false'
    },

    // 提示词模板配置
    prompts: {
        lessonPlan: {
            systemPrompt: "你是一名专业的教学设计师，擅长根据课程大纲和知识库内容设计高质量的教学计划。",
            maxTokens: 2000,
            temperature: 0.7
        },
        questionGeneration: {
            systemPrompt: "你是一名专业的题目设计师，能够根据教学内容生成高质量的考试题目。",
            maxTokens: 1500,
            temperature: 0.6
        },
        answerAnalysis: {
            systemPrompt: "你是一名专业的教学评估师，能够准确分析学生答案并提供建设性反馈。",
            maxTokens: 1000,
            temperature: 0.5
        },
        personalizedExercise: {
            systemPrompt: "你是一名个性化学习专家，能够根据学生特点生成适合的练习题。",
            maxTokens: 1500,
            temperature: 0.7
        },
        performanceAnalysis: {
            systemPrompt: "你是一名学习分析专家，能够深入分析学生学习数据并提供洞察。",
            maxTokens: 2000,
            temperature: 0.6
        }
    },

    // 缓存配置
    cache: {
        enabled: process.env.AI_CACHE_ENABLED === 'true' || true,
        ttl: parseInt(process.env.AI_CACHE_TTL) || 3600, // 1小时
        maxSize: parseInt(process.env.AI_CACHE_MAX_SIZE) || 1000
    },

    // 限流配置
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15分钟
        max: 100, // 每个窗口期最多100次请求
        message: 'AI服务请求过于频繁，请稍后再试'
    },

    // 日志配置
    logging: {
        enabled: process.env.AI_LOGGING === 'true' || true,
        level: process.env.AI_LOG_LEVEL || 'info',
        logRequests: true,
        logResponses: false // 响应可能包含敏感信息
    },

    // 错误处理配置
    errorHandling: {
        maxRetries: 3,
        retryDelay: 1000,
        fallbackEnabled: true,
        fallbackMessages: {
            lessonPlan: '抱歉，教学计划生成服务暂时不可用，请稍后再试或手动创建。',
            questionGeneration: '抱歉，题目生成服务暂时不可用，请稍后再试或手动创建题目。',
            answerAnalysis: '抱歉，答案分析服务暂时不可用，请稍后再试。',
            personalizedExercise: '抱歉，个性化练习生成服务暂时不可用，请稍后再试。',
            performanceAnalysis: '抱歉，性能分析服务暂时不可用，请稍后再试。'
        }
    },

    // 内容过滤配置
    contentFilter: {
        enabled: true,
        maxLength: 10000,
        bannedWords: [], // 可以添加需要过滤的词汇
        sanitizeHtml: true
    },

    // 质量控制配置
    qualityControl: {
        minConfidenceScore: 0.7,
        enableHumanReview: false,
        autoApproveThreshold: 0.9
    }
};
