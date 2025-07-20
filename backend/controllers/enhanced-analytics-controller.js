/**
 * 增强的学情数据分析控制器
 */

const Student = require('../models/studentSchema');
const Teacher = require('../models/teacherSchema');
const StudentLearning = require('../models/studentLearningSchema');
const Answer = require('../models/answerSchema');
const Question = require('../models/questionSchema');
const Exam = require('../models/examSchema');
const difyService = require('../services/difyService');

/**
 * 获取班级学情综合分析
 */
const getClassAnalytics = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const { 
            timeRange = 'month',
            subject,
            analysisType = 'comprehensive',
            includeIndividual = true 
        } = req.query;

        // 获取教师信息
        const teacher = await Teacher.findById(teacherId)
            .populate('teachSubject', 'subName subCode')
            .populate('teachSclass', 'sclassName');

        if (!teacher) {
            return res.status(404).json({ message: '教师不存在' });
        }

        // 获取班级学生
        const students = await Student.find({ 
            sclassName: teacher.teachSclass._id 
        }).select('name rollNum');

        // 计算时间范围
        const endDate = new Date();
        const startDate = new Date();
        switch (timeRange) {
            case 'week':
                startDate.setDate(endDate.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(endDate.getMonth() - 1);
                break;
            case 'semester':
                startDate.setMonth(endDate.getMonth() - 4);
                break;
            default:
                startDate.setMonth(endDate.getMonth() - 1);
        }

        // 获取学生学习数据
        const studentIds = students.map(s => s._id);
        const learningRecords = await StudentLearning.find({
            student: { $in: studentIds },
            subject: teacher.teachSubject._id,
            updatedAt: { $gte: startDate, $lte: endDate }
        }).populate('student', 'name rollNum');

        // 获取考试数据
        const examData = await Answer.find({
            student: { $in: studentIds },
            submitTime: { $gte: startDate, $lte: endDate }
        }).populate('question', 'content difficulty knowledgePoints')
          .populate('student', 'name rollNum');

        // 构建分析数据
        const analysisData = {
            teacherId,
            subject: teacher.teachSubject.subName,
            analysisType,
            classInfo: {
                className: teacher.teachSclass.sclassName,
                studentCount: students.length,
                timeRange: { startDate, endDate }
            },
            questions: await buildQuestionAnalysisData(examData),
            studentAnswers: await buildStudentAnswerData(learningRecords, examData, students),
            correctAnswers: await buildCorrectAnswerData(examData),
            classStats: await calculateClassStats(learningRecords, examData)
        };

        // 调用Dify进行深度分析
        const aiAnalysis = await difyService.analyzeStudentPerformance(analysisData);

        // 构建响应数据
        const response = {
            success: true,
            classInfo: analysisData.classInfo,
            overallStats: analysisData.classStats,
            aiAnalysis: aiAnalysis.analysis,
            rawAnalysis: aiAnalysis.rawResponse,
            dataQuality: {
                sampleSize: examData.length,
                timeRange,
                confidenceLevel: aiAnalysis.success ? 0.9 : 0.7,
                lastUpdated: new Date()
            }
        };

        // 如果需要个体分析
        if (includeIndividual) {
            response.individualAnalysis = await generateIndividualAnalysis(
                students, 
                learningRecords, 
                examData
            );
        }

        res.json(response);

    } catch (error) {
        console.error('获取班级学情分析错误:', error);
        res.status(500).json({
            success: false,
            message: '获取班级学情分析失败',
            error: error.message
        });
    }
};

/**
 * 获取学生个体深度分析
 */
const getStudentDeepAnalysis = async (req, res) => {
    try {
        const { teacherId, studentId } = req.params;
        const { timeRange = 'month', includeRecommendations = true } = req.query;

        // 获取学生和教师信息
        const [student, teacher] = await Promise.all([
            Student.findById(studentId).select('name rollNum'),
            Teacher.findById(teacherId).populate('teachSubject', 'subName')
        ]);

        if (!student || !teacher) {
            return res.status(404).json({ message: '学生或教师不存在' });
        }

        // 计算时间范围
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(endDate.getMonth() - (timeRange === 'semester' ? 4 : 1));

        // 获取学生详细学习数据
        const [learningRecord, examAnswers, practiceHistory] = await Promise.all([
            StudentLearning.findOne({
                student: studentId,
                subject: teacher.teachSubject._id
            }),
            Answer.find({
                student: studentId,
                submitTime: { $gte: startDate, $lte: endDate }
            }).populate('question', 'content difficulty knowledgePoints'),
            // 获取练习历史
            StudentLearning.findOne({
                student: studentId,
                subject: teacher.teachSubject._id
            }).select('practiceHistory')
        ]);

        // 构建个体分析数据
        const individualData = {
            studentInfo: {
                id: student._id,
                name: student.name,
                rollNum: student.rollNum
            },
            learningProgress: learningRecord?.learningProgress || {},
            performanceHistory: buildPerformanceHistory(examAnswers, practiceHistory),
            knowledgeMastery: analyzeKnowledgeMastery(learningRecord, examAnswers),
            learningBehavior: analyzeLearningBehavior(learningRecord, practiceHistory),
            strengthsAndWeaknesses: identifyStrengthsAndWeaknesses(examAnswers, learningRecord)
        };

        // 生成个性化建议
        let recommendations = null;
        if (includeRecommendations) {
            recommendations = await difyService.getLearningRecommendations({
                studentId,
                recentPerformance: individualData.performanceHistory.recent,
                weakAreas: individualData.strengthsAndWeaknesses.weaknesses,
                studyGoals: learningRecord?.learningProgress?.learningGoals || []
            });
        }

        res.json({
            success: true,
            studentData: individualData,
            recommendations: recommendations?.recommendations,
            analysisDate: new Date(),
            dataQuality: {
                completeness: calculateDataCompleteness(learningRecord, examAnswers),
                reliability: examAnswers.length > 10 ? 'high' : 'medium'
            }
        });

    } catch (error) {
        console.error('获取学生深度分析错误:', error);
        res.status(500).json({
            success: false,
            message: '获取学生深度分析失败',
            error: error.message
        });
    }
};

/**
 * 获取实时学情监控数据
 */
const getRealtimeMonitoring = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const { alertLevel = 'all' } = req.query;

        const teacher = await Teacher.findById(teacherId)
            .populate('teachSclass', 'sclassName');

        if (!teacher) {
            return res.status(404).json({ message: '教师不存在' });
        }

        // 获取最近24小时的学习活动
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const students = await Student.find({ 
            sclassName: teacher.teachSclass._id 
        }).select('name rollNum');

        const studentIds = students.map(s => s._id);

        // 获取实时数据
        const [recentActivities, currentSessions, alerts] = await Promise.all([
            getRecentLearningActivities(studentIds, last24Hours),
            getCurrentLearningSessions(studentIds),
            generateLearningAlerts(studentIds, alertLevel)
        ]);

        res.json({
            success: true,
            monitoringData: {
                classInfo: {
                    className: teacher.teachSclass.sclassName,
                    totalStudents: students.length
                },
                realtimeStats: {
                    activeStudents: currentSessions.length,
                    totalActivities: recentActivities.length,
                    alertCount: alerts.length
                },
                recentActivities,
                currentSessions,
                alerts,
                lastUpdated: new Date()
            }
        });

    } catch (error) {
        console.error('获取实时监控数据错误:', error);
        res.status(500).json({
            success: false,
            message: '获取实时监控数据失败',
            error: error.message
        });
    }
};

// 辅助函数
const buildQuestionAnalysisData = async (examData) => {
    const questionMap = new Map();
    
    examData.forEach(answer => {
        if (answer.question) {
            const qId = answer.question._id.toString();
            if (!questionMap.has(qId)) {
                questionMap.set(qId, {
                    questionId: qId,
                    questionText: answer.question.content,
                    difficulty: answer.question.difficulty,
                    knowledgePoints: answer.question.knowledgePoints || []
                });
            }
        }
    });
    
    return Array.from(questionMap.values());
};

const buildStudentAnswerData = async (learningRecords, examData, students) => {
    const studentMap = new Map();
    
    students.forEach(student => {
        studentMap.set(student._id.toString(), {
            studentId: student._id.toString(),
            studentName: student.name,
            rollNum: student.rollNum,
            answers: [],
            score: 0,
            timeTaken: 0
        });
    });
    
    examData.forEach(answer => {
        const studentId = answer.student._id.toString();
        if (studentMap.has(studentId)) {
            const studentData = studentMap.get(studentId);
            studentData.answers.push({
                questionId: answer.question._id.toString(),
                answer: answer.content,
                isCorrect: answer.isCorrect,
                score: answer.score,
                timeTaken: answer.timeTaken || 0
            });
            studentData.score += answer.score || 0;
            studentData.timeTaken += answer.timeTaken || 0;
        }
    });
    
    return Array.from(studentMap.values());
};

const buildCorrectAnswerData = async (examData) => {
    const correctAnswers = [];
    const processedQuestions = new Set();
    
    examData.forEach(answer => {
        if (answer.question && !processedQuestions.has(answer.question._id.toString())) {
            correctAnswers.push(answer.question.correctAnswer || '标准答案');
            processedQuestions.add(answer.question._id.toString());
        }
    });
    
    return correctAnswers;
};

const calculateClassStats = async (learningRecords, examData) => {
    const totalStudents = new Set(examData.map(a => a.student._id.toString())).size;
    const totalAnswers = examData.length;
    const correctAnswers = examData.filter(a => a.isCorrect).length;
    const averageScore = totalAnswers > 0 ? 
        examData.reduce((sum, a) => sum + (a.score || 0), 0) / totalAnswers : 0;
    
    return {
        totalStudents,
        totalQuestions: totalAnswers,
        averageScore: Math.round(averageScore * 100) / 100,
        accuracy: totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0,
        participationRate: 100 // 假设所有学生都参与了
    };
};

module.exports = {
    getClassAnalytics,
    getStudentDeepAnalysis,
    getRealtimeMonitoring
};
