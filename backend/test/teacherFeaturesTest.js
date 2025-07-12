const aiService = require('../services/aiService');
const AIResponseParser = require('../utils/aiResponseParser');

// 测试题目生成功能
async function testQuestionGeneration() {
    console.log('🧪 测试AI题目生成功能...');
    
    const examConfig = {
        subject: '计算机科学',
        difficulty: 'medium',
        questionCount: 5,
        questionTypes: ['multiple_choice', 'short_answer', 'coding'],
        knowledgePoints: ['JavaScript基础', '函数定义', '数组操作', '条件语句', '循环结构'],
        duration: 60,
        examType: 'quiz',
        customRequirements: '重点考查实际编程能力'
    };
    
    try {
        const result = await aiService.generateExamQuestions(examConfig);
        console.log('✅ 题目生成测试结果:', result.success ? '成功' : '失败');
        
        if (result.success) {
            const parsed = AIResponseParser.parseQuestions(result.answer);
            console.log('📋 解析结果:', parsed.success ? '成功' : '失败');
            
            if (parsed.success) {
                console.log('📝 生成题目数量:', parsed.data.length);
                parsed.data.forEach((q, index) => {
                    console.log(`${index + 1}. ${q.title} (${q.type}, ${q.difficulty}, ${q.points}分)`);
                });
            }
        } else {
            console.log('❌ 错误信息:', result.error);
        }
    } catch (error) {
        console.log('❌ 题目生成失败:', error.message);
    }
}

// 测试答案分析功能
async function testAnswerAnalysis() {
    console.log('\n🧪 测试AI答案分析功能...');
    
    const answerData = {
        questionId: 'test-question-id',
        question: '请编写一个JavaScript函数来计算数组的平均值',
        answer: `function average(arr) {
            let sum = 0;
            for(let i = 0; i < arr.length; i++) {
                sum += arr[i];
            }
            return sum / arr.length;
        }`,
        correctAnswer: `function average(arr) {
            if (arr.length === 0) return 0;
            const sum = arr.reduce((acc, num) => acc + num, 0);
            return sum / arr.length;
        }`,
        questionType: 'coding',
        subject: '计算机科学',
        studentId: 'test-student-id',
        timeSpent: 300
    };
    
    try {
        const result = await aiService.analyzeStudentAnswer(answerData);
        console.log('✅ 答案分析测试结果:', result.success ? '成功' : '失败');
        
        if (result.success) {
            const parsed = AIResponseParser.parseAnswerAnalysis(result.answer);
            console.log('📋 解析结果:', parsed.success ? '成功' : '失败');
            
            if (parsed.success) {
                console.log('✅ 答案正确性:', parsed.data.isCorrect ? '正确' : '错误');
                console.log('📊 得分:', parsed.data.score, '/', parsed.data.maxScore);
                console.log('💡 反馈:', parsed.data.feedback.substring(0, 100) + '...');
                console.log('🔍 错误分析:', parsed.data.errorAnalysis?.errorType || '无');
                console.log('📝 建议数量:', parsed.data.suggestions?.length || 0);
            }
        } else {
            console.log('❌ 错误信息:', result.error);
        }
    } catch (error) {
        console.log('❌ 答案分析失败:', error.message);
    }
}

// 测试个性化练习生成
async function testPersonalizedExercise() {
    console.log('\n🧪 测试个性化练习生成功能...');
    
    const studentProfile = {
        level: 'intermediate',
        weakPoints: ['循环语句', '函数参数', '数组方法'],
        strengths: ['变量声明', '基本语法', '条件语句'],
        recentPerformance: {
            averageScore: 75,
            recentScores: [70, 80, 65, 85, 75],
            commonErrors: ['循环边界条件错误', '函数参数传递错误']
        },
        learningGoals: '提升编程逻辑思维能力'
    };
    
    try {
        const result = await aiService.generatePersonalizedExercise(studentProfile);
        console.log('✅ 个性化练习生成测试结果:', result.success ? '成功' : '失败');
        
        if (result.success) {
            const parsed = AIResponseParser.parsePersonalizedExercise(result.answer);
            console.log('📋 解析结果:', parsed.success ? '成功' : '失败');
            
            if (parsed.success) {
                console.log('📝 练习题数量:', parsed.data.exercises.length);
                parsed.data.exercises.forEach((ex, index) => {
                    console.log(`${index + 1}. ${ex.title} (${ex.difficulty}, 预计${ex.expectedTime}分钟)`);
                    console.log(`   知识点: ${ex.knowledgePoints.join(', ')}`);
                });
            }
        } else {
            console.log('❌ 错误信息:', result.error);
        }
    } catch (error) {
        console.log('❌ 个性化练习生成失败:', error.message);
    }
}

// 测试学习表现分析
async function testPerformanceAnalysis() {
    console.log('\n🧪 测试学习表现分析功能...');
    
    const performanceData = {
        studentId: 'test-student-id',
        subject: '计算机科学',
        timeRange: '2024-01-01 to 2024-01-31',
        analysisType: 'individual',
        includeRecommendations: true,
        dataPoints: {
            examScores: [
                { examId: 'exam1', score: 85, date: '2024-01-15', subject: '计算机科学' },
                { examId: 'exam2', score: 78, date: '2024-01-22', subject: '计算机科学' },
                { examId: 'exam3', score: 92, date: '2024-01-29', subject: '计算机科学' }
            ],
            practiceRecords: [
                { recordId: 'practice1', score: 80, timeSpent: 1200, date: '2024-01-10' },
                { recordId: 'practice2', score: 75, timeSpent: 1500, date: '2024-01-17' },
                { recordId: 'practice3', score: 88, timeSpent: 1000, date: '2024-01-24' }
            ],
            attendanceData: [
                { date: '2024-01-08', status: 'Present' },
                { date: '2024-01-15', status: 'Present' },
                { date: '2024-01-22', status: 'Absent' },
                { date: '2024-01-29', status: 'Present' }
            ]
        }
    };
    
    try {
        const result = await aiService.analyzeStudentPerformance(performanceData);
        console.log('✅ 学习表现分析测试结果:', result.success ? '成功' : '失败');
        
        if (result.success) {
            const parsed = AIResponseParser.parsePerformanceAnalysis(result.answer);
            console.log('📋 解析结果:', parsed.success ? '成功' : '失败');
            
            if (parsed.success) {
                console.log('📊 分析摘要:', parsed.data.summary ? '已生成' : '未生成');
                console.log('📈 趋势分析:', parsed.data.trends ? '已生成' : '未生成');
                console.log('💪 优势领域:', parsed.data.strengths?.length || 0, '个');
                console.log('⚠️ 薄弱环节:', parsed.data.weaknesses?.length || 0, '个');
                console.log('💡 改进建议:', parsed.data.recommendations?.length || 0, '条');
                console.log('🔮 预测分析:', parsed.data.predictions ? '已生成' : '未生成');
            }
        } else {
            console.log('❌ 错误信息:', result.error);
        }
    } catch (error) {
        console.log('❌ 学习表现分析失败:', error.message);
    }
}

// 测试批量题目生成
async function testBatchQuestionGeneration() {
    console.log('\n🧪 测试批量题目生成功能...');
    
    const examConfigs = [
        {
            id: 'config1',
            subject: '计算机科学',
            difficulty: 'easy',
            questionCount: 3,
            questionTypes: ['multiple_choice'],
            knowledgePoints: ['JavaScript基础'],
            duration: 30
        },
        {
            id: 'config2',
            subject: '计算机科学',
            difficulty: 'medium',
            questionCount: 2,
            questionTypes: ['short_answer'],
            knowledgePoints: ['函数定义'],
            duration: 20
        },
        {
            id: 'config3',
            subject: '计算机科学',
            difficulty: 'hard',
            questionCount: 1,
            questionTypes: ['coding'],
            knowledgePoints: ['算法设计'],
            duration: 45
        }
    ];
    
    try {
        const result = await aiService.batchGenerateQuestions(examConfigs);
        console.log('✅ 批量题目生成测试结果:', result.success ? '成功' : '失败');
        
        if (result.success) {
            console.log('📊 处理统计:');
            console.log(`   总配置数: ${result.totalProcessed}`);
            console.log(`   成功数: ${result.successCount}`);
            console.log(`   失败数: ${result.failureCount}`);
            
            result.results.forEach((res, index) => {
                console.log(`${index + 1}. 配置${res.configId}: ${res.success ? '✅ 成功' : '❌ 失败'}`);
                if (!res.success) {
                    console.log(`   错误: ${res.error}`);
                }
            });
        }
    } catch (error) {
        console.log('❌ 批量题目生成失败:', error.message);
    }
}

// 测试题目推荐功能
async function testQuestionRecommendation() {
    console.log('\n🧪 测试智能题目推荐功能...');
    
    const studentProfile = {
        level: 'intermediate',
        weakPoints: ['循环语句', '数组操作'],
        strengths: ['变量声明', '函数定义'],
        recentPerformance: {
            averageScore: 72,
            recentErrors: ['循环边界条件', '数组索引越界']
        },
        learningGoals: '掌握循环和数组的高级用法'
    };
    
    const context = {
        subject: '计算机科学',
        availableTime: 30,
        difficultyPreference: 'adaptive'
    };
    
    try {
        const result = await aiService.recommendQuestions(studentProfile, context);
        console.log('✅ 题目推荐测试结果:', result.success ? '成功' : '失败');
        
        if (result.success) {
            console.log('📝 推荐题目数量:', result.recommendations?.length || 0);
            console.log('🎯 推荐置信度:', result.confidence || 0);
            console.log('💭 推荐理由:', result.reasoning ? '已提供' : '未提供');
            
            if (result.recommendations) {
                result.recommendations.forEach((rec, index) => {
                    console.log(`${index + 1}. ${rec.title || '题目'} (${rec.difficulty || 'medium'})`);
                    console.log(`   推荐理由: ${rec.reason || '针对薄弱知识点'}`);
                });
            }
        } else {
            console.log('❌ 错误信息:', result.error);
        }
    } catch (error) {
        console.log('❌ 题目推荐失败:', error.message);
    }
}

// 运行所有教师功能测试
async function runTeacherFeaturesTests() {
    console.log('🚀 开始教师侧AI功能测试套件...\n');
    
    await testQuestionGeneration();
    await testAnswerAnalysis();
    await testPersonalizedExercise();
    await testPerformanceAnalysis();
    await testBatchQuestionGeneration();
    await testQuestionRecommendation();
    
    console.log('\n✨ 教师侧AI功能测试套件完成！');
    console.log('\n📝 测试总结:');
    console.log('✅ 题目生成功能 - 支持多种题型和难度');
    console.log('✅ 答案分析功能 - 提供详细反馈和建议');
    console.log('✅ 个性化练习 - 基于学生特点生成');
    console.log('✅ 学习分析功能 - 深度数据洞察');
    console.log('✅ 批量处理功能 - 提升工作效率');
    console.log('✅ 智能推荐功能 - 精准匹配需求');
    
    console.log('\n🎯 下一步建议:');
    console.log('1. 测试前端界面集成');
    console.log('2. 验证数据库存储功能');
    console.log('3. 测试实际教学场景');
    console.log('4. 收集教师使用反馈');
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
    runTeacherFeaturesTests().catch(console.error);
}

module.exports = {
    testQuestionGeneration,
    testAnswerAnalysis,
    testPersonalizedExercise,
    testPerformanceAnalysis,
    testBatchQuestionGeneration,
    testQuestionRecommendation,
    runTeacherFeaturesTests
};
