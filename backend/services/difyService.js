/**
 * Dify AI服务集成模块
 * 用于连接本地Dify + Ollama DeepSeek-R1模型
 */

const axios = require('axios');
const rateLimit = require('express-rate-limit');

class DifyService {
    constructor() {
        // Dify配置
        this.difyConfig = {
            baseUrl: process.env.DIFY_BASE_URL || 'http://localhost',
            chatEndpoint: '/chat/gbTFYyuYvH6RsNGa',
            apiKeys: {
                key1: process.env.DIFY_API_KEY_1 || 'app-EOyF3XHtRMMZjEVuNJGRLs9n',
                key2: process.env.DIFY_API_KEY_2 || 'app-ovFbxljp6Sak97GquBKzSv9g'
            }
        };

        // 角色系统提示词配置
        this.systemPrompts = {
            student: {
                learning: `你是一个专业的学习助手，专门帮助学生解答学习问题。
                请根据学生的问题，结合相关教学内容，提供详细、准确、易懂的解答。
                回答要有条理性，必要时提供例子和练习建议。`,
                
                exercise: `你是一个练习题生成专家，根据学生的学习历史和要求生成合适的练习题。
                请生成难度适中的题目，包含题目、选项（如果是选择题）、正确答案和详细解析。
                确保题目与学习内容紧密相关。`
            },
            
            teacher: {
                lessonPlan: `你是一个专业的教学设计专家，帮助教师制作高质量的备课内容。
                请根据提供的课程大纲和知识库，设计完整的教学方案，包括：
                1. 知识点讲解结构
                2. 实训练习安排
                3. 时间分配建议
                4. 教学重点难点
                请确保内容实用且符合教学规律。`,
                
                examGeneration: `你是一个考核内容生成专家，根据教学内容自动生成考核题目。
                请生成多样化的题目类型，包括选择题、填空题、简答题、编程题等。
                每道题目都要提供标准答案和评分标准，确保考核的科学性和有效性。`,
                
                analytics: `你是一个学情数据分析专家，帮助教师分析学生的学习情况。
                请对学生的答案进行分析，提供错误定位、修正建议和整体学习建议。
                分析要客观准确，建议要具体可行。`
            },
            
            admin: `你是一个教育管理助手，帮助管理员处理学校管理相关问题。
            请提供专业的管理建议和数据分析支持。`
        };
    }

    /**
     * 发送消息到Dify AI
     * @param {string} message - 用户消息
     * @param {string} role - 用户角色 (student/teacher/admin)
     * @param {string} context - 上下文类型
     * @param {Object} options - 额外选项
     */
    async sendMessage(message, role = 'student', context = 'general', options = {}) {
        try {
            // 选择合适的系统提示词
            const systemPrompt = this.getSystemPrompt(role, context);
            
            // 构建请求数据
            const requestData = {
                query: message,
                response_mode: 'blocking',
                conversation_id: options.conversationId || '',
                user: options.userId || 'anonymous',
                inputs: {
                    role: role,
                    context: context,
                    system_prompt: systemPrompt,
                    ...options.inputs
                }
            };

            // 发送请求到Dify
            const response = await axios.post(
                `${this.difyConfig.baseUrl}/v1/chat-messages`,
                requestData,
                {
                    headers: {
                        'Authorization': `Bearer ${this.difyConfig.apiKeys.key1}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 30000 // 30秒超时
                }
            );

            return {
                success: true,
                data: {
                    answer: response.data.answer,
                    conversationId: response.data.conversation_id,
                    messageId: response.data.message_id,
                    metadata: response.data.metadata
                }
            };

        } catch (error) {
            console.error('Dify API调用失败:', error.message);
            
            // 尝试使用备用API密钥
            if (error.response?.status === 401) {
                return await this.sendMessageWithBackupKey(message, role, context, options);
            }
            
            return {
                success: false,
                error: error.message,
                code: error.response?.status || 500
            };
        }
    }

    /**
     * 使用备用API密钥重试
     */
    async sendMessageWithBackupKey(message, role, context, options) {
        try {
            const systemPrompt = this.getSystemPrompt(role, context);
            
            const requestData = {
                query: message,
                response_mode: 'blocking',
                conversation_id: options.conversationId || '',
                user: options.userId || 'anonymous',
                inputs: {
                    role: role,
                    context: context,
                    system_prompt: systemPrompt,
                    ...options.inputs
                }
            };

            const response = await axios.post(
                `${this.difyConfig.baseUrl}/v1/chat-messages`,
                requestData,
                {
                    headers: {
                        'Authorization': `Bearer ${this.difyConfig.apiKeys.key2}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 30000
                }
            );

            return {
                success: true,
                data: {
                    answer: response.data.answer,
                    conversationId: response.data.conversation_id,
                    messageId: response.data.message_id,
                    metadata: response.data.metadata
                }
            };

        } catch (error) {
            console.error('备用API密钥也失败:', error.message);
            return {
                success: false,
                error: '所有API密钥都无法使用',
                code: error.response?.status || 500
            };
        }
    }

    /**
     * 获取系统提示词
     */
    getSystemPrompt(role, context) {
        if (role === 'student') {
            return this.systemPrompts.student[context] || this.systemPrompts.student.learning;
        } else if (role === 'teacher') {
            return this.systemPrompts.teacher[context] || this.systemPrompts.teacher.lessonPlan;
        } else {
            return this.systemPrompts.admin;
        }
    }

    /**
     * 学生学习问答
     */
    async studentAskQuestion(question, studentId, subject = '') {
        const options = {
            userId: studentId,
            inputs: {
                subject: subject,
                question_type: 'learning'
            }
        };

        return await this.sendMessage(question, 'student', 'learning', options);
    }

    /**
     * 生成练习题
     */
    async generateExercise(requirements, studentId, subject = '') {
        const prompt = `请根据以下要求生成练习题：
        学科：${subject}
        要求：${requirements}
        
        请生成1-3道练习题，每道题包含：
        1. 题目内容
        2. 选项（如果是选择题）
        3. 正确答案
        4. 详细解析`;

        const options = {
            userId: studentId,
            inputs: {
                subject: subject,
                requirements: requirements,
                question_type: 'exercise'
            }
        };

        return await this.sendMessage(prompt, 'student', 'exercise', options);
    }

    /**
     * 检查学生答案
     */
    async checkStudentAnswer(question, studentAnswer, correctAnswer = '') {
        const prompt = `请检查学生的答案是否正确：
        
        题目：${question}
        学生答案：${studentAnswer}
        ${correctAnswer ? `参考答案：${correctAnswer}` : ''}
        
        请提供：
        1. 答案是否正确
        2. 错误分析（如果有错误）
        3. 改进建议
        4. 相关知识点提醒`;

        return await this.sendMessage(prompt, 'student', 'learning');
    }

    /**
     * 教师生成备课内容
     */
    async generateLessonPlan(courseOutline, teacherId, subject = '') {
        const prompt = `请根据以下课程大纲生成详细的备课内容：
        
        学科：${subject}
        课程大纲：${courseOutline}
        
        请生成包含以下内容的备课方案：
        1. 教学目标
        2. 知识点讲解结构
        3. 实训练习安排
        4. 时间分配建议
        5. 教学重点难点
        6. 课堂互动设计`;

        const options = {
            userId: teacherId,
            inputs: {
                subject: subject,
                course_outline: courseOutline
            }
        };

        return await this.sendMessage(prompt, 'teacher', 'lessonPlan', options);
    }

    /**
     * 生成考核内容
     */
    async generateExam(teachingContent, teacherId, examType = 'mixed') {
        const prompt = `请根据以下教学内容生成考核题目：
        
        教学内容：${teachingContent}
        考核类型：${examType}
        
        请生成多样化的题目，包括：
        1. 选择题（2-3道）
        2. 填空题（2-3道）
        3. 简答题（1-2道）
        4. 应用题或编程题（1道，如适用）
        
        每道题目都要提供标准答案和评分标准。`;

        const options = {
            userId: teacherId,
            inputs: {
                teaching_content: teachingContent,
                exam_type: examType
            }
        };

        return await this.sendMessage(prompt, 'teacher', 'examGeneration', options);
    }

    /**
     * 分析学生表现
     */
    async analyzeStudentPerformance(studentData, teacherId) {
        const prompt = `请分析以下学生的学习表现数据：

        ${JSON.stringify(studentData, null, 2)}

        请提供：
        1. 整体表现评估
        2. 知识掌握情况分析
        3. 常见错误模式
        4. 个性化教学建议
        5. 后续学习重点`;

        const options = {
            userId: teacherId,
            inputs: {
                student_data: JSON.stringify(studentData)
            }
        };

        return await this.sendMessage(prompt, 'teacher', 'analytics', options);
    }

    /**
     * 批量分析学生答案
     */
    async batchAnalyzeAnswers(answers, teacherId) {
        const prompt = `请批量分析以下学生答案：

        ${JSON.stringify(answers, null, 2)}

        请提供：
        1. 每道题的正确率统计
        2. 常见错误类型分析
        3. 知识点掌握情况
        4. 教学改进建议
        5. 个别学生关注点`;

        const options = {
            userId: teacherId,
            inputs: {
                answers_data: JSON.stringify(answers)
            }
        };

        return await this.sendMessage(prompt, 'teacher', 'analytics', options);
    }

    /**
     * 健康检查
     */
    async healthCheck() {
        try {
            const response = await axios.get(`${this.difyConfig.baseUrl}/health`, {
                timeout: 5000
            });
            return { status: 'healthy', data: response.data };
        } catch (error) {
            return { status: 'unhealthy', error: error.message };
        }
    }
}

// 创建单例实例
const difyService = new DifyService();

module.exports = difyService;
