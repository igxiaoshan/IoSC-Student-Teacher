const axios = require('axios');
const difyConfig = require('../config/difyConfig');

/**
 * Dify AI服务类
 * 封装与Dify平台的交互
 */
class DifyService {
    constructor() {
        this.baseURL = difyConfig.baseURL;
        this.apiKey = difyConfig.apiKey;
        this.apps = difyConfig.apps;
    }

    /**
     * 发送聊天消息到Dify应用
     * @param {string} appId - 应用ID
     * @param {object} messageData - 消息数据
     * @param {boolean} streaming - 是否使用流式响应
     * @returns {Promise} 响应数据
     */
    async sendChatMessage(appId, messageData, streaming = false) {
        const maxRetries = difyConfig.requestConfig.retries;
        const retryDelay = difyConfig.requestConfig.retryDelay;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const url = `${this.baseURL}/v1/chat-messages`;

                const requestData = {
                    inputs: messageData.inputs || {},
                    query: messageData.query,
                    response_mode: streaming ? 'streaming' : 'blocking',
                    conversation_id: messageData.conversationId || '',
                    user: messageData.user || 'default_user',
                    ...messageData.additionalParams
                };

                console.log(`[Dify Request] ${appId} (尝试 ${attempt}/${maxRetries}):`, {
                    url,
                    data: requestData,
                    timestamp: new Date().toISOString()
                });

                const response = await axios.post(url, requestData, {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: difyConfig.requestConfig.timeout,
                    responseType: streaming ? 'stream' : 'json'
                });

                console.log(`[Dify Success] ${appId} (尝试 ${attempt}):`, '响应成功');
                return response.data;
            } catch (error) {
                console.error(`[Dify Error] ${appId} (尝试 ${attempt}/${maxRetries}):`, error.message);

                // 如果是最后一次尝试，抛出错误
                if (attempt === maxRetries) {
                    throw new Error(`Dify API调用失败 (${maxRetries}次尝试后): ${error.message}`);
                }

                // 等待后重试
                if (attempt < maxRetries) {
                    console.log(`[Dify Retry] ${appId}: ${retryDelay}ms后重试...`);
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                }
            }
        }
    }

    /**
     * 教师端 - 智能备课
     * @param {object} lessonData - 课程数据
     * @returns {Promise} 教学设计内容
     */
    async generateLessonPlan(lessonData) {
        const appConfig = this.apps.teacher.lessonPlanning;
        
        const messageData = {
            query: `请基于以下课程信息设计教学内容：
课程名称：${lessonData.courseName}
课程大纲：${lessonData.syllabus}
学时安排：${lessonData.duration}小时
学生水平：${lessonData.studentLevel}
教学目标：${lessonData.objectives}

请提供：
1. 详细的知识讲解结构
2. 实训练习设计
3. 时间分布建议
4. 教学方法推荐`,
            inputs: {
                course_name: lessonData.courseName,
                syllabus: lessonData.syllabus,
                duration: lessonData.duration,
                student_level: lessonData.studentLevel,
                objectives: lessonData.objectives,
                subject_area: lessonData.subject || '通用'
            },
            user: lessonData.teacherId
        };

        return await this.sendChatMessage(appConfig.appId, messageData);
    }

    /**
     * 教师端 - 考核内容生成
     * @param {object} examData - 考试数据
     * @returns {Promise} 考核题目和答案
     */
    async generateExamContent(examData) {
        const appConfig = this.apps.teacher.examGeneration;
        
        const messageData = {
            query: `请基于以下教学内容生成考核题目：
教学内容：${examData.teachingContent}
考核类型：${examData.examType}
题目数量：${examData.questionCount}
难度等级：${examData.difficulty}
学科领域：${examData.subject}

请生成：
1. 多样化的题目类型（选择题、填空题、简答题、编程题等）
2. 详细的参考答案
3. 评分标准
4. 知识点覆盖说明`,
            inputs: {
                teaching_content: examData.teachingContent,
                exam_type: examData.examType,
                question_count: examData.questionCount,
                difficulty: examData.difficulty,
                subject: examData.subject,
                special_requirements: examData.specialRequirements || ''
            },
            user: examData.teacherId
        };

        return await this.sendChatMessage(appConfig.appId, messageData);
    }

    /**
     * 教师端 - 学情数据分析
     * @param {object} analyticsData - 分析数据
     * @returns {Promise} 分析结果和建议
     */
    async analyzeStudentPerformance(analyticsData) {
        const appConfig = this.apps.teacher.analyticsAssistant;
        
        const messageData = {
            query: `请分析以下学生答题情况并提供教学建议：
题目信息：${JSON.stringify(analyticsData.questions)}
学生答案：${JSON.stringify(analyticsData.studentAnswers)}
正确答案：${JSON.stringify(analyticsData.correctAnswers)}
班级整体情况：${JSON.stringify(analyticsData.classStats)}

请提供：
1. 错误定位与分析
2. 修正建议
3. 知识掌握情况总结
4. 个性化教学建议
5. 班级整体教学策略`,
            inputs: {
                questions: JSON.stringify(analyticsData.questions),
                student_answers: JSON.stringify(analyticsData.studentAnswers),
                correct_answers: JSON.stringify(analyticsData.correctAnswers),
                class_stats: JSON.stringify(analyticsData.classStats),
                subject: analyticsData.subject
            },
            user: analyticsData.teacherId
        };

        return await this.sendChatMessage(appConfig.appId, messageData);
    }

    /**
     * 学生端 - 在线学习助手
     * @param {object} questionData - 问题数据
     * @returns {Promise} 解答内容
     */
    async answerStudentQuestion(questionData) {
        const appConfig = this.apps.student.learningAssistant;
        
        const messageData = {
            query: `学生问题：${questionData.question}
相关课程：${questionData.course}
学习进度：${questionData.progress}
学生水平：${questionData.studentLevel}

请结合教学内容提供详细解答，包括：
1. 直接回答问题
2. 相关知识点解释
3. 学习建议
4. 扩展阅读推荐`,
            inputs: {
                student_question: questionData.question,
                course: questionData.course,
                progress: questionData.progress,
                student_level: questionData.studentLevel,
                context: questionData.context || ''
            },
            user: questionData.studentId,
            conversationId: questionData.conversationId
        };

        return await this.sendChatMessage(appConfig.appId, messageData);
    }

    /**
     * 学生端 - 实时练习评测
     * @param {object} practiceData - 练习数据
     * @returns {Promise} 练习题目和评测结果
     */
    async generatePracticeAndEvaluate(practiceData) {
        const appConfig = this.apps.student.practiceAssistant;
        
        const messageData = {
            query: `请基于学生情况生成练习题目。

学生信息：
- 历史练习：${JSON.stringify(practiceData.history)}
- 练习要求：${practiceData.requirements}
- 薄弱知识点：${practiceData.knowledgePoints}
- 难度等级：${practiceData.difficulty}
- 题目类型：${practiceData.questionType}

请只返回以下JSON格式的数据，不要包含任何其他文字或解释：

{
  "exercises": [
    {
      "title": "题目标题",
      "question": "题目内容",
      "type": "multiple_choice",
      "difficulty": "easy",
      "points": 1,
      "options": ["A) 选项1", "B) 选项2", "C) 选项3", "D) 选项4"],
      "correctAnswer": "A",
      "explanation": "答案解释",
      "knowledgePoints": ["相关知识点"],
      "hints": ["提示信息"]
    }
  ]
}

重要要求：
1. 只返回JSON数据，不要任何额外文字
2. 使用双引号，不要使用单引号
3. 确保JSON格式完全正确
4. 生成${practiceData.requirements.match(/\d+/) ? practiceData.requirements.match(/\d+/)[0] : '10'}道题目`,
            inputs: {
                practice_history: JSON.stringify(practiceData.history),
                requirements: practiceData.requirements,
                knowledge_points: practiceData.knowledgePoints,
                difficulty: practiceData.difficulty,
                question_type: practiceData.questionType,
                student_profile: JSON.stringify(practiceData.studentProfile || {})
            },
            user: practiceData.studentId
        };

        return await this.sendChatMessage(appConfig.appId, messageData);
    }

    /**
     * 流式响应处理
     * @param {string} appId - 应用ID
     * @param {object} messageData - 消息数据
     * @param {function} onData - 数据回调
     * @param {function} onEnd - 结束回调
     * @param {function} onError - 错误回调
     */
    async sendStreamingMessage(appId, messageData, onData, onEnd, onError) {
        try {
            const url = `${this.baseURL}/v1/chat-messages`;
            
            const requestData = {
                inputs: messageData.inputs || {},
                query: messageData.query,
                response_mode: 'streaming',
                conversation_id: messageData.conversationId || '',
                user: messageData.user || 'default_user'
            };

            const response = await axios.post(url, requestData, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                responseType: 'stream'
            });

            let buffer = '';
            
            response.data.on('data', (chunk) => {
                buffer += chunk.toString();
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            onData && onData(data);
                        } catch (parseError) {
                            console.error('Parse error:', parseError);
                        }
                    }
                }
            });

            response.data.on('end', () => {
                onEnd && onEnd();
            });

            response.data.on('error', (error) => {
                onError && onError(error);
            });

        } catch (error) {
            console.error(`[Dify Streaming Error] ${appId}:`, error.message);
            onError && onError(error);
        }
    }
}

module.exports = new DifyService();
