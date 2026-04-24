/**
 * 前端验证工具
 * 复用后端验证逻辑
 */

// 验证规则（从后端复制）
const validators = {
    required: (value, fieldName = '此字段') => {
        if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
            return `${fieldName}不能为空`;
        }
        return null;
    },

    email: (value) => {
        if (!value) return null;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            return '请输入有效的邮箱地址';
        }
        return null;
    },

    phone: (value) => {
        if (!value) return null;
        const phoneRegex = /^1[3-9]\d{9}$/;
        if (!phoneRegex.test(value)) {
            return '请输入有效的手机号码';
        }
        return null;
    },

    minLength: (value, min, fieldName = '内容') => {
        if (!value) return null;
        if (value.length < min) {
            return `${fieldName}长度至少${min}个字符`;
        }
        return null;
    },

    maxLength: (value, max, fieldName = '内容') => {
        if (!value) return null;
        if (value.length > max) {
            return `${fieldName}长度不能超过${max}个字符`;
        }
        return null;
    },

    range: (value, min, max, fieldName = '数值') => {
        if (value === '' || value === null || value === undefined) return null;
        const num = Number(value);
        if (isNaN(num) || num < min || num > max) {
            return `${fieldName}必须在${min}到${max}之间`;
        }
        return null;
    },

    password: (value, options = {}) => {
        if (!value) return null;
        const { minLength = 6 } = options;

        if (value.length < minLength) {
            return `密码长度至少${minLength}个字符`;
        }
        return null;
    },

    confirmPassword: (password, confirmPassword) => {
        if (!confirmPassword) return null;
        if (password !== confirmPassword) {
            return '两次输入的密码不一致';
        }
        return null;
    },

    chineseName: (value) => {
        if (!value) return null;
        if (!/^[\u4e00-\u9fa5]{2,20}$/.test(value)) {
            return '请输入有效的中文姓名（2-20个字符）';
        }
        return null;
    },
};

// 创建验证器
const createValidator = (rules) => {
    return (value, formData) => {
        for (const rule of rules) {
            const { type, params = [], message } = rule;
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

// 验证表单
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

// 常用验证模式
const schemas = {
    login: {
        email: [{ type: 'required' }, { type: 'email' }],
        password: [{ type: 'required' }, { type: 'minLength', params: [6] }],
    },

    student: {
        name: [{ type: 'required' }, { type: 'chineseName' }],
    },

    teacher: {
        name: [{ type: 'required' }, { type: 'chineseName' }],
        email: [{ type: 'required' }, { type: 'email' }],
    },
};

export { validators, createValidator, validateForm, schemas };
export default { validators, validateForm, schemas };