/**
 * 用户响应过滤器
 * 确保敏感字段（如密码）不会在 API 响应中返回
 */

/**
 * 需要从用户对象中移除的敏感字段
 */
const SENSITIVE_FIELDS = [
    'password',
    '__v',
    'resetPasswordToken',
    'resetPasswordExpires',
    'emailVerificationToken',
    'refreshToken'
];

/**
 * 过滤用户对象，移除敏感字段
 * @param {Object} user - 用户对象
 * @param {Array<string>} additionalFields - 额外需要移除的字段
 * @returns {Object} 过滤后的用户对象
 */
const filterUserFields = (user, additionalFields = []) => {
    if (!user) return null;

    // 转换为普通对象（处理 Mongoose Document）
    const userObj = user.toObject ? user.toObject() : { ...user };

    // 合并需要移除的字段
    const fieldsToRemove = [...SENSITIVE_FIELDS, ...additionalFields];

    // 移除敏感字段
    fieldsToRemove.forEach(field => {
        delete userObj[field];
    });

    return userObj;
};

/**
 * 过滤用户数组
 * @param {Array} users - 用户数组
 * @param {Array<string>} additionalFields - 额外需要移除的字段
 * @returns {Array} 过滤后的用户数组
 */
const filterUserArray = (users, additionalFields = []) => {
    if (!Array.isArray(users)) return [];
    return users.map(user => filterUserFields(user, additionalFields));
};

/**
 * 过滤学生数据（包含额外的学生特定字段）
 * @param {Object} student - 学生对象
 * @returns {Object} 过滤后的学生对象
 */
const filterStudentData = (student) => {
    return filterUserFields(student);
};

/**
 * 过滤教师数据
 * @param {Object} teacher - 教师对象
 * @returns {Object} 过滤后的教师对象
 */
const filterTeacherData = (teacher) => {
    return filterUserFields(teacher);
};

/**
 * 过滤管理员数据
 * @param {Object} admin - 管理员对象
 * @returns {Object} 过滤后的管理员对象
 */
const filterAdminData = (admin) => {
    return filterUserFields(admin);
};

/**
 * 中间件：自动过滤响应中的用户数据
 * 仅在响应包含 user、student、teacher、admin 字段时生效
 */
const userFilterMiddleware = (req, res, next) => {
    const originalJson = res.json;

    res.json = function (data) {
        // 检查是否需要过滤
        if (data && typeof data === 'object') {
            // 过滤单个用户对象
            if (data.user) {
                data.user = filterUserFields(data.user);
            }
            if (data.student) {
                data.student = filterStudentData(data.student);
            }
            if (data.teacher) {
                data.teacher = filterTeacherData(data.teacher);
            }
            if (data.admin) {
                data.admin = filterAdminData(data.admin);
            }

            // 过滤用户数组
            if (data.users && Array.isArray(data.users)) {
                data.users = filterUserArray(data.users);
            }
            if (data.students && Array.isArray(data.students)) {
                data.students = data.students.map(s => filterStudentData(s));
            }
            if (data.teachers && Array.isArray(data.teachers)) {
                data.teachers = data.teachers.map(t => filterTeacherData(t));
            }

            // 过滤 data 字段中的用户信息
            if (data.data) {
                if (Array.isArray(data.data)) {
                    data.data = data.data.map(item => {
                        if (item.password !== undefined) {
                            return filterUserFields(item);
                        }
                        return item;
                    });
                } else if (data.data.password !== undefined) {
                    data.data = filterUserFields(data.data);
                }
            }
        }

        return originalJson.call(this, data);
    };

    next();
};

/**
 * 从请求体中移除敏感字段（防止恶意注入）
 * @param {Object} body - 请求体
 * @returns {Object} 过滤后的请求体
 */
const sanitizeRequestBody = (body) => {
    if (!body || typeof body !== 'object') return body;

    const sanitized = { ...body };

    // 移除不应通过请求体设置的字段
    const forbiddenFields = [
        'role',
        '_id',
        'createdAt',
        'updatedAt',
        '__v',
        'resetPasswordToken',
        'resetPasswordExpires'
    ];

    forbiddenFields.forEach(field => {
        delete sanitized[field];
    });

    return sanitized;
};

module.exports = {
    filterUserFields,
    filterUserArray,
    filterStudentData,
    filterTeacherData,
    filterAdminData,
    userFilterMiddleware,
    sanitizeRequestBody,
    SENSITIVE_FIELDS
};
