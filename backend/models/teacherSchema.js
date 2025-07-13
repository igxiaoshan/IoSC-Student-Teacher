const mongoose = require("mongoose")

const teacherSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        default: "Teacher"
    },
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin',
        required: true,
    },
    // 教师个人信息
    phone: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    qualification: {
        type: String,
        trim: true
    },
    experience: {
        type: Number,
        default: 0,
        min: 0
    },
    // 教学相关
    teachSubject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'subject',
    },
    // 支持多个班级关联
    teachSclass: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'sclass',
        required: true,
    },
    // 新增：关联的其他班级（用于支持一个教师对应多个班级）
    additionalClasses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'sclass'
    }],
    // 教师类型
    teacherType: {
        type: String,
        enum: ['full-time', 'part-time', 'substitute', 'guest'],
        default: 'full-time'
    },
    // 职位
    position: {
        type: String,
        enum: ['teacher', 'head-teacher', 'department-head', 'principal'],
        default: 'teacher'
    },
    // 状态
    status: {
        type: String,
        enum: ['active', 'inactive', 'on-leave', 'retired'],
        default: 'active'
    },
    // 考勤记录
    attendance: [{
        date: {
            type: Date,
            required: true
        },
        presentCount: {
            type: String,
        },
        absentCount: {
            type: String,
        }
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// 创建复合索引
teacherSchema.index({ email: 1, school: 1 }, { unique: true });
teacherSchema.index({ school: 1, status: 1 });
teacherSchema.index({ teachSclass: 1 });

// 虚拟字段：获取所有任教班级
teacherSchema.virtual('allClasses').get(function() {
    const classes = [this.teachSclass];
    if (this.additionalClasses && this.additionalClasses.length > 0) {
        classes.push(...this.additionalClasses);
    }
    return classes;
});

// 实例方法：添加班级关联
teacherSchema.methods.addClassAssociation = function(classId) {
    if (!this.additionalClasses.includes(classId) && !this.teachSclass.equals(classId)) {
        this.additionalClasses.push(classId);
        return this.save();
    }
    return Promise.resolve(this);
};

// 实例方法：移除班级关联
teacherSchema.methods.removeClassAssociation = function(classId) {
    this.additionalClasses = this.additionalClasses.filter(id => !id.equals(classId));
    return this.save();
};

// 静态方法：根据班级ID查找教师
teacherSchema.statics.findByClass = function(classId) {
    return this.find({
        $or: [
            { teachSclass: classId },
            { additionalClasses: classId }
        ]
    }).populate('teachSclass additionalClasses', 'sclassName grade');
};

module.exports = mongoose.model("teacher", teacherSchema)