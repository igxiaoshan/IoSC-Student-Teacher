const mongoose = require('mongoose');

const jimengGenerationSchema = new mongoose.Schema({
    // 用户信息
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'userType',
    },
    userType: {
        type: String,
        enum: ['Student', 'Teacher', 'Admin'],
        required: true,
    },

    // 生成类型
    type: {
        type: String,
        enum: ['image', 'video'],
        required: true,
    },

    // 任务信息
    taskId: {
        type: String,
        required: true,
    },

    // 用户输入的提示词
    prompt: {
        type: String,
        required: true,
    },

    // 生成的参数
    params: {
        width: Number,
        height: Number,
        steps: Number,
        guidance_scale: Number,
        duration: Number,  // 视频时长
        resolution: String,
        fps: Number,
    },

    // 生成状态
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending',
    },

    // 结果URL
    resultUrl: {
        type: String,
        default: null,
    },

    // 视频帧URL列表
    videoUrls: [{
        type: String,
    }],

    // 错误信息
    errorMessage: {
        type: String,
        default: null,
    },

    // 任务完成时间
    completedAt: {
        type: Date,
        default: null,
    },

    // 创建时间
    createdAt: {
        type: Date,
        default: Date.now,
    },

    // 更新时间
    updatedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

// 索引优化
jimengGenerationSchema.index({ userId: 1, type: 1, createdAt: -1 });
jimengGenerationSchema.index({ taskId: 1 });
jimengGenerationSchema.index({ status: 1 });
jimengGenerationSchema.index({ createdAt: -1 });

// 更新时间戳中间件
jimengGenerationSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const JimengGeneration = mongoose.model('JimengGeneration', jimengGenerationSchema);

module.exports = JimengGeneration;
