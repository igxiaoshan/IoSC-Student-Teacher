const mongoose = require("mongoose");

const usageStatSchema = new mongoose.Schema({
    // 用户信息
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'userType'
    },
    userType: {
        type: String,
        required: true,
        enum: ['admin', 'teacher', 'student']
    },
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin',
        required: true,
    },
    // 时间维度
    date: {
        type: Date,
        required: true,
    },
    hour: {
        type: Number, // 0-23
        required: true,
    },
    dayOfWeek: {
        type: Number, // 0-6, 0=Sunday
        required: true,
    },
    // 活动类型
    activityType: {
        type: String,
        enum: [
            'login', 'logout',
            'lesson_plan_create', 'lesson_plan_edit', 'lesson_plan_view',
            'exam_create', 'exam_edit', 'exam_take', 'exam_grade',
            'practice_start', 'practice_complete', 'practice_abandon',
            'question_create', 'question_edit', 'question_answer',
            'ai_query', 'ai_generate_content', 'ai_analyze',
            'resource_upload', 'resource_download', 'resource_view',
            'dashboard_view', 'report_generate', 'analytics_view'
        ],
        required: true,
    },
    // 活动详情
    activityDetails: {
        module: String, // 'lesson_planning', 'assessment', 'practice', etc.
        action: String, // 'create', 'edit', 'view', 'delete', etc.
        resourceId: mongoose.Schema.Types.ObjectId,
        resourceType: String,
        duration: Number, // in seconds
        success: Boolean,
        errorMessage: String
    },
    // 会话信息
    sessionId: {
        type: String,
        required: true,
    },
    // 设备和环境信息
    deviceInfo: {
        userAgent: String,
        platform: String,
        browser: String,
        screenResolution: String,
        isMobile: Boolean
    },
    // IP地址（可选，用于地理位置分析）
    ipAddress: {
        type: String,
    },
    // 性能指标
    performance: {
        responseTime: Number, // in milliseconds
        loadTime: Number,
        errorCount: Number
    }
}, { timestamps: true });

// 创建索引用于高效查询
usageStatSchema.index({ user: 1, date: -1 });
usageStatSchema.index({ school: 1, date: -1 });
usageStatSchema.index({ activityType: 1, date: -1 });
usageStatSchema.index({ date: -1, hour: 1 });
usageStatSchema.index({ userType: 1, activityType: 1, date: -1 });

module.exports = mongoose.model("usageStat", usageStatSchema);
