const PerformanceAnalysis = require('../models/performanceAnalysisSchema');
const Answer = require('../models/answerSchema');
const Student = require('../models/studentSchema');
const Exam = require('../models/examSchema');
const Question = require('../models/questionSchema');
const UsageStat = require('../models/usageStatSchema');
const aiService = require('../services/aiService');
const AIResponseParser = require('../utils/aiResponseParser');

/**
 * 生成学生个人学习分析报告
 */
const generateStudentAnalysis = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { 
            startDate, 
            endDate, 
            subject,
            analysisType = 'individual',
            includeRecommendations = true 
        } = req.body;

        // 验证学生是否存在
        const student = await Student.findById(studentId)
            .populate('sclassName', 'sclassName')
            .populate('school', 'schoolName');

        if (!student) {
            return res.status(404).json({ message: '学生不存在' });
        }

        // 构建时间范围
        const timeRange = {
            startDate: new Date(startDate),
            endDate: new Date(endDate)
        };

        // 收集学生数据
        const studentData = await collectStudentData(studentId, timeRange, subject);

        // 调用AI服务进行分析
        const performanceData = {
            studentId,
            subject: subject || 'all',
            timeRange: `${startDate} to ${endDate}`,
            analysisType,
            includeRecommendations,
            dataPoints: studentData
        };

        const aiResult = await aiService.analyzeStudentPerformance(performanceData);

        let analysisResult;
        if (aiResult.success) {
            const parsedResult = AIResponseParser.parsePerformanceAnalysis(aiResult.answer);
            if (parsedResult.success) {
                analysisResult = parsedResult.data;
            } else {
                // 如果AI解析失败，使用基础分析
                analysisResult = await performBasicAnalysis(studentData);
            }
        } else {
            analysisResult = await performBasicAnalysis(studentData);
        }

        // 保存分析结果
        const performanceAnalysis = new PerformanceAnalysis({
            analysisType: 'student_individual',
            targetId: studentId,
            targetType: 'student',
            school: student.school._id,
            analysisDate: new Date(),
            periodType: 'custom',
            startDate: timeRange.startDate,
            endDate: timeRange.endDate,
            learningEffectiveness: {
                averageAccuracy: analysisResult.averageAccuracy || calculateAverageAccuracy(studentData),
                knowledgePointMastery: analysisResult.knowledgePointMastery || [],
                frequentErrors: analysisResult.frequentErrors || [],
                learningProgress: analysisResult.learningProgress || {}
            },
            usageStatistics: {
                activityStats: analysisResult.activityStats || {},
                featureUsage: analysisResult.featureUsage || [],
                aiUsage: analysisResult.aiUsage || {}
            },
            aiInsights: {
                keyFindings: analysisResult.keyFindings || [],
                recommendations: analysisResult.recommendations || [],
                predictiveAnalysis: analysisResult.predictiveAnalysis || {}
            },
            dataQuality: {
                sampleSize: studentData.examScores?.length || 0,
                confidenceLevel: aiResult.success ? 0.8 : 0.6,
                dataCompleteness: calculateDataCompleteness(studentData),
                analysisReliability: aiResult.success ? 'high' : 'medium'
            }
        });

        const savedAnalysis = await performanceAnalysis.save();

        res.json({
            message: '学生学习分析报告生成成功',
            data: {
                student: {
                    id: student._id,
                    name: student.name,
                    class: student.sclassName.sclassName,
                    school: student.school.schoolName
                },
                analysis: savedAnalysis,
                rawData: studentData,
                aiGenerated: aiResult.success
            }
        });

    } catch (error) {
        console.error('生成学生分析报告错误:', error);
        res.status(500).json({
            message: '生成学生分析报告失败',
            error: error.message
        });
    }
};

/**
 * 生成班级整体分析报告
 */
const generateClassAnalysis = async (req, res) => {
    try {
        const { classId } = req.params;
        const { startDate, endDate, subject } = req.body;

        // 获取班级信息
        const classInfo = await require('../models/sclassSchema').findById(classId)
            .populate('school', 'schoolName');

        if (!classInfo) {
            return res.status(404).json({ message: '班级不存在' });
        }

        // 获取班级所有学生
        const students = await Student.find({ sclassName: classId });
        const studentIds = students.map(s => s._id);

        // 收集班级数据
        const classData = await collectClassData(studentIds, { startDate: new Date(startDate), endDate: new Date(endDate) }, subject);

        // 进行班级分析
        const analysisResult = await performClassAnalysis(classData, students);

        // 保存分析结果
        const performanceAnalysis = new PerformanceAnalysis({
            analysisType: 'class_overview',
            targetId: classId,
            targetType: 'sclass',
            school: classInfo.school._id,
            analysisDate: new Date(),
            periodType: 'custom',
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            learningEffectiveness: analysisResult.learningEffectiveness,
            teachingEfficiency: analysisResult.teachingEfficiency,
            usageStatistics: analysisResult.usageStatistics,
            aiInsights: analysisResult.aiInsights,
            dataQuality: analysisResult.dataQuality
        });

        const savedAnalysis = await performanceAnalysis.save();

        res.json({
            message: '班级分析报告生成成功',
            data: {
                class: {
                    id: classInfo._id,
                    name: classInfo.sclassName,
                    school: classInfo.school.schoolName,
                    studentCount: students.length
                },
                analysis: savedAnalysis,
                rawData: classData
            }
        });

    } catch (error) {
        console.error('生成班级分析报告错误:', error);
        res.status(500).json({
            message: '生成班级分析报告失败',
            error: error.message
        });
    }
};

/**
 * 生成教师教学效果分析
 */
const generateTeacherAnalysis = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const { startDate, endDate, subject } = req.body;

        // 获取教师信息
        const teacher = await require('../models/teacherSchema').findById(teacherId)
            .populate('teachSubject', 'subName')
            .populate('teachSclass', 'sclassName')
            .populate('school', 'schoolName');

        if (!teacher) {
            return res.status(404).json({ message: '教师不存在' });
        }

        // 收集教师相关数据
        const teacherData = await collectTeacherData(teacherId, { startDate: new Date(startDate), endDate: new Date(endDate) }, subject);

        // 进行教师效果分析
        const analysisResult = await performTeacherAnalysis(teacherData, teacher);

        // 保存分析结果
        const performanceAnalysis = new PerformanceAnalysis({
            analysisType: 'teacher_effectiveness',
            targetId: teacherId,
            targetType: 'teacher',
            school: teacher.school._id,
            analysisDate: new Date(),
            periodType: 'custom',
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            teachingEfficiency: analysisResult.teachingEfficiency,
            usageStatistics: analysisResult.usageStatistics,
            aiInsights: analysisResult.aiInsights,
            dataQuality: analysisResult.dataQuality
        });

        const savedAnalysis = await performanceAnalysis.save();

        res.json({
            message: '教师教学效果分析报告生成成功',
            data: {
                teacher: {
                    id: teacher._id,
                    name: teacher.name,
                    subject: teacher.teachSubject?.subName,
                    class: teacher.teachSclass?.sclassName,
                    school: teacher.school.schoolName
                },
                analysis: savedAnalysis,
                rawData: teacherData
            }
        });

    } catch (error) {
        console.error('生成教师分析报告错误:', error);
        res.status(500).json({
            message: '生成教师分析报告失败',
            error: error.message
        });
    }
};

/**
 * 获取分析报告列表
 */
const getAnalysisReports = async (req, res) => {
    try {
        const { 
            analysisType, 
            targetType, 
            targetId,
            startDate,
            endDate,
            page = 1, 
            limit = 10 
        } = req.query;
        const { adminID } = req.params;

        const query = { school: adminID };
        
        if (analysisType) query.analysisType = analysisType;
        if (targetType) query.targetType = targetType;
        if (targetId) query.targetId = targetId;
        
        if (startDate && endDate) {
            query.analysisDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const reports = await PerformanceAnalysis.find(query)
            .populate('targetId', 'name sclassName subName') // 动态填充，根据targetType
            .sort({ analysisDate: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await PerformanceAnalysis.countDocuments(query);

        res.json({
            data: reports,
            pagination: {
                current: parseInt(page),
                pageSize: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('获取分析报告列表错误:', error);
        res.status(500).json({
            message: '获取分析报告列表失败',
            error: error.message
        });
    }
};

/**
 * 获取单个分析报告详情
 */
const getAnalysisReportById = async (req, res) => {
    try {
        const { id } = req.params;

        const report = await PerformanceAnalysis.findById(id)
            .populate('targetId', 'name sclassName subName email')
            .populate('school', 'schoolName');

        if (!report) {
            return res.status(404).json({ message: '分析报告不存在' });
        }

        res.json({ data: report });

    } catch (error) {
        console.error('获取分析报告详情错误:', error);
        res.status(500).json({
            message: '获取分析报告详情失败',
            error: error.message
        });
    }
};

/**
 * 删除分析报告
 */
const deleteAnalysisReport = async (req, res) => {
    try {
        const { id } = req.params;

        const report = await PerformanceAnalysis.findByIdAndDelete(id);

        if (!report) {
            return res.status(404).json({ message: '分析报告不存在' });
        }

        res.json({ message: '分析报告删除成功' });

    } catch (error) {
        console.error('删除分析报告错误:', error);
        res.status(500).json({
            message: '删除分析报告失败',
            error: error.message
        });
    }
};

// 辅助函数

/**
 * 收集学生数据
 */
const collectStudentData = async (studentId, timeRange, subject) => {
    const query = {
        student: studentId,
        submitTime: { $gte: timeRange.startDate, $lte: timeRange.endDate }
    };

    // 考试成绩数据
    let examScores = await Answer.aggregate([
        { $match: query },
        {
            $lookup: {
                from: 'exams',
                localField: 'exam',
                foreignField: '_id',
                as: 'examInfo'
            }
        },
        { $unwind: '$examInfo' },
        ...(subject ? [{ $match: { 'examInfo.subject': subject } }] : []),
        {
            $group: {
                _id: '$exam',
                totalScore: { $sum: '$score' },
                maxScore: { $sum: '$maxScore' },
                examTitle: { $first: '$examInfo.title' },
                examDate: { $first: '$examInfo.startTime' },
                subject: { $first: '$examInfo.subject' }
            }
        },
        {
            $addFields: {
                percentage: { $multiply: [{ $divide: ['$totalScore', '$maxScore'] }, 100] }
            }
        }
    ]);

    // 练习记录数据
    const practiceRecords = await Answer.find(query)
        .populate('question', 'knowledgePoints difficulty type')
        .select('score maxScore timeSpent isCorrect submitTime question');

    // 出�勤数据
    const student = await Student.findById(studentId).select('attendance');
    const attendanceData = student.attendance.filter(att => 
        att.date >= timeRange.startDate && att.date <= timeRange.endDate
    );

    return {
        examScores,
        practiceRecords,
        attendanceData
    };
};

/**
 * 收集班级数据
 */
const collectClassData = async (studentIds, timeRange, subject) => {
    // 实现班级数据收集逻辑
    const classScores = await Answer.aggregate([
        {
            $match: {
                student: { $in: studentIds },
                submitTime: { $gte: timeRange.startDate, $lte: timeRange.endDate }
            }
        },
        {
            $group: {
                _id: '$student',
                totalScore: { $sum: '$score' },
                maxScore: { $sum: '$maxScore' },
                questionsAnswered: { $sum: 1 }
            }
        }
    ]);

    return { classScores };
};

/**
 * 收集教师数据
 */
const collectTeacherData = async (teacherId, timeRange, subject) => {
    // 实现教师数据收集逻辑
    return {};
};

/**
 * 执行基础分析
 */
const performBasicAnalysis = async (studentData) => {
    const averageAccuracy = calculateAverageAccuracy(studentData);
    
    return {
        averageAccuracy: {
            current: averageAccuracy,
            trend: 'stable'
        },
        keyFindings: ['基础数据分析完成'],
        recommendations: [
            {
                category: '学习建议',
                recommendation: '继续保持学习节奏',
                expectedImpact: '稳定提升',
                implementationDifficulty: 'low'
            }
        ]
    };
};

/**
 * 执行班级分析
 */
const performClassAnalysis = async (classData, students) => {
    return {
        learningEffectiveness: {},
        teachingEfficiency: {},
        usageStatistics: {},
        aiInsights: {},
        dataQuality: {}
    };
};

/**
 * 执行教师分析
 */
const performTeacherAnalysis = async (teacherData, teacher) => {
    return {
        teachingEfficiency: {},
        usageStatistics: {},
        aiInsights: {},
        dataQuality: {}
    };
};

/**
 * 计算平均准确率
 */
const calculateAverageAccuracy = (studentData) => {
    if (!studentData.practiceRecords || studentData.practiceRecords.length === 0) {
        return 0;
    }

    const correctAnswers = studentData.practiceRecords.filter(record => record.isCorrect).length;
    return (correctAnswers / studentData.practiceRecords.length) * 100;
};

/**
 * 计算数据完整性
 */
const calculateDataCompleteness = (studentData) => {
    let completeness = 0;
    let totalFields = 3;

    if (studentData.examScores && studentData.examScores.length > 0) completeness++;
    if (studentData.practiceRecords && studentData.practiceRecords.length > 0) completeness++;
    if (studentData.attendanceData && studentData.attendanceData.length > 0) completeness++;

    return (completeness / totalFields) * 100;
};

module.exports = {
    generateStudentAnalysis,
    generateClassAnalysis,
    generateTeacherAnalysis,
    getAnalysisReports,
    getAnalysisReportById,
    deleteAnalysisReport
};
