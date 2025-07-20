const mongoose = require('mongoose');

// 学生日历事件Schema
const calendarEventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    // 事件类型
    eventType: {
        type: String,
        enum: [
            'class',           // 课程
            'exam',            // 考试
            'assignment',      // 作业
            'practice',        // 实训练习
            'study_plan',      // 个人学习计划
            'reminder',        // 提醒事件
            'ai_suggestion'    // AI建议
        ],
        required: true
    },
    // 开始时间
    startTime: {
        type: Date,
        required: true
    },
    // 结束时间
    endTime: {
        type: Date,
        required: true
    },
    // 是否全天事件
    isAllDay: {
        type: Boolean,
        default: false
    },
    // 重复设置
    recurrence: {
        type: {
            type: String,
            enum: ['none', 'daily', 'weekly', 'monthly'],
            default: 'none'
        },
        interval: {
            type: Number,
            default: 1
        },
        endDate: Date,
        daysOfWeek: [Number] // 0-6 (Sunday-Saturday)
    },
    // 关联的数据
    relatedData: {
        subject: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'subject'
        },
        exam: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'exam'
        },
        exercise: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'exercise'
        },
        practicalExercise: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'practicalExercise'
        }
    },
    // 提醒设置
    reminders: [{
        type: {
            type: String,
            enum: ['popup', 'email', 'push'],
            default: 'popup'
        },
        minutesBefore: {
            type: Number,
            default: 15
        },
        isEnabled: {
            type: Boolean,
            default: true
        }
    }],
    // 优先级
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    // 状态
    status: {
        type: String,
        enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'missed'],
        default: 'scheduled'
    },
    // 颜色标识
    color: {
        type: String,
        default: '#1976d2'
    },
    // 位置信息
    location: {
        type: String,
        trim: true
    },
    // 是否由AI生成
    isAIGenerated: {
        type: Boolean,
        default: false
    },
    // AI生成的相关信息
    aiMetadata: {
        generatedAt: Date,
        confidence: Number,
        suggestions: [String]
    }
});

// 学生日历Schema
const studentCalendarSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'student',
        required: true
    },
    // 日历设置
    settings: {
        // 默认视图
        defaultView: {
            type: String,
            enum: ['month', 'week', 'day', 'agenda'],
            default: 'month'
        },
        // 工作时间设置
        workingHours: {
            start: {
                type: String,
                default: '08:00'
            },
            end: {
                type: String,
                default: '18:00'
            }
        },
        // 周开始日
        weekStartsOn: {
            type: Number,
            min: 0,
            max: 6,
            default: 1 // Monday
        },
        // 时区
        timezone: {
            type: String,
            default: 'Asia/Shanghai'
        },
        // 通知设置
        notifications: {
            enabled: {
                type: Boolean,
                default: true
            },
            defaultReminder: {
                type: Number,
                default: 15 // minutes
            },
            emailNotifications: {
                type: Boolean,
                default: false
            }
        },
        // 显示设置
        display: {
            showWeekends: {
                type: Boolean,
                default: true
            },
            showCompletedTasks: {
                type: Boolean,
                default: false
            },
            compactView: {
                type: Boolean,
                default: false
            }
        }
    },
    // 日历事件
    events: [calendarEventSchema],
    // 学习目标
    learningGoals: [{
        title: String,
        description: String,
        targetDate: Date,
        progress: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },
        status: {
            type: String,
            enum: ['active', 'completed', 'paused', 'cancelled'],
            default: 'active'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    // 学习统计
    statistics: {
        totalStudyHours: {
            type: Number,
            default: 0
        },
        weeklyStudyHours: {
            type: Number,
            default: 0
        },
        completedTasks: {
            type: Number,
            default: 0
        },
        missedEvents: {
            type: Number,
            default: 0
        },
        lastUpdated: {
            type: Date,
            default: Date.now
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// 创建索引
studentCalendarSchema.index({ student: 1 });
studentCalendarSchema.index({ 'events.startTime': 1, 'events.endTime': 1 });
studentCalendarSchema.index({ 'events.eventType': 1, 'events.status': 1 });

// 虚拟字段：获取今日事件
studentCalendarSchema.virtual('todayEvents').get(function() {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    return this.events.filter(event => 
        event.startTime >= startOfDay && event.startTime <= endOfDay
    );
});

// 虚拟字段：获取即将到来的事件
studentCalendarSchema.virtual('upcomingEvents').get(function() {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return this.events.filter(event => 
        event.startTime >= now && event.startTime <= nextWeek
    ).sort((a, b) => a.startTime - b.startTime);
});

// 实例方法：添加事件
studentCalendarSchema.methods.addEvent = function(eventData) {
    this.events.push(eventData);
    return this.save();
};

// 实例方法：更新事件状态
studentCalendarSchema.methods.updateEventStatus = function(eventId, status) {
    const event = this.events.id(eventId);
    if (event) {
        event.status = status;
        return this.save();
    }
    return Promise.reject(new Error('Event not found'));
};

// 实例方法：获取指定日期范围的事件
studentCalendarSchema.methods.getEventsByDateRange = function(startDate, endDate) {
    return this.events.filter(event => 
        event.startTime >= startDate && event.startTime <= endDate
    ).sort((a, b) => a.startTime - b.startTime);
};

// 静态方法：为学生创建默认日历
studentCalendarSchema.statics.createDefaultCalendar = function(studentId) {
    return this.create({
        student: studentId,
        events: [],
        settings: {
            defaultView: 'month',
            workingHours: { start: '08:00', end: '18:00' },
            weekStartsOn: 1,
            timezone: 'Asia/Shanghai',
            notifications: {
                enabled: true,
                defaultReminder: 15,
                emailNotifications: false
            },
            display: {
                showWeekends: true,
                showCompletedTasks: false,
                compactView: false
            }
        }
    });
};

module.exports = mongoose.model('studentCalendar', studentCalendarSchema);
