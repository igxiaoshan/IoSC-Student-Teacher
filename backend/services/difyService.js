const axios = require('axios');

class DifyService {
    constructor() {
        this.baseURL = process.env.DIFY_API_URL ;
        this.apiKey = process.env.DIFY_API_KEY ;
        this.timeout = 60000; // 60秒超时，云服务可能需要更长时间
        this.practicalExerciseTimeout = 180000; // 实训练习生成需要更长时间：180秒（3分钟）
        this.maxRetries = 2; // 最大重试次数
        this.retryDelay = 5000; // 重试延迟：5秒
        this.isHealthy = null; // 缓存健康状态
        this.lastHealthCheck = 0; // 上次健康检查时间
        this.healthCheckInterval = 30000; // 30秒检查一次
        this.consecutiveFailures = 0; // 连续失败次数
        this.maxConsecutiveFailures = 3; // 最大连续失败次数
    }

    // 检查Dify服务健康状态
    async checkHealth() {
        const now = Date.now();

        // 如果最近检查过且结果为健康，直接返回
        if (this.isHealthy && (now - this.lastHealthCheck) < this.healthCheckInterval) {
            return this.isHealthy;
        }

        // 检查基本配置
        if (!this.baseURL || !this.apiKey) {
            console.log('Dify配置不完整，标记为不健康');
            this.isHealthy = false;
            this.lastHealthCheck = now;
            return false;
        }

        try {
            console.log('检查Dify服务健康状态...');

            // 使用一个轻量级的测试请求来检查服务可用性
            // 发送一个简单的请求到chat-messages端点
            const testResponse = await axios.post(`${this.baseURL}/chat-messages`, {
                inputs: {},
                query: "health check",
                response_mode: 'blocking',
                user: 'health_check'
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 5000,
                validateStatus: (status) => {
                    // 接受200-299和400-499状态码（400可能是请求格式问题，但服务是可用的）
                    return (status >= 200 && status < 300) || (status >= 400 && status < 500);
                }
            });

            // 如果能收到响应（即使是错误响应），说明服务是可用的
            this.isHealthy = testResponse.status < 500;
            this.lastHealthCheck = now;

            console.log(`Dify服务健康检查: ${this.isHealthy ? '✅ 健康' : '❌ 不健康'} (状态码: ${testResponse.status})`);
            return this.isHealthy;

        } catch (error) {
            console.log(`Dify服务健康检查失败: ${error.message}`);
            this.isHealthy = false;
            this.lastHealthCheck = now;
            return false;
        }
    }

    // 分析错误类型
    analyzeError(error) {
        if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
            return 'timeout';
        } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ECONNRESET') {
            return 'connection';
        } else if (error.response?.status === 401 || error.response?.status === 403) {
            return 'auth';
        } else if (error.response?.status >= 400 && error.response?.status < 500) {
            return 'client';
        } else if (error.response?.status >= 500) {
            return 'server';
        } else {
            return 'unknown';
        }
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
                    'User-Agent': 'IoSC-Student-Teacher/1.0',
                    'Accept': 'application/json',
                    ...options.headers
                },
                data,
                timeout: this.timeout,
                // 网络配置
                maxRedirects: 5,
                validateStatus: function (status) {
                    return status >= 200 && status < 300;
                },
                // 连接配置
                httpsAgent: false, // 禁用HTTPS代理
                httpAgent: false   // 禁用HTTP代理
            };

            console.log(`调用Dify云服务API: ${config.url}`);
            console.log(`请求数据:`, JSON.stringify(data, null, 2));

            // 实现快速重试机制
            let lastError;
            for (let attempt = 1; attempt <= 2; attempt++) {
                try {
                    console.log(`尝试第 ${attempt} 次调用...`);
                    const response = await axios(config);

                    console.log(`API响应状态: ${response.status}`);
                    console.log(`API响应数据:`, JSON.stringify(response.data, null, 2));

                    return response.data;
                } catch (error) {
                    lastError = error;
                    console.log(`第 ${attempt} 次尝试失败:`, error.message);

                    // 分析错误类型
                    const errorType = this.analyzeError(error);
                    console.log(`错误类型: ${errorType}`);

                    // 如果是连接错误，立即失败不重试
                    if (errorType === 'connection') {
                        console.log('检测到连接错误，跳过重试直接使用模拟数据');
                        break;
                    }

                    // 如果是超时错误且是实训练习生成，给出特殊提示
                    if (errorType === 'timeout' && endpoint === '/chat-messages') {
                        console.log('检测到Dify服务超时，可能是后端模型响应缓慢');
                        console.log('建议: 检查Ollama服务状态或使用云端API');
                    }

                    if (attempt < 2) {
                        const delay = 500; // 固定500ms延迟
                        console.log(`等待 ${delay}ms 后重试...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            }

            throw lastError;
        } catch (error) {
            console.error('Dify API调用错误:', {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data
            });

            // 提供更详细的错误信息
            if (error.response?.status === 401) {
                throw new Error('Dify API认证失败，请检查API Key是否正确');
            } else if (error.response?.status === 429) {
                throw new Error('Dify API调用频率超限，请稍后重试');
            } else if (error.response?.status >= 500) {
                throw new Error('Dify服务器错误，请稍后重试');
            } else {
                throw new Error(`Dify API调用失败: ${error.message}`);
            }
        }
    }

    // 过滤AI响应中的思考过程
    filterAIResponse(content) {
        if (!content || typeof content !== 'string') {
            return content;
        }

        // 移除<think>标签及其内容
        const thinkRegex = /<think>[\s\S]*?<\/think>/gi;
        const filtered = content.replace(thinkRegex, '').trim();

        // 移除可能的其他内部标签
        const internalTagRegex = /<(internal|debug|system)>[\s\S]*?<\/(internal|debug|system)>/gi;
        return filtered.replace(internalTagRegex, '').trim();
    }

    // 流式API调用方法
    async callDifyStreamingAPI(endpoint, data, onChunk, onComplete, onError) {
        try {
            const config = {
                method: 'POST',
                url: `${this.baseURL}${endpoint}`,
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream',
                },
                data,
                responseType: 'stream',
                timeout: this.timeout
            };

            console.log(`调用Dify流式API: ${config.url}`);
            console.log(`请求数据:`, JSON.stringify(data, null, 2));

            const response = await axios(config);

            let buffer = '';
            let conversationId = '';
            let messageId = '';
            let fullContent = '';
            let isInThinkTag = false;
            let thinkContent = '';

            response.data.on('data', (chunk) => {
                buffer += chunk.toString();
                const lines = buffer.split('\n');
                buffer = lines.pop(); // 保留最后一行（可能不完整）

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const jsonStr = line.slice(6);
                            if (jsonStr === '[DONE]') {
                                if (onComplete) {
                                    onComplete({
                                        conversationId,
                                        messageId,
                                        fullContent: this.filterAIResponse(fullContent)
                                    });
                                }
                                return;
                            }

                            const eventData = JSON.parse(jsonStr);

                            if (eventData.conversation_id) {
                                conversationId = eventData.conversation_id;
                            }
                            if (eventData.message_id) {
                                messageId = eventData.message_id;
                            }

                            if (eventData.answer) {
                                const chunk = eventData.answer;
                                fullContent += chunk;

                                // 实时过滤思考内容
                                const filteredChunk = this.processStreamChunk(chunk, isInThinkTag, thinkContent);

                                if (filteredChunk.shouldSend && onChunk) {
                                    onChunk(filteredChunk.content);
                                }

                                isInThinkTag = filteredChunk.isInThinkTag;
                                thinkContent = filteredChunk.thinkContent;
                            }
                        } catch (parseError) {
                            console.warn('解析流式数据失败:', parseError.message);
                        }
                    }
                }
            });

            response.data.on('end', () => {
                if (onComplete) {
                    onComplete({
                        conversationId,
                        messageId,
                        fullContent: this.filterAIResponse(fullContent)
                    });
                }
            });

            response.data.on('error', (error) => {
                console.error('流式响应错误:', error);
                if (onError) {
                    onError(error);
                }
            });

            return { success: true };

        } catch (error) {
            console.error('Dify流式API调用错误:', error);
            if (onError) {
                onError(error);
            }
            throw error;
        }
    }

    // 处理流式数据块，实时过滤思考内容
    processStreamChunk(chunk, isInThinkTag, thinkContent) {
        let content = '';
        let shouldSend = false;
        let newIsInThinkTag = isInThinkTag;
        let newThinkContent = thinkContent;

        // 检查是否进入think标签
        if (chunk.includes('<think>')) {
            newIsInThinkTag = true;
            const beforeThink = chunk.split('<think>')[0];
            if (beforeThink && !isInThinkTag) {
                content = beforeThink;
                shouldSend = true;
            }
        }
        // 检查是否退出think标签
        else if (chunk.includes('</think>')) {
            newIsInThinkTag = false;
            const afterThink = chunk.split('</think>')[1];
            if (afterThink) {
                content = afterThink;
                shouldSend = true;
            }
            newThinkContent = '';
        }
        // 如果在think标签内，不发送内容
        else if (newIsInThinkTag) {
            newThinkContent += chunk;
            shouldSend = false;
        }
        // 正常内容
        else {
            content = chunk;
            shouldSend = true;
        }

        return {
            content,
            shouldSend,
            isInThinkTag: newIsInThinkTag,
            thinkContent: newThinkContent
        };
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
            // 根据Dify官方文档的正确格式
            const requestData = {
                inputs: {},  // 空的inputs对象，系统提示应该在应用配置中设置
                query: `${message}\n\n学生信息：${context.subjectName || '通用'}科目\n${systemPrompt}`,
                response_mode: 'blocking',
                user: `student_${studentId || 'anonymous'}`
            };

            // 如果有对话ID，则添加到请求中
            if (context.conversationId) {
                requestData.conversation_id = context.conversationId;
            }

            const response = await this.callDifyAPI('/chat-messages', requestData);

            // 过滤响应内容
            const filteredAnswer = this.filterAIResponse(response.answer || response.data?.answer || '抱歉，我无法理解您的问题，请重新描述。');

            return {
                success: true,
                answer: filteredAnswer,
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

    // 学习助手对话 - 流式模式
    async chatWithLearningAssistantStream(message, context = {}, onChunk, onComplete, onError) {
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
            const requestData = {
                inputs: {},
                query: `${message}\n\n学生信息：${context.subjectName || '通用'}科目\n${systemPrompt}`,
                response_mode: 'streaming',
                user: `student_${studentId || 'anonymous'}`
            };

            if (context.conversationId) {
                requestData.conversation_id = context.conversationId;
            }

            return await this.callDifyStreamingAPI('/chat-messages', requestData, onChunk, onComplete, onError);

        } catch (error) {
            console.error('学习助手流式对话错误:', error);
            if (onError) {
                onError(error);
            }
            return {
                success: false,
                error: error.message
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

**重要：必须严格按照以下JSON格式返回，不要添加任何其他文字说明：**

{
  "questions": [
    {
      "questionId": "q1",
      "questionText": "题目内容",
      "questionType": "选择题",
      "options": [
        {"text": "选项A内容", "isCorrect": false},
        {"text": "选项B内容", "isCorrect": true},
        {"text": "选项C内容", "isCorrect": false},
        {"text": "选项D内容", "isCorrect": false}
      ],
      "correctAnswer": "选项B内容",
      "explanation": "详细解析",
      "difficulty": "简单",
      "points": 10
    }
  ]
}

请严格按照上述JSON格式返回，确保JSON格式正确，可以被程序解析。`;

        try {
            const response = await this.callDifyAPI('/chat-messages', {
                inputs: {
                    generation_type: 'practice_questions',
                    subject: context.subjectName || '通用',
                    chapter: chapterContent || '基础内容',
                    difficulty: difficulty || '中等',
                    count: questionCount.toString(),
                    types: questionTypes.join(','),
                    weak_areas: studentWeakAreas.join(','),
                    format: 'json',
                    system_prompt: systemPrompt
                },
                query: `请严格按照JSON格式为${context.subjectName || '通用'}科目生成${questionCount}道${difficulty || '中等'}难度的练习题。题型：${questionTypes.join('、')}。必须返回有效的JSON格式，包含questions数组。`,
                response_mode: 'blocking',
                user: `student_${studentId || 'anonymous'}`,
                auto_generate_name: false
            });

            // 尝试解析JSON响应
            let questions = [];
            try {
                const answerText = this.filterAIResponse(response.answer || response.data?.answer || '');
                console.log('AI响应内容:', answerText.substring(0, 500) + '...');
                console.log('完整AI响应:', answerText);

                // 尝试多种JSON提取方式
                let jsonData = null;

                // 方式1: 直接解析整个响应
                try {
                    jsonData = JSON.parse(answerText);
                } catch (e) {
                    // 方式2: 提取JSON代码块
                    const jsonBlockMatch = answerText.match(/```json\s*([\s\S]*?)\s*```/);
                    if (jsonBlockMatch) {
                        jsonData = JSON.parse(jsonBlockMatch[1]);
                    } else {
                        // 方式3: 提取大括号内容
                        const jsonMatch = answerText.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                            jsonData = JSON.parse(jsonMatch[0]);
                        }
                    }
                }

                if (jsonData && jsonData.questions && Array.isArray(jsonData.questions)) {
                    questions = jsonData.questions.map((q, index) => ({
                        id: q.id || q.questionId || `ai_${index}_${Date.now()}`,
                        questionId: q.questionId || q.id || `ai_${index}_${Date.now()}`,
                        questionText: q.questionText || q.question || `题目 ${index + 1}`,
                        question: q.question || q.questionText || `题目 ${index + 1}`,
                        questionType: q.questionType || q.type || '选择题',
                        options: this.normalizeOptions(q.options),
                        correctAnswer: q.correctAnswer || q.answer || '',
                        answer: q.answer || q.correctAnswer || '',
                        explanation: q.explanation || q.解析 || '',
                        difficulty: q.difficulty || q.难度 || '中等',
                        points: q.points || q.分值 || 10
                    }));
                } else {
                    console.warn('AI响应不是JSON格式，尝试解析文本格式');
                    // 尝试解析文本格式的题目
                    questions = this.parseTextQuestions(answerText, context);
                    if (questions.length === 0) {
                        console.warn('文本解析也失败，使用默认题目');
                        questions = this.createDefaultQuestions(context);
                    }
                }
            } catch (parseError) {
                console.error('解析题目JSON失败:', parseError);
                console.error('原始响应:', response.answer?.substring(0, 500));
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
                    question_text: question.questionText || question.question || '',
                    correct_answer: question.correctAnswer || question.answer || '',
                    student_answer: studentAnswer || '',
                    question_type: question.questionType || '选择题',
                    system_prompt: systemPrompt
                },
                query: `请评估以下答案：题目："${question.questionText || question.question}"，学生答案："${studentAnswer}"，正确答案："${question.correctAnswer || question.answer}"`,
                response_mode: 'blocking',
                user: `student_${context.studentId || 'anonymous'}`,
                auto_generate_name: false
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
                questionId: `default_${i}`, // 添加questionId字段
                questionText: `${subjectName}练习题 ${i}`,
                question: `${subjectName}练习题 ${i}`, // 兼容字段
                questionType: '选择题',
                options: [
                    { text: '选项A', isCorrect: true },
                    { text: '选项B', isCorrect: false },
                    { text: '选项C', isCorrect: false },
                    { text: '选项D', isCorrect: false }
                ],
                correctAnswer: '选项A',
                answer: '选项A', // 兼容字段
                explanation: '这是一道基础练习题，请根据所学知识选择正确答案。',
                difficulty: '基础',
                points: 10
            });
        }
        
        return defaultQuestions;
    }

    // 解析文本格式的题目
    parseTextQuestions(text, context) {
        const questions = [];
        const { questionCount = 5 } = context;

        try {
            // 按题目分割文本
            const questionBlocks = text.split(/\d+\.\s*/).filter(block => block.trim());

            for (let i = 0; i < Math.min(questionBlocks.length, questionCount); i++) {
                const block = questionBlocks[i].trim();
                if (!block) continue;

                // 提取题目文本（第一行或到选项前的内容）
                const lines = block.split('\n').map(line => line.trim()).filter(line => line);
                let questionText = '';
                let options = [];
                let currentSection = 'question';

                for (const line of lines) {
                    // 检查是否是选项行
                    const optionMatch = line.match(/^[A-D][\.\)]\s*(.+)$/i) ||
                                      line.match(/^\*\s*[A-D][\.\)]\s*(.+)$/i);

                    if (optionMatch) {
                        currentSection = 'options';
                        const optionText = optionMatch[1].trim();
                        options.push({
                            text: optionText,
                            isCorrect: false // 暂时设为false，后续可以通过关键词判断
                        });
                    } else if (currentSection === 'question' && line) {
                        // 清理题目文本中的markdown格式
                        const cleanLine = line.replace(/\*\*(.+?)\*\*/g, '$1') // 移除粗体
                                             .replace(/\*(.+?)\*/g, '$1')     // 移除斜体
                                             .replace(/^#+\s*/, '')          // 移除标题标记
                                             .trim();
                        if (cleanLine) {
                            questionText += (questionText ? ' ' : '') + cleanLine;
                        }
                    }
                }

                // 如果没有找到选项，创建默认选项
                if (options.length === 0) {
                    options = [
                        { text: '选项A', isCorrect: true },
                        { text: '选项B', isCorrect: false },
                        { text: '选项C', isCorrect: false },
                        { text: '选项D', isCorrect: false }
                    ];
                }

                // 智能识别正确答案
                this.identifyCorrectAnswer(options, block);

                const question = {
                    id: `parsed_${i + 1}`,
                    questionId: `parsed_${i + 1}`,
                    questionText: questionText || `解析题目 ${i + 1}`,
                    question: questionText || `解析题目 ${i + 1}`,
                    questionType: '选择题',
                    options: options,
                    correctAnswer: options.find(opt => opt.isCorrect)?.text || options[0]?.text || '选项A',
                    answer: options.find(opt => opt.isCorrect)?.text || options[0]?.text || '选项A',
                    explanation: '根据题目内容和选项分析得出答案。',
                    difficulty: context.difficulty || '中等',
                    points: 10
                };

                questions.push(question);
            }

            console.log(`成功解析 ${questions.length} 道文本题目`);
            return questions;

        } catch (error) {
            console.error('解析文本题目失败:', error);
            return [];
        }
    }

    // 智能识别正确答案
    identifyCorrectAnswer(options, blockText) {
        if (options.length === 0) return;

        // 策略1: 查找答案标识
        const answerPatterns = [
            /答案[：:]\s*([A-D])/i,
            /正确答案[：:]\s*([A-D])/i,
            /选择[：:]\s*([A-D])/i
        ];

        for (const pattern of answerPatterns) {
            const match = blockText.match(pattern);
            if (match) {
                const answerLetter = match[1].toUpperCase();
                const answerIndex = answerLetter.charCodeAt(0) - 'A'.charCodeAt(0);
                if (answerIndex >= 0 && answerIndex < options.length) {
                    options.forEach((opt, idx) => {
                        opt.isCorrect = idx === answerIndex;
                    });
                    return;
                }
            }
        }

        // 策略2: 查找标记的正确选项（如带有特殊标记的选项）
        for (let i = 0; i < options.length; i++) {
            const optionText = options[i].text;
            if (optionText.includes('✓') || optionText.includes('√') ||
                optionText.includes('正确') || optionText.includes('对')) {
                options.forEach((opt, idx) => {
                    opt.isCorrect = idx === i;
                });
                return;
            }
        }

        // 策略3: 默认第一个选项为正确答案
        options[0].isCorrect = true;
    }

    // 标准化选项格式
    normalizeOptions(options) {
        if (!options) {
            return [];
        }

        // 如果已经是正确格式的对象数组
        if (Array.isArray(options) && options.length > 0 && typeof options[0] === 'object' && options[0].text !== undefined) {
            return options.map(opt => ({
                text: String(opt.text || ''),
                isCorrect: Boolean(opt.isCorrect)
            }));
        }

        // 如果是字符串数组
        if (Array.isArray(options) && options.length > 0 && typeof options[0] === 'string') {
            return options.map((optText, index) => ({
                text: String(optText),
                isCorrect: index === 0 // 默认第一个为正确答案
            }));
        }

        // 如果是单个字符串（错误情况）
        if (typeof options === 'string') {
            return [{
                text: String(options),
                isCorrect: true
            }];
        }

        // 如果是其他类型，尝试转换为字符串
        if (options && typeof options === 'object' && !Array.isArray(options)) {
            // 可能是单个选项对象
            return [{
                text: String(options.text || options.toString()),
                isCorrect: Boolean(options.isCorrect)
            }];
        }

        // 其他情况返回空数组
        return [];
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
                    student_performance: JSON.stringify(recentPerformance || []),
                    weak_areas: weakAreas.join(', ') || '无',
                    study_goals: studyGoals || '提高整体成绩',
                    student_id: studentId || 'anonymous',
                    system_prompt: systemPrompt
                },
                query: `请根据我的学习表现制定个性化学习计划。我的薄弱环节是：${weakAreas.join('、') || '无'}，学习目标是：${studyGoals || '提高整体成绩'}`,
                response_mode: 'blocking',
                user: `student_${studentId}`,
                auto_generate_name: false
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

    // 生成教学计划/课件内容
    async generateLessonPlan(inputData) {
        const {
            subject_name,
            teacher_name,
            course_title,
            course_description,
            course_syllabus,
            course_level,
            student_count,
            duration,
            focus_areas
        } = inputData;

        const systemPrompt = `你是一名专业的教学设计专家，负责根据提供的信息生成详细的课件内容。

课程信息：
- 科目：${subject_name}
- 教师：${teacher_name}
- 课程标题：${course_title}
- 课程描述：${course_description}
- 课程大纲：${course_syllabus}
- 课程级别：${course_level}
- 学生人数：${student_count}
- 课程时长：${duration}分钟
- 重点领域：${focus_areas}

请生成一个完整的课件内容，包括：
1. 课程介绍
2. 学习目标
3. 知识点详解
4. 教学活动设计
5. 练习题目
6. 课程总结

请以JSON格式返回，包含以下字段：
{
    "title": "课程标题",
    "introduction": "课程介绍",
    "objectives": ["学习目标1", "学习目标2"],
    "knowledgePoints": [
        {
            "title": "知识点标题",
            "content": "详细内容",
            "difficulty": "难度级别",
            "estimatedTime": 时间(分钟)
        }
    ],
    "teachingActivities": [
        {
            "activity": "活动名称",
            "description": "活动描述",
            "duration": 时间(分钟)
        }
    ],
    "practiceExercises": [
        {
            "title": "练习标题",
            "description": "练习描述",
            "difficulty": "难度级别",
            "estimatedTime": 时间(分钟)
        }
    ],
    "summary": "课程总结"
}`;

        try {
            // 使用Dify API生成课件内容
            const response = await this.callDifyAPI('/chat-messages', {
                inputs: inputData,
                query: systemPrompt,
                response_mode: 'blocking',
                conversation_id: '',
                user: teacher_name || 'teacher'
            });

            return {
                success: true,
                answer: response.answer || response.data || '',
                data: response
            };
        } catch (error) {
            console.error('Dify课件生成失败:', error);
            throw new Error(`Dify课件生成失败: ${error.message}`);
        }
    }

    // 生成考核题目
    async generateAssessment(inputData) {
        const {
            subject_name,
            teacher_name,
            assessment_title,
            assessment_description,
            difficulty,
            question_count,
            question_types,
            duration,
            focus_areas,
            courseware_content
        } = inputData;

        // 构建考核生成的提示词
        const systemPrompt = `你是一名专业的${subject_name}教师，擅长设计高质量的考核题目。请根据以下要求生成考核内容：

考核要求：
- 科目：${subject_name}
- 标题：${assessment_title}
- 描述：${assessment_description}
- 难度等级：${difficulty}
- 题目数量：${question_count}题
- 题目类型：${question_types.join('、')}
- 考试时长：${duration}分钟
- 关注领域：${focus_areas.join('、')}

${courseware_content ? `参考课件内容：\n${courseware_content}` : ''}

请生成结构化的考核题目，包含：
1. 题目内容
2. 题目类型
3. 选项（如果是选择题）
4. 正确答案
5. 题目解析
6. 分值分配

请确保题目质量高、难度适中、覆盖面广。`;

        // 首先检查基本配置
        if (!this.baseURL || !this.apiKey) {
            console.warn('Dify配置不完整，直接使用模拟数据生成');
            return this.generateMockAssessmentResponse(inputData);
        }

        try {
            console.log('开始调用Dify生成考核题目...');

            // 先检查Dify服务健康状态
            const isHealthy = await this.checkHealth();
            if (!isHealthy) {
                console.warn('Dify服务健康检查失败，使用模拟数据');
                return this.generateMockAssessmentResponse(inputData);
            }

            // 使用与课件生成相同的调用方式
            const response = await this.callDifyAPI('/chat-messages', {
                inputs: inputData,  // 直接传递原始inputData，与课件生成保持一致
                query: systemPrompt,
                response_mode: 'blocking',
                conversation_id: '',
                user: teacher_name || 'teacher'
            });

            console.log('Dify考核生成响应:', response);

            if (response && response.answer) {
                // 解析Dify返回的考核内容
                const assessmentContent = this.parseAssessmentContent(response.answer, {
                    title: assessment_title,
                    description: assessment_description,
                    subject: subject_name,
                    difficulty,
                    duration,
                    questionCount: question_count,
                    questionTypes: question_types,
                    focusAreas: focus_areas
                });

                return {
                    success: true,
                    data: assessmentContent,
                    source: 'dify',
                    conversation_id: response.conversation_id
                };
            } else {
                throw new Error('Dify返回的响应格式不正确');
            }

        } catch (error) {
            console.error('Dify考核生成失败:', error);
            console.log('Dify调用失败，使用本地模拟数据生成考核...');
            return this.generateMockAssessmentResponse(inputData);
        }
    }

    // 生成模拟考核响应的统一方法
    generateMockAssessmentResponse(inputData) {
        const {
            subject_name,
            assessment_title,
            assessment_description,
            difficulty,
            question_count,
            question_types,
            duration,
            focus_areas
        } = inputData;

        const mockAssessment = this.generateMockAssessmentContent({
            subjectName: subject_name,
            title: assessment_title,
            description: assessment_description,
            difficulty,
            questionCount: question_count,
            questionTypes: question_types,
            duration,
            focusAreas: focus_areas
        });

        return {
            success: true,
            data: mockAssessment,
            source: 'mock',
            note: 'Dify服务不可用，使用本地智能生成系统'
        };
    }

    // 解析Dify返回的考核内容
    parseAssessmentContent(content, metadata) {
        try {
            // 尝试解析JSON格式
            const parsed = JSON.parse(content);
            if (parsed.questions && Array.isArray(parsed.questions)) {
                return {
                    ...metadata,
                    questions: parsed.questions,
                    generatedBy: 'Dify AI',
                    generatedAt: new Date().toISOString()
                };
            }
        } catch (e) {
            console.log('JSON解析失败，尝试文本解析...');
        }

        // 首先清理内容，移除<think>标签内容
        let cleanContent = content;
        if (content.includes('<think>')) {
            cleanContent = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
        }

        console.log('开始解析Dify Markdown格式内容...');

        // 专门解析Dify返回的Markdown格式
        const questions = this.parseDifyMarkdownQuestions(cleanContent, metadata);

        if (questions.length > 0) {
            console.log(`Dify Markdown解析成功，解析出${questions.length}道题目`);
            return {
                ...metadata,
                questions: questions,
                generatedBy: 'Dify AI (Markdown解析)',
                generatedAt: new Date().toISOString()
            };
        }

        // 如果Markdown解析失败，尝试旧的文本解析逻辑
        console.log('Markdown解析失败，尝试通用文本解析...');
        const fallbackQuestions = [];
        const lines = cleanContent.split('\n').filter(line => line.trim());

        let currentQuestion = null;
        let questionIndex = 1;
        let isInQuestionBlock = false;
        let currentSection = '';
        let collectingOptions = false;

        lines.forEach(line => {
            line = line.trim();

            // 识别题目开始 - 支持新格式 ### 题目 1
            if (line.match(/^###\s*题目\s*\d+/) || line.match(/^\d+[\.、]\s*\*?\*?题目内容[：:]/)) {
                if (currentQuestion) {
                    questions.push(currentQuestion);
                }

                currentQuestion = {
                    questionNumber: questionIndex++,
                    type: '选择题', // 默认类型，后续会更新
                    question: '',
                    options: [],
                    correctAnswer: '',
                    points: 10,
                    explanation: '',
                    difficulty: metadata.difficulty
                };
                isInQuestionBlock = true;
                currentSection = 'title';
                collectingOptions = false;
            }
            // 识别题目内容 - 新格式 **内容：**
            else if (line.match(/\*\*内容[：:]\*\*/)) {
                if (currentQuestion) {
                    const questionText = line.replace(/\*\*内容[：:]\*\*\s*/, '');
                    currentQuestion.question = questionText;
                }
                currentSection = 'question';
            }
            // 识别旧格式的题目内容
            else if (line.match(/^\d+[\.、]\s*\*?\*?题目内容[：:]/)) {
                if (currentQuestion) {
                    const questionText = line.replace(/^\d+[\.、]\s*\*?\*?题目内容[：:]\s*/, '');
                    currentQuestion.question = questionText;
                }
                currentSection = 'question';
            }
            // 识别题目类型
            else if (line.match(/\*\*题目类型[：:]\*\*/)) {
                if (currentQuestion) {
                    const type = line.replace(/\*\*题目类型[：:]\*\*\s*/, '');
                    currentQuestion.type = type;
                    currentQuestion.points = this.getPointsByType(type);
                }
                currentSection = 'type';
            }
            // 识别选项部分 - 新格式
            else if (line.match(/\*\*选项[：:]\*\*/)) {
                currentSection = 'options';
                collectingOptions = true;
            }
            // 识别旧格式选项部分
            else if (line.match(/选项[：:]/)) {
                currentSection = 'options';
                collectingOptions = true;
            }
            // 识别具体选项 A. B. C. D. 或 A) B) C) D)
            else if (line.match(/^[A-D][\.)\s]/)) {
                if (currentQuestion && (currentSection === 'options' || collectingOptions)) {
                    currentQuestion.options.push(line);
                }
            }
            // 识别正确答案
            else if (line.match(/\*\*正确答案[：:]\*\*/) || line.match(/正确答案[：:]/)) {
                if (currentQuestion) {
                    const answer = line.replace(/\*\*正确答案[：:]\*\*\s*/, '').replace(/正确答案[：:]\s*/, '');
                    currentQuestion.correctAnswer = answer;
                }
                currentSection = 'answer';
                collectingOptions = false;
            }
            // 识别题目解析
            else if (line.match(/\*\*题目解析[：:]\*\*/) || line.match(/题目解析[：:]/)) {
                if (currentQuestion) {
                    const explanation = line.replace(/\*\*题目解析[：:]\*\*\s*/, '').replace(/题目解析[：:]\s*/, '');
                    currentQuestion.explanation = explanation;
                }
                currentSection = 'explanation';
            }
            // 识别参考答案（简答题）
            else if (line.match(/\*\*参考答案/) || line.match(/参考答案[：:]/)) {
                if (currentQuestion) {
                    let answer = line.replace(/\*\*参考答案.*[：:]\*\*\s*/, '').replace(/参考答案.*[：:]\s*/, '');
                    // 如果答案为空，可能在下一行
                    if (!answer.trim()) {
                        currentSection = 'collecting_answer';
                    } else {
                        currentQuestion.correctAnswer = answer;
                        currentSection = 'answer';
                    }
                }
            }
            // 收集多行答案内容
            else if (currentSection === 'collecting_answer' && currentQuestion && line.length > 0 && !line.match(/^---/) && !line.match(/^\*\*/) && !line.match(/^###/)) {
                if (currentQuestion.correctAnswer) {
                    currentQuestion.correctAnswer += ' ' + line;
                } else {
                    currentQuestion.correctAnswer = line;
                }
            }
            // 识别分值分配
            else if (line.match(/分值分配[：:]/)) {
                if (currentQuestion) {
                    const pointsMatch = line.match(/(\d+)分/);
                    if (pointsMatch) {
                        currentQuestion.points = parseInt(pointsMatch[1]);
                    }
                }
                currentSection = 'points';
            }
            // 处理填空题的答案格式
            else if (line.match(/答案.*示例/)) {
                if (currentQuestion) {
                    const answer = line.replace(/.*答案.*[：:]\s*/, '').replace(/\s*\/.*$/, '');
                    currentQuestion.correctAnswer = answer;
                }
            }
            // 继续收集选项（如果在选项收集模式）
            else if (collectingOptions && currentQuestion && line.length > 0 && !line.match(/^---/) && !line.match(/^\*\*/)) {
                // 检查是否是选项格式
                if (line.match(/^[A-D][\.)\s]/) || (currentQuestion.options.length > 0 && line.length < 100)) {
                    currentQuestion.options.push(line);
                }
            }
            // 继续解析多行内容
            else if (isInQuestionBlock && currentSection === 'explanation' && line.length > 0 && !line.match(/^###/) && !line.match(/^\*\*/)) {
                if (currentQuestion && !line.match(/^---/)) {
                    currentQuestion.explanation += ' ' + line;
                }
            }
        });

        // 添加最后一个题目
        if (currentQuestion) {
            fallbackQuestions.push(currentQuestion);
        }

        // 如果解析出的题目太少，补充一些基础题目
        while (fallbackQuestions.length < Math.min(metadata.questionCount, 3)) {
            fallbackQuestions.push({
                questionNumber: fallbackQuestions.length + 1,
                type: metadata.questionTypes[0] || '选择题',
                question: `关于${metadata.subject}的基础概念，下列说法正确的是？`,
                options: ['A) 选项A', 'B) 选项B', 'C) 选项C', 'D) 选项D'],
                correctAnswer: 'A)',
                points: 10,
                explanation: '这是基础概念题目的解析。',
                difficulty: metadata.difficulty
            });
        }

        console.log(`Dify文本解析完成，解析出${fallbackQuestions.length}道题目`);

        return {
            ...metadata,
            questions: fallbackQuestions,
            generatedBy: 'Dify AI (文本解析)',
            generatedAt: new Date().toISOString()
        };
    }

    // 专门解析Dify返回的Markdown格式题目
    parseDifyMarkdownQuestions(content, metadata) {
        const questions = [];

        try {
            // 使用正则表达式匹配题目块
            // 匹配格式：### **问题X: 标题**
            const questionBlocks = content.split(/###\s*\*\*问题\d+[：:]/);

            for (let i = 1; i < questionBlocks.length; i++) {
                const block = questionBlocks[i].trim();
                if (!block) continue;

                const question = this.parseQuestionBlock(block, i, metadata);
                if (question) {
                    questions.push(question);
                }
            }

            return questions;
        } catch (error) {
            console.error('Markdown解析错误:', error);
            return [];
        }
    }

    // 解析单个题目块
    parseQuestionBlock(block, questionNumber, metadata) {
        try {
            const lines = block.split('\n').filter(line => line.trim());

            let questionText = '';
            let options = [];
            let correctAnswer = '';
            let explanation = '';
            let currentSection = 'question';
            let collectingExplanation = false;

            for (let line of lines) {
                line = line.trim();

                // 跳过空行和分隔线
                if (!line || line.startsWith('---')) continue;

                // 识别正确答案
                if (line.startsWith('**正确答案：') || line.startsWith('**正确答案:')) {
                    correctAnswer = line.replace(/\*\*正确答案[：:]\*\*\s*/, '').trim();
                    currentSection = 'answer';
                    continue;
                }

                // 识别题目解析
                if (line.startsWith('**题目解析：') || line.startsWith('**题目解析:')) {
                    explanation = line.replace(/\*\*题目解析[：:]\*\*\s*/, '').trim();
                    currentSection = 'explanation';
                    collectingExplanation = true;
                    continue;
                }

                // 识别选项 (A. B. C. D.)
                if (line.match(/^[A-D][\.\)]\s+/)) {
                    options.push(line);
                    currentSection = 'options';
                    continue;
                }

                // 根据当前部分处理内容
                if (currentSection === 'question') {
                    // 第一行通常是标题，跳过
                    if (!questionText && line.includes('**')) {
                        currentSection = 'question_content';
                        continue;
                    }
                    // 如果没有标题标记，直接作为题目内容
                    if (!questionText) {
                        questionText = line;
                    }
                } else if (currentSection === 'question_content' && !questionText) {
                    questionText = line;
                } else if (currentSection === 'explanation' && collectingExplanation) {
                    // 继续收集解析内容
                    if (explanation && !explanation.endsWith('.') && !explanation.endsWith('。')) {
                        explanation += ' ' + line;
                    } else if (!explanation) {
                        explanation = line;
                    }
                }
            }

            // 清理和验证数据
            questionText = this.cleanQuestionText(questionText);
            correctAnswer = this.cleanCorrectAnswer(correctAnswer);
            explanation = explanation || '暂无解析';

            // 验证必要字段
            if (!questionText || options.length === 0 || !correctAnswer) {
                console.warn(`题目${questionNumber}解析不完整:`, {
                    questionText: questionText?.substring(0, 50),
                    optionsCount: options.length,
                    correctAnswer
                });
                return null;
            }

            return {
                questionNumber: questionNumber,
                type: '选择题', // Dify返回的主要是选择题
                question: questionText,
                options: options,
                correctAnswer: correctAnswer,
                points: this.getPointsByType('选择题'),
                explanation: explanation,
                difficulty: metadata.difficulty,
                estimatedTime: Math.ceil(metadata.duration / metadata.questionCount)
            };

        } catch (error) {
            console.error(`解析题目${questionNumber}时出错:`, error);
            return null;
        }
    }

    // 清理题目文本
    cleanQuestionText(text) {
        if (!text) return '';
        return text
            .replace(/\*\*.*?\*\*/g, '') // 移除粗体标记
            .replace(/^[：:]\s*/, '') // 移除开头的冒号
            .trim();
    }

    // 清理正确答案
    cleanCorrectAnswer(answer) {
        if (!answer) return '';
        return answer
            .replace(/\*\*/g, '') // 移除粗体标记
            .replace(/^正确答案[：:]\s*/, '') // 移除"正确答案："前缀
            .trim();
    }

    // 检测题目类型
    detectQuestionType(questionText, availableTypes) {
        const text = questionText.toLowerCase();

        // 优先检测明确的类型标识
        if (text.includes('选择题') || text.includes('选择')) {
            return '选择题';
        } else if (text.includes('填空题') || text.includes('填空') || text.includes('______')) {
            return '填空题';
        } else if (text.includes('简答题') || text.includes('简答')) {
            return '简答题';
        } else if (text.includes('编程题') || text.includes('编程')) {
            return '编程题';
        } else if (text.includes('实操题') || text.includes('实操')) {
            return '实操题';
        }

        // 根据内容特征推断
        if (questionText.match(/[A-D]\)/)) {
            return '选择题';
        } else if (questionText.includes('请填写') || questionText.includes('请用一句话') || questionText.includes('请列举')) {
            return '填空题';
        } else if (questionText.includes('简述') || questionText.includes('分析') || questionText.includes('说明') || questionText.includes('描述')) {
            return '简答题';
        } else if (questionText.includes('编写') || questionText.includes('代码') || questionText.includes('函数')) {
            return '编程题';
        }

        return availableTypes[0] || '选择题';
    }

    // 根据题目类型获取分值
    getPointsByType(type) {
        const pointsMap = {
            '选择题': 5,
            '填空题': 8,
            '简答题': 15,
            '编程题': 20,
            '实操题': 25
        };
        return pointsMap[type] || 10;
    }

    // 生成模拟考核内容（作为后备方案）
    generateMockAssessmentContent(params) {
        const { subjectName, title, description, difficulty, questionCount, questionTypes, duration, focusAreas } = params;

        // 扩展的题目模板库
        const questionTemplates = {
            '数学': {
                '选择题': [
                    { question: '下列哪个函数是一次函数？', options: ['y = x²', 'y = 2x + 1', 'y = 1/x', 'y = |x|'], correctAnswer: 'B', explanation: '一次函数的一般形式为y = kx + b，其中k≠0。' },
                    { question: '若a > b，则下列不等式中正确的是？', options: ['a + 2 > b + 2', 'a - 3 < b - 3', '2a < 2b', '-a > -b'], correctAnswer: 'A', explanation: '不等式两边同时加上相同的数，不等号方向不变。' },
                    { question: '下列哪个数是无理数？', options: ['√4', '√9', '√2', '√16'], correctAnswer: 'C', explanation: '√2是无理数，其他都是有理数。' },
                    { question: '二次函数y = x² - 4x + 3的对称轴是？', options: ['x = 1', 'x = 2', 'x = 3', 'x = 4'], correctAnswer: 'B', explanation: '对称轴公式为x = -b/2a = 4/2 = 2。' }
                ],
                '填空题': [
                    { question: '如果x + 3 = 7，那么x = ______', correctAnswer: '4', explanation: '移项得x = 7 - 3 = 4' },
                    { question: '函数y = 2x - 1中，当x = 3时，y = ______', correctAnswer: '5', explanation: '将x = 3代入得y = 2×3 - 1 = 5' },
                    { question: '圆的面积公式是S = ______', correctAnswer: 'πr²', explanation: '圆的面积等于π乘以半径的平方。' },
                    { question: '若3x - 2 = 10，则x = ______', correctAnswer: '4', explanation: '3x = 12，所以x = 4。' }
                ],
                '简答题': [
                    { question: '解方程：2x + 5 = 13，并验证答案。', correctAnswer: 'x = 4', explanation: '解：2x = 13 - 5 = 8，所以x = 4。验证：2×4 + 5 = 13 ✓' },
                    { question: '证明：两个奇数的和是偶数。', correctAnswer: '设两个奇数为2m+1和2n+1，它们的和为(2m+1)+(2n+1)=2(m+n+1)，是偶数。', explanation: '利用奇数的一般形式进行代数证明。' }
                ]
            },
            '语文': {
                '选择题': [
                    { question: '下列词语中，字音全部正确的是？', options: ['载(zǎi)重 载(zài)歌载舞', '处(chǔ)理 处(chù)境', '调(tiáo)节 调(diào)料', '以上都正确'], correctAnswer: 'D', explanation: '这些多音字的读音都是正确的。' },
                    { question: '"春蚕到死丝方尽"中的"丝"与下列哪个字谐音？', options: ['思', '死', '私', '司'], correctAnswer: 'A', explanation: '"丝"与"思"谐音，表达思念之情。' }
                ],
                '填空题': [
                    { question: '"______，红掌拨清波"', correctAnswer: '白毛浮绿水', explanation: '出自骆宾王的《咏鹅》' },
                    { question: '"山重水复疑无路，______"', correctAnswer: '柳暗花明又一村', explanation: '出自陆游的《游山西村》' }
                ],
                '简答题': [
                    { question: '请分析《春晓》这首诗的意境。', correctAnswer: '描绘春日清晨的美好景象', explanation: '诗人通过"春眠不觉晓"等描写，展现了春日清晨的宁静美好。' },
                    { question: '简述《论语》中"学而时习之"的含义。', correctAnswer: '学习知识后要经常复习实践', explanation: '强调学习与实践相结合的重要性。' }
                ]
            },
            '英语': {
                '选择题': [
                    { question: 'Which of the following is correct?', options: ['He go to school', 'He goes to school', 'He going to school', 'He gone to school'], correctAnswer: 'B', explanation: '第三人称单数现在时动词要加s。' },
                    { question: 'What is the past tense of "run"?', options: ['runned', 'ran', 'runed', 'running'], correctAnswer: 'B', explanation: 'run的过去式是ran，属于不规则动词。' }
                ],
                '填空题': [
                    { question: 'I ______ (be) a student.', correctAnswer: 'am', explanation: '第一人称单数用am。' },
                    { question: 'She ______ (have) a book.', correctAnswer: 'has', explanation: '第三人称单数用has。' }
                ],
                '简答题': [
                    { question: 'Translate: "我喜欢读书"', correctAnswer: 'I like reading books.', explanation: '注意like后面用动名词形式。' }
                ]
            },
            '计算机科学': {
                '选择题': [
                    { question: '下列哪个不是编程语言？', options: ['Python', 'Java', 'HTML', 'C++'], correctAnswer: 'C', explanation: 'HTML是标记语言，不是编程语言。' },
                    { question: '二进制数1010转换为十进制是？', options: ['8', '10', '12', '14'], correctAnswer: 'B', explanation: '1×8 + 0×4 + 1×2 + 0×1 = 10' }
                ],
                '填空题': [
                    { question: 'Python中定义函数使用关键字______', correctAnswer: 'def', explanation: 'def是Python中定义函数的关键字。' },
                    { question: 'SQL中查询语句的关键字是______', correctAnswer: 'SELECT', explanation: 'SELECT用于从数据库中查询数据。' }
                ],
                '编程题': [
                    { question: '编写一个Python函数，计算两个数的和。', correctAnswer: 'def add(a, b):\n    return a + b', explanation: '定义函数add，接受两个参数并返回它们的和。' }
                ]
            },
            '物理': {
                '选择题': [
                    { question: '光在真空中的传播速度约为？', options: ['3×10⁸ m/s', '3×10⁶ m/s', '3×10¹⁰ m/s', '3×10⁴ m/s'], correctAnswer: 'A', explanation: '光速约为3×10⁸米每秒。' }
                ],
                '填空题': [
                    { question: '牛顿第一定律又称为______定律', correctAnswer: '惯性', explanation: '牛顿第一定律描述了物体的惯性。' }
                ],
                '简答题': [
                    { question: '解释什么是重力加速度。', correctAnswer: '物体在重力作用下的加速度，约为9.8m/s²', explanation: '重力加速度是地球表面附近物体受重力作用产生的加速度。' }
                ]
            },
            '化学': {
                '选择题': [
                    { question: '水的化学分子式是？', options: ['H₂O', 'CO₂', 'NaCl', 'CH₄'], correctAnswer: 'A', explanation: '水由两个氢原子和一个氧原子组成。' }
                ],
                '填空题': [
                    { question: '氧气的化学符号是______', correctAnswer: 'O₂', explanation: '氧气分子由两个氧原子组成。' }
                ],
                '简答题': [
                    { question: '简述酸碱中和反应的特点。', correctAnswer: '酸和碱反应生成盐和水', explanation: '酸碱中和是化学中的重要反应类型。' }
                ]
            }
        };

        const currentSubjectTemplates = questionTemplates[subjectName] || questionTemplates['数学'];
        const questions = [];
        let questionIndex = 1;

        questionTypes.forEach(type => {
            const typeTemplates = currentSubjectTemplates[type] || currentSubjectTemplates['选择题'];
            const questionsToAdd = Math.ceil(questionCount / questionTypes.length);

            for (let i = 0; i < questionsToAdd && questions.length < questionCount; i++) {
                const template = typeTemplates[i % typeTemplates.length];

                // 根据难度和焦点领域调整题目
                let adjustedQuestion = this.adjustQuestionByDifficulty(template.question, difficulty, subjectName);
                if (focusAreas && focusAreas.length > 0) {
                    adjustedQuestion = this.adjustQuestionByFocus(adjustedQuestion, focusAreas, subjectName);
                }

                questions.push({
                    questionNumber: questionIndex++,
                    type: type,
                    question: adjustedQuestion,
                    options: template.options || [],
                    correctAnswer: template.correctAnswer,
                    points: this.getPointsByType(type),
                    explanation: template.explanation,
                    difficulty: difficulty,
                    estimatedTime: Math.ceil(duration / questionCount)
                });
            }
        });

        return {
            title,
            description,
            subject: subjectName,
            difficulty,
            duration,
            totalQuestions: questions.length,
            questions,
            focusAreas,
            generatedBy: 'Local Mock System',
            generatedAt: new Date().toISOString()
        };
    }

    // 根据难度调整题目内容
    adjustQuestionByDifficulty(question, difficulty, subject) {
        const difficultyPrefixes = {
            '初级': '【基础】',
            '中级': '【进阶】',
            '高级': '【挑战】'
        };

        const prefix = difficultyPrefixes[difficulty] || '';
        return prefix + question;
    }

    // 根据焦点领域调整题目内容
    adjustQuestionByFocus(question, focusAreas, subject) {
        // 简单的焦点调整逻辑
        if (focusAreas.includes('基础概念')) {
            return question.replace('下列', '关于基础概念，下列');
        }
        if (focusAreas.includes('实际应用')) {
            return question.replace('下列', '在实际应用中，下列');
        }
        if (focusAreas.includes('问题分析')) {
            return question.replace('下列', '分析以下问题，下列');
        }
        if (focusAreas.includes('代码实现')) {
            return question.replace('下列', '在代码实现中，下列');
        }
        return question;
    }

    // 测试Dify云服务连接
    async testConnection() {
        try {
            console.log('测试Dify云服务连接...');
            console.log(`API URL: ${this.baseURL}`);
            console.log(`API Key: ${this.apiKey.substring(0, 10)}...`);

            // 根据Dify官方文档的正确格式
            const response = await this.callDifyAPI('/chat-messages', {
                inputs: {},  // 空的inputs对象
                query: '你好，这是一个连接测试',
                response_mode: 'blocking',
                user: 'test_user'
                // 不传conversation_id，让系统自动生成
            });

            console.log('Dify云服务连接成功！');
            return {
                success: true,
                message: 'Dify云服务连接正常',
                response: response
            };
        } catch (error) {
            console.error('Dify云服务连接失败:', error.message);
            return {
                success: false,
                message: `Dify云服务连接失败: ${error.message}`,
                error: error
            };
        }
    }

    // 获取服务状态
    getServiceInfo() {
        return {
            serviceType: 'Dify云服务',
            apiUrl: this.baseURL,
            apiKey: this.apiKey ? `${this.apiKey.substring(0, 10)}...` : '未配置',
            timeout: this.timeout,
            status: this.apiKey ? '已配置' : '未配置'
        };
    }

    // 生成实训练习
    async generatePracticalExercise(inputData) {
        const {
            subject_name,
            teacher_name,
            exercise_title,
            exercise_description,
            courseware_title,
            courseware_content,
            difficulty,
            question_count,
            question_types,
            duration,
            focus_areas,
            target_skills,
            exercise_type
        } = inputData;

        // 构建实训练习生成的提示词
        const systemPrompt = `你是一名专业的${subject_name}实训指导教师，擅长设计高质量的实训练习。请根据以下要求生成实训练习内容：

课件信息：
- 课件标题：${courseware_title}
- 课件内容：${courseware_content}

实训要求：
- 练习标题：${exercise_title}
- 练习描述：${exercise_description}
- 难度等级：${difficulty}
- 题目数量：${question_count}题
- 题目类型：${question_types.join('、')}
- 练习时长：${duration}分钟
- 关注领域：${focus_areas.join('、')}
- 目标技能：${target_skills.join('、')}
- 实训类型：${exercise_type}

请生成结构化的实训练习，包含：
1. 题目描述和要求
2. 实训步骤和预期输出
3. 参考答案和实现方案
4. 评分标准
5. 知识点说明
6. 环境要求
7. 代码模板（如果是编程题）

请确保实训内容贴近实际应用，具有较强的实践性和操作性。`;

        // 首先检查基本配置
        if (!this.baseURL || !this.apiKey) {
            console.warn('Dify配置不完整，直接使用模拟数据生成');
            return this.generateMockPracticalExerciseResponse(inputData);
        }

        try {
            console.log('开始调用Dify生成实训练习...');

            // 直接尝试调用API，不依赖健康检查
            // 因为课件生成是成功的，说明Dify服务实际上是可用的

            // 调用Dify API，使用更长的超时时间
            const originalTimeout = this.timeout;
            this.timeout = this.practicalExerciseTimeout; // 使用120秒超时

            try {
                console.log('准备调用Dify API生成实训练习...');
                console.log(`API URL: ${this.baseURL}/chat-messages`);
                console.log(`超时设置: ${this.timeout}ms`);

                const response = await this.callDifyAPI('/chat-messages', {
                    inputs: inputData,
                    query: systemPrompt,
                    response_mode: 'blocking',
                    conversation_id: '',
                    user: teacher_name || 'teacher'
                });

                // 恢复原始超时设置
                this.timeout = originalTimeout;

                console.log('Dify实训练习生成响应:', response);

            if (response && response.answer) {
                // 解析Dify返回的实训练习内容
                const exerciseContent = this.parsePracticalExerciseContent(response.answer, {
                    title: exercise_title,
                    description: exercise_description,
                    subject: subject_name,
                    difficulty,
                    duration,
                    questionCount: question_count,
                    questionTypes: question_types,
                    focusAreas: focus_areas,
                    targetSkills: target_skills,
                    exerciseType: exercise_type
                });

                return {
                    success: true,
                    data: exerciseContent,
                    source: 'dify',
                    conversation_id: response.conversation_id
                };
            } else {
                throw new Error('Dify返回的响应格式不正确');
            }

            } catch (apiError) {
                // 恢复原始超时设置
                this.timeout = originalTimeout;
                throw apiError;
            }

        } catch (error) {
            console.error('Dify实训练习生成失败:', error);
            console.log('Dify调用失败，使用本地模拟数据生成实训练习...');
            return this.generateMockPracticalExerciseResponse(inputData);
        }
    }

    // 生成模拟实训练习响应的统一方法
    generateMockPracticalExerciseResponse(inputData) {
        const {
            subject_name,
            exercise_title,
            exercise_description,
            difficulty,
            question_count,
            question_types,
            duration,
            focus_areas,
            target_skills,
            exercise_type
        } = inputData;

        const mockExercise = this.generateMockPracticalExerciseContent({
            subjectName: subject_name,
            title: exercise_title,
            description: exercise_description,
            difficulty,
            questionCount: question_count,
            questionTypes: question_types,
            duration,
            focusAreas: focus_areas,
            targetSkills: target_skills,
            exerciseType: exercise_type
        });

        return {
            success: true,
            data: mockExercise,
            source: 'mock',
            note: 'Dify服务不可用，使用本地智能生成系统'
        };
    }

    // 解析Dify返回的实训练习内容
    parsePracticalExerciseContent(content, metadata) {
        try {
            // 尝试解析JSON格式
            console.log('尝试解析JSON格式的实训练习内容...');
            console.log('原始内容长度:', content.length);
            console.log('内容前500字符:', content.substring(0, 500));
            const parsed = JSON.parse(content);
            console.log('JSON解析成功，检测到的顶级字段:', Object.keys(parsed));

            // 支持多种JSON结构
            let questions = null;
            let exerciseInfo = {};

            // 结构1: 直接的questions数组
            if (parsed.questions && Array.isArray(parsed.questions)) {
                questions = parsed.questions;
            }
            // 结构2: Dify返回的嵌套结构 {"实训练习": {"题目列表": [...]}}
            else if (parsed.实训练习 && parsed.实训练习.题目列表 && Array.isArray(parsed.实训练习.题目列表)) {
                questions = parsed.实训练习.题目列表;
                exerciseInfo = parsed.实训练习.练习信息 || {};
                console.log('检测到Dify嵌套JSON结构，成功提取题目列表');
            }
            // 结构3: 其他可能的结构
            else if (parsed.题目列表 && Array.isArray(parsed.题目列表)) {
                questions = parsed.题目列表;
            }
            // 结构4: 新的Dify响应格式 - 题目详情数组
            else if (parsed.题目详情 && Array.isArray(parsed.题目详情)) {
                questions = parsed.题目详情;
                exerciseInfo = {
                    练习标题: parsed.练习标题,
                    练习描述: parsed.练习描述,
                    难度等级: parsed.难度等级,
                    题目数量: parsed.题目数量,
                    题目类型: parsed.题目类型,
                    练习时长: parsed.练习时长,
                    关注领域: parsed.关注领域,
                    目标技能: parsed.目标技能,
                    实训类型: parsed.实训类型
                };
                console.log('检测到新的Dify响应格式，成功提取题目详情');
            }

            if (questions && questions.length > 0) {
                // 转换Dify格式的题目到标准格式
                const convertedQuestions = questions.map((q, index) => {
                    // 处理评分标准 - 支持数组格式
                    let gradingCriteria = [];
                    if (q.评分标准) {
                        if (Array.isArray(q.评分标准)) {
                            gradingCriteria = q.评分标准.map((criterion, index) => ({
                                criterion: criterion,
                                points: 25, // 默认分值
                                description: `评分标准${index + 1}`
                            }));
                        } else if (typeof q.评分标准 === 'object') {
                            gradingCriteria = Object.entries(q.评分标准).map(([criterion, points]) => ({
                                criterion,
                                points: typeof points === 'number' ? points : 10,
                                description: `${criterion}评分标准`
                            }));
                        }
                    }

                    return {
                        questionNumber: q.题目编号 || q.题号 || index + 1,
                        questionType: '实操题', // 默认类型
                        questionText: q.题目描述 || q.题目描述和要求 || q.questionText || '',
                        requirements: q.要求 ? (Array.isArray(q.要求) ? q.要求 : [q.要求]) :
                                     Array.isArray(q.实训步骤和预期输出) ?
                                     q.实训步骤和预期输出.map((step, i) => ({
                                         step: i + 1,
                                         description: step,
                                         expectedOutput: ''
                                     })) : [],
                        referenceAnswer: q.参考答案和实现方案 || q.referenceAnswer || '',
                        codeTemplate: {
                            language: 'python',
                            template: q.代码模板 || q.codeTemplate || '',
                            testCases: []
                        },
                        gradingCriteria: gradingCriteria,
                        explanation: q.知识点说明 || q.解析说明 || q.explanation || '',
                        points: q.分值 || 20,
                        estimatedTime: q.预计时间 || 30,
                        knowledgePoints: q.知识点说明 || q.knowledgePoints || [],
                        environmentRequirements: {
                            software: q.环境要求 || q.environmentRequirements || 'Python 3.7+',
                            hardware: '标准计算机配置',
                            network: '无特殊要求'
                        }
                    };
                });

                console.log(`JSON解析成功，转换了${convertedQuestions.length}道题目`);
                return {
                    ...metadata,
                    title: exerciseInfo.练习标题 || metadata.title,
                    description: exerciseInfo.练习描述 || metadata.description,
                    questions: convertedQuestions,
                    generatedBy: 'Dify AI (JSON解析)',
                    generatedAt: new Date().toISOString()
                };
            }
        } catch (e) {
            console.log('JSON解析失败，尝试文本解析...', e.message);
        }

        // 清理内容，移除<think>标签
        let cleanContent = content;
        if (content.includes('<think>')) {
            cleanContent = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
        }

        console.log('开始解析Dify实训练习Markdown格式内容...');

        // 解析实训练习题目
        const questions = this.parsePracticalExerciseQuestions(cleanContent, metadata);

        if (questions.length > 0) {
            console.log(`Dify实训练习解析成功，解析出${questions.length}道题目`);
            return {
                ...metadata,
                questions: questions,
                generatedBy: 'Dify AI (实训练习解析)',
                generatedAt: new Date().toISOString()
            };
        }

        // 如果解析失败，使用模拟数据
        console.log('实训练习解析失败，使用模拟数据...');
        return this.generateMockPracticalExerciseContent({
            subjectName: metadata.subject,
            title: metadata.title,
            description: metadata.description,
            difficulty: metadata.difficulty,
            questionCount: metadata.questionCount,
            questionTypes: metadata.questionTypes,
            duration: metadata.duration,
            focusAreas: metadata.focusAreas,
            targetSkills: metadata.targetSkills,
            exerciseType: metadata.exerciseType
        });
    }

    // 解析实训练习题目
    parsePracticalExerciseQuestions(content, metadata) {
        const questions = [];

        try {
            // 使用正则表达式匹配实训题目块
            const questionBlocks = content.split(/###\s*(?:实训题目|练习题目|题目)\s*\d+[：:]/);

            for (let i = 1; i < questionBlocks.length; i++) {
                const block = questionBlocks[i].trim();
                if (!block) continue;

                const question = this.parsePracticalQuestionBlock(block, i, metadata);
                if (question) {
                    questions.push(question);
                }
            }

            return questions;
        } catch (error) {
            console.error('实训练习Markdown解析错误:', error);
            return [];
        }
    }

    // 解析单个实训题目块
    parsePracticalQuestionBlock(block, questionNumber, metadata) {
        try {
            const lines = block.split('\n').filter(line => line.trim());

            let questionText = '';
            let requirements = [];
            let referenceAnswer = '';
            let explanation = '';
            let codeTemplate = null;
            let gradingCriteria = [];
            let environmentRequirements = {};

            let currentSection = 'question';

            for (let line of lines) {
                line = line.trim();

                if (!line || line.startsWith('---')) continue;

                // 识别不同部分
                if (line.includes('实训要求') || line.includes('操作步骤')) {
                    currentSection = 'requirements';
                    continue;
                } else if (line.includes('参考答案') || line.includes('实现方案')) {
                    currentSection = 'answer';
                    continue;
                } else if (line.includes('评分标准')) {
                    currentSection = 'grading';
                    continue;
                } else if (line.includes('代码模板')) {
                    currentSection = 'code';
                    continue;
                } else if (line.includes('环境要求')) {
                    currentSection = 'environment';
                    continue;
                } else if (line.includes('解析') || line.includes('说明')) {
                    currentSection = 'explanation';
                    continue;
                }

                // 根据当前部分处理内容
                switch (currentSection) {
                    case 'question':
                        if (!questionText) questionText = line;
                        break;
                    case 'requirements':
                        if (line.match(/^\d+[\.\)]/)) {
                            requirements.push({
                                step: requirements.length + 1,
                                description: line.replace(/^\d+[\.\)]\s*/, ''),
                                expectedOutput: ''
                            });
                        }
                        break;
                    case 'answer':
                        referenceAnswer += (referenceAnswer ? '\n' : '') + line;
                        break;
                    case 'explanation':
                        explanation += (explanation ? '\n' : '') + line;
                        break;
                }
            }

            // 验证必要字段
            if (!questionText) {
                console.warn(`实训题目${questionNumber}解析不完整`);
                return null;
            }

            return {
                questionNumber: questionNumber,
                type: metadata.questionTypes[0] || '实操题',
                question: questionText,
                requirements: requirements,
                referenceAnswer: referenceAnswer || '请根据实训要求完成相应操作',
                codeTemplate: codeTemplate,
                gradingCriteria: gradingCriteria,
                explanation: explanation || '本题考查实际操作能力和问题解决能力',
                difficulty: metadata.difficulty,
                points: 20,
                estimatedTime: Math.ceil(metadata.duration / metadata.questionCount),
                knowledgePoints: metadata.focusAreas || [],
                environmentRequirements: environmentRequirements
            };

        } catch (error) {
            console.error(`解析实训题目${questionNumber}时出错:`, error);
            return null;
        }
    }

    // 生成模拟实训练习内容
    generateMockPracticalExerciseContent(params) {
        const { subjectName, title, description, difficulty, questionCount, questionTypes, duration, targetSkills } = params;

        // 确保description不为空
        const safeDescription = description && description.trim() !== ''
            ? description
            : `这是一个${difficulty}级别的${subjectName}实训练习，包含${questionCount}道${questionTypes.join('、')}题目，预计完成时间${duration}分钟。通过本次实训，学生将掌握${targetSkills ? targetSkills.join('、') : '相关技能'}。`;

        // 实训题目模板
        const practicalTemplates = {
            '计算机科学': {
                '实操题': [
                    {
                        question: '设计并实现一个简单的学生信息管理系统界面',
                        requirements: [
                            { step: 1, description: '创建学生信息录入表单', expectedOutput: '包含姓名、学号、专业等字段的表单' },
                            { step: 2, description: '实现数据验证功能', expectedOutput: '输入格式验证和错误提示' },
                            { step: 3, description: '添加学生信息显示列表', expectedOutput: '以表格形式显示学生信息' }
                        ],
                        referenceAnswer: '完整的学生信息管理界面，包含表单录入、数据验证和信息展示功能',
                        explanation: '本题考查前端界面设计、表单处理和数据展示的综合能力'
                    }
                ],
                '编程题': [
                    {
                        question: '实现一个图书管理系统的核心功能模块',
                        requirements: [
                            { step: 1, description: '设计图书类和借阅记录类', expectedOutput: '完整的类结构定义' },
                            { step: 2, description: '实现图书的增删改查功能', expectedOutput: '基本的CRUD操作' },
                            { step: 3, description: '实现借阅和归还功能', expectedOutput: '借阅状态管理' }
                        ],
                        codeTemplate: {
                            language: 'python',
                            template: 'class Book:\n    def __init__(self, isbn, title, author):\n        # TODO: 实现图书类初始化\n        pass\n\nclass Library:\n    def __init__(self):\n        # TODO: 实现图书馆类初始化\n        pass',
                            testCases: [
                                { input: 'Book("978-0134685991", "Effective Java", "Joshua Bloch")', expectedOutput: '图书对象创建成功', description: '测试图书对象创建' }
                            ]
                        },
                        referenceAnswer: '完整的图书管理系统实现，包含图书管理和借阅管理功能',
                        explanation: '本题考查面向对象设计、数据结构应用和业务逻辑实现能力'
                    }
                ],
                '项目实战': [
                    {
                        question: '开发一个简单的在线购物车功能',
                        requirements: [
                            { step: 1, description: '设计商品展示页面', expectedOutput: '商品列表和详情展示' },
                            { step: 2, description: '实现购物车添加/删除功能', expectedOutput: '购物车状态管理' },
                            { step: 3, description: '实现订单结算功能', expectedOutput: '价格计算和订单生成' }
                        ],
                        referenceAnswer: '完整的购物车系统，包含商品管理、购物车操作和订单处理',
                        explanation: '本题考查Web开发的综合应用能力，包括前后端交互和业务流程设计'
                    }
                ]
            }
        };

        const templates = practicalTemplates[subjectName] || practicalTemplates['计算机科学'];
        const questions = [];

        questionTypes.forEach(type => {
            const typeTemplates = templates[type] || templates['实操题'];
            const questionsToAdd = Math.ceil(questionCount / questionTypes.length);

            for (let i = 0; i < questionsToAdd && questions.length < questionCount; i++) {
                const template = typeTemplates[i % typeTemplates.length];
                questions.push({
                    ...template,
                    type: type,
                    difficulty: difficulty,
                    points: type === '编程题' ? 30 : (type === '项目实战' ? 40 : 20),
                    estimatedTime: Math.ceil(duration / questionCount),
                    knowledgePoints: targetSkills || ['实践操作'],
                    environmentRequirements: {
                        software: type === '编程题' ? ['Python 3.8+', 'IDE'] : ['浏览器', '开发环境'],
                        hardware: ['计算机'],
                        platforms: ['Windows/Mac/Linux']
                    }
                });
            }
        });

        return {
            title,
            description: safeDescription,
            questions,
            totalQuestions: questions.length,
            generatedBy: 'Local Mock System',
            generatedAt: new Date().toISOString()
        };
    }
}

module.exports = new DifyService();
