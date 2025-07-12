const KnowledgeBase = require('../models/knowledgeBaseSchema');
const Subject = require('../models/subjectSchema');
const Teacher = require('../models/teacherSchema');
const aiService = require('../services/aiService');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// 配置文件上传
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = process.env.UPLOAD_PATH || './uploads/knowledge-base';
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = ['text/plain', 'application/pdf', 'application/msword', 
                             'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                             'application/vnd.ms-powerpoint', 
                             'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('不支持的文件类型'), false);
        }
    }
});

/**
 * 创建知识库条目
 */
const createKnowledgeBase = async (req, res) => {
    try {
        const { title, content, subject, tags, fileType = 'text' } = req.body;
        const { adminID } = req.body; // 从请求中获取学校ID
        
        // 验证科目是否存在
        const subjectExists = await Subject.findById(subject);
        if (!subjectExists) {
            return res.status(400).json({ message: '科目不存在' });
        }

        // 验证教师权限
        const teacher = await Teacher.findById(req.body.uploadedBy);
        if (!teacher) {
            return res.status(400).json({ message: '教师不存在' });
        }

        const knowledgeBase = new KnowledgeBase({
            title,
            content,
            fileType,
            subject,
            school: adminID,
            uploadedBy: req.body.uploadedBy,
            tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
            filePath: req.file ? req.file.path : null,
            metadata: req.file ? {
                fileSize: req.file.size,
                originalName: req.file.originalname
            } : {}
        });

        const savedKnowledgeBase = await knowledgeBase.save();
        
        // 填充关联数据
        const populatedKB = await KnowledgeBase.findById(savedKnowledgeBase._id)
            .populate('subject', 'subName subCode')
            .populate('uploadedBy', 'name email')
            .populate('school', 'schoolName');

        res.status(201).json({
            message: '知识库条目创建成功',
            data: populatedKB
        });

    } catch (error) {
        console.error('创建知识库条目错误:', error);
        res.status(500).json({ 
            message: '创建知识库条目失败', 
            error: error.message 
        });
    }
};

/**
 * 上传文件到知识库
 */
const uploadKnowledgeBaseFile = [
    upload.single('file'),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ message: '请选择要上传的文件' });
            }

            const { title, subject, tags } = req.body;
            const { adminID, uploadedBy } = req.body;

            // 根据文件类型确定fileType
            const fileTypeMap = {
                'text/plain': 'text',
                'application/pdf': 'pdf',
                'application/msword': 'doc',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'doc',
                'application/vnd.ms-powerpoint': 'ppt',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'ppt'
            };

            const fileType = fileTypeMap[req.file.mimetype] || 'text';

            // 读取文件内容（仅对文本文件）
            let content = '';
            if (fileType === 'text') {
                content = await fs.readFile(req.file.path, 'utf8');
            } else {
                content = `文件: ${req.file.originalname}`;
            }

            const knowledgeBase = new KnowledgeBase({
                title: title || req.file.originalname,
                content,
                fileType,
                filePath: req.file.path,
                subject,
                school: adminID,
                uploadedBy,
                tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
                metadata: {
                    fileSize: req.file.size,
                    originalName: req.file.originalname
                }
            });

            const savedKnowledgeBase = await knowledgeBase.save();
            
            const populatedKB = await KnowledgeBase.findById(savedKnowledgeBase._id)
                .populate('subject', 'subName subCode')
                .populate('uploadedBy', 'name email')
                .populate('school', 'schoolName');

            res.status(201).json({
                message: '文件上传成功',
                data: populatedKB
            });

        } catch (error) {
            console.error('文件上传错误:', error);
            res.status(500).json({ 
                message: '文件上传失败', 
                error: error.message 
            });
        }
    }
];

/**
 * 获取知识库列表
 */
const getKnowledgeBases = async (req, res) => {
    try {
        const { adminID } = req.params;
        const { subject, fileType, tags, search, page = 1, limit = 10 } = req.query;

        // 构建查询条件
        const query = { school: adminID, isActive: true };

        if (subject) query.subject = subject;
        if (fileType) query.fileType = fileType;
        if (tags) {
            const tagArray = tags.split(',').map(tag => tag.trim());
            query.tags = { $in: tagArray };
        }
        if (search) {
            query.$text = { $search: search };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const knowledgeBases = await KnowledgeBase.find(query)
            .populate('subject', 'subName subCode')
            .populate('uploadedBy', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await KnowledgeBase.countDocuments(query);

        res.json({
            data: knowledgeBases,
            pagination: {
                current: parseInt(page),
                pageSize: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('获取知识库列表错误:', error);
        res.status(500).json({ 
            message: '获取知识库列表失败', 
            error: error.message 
        });
    }
};

/**
 * 获取单个知识库条目
 */
const getKnowledgeBaseById = async (req, res) => {
    try {
        const { id } = req.params;

        const knowledgeBase = await KnowledgeBase.findById(id)
            .populate('subject', 'subName subCode')
            .populate('uploadedBy', 'name email')
            .populate('school', 'schoolName');

        if (!knowledgeBase) {
            return res.status(404).json({ message: '知识库条目不存在' });
        }

        res.json({ data: knowledgeBase });

    } catch (error) {
        console.error('获取知识库条目错误:', error);
        res.status(500).json({ 
            message: '获取知识库条目失败', 
            error: error.message 
        });
    }
};

/**
 * 更新知识库条目
 */
const updateKnowledgeBase = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, tags } = req.body;

        const updateData = {
            title,
            content,
            tags: tags ? tags.split(',').map(tag => tag.trim()) : []
        };

        const knowledgeBase = await KnowledgeBase.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        ).populate('subject', 'subName subCode')
         .populate('uploadedBy', 'name email');

        if (!knowledgeBase) {
            return res.status(404).json({ message: '知识库条目不存在' });
        }

        res.json({
            message: '知识库条目更新成功',
            data: knowledgeBase
        });

    } catch (error) {
        console.error('更新知识库条目错误:', error);
        res.status(500).json({ 
            message: '更新知识库条目失败', 
            error: error.message 
        });
    }
};

/**
 * 删除知识库条目
 */
const deleteKnowledgeBase = async (req, res) => {
    try {
        const { id } = req.params;

        const knowledgeBase = await KnowledgeBase.findById(id);
        if (!knowledgeBase) {
            return res.status(404).json({ message: '知识库条目不存在' });
        }

        // 删除关联文件
        if (knowledgeBase.filePath) {
            try {
                await fs.unlink(knowledgeBase.filePath);
            } catch (fileError) {
                console.warn('删除文件失败:', fileError.message);
            }
        }

        await KnowledgeBase.findByIdAndDelete(id);

        res.json({ message: '知识库条目删除成功' });

    } catch (error) {
        console.error('删除知识库条目错误:', error);
        res.status(500).json({ 
            message: '删除知识库条目失败', 
            error: error.message 
        });
    }
};

/**
 * 搜索知识库
 */
const searchKnowledgeBase = async (req, res) => {
    try {
        const { query, subject, limit = 10 } = req.body;
        const { adminID } = req.params;

        if (!query) {
            return res.status(400).json({ message: '搜索查询不能为空' });
        }

        // 使用AI服务进行智能搜索
        const aiResult = await aiService.queryKnowledgeBase(query, null, {
            userId: req.user?.id,
            subject: subject,
            school: adminID
        });

        // 同时进行数据库搜索作为补充
        const searchConditions = {
            school: adminID,
            isActive: true,
            $text: { $search: query }
        };

        if (subject) {
            searchConditions.subject = subject;
        }

        const dbResults = await KnowledgeBase.find(searchConditions)
            .populate('subject', 'subName subCode')
            .populate('uploadedBy', 'name email')
            .limit(parseInt(limit))
            .sort({ score: { $meta: 'textScore' } });

        res.json({
            aiResponse: aiResult,
            databaseResults: dbResults,
            query: query,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('搜索知识库错误:', error);
        res.status(500).json({ 
            message: '搜索知识库失败', 
            error: error.message 
        });
    }
};

/**
 * 获取知识库统计信息
 */
const getKnowledgeBaseStats = async (req, res) => {
    try {
        const { adminID } = req.params;

        const stats = await KnowledgeBase.aggregate([
            { $match: { school: adminID, isActive: true } },
            {
                $group: {
                    _id: null,
                    totalCount: { $sum: 1 },
                    totalSize: { $sum: '$metadata.fileSize' },
                    byFileType: {
                        $push: {
                            fileType: '$fileType',
                            count: 1
                        }
                    },
                    bySubject: {
                        $push: {
                            subject: '$subject',
                            count: 1
                        }
                    }
                }
            }
        ]);

        // 按文件类型统计
        const fileTypeStats = await KnowledgeBase.aggregate([
            { $match: { school: adminID, isActive: true } },
            { $group: { _id: '$fileType', count: { $sum: 1 } } }
        ]);

        // 按科目统计
        const subjectStats = await KnowledgeBase.aggregate([
            { $match: { school: adminID, isActive: true } },
            { $group: { _id: '$subject', count: { $sum: 1 } } },
            {
                $lookup: {
                    from: 'subjects',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'subjectInfo'
                }
            }
        ]);

        res.json({
            overview: stats[0] || { totalCount: 0, totalSize: 0 },
            fileTypeDistribution: fileTypeStats,
            subjectDistribution: subjectStats
        });

    } catch (error) {
        console.error('获取知识库统计错误:', error);
        res.status(500).json({ 
            message: '获取知识库统计失败', 
            error: error.message 
        });
    }
};

module.exports = {
    createKnowledgeBase,
    uploadKnowledgeBaseFile,
    getKnowledgeBases,
    getKnowledgeBaseById,
    updateKnowledgeBase,
    deleteKnowledgeBase,
    searchKnowledgeBase,
    getKnowledgeBaseStats
};
