const Courseware = require('../models/coursewareSchema');
const Subject = require('../models/subjectSchema');
const Teacher = require('../models/teacherSchema');
const axios = require('axios');

// AI课件生成服务
const generateCourseware = async (req, res) => {
    const { 
        subjectId, 
        teacherId, 
        title, 
        description, 
        syllabus, 
        courseLevel, 
        studentCount, 
        duration, 
        focusAreas 
    } = req.body;

    try {
        // 验证教师和科目
        const teacher = await Teacher.findById(teacherId);
        const subject = await Subject.findById(subjectId);
        
        if (!teacher || !subject) {
            return res.status(404).json({ message: '教师或科目不存在' });
        }

        // 获取已上传的文档内容
        let documentContent = '';
        if (req.body.coursewareId) {
            const existingCourseware = await Courseware.findById(req.body.coursewareId);
            if (existingCourseware && existingCourseware.uploadedDocuments.length > 0) {
                documentContent = existingCourseware.uploadedDocuments
                    .map(doc => `文档：${doc.originalName}\n内容：${doc.extractedContent}`)
                    .join('\n\n');
            }
        }

        // 构建AI提示词
        const prompt = `
        作为一名专业的教学设计师，请根据以下信息设计详细的教学内容：

        课程信息：
        - 科目：${subject.subName}
        - 标题：${title}
        - 描述：${description}
        - 课程大纲：${syllabus}
        - 课程级别：${courseLevel}
        - 学生人数：${studentCount}
        - 课程时长：${duration}分钟
        - 重点领域：${focusAreas.join(', ')}

        ${documentContent ? `
        参考文档内容：
        ${documentContent}
        ` : ''}

        请生成以下内容：
        1. 详细的知识点分解（包括标题、内容、难度等级、预计学习时间）
        2. 知识讲解内容（包括标题、详细内容、时长、所需资源）
        3. 实训练习设计（包括标题、描述、操作指导、难度等级、预计时间）
        4. 合理的时间分布安排

        请以JSON格式返回，确保内容专业、实用且符合教学规律。
        `;

        // 调用OpenAI API
        const aiResponse = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: "gpt-4",
                messages: [
                    { 
                        role: "system", 
                        content: "你是一名专业的教学设计师，擅长根据课程大纲设计详细的教学内容。请始终以JSON格式返回结构化的教学内容。" 
                    },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 4000
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        // 解析AI返回的内容
        let aiGeneratedContent;
        try {
            aiGeneratedContent = JSON.parse(aiResponse.data.choices[0].message.content);
        } catch (parseError) {
            // 如果解析失败，使用默认结构
            aiGeneratedContent = {
                knowledgePoints: [
                    {
                        title: "基础概念",
                        content: aiResponse.data.choices[0].message.content.substring(0, 500),
                        difficulty: "中级",
                        estimatedTime: Math.floor(duration * 0.3)
                    }
                ],
                teachingContent: {
                    lectures: [
                        {
                            title: title,
                            content: description,
                            duration: Math.floor(duration * 0.6),
                            resources: []
                        }
                    ],
                    practicalExercises: [
                        {
                            title: "实践练习",
                            description: "基于课程内容的实践练习",
                            instructions: "请按照课程要求完成练习",
                            difficulty: "中级",
                            estimatedTime: Math.floor(duration * 0.3),
                            resources: []
                        }
                    ],
                    timeDistribution: {
                        lectureTime: Math.floor(duration * 0.5),
                        practiceTime: Math.floor(duration * 0.3),
                        discussionTime: Math.floor(duration * 0.1),
                        assessmentTime: Math.floor(duration * 0.1)
                    }
                }
            };
        }

        // 创建课件记录
        const courseware = new Courseware({
            title,
            description,
            subject: subjectId,
            teacher: teacherId,
            school: teacher.school,
            syllabus,
            knowledgePoints: aiGeneratedContent.knowledgePoints || [],
            teachingContent: aiGeneratedContent.teachingContent || {},
            isAIGenerated: true,
            generationParams: {
                courseLevel,
                studentCount,
                duration,
                focusAreas
            },
            status: '草稿'
        });

        const savedCourseware = await courseware.save();
        
        res.json({
            success: true,
            message: '课件生成成功',
            courseware: savedCourseware
        });

    } catch (error) {
        console.error('AI课件生成错误:', error);
        res.status(500).json({ 
            success: false,
            message: '课件生成失败', 
            error: error.message 
        });
    }
};

// 获取教师的课件列表
const getTeacherCourseware = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const { page = 1, limit = 10, status, subject } = req.query;

        const filter = { teacher: teacherId };
        if (status) filter.status = status;
        if (subject) filter.subject = subject;

        const courseware = await Courseware.find(filter)
            .populate('subject', 'subName subCode')
            .populate('teacher', 'name')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Courseware.countDocuments(filter);

        res.json({
            success: true,
            courseware,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });

    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: '获取课件列表失败', 
            error: error.message 
        });
    }
};

// 更新课件
const updateCourseware = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const courseware = await Courseware.findByIdAndUpdate(
            id, 
            updateData, 
            { new: true, runValidators: true }
        ).populate('subject', 'subName subCode');

        if (!courseware) {
            return res.status(404).json({ 
                success: false,
                message: '课件不存在' 
            });
        }

        res.json({
            success: true,
            message: '课件更新成功',
            courseware
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

        const courseware = await Courseware.findByIdAndDelete(id);

        if (!courseware) {
            return res.status(404).json({ 
                success: false,
                message: '课件不存在' 
            });
        }

        res.json({
            success: true,
            message: '课件删除成功'
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

        const courseware = await Courseware.findByIdAndUpdate(
            id,
            { status: '已发布' },
            { new: true }
        );

        if (!courseware) {
            return res.status(404).json({ 
                success: false,
                message: '课件不存在' 
            });
        }

        res.json({
            success: true,
            message: '课件发布成功',
            courseware
        });

    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: '课件发布失败', 
            error: error.message 
        });
    }
};

// 手动调整课件内容
const adjustCoursewareContent = async (req, res) => {
    try {
        const { id } = req.params;
        const { section, originalContent, adjustedContent, reason } = req.body;
        const { teacherId } = req.body;

        const courseware = await Courseware.findById(id);
        if (!courseware) {
            return res.status(404).json({
                success: false,
                message: '课件不存在'
            });
        }

        // 记录调整
        courseware.manualAdjustments.push({
            section,
            originalContent,
            adjustedContent,
            adjustedBy: teacherId,
            reason
        });

        // 更新实际内容
        if (section === 'knowledgePoints') {
            // 更新知识点
            const kpIndex = courseware.knowledgePoints.findIndex(kp => kp.content === originalContent);
            if (kpIndex !== -1) {
                courseware.knowledgePoints[kpIndex].content = adjustedContent;
            }
        } else if (section.startsWith('teachingContent.')) {
            // 更新教学内容的特定部分
            const path = section.split('.');
            if (path[1] === 'lectures') {
                const lectureIndex = parseInt(path[2]);
                if (courseware.teachingContent.lectures[lectureIndex]) {
                    courseware.teachingContent.lectures[lectureIndex].content = adjustedContent;
                }
            }
        }

        await courseware.save();

        res.json({
            success: true,
            message: '内容调整成功',
            adjustment: courseware.manualAdjustments[courseware.manualAdjustments.length - 1]
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: '内容调整失败',
            error: error.message
        });
    }
};

// 导出课件
const exportCourseware = async (req, res) => {
    try {
        const { id } = req.params;
        const { format } = req.query; // pdf, docx, json

        const courseware = await Courseware.findById(id)
            .populate('subject', 'subName')
            .populate('teacher', 'name');

        if (!courseware) {
            return res.status(404).json({
                success: false,
                message: '课件不存在'
            });
        }

        if (format === 'json') {
            // 直接返回JSON格式
            res.json({
                success: true,
                data: courseware
            });
        } else {
            // 生成文件格式的导出内容
            const exportContent = {
                title: courseware.title,
                description: courseware.description,
                subject: courseware.subject.subName,
                teacher: courseware.teacher.name,
                syllabus: courseware.syllabus,
                knowledgePoints: courseware.knowledgePoints,
                teachingContent: courseware.teachingContent,
                generatedAt: new Date().toISOString()
            };

            res.json({
                success: true,
                message: '导出内容生成成功',
                content: exportContent,
                downloadUrl: `/api/courseware/${id}/download?format=${format}`
            });
        }

    } catch (error) {
        res.status(500).json({
            success: false,
            message: '导出失败',
            error: error.message
        });
    }
};

module.exports = {
    generateCourseware,
    getTeacherCourseware,
    updateCourseware,
    deleteCourseware,
    publishCourseware,
    adjustCoursewareContent,
    exportCourseware
};
