const mongoose = require("mongoose");

const lessonPlanSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    courseContent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'courseContent',
        required: true,
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'subject',
        required: true,
    },
    sclass: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'sclass',
        required: true,
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'teacher',
        required: true,
    },
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin',
        required: true,
    },
    scheduledDate: {
        type: Date,
        required: true,
    },
    duration: {
        type: Number, // in minutes
        required: true,
    },
    // 教学活动安排
    activities: [{
        title: String,
        description: String,
        type: {
            type: String,
            enum: ['lecture', 'discussion', 'practice', 'assessment', 'break'],
            required: true
        },
        duration: Number, // in minutes
        materials: [String],
        aiGenerated: {
            type: Boolean,
            default: false
        }
    }],
    // 知识点讲解
    knowledgePoints: [{
        title: String,
        content: String,
        importance: {
            type: String,
            enum: ['high', 'medium', 'low'],
            default: 'medium'
        },
        estimatedTime: Number, // in minutes
        teachingMethod: String,
        examples: [String]
    }],
    // 实训练习
    practicalExercises: [{
        title: String,
        description: String,
        type: {
            type: String,
            enum: ['coding', 'problem_solving', 'case_study', 'experiment', 'project']
        },
        difficulty: {
            type: String,
            enum: ['easy', 'medium', 'hard'],
            default: 'medium'
        },
        estimatedTime: Number,
        instructions: String,
        expectedOutcome: String,
        evaluationCriteria: [String]
    }],
    // AI生成标记
    aiGenerated: {
        type: Boolean,
        default: false,
    },
    aiPrompt: {
        type: String, // 存储生成时使用的AI提示
    },
    // 状态管理
    status: {
        type: String,
        enum: ['draft', 'ready', 'in_progress', 'completed', 'cancelled'],
        default: 'draft'
    },
    feedback: {
        studentFeedback: String,
        teacherNotes: String,
        improvements: [String]
    }
}, { timestamps: true });

module.exports = mongoose.model("lessonPlan", lessonPlanSchema);
