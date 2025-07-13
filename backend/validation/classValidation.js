const { body, param, query, validationResult } = require('express-validator');

// 班级创建验证规则
const createClassValidation = [
    body('sclassName')
        .trim()
        .notEmpty()
        .withMessage('班级名称不能为空')
        .isLength({ min: 2, max: 50 })
        .withMessage('班级名称长度必须在2-50个字符之间')
        .matches(/^[\u4e00-\u9fa5a-zA-Z0-9\s\(\)\-\（\）]+$/)
        .withMessage('班级名称只能包含中文、英文、数字、空格和括号'),
    
    body('adminID')
        .notEmpty()
        .withMessage('学校ID不能为空')
        .isMongoId()
        .withMessage('学校ID格式不正确'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('班级描述不能超过500个字符'),
    
    body('grade')
        .optional()
        .trim()
        .isLength({ max: 20 })
        .withMessage('年级不能超过20个字符'),
    
    body('maxStudents')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('班级最大学生数必须在1-100之间'),
    
    body('academicYear')
        .optional()
        .trim()
        .isLength({ max: 20 })
        .withMessage('学年不能超过20个字符')
        .matches(/^\d{4}-\d{4}$/)
        .withMessage('学年格式应为：YYYY-YYYY，如2023-2024')
];

// 班级更新验证规则
const updateClassValidation = [
    param('id')
        .isMongoId()
        .withMessage('班级ID格式不正确'),
    
    body('sclassName')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('班级名称不能为空')
        .isLength({ min: 2, max: 50 })
        .withMessage('班级名称长度必须在2-50个字符之间')
        .matches(/^[\u4e00-\u9fa5a-zA-Z0-9\s\(\)\-\（\）]+$/)
        .withMessage('班级名称只能包含中文、英文、数字、空格和括号'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('班级描述不能超过500个字符'),
    
    body('grade')
        .optional()
        .trim()
        .isLength({ max: 20 })
        .withMessage('年级不能超过20个字符'),
    
    body('maxStudents')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('班级最大学生数必须在1-100之间'),
    
    body('status')
        .optional()
        .isIn(['active', 'inactive', 'archived'])
        .withMessage('状态必须是：active、inactive 或 archived'),
    
    body('academicYear')
        .optional()
        .trim()
        .isLength({ max: 20 })
        .withMessage('学年不能超过20个字符')
        .matches(/^\d{4}-\d{4}$/)
        .withMessage('学年格式应为：YYYY-YYYY，如2023-2024')
];

// 班级查询验证规则
const getClassValidation = [
    param('id')
        .isMongoId()
        .withMessage('班级ID格式不正确')
];

// 班级列表查询验证规则
const getClassListValidation = [
    param('id')
        .isMongoId()
        .withMessage('学校ID格式不正确'),
    
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('页码必须是大于0的整数'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('每页数量必须在1-100之间'),
    
    query('search')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('搜索关键词不能超过50个字符'),
    
    query('grade')
        .optional()
        .trim()
        .isLength({ max: 20 })
        .withMessage('年级筛选条件不能超过20个字符'),
    
    query('status')
        .optional()
        .isIn(['active', 'inactive', 'archived'])
        .withMessage('状态筛选必须是：active、inactive 或 archived'),
    
    query('sortBy')
        .optional()
        .isIn(['sclassName', 'grade', 'currentStudents', 'createdAt', 'updatedAt'])
        .withMessage('排序字段必须是：sclassName、grade、currentStudents、createdAt 或 updatedAt'),
    
    query('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('排序方向必须是：asc 或 desc')
];

// 批量删除验证规则
const batchDeleteValidation = [
    body('classIds')
        .isArray({ min: 1 })
        .withMessage('班级ID数组不能为空'),
    
    body('classIds.*')
        .isMongoId()
        .withMessage('班级ID格式不正确')
];

// 验证结果处理中间件
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: '输入数据验证失败',
            errors: errors.array().map(error => ({
                field: error.path,
                message: error.msg,
                value: error.value
            }))
        });
    }
    next();
};

module.exports = {
    createClassValidation,
    updateClassValidation,
    getClassValidation,
    getClassListValidation,
    batchDeleteValidation,
    handleValidationErrors
};
