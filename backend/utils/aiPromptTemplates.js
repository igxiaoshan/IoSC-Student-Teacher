/**
 * AI提示词模板集合
 * 用于生成各种AI功能的提示词
 */

// 教学计划生成模板
const lessonPlanTemplate = {
    systemPrompt: `你是一名专业的教学设计师，擅长根据课程大纲和知识库内容设计高质量的教学计划。
请根据提供的信息生成详细的教学计划，包括教学目标、教学内容、教学方法、教学活动和评估方式。`,

    userPrompt: (data) => `
请为以下课程生成教学计划：

课程信息：
- 学科：${data.subject}
- 年级：${data.grade}
- 课程主题：${data.topic}
- 课时：${data.duration}分钟
- 学生水平：${data.studentLevel}

教学要求：
${data.requirements || '无特殊要求'}

知识库内容：
${data.knowledgeBase || '无相关知识库内容'}

请生成包含以下部分的教学计划：
1. 教学目标（知识目标、能力目标、情感目标）
2. 教学重点和难点
3. 教学准备（教具、材料等）
4. 教学过程（导入、新课、练习、总结）
5. 板书设计
6. 作业布置
7. 教学反思

请确保内容具体、可操作，符合教学实际。`
};

// 题目生成模板
const questionGenerationTemplate = {
    systemPrompt: `你是一名专业的题目设计师，能够根据教学内容生成高质量的考试题目。
请根据提供的知识点和难度要求，生成符合教学目标的题目。`,

    userPrompt: (data) => `
请根据以下要求生成题目：

基本信息：
- 学科：${data.subject}
- 知识点：${data.knowledgePoints.join(', ')}
- 题目类型：${data.questionType}
- 难度等级：${data.difficulty}
- 题目数量：${data.count}

具体要求：
- 题目应该准确考查指定知识点
- 难度应该符合${data.difficulty}等级
- 题目表述要清晰、准确
- 如果是选择题，请提供4个选项，其中1个正确答案
- 如果是填空题，请在答案处用___表示
- 如果是简答题，请提供参考答案要点

${data.additionalRequirements || ''}

请按照以下JSON格式返回：
{
  "questions": [
    {
      "type": "题目类型",
      "question": "题目内容",
      "options": ["选项A", "选项B", "选项C", "选项D"], // 仅选择题需要
      "answer": "正确答案",
      "explanation": "答案解析",
      "knowledgePoints": ["相关知识点"],
      "difficulty": "难度等级"
    }
  ]
}`
};

// 答案分析模板
const answerAnalysisTemplate = {
    systemPrompt: `你是一名专业的教学评估师，能够准确分析学生答案并提供建设性反馈。
请客观、准确地评估学生答案，并提供有针对性的改进建议。`,

    userPrompt: (data) => `
请分析以下学生答案：

题目信息：
- 题目：${data.question}
- 题目类型：${data.questionType}
- 知识点：${data.knowledgePoints.join(', ')}
- 标准答案：${data.correctAnswer}

学生答案：
${data.studentAnswer}

学生信息：
- 学生ID：${data.studentId}
- 年级：${data.grade}
- 学习水平：${data.studentLevel || '未知'}

请提供以下分析：
1. 答案正确性评估（正确/部分正确/错误）
2. 得分建议（满分${data.maxScore}分）
3. 错误原因分析（如果有错误）
4. 知识点掌握情况评估
5. 改进建议和学习指导
6. 相关练习推荐

请以JSON格式返回：
{
  "isCorrect": true/false,
  "score": 分数,
  "maxScore": ${data.maxScore},
  "correctnessLevel": "完全正确/部分正确/完全错误",
  "errorAnalysis": "错误原因分析",
  "knowledgeMastery": "知识点掌握情况",
  "feedback": "详细反馈",
  "suggestions": ["改进建议1", "改进建议2"],
  "recommendedPractice": ["推荐练习1", "推荐练习2"]
}`
};

// 个性化练习生成模板
const personalizedExerciseTemplate = {
    systemPrompt: `你是一名个性化学习专家，能够根据学生特点生成适合的练习题。
请根据学生的学习情况和需求，设计个性化的练习内容。`,

    userPrompt: (data) => `
请为以下学生生成个性化练习：

学生档案：
- 学生ID：${data.studentId}
- 年级：${data.grade}
- 学科：${data.subject}
- 当前水平：${data.currentLevel}
- 学习风格：${data.learningStyle}

学习状况：
- 强项知识点：${data.strengths.join(', ')}
- 薄弱知识点：${data.weaknesses.join(', ')}
- 最近错误类型：${data.recentErrors.join(', ')}
- 学习目标：${data.learningGoals}

练习要求：
- 练习时长：${data.duration}分钟
- 题目数量：${data.questionCount}
- 难度分布：${data.difficultyDistribution}
- 重点加强：${data.focusAreas.join(', ')}

请生成包含以下内容的个性化练习：
1. 基础巩固题（针对薄弱知识点）
2. 能力提升题（适当挑战）
3. 综合应用题（知识点整合）

请以JSON格式返回：
{
  "exerciseId": "练习ID",
  "studentId": "${data.studentId}",
  "subject": "${data.subject}",
  "estimatedTime": ${data.duration},
  "difficultyLevel": "整体难度",
  "exercises": [
    {
      "type": "题目类型",
      "question": "题目内容",
      "options": ["选项"], // 如果适用
      "answer": "答案",
      "knowledgePoints": ["知识点"],
      "difficulty": "难度",
      "purpose": "练习目的",
      "hint": "提示信息"
    }
  ],
  "adaptiveSettings": {
    "nextDifficulty": "下次建议难度",
    "focusAreas": ["需要重点关注的领域"],
    "estimatedMastery": "预估掌握程度"
  }
}`
};

// 学习表现分析模板
const performanceAnalysisTemplate = {
    systemPrompt: `你是一名学习分析专家，能够深入分析学生学习数据并提供洞察。
请基于学生的学习数据，提供全面的学习表现分析和改进建议。`,

    userPrompt: (data) => `
请分析以下学生的学习表现：

学生基本信息：
- 学生ID：${data.studentId}
- 姓名：${data.studentName}
- 年级：${data.grade}
- 学科：${data.subject}
- 分析时间段：${data.timeRange}

学习数据：
- 总答题数：${data.totalQuestions}
- 正确率：${data.accuracy}%
- 平均用时：${data.averageTime}秒/题
- 学习频率：${data.studyFrequency}次/周
- 完成率：${data.completionRate}%

知识点表现：
${data.knowledgePointPerformance.map(kp => `- ${kp.name}: ${kp.accuracy}% (${kp.attempts}次尝试)`).join('\n')}

错误分析：
${data.errorAnalysis.map(error => `- ${error.type}: ${error.count}次`).join('\n')}

学习趋势：
- 成绩趋势：${data.scoreTrend}
- 参与度趋势：${data.engagementTrend}
- 学习时长趋势：${data.timeTrend}

请提供以下分析：
1. 整体学习表现评估
2. 优势和劣势分析
3. 学习习惯评价
4. 知识掌握情况
5. 改进建议和学习计划
6. 预期学习目标

请以JSON格式返回：
{
  "studentId": "${data.studentId}",
  "analysisDate": "分析日期",
  "overallPerformance": {
    "score": "综合评分",
    "level": "学习水平",
    "trend": "发展趋势"
  },
  "strengths": ["优势1", "优势2"],
  "weaknesses": ["劣势1", "劣势2"],
  "knowledgeMastery": {
    "mastered": ["已掌握知识点"],
    "developing": ["发展中知识点"],
    "needsWork": ["需要加强知识点"]
  },
  "learningHabits": {
    "consistency": "学习一致性评价",
    "efficiency": "学习效率评价",
    "engagement": "参与度评价"
  },
  "recommendations": [
    {
      "area": "改进领域",
      "suggestion": "具体建议",
      "priority": "优先级",
      "timeline": "建议时间"
    }
  ],
  "learningPlan": {
    "shortTerm": ["短期目标"],
    "longTerm": ["长期目标"],
    "strategies": ["学习策略"]
  }
}`
};

// 知识库查询模板
const knowledgeBaseQueryTemplate = {
    systemPrompt: `你是一名专业的教育AI助手，能够基于知识库内容回答学生和教师的问题。
请根据提供的知识库内容，给出准确、有用的回答。`,

    userPrompt: (data) => `
用户问题：${data.question}

用户类型：${data.userType}
学科背景：${data.subject}
用户水平：${data.userLevel}

相关知识库内容：
${data.knowledgeBaseContent}

上下文信息：
${data.context || '无额外上下文'}

请基于知识库内容回答用户问题，要求：
1. 回答要准确、清晰
2. 适合用户的知识水平
3. 如果知识库内容不足，请说明并建议其他资源
4. 提供相关的学习建议或扩展阅读

请以自然语言回答，保持友好和专业的语调。`
};

// 教学质量评估模板
const teachingQualityTemplate = {
    systemPrompt: `你是一名教学质量评估专家，能够基于教学数据和学生反馈评估教学质量。
请客观、专业地分析教学效果并提供改进建议。`,

    userPrompt: (data) => `
请评估以下教学质量：

教师信息：
- 教师ID：${data.teacherId}
- 教师姓名：${data.teacherName}
- 学科：${data.subject}
- 教学经验：${data.experience}年

教学数据：
- 评估时间段：${data.timeRange}
- 授课班级数：${data.classCount}
- 学生总数：${data.studentCount}
- 课程完成率：${data.completionRate}%

学生表现数据：
- 平均成绩：${data.averageScore}
- 及格率：${data.passRate}%
- 成绩提升幅度：${data.improvementRate}%
- 学生参与度：${data.engagementRate}%

学生反馈：
- 教学满意度：${data.satisfactionScore}/5
- 教学方法评价：${data.methodRating}/5
- 课堂氛围评价：${data.atmosphereRating}/5
- 知识传授效果：${data.knowledgeTransferRating}/5

教学活动统计：
- 使用AI工具频率：${data.aiToolUsage}%
- 创新教学方法使用：${data.innovativeMethodUsage}
- 个性化指导频率：${data.personalizedGuidance}

请提供以下评估：
1. 整体教学质量评分
2. 各维度表现分析
3. 教学优势和特色
4. 需要改进的方面
5. 具体改进建议
6. 专业发展建议

请以JSON格式返回：
{
  "teacherId": "${data.teacherId}",
  "evaluationDate": "评估日期",
  "overallRating": "整体评分",
  "qualityScore": "质量分数",
  "dimensions": {
    "studentPerformance": "学生表现评分",
    "teachingMethod": "教学方法评分",
    "studentSatisfaction": "学生满意度评分",
    "innovation": "教学创新评分"
  },
  "strengths": ["教学优势1", "教学优势2"],
  "areasForImprovement": ["改进方面1", "改进方面2"],
  "recommendations": [
    {
      "area": "改进领域",
      "suggestion": "具体建议",
      "priority": "优先级",
      "expectedImpact": "预期效果"
    }
  ],
  "professionalDevelopment": ["专业发展建议1", "专业发展建议2"]
}`
};

// 学习路径规划模板
const learningPathTemplate = {
    systemPrompt: `你是一名学习路径规划专家，能够根据学生情况和课程要求设计个性化的学习路径。
请基于学生的当前水平和学习目标，制定科学合理的学习计划。`,

    userPrompt: (data) => `
请为以下学生规划学习路径：

学生信息：
- 学生ID：${data.studentId}
- 当前年级：${data.grade}
- 目标学科：${data.subject}
- 当前水平：${data.currentLevel}
- 目标水平：${data.targetLevel}
- 可用学习时间：${data.availableTime}小时/周

学习状况：
- 已掌握知识点：${data.masteredTopics.join(', ')}
- 薄弱知识点：${data.weakTopics.join(', ')}
- 学习偏好：${data.learningPreferences}
- 学习目标：${data.learningGoals}

课程大纲：
${data.curriculum.map(module => `- ${module.name}: ${module.topics.join(', ')}`).join('\n')}

时间限制：
- 总学习周期：${data.totalWeeks}周
- 每周可用时间：${data.weeklyHours}小时
- 重要考试时间：${data.examDates.join(', ')}

请设计包含以下内容的学习路径：
1. 学习阶段划分
2. 每个阶段的学习目标
3. 具体的学习内容和顺序
4. 时间分配建议
5. 学习方法推荐
6. 评估检查点

请以JSON格式返回：
{
  "studentId": "${data.studentId}",
  "subject": "${data.subject}",
  "planDuration": "${data.totalWeeks}周",
  "learningPath": {
    "phases": [
      {
        "phaseNumber": 1,
        "phaseName": "阶段名称",
        "duration": "持续时间",
        "objectives": ["目标1", "目标2"],
        "topics": ["主题1", "主题2"],
        "activities": ["活动1", "活动2"],
        "resources": ["资源1", "资源2"],
        "assessments": ["评估方式1", "评估方式2"]
      }
    ]
  },
  "schedule": {
    "weeklyPlan": [
      {
        "week": 1,
        "focus": "学习重点",
        "timeAllocation": "时间分配",
        "milestones": ["里程碑1", "里程碑2"]
      }
    ]
  },
  "adaptiveSettings": {
    "difficultyAdjustment": "难度调整策略",
    "paceControl": "学习节奏控制",
    "reviewSchedule": "复习计划"
  },
  "successMetrics": ["成功指标1", "成功指标2"]
}`
};

module.exports = {
    lessonPlanTemplate,
    questionGenerationTemplate,
    answerAnalysisTemplate,
    personalizedExerciseTemplate,
    performanceAnalysisTemplate,
    knowledgeBaseQueryTemplate,
    teachingQualityTemplate,
    learningPathTemplate
};
