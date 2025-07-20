const PracticalExercise = require('../models/practicalExerciseSchema');
const Courseware = require('../models/coursewareSchema');
const Teacher = require('../models/teacherSchema');
const Subject = require('../models/subjectSchema');
const difyService = require('../services/difyService');
const smartDifyWrapper = require('../services/smartDifyWrapper');

/**
 * 生成实训练习
 */
const generatePracticalExercise = async (req, res) => {
    const startTime = Date.now();
    console.log('🚀 开始生成实训练习...');

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

    try {
        // 验证相关数据
        const teacher = await Teacher.findById(teacherId).populate('teachSubject');
        if (!teacher) {
            return res.status(404).json({ message: '教师不存在' });
        }

        const courseware = await Courseware.findById(coursewareId);
        if (!courseware) {
            return res.status(404).json({ message: '课件不存在' });
        }

        const subject = teacher.teachSubject;
        if (!subject) {
            return res.status(404).json({ message: '教师学科信息不存在' });
        }

        // 提取课件内容
        let coursewareContent = '';
        if (courseware.teachingContent && courseware.teachingContent.lectures) {
            coursewareContent = courseware.teachingContent.lectures
                .map(lecture => `${lecture.title}: ${lecture.content}`)
                .join('\n');
        }

        // 调用Dify服务生成实训练习
        let aiGeneratedExercise = null;
        let dataSource = 'dify';

        try {
            console.log('开始使用Dify服务生成实训练习...');

            const difyResponse = await smartDifyWrapper.generatePracticalExerciseWithFallback({
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
            }, {
                timeoutLevel: 'extended',  // 使用扩展超时（5分钟）
                retryStrategy: 'patient',  // 使用耐心重试策略
                enableFallback: true       // 启用智能回退
            });

            if (difyResponse.success) {
                aiGeneratedExercise = difyResponse.data;
                dataSource = difyResponse.source;
                console.log(`实训练习生成成功，数据源: ${dataSource}`);
            } else {
                throw new Error('Dify服务返回失败响应');
            }

        } catch (difyError) {
            console.log('Dify服务调用失败，使用本地模拟数据生成:', difyError.message);
            dataSource = 'mock';

            // 生成模拟实训练习数据
            aiGeneratedExercise = generateMockPracticalExercise({
                subjectName: subject.subName,
                title,
                description,
                difficulty,
                questionCount,
                questionTypes,
                duration,
                focusAreas,
                targetSkills,
                exerciseType,
                coursewareContent
            });
        }

        // 转换题目格式
        const convertedQuestions = (aiGeneratedExercise.questions || []).map((q, index) => ({
            questionNumber: index + 1,
            questionType: q.type || q.questionType || '实操题',
            questionText: q.question || q.questionText || '',
            requirements: q.requirements || [],
            referenceAnswer: q.referenceAnswer || q.answer || '',
            codeTemplate: q.codeTemplate || null,
            gradingCriteria: q.gradingCriteria || [],
            explanation: q.explanation || '',
            difficulty: q.difficulty || difficulty,
            points: q.points || 20,
            estimatedTime: q.estimatedTime || Math.floor(duration / questionCount),
            knowledgePoints: q.knowledgePoints || [],
            environmentRequirements: q.environmentRequirements || {}
        }));

        // 计算总分
        const totalPoints = convertedQuestions.reduce((sum, q) => sum + (q.points || 0), 0) || 100;

        // 确保必填字段不为空
        const safeTitle = title && title.trim() !== '' ? title : `${subject.subName}实训练习`;
        const safeDescription = description && description.trim() !== ''
            ? description
            : `这是一个${difficulty}级别的${subject.subName}实训练习，包含${questionCount}道${questionTypes.join('、')}题目，预计完成时间${duration}分钟。`;

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

        // 保存到数据库
        const savedExercise = await practicalExercise.save();

        const endTime = Date.now();
        const processingTime = endTime - startTime;
        console.log(`✅ 实训练习生成完成，耗时: ${processingTime}ms`);

        res.json({
            success: true,
            message: dataSource === 'mock' ? '实训练习生成成功（使用模拟数据）' : '实训练习生成成功',
            exercise: savedExercise,
            dataSource: dataSource,
            processingTime: processingTime,
            note: dataSource === 'mock' ? 'Dify服务不可用，已使用本地智能生成的实训内容' : 'Dify AI生成完成'
        });

    } catch (error) {
        console.error('实训练习生成错误:', error);
        res.status(500).json({ 
            success: false,
            message: '实训练习生成失败', 
            error: error.message 
        });
    }
};

/**
 * 获取教师的实训练习列表
 */
const getTeacherPracticalExercises = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const { page = 1, limit = 10, status, difficulty, exerciseType } = req.query;

        const filter = { teacher: teacherId };
        if (status) filter.status = status;
        if (difficulty) filter.difficulty = difficulty;
        if (exerciseType) filter.exerciseType = exerciseType;

        const exercises = await PracticalExercise.find(filter)
            .populate('subject', 'subName subCode')
            .populate('courseware', 'title')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await PracticalExercise.countDocuments(filter);

        res.json({
            success: true,
            exercises,
            pagination: {
                current: parseInt(page),
                pageSize: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('获取实训练习列表错误:', error);
        res.status(500).json({ 
            success: false,
            message: '获取实训练习列表失败', 
            error: error.message 
        });
    }
};

/**
 * 获取实训练习详情
 */
const getPracticalExerciseById = async (req, res) => {
    try {
        const { exerciseId } = req.params;

        const exercise = await PracticalExercise.findById(exerciseId)
            .populate('subject', 'subName subCode')
            .populate('courseware', 'title syllabus')
            .populate('teacher', 'name');

        if (!exercise) {
            return res.status(404).json({ message: '实训练习不存在' });
        }

        // 增加查看次数
        exercise.usageStats.viewCount += 1;
        await exercise.save();

        res.json({
            success: true,
            exercise
        });

    } catch (error) {
        console.error('获取实训练习详情错误:', error);
        res.status(500).json({ 
            success: false,
            message: '获取实训练习详情失败', 
            error: error.message 
        });
    }
};

/**
 * 更新实训练习
 */
const updatePracticalExercise = async (req, res) => {
    try {
        const { exerciseId } = req.params;
        const updateData = req.body;

        const exercise = await PracticalExercise.findByIdAndUpdate(
            exerciseId,
            { ...updateData, updatedAt: new Date() },
            { new: true, runValidators: true }
        ).populate('subject', 'subName subCode')
         .populate('courseware', 'title');

        if (!exercise) {
            return res.status(404).json({ message: '实训练习不存在' });
        }

        res.json({
            success: true,
            message: '实训练习更新成功',
            exercise
        });

    } catch (error) {
        console.error('更新实训练习错误:', error);
        res.status(500).json({ 
            success: false,
            message: '更新实训练习失败', 
            error: error.message 
        });
    }
};

/**
 * 删除实训练习
 */
const deletePracticalExercise = async (req, res) => {
    try {
        const { exerciseId } = req.params;

        const exercise = await PracticalExercise.findByIdAndDelete(exerciseId);

        if (!exercise) {
            return res.status(404).json({ message: '实训练习不存在' });
        }

        res.json({
            success: true,
            message: '实训练习删除成功'
        });

    } catch (error) {
        console.error('删除实训练习错误:', error);
        res.status(500).json({ 
            success: false,
            message: '删除实训练习失败', 
            error: error.message 
        });
    }
};

// 生成模拟实训练习数据
function generateMockPracticalExercise(params) {
    const { subjectName, title, description, difficulty, questionCount, questionTypes, duration, targetSkills } = params;

    // 确保description不为空
    const safeDescription = description && description.trim() !== ''
        ? description
        : `这是一个${difficulty}级别的${subjectName}实训练习，包含${questionCount}道${questionTypes.join('、')}题目，预计完成时间${duration}分钟。`;

    // 基础实训题目模板
    const practicalTemplates = {
        '计算机科学': {
            '实操题': [
                {
                    question: '创建一个简单的Web页面，实现用户登录功能',
                    requirements: [
                        { step: 1, description: '创建HTML登录表单', expectedOutput: '包含用户名和密码输入框的表单' },
                        { step: 2, description: '添加CSS样式美化页面', expectedOutput: '美观的登录界面' },
                        { step: 3, description: '实现JavaScript表单验证', expectedOutput: '输入验证和错误提示' }
                    ],
                    referenceAnswer: '完整的登录页面实现，包含HTML结构、CSS样式和JavaScript验证逻辑',
                    explanation: '本题考查前端开发的基础技能，包括HTML表单设计、CSS样式应用和JavaScript交互实现。'
                }
            ],
            '编程题': [
                {
                    question: '实现一个学生成绩管理系统的核心功能',
                    requirements: [
                        { step: 1, description: '设计学生类和成绩类', expectedOutput: '完整的类定义' },
                        { step: 2, description: '实现成绩录入功能', expectedOutput: '可以添加学生成绩' },
                        { step: 3, description: '实现成绩查询和统计功能', expectedOutput: '查询和统计结果' }
                    ],
                    codeTemplate: {
                        language: 'python',
                        template: 'class Student:\n    def __init__(self, name, student_id):\n        # TODO: 实现初始化\n        pass\n\n    def add_score(self, subject, score):\n        # TODO: 添加成绩\n        pass',
                        testCases: [
                            { input: 'Student("张三", "001")', expectedOutput: '学生对象创建成功', description: '测试学生对象创建' }
                        ]
                    },
                    referenceAnswer: '完整的学生成绩管理系统实现，包含类设计、数据管理和统计功能',
                    explanation: '本题考查面向对象编程思想、数据结构设计和算法实现能力。'
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
                points: type === '编程题' ? 30 : 20,
                estimatedTime: Math.ceil(duration / questionCount),
                knowledgePoints: targetSkills || ['基础概念'],
                environmentRequirements: {
                    software: type === '编程题' ? ['Python 3.8+', 'IDE'] : ['浏览器'],
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

module.exports = {
    generatePracticalExercise,
    getTeacherPracticalExercises,
    getPracticalExerciseById,
    updatePracticalExercise,
    deletePracticalExercise
};
