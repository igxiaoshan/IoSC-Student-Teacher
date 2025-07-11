const difyService = require('../services/difyService');

/**
 * 教师端AI功能控制器
 */

/**
 * 智能备课设计
 */
const generateLessonPlan = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const {
            courseName,
            syllabus,
            duration,
            studentLevel,
            objectives,
            subject,
            specialRequirements
        } = req.body;

        console.log(`[Teacher AI] 智能备课请求 - 教师${teacherId}:`, {
            courseName,
            subject,
            duration,
            timestamp: new Date().toISOString()
        });

        // 调用Dify服务生成教学计划
        const lessonPlan = await difyService.generateLessonPlan({
            teacherId,
            courseName,
            syllabus,
            duration,
            studentLevel,
            objectives,
            subject,
            specialRequirements
        });

        console.log(`[Teacher AI] 备课生成成功 - 教师${teacherId}`);

        res.json({
            success: true,
            message: '教学计划生成成功',
            data: {
                lessonPlan: lessonPlan.answer || lessonPlan,
                conversationId: lessonPlan.conversation_id,
                metadata: {
                    courseName,
                    subject,
                    duration,
                    generatedAt: new Date().toISOString()
                }
            }
        });

    } catch (error) {
        console.error('[Teacher AI] 备课生成错误:', error);
        res.status(500).json({
            success: false,
            message: '教学计划生成失败',
            error: error.message
        });
    }
};

/**
 * 考核内容生成
 */
const generateExamContent = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const {
            teachingContent,
            examType,
            questionCount,
            difficulty,
            subject,
            specialRequirements
        } = req.body;

        console.log(`[Teacher AI] 考核生成请求 - 教师${teacherId}:`, {
            examType,
            questionCount,
            difficulty,
            subject,
            timestamp: new Date().toISOString()
        });

        // 调用Dify服务生成考核内容
        const examContent = await difyService.generateExamContent({
            teacherId,
            teachingContent,
            examType,
            questionCount,
            difficulty,
            subject,
            specialRequirements
        });

        console.log(`[Teacher AI] 考核生成成功 - 教师${teacherId}`);

        res.json({
            success: true,
            message: '考核内容生成成功',
            data: {
                examContent: examContent.answer || examContent,
                conversationId: examContent.conversation_id,
                metadata: {
                    examType,
                    questionCount,
                    difficulty,
                    subject,
                    generatedAt: new Date().toISOString()
                }
            }
        });

    } catch (error) {
        console.error('[Teacher AI] 考核生成错误:', error);
        res.status(500).json({
            success: false,
            message: '考核内容生成失败',
            error: error.message
        });
    }
};

/**
 * 学情数据分析
 */
const analyzeStudentPerformance = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const {
            questions,
            studentAnswers,
            correctAnswers,
            classStats,
            subject,
            analysisType
        } = req.body;

        console.log(`[Teacher AI] 学情分析请求 - 教师${teacherId}:`, {
            questionsCount: questions?.length,
            studentsCount: studentAnswers?.length,
            subject,
            analysisType,
            timestamp: new Date().toISOString()
        });

        // 调用Dify服务进行学情分析
        const analysis = await difyService.analyzeStudentPerformance({
            teacherId,
            questions,
            studentAnswers,
            correctAnswers,
            classStats,
            subject,
            analysisType
        });

        console.log(`[Teacher AI] 学情分析成功 - 教师${teacherId}`);

        res.json({
            success: true,
            message: '学情分析完成',
            data: {
                analysis: analysis.answer || analysis,
                conversationId: analysis.conversation_id,
                metadata: {
                    questionsAnalyzed: questions?.length || 0,
                    studentsAnalyzed: studentAnswers?.length || 0,
                    subject,
                    analysisType,
                    analyzedAt: new Date().toISOString()
                }
            }
        });

    } catch (error) {
        console.error('[Teacher AI] 学情分析错误:', error);
        res.status(500).json({
            success: false,
            message: '学情分析失败',
            error: error.message
        });
    }
};

/**
 * 流式备课设计
 */
const streamLessonPlan = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const lessonData = req.body;

        console.log(`[Teacher AI] 流式备课请求 - 教师${teacherId}`);

        // 设置SSE响应头
        res.writeHead(200, {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        });

        let fullResponse = '';

        // 调用Dify流式服务
        await difyService.sendStreamingMessage(
            'teacher-lesson-planning',
            {
                query: `请基于以下课程信息设计教学内容：
课程名称：${lessonData.courseName}
课程大纲：${lessonData.syllabus}
学时安排：${lessonData.duration}小时
学生水平：${lessonData.studentLevel}
教学目标：${lessonData.objectives}`,
                inputs: lessonData,
                user: teacherId
            },
            // onData
            (data) => {
                if (data.event === 'message') {
                    const content = data.answer || '';
                    fullResponse += content;
                    
                    res.write(`data: ${JSON.stringify({
                        type: 'content',
                        content: content,
                        fullContent: fullResponse
                    })}\n\n`);
                } else if (data.event === 'message_end') {
                    res.write(`data: ${JSON.stringify({
                        type: 'end',
                        fullContent: fullResponse,
                        conversationId: data.conversation_id
                    })}\n\n`);
                }
            },
            // onEnd
            () => {
                console.log(`[Teacher AI] 流式备课完成 - 教师${teacherId}`);
                res.end();
            },
            // onError
            (error) => {
                console.error(`[Teacher AI] 流式备课错误 - 教师${teacherId}:`, error);
                res.write(`data: ${JSON.stringify({
                    type: 'error',
                    error: error.message
                })}\n\n`);
                res.end();
            }
        );

    } catch (error) {
        console.error('[Teacher AI] 流式备课错误:', error);
        res.write(`data: ${JSON.stringify({
            type: 'error',
            error: error.message
        })}\n\n`);
        res.end();
    }
};

/**
 * 流式考核生成
 */
const streamExamGeneration = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const examData = req.body;

        console.log(`[Teacher AI] 流式考核生成请求 - 教师${teacherId}`);

        // 设置SSE响应头
        res.writeHead(200, {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        });

        let fullResponse = '';

        // 调用Dify流式服务
        await difyService.sendStreamingMessage(
            'teacher-exam-generation',
            {
                query: `请基于以下要求生成考核内容：
教学内容：${examData.teachingContent}
考核类型：${examData.examType}
题目数量：${examData.questionCount}
难度等级：${examData.difficulty}
学科领域：${examData.subject}`,
                inputs: examData,
                user: teacherId
            },
            // onData
            (data) => {
                if (data.event === 'message') {
                    const content = data.answer || '';
                    fullResponse += content;
                    
                    res.write(`data: ${JSON.stringify({
                        type: 'content',
                        content: content,
                        fullContent: fullResponse
                    })}\n\n`);
                } else if (data.event === 'message_end') {
                    res.write(`data: ${JSON.stringify({
                        type: 'end',
                        fullContent: fullResponse,
                        conversationId: data.conversation_id
                    })}\n\n`);
                }
            },
            // onEnd
            () => {
                console.log(`[Teacher AI] 流式考核生成完成 - 教师${teacherId}`);
                res.end();
            },
            // onError
            (error) => {
                console.error(`[Teacher AI] 流式考核生成错误 - 教师${teacherId}:`, error);
                res.write(`data: ${JSON.stringify({
                    type: 'error',
                    error: error.message
                })}\n\n`);
                res.end();
            }
        );

    } catch (error) {
        console.error('[Teacher AI] 流式考核生成错误:', error);
        res.write(`data: ${JSON.stringify({
            type: 'error',
            error: error.message
        })}\n\n`);
        res.end();
    }
};

module.exports = {
    generateLessonPlan,
    generateExamContent,
    analyzeStudentPerformance,
    streamLessonPlan,
    streamExamGeneration
};
