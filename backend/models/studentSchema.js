const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    rollNum: {
        type: Number,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    sclassName: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'sclass',
        required: true,
    },
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin',
        required: true,
    },
    role: {
        type: String,
        default: "Student"
    },
    // 学生选择的科目（支持跨班级选修）
    selectedSubjects: [{
        subject: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'subject',
            required: true
        },
        enrollmentDate: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['active', 'completed', 'dropped'],
            default: 'active'
        },
        isRequired: {
            type: Boolean,
            default: true
        },
        // 学习偏好设置
        learningPreferences: {
            difficulty: {
                type: String,
                enum: ['beginner', 'intermediate', 'advanced'],
                default: 'intermediate'
            },
            studyGoals: [String],
            preferredLearningStyle: {
                type: String,
                enum: ['visual', 'auditory', 'kinesthetic', 'reading'],
                default: 'visual'
            }
        }
    }],
    examResult: [
        {
            subName: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'subject',
            },
            marksObtained: {
                type: Number,
                default: 0
            }
        }
    ],
    attendance: [{
        date: {
            type: Date,
            required: true
        },
        status: {
            type: String,
            enum: ['Present', 'Absent'],
            required: true
        },
        subName: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'subject',
            required: true
        }
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// 创建索引
studentSchema.index({ school: 1, sclassName: 1 });
studentSchema.index({ rollNum: 1, school: 1, sclassName: 1 }, { unique: true });
studentSchema.index({ 'selectedSubjects.subject': 1 });

// 虚拟字段：获取活跃的科目
studentSchema.virtual('activeSubjects').get(function() {
    return (this.selectedSubjects || []).filter(sub => sub.status === 'active');
});

// 实例方法：添加科目选择
studentSchema.methods.addSubject = function(subjectId, options = {}) {
    const existingSubject = this.selectedSubjects.find(
        sub => sub.subject.toString() === subjectId.toString()
    );

    if (!existingSubject) {
        this.selectedSubjects.push({
            subject: subjectId,
            isRequired: options.isRequired || false,
            learningPreferences: options.learningPreferences || {}
        });
        return this.save();
    }
    return Promise.resolve(this);
};

// 实例方法：移除科目选择
studentSchema.methods.removeSubject = function(subjectId) {
    this.selectedSubjects = this.selectedSubjects.filter(
        sub => sub.subject.toString() !== subjectId.toString()
    );
    return this.save();
};

// 实例方法：更新科目状态
studentSchema.methods.updateSubjectStatus = function(subjectId, status) {
    const subject = this.selectedSubjects.find(
        sub => sub.subject.toString() === subjectId.toString()
    );
    if (subject) {
        subject.status = status;
        return this.save();
    }
    return Promise.resolve(this);
};

// 静态方法：根据科目查找学生
studentSchema.statics.findBySubject = function(subjectId) {
    return this.find({
        'selectedSubjects.subject': subjectId,
        'selectedSubjects.status': 'active'
    }).populate('selectedSubjects.subject', 'subName subCode');
};

module.exports = mongoose.model("student", studentSchema);