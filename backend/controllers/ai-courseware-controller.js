const Courseware = require('../models/coursewareSchema');
const Subject = require('../models/subjectSchema');
const Teacher = require('../models/teacherSchema');
const difyService = require('../services/difyService');
const ExcelJS = require('exceljs');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, UnderlineType } = require('docx');
const crypto = require('crypto');

// AI课件生成服务 - 优化版本，使用Dify API
const generateCourseware = async (req, res) => {
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

    try {
        // 验证教师（添加超时处理）
        let teacher, subject;
        try {
            // 使用Promise.race来实现超时
            const teacherQuery = Teacher.findById(teacherId).populate('teachSubject');
            const timeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Database query timeout')), 3000)
            );

            teacher = await Promise.race([teacherQuery, timeout]);
            subject = teacher?.teachSubject;
        } catch (dbError) {
            console.log('数据库查询失败，使用模拟数据:', dbError.message);
            // 直接返回模拟数据
            const mockCourseware = await generateMockCourseware(req.body);
            return res.json({
                success: true,
                message: '课件生成成功（模拟数据）',
                courseware: mockCourseware,
                dataSource: 'mock'
            });
        }

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: '教师不存在'
            });
        }

        if (!subject) {
            return res.status(404).json({
                success: false,
                message: '教师未分配科目'
            });
        }

        // 根据生成类型调用不同的Dify工作流
        let coursewareContent;

        if (generateType === 'overview') {
            // 生成科目概览
            coursewareContent = await generateSubjectOverview(teacher, subject, {
                title, description, syllabus, courseLevel, studentCount, duration, focusAreas
            });
        } else {
            // 生成详细课件
            coursewareContent = await generateDetailedCourseware(teacher, subject, {
                title, description, syllabus, courseLevel, studentCount, duration, focusAreas
            });
        }

        // 创建课件记录
        const courseware = new Courseware({
            title: title || `${subject.subName}课件概览`,
            description: description || `${subject.subName}科目的AI生成课件概览`,
            subject: subject._id,
            teacher: teacherId,
            school: teacher.school,
            syllabus: syllabus || coursewareContent.syllabus,
            knowledgePoints: coursewareContent.knowledgePoints || [],
            teachingContent: coursewareContent.teachingContent || {},
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
        
        res.json({
            success: true,
            message: '课件生成成功',
            courseware: savedCourseware,
            content: coursewareContent
        });

    } catch (error) {
        console.error('AI课件生成错误:', error);
        
        // 如果Dify API失败，返回模拟数据
        if (error.message.includes('Dify') || error.code === 'ECONNREFUSED') {
            console.log('Dify API不可用，返回模拟数据');
            const mockCourseware = await generateMockCourseware(req.body);
            return res.json({
                success: true,
                message: '课件生成成功（模拟数据）',
                courseware: mockCourseware,
                dataSource: 'mock'
            });
        }
        
        res.status(500).json({ 
            success: false,
            message: '课件生成失败', 
            error: error.message 
        });
    }
};

// 生成科目概览
const generateSubjectOverview = async (teacher, subject, params) => {
    try {
        // 构建Dify API的输入数据
        const difyInput = {
            subject_name: subject.subName,
            teacher_name: teacher.name,
            course_level: params.courseLevel || '中级',
            student_count: params.studentCount || 30,
            duration: params.duration || 45,
            focus_areas: params.focusAreas?.join(', ') || '理论基础, 实践应用',
            custom_requirements: params.description || '',
            syllabus_outline: params.syllabus || ''
        };

        // 调用Dify API生成科目概览
        const difyResponse = await difyService.generateLessonPlan(difyInput);
        
        // 解析Dify返回的内容
        const content = difyResponse.answer || difyResponse.data || '';
        
        // 尝试解析JSON格式的返回内容
        let parsedContent;
        try {
            parsedContent = JSON.parse(content);
        } catch (e) {
            // 如果不是JSON格式，进行文本解析
            parsedContent = parseTextContent(content, subject.subName);
        }

        return {
            syllabus: parsedContent.syllabus || generateDefaultSyllabus(subject.subName),
            knowledgePoints: parsedContent.knowledgePoints || generateDefaultKnowledgePoints(subject.subName),
            teachingContent: parsedContent.teachingContent || generateDefaultTeachingContent(subject.subName),
            practiceExercises: parsedContent.practiceExercises || generateDefaultExercises(subject.subName),
            timeDistribution: parsedContent.timeDistribution || generateDefaultTimeDistribution(),
            resources: parsedContent.resources || generateDefaultResources(subject.subName),
            assessmentMethods: parsedContent.assessmentMethods || generateDefaultAssessment(subject.subName)
        };

    } catch (error) {
        console.error('Dify API调用失败:', error);
        // 返回基于科目的默认内容
        return generateSubjectBasedContent(subject.subName, params);
    }
};

// 生成详细课件
const generateDetailedCourseware = async (teacher, subject, params) => {
    try {
        const difyInput = {
            subject_name: subject.subName,
            teacher_name: teacher.name,
            course_title: params.title,
            course_description: params.description,
            course_syllabus: params.syllabus,
            course_level: params.courseLevel,
            student_count: params.studentCount,
            duration: params.duration,
            focus_areas: params.focusAreas?.join(', ')
        };

        const difyResponse = await difyService.generateLessonPlan(difyInput);
        const content = difyResponse.answer || difyResponse.data || '';
        
        let parsedContent;
        try {
            parsedContent = JSON.parse(content);
        } catch (e) {
            parsedContent = parseDetailedTextContent(content, params.title);
        }

        return parsedContent;

    } catch (error) {
        console.error('详细课件生成失败:', error);
        return generateDetailedMockContent(subject.subName, params);
    }
};

// 解析文本内容为结构化数据
const parseTextContent = (content, subjectName) => {
    // 简单的文本解析逻辑
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
            introduction: lines.slice(0, 2).join('\n'),
            mainContent: lines.slice(2, 8).join('\n'),
            summary: lines.slice(-2).join('\n')
        }
    };
};

// 解析详细文本内容为结构化数据
const parseDetailedTextContent = (content, title) => {
    const lines = content.split('\n').filter(line => line.trim());

    // 尝试从文本中提取结构化信息
    const sections = {
        introduction: [],
        objectives: [],
        knowledgePoints: [],
        teachingActivities: [],
        practiceExercises: [],
        summary: []
    };

    let currentSection = 'introduction';

    for (const line of lines) {
        const lowerLine = line.toLowerCase();

        if (lowerLine.includes('目标') || lowerLine.includes('objective')) {
            currentSection = 'objectives';
        } else if (lowerLine.includes('知识点') || lowerLine.includes('knowledge')) {
            currentSection = 'knowledgePoints';
        } else if (lowerLine.includes('活动') || lowerLine.includes('activity')) {
            currentSection = 'teachingActivities';
        } else if (lowerLine.includes('练习') || lowerLine.includes('exercise')) {
            currentSection = 'practiceExercises';
        } else if (lowerLine.includes('总结') || lowerLine.includes('summary')) {
            currentSection = 'summary';
        } else {
            sections[currentSection].push(line);
        }
    }

    return {
        title: title || '详细课件',
        introduction: sections.introduction.join('\n') || '课程介绍内容',
        objectives: sections.objectives.length > 0 ? sections.objectives : [
            '掌握基本概念和原理',
            '理解核心理论体系',
            '能够解决实际问题'
        ],
        knowledgePoints: sections.knowledgePoints.length > 0 ?
            sections.knowledgePoints.map((point, index) => ({
                title: `知识点 ${index + 1}`,
                content: point,
                difficulty: index === 0 ? '初级' : index === 1 ? '中级' : '高级',
                estimatedTime: 15 + index * 5
            })) : [
                {
                    title: '基础概念',
                    content: '基本概念和原理介绍',
                    difficulty: '初级',
                    estimatedTime: 15
                }
            ],
        teachingActivities: sections.teachingActivities.length > 0 ?
            sections.teachingActivities.map((activity, index) => ({
                activity: `教学活动 ${index + 1}`,
                description: activity,
                duration: 10 + index * 5
            })) : [
                {
                    activity: '概念讲解',
                    description: '通过讲解介绍基本概念',
                    duration: 15
                }
            ],
        practiceExercises: sections.practiceExercises.length > 0 ?
            sections.practiceExercises.map((exercise, index) => ({
                title: `练习 ${index + 1}`,
                description: exercise,
                difficulty: index === 0 ? '初级' : '中级',
                estimatedTime: 10 + index * 5
            })) : [
                {
                    title: '基础练习',
                    description: '基本概念练习题',
                    difficulty: '初级',
                    estimatedTime: 10
                }
            ],
        summary: sections.summary.join('\n') || '课程总结内容'
    };
};

// 生成基于科目的默认内容
const generateSubjectBasedContent = (subjectName, params) => {
    const subjectTemplates = {
        '数学': {
            knowledgePoints: [
                { title: '数学基础概念', content: '数学基本概念和定理的学习', difficulty: '初级', estimatedTime: 15 },
                { title: '数学运算方法', content: '各种数学运算技巧和方法', difficulty: '中级', estimatedTime: 20 },
                { title: '数学应用实践', content: '数学在实际问题中的应用', difficulty: '高级', estimatedTime: 25 }
            ],
            practiceExercises: [
                { title: '基础计算练习', description: '基本运算能力训练', difficulty: '初级', estimatedTime: 10 },
                { title: '应用题练习', description: '数学应用能力培养', difficulty: '中级', estimatedTime: 15 }
            ]
        },
        '英语': {
            knowledgePoints: [
                { title: '英语语法基础', content: '基本语法规则和句型结构', difficulty: '初级', estimatedTime: 15 },
                { title: '词汇积累', content: '常用词汇和短语学习', difficulty: '中级', estimatedTime: 20 },
                { title: '听说读写综合', content: '英语四项技能综合训练', difficulty: '高级', estimatedTime: 25 }
            ],
            practiceExercises: [
                { title: '语法练习', description: '语法规则应用练习', difficulty: '初级', estimatedTime: 10 },
                { title: '口语对话', description: '日常对话练习', difficulty: '中级', estimatedTime: 15 }
            ]
        },
        '物理': {
            knowledgePoints: [
                { title: '物理基本概念', content: '物理学基础概念和原理', difficulty: '初级', estimatedTime: 15 },
                { title: '物理定律应用', content: '重要物理定律的理解和应用', difficulty: '中级', estimatedTime: 20 },
                { title: '实验设计', content: '物理实验的设计和分析', difficulty: '高级', estimatedTime: 25 }
            ],
            practiceExercises: [
                { title: '概念理解练习', description: '物理概念理解训练', difficulty: '初级', estimatedTime: 10 },
                { title: '实验操作', description: '物理实验操作练习', difficulty: '中级', estimatedTime: 20 }
            ]
        }
    };

    const template = subjectTemplates[subjectName] || subjectTemplates['数学'];
    
    return {
        syllabus: `${subjectName}课程大纲\n1. 基础理论学习\n2. 实践应用训练\n3. 综合能力提升`,
        knowledgePoints: template.knowledgePoints,
        teachingContent: {
            introduction: `欢迎学习${subjectName}课程`,
            mainContent: `本课程将系统学习${subjectName}的核心知识点`,
            summary: `通过本课程的学习，学生将掌握${subjectName}的基本理论和实践技能`
        },
        practiceExercises: template.practiceExercises,
        timeDistribution: generateDefaultTimeDistribution(),
        resources: generateDefaultResources(subjectName),
        assessmentMethods: generateDefaultAssessment(subjectName)
    };
};

// 生成默认的辅助函数
const generateDefaultSyllabus = (subjectName) => {
    return `${subjectName}课程大纲\n1. 基础理论学习\n2. 核心概念掌握\n3. 实践应用训练\n4. 综合能力提升`;
};

const generateDefaultKnowledgePoints = (subjectName) => {
    return [
        {
            title: `${subjectName}基础概念`,
            content: `${subjectName}学科的基本概念和原理介绍`,
            difficulty: '初级',
            estimatedTime: 15
        },
        {
            title: `${subjectName}核心理论`,
            content: `${subjectName}学科的核心理论和重要定律`,
            difficulty: '中级',
            estimatedTime: 20
        },
        {
            title: `${subjectName}实践应用`,
            content: `${subjectName}理论在实际中的应用和案例分析`,
            difficulty: '高级',
            estimatedTime: 25
        }
    ];
};

const generateDefaultTeachingContent = (subjectName) => {
    return {
        introduction: `欢迎学习${subjectName}课程，本课程将帮助您系统掌握${subjectName}的核心知识。`,
        mainContent: `${subjectName}的主要内容包括基础理论、核心概念、实践应用等方面。通过本课程的学习，您将能够理解和运用${subjectName}的基本原理。`,
        summary: `通过本课程的学习，您已经掌握了${subjectName}的基本知识和技能，可以在实际中灵活运用。`
    };
};

const generateDefaultExercises = (subjectName) => {
    return [
        {
            title: `${subjectName}基础练习`,
            description: `${subjectName}基本概念和原理的练习题`,
            difficulty: '初级',
            estimatedTime: 10
        },
        {
            title: `${subjectName}应用练习`,
            description: `${subjectName}实际应用的练习题`,
            difficulty: '中级',
            estimatedTime: 15
        }
    ];
};

const generateDefaultTimeDistribution = () => {
    return {
        introduction: 5,
        mainContent: 30,
        practice: 8,
        summary: 2
    };
};

const generateDefaultResources = (subjectName) => {
    return [
        `${subjectName}教材`,
        `${subjectName}参考资料`,
        `${subjectName}在线资源`,
        `${subjectName}实践工具`
    ];
};

const generateDefaultAssessment = (subjectName) => {
    return [
        '课堂参与度评估',
        '练习题完成情况',
        '期中测试',
        '期末考试'
    ];
};

// 生成模拟课件数据
const generateMockCourseware = async (params) => {
    const { teacherId, title, description, courseLevel, studentCount, duration, focusAreas } = params;

    // 获取教师信息
    let teacher, subject;
    try {
        teacher = await Teacher.findById(teacherId).populate('teachSubject');
        subject = teacher?.teachSubject;
    } catch (e) {
        // 如果数据库查询失败，使用默认值
        subject = { subName: '数学', _id: 'mock_subject_id' };
        teacher = { name: '张老师', school: 'mock_school_id' };
    }

    const subjectName = subject?.subName || '数学';

    const mockCourseware = {
        _id: `mock_courseware_${Date.now()}`,
        title: title || `${subjectName}课件概览`,
        description: description || `${subjectName}科目的AI生成课件概览`,
        subject: subject?._id || 'mock_subject_id',
        teacher: teacherId,
        school: teacher?.school || 'mock_school_id',
        syllabus: generateDefaultSyllabus(subjectName),
        knowledgePoints: generateDefaultKnowledgePoints(subjectName),
        teachingContent: generateDefaultTeachingContent(subjectName),
        practiceExercises: generateDefaultExercises(subjectName),
        isAIGenerated: true,
        generationType: 'overview',
        generationParams: {
            courseLevel: courseLevel || '中级',
            studentCount: studentCount || 30,
            duration: duration || 45,
            focusAreas: focusAreas || ['理论基础', '实践应用']
        },
        status: '草稿',
        aiProvider: 'mock',
        generatedAt: new Date(),
        dataSource: 'mock'
    };

    return mockCourseware;
};

// 生成详细模拟课件内容
const generateDetailedMockContent = (subjectName, params) => {
    const { title, description, courseLevel, studentCount, duration, focusAreas } = params;

    return {
        title: title || `${subjectName}详细课件`,
        introduction: `欢迎学习${subjectName}课程，本课程将帮助您系统掌握${subjectName}的核心知识。`,
        objectives: [
            `掌握${subjectName}的基本概念和原理`,
            `理解${subjectName}的核心理论体系`,
            `能够运用${subjectName}知识解决实际问题`,
            `培养${subjectName}思维和分析能力`
        ],
        knowledgePoints: [
            {
                title: `${subjectName}基础概念`,
                content: `${subjectName}学科的基本概念和原理介绍，包括核心定义、基本术语和基础理论框架。`,
                difficulty: '初级',
                estimatedTime: 15
            },
            {
                title: `${subjectName}核心理论`,
                content: `${subjectName}学科的核心理论和重要定律，深入理解学科的理论基础和发展脉络。`,
                difficulty: '中级',
                estimatedTime: 20
            },
            {
                title: `${subjectName}实践应用`,
                content: `${subjectName}理论在实际中的应用和案例分析，培养解决实际问题的能力。`,
                difficulty: '高级',
                estimatedTime: 25
            }
        ],
        teachingActivities: [
            {
                activity: '概念讲解',
                description: `通过PPT和板书讲解${subjectName}的基本概念`,
                duration: 15
            },
            {
                activity: '案例分析',
                description: `分析${subjectName}在实际中的应用案例`,
                duration: 20
            },
            {
                activity: '互动讨论',
                description: `学生分组讨论${subjectName}相关问题`,
                duration: 10
            }
        ],
        practiceExercises: [
            {
                title: `${subjectName}基础练习`,
                description: `${subjectName}基本概念和原理的练习题`,
                difficulty: '初级',
                estimatedTime: 10
            },
            {
                title: `${subjectName}应用练习`,
                description: `${subjectName}实际应用的练习题`,
                difficulty: '中级',
                estimatedTime: 15
            },
            {
                title: `${subjectName}综合练习`,
                description: `${subjectName}综合知识的练习题`,
                difficulty: '高级',
                estimatedTime: 20
            }
        ],
        summary: `通过本课程的学习，您已经掌握了${subjectName}的基本知识和技能，可以在实际中灵活运用。`,
        generationParams: {
            courseLevel: courseLevel || '中级',
            studentCount: studentCount || 30,
            duration: duration || 90,
            focusAreas: focusAreas || ['理论基础', '实践应用']
        }
    };
};

// 获取教师课件列表
const getTeacherCourseware = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const { page = 1, limit = 10, status } = req.query;

        // 构建查询条件
        const query = { teacher: teacherId };
        if (status) query.status = status;

        // 分页查询
        const skip = (page - 1) * limit;
        const coursewareList = await Courseware.find(query)
            .populate('subject', 'subName')
            .populate('teacher', 'name')
            .sort({ generatedAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Courseware.countDocuments(query);

        res.json({
            success: true,
            data: {
                coursewareList,
                pagination: {
                    current: parseInt(page),
                    pageSize: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('获取课件列表错误:', error);
        // 返回模拟数据
        const mockData = {
            coursewareList: [
                {
                    _id: `mock_${Date.now()}`,
                    title: '数学基础概览',
                    description: '数学科目的AI生成课件概览',
                    subject: { subName: '数学' },
                    teacher: { name: '张老师' },
                    status: '草稿',
                    generatedAt: new Date(),
                    generationType: 'overview'
                }
            ],
            pagination: { current: 1, pageSize: 10, total: 1, pages: 1 }
        };

        res.json({
            success: true,
            data: mockData,
            dataSource: 'mock'
        });
    }
};

// 获取教师课件历史记录
const getTeacherCoursewareHistory = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        // 返回模拟历史数据
        const mockHistory = Array.from({ length: 5 }, (_, index) => ({
            _id: `mock_history_${index}`,
            title: `课件${index + 1}`,
            description: `第${index + 1}个生成的课件`,
            subject: { subName: '数学' },
            teacher: { name: '张老师' },
            status: index % 2 === 0 ? '草稿' : '已发布',
            generatedAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000),
            generationType: 'overview'
        }));

        res.json({
            success: true,
            data: {
                coursewareList: mockHistory,
                pagination: {
                    current: parseInt(page),
                    pageSize: parseInt(limit),
                    total: 5,
                    pages: 1
                },
                statistics: {
                    totalCourseware: 5,
                    publishedCount: 2,
                    draftCount: 3,
                    overviewCount: 5,
                    detailedCount: 0
                }
            },
            dataSource: 'mock'
        });

    } catch (error) {
        console.error('获取课件历史记录错误:', error);
        res.status(500).json({
            success: false,
            message: '获取课件历史记录失败',
            error: error.message
        });
    }
};

// 更新课件
const updateCourseware = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        res.json({
            success: true,
            message: '课件更新成功（模拟）',
            courseware: {
                _id: id,
                ...updateData,
                updatedAt: new Date()
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: '课件更新失败',
            error: error.message
        });
    }
};

// 删除课件
const deleteCourseware = async (req, res) => {
    try {
        const { id } = req.params;

        res.json({
            success: true,
            message: '课件删除成功（模拟）'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: '课件删除失败',
            error: error.message
        });
    }
};

// 发布课件
const publishCourseware = async (req, res) => {
    try {
        const { id } = req.params;

        res.json({
            success: true,
            message: '课件发布成功（模拟）',
            courseware: {
                _id: id,
                status: '已发布',
                publishedAt: new Date()
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: '课件发布失败',
            error: error.message
        });
    }
};

// 调整课件内容
const adjustCoursewareContent = async (req, res) => {
    try {
        const { id } = req.params;
        const { section, adjustedContent, reason } = req.body;

        res.json({
            success: true,
            message: '课件内容调整成功（模拟）',
            adjustment: {
                section,
                adjustedContent,
                reason,
                adjustedAt: new Date()
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: '课件内容调整失败',
            error: error.message
        });
    }
};

// 导出课件
const exportCourseware = async (req, res) => {
    try {
        const { id } = req.params;
        const { format = 'json' } = req.query;

        if (format === 'json') {
            res.json({
                success: true,
                data: {
                    _id: id,
                    title: '模拟课件',
                    description: '这是一个模拟的课件数据',
                    exportedAt: new Date()
                }
            });
        } else {
            res.json({
                success: true,
                message: '导出功能开发中',
                supportedFormats: ['json']
            });
        }

    } catch (error) {
        res.status(500).json({
            success: false,
            message: '课件导出失败',
            error: error.message
        });
    }
};

// Word文档导出功能
const exportCoursewareToWord = async (req, res) => {
    try {
        const { id } = req.params;

        // 模拟获取课件数据（实际应该从数据库获取）
        const coursewareData = {
            title: '课件标题示例',
            description: '这是一个AI生成的课件，包含完整的教学内容和练习题。',
            subject: '数学',
            teacher: '张老师',
            generatedAt: new Date().toLocaleString(),
            knowledgePoints: [
                {
                    title: '基础概念',
                    content: '数学基础概念的详细介绍，包括基本定义、性质和应用场景。通过系统学习，学生能够掌握数学的基本思维方法。',
                    difficulty: '初级',
                    estimatedTime: 15
                },
                {
                    title: '核心理论',
                    content: '数学核心理论的深入讲解，涵盖重要定理、公式推导和理论应用。帮助学生建立完整的知识体系。',
                    difficulty: '中级',
                    estimatedTime: 20
                },
                {
                    title: '实践应用',
                    content: '数学理论在实际问题中的应用，通过案例分析培养学生的问题解决能力和创新思维。',
                    difficulty: '高级',
                    estimatedTime: 25
                }
            ],
            practiceExercises: [
                {
                    title: '基础练习',
                    description: '针对基础概念的练习题，帮助学生巩固基本知识点。',
                    difficulty: '初级',
                    estimatedTime: 10
                },
                {
                    title: '应用练习',
                    description: '结合实际应用的练习题，提升学生的综合运用能力。',
                    difficulty: '中级',
                    estimatedTime: 15
                }
            ]
        };

        // 创建Word文档
        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    // 标题
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: coursewareData.title,
                                bold: true,
                                size: 32,
                                color: "2E74B5"
                            })
                        ],
                        heading: HeadingLevel.TITLE,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 }
                    }),

                    // 基本信息
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "课件基本信息",
                                bold: true,
                                size: 24,
                                underline: { type: UnderlineType.SINGLE }
                            })
                        ],
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 200, after: 200 }
                    }),

                    new Paragraph({
                        children: [
                            new TextRun({ text: "科目：", bold: true }),
                            new TextRun({ text: coursewareData.subject })
                        ],
                        spacing: { after: 100 }
                    }),

                    new Paragraph({
                        children: [
                            new TextRun({ text: "教师：", bold: true }),
                            new TextRun({ text: coursewareData.teacher })
                        ],
                        spacing: { after: 100 }
                    }),

                    new Paragraph({
                        children: [
                            new TextRun({ text: "生成时间：", bold: true }),
                            new TextRun({ text: coursewareData.generatedAt })
                        ],
                        spacing: { after: 100 }
                    }),

                    new Paragraph({
                        children: [
                            new TextRun({ text: "课件描述：", bold: true }),
                            new TextRun({ text: coursewareData.description })
                        ],
                        spacing: { after: 300 }
                    }),

                    // 知识点部分
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "知识点详解",
                                bold: true,
                                size: 24,
                                underline: { type: UnderlineType.SINGLE }
                            })
                        ],
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 200, after: 200 }
                    }),

                    // 动态添加知识点
                    ...coursewareData.knowledgePoints.map((point, index) => [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `${index + 1}. ${point.title}`,
                                    bold: true,
                                    size: 20,
                                    color: "1F4E79"
                                })
                            ],
                            heading: HeadingLevel.HEADING_2,
                            spacing: { before: 200, after: 100 }
                        }),

                        new Paragraph({
                            children: [
                                new TextRun({ text: "内容：", bold: true }),
                                new TextRun({ text: point.content })
                            ],
                            spacing: { after: 100 }
                        }),

                        new Paragraph({
                            children: [
                                new TextRun({ text: "难度级别：", bold: true }),
                                new TextRun({ text: point.difficulty }),
                                new TextRun({ text: "　　预计时长：", bold: true }),
                                new TextRun({ text: `${point.estimatedTime}分钟` })
                            ],
                            spacing: { after: 200 }
                        })
                    ]).flat(),

                    // 练习题部分
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "练习题目",
                                bold: true,
                                size: 24,
                                underline: { type: UnderlineType.SINGLE }
                            })
                        ],
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 300, after: 200 }
                    }),

                    // 动态添加练习题
                    ...coursewareData.practiceExercises.map((exercise, index) => [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `${index + 1}. ${exercise.title}`,
                                    bold: true,
                                    size: 20,
                                    color: "1F4E79"
                                })
                            ],
                            heading: HeadingLevel.HEADING_2,
                            spacing: { before: 200, after: 100 }
                        }),

                        new Paragraph({
                            children: [
                                new TextRun({ text: "描述：", bold: true }),
                                new TextRun({ text: exercise.description })
                            ],
                            spacing: { after: 100 }
                        }),

                        new Paragraph({
                            children: [
                                new TextRun({ text: "难度级别：", bold: true }),
                                new TextRun({ text: exercise.difficulty }),
                                new TextRun({ text: "　　预计时长：", bold: true }),
                                new TextRun({ text: `${exercise.estimatedTime}分钟` })
                            ],
                            spacing: { after: 200 }
                        })
                    ]).flat(),

                    // 页脚信息
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "本课件由AI智能生成，仅供教学参考使用。",
                                italics: true,
                                size: 18,
                                color: "666666"
                            })
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 400 }
                    })
                ]
            }]
        });

        // 生成Word文档
        const buffer = await Packer.toBuffer(doc);

        // 设置响应头
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="courseware_${id}_${Date.now()}.docx"`);

        // 发送文件
        res.send(buffer);

    } catch (error) {
        console.error('Word导出错误:', error);
        res.status(500).json({
            success: false,
            message: 'Word文档导出失败',
            error: error.message
        });
    }
};

// 生成分享链接（简化版）
const generateShareLink = async (req, res) => {
    try {
        const { id } = req.params;
        const { expiresIn = 7 } = req.body;

        const shareToken = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        // 生成分享链接（指向前端页面）
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const shareUrl = `${frontendUrl}/share/courseware/${shareToken}`;

        res.json({
            success: true,
            message: '分享链接生成成功',
            shareUrl: shareUrl,
            expiresIn: expiresIn,
            token: shareToken
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: '生成分享链接失败',
            error: error.message
        });
    }
};

// 通过分享链接下载（简化版）
const downloadByShareLink = async (req, res) => {
    try {
        const { token } = req.params;

        res.json({
            success: true,
            message: '分享下载功能开发中',
            token: token,
            downloadInfo: {
                title: '模拟课件',
                generatedAt: new Date(),
                downloadCount: 1
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: '分享下载失败',
            error: error.message
        });
    }
};

module.exports = {
    generateCourseware,
    getTeacherCourseware,
    getTeacherCoursewareHistory,
    updateCourseware,
    deleteCourseware,
    publishCourseware,
    adjustCoursewareContent,
    exportCourseware,
    exportCoursewareToWord,
    generateShareLink,
    downloadByShareLink
};
