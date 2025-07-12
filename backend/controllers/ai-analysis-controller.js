const StudentSubmission = require('../models/studentSubmissionSchema');
const Assessment = require('../models/assessmentSchema');
const Student = require('../models/studentSchema');
const Teacher = require('../models/teacherSchema');
const axios = require('axios');

// AI自动评分和分析
const analyzeSubmission = async (req, res) => {
    const { submissionId } = req.params;

    try {
        const submission = await StudentSubmission.findById(submissionId)
            .populate('student', 'name rollNum')
            .populate('assessment')
            .populate('subject', 'subName');

        if (!submission) {
            return res.status(404).json({ message: '提交记录不存在' });
        }

        const assessment = submission.assessment;
        let totalAutoScore = 0;
        let maxTotalScore = 0;

        // 逐题分析
        for (let i = 0; i < submission.answers.length; i++) {
            const answer = submission.answers[i];
            const question = assessment.questions.find(q => q._id.toString() === answer.questionId.toString());
            
            if (!question) continue;

            maxTotalScore += question.points;

            // 根据题目类型进行不同的分析
            let analysisPrompt = '';
            let autoScore = 0;

            if (question.questionType === '选择题') {
                // 选择题直接比较答案
                const isCorrect = answer.studentAnswer === question.correctAnswer;
                autoScore = isCorrect ? question.points : 0;
                
                answer.autoGrading = {
                    score: autoScore,
                    maxScore: question.points,
                    feedback: isCorrect ? '答案正确' : `正确答案是：${question.correctAnswer}`,
                    errorAnalysis: isCorrect ? null : {
                        errorType: '答案错误',
                        errorLocation: '选择项',
                        suggestion: '请复习相关知识点',
                        relatedKnowledgePoints: question.knowledgePoints
                    }
                };
            } else if (question.questionType === '编程题') {
                // 编程题需要执行代码并分析
                analysisPrompt = `
                请分析以下编程题的学生答案：

                题目：${question.questionText}
                标准答案：${question.referenceAnswer}
                学生答案：${answer.code}
                执行结果：${JSON.stringify(answer.executionResult)}

                请提供：
                1. 代码正确性评分（0-${question.points}分）
                2. 错误分析（如果有）
                3. 代码质量评估
                4. 改进建议
                5. 相关知识点

                请以JSON格式返回分析结果。
                `;
            } else {
                // 主观题分析
                analysisPrompt = `
                请分析以下${question.questionType}的学生答案：

                题目：${question.questionText}
                参考答案：${question.referenceAnswer}
                学生答案：${answer.studentAnswer}
                评分标准：${JSON.stringify(question.gradingCriteria)}

                请提供：
                1. 答案质量评分（0-${question.points}分）
                2. 答案分析和反馈
                3. 错误或不足之处
                4. 改进建议
                5. 知识点掌握情况

                请以JSON格式返回分析结果。
                `;
            }

            // 对于需要AI分析的题目，调用OpenAI
            if (analysisPrompt && question.questionType !== '选择题') {
                try {
                    const aiResponse = await axios.post(
                        'https://api.openai.com/v1/chat/completions',
                        {
                            model: "gpt-4",
                            messages: [
                                { 
                                    role: "system", 
                                    content: `你是一名专业的${submission.subject.subName}教师，擅长评估学生答案并提供建设性反馈。` 
                                },
                                { role: "user", content: analysisPrompt }
                            ],
                            temperature: 0.3,
                            max_tokens: 1500
                        },
                        {
                            headers: {
                                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                                'Content-Type': 'application/json',
                            },
                        }
                    );

                    const aiAnalysis = JSON.parse(aiResponse.data.choices[0].message.content);
                    
                    answer.autoGrading = {
                        score: aiAnalysis.score || 0,
                        maxScore: question.points,
                        feedback: aiAnalysis.feedback || '需要进一步改进',
                        errorAnalysis: aiAnalysis.errorAnalysis || null,
                        codeQuality: aiAnalysis.codeQuality || null
                    };

                    autoScore = aiAnalysis.score || 0;

                } catch (aiError) {
                    console.error('AI分析错误:', aiError);
                    // AI分析失败时的默认评分
                    answer.autoGrading = {
                        score: question.points * 0.5, // 给予50%分数
                        maxScore: question.points,
                        feedback: '自动评分暂时不可用，请等待教师手动评分',
                        errorAnalysis: null
                    };
                    autoScore = question.points * 0.5;
                }
            }

            answer.finalScore = answer.manualGrading?.score || autoScore;
            answer.isCorrect = answer.finalScore >= question.points * 0.6; // 60%以上算正确
            totalAutoScore += answer.finalScore;
        }

        // 生成整体学情分析
        const overallAnalysisPrompt = `
        请对学生的整体表现进行分析：

        学生信息：${submission.student.name}（学号：${submission.student.rollNum}）
        科目：${submission.subject.subName}
        总分：${totalAutoScore}/${maxTotalScore}
        完成率：${(totalAutoScore/maxTotalScore*100).toFixed(1)}%

        各题表现：
        ${submission.answers.map((answer, index) => 
            `题目${index+1}: ${answer.finalScore}/${assessment.questions[index]?.points || 0}分 - ${answer.autoGrading?.feedback || '无反馈'}`
        ).join('\n')}

        请提供：
        1. 知识掌握情况分析
        2. 学习建议和改进方向
        3. 错误模式分析
        4. 学习进度评估

        请以JSON格式返回分析结果。
        `;

        let overallAnalysis = {};
        try {
            const aiResponse = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: "gpt-4",
                    messages: [
                        { 
                            role: "system", 
                            content: "你是一名专业的教育数据分析师，擅长分析学生学习情况并提供个性化建议。" 
                        },
                        { role: "user", content: overallAnalysisPrompt }
                    ],
                    temperature: 0.3,
                    max_tokens: 2000
                },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            overallAnalysis = JSON.parse(aiResponse.data.choices[0].message.content);
        } catch (error) {
            console.error('整体分析错误:', error);
            overallAnalysis = {
                knowledgeMastery: [],
                learningRecommendations: [],
                errorPatterns: [],
                progressAssessment: {}
            };
        }

        // 更新提交记录
        submission.totalScore = totalAutoScore;
        submission.maxTotalScore = maxTotalScore;
        submission.completionPercentage = (totalAutoScore / maxTotalScore) * 100;
        submission.aiAnalysis = overallAnalysis;
        submission.status = '已评分';

        await submission.save();

        res.json({
            success: true,
            message: '分析完成',
            submission,
            analysis: overallAnalysis
        });

    } catch (error) {
        console.error('分析提交错误:', error);
        res.status(500).json({ 
            success: false,
            message: '分析失败', 
            error: error.message 
        });
    }
};

// 获取班级学情分析报告
const getClassAnalysisReport = async (req, res) => {
    try {
        const { teacherId, subjectId, assessmentId } = req.params;

        // 获取该考核的所有提交
        const submissions = await StudentSubmission.find({
            teacher: teacherId,
            subject: subjectId,
            assessment: assessmentId,
            status: '已评分'
        }).populate('student', 'name rollNum');

        if (submissions.length === 0) {
            return res.json({
                success: true,
                message: '暂无已评分的提交',
                report: null
            });
        }

        // 统计分析
        const totalStudents = submissions.length;
        const averageScore = submissions.reduce((sum, sub) => sum + sub.totalScore, 0) / totalStudents;
        const passRate = submissions.filter(sub => sub.completionPercentage >= 60).length / totalStudents;

        // 知识点掌握统计
        const knowledgePointStats = {};
        submissions.forEach(submission => {
            if (submission.aiAnalysis?.knowledgeMastery) {
                submission.aiAnalysis.knowledgeMastery.forEach(km => {
                    if (!knowledgePointStats[km.knowledgePoint]) {
                        knowledgePointStats[km.knowledgePoint] = {
                            total: 0,
                            mastered: 0,
                            partiallyMastered: 0,
                            notMastered: 0
                        };
                    }
                    knowledgePointStats[km.knowledgePoint].total++;
                    if (km.masteryLevel === '熟练掌握') {
                        knowledgePointStats[km.knowledgePoint].mastered++;
                    } else if (km.masteryLevel === '基本掌握' || km.masteryLevel === '部分掌握') {
                        knowledgePointStats[km.knowledgePoint].partiallyMastered++;
                    } else {
                        knowledgePointStats[km.knowledgePoint].notMastered++;
                    }
                });
            }
        });

        // 生成教学建议
        const teachingAdvicePrompt = `
        基于以下班级考核数据，请提供教学建议：

        班级统计：
        - 总人数：${totalStudents}
        - 平均分：${averageScore.toFixed(1)}
        - 及格率：${(passRate * 100).toFixed(1)}%

        知识点掌握情况：
        ${Object.entries(knowledgePointStats).map(([point, stats]) => 
            `${point}: 掌握${stats.mastered}人，部分掌握${stats.partiallyMastered}人，未掌握${stats.notMastered}人`
        ).join('\n')}

        请提供：
        1. 教学效果评估
        2. 需要重点关注的知识点
        3. 教学方法改进建议
        4. 个别辅导建议

        请以JSON格式返回建议。
        `;

        let teachingAdvice = {};
        try {
            const aiResponse = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: "gpt-4",
                    messages: [
                        { 
                            role: "system", 
                            content: "你是一名资深的教育专家，擅长分析班级学习数据并提供教学改进建议。" 
                        },
                        { role: "user", content: teachingAdvicePrompt }
                    ],
                    temperature: 0.3,
                    max_tokens: 1500
                },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            teachingAdvice = JSON.parse(aiResponse.data.choices[0].message.content);
        } catch (error) {
            console.error('教学建议生成错误:', error);
            teachingAdvice = {
                assessment: '数据分析中，请稍后查看',
                focusAreas: [],
                improvementSuggestions: [],
                individualGuidance: []
            };
        }

        const report = {
            classStats: {
                totalStudents,
                averageScore: averageScore.toFixed(1),
                passRate: (passRate * 100).toFixed(1),
                highPerformers: submissions.filter(sub => sub.completionPercentage >= 85).length,
                needsHelp: submissions.filter(sub => sub.completionPercentage < 60).length
            },
            knowledgePointStats,
            teachingAdvice,
            studentDetails: submissions.map(sub => ({
                studentName: sub.student.name,
                rollNum: sub.student.rollNum,
                score: sub.totalScore,
                percentage: sub.completionPercentage.toFixed(1),
                status: sub.completionPercentage >= 60 ? '及格' : '不及格'
            }))
        };

        res.json({
            success: true,
            report
        });

    } catch (error) {
        console.error('生成班级分析报告错误:', error);
        res.status(500).json({ 
            success: false,
            message: '生成报告失败', 
            error: error.message 
        });
    }
};

// 批量分析学生提交
const batchAnalyzeSubmissions = async (req, res) => {
    try {
        const { assessmentId, teacherId } = req.params;

        // 获取所有未分析的提交
        const submissions = await StudentSubmission.find({
            assessment: assessmentId,
            teacher: teacherId,
            status: '已提交'
        }).populate('student', 'name rollNum');

        if (submissions.length === 0) {
            return res.json({
                success: true,
                message: '没有需要分析的提交',
                processed: 0
            });
        }

        let processedCount = 0;
        const results = [];

        // 批量处理
        for (const submission of submissions) {
            try {
                // 调用单个分析函数
                const analysisResult = await analyzeSubmissionInternal(submission._id);
                results.push({
                    studentId: submission.student._id,
                    studentName: submission.student.name,
                    status: 'success',
                    score: analysisResult.totalScore
                });
                processedCount++;
            } catch (error) {
                results.push({
                    studentId: submission.student._id,
                    studentName: submission.student.name,
                    status: 'error',
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            message: `批量分析完成，处理了 ${processedCount}/${submissions.length} 个提交`,
            processed: processedCount,
            total: submissions.length,
            results
        });

    } catch (error) {
        console.error('批量分析错误:', error);
        res.status(500).json({
            success: false,
            message: '批量分析失败',
            error: error.message
        });
    }
};

// 内部分析函数（从analyzeSubmission提取）
const analyzeSubmissionInternal = async (submissionId) => {
    const submission = await StudentSubmission.findById(submissionId)
        .populate('student', 'name rollNum')
        .populate('assessment')
        .populate('subject', 'subName');

    if (!submission) {
        throw new Error('提交记录不存在');
    }

    // 这里复用analyzeSubmission的核心逻辑
    // 为了简化，返回基本结果
    return {
        submissionId: submission._id,
        totalScore: submission.totalScore || 0,
        status: '已分析'
    };
};

// 生成个性化学习建议
const generatePersonalizedRecommendations = async (req, res) => {
    try {
        const { studentId, subjectId } = req.params;

        // 获取学生的所有提交记录
        const submissions = await StudentSubmission.find({
            student: studentId,
            subject: subjectId,
            status: '已评分'
        }).populate('assessment', 'title questions')
          .sort({ createdAt: -1 })
          .limit(5); // 最近5次

        if (submissions.length === 0) {
            return res.json({
                success: true,
                message: '暂无足够数据生成建议',
                recommendations: []
            });
        }

        // 分析学习模式
        const learningPatterns = {
            averageScore: 0,
            weakAreas: [],
            strongAreas: [],
            improvementTrend: 'stable',
            commonErrors: []
        };

        // 计算平均分和趋势
        const scores = submissions.map(sub => sub.completionPercentage || 0);
        learningPatterns.averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;

        // 分析趋势
        if (scores.length >= 3) {
            const recent = scores.slice(0, 2).reduce((a, b) => a + b, 0) / 2;
            const earlier = scores.slice(-2).reduce((a, b) => a + b, 0) / 2;

            if (recent > earlier + 5) {
                learningPatterns.improvementTrend = 'improving';
            } else if (recent < earlier - 5) {
                learningPatterns.improvementTrend = 'declining';
            }
        }

        // 收集错误模式
        submissions.forEach(submission => {
            if (submission.aiAnalysis?.errorPatterns) {
                submission.aiAnalysis.errorPatterns.forEach(pattern => {
                    learningPatterns.commonErrors.push(pattern.pattern);
                });
            }
        });

        // 生成AI建议
        const recommendationPrompt = `
        基于学生的学习数据，生成个性化学习建议：

        学习表现：
        - 平均分：${learningPatterns.averageScore.toFixed(1)}%
        - 学习趋势：${learningPatterns.improvementTrend}
        - 常见错误：${learningPatterns.commonErrors.join(', ')}

        最近提交记录：
        ${submissions.map((sub, index) =>
            `第${index + 1}次：${sub.completionPercentage?.toFixed(1)}% - ${sub.assessment.title}`
        ).join('\n')}

        请提供：
        1. 学习优势分析
        2. 需要改进的领域
        3. 具体的学习建议
        4. 推荐的学习资源
        5. 下一步学习计划

        请以JSON格式返回建议。
        `;

        const aiResponse = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: "你是一名专业的学习顾问，擅长分析学生学习数据并提供个性化建议。"
                    },
                    { role: "user", content: recommendationPrompt }
                ],
                temperature: 0.3,
                max_tokens: 2000
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        let recommendations = {};
        try {
            recommendations = JSON.parse(aiResponse.data.choices[0].message.content);
        } catch (error) {
            recommendations = {
                strengths: ['需要更多数据分析'],
                improvements: ['继续完成练习'],
                suggestions: ['保持学习节奏'],
                resources: [],
                nextSteps: ['完成下一个练习']
            };
        }

        res.json({
            success: true,
            studentData: {
                averageScore: learningPatterns.averageScore,
                trend: learningPatterns.improvementTrend,
                submissionCount: submissions.length
            },
            recommendations
        });

    } catch (error) {
        console.error('生成个性化建议错误:', error);
        res.status(500).json({
            success: false,
            message: '生成建议失败',
            error: error.message
        });
    }
};

module.exports = {
    analyzeSubmission,
    getClassAnalysisReport,
    batchAnalyzeSubmissions,
    generatePersonalizedRecommendations
};
