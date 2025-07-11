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
