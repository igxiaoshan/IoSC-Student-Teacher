const mongoose = require("mongoose");

const sclassSchema = new mongoose.Schema({
    sclassName: {
        type: String,
        required: [true, '班级名称不能为空'],
        trim: true,
        maxlength: [50, '班级名称不能超过50个字符'],
        minlength: [2, '班级名称至少需要2个字符']
    },
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin',
        required: [true, '学校ID不能为空']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, '班级描述不能超过500个字符'],
        default: ''
    },
    grade: {
        type: String,
        trim: true,
        maxlength: [20, '年级不能超过20个字符'],
        default: ''
    },
    maxStudents: {
        type: Number,
        min: [1, '班级最大学生数不能少于1'],
        max: [100, '班级最大学生数不能超过100'],
        default: 50
    },
    currentStudents: {
        type: Number,
        min: [0, '当前学生数不能为负数'],
        default: 0
    },
    classTeacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'teacher',
        default: null
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'archived'],
        default: 'active'
    },
    academicYear: {
        type: String,
        trim: true,
        maxlength: [20, '学年不能超过20个字符'],
        default: ''
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// 创建复合索引，确保同一学校内班级名称唯一
sclassSchema.index({ sclassName: 1, school: 1 }, { unique: true });

// 创建其他索引以提高查询性能
sclassSchema.index({ school: 1, status: 1 });
sclassSchema.index({ grade: 1, academicYear: 1 });

// 虚拟字段：计算班级是否已满
sclassSchema.virtual('isFull').get(function() {
    return this.currentStudents >= this.maxStudents;
});

// 虚拟字段：计算剩余容量
sclassSchema.virtual('remainingCapacity').get(function() {
    return Math.max(0, this.maxStudents - this.currentStudents);
});

// 中间件：保存前验证
sclassSchema.pre('save', function(next) {
    // 确保当前学生数不超过最大学生数
    if (this.currentStudents > this.maxStudents) {
        return next(new Error('当前学生数不能超过班级最大容量'));
    }
    next();
});

// 静态方法：根据学校ID获取活跃班级
sclassSchema.statics.findActiveBySchool = function(schoolId) {
    return this.find({ school: schoolId, status: 'active' }).sort({ grade: 1, sclassName: 1 });
};

// 实例方法：更新学生数量
sclassSchema.methods.updateStudentCount = async function() {
    const Student = mongoose.model('student');
    const count = await Student.countDocuments({ sclassName: this._id });
    this.currentStudents = count;
    return this.save();
};

module.exports = mongoose.model("sclass", sclassSchema);

