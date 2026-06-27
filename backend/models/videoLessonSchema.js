// backend/models/videoLessonSchema.js
const mongoose = require('mongoose');

const subtitleCueSchema = new mongoose.Schema({
    startTime: { type: String, required: true }, // "00:00:05.000"
    endTime:   { type: String, required: true }, // "00:00:10.000"
    text:      { type: String, required: true },
}, { _id: false });

const videoLessonSchema = new mongoose.Schema({
    teacherId:    { type: mongoose.Schema.Types.ObjectId, ref: 'teacher', required: true },
    title:        { type: String, required: true, trim: true },
    description:  { type: String, default: '' },
    // 视频文件
    fileName:     { type: String, required: true },   // 磁盘文件名
    originalName: { type: String, required: true },   // 原始文件名
    fileSize:     { type: Number },                   // bytes
    duration:     { type: Number, default: 0 },       // 秒，前端传入
    mimeType:     { type: String },
    // 字幕
    subtitleStatus: {
        type: String,
        enum: ['none', 'generating', 'done', 'failed'],
        default: 'none'
    },
    subtitleCues:   { type: [subtitleCueSchema], default: [] },
    subtitleVtt:    { type: String, default: '' },    // 完整 WebVTT 内容（冗余存储，方便直接下载）
    // 教师输入的内容描述（用于 AI 字幕生成）
    contentScript:  { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('videoLesson', videoLessonSchema);
