const axios = require('axios');

class AIService {
    constructor() {
        // Dify API 配置
        this.difyApiUrl = process.env.DIFY_API_URL || 'http://localhost:3001/v1';
        this.difyApiKey = process.env.DIFY_API_KEY;
        
        // Ollama 配置
        this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
        
        // 默认模型配置
        this.defaultModel = process.env.DEFAULT_AI_MODEL || 'llama2';
        
        // API 客户端配置
        this.apiClient = axios.create({
            timeout: 30000, // 30秒超时
            headers: {
                'Content-Type': 'application/json',
            }
        });
    }

    /**
     * 调用Dify知识库API
     * @param {string} query - 查询内容
     * @param {string} conversationId - 会话ID（可选）
     * @param {Object} context - 上下文信息
     * @returns {Promise<Object>} API响应
     */
    async queryKnowledgeBase(query, conversationId = null, context = {}) {
        try {
            const payload = {
                inputs: {
                    query: query,
                    ...context
                },
                query: query,
                response_mode: 'blocking',
                user: context.userId || 'anonymous'
            };

            if (conversationId) {
                payload.conversation_id = conversationId;
            }

            const response = await this.apiClient.post(
                `${this.difyApiUrl}/chat-messages`,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${this.difyApiKey}`,
                    }
                }
            );

            return {
                success: true,
                data: response.data,
                answer: response.data.answer,
                conversationId: response.data.conversation_id
            };
        } catch (error) {
            console.error('Dify API Error:', error.message);
            return {
                success: false,
                error: error.message,
                answer: '抱歉，AI服务暂时不可用，请稍后再试。'
            };
        }
    }

    /**
     * 生成教学内容
     * @param {Object} courseInfo - 课程信息
     * @param {Array} knowledgeBase - 知识库内容
     * @returns {Promise<Object>} 生成的教学内容
     */
    async generateLessonPlan(courseInfo, knowledgeBase) {
        const prompt = this.buildLessonPlanPrompt(courseInfo, knowledgeBase);
        
        const context = {
            type: 'lesson_planning',
            subject: courseInfo.subject,
            grade: courseInfo.grade,
            duration: courseInfo.duration
        };

        const result = await this.queryKnowledgeBase(prompt, null, context);
        
        if (result.success) {
            return this.parseLessonPlanResponse(result.answer);
        }
        
        return result;
    }

    /**
     * 生成考核题目
     * @param {Object} examConfig - 考试配置
     * @returns {Promise<Object>} 生成的题目
     */
    async generateExamQuestions(examConfig) {
        const prompt = this.buildExamPrompt(examConfig);
        
        const context = {
            type: 'question_generation',
            subject: examConfig.subject,
            difficulty: examConfig.difficulty,
            questionCount: examConfig.questionCount,
            questionTypes: examConfig.questionTypes
        };

        const result = await this.queryKnowledgeBase(prompt, null, context);
        
        if (result.success) {
            return this.parseQuestionsResponse(result.answer);
        }
        
        return result;
    }

    /**
     * 分析学生答案
     * @param {Object} answerData - 答案数据
     * @returns {Promise<Object>} 分析结果
     */
    async analyzeStudentAnswer(answerData) {
        const prompt = this.buildAnswerAnalysisPrompt(answerData);
        
        const context = {
            type: 'answer_analysis',
            subject: answerData.subject,
            questionType: answerData.questionType
        };

        const result = await this.queryKnowledgeBase(prompt, null, context);
        
        if (result.success) {
            return this.parseAnalysisResponse(result.answer);
        }
        
        return result;
    }

    /**
     * 生成个性化练习题
     * @param {Object} studentProfile - 学生档案
     * @returns {Promise<Object>} 个性化练习题
     */
    async generatePersonalizedExercise(studentProfile) {
        const prompt = this.buildPersonalizedExercisePrompt(studentProfile);
        
        const context = {
            type: 'personalized_exercise',
            studentLevel: studentProfile.level,
            weakPoints: studentProfile.weakPoints,
            strengths: studentProfile.strengths
        };

        const result = await this.queryKnowledgeBase(prompt, null, context);
        
        if (result.success) {
            return this.parseExerciseResponse(result.answer);
        }
        
        return result;
    }

    /**
     * 学情数据分析
     * @param {Object} performanceData - 学习表现数据
     * @returns {Promise<Object>} 分析报告
     */
    async analyzeStudentPerformance(performanceData) {
        const prompt = this.buildPerformanceAnalysisPrompt(performanceData);
        
        const context = {
            type: 'performance_analysis',
            timeRange: performanceData.timeRange,
            subject: performanceData.subject
        };

        const result = await this.queryKnowledgeBase(prompt, null, context);
        
        if (result.success) {
            return this.parsePerformanceAnalysisResponse(result.answer);
        }
        
        return result;
    }

    /**
     * 构建教学计划生成提示
     */
    buildLessonPlanPrompt(courseInfo, knowledgeBase) {
        return `
作为一名专业的教学设计师，请根据以下信息生成详细的教学计划：

课程信息：
- 科目：${courseInfo.subject}
- 年级：${courseInfo.grade}
- 课程时长：${courseInfo.duration}分钟
- 学习目标：${courseInfo.objectives}
- 课程大纲：${courseInfo.outline}

知识库内容：
${knowledgeBase.map(kb => `- ${kb.title}: ${kb.content.substring(0, 200)}...`).join('\n')}

请生成包含以下内容的教学计划：
1. 详细的知识点讲解安排（包括重点、难点）
2. 实训练习设计（具体的练习内容和步骤）
3. 时间分配建议
4. 教学方法建议
5. 评估方式

请以JSON格式返回结果。
        `;
    }

    /**
     * 构建考试题目生成提示
     */
    buildExamPrompt(examConfig) {
        return `
作为一名专业的题目设计师，请根据以下要求生成考试题目：

考试配置：
- 科目：${examConfig.subject}
- 难度：${examConfig.difficulty}
- 题目数量：${examConfig.questionCount}
- 题目类型：${examConfig.questionTypes.join(', ')}
- 知识点范围：${examConfig.knowledgePoints.join(', ')}
- 考试时长：${examConfig.duration}分钟

请为每道题目生成：
1. 题目内容
2. 标准答案
3. 评分标准
4. 解析说明
5. 难度等级
6. 预估答题时间

请以JSON格式返回结果。
        `;
    }

    // 其他辅助方法...
    buildAnswerAnalysisPrompt(answerData) {
        return `
请分析以下学生答案：

题目：${answerData.question}
学生答案：${answerData.answer}
标准答案：${answerData.correctAnswer}

请提供：
1. 答案正确性评估
2. 错误定位和分析
3. 修正建议
4. 学习建议
5. 相关知识点复习建议

请以JSON格式返回结果。
        `;
    }

    buildPersonalizedExercisePrompt(studentProfile) {
        return `
请为以下学生生成个性化练习题：

学生档案：
- 当前水平：${studentProfile.level}
- 薄弱知识点：${studentProfile.weakPoints.join(', ')}
- 优势领域：${studentProfile.strengths.join(', ')}
- 学习历史：${JSON.stringify(studentProfile.history)}

请生成5-10道适合的练习题，包括：
1. 题目内容
2. 难度等级
3. 知识点标签
4. 预期学习效果

请以JSON格式返回结果。
        `;
    }

    buildPerformanceAnalysisPrompt(performanceData) {
        return `
请分析以下学生学习表现数据：

${JSON.stringify(performanceData, null, 2)}

请提供：
1. 学习趋势分析
2. 知识掌握情况评估
3. 学习建议
4. 改进方向
5. 预测性分析

请以JSON格式返回结果。
        `;
    }

    /**
     * 批量生成题目
     * @param {Array} examConfigs - 多个考试配置
     * @returns {Promise<Object>} 批量生成结果
     */
    async batchGenerateQuestions(examConfigs) {
        const results = [];

        for (const config of examConfigs) {
            try {
                const result = await this.generateExamQuestions(config);
                results.push({
                    configId: config.id,
                    success: result.success,
                    data: result.success ? result : null,
                    error: result.success ? null : result.error
                });
            } catch (error) {
                results.push({
                    configId: config.id,
                    success: false,
                    data: null,
                    error: error.message
                });
            }
        }

        return {
            success: true,
            results,
            totalProcessed: examConfigs.length,
            successCount: results.filter(r => r.success).length,
            failureCount: results.filter(r => !r.success).length
        };
    }

    /**
     * 智能题目推荐
     * @param {Object} studentProfile - 学生档案
     * @param {Object} context - 上下文信息
     * @returns {Promise<Object>} 推荐题目
     */
    async recommendQuestions(studentProfile, context) {
        const prompt = `
基于以下学生档案，推荐适合的练习题目：

学生信息：
- 当前水平：${studentProfile.level}
- 薄弱知识点：${studentProfile.weakPoints.join(', ')}
- 优势领域：${studentProfile.strengths.join(', ')}
- 最近表现：${JSON.stringify(studentProfile.recentPerformance)}
- 学习目标：${studentProfile.learningGoals || '提升整体水平'}

上下文信息：
- 科目：${context.subject}
- 可用时间：${context.availableTime}分钟
- 难度偏好：${context.difficultyPreference || 'adaptive'}

请推荐5-10道题目，包括：
1. 题目内容和类型
2. 推荐理由
3. 预期学习效果
4. 难度等级

请以JSON格式返回结果。
        `;

        const result = await this.queryKnowledgeBase(prompt, null, {
            type: 'question_recommendation',
            studentLevel: studentProfile.level,
            subject: context.subject
        });

        if (result.success) {
            return this.parseQuestionRecommendationResponse(result.answer);
        }

        return result;
    }

    /**
     * 学习路径规划
     * @param {Object} studentData - 学生数据
     * @param {Object} curriculum - 课程体系
     * @returns {Promise<Object>} 学习路径
     */
    async planLearningPath(studentData, curriculum) {
        const prompt = `
基于学生当前状态和课程体系，规划个性化学习路径：

学生当前状态：
${JSON.stringify(studentData, null, 2)}

课程体系：
${JSON.stringify(curriculum, null, 2)}

请规划包含以下内容的学习路径：
1. 学习阶段划分
2. 每个阶段的学习目标
3. 推荐的学习资源
4. 预计学习时间
5. 评估节点设置
6. 个性化调整建议

请以JSON格式返回结果。
        `;

        const result = await this.queryKnowledgeBase(prompt, null, {
            type: 'learning_path_planning',
            studentLevel: studentData.currentLevel,
            subject: curriculum.subject
        });

        if (result.success) {
            return this.parseLearningPathResponse(result.answer);
        }

        return result;
    }

    /**
     * 教学质量评估
     * @param {Object} teachingData - 教学数据
     * @returns {Promise<Object>} 评估结果
     */
    async evaluateTeachingQuality(teachingData) {
        const prompt = `
请评估以下教学数据的质量：

教学数据：
${JSON.stringify(teachingData, null, 2)}

请从以下维度进行评估：
1. 教学内容质量
2. 学生参与度
3. 学习效果
4. 教学方法适用性
5. 改进建议

请以JSON格式返回评估结果。
        `;

        const result = await this.queryKnowledgeBase(prompt, null, {
            type: 'teaching_quality_evaluation',
            subject: teachingData.subject,
            teacherId: teachingData.teacherId
        });

        if (result.success) {
            return this.parseTeachingEvaluationResponse(result.answer);
        }

        return result;
    }

    // 响应解析方法
    parseLessonPlanResponse(response) {
        try {
            return JSON.parse(response);
        } catch (error) {
            return { success: false, error: '解析教学计划响应失败', rawResponse: response };
        }
    }

    parseQuestionsResponse(response) {
        try {
            return JSON.parse(response);
        } catch (error) {
            return { success: false, error: '解析题目响应失败', rawResponse: response };
        }
    }

    parseAnalysisResponse(response) {
        try {
            return JSON.parse(response);
        } catch (error) {
            return { success: false, error: '解析分析响应失败', rawResponse: response };
        }
    }

    parseExerciseResponse(response) {
        try {
            return JSON.parse(response);
        } catch (error) {
            return { success: false, error: '解析练习题响应失败', rawResponse: response };
        }
    }

    parsePerformanceAnalysisResponse(response) {
        try {
            return JSON.parse(response);
        } catch (error) {
            return { success: false, error: '解析性能分析响应失败', rawResponse: response };
        }
    }

    parseQuestionRecommendationResponse(response) {
        try {
            const parsed = JSON.parse(response);
            return {
                success: true,
                recommendations: parsed.recommendations || parsed,
                reasoning: parsed.reasoning || '',
                confidence: parsed.confidence || 0.8
            };
        } catch (error) {
            return { success: false, error: '解析题目推荐响应失败', rawResponse: response };
        }
    }

    parseLearningPathResponse(response) {
        try {
            const parsed = JSON.parse(response);
            return {
                success: true,
                learningPath: parsed.learningPath || parsed,
                estimatedDuration: parsed.estimatedDuration || 0,
                difficulty: parsed.difficulty || 'medium'
            };
        } catch (error) {
            return { success: false, error: '解析学习路径响应失败', rawResponse: response };
        }
    }

    parseTeachingEvaluationResponse(response) {
        try {
            const parsed = JSON.parse(response);
            return {
                success: true,
                evaluation: parsed.evaluation || parsed,
                score: parsed.score || 0,
                recommendations: parsed.recommendations || []
            };
        } catch (error) {
            return { success: false, error: '解析教学评估响应失败', rawResponse: response };
        }
    }
}

module.exports = new AIService();
