const Assessment = require('../models/assessmentSchema');
const Courseware = require('../models/coursewareSchema');
const Subject = require('../models/subjectSchema');
const Teacher = require('../models/teacherSchema');
const axios = require('axios');

// AI考核题目生成
const generateAssessment = async (req, res) => {
    const { 
        title,
        description,
        subjectId,
        teacherId,
        coursewareId,
        difficulty,
        questionCount,
        questionTypes,
        duration,
        focusAreas
    } = req.body;

    try {
        // 验证相关数据
        const teacher = await Teacher.findById(teacherId);
        const subject = await Subject.findById(subjectId);
        let courseware = null;
        
        if (coursewareId) {
            courseware = await Courseware.findById(coursewareId);
        }

        if (!teacher || !subject) {
            return res.status(404).json({ message: '教师或科目不存在' });
        }

        // 构建基于课件内容的提示词
        let coursewareContent = '';
        if (courseware) {
            coursewareContent = `
            基于以下课件内容生成题目：
            课件标题：${courseware.title}
            课程大纲：${courseware.syllabus}
            知识点：${courseware.knowledgePoints.map(kp => `${kp.title}: ${kp.content}`).join('\n')}

            教学内容：
            ${courseware.teachingContent.lectures?.map(lecture =>
                `讲解：${lecture.title} - ${lecture.content}`
            ).join('\n') || ''}

            实训练习：
            ${courseware.teachingContent.practicalExercises?.map(exercise =>
                `练习：${exercise.title} - ${exercise.description}`
            ).join('\n') || ''}

            上传文档内容：
            ${courseware.uploadedDocuments?.map(doc =>
                `文档：${doc.originalName}\n内容摘要：${doc.extractedContent?.substring(0, 500)}...`
            ).join('\n\n') || ''}
            `;
        }

        // 根据科目类型调整提示词
        const isComputerScience = subject.subName.includes('计算机') || 
                                 subject.subName.includes('编程') || 
                                 subject.subName.includes('软件');

        const prompt = `
        作为一名专业的${subject.subName}教师，请根据以下要求生成考核题目：

        ${coursewareContent}

        考核要求：
        - 科目：${subject.subName}
        - 难度等级：${difficulty}
        - 题目数量：${questionCount}
        - 题目类型：${questionTypes.join(', ')}
        - 考试时长：${duration}分钟
        - 重点领域：${focusAreas.join(', ')}

        ${isComputerScience ? `
        特别要求（计算机类科目）：
        - 包含编程题，提供完整的代码模板
        - 设计多个测试用例（包括边界情况）
        - 提供详细的评分标准
        - 考虑代码质量和算法效率
        ` : ''}

        请生成结构化的题目，包括：
        1. 题目文本
        2. 选择题的选项（如适用）
        3. 标准答案
        4. 参考答案（主观题）
        5. 评分标准
        6. 知识点标签
        7. 预计完成时间
        ${isComputerScience ? '8. 编程题的代码模板和测试用例' : ''}

        请以JSON格式返回，确保题目质量高且符合教学目标。
        `;

        // 调用OpenAI API
        const aiResponse = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: "gpt-4",
                messages: [
                    { 
                        role: "system", 
                        content: `你是一名专业的${subject.subName}教师，擅长设计高质量的考核题目。请始终以JSON格式返回结构化的题目内容。` 
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
        let aiGeneratedQuestions;
        try {
            aiGeneratedQuestions = JSON.parse(aiResponse.data.choices[0].message.content);
        } catch (parseError) {
            // 解析失败时的默认结构
            aiGeneratedQuestions = {
                questions: [
                    {
                        questionText: "请根据课程内容回答相关问题",
                        questionType: "简答题",
                        correctAnswer: "根据具体情况回答",
                        referenceAnswer: "参考课程内容进行回答",
                        difficulty: difficulty,
                        knowledgePoints: focusAreas,
                        points: Math.floor(100 / questionCount),
                        estimatedTime: Math.floor(duration / questionCount)
                    }
                ]
            };
        }

        // 计算总分
        const totalPoints = aiGeneratedQuestions.questions?.reduce((sum, q) => sum + (q.points || 0), 0) || 100;

        // 创建考核记录
        const assessment = new Assessment({
            title,
            description,
            subject: subjectId,
            teacher: teacherId,
            school: teacher.school,
            questionType: questionTypes[0], // 主要题型
            questions: aiGeneratedQuestions.questions || [],
            totalPoints,
            duration,
            isAIGenerated: true,
            generationParams: {
                basedOnCourseware: coursewareId,
                difficulty,
                questionCount,
                focusAreas
            },
            status: '草稿'
        });

        const savedAssessment = await assessment.save();
        
        res.json({
            success: true,
            message: '考核题目生成成功',
            assessment: savedAssessment
        });

    } catch (error) {
        console.error('AI考核生成错误:', error);
        res.status(500).json({ 
            success: false,
            message: '考核生成失败', 
            error: error.message 
        });
    }
};

// 获取教师的考核列表
const getTeacherAssessments = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const { page = 1, limit = 10, status, subject } = req.query;

        const filter = { teacher: teacherId };
        if (status) filter.status = status;
        if (subject) filter.subject = subject;

        const assessments = await Assessment.find(filter)
            .populate('subject', 'subName subCode')
            .populate('teacher', 'name')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Assessment.countDocuments(filter);

        res.json({
            success: true,
            assessments,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });

    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: '获取考核列表失败', 
            error: error.message 
        });
    }
};

// 更新考核
const updateAssessment = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const assessment = await Assessment.findByIdAndUpdate(
            id, 
            updateData, 
            { new: true, runValidators: true }
        ).populate('subject', 'subName subCode');

        if (!assessment) {
            return res.status(404).json({ 
                success: false,
                message: '考核不存在' 
            });
        }

        res.json({
            success: true,
            message: '考核更新成功',
            assessment
        });

    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: '考核更新失败', 
            error: error.message 
        });
    }
};

// 发布考核
const publishAssessment = async (req, res) => {
    try {
        const { id } = req.params;

        const assessment = await Assessment.findByIdAndUpdate(
            id,
            { status: '已发布' },
            { new: true }
        );

        if (!assessment) {
            return res.status(404).json({ 
                success: false,
                message: '考核不存在' 
            });
        }

        res.json({
            success: true,
            message: '考核发布成功',
            assessment
        });

    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: '考核发布失败', 
            error: error.message 
        });
    }
};

module.exports = {
    generateAssessment,
    getTeacherAssessments,
    updateAssessment,
    publishAssessment
};
