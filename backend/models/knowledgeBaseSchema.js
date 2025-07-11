const mongoose = require("mongoose");

const knowledgeBaseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    fileType: {
        type: String,
        enum: ['text', 'pdf', 'doc', 'ppt', 'video', 'audio'],
        default: 'text'
    },
    filePath: {
        type: String,
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'subject',
        required: true,
    },
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin',
        required: true,
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'teacher',
        required: true,
    },
    tags: [{
        type: String,
    }],
    isActive: {
        type: Boolean,
        default: true,
    },
    metadata: {
        fileSize: Number,
        duration: Number, // for video/audio files
        pageCount: Number, // for documents
    }
}, { timestamps: true });

// 创建文本搜索索引
knowledgeBaseSchema.index({ title: 'text', content: 'text', tags: 'text' });

module.exports = mongoose.model("knowledgeBase", knowledgeBaseSchema);
