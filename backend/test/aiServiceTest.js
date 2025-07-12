const aiService = require('../services/aiService');
const AIResponseParser = require('../utils/aiResponseParser');

// 测试AI服务连接
async function testAIConnection() {
    console.log('🧪 测试AI服务连接...');
    
    try {
        const result = await aiService.queryKnowledgeBase('测试连接', null, {
            userId: 'test-user',
            type: 'connection_test'
        });
        
        console.log('✅ AI服务连接测试结果:', result.success ? '成功' : '失败');
        if (result.success) {
            console.log('📝 AI响应:', result.answer.substring(0, 100) + '...');
        } else {
            console.log('❌ 错误信息:', result.error);
        }
    } catch (error) {
        console.log('❌ AI服务连接失败:', error.message);
    }
}

// 测试教学计划生成
async function testLessonPlanGeneration() {
    console.log('\n🧪 测试教学计划生成...');
    
    const courseInfo = {
        subject: '计算机科学',
        grade: '大学一年级',
        duration: 90,
        objectives: '学习JavaScript基础语法和编程概念',
        outline: 'JavaScript变量、函数、对象、数组、条件语句、循环语句'
    };
    
    const knowledgeBase = [
        {
            title: 'JavaScript基础',
            content: 'JavaScript是一种动态编程语言，主要用于网页开发...',
            type: 'text'
        }
    ];
    
    try {
        const result = await aiService.generateLessonPlan(courseInfo, knowledgeBase);
        console.log('✅ 教学计划生成测试结果:', result.success ? '成功' : '失败');
        
        if (result.success) {
            const parsed = AIResponseParser.parseLessonPlan(result.answer);
            console.log('📋 解析结果:', parsed.success ? '成功' : '失败');
            if (parsed.success) {
                console.log('📝 教学计划标题:', parsed.data.title);
                console.log('⏱️ 课程时长:', parsed.data.duration, '分钟');
                console.log('📚 活动数量:', parsed.data.activities.length);
                console.log('🎯 知识点数量:', parsed.data.knowledgePoints.length);
            }
        }
    } catch (error) {
        console.log('❌ 教学计划生成失败:', error.message);
    }
}

// 测试题目生成
async function testQuestionGeneration() {
    console.log('\n🧪 测试题目生成...');
    
    const examConfig = {
        subject: '计算机科学',
        difficulty: 'medium',
        questionCount: 3,
        questionTypes: ['multiple_choice', 'short_answer'],
        knowledgePoints: ['JavaScript变量', '函数定义', '数组操作'],
        duration: 30
    };
    
    try {
        const result = await aiService.generateExamQuestions(examConfig);
        console.log('✅ 题目生成测试结果:', result.success ? '成功' : '失败');
        
        if (result.success) {
            const parsed = AIResponseParser.parseQuestions(result.answer);
            console.log('📋 解析结果:', parsed.success ? '成功' : '失败');
            if (parsed.success) {
                console.log('❓ 生成题目数量:', parsed.data.length);
                parsed.data.forEach((q, index) => {
                    console.log(`${index + 1}. ${q.title} (${q.type}, ${q.difficulty})`);
                });
            }
        }
    } catch (error) {
        console.log('❌ 题目生成失败:', error.message);
    }
}

// 测试答案分析
async function testAnswerAnalysis() {
    console.log('\n🧪 测试答案分析...');
    
    const answerData = {
        question: '什么是JavaScript变量？',
        answer: '变量是用来存储数据的容器',
        correctAnswer: '变量是用来存储数据值的容器，可以通过var、let或const关键字声明',
        subject: '计算机科学',
        questionType: 'short_answer'
    };
    
    try {
        const result = await aiService.analyzeStudentAnswer(answerData);
        console.log('✅ 答案分析测试结果:', result.success ? '成功' : '失败');
        
        if (result.success) {
            const parsed = AIResponseParser.parseAnswerAnalysis(result.answer);
            console.log('📋 解析结果:', parsed.success ? '成功' : '失败');
            if (parsed.success) {
                console.log('✅ 答案正确性:', parsed.data.isCorrect ? '正确' : '错误');
                console.log('📊 得分:', parsed.data.score);
                console.log('💡 反馈:', parsed.data.feedback.substring(0, 100) + '...');
            }
        }
    } catch (error) {
        console.log('❌ 答案分析失败:', error.message);
    }
}

// 测试个性化练习生成
async function testPersonalizedExercise() {
    console.log('\n🧪 测试个性化练习生成...');
    
    const studentProfile = {
        level: 'intermediate',
        weakPoints: ['循环语句', '函数参数'],
        strengths: ['变量声明', '基本语法'],
        history: {
            recentScores: [75, 80, 65, 90],
            commonErrors: ['循环条件错误', '函数调用语法错误']
        }
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
                    console.log(`${index + 1}. ${ex.title} (${ex.difficulty})`);
                });
            }
        }
    } catch (error) {
        console.log('❌ 个性化练习生成失败:', error.message);
    }
}

// 运行所有测试
async function runAllTests() {
    console.log('🚀 开始AI服务测试套件...\n');
    
    await testAIConnection();
    await testLessonPlanGeneration();
    await testQuestionGeneration();
    await testAnswerAnalysis();
    await testPersonalizedExercise();
    
    console.log('\n✨ AI服务测试套件完成！');
    console.log('\n📝 注意事项:');
    console.log('1. 确保Dify服务正在运行并且API密钥正确');
    console.log('2. 确保Ollama服务正在运行');
    console.log('3. 检查.env文件中的AI服务配置');
    console.log('4. 如果测试失败，请检查网络连接和服务状态');
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
    runAllTests().catch(console.error);
}

module.exports = {
    testAIConnection,
    testLessonPlanGeneration,
    testQuestionGeneration,
    testAnswerAnalysis,
    testPersonalizedExercise,
    runAllTests
};
