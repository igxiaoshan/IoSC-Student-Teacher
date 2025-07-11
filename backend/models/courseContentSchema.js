const mongoose = require("mongoose");

const courseContentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
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
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin',
        required: true,
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'teacher',
        required: true,
    },
    outline: {
        type: String,
        required: true,
    },
    learningObjectives: [{
        objective: String,
        level: {
            type: String,
            enum: ['basic', 'intermediate', 'advanced'],
            default: 'basic'
        }
    }],
    prerequisites: [{
        type: String,
    }],
    estimatedDuration: {
        type: Number, // in minutes
        required: true,
    },
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner'
    },
    contentType: {
        type: String,
        enum: ['theory', 'practical', 'mixed'],
        default: 'mixed'
    },
    resources: [{
        title: String,
        type: {
            type: String,
            enum: ['document', 'video', 'link', 'image']
        },
        url: String,
        description: String
    }],
    isPublished: {
        type: Boolean,
        default: false,
    },
    version: {
        type: Number,
        default: 1,
    }
}, { timestamps: true });

module.exports = mongoose.model("courseContent", courseContentSchema);
