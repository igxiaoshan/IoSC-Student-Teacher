const { v4: uuidv4 } = require('uuid');

class AIResponseParser {
    /**
     * 解析教学计划响应
     * @param {string} response - AI响应文本
     * @returns {Object} 解析后的教学计划对象
     */
    static parseLessonPlan(response) {
        try {
            const parsed = JSON.parse(response);
            
            return {
                success: true,
                data: {
                    title: parsed.title || '未命名教学计划',
                    description: parsed.description || '',
                    duration: parsed.duration || 45,
                    activities: this.validateActivities(parsed.activities || []),
                    knowledgePoints: this.validateKnowledgePoints(parsed.knowledgePoints || []),
                    practicalExercises: this.validatePracticalExercises(parsed.practicalExercises || []),
                    timeDistribution: parsed.timeDistribution || {},
                    teachingMethods: parsed.teachingMethods || [],
                    assessmentMethods: parsed.assessmentMethods || [],
                    resources: parsed.resources || [],
                    aiGenerated: true,
                    generatedAt: new Date()
                }
            };
        } catch (error) {
            return this.parseUnstructuredLessonPlan(response);
        }
    }

    /**
     * 解析非结构化的教学计划响应
     */
    static parseUnstructuredLessonPlan(response) {
        const sections = this.extractSections(response);
        
        return {
            success: true,
            data: {
                title: sections.title || '教学计划',
                description: sections.description || response.substring(0, 200),
                activities: this.extractActivitiesFromText(sections.activities || ''),
                knowledgePoints: this.extractKnowledgePointsFromText(sections.knowledge || ''),
                practicalExercises: this.extractExercisesFromText(sections.exercises || ''),
                rawContent: response,
                aiGenerated: true,
                generatedAt: new Date(),
                needsReview: true
            }
        };
    }

    /**
     * 解析题目生成响应
     */
    static parseQuestions(response) {
        try {
            const parsed = JSON.parse(response);
            
            if (Array.isArray(parsed)) {
                return {
                    success: true,
                    data: parsed.map(q => this.validateQuestion(q))
                };
            } else if (parsed.questions && Array.isArray(parsed.questions)) {
                return {
                    success: true,
                    data: parsed.questions.map(q => this.validateQuestion(q))
                };
            }
            
            return { success: false, error: '无效的题目格式' };
        } catch (error) {
            return this.parseUnstructuredQuestions(response);
        }
    }

    /**
     * 解析答案分析响应
     */
    static parseAnswerAnalysis(response) {
        try {
            const parsed = JSON.parse(response);
            
            return {
                success: true,
                data: {
                    isCorrect: parsed.isCorrect || false,
                    score: parsed.score || 0,
                    maxScore: parsed.maxScore || 100,
                    feedback: parsed.feedback || '',
                    errorAnalysis: {
                        errorType: parsed.errorType || 'unknown',
                        errorLocation: parsed.errorLocation || '',
                        correctionSuggestion: parsed.correctionSuggestion || ''
                    },
                    suggestions: parsed.suggestions || [],
                    strengths: parsed.strengths || [],
                    areasForImprovement: parsed.areasForImprovement || [],
                    confidence: parsed.confidence || 0.8,
                    aiGenerated: true,
                    analyzedAt: new Date()
                }
            };
        } catch (error) {
            return this.parseUnstructuredAnalysis(response);
        }
    }

    /**
     * 解析个性化练习响应
     */
    static parsePersonalizedExercise(response) {
        try {
            const parsed = JSON.parse(response);
            
            return {
                success: true,
                data: {
                    exercises: (parsed.exercises || parsed).map(ex => ({
                        id: uuidv4(),
                        title: ex.title || '练习题',
                        content: ex.content || ex.question || '',
                        type: ex.type || 'multiple_choice',
                        difficulty: ex.difficulty || 'medium',
                        knowledgePoints: ex.knowledgePoints || [],
                        expectedTime: ex.expectedTime || 5,
                        hints: ex.hints || [],
                        solution: ex.solution || ex.answer || '',
                        explanation: ex.explanation || ''
                    })),
                    adaptiveSettings: parsed.adaptiveSettings || {},
                    learningPath: parsed.learningPath || [],
                    aiGenerated: true,
                    generatedAt: new Date()
                }
            };
        } catch (error) {
            return { success: false, error: '解析个性化练习失败', rawResponse: response };
        }
    }

    /**
     * 解析性能分析响应
     */
    static parsePerformanceAnalysis(response) {
        try {
            const parsed = JSON.parse(response);

            return {
                success: true,
                data: {
                    summary: parsed.summary || {},
                    trends: parsed.trends || {},
                    strengths: parsed.strengths || [],
                    weaknesses: parsed.weaknesses || [],
                    recommendations: parsed.recommendations || [],
                    predictions: parsed.predictions || {},
                    insights: parsed.insights || [],
                    actionItems: parsed.actionItems || [],
                    confidenceLevel: parsed.confidenceLevel || 0.8,
                    aiGenerated: true,
                    analyzedAt: new Date()
                }
            };
        } catch (error) {
            return { success: false, error: '解析性能分析失败', rawResponse: response };
        }
    }

    /**
     * 解析实训练习响应 - 多元化解析方案
     */
    static parsePracticalExercise(response) {
        console.log('🔍 开始多元化解析实训练习响应...');

        try {
            // 方案1: 直接JSON解析
            const parsed = JSON.parse(response);
            console.log('✅ JSON解析成功');

            // 检测不同的响应格式
            let exerciseData = null;
            let questions = [];

            // 格式1: 标准格式 { exercises: [...] }
            if (parsed.exercises && Array.isArray(parsed.exercises)) {
                console.log('检测到标准exercises格式');
                exerciseData = parsed;
                questions = parsed.exercises;
            }
            // 格式2: Dify嵌套格式 { 实训练习: { 题目列表: [...] } }
            else if (parsed.实训练习 && parsed.实训练习.题目列表) {
                console.log('检测到Dify嵌套格式');
                exerciseData = parsed.实训练习;
                questions = parsed.实训练习.题目列表;
            }
            // 格式3: 直接题目数组 [...]
            else if (Array.isArray(parsed)) {
                console.log('检测到直接数组格式');
                questions = parsed;
                exerciseData = { questions: parsed };
            }
            // 格式4: 单层对象包含题目
            else if (parsed.题目列表 && Array.isArray(parsed.题目列表)) {
                console.log('检测到单层题目列表格式');
                exerciseData = parsed;
                questions = parsed.题目列表;
            }

            if (questions && questions.length > 0) {
                // 转换题目格式，处理类型转换问题
                const convertedQuestions = questions.map((q, index) => {
                    return this.convertPracticalQuestion(q, index);
                });

                console.log(`✅ 成功解析${convertedQuestions.length}道实训题目`);

                return {
                    success: true,
                    data: {
                        title: exerciseData.练习信息?.练习标题 || exerciseData.title || '实训练习',
                        description: exerciseData.练习信息?.练习描述 || exerciseData.description || '',
                        questions: convertedQuestions,
                        difficulty: exerciseData.练习信息?.难度等级 || exerciseData.difficulty || '中级',
                        duration: exerciseData.练习信息?.练习时长 || exerciseData.duration || 120,
                        targetSkills: exerciseData.练习信息?.目标技能 || exerciseData.targetSkills || [],
                        exerciseType: exerciseData.练习信息?.实训类型 || exerciseData.exerciseType || '综合实训',
                        aiGenerated: true,
                        generatedAt: new Date()
                    }
                };
            }

        } catch (jsonError) {
            console.log('JSON解析失败，尝试文本解析:', jsonError.message);

            // 方案2: 文本解析
            return this.parseUnstructuredPracticalExercise(response);
        }

        return { success: false, error: '无法解析实训练习响应', rawResponse: response };
    }

    /**
     * 转换实训题目格式，处理类型问题
     */
    static convertPracticalQuestion(q, index) {
        // 智能处理explanation字段
        let explanationText = '';
        if (q.知识点说明) {
            if (Array.isArray(q.知识点说明)) {
                explanationText = q.知识点说明.join('、');
            } else {
                explanationText = String(q.知识点说明);
            }
        } else if (q.解析说明) {
            if (Array.isArray(q.解析说明)) {
                explanationText = q.解析说明.join('、');
            } else {
                explanationText = String(q.解析说明);
            }
        } else if (q.explanation) {
            if (Array.isArray(q.explanation)) {
                explanationText = q.explanation.join('、');
            } else {
                explanationText = String(q.explanation);
            }
        } else {
            explanationText = '本题考查实际操作能力和问题解决能力';
        }

        // 智能处理knowledgePoints字段
        let knowledgePointsArray = [];
        if (q.知识点说明 && Array.isArray(q.知识点说明)) {
            knowledgePointsArray = q.知识点说明.map(point => String(point));
        } else if (q.knowledgePoints) {
            if (Array.isArray(q.knowledgePoints)) {
                knowledgePointsArray = q.knowledgePoints.map(point => String(point));
            } else {
                knowledgePointsArray = [String(q.knowledgePoints)];
            }
        } else {
            knowledgePointsArray = ['基础概念', '实际操作'];
        }

        // 处理评分标准
        let gradingCriteria = [];
        if (q.评分标准) {
            if (Array.isArray(q.评分标准)) {
                gradingCriteria = q.评分标准.map((criterion, idx) => ({
                    criterion: String(criterion),
                    points: 25,
                    description: `评分标准${idx + 1}`
                }));
            }
        }

        // 处理实训步骤
        let requirements = [];
        if (q.实训步骤和预期输出) {
            if (Array.isArray(q.实训步骤和预期输出)) {
                requirements = q.实训步骤和预期输出.map((step, idx) => ({
                    step: idx + 1,
                    description: String(step),
                    expectedOutput: ''
                }));
            }
        } else if (q.题目要求) {
            if (Array.isArray(q.题目要求)) {
                requirements = q.题目要求.map((req, idx) => ({
                    step: idx + 1,
                    description: String(req),
                    expectedOutput: ''
                }));
            }
        }

        return {
            questionNumber: q.题目编号 || index + 1,
            questionType: '实操题',
            questionText: String(q.题目描述 || q.questionText || ''),
            requirements: requirements,
            referenceAnswer: String(q.参考答案和实现方案 || q.referenceAnswer || ''),
            codeTemplate: {
                language: 'python',
                template: String(q.代码模板 || q.codeTemplate || ''),
                testCases: []
            },
            gradingCriteria: gradingCriteria,
            explanation: explanationText, // 确保是字符串
            difficulty: String(q.difficulty || '中级'),
            points: Number(q.分值 || q.points || 20),
            estimatedTime: Number(q.预计时间 || q.estimatedTime || 30),
            knowledgePoints: knowledgePointsArray, // 确保是字符串数组
            environmentRequirements: {
                software: String(q.环境要求 || q.environmentRequirements || 'Python 3.x'),
                hardware: '标准计算机配置',
                platforms: ['Windows', 'macOS', 'Linux']
            }
        };
    }

    /**
     * 解析非结构化实训练习文本
     */
    static parseUnstructuredPracticalExercise(response) {
        console.log('🔍 尝试文本解析实训练习...');

        try {
            // 简单的文本解析逻辑
            const questions = [];
            const lines = response.split('\n').filter(line => line.trim());

            let currentQuestion = null;
            let questionCount = 0;

            for (const line of lines) {
                const trimmedLine = line.trim();

                // 检测题目开始
                if (trimmedLine.match(/^(\d+[\.\)、]|题目\d+|练习\d+)/)) {
                    if (currentQuestion) {
                        questions.push(currentQuestion);
                    }

                    questionCount++;
                    currentQuestion = {
                        questionNumber: questionCount,
                        questionType: '实操题',
                        questionText: trimmedLine.replace(/^(\d+[\.\)、]|题目\d+|练习\d+)[：:]?\s*/, ''),
                        requirements: [],
                        referenceAnswer: '请根据题目要求完成相应操作',
                        explanation: '本题考查实际操作能力',
                        difficulty: '中级',
                        points: 20,
                        estimatedTime: 30,
                        knowledgePoints: ['基础概念'],
                        environmentRequirements: {
                            software: 'Python 3.x',
                            hardware: '标准计算机配置',
                            platforms: ['Windows', 'macOS', 'Linux']
                        }
                    };
                } else if (currentQuestion && trimmedLine) {
                    // 将其他内容添加到当前题目的描述中
                    if (currentQuestion.questionText.length < 200) {
                        currentQuestion.questionText += ' ' + trimmedLine;
                    }
                }
            }

            if (currentQuestion) {
                questions.push(currentQuestion);
            }

            if (questions.length > 0) {
                console.log(`✅ 文本解析成功，解析出${questions.length}道题目`);
                return {
                    success: true,
                    data: {
                        title: '实训练习',
                        description: '基于AI生成的实训练习',
                        questions: questions,
                        difficulty: '中级',
                        duration: questions.length * 30,
                        targetSkills: ['实际操作', '问题解决'],
                        exerciseType: '综合实训',
                        aiGenerated: true,
                        generatedAt: new Date()
                    }
                };
            }

        } catch (error) {
            console.error('文本解析失败:', error);
        }

        return { success: false, error: '文本解析失败', rawResponse: response };
    }

    // 辅助验证方法
    static validateActivities(activities) {
        return activities.map(activity => ({
            id: uuidv4(),
            title: activity.title || '教学活动',
            description: activity.description || '',
            type: activity.type || 'lecture',
            duration: Math.max(1, activity.duration || 10),
            materials: activity.materials || [],
            aiGenerated: activity.aiGenerated || true
        }));
    }

    static validateKnowledgePoints(knowledgePoints) {
        return knowledgePoints.map(kp => ({
            id: uuidv4(),
            title: kp.title || '知识点',
            content: kp.content || '',
            importance: kp.importance || 'medium',
            estimatedTime: Math.max(1, kp.estimatedTime || 5),
            teachingMethod: kp.teachingMethod || 'lecture',
            examples: kp.examples || []
        }));
    }

    static validatePracticalExercises(exercises) {
        return exercises.map(ex => ({
            id: uuidv4(),
            title: ex.title || '实训练习',
            description: ex.description || '',
            type: ex.type || 'problem_solving',
            difficulty: ex.difficulty || 'medium',
            estimatedTime: Math.max(1, ex.estimatedTime || 15),
            instructions: ex.instructions || '',
            expectedOutcome: ex.expectedOutcome || '',
            evaluationCriteria: ex.evaluationCriteria || []
        }));
    }

    static validateQuestion(question) {
        return {
            id: uuidv4(),
            title: question.title || '题目',
            content: question.content || question.question || '',
            type: question.type || 'multiple_choice',
            difficulty: question.difficulty || 'medium',
            points: Math.max(1, question.points || 1),
            options: question.options || [],
            correctAnswer: question.correctAnswer || question.answer || '',
            explanation: question.explanation || '',
            knowledgePoints: question.knowledgePoints || [],
            estimatedTime: Math.max(1, question.estimatedTime || 2),
            aiGenerated: true
        };
    }

    // 文本解析辅助方法
    static extractSections(text) {
        const sections = {};
        const lines = text.split('\n');
        let currentSection = 'general';
        let currentContent = [];

        for (const line of lines) {
            const trimmed = line.trim();
            if (this.isSectionHeader(trimmed)) {
                if (currentContent.length > 0) {
                    sections[currentSection] = currentContent.join('\n');
                }
                currentSection = this.getSectionName(trimmed);
                currentContent = [];
            } else if (trimmed) {
                currentContent.push(trimmed);
            }
        }

        if (currentContent.length > 0) {
            sections[currentSection] = currentContent.join('\n');
        }

        return sections;
    }

    static isSectionHeader(line) {
        const headers = ['教学目标', '知识点', '活动安排', '实训练习', '时间分配', '评估方式'];
        return headers.some(header => line.includes(header));
    }

    static getSectionName(line) {
        if (line.includes('知识点')) return 'knowledge';
        if (line.includes('活动')) return 'activities';
        if (line.includes('练习') || line.includes('实训')) return 'exercises';
        if (line.includes('时间')) return 'timing';
        return 'general';
    }

    static extractActivitiesFromText(text) {
        const activities = [];
        const lines = text.split('\n').filter(line => line.trim());
        
        lines.forEach((line, index) => {
            if (line.trim()) {
                activities.push({
                    id: uuidv4(),
                    title: `活动 ${index + 1}`,
                    description: line.trim(),
                    type: 'lecture',
                    duration: 10,
                    aiGenerated: true
                });
            }
        });

        return activities;
    }

    static extractKnowledgePointsFromText(text) {
        const points = [];
        const lines = text.split('\n').filter(line => line.trim());
        
        lines.forEach((line, index) => {
            if (line.trim()) {
                points.push({
                    id: uuidv4(),
                    title: `知识点 ${index + 1}`,
                    content: line.trim(),
                    importance: 'medium',
                    estimatedTime: 5
                });
            }
        });

        return points;
    }

    static extractExercisesFromText(text) {
        const exercises = [];
        const lines = text.split('\n').filter(line => line.trim());
        
        lines.forEach((line, index) => {
            if (line.trim()) {
                exercises.push({
                    id: uuidv4(),
                    title: `练习 ${index + 1}`,
                    description: line.trim(),
                    type: 'problem_solving',
                    difficulty: 'medium',
                    estimatedTime: 15
                });
            }
        });

        return exercises;
    }

    static parseUnstructuredQuestions(response) {
        // 简单的文本解析逻辑
        const questions = [];
        const sections = response.split(/\d+\.|题目\d+|Question\s*\d+/i);
        
        sections.forEach((section, index) => {
            if (section.trim() && index > 0) {
                questions.push({
                    id: uuidv4(),
                    title: `题目 ${index}`,
                    content: section.trim().substring(0, 500),
                    type: 'short_answer',
                    difficulty: 'medium',
                    points: 1,
                    aiGenerated: true,
                    needsReview: true
                });
            }
        });

        return {
            success: true,
            data: questions,
            needsReview: true
        };
    }

    static parseUnstructuredAnalysis(response) {
        return {
            success: true,
            data: {
                feedback: response,
                confidence: 0.6,
                aiGenerated: true,
                needsReview: true,
                analyzedAt: new Date()
            }
        };
    }
}

module.exports = AIResponseParser;
