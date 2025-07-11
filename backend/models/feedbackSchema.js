const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
    // 反馈来源
    fromUser: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'fromUserType'
    },
    fromUserType: {
        type: String,
        required: true,
        enum: ['teacher', 'student', 'system'] // system表示AI生成的反馈
    },
    // 反馈目标
    toUser: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'toUserType'
    },
    toUserType: {
        type: String,
        enum: ['teacher', 'student']
    },
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin',
        required: true,
    },
    // 反馈类型
    feedbackType: {
        type: String,
        enum: [
            'answer_correction', 'learning_suggestion', 'performance_analysis',
            'teaching_improvement', 'content_feedback', 'system_recommendation',
            'peer_feedback', 'self_assessment'
        ],
        required: true,
    },
    // 关联的资源
    relatedResource: {
        resourceId: mongoose.Schema.Types.ObjectId,
        resourceType: String, // 'answer', 'exercise', 'exam', 'lesson_plan', etc.
    },
    // 反馈内容
    content: {
        title: String,
        message: {
            type: String,
            required: true,
        },
        // 结构化反馈内容
        structured: {
            // 错误定位
            errorLocation: {
                line: Number,
                column: Number,
                section: String,
                description: String
            },
            // 修正建议
            corrections: [{
                issue: String,
                suggestion: String,
                example: String,
                priority: String // 'high', 'medium', 'low'
            }],
            // 改进建议
            improvements: [{
                area: String,
                currentLevel: String,
                targetLevel: String,
                actionItems: [String],
                resources: [String]
            }],
            // 积极反馈
            strengths: [String],
            // 需要关注的点
            areasForImprovement: [String]
        }
    },
    // AI生成相关
    aiGenerated: {
        type: Boolean,
        default: false,
    },
    aiModel: {
        type: String, // 使用的AI模型名称
    },
    confidence: {
        type: Number, // AI生成反馈的置信度 0-1
        default: 1,
    },
    // 反馈状态
    status: {
        type: String,
        enum: ['pending', 'delivered', 'read', 'acknowledged', 'acted_upon'],
        default: 'pending'
    },
    // 优先级
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    // 反馈的有效性评估
    effectiveness: {
        helpful: Boolean,
        rating: Number, // 1-5
        userComment: String,
        followUpNeeded: Boolean
    },
    // 自动触发条件（用于系统自动反馈）
    triggerConditions: {
        scoreThreshold: Number,
        errorPattern: String,
        timeSpent: Number,
        attemptCount: Number
    },
    // 反馈的生命周期
    lifecycle: {
        createdAt: Date,
        deliveredAt: Date,
        readAt: Date,
        acknowledgedAt: Date,
        resolvedAt: Date,
        expiresAt: Date
    },
    // 标签和分类
    tags: [String],
    category: String,
    // 相关的学习目标
    learningObjectives: [String],
    // 跟进行动
    followUpActions: [{
        action: String,
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'followUpActions.assignedToType'
        },
        assignedToType: String,
        dueDate: Date,
        status: String,
        completedAt: Date
    }]
}, { timestamps: true });

// 创建索引
feedbackSchema.index({ toUser: 1, toUserType: 1, status: 1 });
feedbackSchema.index({ fromUser: 1, fromUserType: 1, createdAt: -1 });
feedbackSchema.index({ school: 1, feedbackType: 1, createdAt: -1 });
feedbackSchema.index({ 'relatedResource.resourceId': 1, 'relatedResource.resourceType': 1 });

module.exports = mongoose.model("feedback", feedbackSchema);
