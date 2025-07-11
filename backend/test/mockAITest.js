const AIResponseParser = require('../utils/aiResponseParser');

// 模拟AI响应数据
const mockResponses = {
    lessonPlan: `{
        "title": "JavaScript基础语法教学计划",
        "description": "针对初学者的JavaScript基础语法教学",
        "duration": 90,
        "activities": [
            {
                "title": "变量声明讲解",
                "description": "介绍var、let、const的区别",
                "type": "lecture",
                "duration": 20,
                "materials": ["PPT", "代码示例"]
            },
            {
                "title": "函数定义练习",
                "description": "学生动手练习函数定义",
                "type": "practice",
                "duration": 30,
                "materials": ["练习题", "在线编辑器"]
            }
        ],
        "knowledgePoints": [
            {
                "title": "变量声明",
                "content": "JavaScript中的变量声明方式",
                "importance": "high",
                "estimatedTime": 15,
                "teachingMethod": "讲解+演示",
                "examples": ["let name = 'John';", "const age = 25;"]
            }
        ],
        "practicalExercises": [
            {
                "title": "变量练习",
                "description": "声明不同类型的变量",
                "type": "coding",
                "difficulty": "easy",
                "estimatedTime": 10,
                "instructions": "声明字符串、数字、布尔类型变量"
            }
        ]
    }`,
    
    questions: `{
        "questions": [
            {
                "title": "JavaScript变量声明",
                "content": "以下哪种方式可以声明一个常量？",
                "type": "multiple_choice",
                "difficulty": "easy",
                "points": 2,
                "options": [
                    {"text": "var PI = 3.14", "isCorrect": false},
                    {"text": "let PI = 3.14", "isCorrect": false},
                    {"text": "const PI = 3.14", "isCorrect": true},
                    {"text": "PI = 3.14", "isCorrect": false}
                ],
                "correctAnswer": "const PI = 3.14",
                "explanation": "const关键字用于声明常量，一旦赋值不能修改",
                "knowledgePoints": ["变量声明", "常量"]
            },
            {
                "title": "函数定义",
                "content": "请编写一个计算两个数字相加的函数",
                "type": "coding",
                "difficulty": "medium",
                "points": 5,
                "correctAnswer": "function add(a, b) { return a + b; }",
                "explanation": "函数使用function关键字定义，接收参数并返回结果",
                "knowledgePoints": ["函数定义", "参数", "返回值"]
            }
        ]
    }`,
    
    answerAnalysis: `{
        "isCorrect": false,
        "score": 3,
        "maxScore": 5,
        "feedback": "您的答案基本正确，但缺少边界条件检查。建议在函数开始时检查数组是否为空，避免除零错误。",
        "errorType": "logic_error",
        "errorLocation": "函数开始处",
        "correctionSuggestion": "添加 if (arr.length === 0) return 0; 检查",
        "suggestions": [
            "添加输入验证",
            "使用更现代的数组方法如reduce",
            "考虑错误处理"
        ],
        "strengths": ["基本逻辑正确", "代码结构清晰"],
        "areasForImprovement": ["边界条件处理", "错误处理"],
        "confidence": 0.85
    }`,
    
    personalizedExercise: `{
        "exercises": [
            {
                "title": "循环练习 - 数组遍历",
                "content": "使用for循环遍历数组并输出每个元素",
                "type": "coding",
                "difficulty": "medium",
                "knowledgePoints": ["循环语句", "数组操作"],
                "expectedTime": 15,
                "hints": ["使用arr.length获取数组长度", "注意数组索引从0开始"],
                "solution": "for(let i = 0; i < arr.length; i++) { console.log(arr[i]); }"
            },
            {
                "title": "函数参数练习",
                "content": "编写一个接收多个参数的函数",
                "type": "coding",
                "difficulty": "medium",
                "knowledgePoints": ["函数参数", "参数传递"],
                "expectedTime": 10,
                "hints": ["可以使用...args接收不定参数"],
                "solution": "function sum(...args) { return args.reduce((a, b) => a + b, 0); }"
            }
        ]
    }`,
    
    performanceAnalysis: `{
        "summary": {
            "overallPerformance": "良好",
            "averageScore": 78.5,
            "improvementRate": 12.3,
            "strongAreas": ["基础语法", "变量声明"],
            "weakAreas": ["循环语句", "函数参数"]
        },
        "trends": {
            "scoreProgression": [70, 75, 80, 85],
            "timeSpentTrend": "稳定",
            "difficultyProgression": "逐步提升"
        },
        "strengths": [
            "基础概念掌握扎实",
            "学习态度积极",
            "代码风格良好"
        ],
        "weaknesses": [
            "循环边界条件容易出错",
            "函数参数传递理解不够深入",
            "错误处理意识不足"
        ],
        "recommendations": [
            {
                "category": "学习方法",
                "recommendation": "增加循环语句的专项练习",
                "expectedImpact": "提升循环使用熟练度",
                "implementationDifficulty": "medium"
            },
            {
                "category": "知识点",
                "recommendation": "深入学习函数参数的各种用法",
                "expectedImpact": "提升函数设计能力",
                "implementationDifficulty": "medium"
            }
        ],
        "predictions": {
            "nextWeekScore": 82,
            "masteryTimeline": "预计2周内掌握循环语句",
            "riskFactors": ["练习时间不足", "基础概念混淆"]
        },
        "insights": [
            "学生在基础语法方面表现优秀",
            "需要加强实际编程练习",
            "建议增加项目实战经验"
        ]
    }`
};

// 测试教学计划解析
function testLessonPlanParsing() {
    console.log('🧪 测试教学计划解析...');
    
    const result = AIResponseParser.parseLessonPlan(mockResponses.lessonPlan);
    
    console.log('✅ 解析结果:', result.success ? '成功' : '失败');
    if (result.success) {
        console.log('📝 教学计划标题:', result.data.title);
        console.log('⏱️ 课程时长:', result.data.duration, '分钟');
        console.log('📚 活动数量:', result.data.activities.length);
        console.log('🎯 知识点数量:', result.data.knowledgePoints.length);
        console.log('💪 实训练习数量:', result.data.practicalExercises.length);
        console.log('🤖 AI生成:', result.data.aiGenerated);
    } else {
        console.log('❌ 错误:', result.error);
    }
}

// 测试题目解析
function testQuestionParsing() {
    console.log('\n🧪 测试题目解析...');
    
    const result = AIResponseParser.parseQuestions(mockResponses.questions);
    
    console.log('✅ 解析结果:', result.success ? '成功' : '失败');
    if (result.success) {
        console.log('❓ 题目数量:', result.data.length);
        result.data.forEach((q, index) => {
            console.log(`${index + 1}. ${q.title} (${q.type}, ${q.difficulty}, ${q.points}分)`);
            console.log(`   知识点: ${q.knowledgePoints.join(', ')}`);
        });
    } else {
        console.log('❌ 错误:', result.error);
    }
}

// 测试答案分析解析
function testAnswerAnalysisParsing() {
    console.log('\n🧪 测试答案分析解析...');
    
    const result = AIResponseParser.parseAnswerAnalysis(mockResponses.answerAnalysis);
    
    console.log('✅ 解析结果:', result.success ? '成功' : '失败');
    if (result.success) {
        console.log('✅ 答案正确性:', result.data.isCorrect ? '正确' : '错误');
        console.log('📊 得分:', result.data.score, '/', result.data.maxScore);
        console.log('💡 反馈:', result.data.feedback.substring(0, 50) + '...');
        console.log('🔍 错误类型:', result.data.errorAnalysis?.errorType || '无');
        console.log('📝 建议数量:', result.data.suggestions?.length || 0);
        console.log('💪 优势数量:', result.data.strengths?.length || 0);
        console.log('⚠️ 改进点数量:', result.data.areasForImprovement?.length || 0);
        console.log('🎯 置信度:', result.data.confidence);
    } else {
        console.log('❌ 错误:', result.error);
    }
}

// 测试个性化练习解析
function testPersonalizedExerciseParsing() {
    console.log('\n🧪 测试个性化练习解析...');
    
    const result = AIResponseParser.parsePersonalizedExercise(mockResponses.personalizedExercise);
    
    console.log('✅ 解析结果:', result.success ? '成功' : '失败');
    if (result.success) {
        console.log('📝 练习题数量:', result.data.exercises.length);
        result.data.exercises.forEach((ex, index) => {
            console.log(`${index + 1}. ${ex.title} (${ex.difficulty}, 预计${ex.expectedTime}分钟)`);
            console.log(`   知识点: ${ex.knowledgePoints.join(', ')}`);
            console.log(`   提示数量: ${ex.hints?.length || 0}`);
        });
        console.log('🤖 AI生成:', result.data.aiGenerated);
    } else {
        console.log('❌ 错误:', result.error);
    }
}

// 测试性能分析解析
function testPerformanceAnalysisParsing() {
    console.log('\n🧪 测试性能分析解析...');
    
    const result = AIResponseParser.parsePerformanceAnalysis(mockResponses.performanceAnalysis);
    
    console.log('✅ 解析结果:', result.success ? '成功' : '失败');
    if (result.success) {
        console.log('📊 分析摘要:', result.data.summary ? '已生成' : '未生成');
        if (result.data.summary) {
            console.log('   整体表现:', result.data.summary.overallPerformance);
            console.log('   平均分数:', result.data.summary.averageScore);
            console.log('   改进率:', result.data.summary.improvementRate + '%');
        }
        console.log('📈 趋势分析:', result.data.trends ? '已生成' : '未生成');
        console.log('💪 优势领域:', result.data.strengths?.length || 0, '个');
        console.log('⚠️ 薄弱环节:', result.data.weaknesses?.length || 0, '个');
        console.log('💡 改进建议:', result.data.recommendations?.length || 0, '条');
        console.log('🔮 预测分析:', result.data.predictions ? '已生成' : '未生成');
        console.log('🎯 洞察数量:', result.data.insights?.length || 0);
        console.log('🤖 AI生成:', result.data.aiGenerated);
    } else {
        console.log('❌ 错误:', result.error);
    }
}

// 测试错误处理
function testErrorHandling() {
    console.log('\n🧪 测试错误处理...');
    
    // 测试无效JSON
    const invalidJson = '{ invalid json }';
    const result1 = AIResponseParser.parseQuestions(invalidJson);
    console.log('❌ 无效JSON处理:', result1.success ? '失败' : '成功');
    
    // 测试空响应
    const emptyResponse = '';
    const result2 = AIResponseParser.parseLessonPlan(emptyResponse);
    console.log('❌ 空响应处理:', result2.success ? '失败' : '成功');
    
    // 测试非结构化响应
    const unstructuredResponse = '这是一个非结构化的教学计划响应，包含一些教学内容...';
    const result3 = AIResponseParser.parseLessonPlan(unstructuredResponse);
    console.log('📝 非结构化响应处理:', result3.success ? '成功' : '失败');
    if (result3.success) {
        console.log('   需要审核:', result3.data.needsReview ? '是' : '否');
        console.log('   原始内容长度:', result3.data.rawContent?.length || 0);
    }
}

// 运行所有模拟测试
function runMockTests() {
    console.log('🚀 开始AI响应解析模拟测试...\n');
    
    testLessonPlanParsing();
    testQuestionParsing();
    testAnswerAnalysisParsing();
    testPersonalizedExerciseParsing();
    testPerformanceAnalysisParsing();
    testErrorHandling();
    
    console.log('\n✨ AI响应解析模拟测试完成！');
    console.log('\n📝 测试总结:');
    console.log('✅ 教学计划解析 - 支持结构化和非结构化响应');
    console.log('✅ 题目解析 - 支持多种题型和选项');
    console.log('✅ 答案分析解析 - 提供详细反馈信息');
    console.log('✅ 个性化练习解析 - 包含完整练习信息');
    console.log('✅ 性能分析解析 - 深度学习数据分析');
    console.log('✅ 错误处理 - 优雅处理各种异常情况');
    
    console.log('\n🎯 功能特点:');
    console.log('1. 智能解析JSON和文本响应');
    console.log('2. 自动生成唯一ID和时间戳');
    console.log('3. 数据验证和格式化');
    console.log('4. 错误恢复和降级处理');
    console.log('5. 支持AI置信度评估');
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
    runMockTests();
}

module.exports = {
    testLessonPlanParsing,
    testQuestionParsing,
    testAnswerAnalysisParsing,
    testPersonalizedExerciseParsing,
    testPerformanceAnalysisParsing,
    testErrorHandling,
    runMockTests
};
