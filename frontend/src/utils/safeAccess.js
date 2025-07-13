/**
 * 安全访问对象属性的工具函数
 * 防止因为 null 或 undefined 导致的错误
 */

/**
 * 安全获取嵌套对象属性
 * @param {Object} obj - 要访问的对象
 * @param {string} path - 属性路径，如 'user.profile.name'
 * @param {*} defaultValue - 默认值
 * @returns {*} 属性值或默认值
 */
export const safeGet = (obj, path, defaultValue = null) => {
    if (!obj || typeof obj !== 'object') {
        return defaultValue;
    }

    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
        if (current === null || current === undefined || !(key in current)) {
            return defaultValue;
        }
        current = current[key];
    }

    return current !== undefined ? current : defaultValue;
};

/**
 * 安全获取班级名称
 * @param {Object} sclassObj - 班级对象
 * @returns {string} 班级名称
 */
export const getSafeClassName = (sclassObj) => {
    return safeGet(sclassObj, 'sclassName', '未分配班级');
};

/**
 * 安全获取班级ID
 * @param {Object} sclassObj - 班级对象
 * @returns {string|null} 班级ID
 */
export const getSafeClassId = (sclassObj) => {
    return safeGet(sclassObj, '_id', null);
};

/**
 * 安全获取科目名称
 * @param {Object} subjectObj - 科目对象
 * @returns {string} 科目名称
 */
export const getSafeSubjectName = (subjectObj) => {
    return safeGet(subjectObj, 'subName', '未知科目');
};

/**
 * 安全获取用户名称
 * @param {Object} userObj - 用户对象
 * @returns {string} 用户名称
 */
export const getSafeUserName = (userObj) => {
    return safeGet(userObj, 'name', '未知用户');
};

/**
 * 安全映射数组，过滤掉无效项
 * @param {Array} array - 要映射的数组
 * @param {Function} mapFn - 映射函数
 * @param {Function} filterFn - 过滤函数（可选）
 * @returns {Array} 映射后的数组
 */
export const safeMap = (array, mapFn, filterFn = null) => {
    if (!Array.isArray(array)) {
        return [];
    }

    let result = array;
    
    // 如果提供了过滤函数，先过滤
    if (filterFn) {
        result = array.filter(filterFn);
    }

    // 映射并处理可能的错误
    return result.map((item, index) => {
        try {
            return mapFn(item, index);
        } catch (error) {
            console.warn('映射项时出错:', error, '项目:', item);
            return null;
        }
    }).filter(item => item !== null);
};

/**
 * 检查对象是否有效（非 null、undefined 且是对象）
 * @param {*} obj - 要检查的对象
 * @returns {boolean} 是否有效
 */
export const isValidObject = (obj) => {
    return obj !== null && obj !== undefined && typeof obj === 'object';
};

/**
 * 安全获取数组长度
 * @param {Array} array - 数组
 * @returns {number} 数组长度
 */
export const getSafeArrayLength = (array) => {
    return Array.isArray(array) ? array.length : 0;
};

/**
 * 为表格行数据提供安全的默认值
 * @param {Object} data - 原始数据
 * @param {Object} defaults - 默认值映射
 * @returns {Object} 安全的数据对象
 */
export const createSafeRowData = (data, defaults = {}) => {
    const result = {};
    
    for (const [key, defaultValue] of Object.entries(defaults)) {
        result[key] = safeGet(data, key, defaultValue);
    }
    
    return result;
};

/**
 * 专门用于处理班级相关数据的安全映射
 * @param {Array} classList - 班级列表
 * @returns {Array} 安全的班级数据数组
 */
export const mapSafeClassData = (classList) => {
    return safeMap(classList, (classItem) => ({
        id: safeGet(classItem, '_id', ''),
        sclassName: getSafeClassName(classItem),
        description: safeGet(classItem, 'description', ''),
        grade: safeGet(classItem, 'grade', ''),
        maxStudents: safeGet(classItem, 'maxStudents', 50),
        currentStudents: safeGet(classItem, 'currentStudents', 0),
        status: safeGet(classItem, 'status', 'active'),
        createdAt: safeGet(classItem, 'createdAt', ''),
        updatedAt: safeGet(classItem, 'updatedAt', '')
    }));
};

/**
 * 专门用于处理科目相关数据的安全映射
 * @param {Array} subjectList - 科目列表
 * @returns {Array} 安全的科目数据数组
 */
export const mapSafeSubjectData = (subjectList) => {
    return safeMap(subjectList, (subject) => {
        // 处理多班级关联
        const mainClass = safeGet(subject, 'sclassName');
        const additionalClasses = safeGet(subject, 'additionalClasses', []);
        const allClasses = safeGet(subject, 'allClasses', []);

        // 如果有处理过的 allClasses，使用它；否则合并主班级和附加班级
        const classList = allClasses.length > 0 ? allClasses : [mainClass, ...additionalClasses].filter(Boolean);

        return {
            id: safeGet(subject, '_id', ''),
            subName: getSafeSubjectName(subject),
            subCode: safeGet(subject, 'subCode', ''),
            sessions: safeGet(subject, 'sessions', 0),
            description: safeGet(subject, 'description', ''),
            sclassName: getSafeClassName(mainClass),
            sclassID: getSafeClassId(mainClass),
            // 多班级支持
            allClasses: classList,
            classCount: safeGet(subject, 'classCount', classList.length),
            classNames: safeGet(subject, 'classNames', classList.map(cls => getSafeClassName(cls)).join(', ')),
            additionalClasses: additionalClasses,
            // 其他字段
            subjectType: safeGet(subject, 'subjectType', 'core'),
            credits: safeGet(subject, 'credits', 1),
            isRequired: safeGet(subject, 'isRequired', true),
            status: safeGet(subject, 'status', 'active'),
            teacher: safeGet(subject, 'teacher'),
            school: safeGet(subject, 'school', '')
        };
    });
};

/**
 * 专门用于处理学生相关数据的安全映射
 * @param {Array} studentList - 学生列表
 * @returns {Array} 安全的学生数据数组
 */
export const mapSafeStudentData = (studentList) => {
    return safeMap(studentList, (student) => ({
        id: safeGet(student, '_id', ''),
        name: getSafeUserName(student),
        rollNum: safeGet(student, 'rollNum', '未分配'),
        sclassName: getSafeClassName(safeGet(student, 'sclassName')),
        email: safeGet(student, 'email', ''),
        phone: safeGet(student, 'phone', ''),
        address: safeGet(student, 'address', '')
    }));
};

/**
 * 专门用于处理教师相关数据的安全映射
 * @param {Array} teacherList - 教师列表
 * @returns {Array} 安全的教师数据数组
 */
export const mapSafeTeacherData = (teacherList) => {
    return safeMap(teacherList, (teacher) => {
        // 处理多班级关联
        const mainClass = safeGet(teacher, 'teachSclass');
        const additionalClasses = safeGet(teacher, 'additionalClasses', []);
        const allClasses = safeGet(teacher, 'allClasses', []);

        // 如果有处理过的 allClasses，使用它；否则合并主班级和附加班级
        const classList = allClasses.length > 0 ? allClasses : [mainClass, ...additionalClasses].filter(Boolean);

        return {
            id: safeGet(teacher, '_id', ''),
            name: getSafeUserName(teacher),
            email: safeGet(teacher, 'email', ''),
            phone: safeGet(teacher, 'phone', ''),
            address: safeGet(teacher, 'address', ''),
            qualification: safeGet(teacher, 'qualification', ''),
            experience: safeGet(teacher, 'experience', 0),
            // 教学相关
            teachSubject: getSafeSubjectName(safeGet(teacher, 'teachSubject')),
            teachSclass: getSafeClassName(mainClass),
            teachSclassID: getSafeClassId(mainClass),
            // 多班级支持
            allClasses: classList,
            classCount: safeGet(teacher, 'classCount', classList.length),
            classNames: safeGet(teacher, 'classNames', classList.map(cls => getSafeClassName(cls)).join(', ')),
            additionalClasses: additionalClasses,
            // 其他字段
            teacherType: safeGet(teacher, 'teacherType', 'full-time'),
            position: safeGet(teacher, 'position', 'teacher'),
            status: safeGet(teacher, 'status', 'active'),
            school: safeGet(teacher, 'school', '')
        };
    });
};

export default {
    safeGet,
    getSafeClassName,
    getSafeClassId,
    getSafeSubjectName,
    getSafeUserName,
    safeMap,
    isValidObject,
    getSafeArrayLength,
    createSafeRowData,
    mapSafeClassData,
    mapSafeSubjectData,
    mapSafeStudentData,
    mapSafeTeacherData
};
