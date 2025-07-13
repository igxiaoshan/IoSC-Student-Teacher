const axios = require('axios');

class DifyService {
    constructor() {
        this.baseURL = process.env.DIFY_API_URL ;
        this.apiKey = process.env.DIFY_API_KEY ;
        this.timeout = 60000; // 60秒超时，云服务可能需要更长时间
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

            // 实现重试机制
            let lastError;
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    console.log(`尝试第 ${attempt} 次调用...`);
                    const response = await axios(config);

                    console.log(`API响应状态: ${response.status}`);
                    console.log(`API响应数据:`, JSON.stringify(response.data, null, 2));

                    return response.data;
                } catch (error) {
                    lastError = error;
                    console.log(`第 ${attempt} 次尝试失败:`, error.message);

                    if (attempt < 3) {
                        const delay = 1000 * attempt; // 递增延迟
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
}

module.exports = new DifyService();
