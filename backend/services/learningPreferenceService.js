/**
 * 学习偏好服务
 * 根据学生学习风格排序资源和生成难度配置
 */

const CourseContent = require('../models/courseContentSchema');
const Courseware = require('../models/coursewareSchema');

// 学习风格对应的资源类型优先级
const LEARNING_STYLE_PRIORITY = {
    visual: ['video', 'image', 'document', 'link'],      // 视觉学习者：视频优先
    auditory: ['video', 'link', 'document', 'image'],    // 听觉学习者：视频优先
    reading: ['document', 'link', 'video', 'image'],     // 阅读学习者：文档优先
    kinesthetic: ['link', 'video', 'document', 'image']  // 动手学习者：交互链接优先
};

// 学习风格显示名称
const LEARNING_STYLE_LABELS = {
    visual: '视觉学习者',
    auditory: '听觉学习者',
    reading: '阅读学习者',
    kinesthetic: '动手学习者'
};

// 难度等级显示名称
const DIFFICULTY_LABELS = {
    beginner: '初级',
    intermediate: '中级',
    advanced: '高级'
};

/**
 * 根据学习风格排序资源
 * @param {Array} resources - 资源列表
 * @param {String} learningStyle - 学习风格 (visual/auditory/reading/kinesthetic)
 * @returns {Array} 排序后的资源列表
 */
function sortResourcesByLearningStyle(resources, learningStyle = 'visual') {
    if (!resources || !Array.isArray(resources)) return [];

    const priorityOrder = LEARNING_STYLE_PRIORITY[learningStyle] || LEARNING_STYLE_PRIORITY.visual;
    const priorityMap = {};
    priorityOrder.forEach((type, index) => {
        priorityMap[type] = index;
    });

    return [...resources].sort((a, b) => {
        const typeA = a.type || 'document';
        const typeB = b.type || 'document';
        return (priorityMap[typeA] ?? 999) - (priorityMap[typeB] ?? 999);
    });
}

/**
 * 获取资源类型图标
 */
function getResourceTypeIcon(type) {
    const icons = {
        video: '🎬',
        document: '📄',
        image: '🖼️',
        link: '🔗'
    };
    return icons[type] || '📎';
}

/**
 * 获取科目的课程资源（按学习偏好排序）
 * @param {String} subjectId - 科目ID
 * @param {Object} learningPreferences - 学习偏好
 * @returns {Promise<Object>} 排序后的资源和偏好信息
 */
async function getSubjectResources(subjectId, learningPreferences = {}) {
    const { preferredLearningStyle = 'visual', difficulty = 'intermediate' } = learningPreferences;

    // 查询课程内容
    const courseContents = await CourseContent.find({
        subject: subjectId,
        isPublished: true
    }).lean();

    // 查询课件
    const coursewares = await Courseware.find({
        subject: subjectId,
        status: '已发布'
    }).lean();

    // 合并资源
    let allResources = [];

    // 从课程内容提取资源
    courseContents.forEach(content => {
        if (content.resources && content.resources.length > 0) {
            content.resources.forEach(res => {
                allResources.push({
                    id: res._id,
                    title: res.title || content.title,
                    type: res.type || 'document',
                    url: res.url,
                    description: res.description || content.description,
                    source: 'courseContent',
                    sourceId: content._id,
                    difficulty: content.difficulty || 'beginner',
                    estimatedDuration: content.estimatedDuration
                });
            });
        }
    });

    // 从课件提取资源
    coursewares.forEach(cw => {
        // 添加上传的文档
        if (cw.uploadedDocuments && cw.uploadedDocuments.length > 0) {
            cw.uploadedDocuments.forEach(doc => {
                allResources.push({
                    id: doc._id,
                    title: doc.originalName || doc.fileName,
                    type: 'document',
                    url: doc.filePath,
                    description: `课件文档 - ${cw.title}`,
                    source: 'courseware',
                    sourceId: cw._id,
                    difficulty: 'intermediate'
                });
            });
        }

        // 添加讲座资源
        if (cw.teachingContent?.lectures) {
            cw.teachingContent.lectures.forEach(lecture => {
                if (lecture.resources && lecture.resources.length > 0) {
                    lecture.resources.forEach(url => {
                        allResources.push({
                            id: `${cw._id}_lecture_${lecture.title}`,
                            title: lecture.title,
                            type: guessResourceType(url),
                            url: url,
                            description: `讲座 - ${cw.title}`,
                            source: 'courseware',
                            sourceId: cw._id,
                            difficulty: 'intermediate',
                            estimatedDuration: lecture.duration
                        });
                    });
                }
            });
        }
    });

    // 按学习风格排序资源
    const sortedResources = sortResourcesByLearningStyle(allResources, preferredLearningStyle);

    // 按难度筛选（可选）
    const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };
    const targetDifficulty = difficultyOrder[difficulty] || 2;

    // 获取学习偏好信息
    const preferenceInfo = {
        learningStyle: preferredLearningStyle,
        learningStyleLabel: LEARNING_STYLE_LABELS[preferredLearningStyle] || '视觉学习者',
        difficulty: difficulty,
        difficultyLabel: DIFFICULTY_LABELS[difficulty] || '中级',
        totalResources: sortedResources.length,
        resourceTypeDistribution: getResourceTypeDistribution(sortedResources)
    };

    return {
        resources: sortedResources,
        preferenceInfo,
        filteredByDifficulty: sortedResources.filter(r => {
            const resDifficulty = difficultyOrder[r.difficulty] || 2;
            return resDifficulty <= targetDifficulty;
        })
    };
}

/**
 * 从URL猜测资源类型
 */
function guessResourceType(url) {
    if (!url) return 'link';
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('video') || lowerUrl.match(/\.(mp4|webm|avi|mov)(\?|$)/)) return 'video';
    if (lowerUrl.match(/\.(jpg|jpeg|png|gif|svg|webp)(\?|$)/)) return 'image';
    if (lowerUrl.match(/\.(pdf|doc|docx|ppt|pptx|xls|xlsx|txt)(\?|$)/)) return 'document';
    return 'link';
}

/**
 * 获取资源类型分布
 */
function getResourceTypeDistribution(resources) {
    const distribution = { video: 0, document: 0, image: 0, link: 0 };
    resources.forEach(r => {
        const type = r.type || 'document';
        if (distribution.hasOwnProperty(type)) {
            distribution[type]++;
        }
    });
    return distribution;
}

/**
 * 获取默认学习偏好
 */
function getDefaultPreferences() {
    return {
        difficulty: 'intermediate',
        studyGoals: [],
        preferredLearningStyle: 'visual'
    };
}

module.exports = {
    sortResourcesByLearningStyle,
    getSubjectResources,
    getDefaultPreferences,
    LEARNING_STYLE_PRIORITY,
    LEARNING_STYLE_LABELS,
    DIFFICULTY_LABELS,
    getResourceTypeIcon
};
