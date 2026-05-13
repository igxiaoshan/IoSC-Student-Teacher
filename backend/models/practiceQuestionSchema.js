const mongoose = require('mongoose');

const practiceQuestionSchema = new mongoose.Schema({
    questionText: { type: String, required: true },
    questionType: {
        type: String,
        enum: ['选择题', '填空题', '简答题', '计算题', '编程题'],
        default: '选择题'
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'subject',
        required: true,
        index: true
    },
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin',
        required: true
    },
    difficulty: {
        type: String,
        enum: ['简单', '中等', '困难'],
        default: '中等',
        index: true
    },
    options: [{
        text: String,
        isCorrect: Boolean
    }],
    correctAnswer: { type: String, required: true },
    correctAnswerText: String,
    explanation: String,
    knowledgePoints: [String],
    points: { type: Number, default: 10 },
    // 填空题关键词（用于模糊匹配）
    acceptableAnswers: [String],
    // 来源标记
    source: {
        type: String,
        enum: ['dify', 'manual', 'import'],
        default: 'dify'
    },
    // 使用统计
    usageCount: { type: Number, default: 0 },
    correctRate: { type: Number, default: 0 },
    // 是否活跃可用
    isActive: { type: Boolean, default: true, index: true }
}, { timestamps: true });

practiceQuestionSchema.index({ subject: 1, difficulty: 1, questionType: 1 });
practiceQuestionSchema.index({ subject: 1, difficulty: 1, isActive: 1 });
practiceQuestionSchema.index({ knowledgePoints: 1 });

module.exports = mongoose.model('PracticeQuestion', practiceQuestionSchema);
