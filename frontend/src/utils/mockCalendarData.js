import {
    addDays,
    addHours,
    addMinutes,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    setHours,
    setMinutes
} from 'date-fns';

// 学科列表
const subjects = [
    '数学', '语文', '英语', '物理', '化学', '生物', 
    '历史', '地理', '政治', '计算机科学', '体育', '音乐'
];

// 事件类型配置
const eventTypes = {
    class: { label: '课程', color: '#2196f3', weight: 0.4 },
    exam: { label: '考试', color: '#f44336', weight: 0.1 },
    assignment: { label: '作业', color: '#ff9800', weight: 0.25 },
    practice: { label: '练习', color: '#4caf50', weight: 0.15 },
    study_plan: { label: '学习计划', color: '#9c27b0', weight: 0.08 },
    ai_suggestion: { label: 'AI建议', color: '#00bcd4', weight: 0.02 }
};

// 优先级配置
const priorities = {
    low: { weight: 0.4 },
    medium: { weight: 0.35 },
    high: { weight: 0.2 },
    urgent: { weight: 0.05 }
};

// 状态配置
const statuses = {
    scheduled: { weight: 0.5 },
    in_progress: { weight: 0.1 },
    completed: { weight: 0.35 },
    cancelled: { weight: 0.03 },
    missed: { weight: 0.02 }
};

// 课程时间表模板（周一到周五）- 每节课2小时
const classSchedule = [
    // 上午两节课
    { start: 8, end: 10, period: '第一节', type: 'morning', timeSlot: '上午第一节' },
    { start: 10, end: 12, period: '第二节', type: 'morning', timeSlot: '上午第二节' },

    // 下午两节课
    { start: 14, end: 16, period: '第三节', type: 'afternoon', timeSlot: '下午第一节' },
    { start: 16, end: 18, period: '第四节', type: 'afternoon', timeSlot: '下午第二节' },

    // 晚上一节课
    { start: 19, end: 21, period: '第五节', type: 'evening', timeSlot: '晚上课程' }
];

// 详细的时间段配置（适应2小时课程安排）
const detailedTimeSlots = [
    // 早晨时段
    { start: 6, startMin: 30, end: 7, endMin: 30, activity: '晨练', type: 'exercise', probability: 0.3 },
    { start: 7, startMin: 0, end: 8, endMin: 0, activity: '早餐时间', type: 'meal', probability: 0.8 },

    // 上午课程间隙（10:00-10:20 课间休息）
    { start: 10, startMin: 0, end: 10, endMin: 20, activity: '上午课间休息', type: 'break', probability: 0.8 },

    // 午餐和午休时段（12:00-14:00）
    { start: 12, startMin: 0, end: 13, endMin: 0, activity: '午餐时间', type: 'meal', probability: 0.9 },
    { start: 13, startMin: 0, end: 14, endMin: 0, activity: '午休时间', type: 'rest', probability: 0.7 },

    // 下午课程间隙（16:00-16:20 课间休息）
    { start: 16, startMin: 0, end: 16, endMin: 20, activity: '下午课间休息', type: 'break', probability: 0.8 },

    // 晚餐时段（18:00-19:00）
    { start: 18, startMin: 0, end: 19, endMin: 0, activity: '晚餐时间', type: 'meal', probability: 0.9 },

    // 晚上课程后时段
    { start: 21, startMin: 0, end: 22, endMin: 0, activity: '自习复习', type: 'study', probability: 0.6 },
    { start: 22, startMin: 0, end: 22, endMin: 30, activity: '洗漱准备', type: 'personal', probability: 0.8 },
    { start: 22, startMin: 30, end: 23, endMin: 0, activity: '就寝准备', type: 'personal', probability: 0.6 },
];

// 周末特殊活动模板
const weekendActivities = [
    { title: '图书馆学习', duration: 3, startHour: 9, type: 'study' },
    { title: '体育锻炼', duration: 1.5, startHour: 16, type: 'exercise' },
    { title: '社团活动', duration: 2, startHour: 14, type: 'club' },
    { title: '志愿服务', duration: 4, startHour: 9, type: 'volunteer' },
    { title: '兴趣班', duration: 2, startHour: 10, type: 'hobby' },
    { title: '购物外出', duration: 3, startHour: 14, type: 'personal' },
    { title: '朋友聚会', duration: 2, startHour: 19, type: 'social' },
    { title: '电影娱乐', duration: 2.5, startHour: 19, type: 'entertainment' }
];

// 作业类型模板
const assignmentTemplates = [
    '课后练习', '章节复习', '单元测试', '实验报告', '读书笔记',
    '作文写作', '数学题集', '英语听力', '物理实验', '化学方程式',
    '历史论文', '地理调研', '政治时事', '编程作业', '体能训练'
];

// 考试类型模板
const examTemplates = [
    '期中考试', '期末考试', '月考', '周测', '单元测试',
    '模拟考试', '竞赛初赛', '竞赛复赛', '口语考试', '实验考核'
];

// 学习计划模板
const studyPlanTemplates = [
    '复习计划', '预习安排', '错题整理', '知识点梳理', '专题训练',
    '阅读计划', '背诵任务', '练习计划', '总结归纳', '拓展学习'
];

// 随机选择函数（基于权重）
function weightedRandom(options) {
    const weights = Object.values(options).map(opt => opt.weight);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    const keys = Object.keys(options);
    for (let i = 0; i < keys.length; i++) {
        random -= options[keys[i]].weight;
        if (random <= 0) {
            return keys[i];
        }
    }
    return keys[0];
}

// 生成随机时间
function randomTime(baseDate, startHour = 8, endHour = 21) {
    const hour = Math.floor(Math.random() * (endHour - startHour)) + startHour;
    const minute = Math.random() < 0.5 ? 0 : 30;
    return setMinutes(setHours(baseDate, hour), minute);
}

// 生成课程事件（2小时课程）
function generateClassEvent(date, subject, timeSlot) {
    const startTime = setMinutes(setHours(date, timeSlot.start), 0);
    const endTime = setMinutes(setHours(date, timeSlot.end), 0);

    // 增强课程信息
    const teachers = ['张教授', '李老师', '王副教授', '刘老师', '陈教授', '杨老师', '赵副教授', '孙老师'];
    const teacher = teachers[Math.floor(Math.random() * teachers.length)];

    // 根据课程类型分配教室
    const classroomsByType = {
        morning: ['A101大教室', 'A102大教室', 'A201阶梯教室', 'A202阶梯教室'],
        afternoon: ['B101教室', 'B102教室', 'B201教室', 'B202教室', '实验室A', '实验室B'],
        evening: ['C101教室', 'C102教室', '多媒体教室1', '多媒体教室2', '讨论室1', '讨论室2']
    };
    const availableClassrooms = classroomsByType[timeSlot.type] || ['教室'];
    const classroom = availableClassrooms[Math.floor(Math.random() * availableClassrooms.length)];

    // 课程内容描述
    const courseContents = {
        morning: '理论讲授为主，重点知识点详解',
        afternoon: '实践操作结合理论，案例分析',
        evening: '复习巩固，答疑解惑，小组讨论'
    };

    return {
        _id: `class_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: `${subject} - ${timeSlot.timeSlot}`,
        description: `${subject}课程（2小时），${timeSlot.timeSlot}。授课教师：${teacher}。${courseContents[timeSlot.type]}`,
        eventType: 'class',
        subject: subject,
        teacher: teacher,
        startTime: startTime,
        endTime: endTime,
        location: classroom,
        duration: 2, // 2小时课程
        priority: timeSlot.type === 'evening' ? 'medium' : 'high',
        status: date < new Date() ? (Math.random() < 0.92 ? 'completed' : 'missed') : 'scheduled',
        color: eventTypes.class.color,
        isRecurring: true,
        recurringPattern: 'weekly',
        timeSlotType: timeSlot.type,
        timeSlotName: timeSlot.timeSlot,
        attendanceRequired: true,
        materials: [`${subject}教材`, `${subject}课件`, '笔记本', '文具'],
        courseContent: courseContents[timeSlot.type],
        hasBreak: true, // 2小时课程中间有休息
        breakTime: '中间休息10分钟'
    };
}

// 生成详细时间段事件
function generateDetailedTimeSlotEvent(date, timeSlot) {
    const startTime = setMinutes(setHours(date, timeSlot.start), timeSlot.startMin || 0);
    const endTime = setMinutes(setHours(date, timeSlot.end), timeSlot.endMin || 0);

    const locations = {
        meal: ['食堂一楼', '食堂二楼', '学生餐厅', '教工餐厅'],
        exercise: ['操场', '体育馆', '健身房', '游泳池'],
        break: ['教室', '图书馆', '休息区', '咖啡厅'],
        rest: ['宿舍', '休息室', '图书馆休息区'],
        activity: ['社团活动室', '多功能厅', '操场', '艺术中心'],
        study: ['图书馆', '自习室', '宿舍', '学习中心'],
        personal: ['宿舍', '洗浴中心', '超市', '银行']
    };

    const location = locations[timeSlot.type] ?
        locations[timeSlot.type][Math.floor(Math.random() * locations[timeSlot.type].length)] :
        '校园内';

    return {
        _id: `timeslot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: timeSlot.activity,
        description: `${timeSlot.activity}时间，保持良好的生活节奏`,
        eventType: 'daily_routine',
        startTime: startTime,
        endTime: endTime,
        location: location,
        priority: timeSlot.type === 'meal' ? 'high' : 'low',
        status: date < new Date() ? 'completed' : 'scheduled',
        color: getRoutineColor(timeSlot.type),
        isRoutine: true,
        routineType: timeSlot.type
    };
}

// 获取日常活动颜色
function getRoutineColor(type) {
    const colors = {
        meal: '#ff7043',      // 橙红色 - 用餐
        exercise: '#66bb6a',  // 绿色 - 运动
        break: '#42a5f5',     // 蓝色 - 休息
        rest: '#ab47bc',      // 紫色 - 午休
        activity: '#ffa726',  // 橙色 - 活动
        study: '#5c6bc0',     // 靛蓝色 - 学习
        personal: '#78909c'   // 灰蓝色 - 个人事务
    };
    return colors[type] || '#757575';
}

// 生成周末活动事件
function generateWeekendActivityEvent(date, activity) {
    const startTime = setMinutes(setHours(date, activity.startHour), Math.random() < 0.5 ? 0 : 30);
    const endTime = addHours(startTime, activity.duration);

    const locations = {
        study: ['图书馆', '自习室', '咖啡厅学习区', '宿舍'],
        exercise: ['体育馆', '操场', '健身房', '游泳池', '篮球场'],
        club: ['社团活动室', '多功能厅', '音乐教室', '美术教室'],
        volunteer: ['社区服务中心', '敬老院', '小学', '环保站'],
        hobby: ['艺术中心', '手工教室', '音乐室', '舞蹈室'],
        personal: ['商场', '超市', '银行', '邮局'],
        social: ['咖啡厅', '餐厅', '公园', '电影院'],
        entertainment: ['电影院', '游戏厅', 'KTV', '保龄球馆']
    };

    const location = locations[activity.type] ?
        locations[activity.type][Math.floor(Math.random() * locations[activity.type].length)] :
        '校外';

    return {
        _id: `weekend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: activity.title,
        description: `周末${activity.title}，丰富课余生活，提升个人素养`,
        eventType: 'weekend_activity',
        startTime: startTime,
        endTime: endTime,
        location: location,
        priority: activity.type === 'study' ? 'medium' : 'low',
        status: date < new Date() ? (Math.random() < 0.8 ? 'completed' : 'cancelled') : 'scheduled',
        color: getWeekendActivityColor(activity.type),
        activityType: activity.type,
        isWeekendActivity: true
    };
}

// 获取周末活动颜色
function getWeekendActivityColor(type) {
    const colors = {
        study: '#5c6bc0',        // 靛蓝色 - 学习
        exercise: '#66bb6a',     // 绿色 - 运动
        club: '#ff7043',         // 橙红色 - 社团
        volunteer: '#ab47bc',    // 紫色 - 志愿
        hobby: '#ffa726',        // 橙色 - 兴趣
        personal: '#78909c',     // 灰蓝色 - 个人
        social: '#ec407a',       // 粉色 - 社交
        entertainment: '#26c6da' // 青色 - 娱乐
    };
    return colors[type] || '#757575';
}

// 生成作业事件
function generateAssignmentEvent(date, subject) {
    const template = assignmentTemplates[Math.floor(Math.random() * assignmentTemplates.length)];
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

    // 工作日晚上或周末任意时间
    const startTime = isWeekend ?
        randomTime(date, 9, 21) :
        randomTime(date, 19, 22);

    const duration = Math.random() < 0.7 ? 1 : 2; // 1-2小时
    const endTime = addHours(startTime, duration);

    const locations = ['宿舍', '图书馆', '自习室', '咖啡厅学习区'];
    const location = locations[Math.floor(Math.random() * locations.length)];

    // 作业难度和预估时间
    const difficulties = ['简单', '中等', '困难', '挑战'];
    const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];

    return {
        _id: `assignment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: `${subject} - ${template}`,
        description: `完成${subject}的${template}，难度：${difficulty}。注意截止时间和质量要求。`,
        eventType: 'assignment',
        subject: subject,
        startTime: startTime,
        endTime: endTime,
        location: location,
        priority: difficulty === '挑战' ? 'urgent' :
                 difficulty === '困难' ? 'high' :
                 difficulty === '中等' ? 'medium' : 'low',
        status: date < new Date() ?
                (Math.random() < 0.85 ? 'completed' : 'missed') :
                'scheduled',
        color: eventTypes.assignment.color,
        dueDate: addDays(date, Math.floor(Math.random() * 7) + 1),
        difficulty: difficulty,
        estimatedHours: duration,
        materials: [`${subject}教材`, '参考资料', '计算器', '笔记本'],
        submissionMethod: Math.random() < 0.6 ? '在线提交' : '纸质提交'
    };
}

// 生成考试事件
function generateExamEvent(date, subject) {
    const template = examTemplates[Math.floor(Math.random() * examTemplates.length)];
    const startTime = randomTime(date, 9, 16);
    const duration = Math.random() < 0.5 ? 2 : 2.5; // 2-2.5小时
    const endTime = addHours(startTime, duration);
    
    return {
        _id: `exam_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: `${subject} - ${template}`,
        description: `${subject}${template}，请提前准备相关资料`,
        eventType: 'exam',
        subject: subject,
        startTime: startTime,
        endTime: endTime,
        location: `考场${Math.floor(Math.random() * 10) + 1}`,
        priority: 'high',
        status: date < new Date() ? 'completed' : 'scheduled',
        color: eventTypes.exam.color,
        examType: template,
        totalScore: Math.random() < 0.5 ? 100 : 150
    };
}

// 生成练习事件
function generatePracticeEvent(date, subject) {
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const practiceTypes = [
        '专项练习', '错题回顾', '知识点巩固', '模拟测试',
        '速度训练', '理解加深', '技能提升', '综合练习'
    ];
    const practiceType = practiceTypes[Math.floor(Math.random() * practiceTypes.length)];

    // 工作日下午或晚上，周末任意时间
    const startTime = isWeekend ?
        randomTime(date, 10, 20) :
        randomTime(date, 15, 21);

    const duration = Math.random() < 0.6 ? 0.5 : 1; // 30分钟或1小时
    const endTime = addHours(startTime, duration);

    const locations = ['自习室', '图书馆', '宿舍', '学习中心', '实验室'];
    const location = locations[Math.floor(Math.random() * locations.length)];

    const difficulties = ['基础', '进阶', '提高', '竞赛'];
    const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];

    const topics = {
        '数学': ['函数', '几何', '代数', '概率', '微积分'],
        '英语': ['语法', '词汇', '阅读', '写作', '听力'],
        '物理': ['力学', '电学', '光学', '热学', '原子物理'],
        '化学': ['有机化学', '无机化学', '物理化学', '分析化学'],
        '语文': ['古诗词', '现代文', '文言文', '作文', '语言文字运用']
    };
    const topic = topics[subject] ?
        topics[subject][Math.floor(Math.random() * topics[subject].length)] :
        '综合知识';

    return {
        _id: `practice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: `${subject} - ${practiceType}`,
        description: `${subject}${practiceType}，重点：${topic}，难度：${difficulty}`,
        eventType: 'practice',
        subject: subject,
        practiceType: practiceType,
        topic: topic,
        startTime: startTime,
        endTime: endTime,
        location: location,
        priority: difficulty === '竞赛' ? 'high' :
                 difficulty === '提高' ? 'medium' : 'low',
        status: date < new Date() ?
                (Math.random() < 0.8 ? 'completed' : 'in_progress') :
                'scheduled',
        color: eventTypes.practice.color,
        difficulty: difficulty,
        expectedScore: Math.floor(Math.random() * 40) + 60, // 60-100分
        actualScore: date < new Date() ? Math.floor(Math.random() * 40) + 60 : null,
        materials: [`${subject}练习册`, '错题本', '参考答案'],
        reviewRequired: Math.random() < 0.7
    };
}

// 生成学习计划事件
function generateStudyPlanEvent(date, subject) {
    const template = studyPlanTemplates[Math.floor(Math.random() * studyPlanTemplates.length)];
    const startTime = randomTime(date, 18, 21);
    const duration = Math.random() < 0.7 ? 1 : 1.5; // 1-1.5小时
    const endTime = addHours(startTime, duration);
    
    return {
        _id: `study_plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: `${subject} - ${template}`,
        description: `${subject}的${template}，系统性学习提升`,
        eventType: 'study_plan',
        subject: subject,
        startTime: startTime,
        endTime: endTime,
        location: '图书馆/宿舍',
        priority: weightedRandom(priorities),
        status: weightedRandom(statuses),
        color: eventTypes.study_plan.color,
        planType: template,
        progress: Math.floor(Math.random() * 100)
    };
}

// 生成AI建议事件
function generateAISuggestionEvent(date) {
    const suggestions = [
        '复习薄弱知识点', '制定学习计划', '调整学习方法', 
        '增加练习时间', '预习新课程', '整理错题本'
    ];
    const suggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
    const startTime = randomTime(date, 20, 22);
    const endTime = addMinutes(startTime, 30);
    
    return {
        _id: `ai_suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: `AI建议 - ${suggestion}`,
        description: `基于学习数据分析，建议您${suggestion}`,
        eventType: 'ai_suggestion',
        startTime: startTime,
        endTime: endTime,
        location: '个人学习',
        priority: 'medium',
        status: Math.random() < 0.3 ? 'completed' : 'scheduled',
        color: eventTypes.ai_suggestion.color,
        aiConfidence: Math.floor(Math.random() * 30) + 70, // 70-100%
        suggestionType: suggestion
    };
}

// 特殊日期配置
const specialDates = [
    { month: 1, day: 1, title: '元旦假期', type: 'holiday' },
    { month: 2, day: 14, title: '情人节活动', type: 'activity' },
    { month: 3, day: 8, title: '妇女节庆祝', type: 'activity' },
    { month: 4, day: 5, title: '清明节假期', type: 'holiday' },
    { month: 5, day: 1, title: '劳动节假期', type: 'holiday' },
    { month: 6, day: 1, title: '儿童节活动', type: 'activity' },
    { month: 9, day: 10, title: '教师节庆祝', type: 'activity' },
    { month: 10, day: 1, title: '国庆节假期', type: 'holiday' },
    { month: 12, day: 25, title: '圣诞节活动', type: 'activity' }
];

// 生成特殊日期事件
function generateSpecialDateEvent(date, specialDate) {
    const startTime = setMinutes(setHours(date, 14), 0);
    const endTime = setMinutes(setHours(date, 16), 0);

    return {
        _id: `special_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: specialDate.title,
        description: `${specialDate.title}相关活动安排`,
        eventType: specialDate.type === 'holiday' ? 'reminder' : 'activity',
        startTime: startTime,
        endTime: endTime,
        location: specialDate.type === 'holiday' ? '放假' : '学校礼堂',
        priority: 'medium',
        status: date < new Date() ? 'completed' : 'scheduled',
        color: specialDate.type === 'holiday' ? '#ff5722' : '#673ab7',
        isSpecial: true,
        specialType: specialDate.type
    };
}

// 生成密集的日程安排（特别适合日视图）
function generateDenseSchedule(date) {
    const events = [];
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (!isWeekend) {
        // 工作日密集安排

        // 早晨安排 (6:00-8:00)
        if (Math.random() < 0.4) {
            events.push({
                _id: `morning_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                title: '晨练',
                description: '晨跑或体操，保持身体健康',
                eventType: 'exercise',
                startTime: setMinutes(setHours(date, 6), 30),
                endTime: setMinutes(setHours(date, 7), 30),
                location: '操场',
                priority: 'low',
                status: date < new Date() ? 'completed' : 'scheduled',
                color: '#66bb6a'
            });
        }

        // 课间休息时间（适应2小时课程）
        const breaks = [
            { start: 10, startMin: 0, end: 10, endMin: 20, title: '上午课间休息', description: '第一、二节课之间的休息时间' },
            { start: 16, startMin: 0, end: 16, endMin: 20, title: '下午课间休息', description: '第三、四节课之间的休息时间' }
        ];

        breaks.forEach(breakTime => {
            if (Math.random() < 0.8) { // 提高概率，因为2小时课程更需要休息
                events.push({
                    _id: `break_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    title: breakTime.title,
                    description: breakTime.description + '，放松身心，准备下一节课',
                    eventType: 'break',
                    startTime: setMinutes(setHours(date, breakTime.start), breakTime.startMin),
                    endTime: setMinutes(setHours(date, breakTime.end), breakTime.endMin),
                    location: '教室外/休息区/咖啡厅',
                    priority: 'medium', // 2小时课程后的休息更重要
                    status: date < new Date() ? 'completed' : 'scheduled',
                    color: '#42a5f5',
                    isImportant: true,
                    restType: 'course_break'
                });
            }
        });

        // 晚间学习时段（21:00-23:00，晚课结束后）
        const eveningStudySessions = [
            { start: 21, end: 22, subject: '复习今日课程', description: '回顾今天5节课的重点内容' },
            { start: 22, end: 23, subject: '预习作业', description: '预习明日课程或完成课后作业' }
        ];

        eveningStudySessions.forEach((session, index) => {
            if (Math.random() < 0.7) { // 考虑到已经上了5节课，晚间学习概率适当降低
                const subject = subjects[Math.floor(Math.random() * subjects.length)];
                events.push({
                    _id: `evening_study_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
                    title: `${session.subject} - ${subject}`,
                    description: `晚间自习：${session.description}`,
                    eventType: 'study',
                    subject: subject,
                    startTime: setMinutes(setHours(date, session.start), 0),
                    endTime: setMinutes(setHours(date, session.end), 0),
                    location: '宿舍/图书馆/自习室',
                    priority: 'medium',
                    status: date < new Date() ?
                            (Math.random() < 0.8 ? 'completed' : 'in_progress') :
                            'scheduled',
                    color: '#5c6bc0',
                    studyType: 'evening_self_study',
                    intensity: 'light' // 考虑到白天已经上了10小时课
                });
            }
        });
    } else {
        // 周末更灵活的安排

        // 睡懒觉时间
        if (Math.random() < 0.6) {
            events.push({
                _id: `sleep_in_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                title: '睡懒觉',
                description: '周末放松，充分休息',
                eventType: 'rest',
                startTime: setMinutes(setHours(date, 8), 0),
                endTime: setMinutes(setHours(date, 9), 30),
                location: '宿舍',
                priority: 'low',
                status: date < new Date() ? 'completed' : 'scheduled',
                color: '#ab47bc'
            });
        }

        // 周末大扫除
        if (Math.random() < 0.3) {
            events.push({
                _id: `cleaning_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                title: '宿舍大扫除',
                description: '整理宿舍，保持环境整洁',
                eventType: 'personal',
                startTime: setMinutes(setHours(date, 10), 0),
                endTime: setMinutes(setHours(date, 11), 30),
                location: '宿舍',
                priority: 'medium',
                status: date < new Date() ? 'completed' : 'scheduled',
                color: '#78909c'
            });
        }
    }

    return events;
}

// 主要的mock数据生成函数
export function generateMockCalendarData(startDate, endDate) {
    const events = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay(); // 0=周日, 1=周一, ..., 6=周六
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        // 工作日生成课程和详细时间安排
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            // 每天5节课（上午2节，下午2节，晚上1节），每节2小时
            // 根据不同情况决定是否上满5节课
            const shouldHaveFullSchedule = Math.random() < 0.8; // 80%概率上满课

            if (shouldHaveFullSchedule) {
                // 完整的5节课安排
                classSchedule.forEach(slot => {
                    const subject = subjects[Math.floor(Math.random() * subjects.length)];
                    events.push(generateClassEvent(new Date(currentDate), subject, slot));
                });
            } else {
                // 部分课程安排（4节课，通常不上晚课）
                const daytimeSlots = classSchedule.filter(slot => slot.type !== 'evening');
                daytimeSlots.forEach(slot => {
                    const subject = subjects[Math.floor(Math.random() * subjects.length)];
                    events.push(generateClassEvent(new Date(currentDate), subject, slot));
                });
            }

            // 添加详细的日常时间段事件
            detailedTimeSlots.forEach(timeSlot => {
                if (Math.random() < timeSlot.probability) {
                    events.push(generateDetailedTimeSlotEvent(new Date(currentDate), timeSlot));
                }
            });

            // 工作日额外生成2-4个学习相关事件
            const extraEventCount = Math.floor(Math.random() * 3) + 2;
            for (let i = 0; i < extraEventCount; i++) {
                const eventType = weightedRandom(eventTypes);
                const subject = subjects[Math.floor(Math.random() * subjects.length)];

                switch (eventType) {
                    case 'assignment':
                        if (Math.random() < 0.8) {
                            events.push(generateAssignmentEvent(new Date(currentDate), subject));
                        }
                        break;
                    case 'practice':
                        if (Math.random() < 0.6) {
                            events.push(generatePracticeEvent(new Date(currentDate), subject));
                        }
                        break;
                    case 'study_plan':
                        if (Math.random() < 0.4) {
                            events.push(generateStudyPlanEvent(new Date(currentDate), subject));
                        }
                        break;
                    case 'ai_suggestion':
                        if (Math.random() < 0.15) {
                            events.push(generateAISuggestionEvent(new Date(currentDate)));
                        }
                        break;
                    default:
                        break;
                }
            }
        }

        // 周末生成丰富的活动安排
        if (isWeekend) {
            // 基础的日常时间段（用餐、休息等）
            const weekendRoutines = detailedTimeSlots.filter(slot =>
                ['meal', 'exercise', 'personal'].includes(slot.type)
            );
            weekendRoutines.forEach(timeSlot => {
                if (Math.random() < timeSlot.probability * 0.8) { // 周末概率稍低
                    events.push(generateDetailedTimeSlotEvent(new Date(currentDate), timeSlot));
                }
            });

            // 周末特色活动 2-4个
            const weekendActivityCount = Math.floor(Math.random() * 3) + 2;
            const selectedActivities = weekendActivities
                .sort(() => Math.random() - 0.5)
                .slice(0, weekendActivityCount);

            selectedActivities.forEach(activity => {
                events.push(generateWeekendActivityEvent(new Date(currentDate), activity));
            });

            // 周末学习相关事件 1-2个
            const studyEventCount = Math.floor(Math.random() * 2) + 1;
            for (let i = 0; i < studyEventCount; i++) {
                const eventTypes = ['assignment', 'practice', 'study_plan'];
                const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
                const subject = subjects[Math.floor(Math.random() * subjects.length)];

                switch (eventType) {
                    case 'assignment':
                        events.push(generateAssignmentEvent(new Date(currentDate), subject));
                        break;
                    case 'practice':
                        events.push(generatePracticeEvent(new Date(currentDate), subject));
                        break;
                    case 'study_plan':
                        events.push(generateStudyPlanEvent(new Date(currentDate), subject));
                        break;
                    default:
                        break;
                }
            }
        }

        // 随机生成考试（较低概率）
        if (Math.random() < 0.08) { // 8%概率有考试
            const subject = subjects[Math.floor(Math.random() * subjects.length)];
            events.push(generateExamEvent(new Date(currentDate), subject));
        }

        // 添加密集的日程安排（特别适合日视图和周视图）
        const denseEvents = generateDenseSchedule(new Date(currentDate));
        events.push(...denseEvents);

        // 检查是否是特殊日期
        const month = currentDate.getMonth() + 1;
        const day = currentDate.getDate();
        const specialDate = specialDates.find(sd => sd.month === month && sd.day === day);
        if (specialDate) {
            events.push(generateSpecialDateEvent(new Date(currentDate), specialDate));
        }

        currentDate.setDate(currentDate.getDate() + 1);
    }

    return events.sort((a, b) => a.startTime - b.startTime);
}

// 生成课程表信息（用于展示完整的课程安排）
export function generateCourseScheduleInfo() {
    return {
        dailySchedule: {
            morning: {
                slot1: { time: '08:00-10:00', duration: '2小时', break: '10:00-10:20 (20分钟休息)' },
                slot2: { time: '10:20-12:20', duration: '2小时', break: '12:20-14:00 (午餐午休)' }
            },
            afternoon: {
                slot3: { time: '14:00-16:00', duration: '2小时', break: '16:00-16:20 (20分钟休息)' },
                slot4: { time: '16:20-18:20', duration: '2小时', break: '18:20-19:00 (晚餐时间)' }
            },
            evening: {
                slot5: { time: '19:00-21:00', duration: '2小时', break: '21:00后自由安排' }
            }
        },
        totalHours: 10,
        totalSlots: 5,
        breakTimes: ['10:00-10:20', '12:20-14:00', '16:00-16:20', '18:20-19:00'],
        studyIntensity: 'high',
        recommendedActivities: {
            afterClass: ['复习笔记', '整理资料', '小组讨论'],
            evening: ['轻松复习', '预习明日课程', '完成作业'],
            weekend: ['深度学习', '项目实践', '知识总结']
        }
    };
}

// 生成统计数据
export function generateMockStatistics(events) {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    
    // 本周事件
    const weekEvents = events.filter(event => 
        event.startTime >= weekStart && event.startTime <= weekEnd
    );
    
    // 本月事件
    const monthEvents = events.filter(event => 
        event.startTime >= monthStart && event.startTime <= monthEnd
    );
    
    // 已完成事件
    const completedEvents = events.filter(event => event.status === 'completed');
    const weekCompletedEvents = weekEvents.filter(event => event.status === 'completed');
    
    // 即将到来的事件
    const upcomingEvents = events.filter(event => 
        event.startTime > now && event.status === 'scheduled'
    );
    
    // 计算学习时长（小时）
    const studyHours = completedEvents.reduce((total, event) => {
        const duration = (event.endTime - event.startTime) / (1000 * 60 * 60);
        return total + duration;
    }, 0);
    
    return {
        totalEvents: weekEvents.length,
        completedEvents: weekCompletedEvents.length,
        upcomingEvents: upcomingEvents.slice(0, 10).length,
        studyHours: Math.round(studyHours * 10) / 10,
        
        // 详细统计
        monthlyStats: {
            totalEvents: monthEvents.length,
            completedEvents: monthEvents.filter(e => e.status === 'completed').length,
            completionRate: monthEvents.length > 0 ? 
                Math.round((monthEvents.filter(e => e.status === 'completed').length / monthEvents.length) * 100) : 0
        },
        
        // 按类型统计
        eventsByType: events.reduce((acc, event) => {
            acc[event.eventType] = (acc[event.eventType] || 0) + 1;
            return acc;
        }, {}),
        
        // 按学科统计
        eventsBySubject: events.reduce((acc, event) => {
            if (event.subject) {
                acc[event.subject] = (acc[event.subject] || 0) + 1;
            }
            return acc;
        }, {}),
        
        // 学习效率指标
        efficiency: {
            averageStudyTime: studyHours / Math.max(completedEvents.length, 1),
            completionRate: events.length > 0 ? 
                Math.round((completedEvents.length / events.length) * 100) : 0,
            punctualityRate: Math.floor(Math.random() * 20) + 80 // 80-100%
        }
    };
}
