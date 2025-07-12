/**
 * 课件资源数据模型
 * 用于管理教师创建的教学资源
 */

const mongoose = require('mongoose');

const courseResourceSchema = new mongoose.Schema({
    // 创建教师
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'teacher',
        required: true,
        index: true
    },
    
    // 资源标题
    title: {
        type: String,
        required: true,
        maxlength: 200,
        index: true
    },
    
    // 学科
    subject: {
        type: String,
        required: true,
        index: true
    },
    
    // 章节
    chapter: {
        type: String,
        maxlength: 100
    },
    
    // 资源类型
    resourceType: {
        type: String,
        enum: ['课件', '练习', '考核', '教案', '素材'],
        required: true,
        default: '课件'
    },
    
    // 资源内容（文本内容）
    content: {
        type: String,
        maxlength: 10000
    },
    
    // 文件路径（如果有上传文件）
    filePath: {
        type: String
    },
    
    // 文件类型
    fileType: {
        type: String,
        enum: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'md', 'html']
    },
    
    // 文件大小（字节）
    fileSize: {
        type: Number
    },
    
    // 是否共享给其他教师
    isShared: {
        type: Boolean,
        default: false
    },
    
    // 共享范围
    shareScope: {
        type: String,
        enum: ['学校内', '学科内', '班级内', '公开'],
        default: '学科内'
    },
    
    // 访问权限
    accessLevel: {
        type: String,
        enum: ['只读', '可编辑', '可下载'],
        default: '只读'
    },
    
    // 标签
    tags: [{
        type: String,
        maxlength: 50
    }],
    
    // 难度等级
    difficulty: {
        type: Number,
        min: 1,
        max: 5,
        default: 3
    },
    
    // 适用年级
    gradeLevel: {
        type: String,
        maxlength: 50
    },
    
    // 预计使用时长（分钟）
    estimatedDuration: {
        type: Number,
        min: 0
    },
    
    // 学习目标
    learningObjectives: [{
        type: String,
        maxlength: 200
    }],
    
    // 先修知识点
    prerequisites: [{
        type: String,
        maxlength: 100
    }],
    
    // 相关知识点
    knowledgePoints: [{
        type: String,
        maxlength: 100
    }],
    
    // 使用统计
    usageStats: {
        viewCount: {
            type: Number,
            default: 0
        },
        downloadCount: {
            type: Number,
            default: 0
        },
        shareCount: {
            type: Number,
            default: 0
        },
        lastUsed: {
            type: Date
        }
    },
    
    // 评分统计
    ratings: {
        averageRating: {
            type: Number,
            min: 0,
            max: 5,
            default: 0
        },
        ratingCount: {
            type: Number,
            default: 0
        }
    },
    
    // 版本信息
    version: {
        type: String,
        default: '1.0'
    },
    
    // 版本历史
    versionHistory: [{
        version: String,
        changes: String,
        updatedAt: Date,
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'teacher'
        }
    }],
    
    // 状态
    status: {
        type: String,
        enum: ['草稿', '已发布', '已归档', '已删除'],
        default: '草稿'
    },
    
    // AI生成标识
    isAIGenerated: {
        type: Boolean,
        default: false
    },
    
    // AI生成的原始提示
    aiPrompt: {
        type: String,
        maxlength: 1000
    },
    
    // 创建时间
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    
    // 更新时间
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'courseresources'
});

// 创建复合索引
courseResourceSchema.index({ teacherId: 1, subject: 1, createdAt: -1 });
courseResourceSchema.index({ resourceType: 1, isShared: 1 });
courseResourceSchema.index({ tags: 1 });
courseResourceSchema.index({ knowledgePoints: 1 });
courseResourceSchema.index({ 'ratings.averageRating': -1 });

// 中间件：更新时间
courseResourceSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// 实例方法：增加查看次数
courseResourceSchema.methods.incrementViewCount = function() {
    this.usageStats.viewCount += 1;
    this.usageStats.lastUsed = new Date();
    return this.save();
};

// 实例方法：增加下载次数
courseResourceSchema.methods.incrementDownloadCount = function() {
    this.usageStats.downloadCount += 1;
    this.usageStats.lastUsed = new Date();
    return this.save();
};

// 实例方法：添加评分
courseResourceSchema.methods.addRating = function(rating) {
    const currentTotal = this.ratings.averageRating * this.ratings.ratingCount;
    this.ratings.ratingCount += 1;
    this.ratings.averageRating = (currentTotal + rating) / this.ratings.ratingCount;
    return this.save();
};

// 实例方法：创建新版本
courseResourceSchema.methods.createNewVersion = function(changes, updatedBy) {
    // 保存当前版本到历史
    this.versionHistory.push({
        version: this.version,
        changes: changes,
        updatedAt: new Date(),
        updatedBy: updatedBy
    });
    
    // 更新版本号
    const versionParts = this.version.split('.');
    const minorVersion = parseInt(versionParts[1]) + 1;
    this.version = `${versionParts[0]}.${minorVersion}`;
    
    return this.save();
};

// 静态方法：获取热门资源
courseResourceSchema.statics.getPopularResources = function(subject, limit = 10) {
    return this.find({
        subject: subject,
        isShared: true,
        status: '已发布'
    })
    .sort({ 'ratings.averageRating': -1, 'usageStats.viewCount': -1 })
    .limit(limit)
    .populate('teacherId', 'name')
    .select('title resourceType ratings usageStats createdAt');
};

// 静态方法：搜索资源
courseResourceSchema.statics.searchResources = function(query, filters = {}) {
    const searchConditions = {
        status: '已发布',
        isShared: true
    };
    
    // 文本搜索
    if (query) {
        searchConditions.$or = [
            { title: { $regex: query, $options: 'i' } },
            { content: { $regex: query, $options: 'i' } },
            { tags: { $in: [new RegExp(query, 'i')] } },
            { knowledgePoints: { $in: [new RegExp(query, 'i')] } }
        ];
    }
    
    // 应用过滤器
    if (filters.subject) searchConditions.subject = filters.subject;
    if (filters.resourceType) searchConditions.resourceType = filters.resourceType;
    if (filters.difficulty) searchConditions.difficulty = filters.difficulty;
    if (filters.gradeLevel) searchConditions.gradeLevel = filters.gradeLevel;
    
    return this.find(searchConditions)
        .populate('teacherId', 'name')
        .sort({ 'ratings.averageRating': -1, createdAt: -1 });
};

// 静态方法：获取教师资源统计
courseResourceSchema.statics.getTeacherStats = function(teacherId) {
    return this.aggregate([
        {
            $match: { teacherId: mongoose.Types.ObjectId(teacherId) }
        },
        {
            $group: {
                _id: '$resourceType',
                count: { $sum: 1 },
                totalViews: { $sum: '$usageStats.viewCount' },
                totalDownloads: { $sum: '$usageStats.downloadCount' },
                averageRating: { $avg: '$ratings.averageRating' }
            }
        },
        {
            $project: {
                resourceType: '$_id',
                count: 1,
                totalViews: 1,
                totalDownloads: 1,
                averageRating: { $round: ['$averageRating', 2] }
            }
        }
    ]);
};

module.exports = mongoose.model('CourseResource', courseResourceSchema);
