const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const xlsx = require('xlsx');
const Courseware = require('../models/coursewareSchema');

// 配置文件存储
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../uploads/courseware');
        fs.ensureDirSync(uploadPath);
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/plain',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('不支持的文件类型'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB限制
    }
});

// 文本提取函数
const extractTextFromFile = async (filePath, fileType) => {
    try {
        switch (fileType) {
            case 'application/pdf':
                const pdfBuffer = await fs.readFile(filePath);
                const pdfData = await pdfParse(pdfBuffer);
                return pdfData.text;

            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            case 'application/msword':
                const docxResult = await mammoth.extractRawText({ path: filePath });
                return docxResult.value;

            case 'text/plain':
                return await fs.readFile(filePath, 'utf8');

            case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
            case 'application/vnd.ms-excel':
                const workbook = xlsx.readFile(filePath);
                let excelText = '';
                workbook.SheetNames.forEach(sheetName => {
                    const sheet = workbook.Sheets[sheetName];
                    excelText += xlsx.utils.sheet_to_txt(sheet) + '\n';
                });
                return excelText;

            default:
                return '';
        }
    } catch (error) {
        console.error('文本提取错误:', error);
        return '';
    }
};

// 上传课程文档
const uploadCourseDocument = async (req, res) => {
    try {
        const { coursewareId } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: '没有上传文件' 
            });
        }

        // 提取文件内容
        const extractedContent = await extractTextFromFile(req.file.path, req.file.mimetype);

        // 更新课件记录
        const courseware = await Courseware.findById(coursewareId);
        if (!courseware) {
            // 删除上传的文件
            await fs.remove(req.file.path);
            return res.status(404).json({ 
                success: false, 
                message: '课件不存在' 
            });
        }

        // 添加文档信息
        courseware.uploadedDocuments.push({
            fileName: req.file.filename,
            originalName: req.file.originalname,
            filePath: req.file.path,
            fileType: req.file.mimetype,
            fileSize: req.file.size,
            extractedContent: extractedContent,
            isProcessed: true
        });

        await courseware.save();

        res.json({
            success: true,
            message: '文档上传成功',
            document: {
                fileName: req.file.filename,
                originalName: req.file.originalname,
                fileSize: req.file.size,
                extractedLength: extractedContent.length
            }
        });

    } catch (error) {
        console.error('文档上传错误:', error);
        // 清理上传的文件
        if (req.file && req.file.path) {
            await fs.remove(req.file.path).catch(console.error);
        }
        res.status(500).json({ 
            success: false, 
            message: '文档上传失败', 
            error: error.message 
        });
    }
};

// 删除课程文档
const deleteCourseDocument = async (req, res) => {
    try {
        const { coursewareId, documentId } = req.params;

        const courseware = await Courseware.findById(coursewareId);
        if (!courseware) {
            return res.status(404).json({ 
                success: false, 
                message: '课件不存在' 
            });
        }

        const documentIndex = courseware.uploadedDocuments.findIndex(
            doc => doc._id.toString() === documentId
        );

        if (documentIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                message: '文档不存在' 
            });
        }

        const document = courseware.uploadedDocuments[documentIndex];
        
        // 删除物理文件
        if (document.filePath && await fs.pathExists(document.filePath)) {
            await fs.remove(document.filePath);
        }

        // 从数组中移除
        courseware.uploadedDocuments.splice(documentIndex, 1);
        await courseware.save();

        res.json({
            success: true,
            message: '文档删除成功'
        });

    } catch (error) {
        console.error('文档删除错误:', error);
        res.status(500).json({ 
            success: false, 
            message: '文档删除失败', 
            error: error.message 
        });
    }
};

// 获取课程文档列表
const getCourseDocuments = async (req, res) => {
    try {
        const { coursewareId } = req.params;

        const courseware = await Courseware.findById(coursewareId)
            .select('uploadedDocuments title');

        if (!courseware) {
            return res.status(404).json({ 
                success: false, 
                message: '课件不存在' 
            });
        }

        const documents = courseware.uploadedDocuments.map(doc => ({
            _id: doc._id,
            originalName: doc.originalName,
            fileType: doc.fileType,
            fileSize: doc.fileSize,
            uploadDate: doc.uploadDate,
            isProcessed: doc.isProcessed,
            contentLength: doc.extractedContent ? doc.extractedContent.length : 0
        }));

        res.json({
            success: true,
            documents,
            coursewareTitle: courseware.title
        });

    } catch (error) {
        console.error('获取文档列表错误:', error);
        res.status(500).json({ 
            success: false, 
            message: '获取文档列表失败', 
            error: error.message 
        });
    }
};

// 下载课程文档
const downloadCourseDocument = async (req, res) => {
    try {
        const { coursewareId, documentId } = req.params;

        const courseware = await Courseware.findById(coursewareId);
        if (!courseware) {
            return res.status(404).json({ 
                success: false, 
                message: '课件不存在' 
            });
        }

        const document = courseware.uploadedDocuments.find(
            doc => doc._id.toString() === documentId
        );

        if (!document) {
            return res.status(404).json({ 
                success: false, 
                message: '文档不存在' 
            });
        }

        if (!await fs.pathExists(document.filePath)) {
            return res.status(404).json({ 
                success: false, 
                message: '文件不存在' 
            });
        }

        res.download(document.filePath, document.originalName);

    } catch (error) {
        console.error('文档下载错误:', error);
        res.status(500).json({ 
            success: false, 
            message: '文档下载失败', 
            error: error.message 
        });
    }
};

module.exports = {
    upload,
    uploadCourseDocument,
    deleteCourseDocument,
    getCourseDocuments,
    downloadCourseDocument
};
