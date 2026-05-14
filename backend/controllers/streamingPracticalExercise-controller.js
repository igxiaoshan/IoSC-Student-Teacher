const PracticalExercise = require('../models/practicalExerciseSchema');
const Courseware = require('../models/coursewareSchema');
const Teacher = require('../models/teacherSchema');
const Subject = require('../models/subjectSchema');
const difyService = require('../services/difyService');
const AIResponseParser = require('../utils/aiResponseParser');

// 难度等级映射（AI可能返回英文枚举）
const mapDifficulty = (val) => {
    const map = { 'EASY': '初级', 'MEDIUM': '中级', 'HARD': '高级', 'easy': '初级', 'medium': '中级', 'hard': '高级', '初级': '初级', '中级': '中级', '高级': '高级', '简单': '初级', '中等': '中级', '困难': '高级' };
    return map[val] || map[String(val).toLowerCase()] || '中级';
};

// 提取AI响应中的JSON内容（剥离代码块、前后说明文字等）
const extractJSON = (raw) => {
    if (!raw || typeof raw !== 'string') return raw;
    // 1. 提取 ```json ... ``` 代码块
    const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) return codeBlockMatch[1].trim();
    // 2. 提取最外层 { ... } 或 [ ... ]
    const curlyMatch = raw.match(/\{[\s\S]*\}/);
    if (curlyMatch) return curlyMatch[0];
    const bracketMatch = raw.match(/\[[\s\S]*\]/);
    if (bracketMatch) return bracketMatch[0];
    // 3. 原样返回
    return raw.trim();
};

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
                difficulty_level: difficulty,
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
                console.log('实训SSE原始响应(前2000字符):', rawResponse.substring(0, 2000));
                sendSSE('progress', { message: 'AI生成完成，正在解析并保存...' });

                const cleanedResponse = extractJSON(rawResponse);
                // 使用多元化解析器
                let aiGeneratedExercise;
                let dataSource = 'dify';

                const parseResult = AIResponseParser.parsePracticalExercise(cleanedResponse);
                if (parseResult.success) {
                    aiGeneratedExercise = parseResult.data;
                    dataSource = 'dify_parsed';
                } else {
                    // 尝试直接 JSON 解析
                    try {
                        aiGeneratedExercise = JSON.parse(cleanedResponse);
                        dataSource = 'dify';
                    } catch (e) {
                        console.error('实训SSE解析失败, raw长度:', rawResponse.length, 'cleaned长度:', cleanedResponse.length);
                        sendSSE('error', { message: 'AI返回内容解析失败：' + e.message });
                        res.end();
                        return;
                    }
                }

                console.log('实训SSE解析结果:', JSON.stringify({ dataSource, hasQuestions: !!aiGeneratedExercise.questions, questionsCount: aiGeneratedExercise.questions?.length, topKeys: Object.keys(aiGeneratedExercise || {}) }));
                // 转换题目格式（复用 practical-exercise-controller 的逻辑）
                const rawQuestions = aiGeneratedExercise.questions || aiGeneratedExercise.exercises || aiGeneratedExercise.tasks || aiGeneratedExercise.题目列表 || [];
                const convertedQuestions = rawQuestions.map((q, index) => {
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
                        questionText: String(q.question || q.questionText || q.task || q.description || q.title || `题目${index + 1}`),
                        requirements: Array.isArray(q.requirements) ? q.requirements : [],
                        referenceAnswer: String(q.referenceAnswer || q.answer || q.expectedOutput || q.solution || q.correctAnswer || '\u8bf7\u6839\u636e\u9898\u76ee\u8981\u6c42\u5b8c\u6210\u64cd\u4f5c'),
                        codeTemplate: q.codeTemplate || null,
                        gradingCriteria: Array.isArray(q.gradingCriteria) ? q.gradingCriteria : [],
                        explanation: explanationText,
                        difficulty: mapDifficulty(q.difficulty || difficulty),
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
