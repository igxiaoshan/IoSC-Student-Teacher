/**
 * 输入验证工具
 * 前后端通用的验证规则和错误消息
 */

// ============================================
// 验证规则
// ============================================

const validators = {
    /**
     * 必填验证
     */
    required: (value, fieldName = '此字段') => {
        if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
            return `${fieldName}不能为空`;
        }
        return null;
    },

    /**
     * 邮箱验证
     */
    email: (value) => {
        if (!value) return null;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            return '请输入有效的邮箱地址';
        }
        return null;
    },

    /**
     * 手机号验证（中国大陆）
     */
    phone: (value) => {
        if (!value) return null;
        const phoneRegex = /^1[3-9]\d{9}$/;
        if (!phoneRegex.test(value)) {
            return '请输入有效的手机号码';
        }
        return null;
    },

    /**
     * 密码强度验证
     */
    password: (value, options = {}) => {
        if (!value) return null;
        const { minLength = 6, requireUppercase = false, requireNumber = false, requireSpecial = false } = options;

        if (value.length < minLength) {
            return `密码长度至少${minLength}个字符`;
        }

        if (requireUppercase && !/[A-Z]/.test(value)) {
            return '密码需包含大写字母';
        }

        if (requireNumber && !/\d/.test(value)) {
            return '密码需包含数字';
        }

        if (requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
            return '密码需包含特殊字符';
        }

        return null;
    },

    /**
     * 最小长度验证
     */
    minLength: (value, min, fieldName = '内容') => {
        if (!value) return null;
        if (value.length < min) {
            return `${fieldName}长度至少${min}个字符`;
        }
        return null;
    },

    /**
     * 最大长度验证
     */
    maxLength: (value, max, fieldName = '内容') => {
        if (!value) return null;
        if (value.length > max) {
            return `${fieldName}长度不能超过${max}个字符`;
        }
        return null;
    },

    /**
     * 数字范围验证
     */
    range: (value, min, max, fieldName = '数值') => {
        if (value === '' || value === null || value === undefined) return null;
        const num = Number(value);
        if (isNaN(num)) {
            return '请输入有效的数字';
        }
        if (num < min || num > max) {
            return `${fieldName}必须在${min}到${max}之间`;
        }
        return null;
    },

    /**
     * 最小值验证
     */
    min: (value, min, fieldName = '数值') => {
        if (value === '' || value === null || value === undefined) return null;
        const num = Number(value);
        if (isNaN(num) || num < min) {
            return `${fieldName}不能小于${min}`;
        }
        return null;
    },

    /**
     * 最大值验证
     */
    max: (value, max, fieldName = '数值') => {
        if (value === '' || value === null || value === undefined) return null;
        const num = Number(value);
        if (isNaN(num) || num > max) {
            return `${fieldName}不能超过${max}`;
        }
        return null;
    },

    /**
     * 整数验证
     */
    integer: (value, fieldName = '数值') => {
        if (!value && value !== 0) return null;
        if (!Number.isInteger(Number(value))) {
            return `${fieldName}必须是整数`;
        }
        return null;
    },

    /**
     * 正数验证
     */
    positive: (value, fieldName = '数值') => {
        if (value === '' || value === null || value === undefined) return null;
        const num = Number(value);
        if (isNaN(num) || num <= 0) {
            return `${fieldName}必须是正数`;
        }
        return null;
    },

    /**
     * URL 验证
     */
    url: (value) => {
        if (!value) return null;
        try {
            new URL(value);
            return null;
        } catch {
            return '请输入有效的URL地址';
        }
    },

    /**
     * MongoDB ObjectId 验证
     */
    objectId: (value, fieldName = 'ID') => {
        if (!value) return null;
        const objectIdRegex = /^[0-9a-fA-F]{24}$/;
        if (!objectIdRegex.test(value)) {
            return `无效的${fieldName}格式`;
        }
        return null;
    },

    /**
     * 学号/工号验证
     */
    rollNumber: (value) => {
        if (!value) return null;
        if (!/^\d+$/.test(value)) {
            return '学号/工号只能包含数字';
        }
        return null;
    },

    /**
     * 中文姓名验证
     */
    chineseName: (value) => {
        if (!value) return null;
        if (!/^[\u4e00-\u9fa5]{2,20}$/.test(value)) {
            return '请输入有效的中文姓名（2-20个字符）';
        }
        return null;
    },

    /**
     * 用户名验证
     */
    username: (value) => {
        if (!value) return null;
        if (!/^[a-zA-Z0-9_]{3,20}$/.test(value)) {
            return '用户名只能包含字母、数字、下划线，长度3-20个字符';
        }
        return null;
    },

    /**
     * 日期验证
     */
    date: (value, fieldName = '日期') => {
        if (!value) return null;
        const date = new Date(value);
        if (isNaN(date.getTime())) {
            return `无效的${fieldName}`;
        }
        return null;
    },

    /**
     * 日期范围验证
     */
    dateRange: (startDate, endDate) => {
        if (!startDate || !endDate) return null;
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start > end) {
            return '开始日期不能晚于结束日期';
        }
        return null;
    },

    /**
     * 枚举值验证
     */
    enum: (value, enumValues, fieldName = '值') => {
        if (!value) return null;
        if (!enumValues.includes(value)) {
            return `${fieldName}必须是 ${enumValues.join('、')} 之一`;
        }
        return null;
    },

    /**
     * 确认密码验证
     */
    confirmPassword: (password, confirmPassword) => {
        if (!confirmPassword) return null;
        if (password !== confirmPassword) {
            return '两次输入的密码不一致';
        }
        return null;
    },
};

// ============================================
// 验证器组合
// ============================================

/**
 * 创建链式验证器
 */
const createValidator = (rules) => {
    return (value, formData) => {
        for (const rule of rules) {
            const { type, params = [], message, condition } = rule;

            // 检查条件
            if (condition && !condition(value, formData)) {
                continue;
            }

            const validator = validators[type];
            if (!validator) continue;

            const error = validator(value, ...params);
            if (error) {
                return message || error;
            }
        }
        return null;
    };
};

/**
 * 验证整个表单
 */
const validateForm = (data, schema) => {
    const errors = {};
    let isValid = true;

    for (const [field, rules] of Object.entries(schema)) {
        const validator = createValidator(rules);
        const error = validator(data[field], data);
        if (error) {
            errors[field] = error;
            isValid = false;
        }
    }

    return { isValid, errors };
};

// ============================================
// 常用验证模式
// ============================================

const schemas = {
    // 登录表单
    login: {
        email: [{ type: 'required' }, { type: 'email' }],
        password: [{ type: 'required' }, { type: 'minLength', params: [6] }],
    },

    // 注册表单
    register: {
        name: [{ type: 'required' }, { type: 'chineseName' }],
        email: [{ type: 'required' }, { type: 'email' }],
        password: [{ type: 'required' }, { type: 'password', params: [{ minLength: 8 }] }],
        confirmPassword: [{ type: 'required' }, { type: 'confirmPassword' }],
    },

    // 学生表单
    student: {
        name: [{ type: 'required' }, { type: 'chineseName' }],
        rollNum: [{ type: 'required' }, { type: 'rollNumber' }],
        sclassName: [{ type: 'required', params: ['班级'] }],
    },

    // 教师表单
    teacher: {
        name: [{ type: 'required' }, { type: 'chineseName' }],
        email: [{ type: 'required' }, { type: 'email' }],
        teachSclass: [{ type: 'required', params: ['班级'] }],
    },

    // 班级表单
    class: {
        sclassName: [{ type: 'required', params: ['班级名称'] }, { type: 'maxLength', params: [50, '班级名称'] }],
    },

    // 科目表单
    subject: {
        subName: [{ type: 'required', params: ['科目名称'] }],
        subCode: [{ type: 'required', params: ['科目代码'] }],
        sessions: [{ type: 'required' }, { type: 'range', params: [1, 10, '课时'] }],
    },
};

// ============================================
// 中间件（后端使用）
// ============================================

/**
 * Express 验证中间件工厂
 */
const validate = (schema) => {
    return (req, res, next) => {
        const { isValid, errors } = validateForm(req.body, schema);

        if (!isValid) {
            return res.status(422).json({
                success: false,
                message: '数据验证失败',
                errors,
            });
        }

        next();
    };
};

// ============================================
// Sanitization（数据清洗）
// ============================================

const sanitize = {
    /**
     * 清除 HTML 标签
     */
    stripHtml: (value) => {
        if (!value) return value;
        return value.replace(/<[^>]*>/g, '');
    },

    /**
     * 清除首尾空格
     */
    trim: (value) => {
        if (typeof value === 'string') {
            return value.trim();
        }
        return value;
    },

    /**
     * 转换为小写
     */
    toLowerCase: (value) => {
        if (typeof value === 'string') {
            return value.toLowerCase();
        }
        return value;
    },

    /**
     * 转换为大写
     */
    toUpperCase: (value) => {
        if (typeof value === 'string') {
            return value.toUpperCase();
        }
        return value;
    },

    /**
     * 只保留数字
     */
    numbersOnly: (value) => {
        if (!value) return value;
        return String(value).replace(/\D/g, '');
    },

    /**
     * 清洗请求体
     */
    sanitizeBody: (body, fields = []) => {
        const sanitized = { ...body };

        fields.forEach(field => {
            if (sanitized[field] !== undefined) {
                sanitized[field] = sanitize.trim(sanitized[field]);
            }
        });

        return sanitized;
    },
};

// 导出
module.exports = {
    validators,
    createValidator,
    validateForm,
    validate,
    schemas,
    sanitize,
};