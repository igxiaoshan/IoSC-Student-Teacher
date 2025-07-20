const StudentCalendar = require('../models/studentCalendarSchema');
const Student = require('../models/studentSchema');
const Subject = require('../models/subjectSchema');
const Exam = require('../models/examSchema');
const Exercise = require('../models/exerciseSchema');
const PracticalExercise = require('../models/practicalExerciseSchema');
const difyService = require('../services/difyService');

/**
 * 获取学生日历
 */
const getStudentCalendar = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { startDate, endDate, view = 'month' } = req.query;

        // 验证学生存在
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: '学生不存在'
            });
        }

        // 查找或创建学生日历
        let calendar = await StudentCalendar.findOne({ student: studentId })
            .populate('events.relatedData.subject', 'subName subCode')
            .populate('events.relatedData.exam', 'title startTime endTime')
            .populate('events.relatedData.exercise', 'title description')
            .populate('events.relatedData.practicalExercise', 'title description');

        if (!calendar) {
            calendar = await StudentCalendar.createDefaultCalendar(studentId);
        }

        // 如果指定了日期范围，过滤事件
        let events = calendar.events;
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            events = calendar.getEventsByDateRange(start, end);
        }

        res.json({
            success: true,
            data: {
                calendar: {
                    ...calendar.toObject(),
                    events: events
                },
                statistics: calendar.statistics,
                settings: calendar.settings
            }
        });

    } catch (error) {
        console.error('获取学生日历错误:', error);
        res.status(500).json({
            success: false,
            message: '获取日历失败',
            error: error.message
        });
    }
};

/**
 * 同步课程到日历
 */
const syncCoursesToCalendar = async (req, res) => {
    try {
        const { studentId } = req.params;

        const student = await Student.findById(studentId)
            .populate('selectedSubjects.subject', 'subName subCode sessions');

        if (!student) {
            return res.status(404).json({
                success: false,
                message: '学生不存在'
            });
        }

        let calendar = await StudentCalendar.findOne({ student: studentId });
        if (!calendar) {
            calendar = await StudentCalendar.createDefaultCalendar(studentId);
        }

        // 清除现有的课程事件
        calendar.events = calendar.events.filter(event => event.eventType !== 'class');

        // 为每个选修科目创建课程事件
        const courseEvents = [];
        for (const selectedSubject of student.selectedSubjects) {
            if (selectedSubject.status === 'active') {
                const subject = selectedSubject.subject;
                
                // 创建每周的课程安排（示例：每周2次课）
                const sessionsPerWeek = Math.min(subject.sessions, 3);
                for (let i = 0; i < sessionsPerWeek; i++) {
                    const dayOfWeek = i * 2 + 1; // 周一、周三、周五
                    const startHour = 9 + i * 2; // 9:00, 11:00, 13:00
                    
                    courseEvents.push({
                        title: `${subject.subName} 课程`,
                        description: `${subject.subCode} - 常规课程`,
                        eventType: 'class',
                        startTime: getNextWeekday(dayOfWeek, startHour, 0),
                        endTime: getNextWeekday(dayOfWeek, startHour + 1, 30),
                        recurrence: {
                            type: 'weekly',
                            interval: 1,
                            daysOfWeek: [dayOfWeek]
                        },
                        relatedData: {
                            subject: subject._id
                        },
                        color: getSubjectColor(subject.subCode),
                        location: '教室待定',
                        reminders: [{
                            type: 'popup',
                            minutesBefore: 15
                        }]
                    });
                }
            }
        }

        calendar.events.push(...courseEvents);
        await calendar.save();

        res.json({
            success: true,
            message: `成功同步 ${courseEvents.length} 个课程事件`,
            data: {
                syncedEvents: courseEvents.length,
                totalEvents: calendar.events.length
            }
        });

    } catch (error) {
        console.error('同步课程到日历错误:', error);
        res.status(500).json({
            success: false,
            message: '同步课程失败',
            error: error.message
        });
    }
};

/**
 * 同步考试到日历
 */
const syncExamsToCalendar = async (req, res) => {
    try {
        const { studentId } = req.params;

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: '学生不存在'
            });
        }

        // 获取学生相关的考试
        const exams = await Exam.find({
            sclass: student.sclassName,
            status: { $in: ['published', 'active'] },
            startTime: { $gte: new Date() }
        }).populate('subject', 'subName subCode');

        let calendar = await StudentCalendar.findOne({ student: studentId });
        if (!calendar) {
            calendar = await StudentCalendar.createDefaultCalendar(studentId);
        }

        // 清除现有的考试事件
        calendar.events = calendar.events.filter(event => event.eventType !== 'exam');

        // 创建考试事件
        const examEvents = exams.map(exam => ({
            title: `${exam.subject.subName} 考试`,
            description: exam.description || `${exam.title} - ${exam.subject.subCode}`,
            eventType: 'exam',
            startTime: exam.startTime,
            endTime: exam.endTime,
            relatedData: {
                exam: exam._id,
                subject: exam.subject._id
            },
            priority: 'high',
            color: '#f44336',
            reminders: [
                { type: 'popup', minutesBefore: 60 },
                { type: 'popup', minutesBefore: 1440 } // 1 day before
            ]
        }));

        calendar.events.push(...examEvents);
        await calendar.save();

        res.json({
            success: true,
            message: `成功同步 ${examEvents.length} 个考试事件`,
            data: {
                syncedEvents: examEvents.length,
                exams: examEvents
            }
        });

    } catch (error) {
        console.error('同步考试到日历错误:', error);
        res.status(500).json({
            success: false,
            message: '同步考试失败',
            error: error.message
        });
    }
};

/**
 * 添加个人事件
 */
const addPersonalEvent = async (req, res) => {
    try {
        const { studentId } = req.params;
        const eventData = req.body;

        let calendar = await StudentCalendar.findOne({ student: studentId });
        if (!calendar) {
            calendar = await StudentCalendar.createDefaultCalendar(studentId);
        }

        // 验证事件数据
        const newEvent = {
            title: eventData.title,
            description: eventData.description || '',
            eventType: eventData.eventType || 'study_plan',
            startTime: new Date(eventData.startTime),
            endTime: new Date(eventData.endTime),
            isAllDay: eventData.isAllDay || false,
            priority: eventData.priority || 'medium',
            color: eventData.color || '#2196f3',
            location: eventData.location || '',
            reminders: eventData.reminders || [{
                type: 'popup',
                minutesBefore: 15
            }]
        };

        await calendar.addEvent(newEvent);

        res.json({
            success: true,
            message: '事件添加成功',
            data: {
                event: newEvent
            }
        });

    } catch (error) {
        console.error('添加个人事件错误:', error);
        res.status(500).json({
            success: false,
            message: '添加事件失败',
            error: error.message
        });
    }
};

/**
 * 更新事件状态
 */
const updateEventStatus = async (req, res) => {
    try {
        const { studentId, eventId } = req.params;
        const { status } = req.body;

        const calendar = await StudentCalendar.findOne({ student: studentId });
        if (!calendar) {
            return res.status(404).json({
                success: false,
                message: '日历不存在'
            });
        }

        await calendar.updateEventStatus(eventId, status);

        res.json({
            success: true,
            message: '事件状态更新成功'
        });

    } catch (error) {
        console.error('更新事件状态错误:', error);
        res.status(500).json({
            success: false,
            message: '更新事件状态失败',
            error: error.message
        });
    }
};

/**
 * 获取日历统计信息
 */
const getCalendarStatistics = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { timeRange = 'week' } = req.query;

        const calendar = await StudentCalendar.findOne({ student: studentId });
        if (!calendar) {
            return res.json({
                success: true,
                data: {
                    totalEvents: 0,
                    completedEvents: 0,
                    upcomingEvents: 0,
                    studyHours: 0
                }
            });
        }

        const now = new Date();
        let startDate;
        
        switch (timeRange) {
            case 'today':
                startDate = new Date(now);
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }

        const events = calendar.getEventsByDateRange(startDate, now);
        const upcomingEvents = calendar.upcomingEvents;

        const statistics = {
            totalEvents: events.length,
            completedEvents: events.filter(e => e.status === 'completed').length,
            upcomingEvents: upcomingEvents.length,
            studyHours: calendar.statistics.weeklyStudyHours,
            eventsByType: {
                class: events.filter(e => e.eventType === 'class').length,
                exam: events.filter(e => e.eventType === 'exam').length,
                assignment: events.filter(e => e.eventType === 'assignment').length,
                practice: events.filter(e => e.eventType === 'practice').length,
                study_plan: events.filter(e => e.eventType === 'study_plan').length
            }
        };

        res.json({
            success: true,
            data: statistics
        });

    } catch (error) {
        console.error('获取日历统计错误:', error);
        res.status(500).json({
            success: false,
            message: '获取统计信息失败',
            error: error.message
        });
    }
};

// 辅助函数：获取下一个指定星期几的日期
function getNextWeekday(dayOfWeek, hour, minute) {
    const date = new Date();
    const currentDay = date.getDay();
    const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7;
    
    date.setDate(date.getDate() + daysUntilTarget);
    date.setHours(hour, minute, 0, 0);
    
    return date;
}

// 辅助函数：根据科目代码获取颜色
function getSubjectColor(subCode) {
    const colors = [
        '#1976d2', '#388e3c', '#f57c00', '#7b1fa2',
        '#c2185b', '#00796b', '#5d4037', '#455a64'
    ];
    
    let hash = 0;
    for (let i = 0; i < subCode.length; i++) {
        hash = subCode.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
}

/**
 * AI生成学习计划
 */
const generateAIStudyPlan = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { timeRange = 'week', goals, preferences } = req.body;

        const student = await Student.findById(studentId)
            .populate('selectedSubjects.subject', 'subName subCode');

        if (!student) {
            return res.status(404).json({
                success: false,
                message: '学生不存在'
            });
        }

        // 构建AI提示
        const subjects = student.selectedSubjects
            .filter(sub => sub.status === 'active')
            .map(sub => sub.subject.subName)
            .join('、');

        const prompt = `请为学生制定一个${timeRange === 'week' ? '一周' : '一个月'}的学习计划。

学生信息:
- 选修科目: ${subjects}
- 学习目标: ${goals || '提高学习效率，掌握核心知识点'}
- 学习偏好: ${preferences || '均衡发展'}

请生成包含以下内容的学习计划:
1. 每日学习任务安排
2. 重点知识点复习时间
3. 练习和作业时间分配
4. 休息和娱乐时间安排

请以JSON格式返回，包含具体的时间安排和任务描述。`;

        // 调用AI服务
        const aiResponse = await difyService.generateResponse(prompt, {
            conversationId: null,
            user: studentId
        });

        if (!aiResponse.success) {
            throw new Error('AI服务调用失败');
        }

        // 解析AI响应并创建日历事件
        let studyPlan;
        try {
            studyPlan = JSON.parse(aiResponse.data.answer);
        } catch (parseError) {
            // 如果解析失败，创建一个基本的学习计划
            studyPlan = createBasicStudyPlan(subjects, timeRange);
        }

        // 获取或创建学生日历
        let calendar = await StudentCalendar.findOne({ student: studentId });
        if (!calendar) {
            calendar = await StudentCalendar.createDefaultCalendar(studentId);
        }

        // 清除现有的AI生成的学习计划事件
        calendar.events = calendar.events.filter(event =>
            event.eventType !== 'study_plan' || !event.isAIGenerated
        );

        // 创建新的学习计划事件
        const studyEvents = [];
        const startDate = new Date();
        const daysToGenerate = timeRange === 'week' ? 7 : 30;

        for (let i = 0; i < daysToGenerate; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);

            // 跳过周末（可选）
            if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
                continue;
            }

            // 为每天创建学习任务
            const dailyTasks = generateDailyTasks(subjects, currentDate);
            studyEvents.push(...dailyTasks);
        }

        calendar.events.push(...studyEvents);
        await calendar.save();

        res.json({
            success: true,
            message: `成功生成${timeRange === 'week' ? '一周' : '一个月'}的AI学习计划`,
            data: {
                generatedEvents: studyEvents.length,
                studyPlan: studyPlan,
                aiResponse: aiResponse.data.answer
            }
        });

    } catch (error) {
        console.error('生成AI学习计划错误:', error);
        res.status(500).json({
            success: false,
            message: '生成学习计划失败',
            error: error.message
        });
    }
};

// 辅助函数：创建基本学习计划
function createBasicStudyPlan(subjects, timeRange) {
    return {
        timeRange: timeRange,
        subjects: subjects,
        dailySchedule: {
            morning: '复习昨日内容',
            afternoon: '学习新知识点',
            evening: '完成练习和作业'
        }
    };
}

// 辅助函数：生成每日学习任务
function generateDailyTasks(subjects, date) {
    const tasks = [];
    const subjectList = subjects.split('、');

    // 早上复习时间 (8:00-9:00)
    if (subjectList.length > 0) {
        const morningSubject = subjectList[date.getDate() % subjectList.length];
        tasks.push({
            title: `${morningSubject} 复习`,
            description: '复习昨日学习内容，巩固知识点',
            eventType: 'study_plan',
            startTime: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 8, 0),
            endTime: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0),
            isAIGenerated: true,
            color: '#4caf50',
            priority: 'medium',
            aiMetadata: {
                generatedAt: new Date(),
                confidence: 0.8,
                suggestions: ['准备笔记本', '回顾重点概念']
            }
        });
    }

    // 下午学习时间 (14:00-16:00)
    if (subjectList.length > 1) {
        const afternoonSubject = subjectList[(date.getDate() + 1) % subjectList.length];
        tasks.push({
            title: `${afternoonSubject} 新课学习`,
            description: '学习新的知识点和概念',
            eventType: 'study_plan',
            startTime: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 14, 0),
            endTime: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 16, 0),
            isAIGenerated: true,
            color: '#2196f3',
            priority: 'high',
            aiMetadata: {
                generatedAt: new Date(),
                confidence: 0.9,
                suggestions: ['准备教材', '做好笔记']
            }
        });
    }

    // 晚上练习时间 (19:00-20:00)
    tasks.push({
        title: '练习和作业时间',
        description: '完成当日练习题和作业',
        eventType: 'study_plan',
        startTime: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 19, 0),
        endTime: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 20, 0),
        isAIGenerated: true,
        color: '#ff9800',
        priority: 'medium',
        aiMetadata: {
            generatedAt: new Date(),
            confidence: 0.7,
            suggestions: ['整理错题', '总结学习心得']
        }
    });

    return tasks;
}

module.exports = {
    getStudentCalendar,
    syncCoursesToCalendar,
    syncExamsToCalendar,
    addPersonalEvent,
    updateEventStatus,
    getCalendarStatistics,
    generateAIStudyPlan
};
