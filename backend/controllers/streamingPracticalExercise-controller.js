const PracticalExercise = require('../models/practicalExerciseSchema');
const Courseware = require('../models/coursewareSchema');
const Teacher = require('../models/teacherSchema');
const Subject = require('../models/subjectSchema');
const difyService = require('../services/difyService');
const AIResponseParser = require('../utils/aiResponseParser');

/**
 * SSE 流式实训练习生成
 */
const streamGeneratePracticalExercise = async (req, res) => {
    const {
        title,
        description,
        coursewareId,
        difficulty,
        questionCount,
        questionTypes,
        duration,
        focusAreas,
        targetSkills,
        exerciseType
    } = req.body;

    const { teacherId } = req.params;

    // 设置 SSE 响应头
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
        'X-Accel-Buffering': 'no'
    });

    const sendSSE = (type, data) => {
        if (res.writableEnded) return;
        res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
    };

    sendSSE('connected', { message: 'SSE连接已建立' });

    try {
        // 验证教师
        sendSSE('progress', { message: '正在验证教师信息...' });

        const teacher = await Teacher.findById(teacherId).populate('teachSubject');
        if (!teacher) {
            sendSSE('error', { message: '教师不存在' });
            res.end();
            return;
        }

        // 验证课件
        sendSSE('progress', { message: '正在验证课件信息...' });

        const courseware = await Courseware.findById(coursewareId);
        if (!courseware) {
            sendSSE('error', { message: '课件不存在' });
            res.end();
            return;
        }

        const subject = teacher.teachSubject;
        if (!subject) {
            sendSSE('error', { message: '教师学科信息不存在' });
            res.end();
            return;
        }

        // 提取课件内容
        let coursewareContent = '';
        if (courseware.teachingContent && courseware.teachingContent.lectures) {
            coursewareContent = courseware.teachingContent.lectures
                .map(lecture => `${lecture.title}: ${lecture.content}`)
                .join('\n');
        }

        sendSSE('progress', { message: '验证通过，开始AI生成实训练习...' });

        // 构建 Dify 输入
        const difyInput = {
            subject_name: subject.subName,
            teacher_name: teacher.name,
            exercise_title: title,
            exercise_description: description,
            courseware_title: courseware.title,
            courseware_content: coursewareContent,
            difficulty,
            question_count: questionCount,
            question_types: questionTypes,
            duration,
            focus_areas: focusAreas,
            target_skills: targetSkills,
            exercise_type: exerciseType
        };

        let fullContent = '';

        const onChunk = (chunk) => {
            if (chunk && chunk.trim()) {
                fullContent += chunk;
                sendSSE('chunk', { content: chunk });
            }
        };

        const onComplete = async (result) => {
            try {
                const rawResponse = result.fullContent || fullContent;
                sendSSE('progress', { message: 'AI生成完成，正在解析并保存...' });

                // 使用多元化解析器
                let aiGeneratedExercise;
                let dataSource = 'dify';

                const parseResult = AIResponseParser.parsePracticalExercise(rawResponse);
                if (parseResult.success) {
                    aiGeneratedExercise = parseResult.data;
                    dataSource = 'dify_parsed';
                } else {
                    // 尝试直接 JSON 解析
                    try {
                        aiGeneratedExercise = JSON.parse(rawResponse);
                        dataSource = 'dify';
                    } catch (e) {
                        sendSSE('error', { message: 'AI返回内容解析失败' });
                        res.end();
                        return;
                    }
                }

                // 转换题目格式（复用 practical-exercise-controller 的逻辑）
                const convertedQuestions = (aiGeneratedExercise.questions || []).map((q, index) => {
                    let explanationText = '';
                    if (q.explanation) {
                        explanationText = Array.isArray(q.explanation)
                            ? q.explanation.join('、')
                            : String(q.explanation);
                    } else {
                        explanationText = '本题考查实际操作能力和问题解决能力';
                    }

                    let knowledgePointsArray = [];
                    if (q.knowledgePoints) {
                        knowledgePointsArray = Array.isArray(q.knowledgePoints)
                            ? q.knowledgePoints.map(point => String(point))
                            : [String(q.knowledgePoints)];
                    } else {
                        knowledgePointsArray = ['基础概念', '实际操作'];
                    }

                    return {
                        questionNumber: q.questionNumber || index + 1,
                        questionType: q.type || q.questionType || '实操题',
                        questionText: String(q.question || q.questionText || ''),
                        requirements: Array.isArray(q.requirements) ? q.requirements : [],
                        referenceAnswer: String(q.referenceAnswer || q.answer || ''),
                        codeTemplate: q.codeTemplate || null,
                        gradingCriteria: Array.isArray(q.gradingCriteria) ? q.gradingCriteria : [],
                        explanation: explanationText,
                        difficulty: String(q.difficulty || difficulty),
                        points: Number(q.points || 20),
                        estimatedTime: Number(q.estimatedTime || Math.floor(duration / questionCount)),
                        knowledgePoints: knowledgePointsArray,
                        environmentRequirements: q.environmentRequirements || {
                            software: ['Python 3.x'],
                            hardware: ['标准计算机配置'],
                            platforms: ['Windows', 'macOS', 'Linux']
                        }
                    };
                });

                const totalPoints = convertedQuestions.reduce((sum, q) => sum + (q.points || 0), 0) || 100;

                const safeTitle = title && title.trim() !== '' ? title : `${subject.subName}实训练习`;
                const safeDescription = description && description.trim() !== ''
                    ? description
                    : `这是一个${difficulty}级别的${subject.subName}实训练习，包含${questionCount}道${Array.isArray(questionTypes) ? questionTypes.join('、') : questionTypes}题目，预计完成时间${duration}分钟。`;

                // 创建实训练习记录
                const practicalExercise = new PracticalExercise({
                    title: safeTitle,
                    description: safeDescription,
                    courseware: coursewareId,
                    teacher: teacherId,
                    subject: subject._id,
                    school: teacher.school,
                    questions: convertedQuestions,
                    totalPoints,
                    duration,
                    difficulty,
                    exerciseType,
                    targetSkills: targetSkills || [],
                    isAIGenerated: true,
                    generationParams: {
                        basedOnCourseware: coursewareId,
                        difficulty,
                        questionCount,
                        questionTypes,
                        focusAreas,
                        dataSource
                    },
                    status: '草稿'
                });

                const savedExercise = await practicalExercise.save();

                sendSSE('complete', {
                    exercise: savedExercise,
                    dataSource
                });
                res.end();
            } catch (saveError) {
                console.error('实训练习保存失败:', saveError);
                sendSSE('error', { message: '实训练习保存失败：' + saveError.message });
                res.end();
            }
        };

        const onError = (error) => {
            console.error('流式实训练习生成错误:', error);
            if (res.writableEnded) return;
            sendSSE('error', { message: error.message || 'AI生成过程中发生错误' });
            res.end();
        };

        // 直接调用 difyService 流式方法（不使用 smartDifyWrapper，因为重试机制与 SSE 不兼容）
        await difyService.generatePracticalExerciseStream(difyInput, onChunk, onComplete, onError);

    } catch (error) {
        console.error('SSE实训练习生成错误:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: '流式实训练习生成初始化失败' });
        } else {
            sendSSE('error', { message: '服务器错误：' + error.message });
            res.end();
        }
    }
};

module.exports = { streamGeneratePracticalExercise };
