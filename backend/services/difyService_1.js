const axios = require('axios');

class DifyService {
    constructor() {
        this.baseURL = process.env.DIFY_API_URL || 'http://localhost/v1';
        this.apiKey = process.env.DIFY_API_KEY || '';
        this.timeout = 30000; // 30秒超时
    }

    // 通用的Dify API调用方法
    async callDifyAPI(endpoint, data, options = {}) {
        try {
            const config = {
                method: 'POST',
                url: `${this.baseURL}${endpoint}`,
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                data,
                timeout: this.timeout
            };

            const response = await axios(config);
            return response.data;
        } catch (error) {
            console.error('Dify API调用错误:', error.message);
            throw new Error(`Dify API调用失败: ${error.message}`);
        }
    }

    // 学习助手对话
    async chatWithLearningAssistant(message, context = {}) {
        const { studentId, subjectId, courseContent, studentHistory } = context;
        
        const systemPrompt = `你是一名专业的学习助手，专门帮助学生解答学习问题。

学生信息：
- 学生ID: ${studentId || '未知'}
- 科目: ${context.subjectName || '通用'}

教学内容参考：
${courseContent || '暂无特定教学内容'}

学生历史表现：
${studentHistory || '暂无历史记录'}

请根据以上信息，为学生提供准确、详细、易懂的解答。如果是数学题目，请提供步骤详解。`;

        try {
            const response = await this.callDifyAPI('/chat-messages', {
                inputs: {
                    query: message,
                    system_prompt: systemPrompt,
                    student_context: JSON.stringify(context)
                },
                query: message,
                response_mode: 'blocking',
                conversation_id: context.conversationId || '',
                user: `student_${studentId || 'anonymous'}`
            });

            return {
                success: true,
                answer: response.answer || response.data?.answer || '抱歉，我无法理解您的问题，请重新描述。',
                conversationId: response.conversation_id,
                messageId: response.message_id
            };
        } catch (error) {
            console.error('学习助手对话错误:', error);
            return {
                success: false,
                error: error.message,
                answer: '抱歉，当前无法回答您的问题，请稍后再试。'
            };
        }
    }

    // 生成练习题目
    async generatePracticeQuestions(context = {}) {
        const { 
            studentId, 
            subjectId, 
            chapterContent, 
            difficulty, 
            questionCount = 5,
            questionTypes = ['选择题', '填空题', '解答题'],
            studentWeakAreas = []
        } = context;

        const systemPrompt = `你是一名专业的题目生成专家，根据学生的学习情况生成适合的练习题目。

生成要求：
- 科目: ${context.subjectName || '通用'}
- 章节内容: ${chapterContent || '基础内容'}
- 难度等级: ${difficulty || '中等'}
- 题目数量: ${questionCount}
- 题目类型: ${questionTypes.join(', ')}
- 学生薄弱环节: ${studentWeakAreas.join(', ') || '无特定薄弱环节'}

请生成结构化的练习题目，包含题目、选项（如适用）、正确答案和详细解析。
返回JSON格式，包含questions数组。`;

        try {
            const response = await this.callDifyAPI('/chat-messages', {
                inputs: {
                    generation_type: 'practice_questions',
                    subject: context.subjectName,
                    chapter: chapterContent,
                    difficulty: difficulty,
                    count: questionCount,
                    types: questionTypes.join(','),
                    weak_areas: studentWeakAreas.join(','),
                    system_prompt: systemPrompt
                },
                query: `请为${context.subjectName}科目生成${questionCount}道${difficulty}难度的练习题`,
                response_mode: 'blocking',
                user: `student_${studentId || 'anonymous'}`
            });

            // 尝试解析JSON响应
            let questions = [];
            try {
                const answerText = response.answer || response.data?.answer || '';
                // 尝试从响应中提取JSON
                const jsonMatch = answerText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsedData = JSON.parse(jsonMatch[0]);
                    questions = parsedData.questions || [];
                }
            } catch (parseError) {
                console.error('解析题目JSON失败:', parseError);
                // 如果解析失败，创建默认题目
                questions = this.createDefaultQuestions(context);
            }

            return {
                success: true,
                questions,
                totalCount: questions.length,
                generatedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('生成练习题目错误:', error);
            return {
                success: false,
                error: error.message,
                questions: this.createDefaultQuestions(context)
            };
        }
    }

    // 评估学生答案
    async evaluateStudentAnswer(question, studentAnswer, context = {}) {
        const systemPrompt = `你是一名专业的作业评估专家，负责评估学生的答案并提供详细反馈。

题目信息：
题目: ${question.questionText || question.question}
正确答案: ${question.correctAnswer || question.answer}
学生答案: ${studentAnswer}

请提供：
1. 答案是否正确
2. 详细的错误分析（如果有错误）
3. 解题思路和步骤
4. 改进建议
5. 相关知识点提醒

请以JSON格式返回评估结果。`;

        try {
            const response = await this.callDifyAPI('/chat-messages', {
                inputs: {
                    evaluation_type: 'answer_check',
                    question: JSON.stringify(question),
                    student_answer: studentAnswer,
                    system_prompt: systemPrompt
                },
                query: `请评估学生的答案：${studentAnswer}`,
                response_mode: 'blocking',
                user: `student_${context.studentId || 'anonymous'}`
            });

            // 解析评估结果
            let evaluation = {};
            try {
                const answerText = response.answer || response.data?.answer || '';
                const jsonMatch = answerText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    evaluation = JSON.parse(jsonMatch[0]);
                }
            } catch (parseError) {
                // 如果解析失败，创建默认评估
                evaluation = this.createDefaultEvaluation(question, studentAnswer);
            }

            return {
                success: true,
                evaluation,
                rawResponse: response.answer
            };
        } catch (error) {
            console.error('评估答案错误:', error);
            return {
                success: false,
                error: error.message,
                evaluation: this.createDefaultEvaluation(question, studentAnswer)
            };
        }
    }

    // 创建默认题目（当AI生成失败时）
    createDefaultQuestions(context) {
        const { subjectName = '通用', questionCount = 3 } = context;
        
        const defaultQuestions = [];
        for (let i = 1; i <= questionCount; i++) {
            defaultQuestions.push({
                id: `default_${i}`,
                questionText: `${subjectName}练习题 ${i}`,
                questionType: '选择题',
                options: [
                    { text: '选项A', isCorrect: true },
                    { text: '选项B', isCorrect: false },
                    { text: '选项C', isCorrect: false },
                    { text: '选项D', isCorrect: false }
                ],
                correctAnswer: '选项A',
                explanation: '这是一道基础练习题，请根据所学知识选择正确答案。',
                difficulty: '基础',
                points: 10
            });
        }
        
        return defaultQuestions;
    }

    // 创建默认评估（当AI评估失败时）
    createDefaultEvaluation(question, studentAnswer) {
        const isCorrect = studentAnswer === question.correctAnswer;
        
        return {
            isCorrect,
            score: isCorrect ? 100 : 0,
            feedback: isCorrect ? '答案正确！' : '答案不正确，请重新思考。',
            errorAnalysis: isCorrect ? null : {
                errorType: '答案错误',
                suggestion: '请仔细阅读题目，回顾相关知识点。'
            },
            explanation: question.explanation || '请参考教学内容进行学习。'
        };
    }

    // 获取学习建议
    async getLearningRecommendations(studentData) {
        const { studentId, recentPerformance, weakAreas, studyGoals } = studentData;

        const systemPrompt = `你是一名专业的学习顾问，根据学生的学习数据提供个性化学习建议。

学生表现数据：
${JSON.stringify(recentPerformance, null, 2)}

薄弱领域：
${weakAreas.join(', ')}

学习目标：
${studyGoals || '提高整体成绩'}

请提供具体的学习建议和改进计划。`;

        try {
            const response = await this.callDifyAPI('/chat-messages', {
                inputs: {
                    recommendation_type: 'learning_plan',
                    student_data: JSON.stringify(studentData),
                    system_prompt: systemPrompt
                },
                query: '请为我制定个性化的学习计划',
                response_mode: 'blocking',
                user: `student_${studentId}`
            });

            return {
                success: true,
                recommendations: response.answer || '请继续努力学习，保持良好的学习习惯。'
            };
        } catch (error) {
            console.error('获取学习建议错误:', error);
            return {
                success: false,
                error: error.message,
                recommendations: '暂时无法生成学习建议，请稍后再试。'
            };
        }
    }
}

module.exports = new DifyService();
