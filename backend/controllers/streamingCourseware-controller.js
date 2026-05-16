const Courseware = require('../models/coursewareSchema');
const Subject = require('../models/subjectSchema');
const Teacher = require('../models/teacherSchema');
const difyService = require('../services/difyService');
const { normalizeDifficulty } = require('../utils/difficultyNormalizer');

// 提取AI响应中的JSON内容（剥离代码块、前后说明文字等）
const extractJSON = (raw) => {
    if (!raw || typeof raw !== 'string') return raw;
    const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) return codeBlockMatch[1].trim();
    const curlyMatch = raw.match(/\{[\s\S]*\}/);
    if (curlyMatch) return curlyMatch[0];
    const bracketMatch = raw.match(/\[[\s\S]*\]/);
    if (bracketMatch) return bracketMatch[0];
    return raw.trim();
};

/**
 * SSE 流式课件生成
 */
const streamGenerateCourseware = async (req, res) => {
    const {
        teacherId,
        title,
        description,
        syllabus,
        courseLevel,
        studentCount,
        duration,
        focusAreas,
        generateType = 'overview'
    } = req.body;

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

        const subject = teacher.teachSubject;
        if (!subject) {
            sendSSE('error', { message: '教师未分配科目' });
            res.end();
            return;
        }

        sendSSE('progress', { message: '教师验证通过，开始AI生成...' });

        // 构建 Dify 输入
        let difyInput;
        if (generateType === 'overview') {
            difyInput = {
                subject_name: subject.subName,
                teacher_name: teacher.name,
                course_level: courseLevel || '中级',
                student_count: studentCount || 30,
                duration: duration || 45,
                focus_areas: focusAreas?.join(', ') || '理论基础, 实践应用',
                custom_requirements: description || '',
                syllabus_outline: syllabus || ''
            };
        } else {
 difyInput = {
 subject_name: subject.subName,
 teacher_name: teacher.name,
 course_title: title || `${subject.subName}详细课件`,
 course_description: description || `${subject.subName}科目的AI生成详细课件`,
 course_syllabus: syllabus || `${subject.subName}课程大纲`,
 course_level: courseLevel || '中级',
 student_count: studentCount || 30,
 duration: duration || 45,
 focus_areas: focusAreas?.join(', ') || '理论基础, 实践应用'
 };
 }

        let fullContent = '';

        const onChunk = (chunk) => {
            if (chunk && chunk.trim()) {
                fullContent += chunk;
                sendSSE('chunk', { content: chunk });
            }
        };

        const onComplete = async (result) => {
            try {
                const content = result.fullContent || fullContent;
                sendSSE('progress', { message: 'AI生成完成，正在解析并保存...' });

                // 解析 AI 内容
                let coursewareContent;
                try {
                    coursewareContent = JSON.parse(extractJSON(content));
                } catch (e) {
                    coursewareContent = parseTextContent(content, subject.subName);
                }

                // 规范化 difficulty 值，确保符合 Schema enum ['初级', '中级', '高级']
                const normalizedKnowledgePoints = (coursewareContent.knowledgePoints || []).map(kp => ({
                    ...kp,
                    difficulty: normalizeDifficulty(kp.difficulty),
                }));

                const normalizedTeachingContent = { ...coursewareContent.teachingContent };
                if (normalizedTeachingContent.practicalExercises) {
                    normalizedTeachingContent.practicalExercises = normalizedTeachingContent.practicalExercises.map(ex => ({
                        ...ex,
                        difficulty: normalizeDifficulty(ex.difficulty),
                    }));
                }

                // 构造 Courseware 文档
                const courseware = new Courseware({
                    title: title || `${subject.subName}课件概览`,
                    description: description || `${subject.subName}科目的AI生成课件概览`,
                    subject: subject._id,
                    teacher: teacherId,
                    school: teacher.school,
                    syllabus: syllabus || coursewareContent.syllabus || '',
                    knowledgePoints: normalizedKnowledgePoints,
                    teachingContent: normalizedTeachingContent,
                    practiceExercises: coursewareContent.practiceExercises || [],
                    isAIGenerated: true,
                    generationType: generateType,
                    generationParams: {
                        courseLevel: courseLevel || '中级',
                        studentCount: studentCount || 30,
                        duration: duration || 45,
                        focusAreas: focusAreas || ['理论基础', '实践应用']
                    },
                    status: '草稿',
                    aiProvider: 'dify',
                    generatedAt: new Date()
                });

                const savedCourseware = await courseware.save();

                sendSSE('complete', {
                    courseware: savedCourseware,
                    dataSource: 'dify'
                });
                res.end();
            } catch (saveError) {
                console.error('课件保存失败:', saveError);
                sendSSE('error', { message: '课件保存失败：' + saveError.message });
                res.end();
            }
        };

        const onError = (error) => {
            console.error('流式课件生成错误:', error);
            if (res.writableEnded) return;
            sendSSE('error', { message: error.message || 'AI生成过程中发生错误' });
            res.end();
        };

        await difyService.generateLessonPlanStream(difyInput, onChunk, onComplete, onError);

    } catch (error) {
        console.error('SSE课件生成错误:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: '流式课件生成初始化失败' });
        } else {
            sendSSE('error', { message: '服务器错误：' + error.message });
            res.end();
        }
    }
};

// 文本内容解析（Dify返回非JSON时的fallback）
const parseTextContent = (content, subjectName) => {
    const lines = content.split('\n').filter(line => line.trim());

    return {
        syllabus: `${subjectName}课程大纲\n${lines.slice(0, 5).join('\n')}`,
        knowledgePoints: [
            {
                title: `${subjectName}基础概念`,
                content: lines.slice(0, 3).join('\n'),
                difficulty: '初级',
                estimatedTime: 15
            },
            {
                title: `${subjectName}核心理论`,
                content: lines.slice(3, 6).join('\n'),
                difficulty: '中级',
                estimatedTime: 20
            }
        ],
        teachingContent: {
            introduction: lines[0] || `欢迎学习${subjectName}课程`,
            mainContent: lines.slice(1, 4).join('\n') || `本课程将系统学习${subjectName}的核心知识点`,
            summary: lines[lines.length - 1] || `通过本课程的学习，学生将掌握${subjectName}的基本理论和实践技能`
        },
        practiceExercises: []
    };
};

module.exports = { streamGenerateCourseware };
