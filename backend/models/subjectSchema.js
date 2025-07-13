const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
    subName: {
        type: String,
        required: true,
        trim: true
    },
    subCode: {
        type: String,
        required: true,
        trim: true,
        uppercase: true
    },
    sessions: {
        type: Number,
        required: true,
        min: 1,
        max: 10
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    // 支持多个班级关联
    sclassName: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'sclass',
        required: true,
    },
    // 新增：关联的其他班级（用于支持一个科目对应多个班级）
    additionalClasses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'sclass'
    }],
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin',
        required: true
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'teacher',
    },
    // 科目类型
    subjectType: {
        type: String,
        enum: ['core', 'elective', 'extracurricular'],
        default: 'core'
    },
    // 学分
    credits: {
        type: Number,
        default: 1,
        min: 0.5,
        max: 10
    },
    // 是否为必修课
    isRequired: {
        type: Boolean,
        default: true
    },
    // 状态
    status: {
        type: String,
        enum: ['active', 'inactive', 'archived'],
        default: 'active'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// 创建复合索引
subjectSchema.index({ subCode: 1, school: 1 }, { unique: true });
subjectSchema.index({ school: 1, status: 1 });
subjectSchema.index({ sclassName: 1 });

// 虚拟字段：获取所有关联的班级
subjectSchema.virtual('allClasses').get(function() {
    const classes = [this.sclassName];
    if (this.additionalClasses && this.additionalClasses.length > 0) {
        classes.push(...this.additionalClasses);
    }
    return classes;
});

// 实例方法：添加班级关联
subjectSchema.methods.addClassAssociation = function(classId) {
    if (!this.additionalClasses.includes(classId) && !this.sclassName.equals(classId)) {
        this.additionalClasses.push(classId);
        return this.save();
    }
    return Promise.resolve(this);
};

// 实例方法：移除班级关联
subjectSchema.methods.removeClassAssociation = function(classId) {
    this.additionalClasses = this.additionalClasses.filter(id => !id.equals(classId));
    return this.save();
};

// 静态方法：根据班级ID查找科目
subjectSchema.statics.findByClass = function(classId) {
    return this.find({
        $or: [
            { sclassName: classId },
            { additionalClasses: classId }
        ]
    }).populate('sclassName additionalClasses', 'sclassName grade');
};

module.exports = mongoose.model("subject", subjectSchema);