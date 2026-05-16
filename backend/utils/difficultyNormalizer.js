/**
 * difficulty 值规范化工具
 * 将 AI 返回的各种 difficulty 格式统一映射为 Schema enum 要求的完整中文值 ['初级', '中级', '高级']
 */

const VALID_DIFFICULTIES = ['初级', '中级', '高级'];

const DIFFICULTY_MAP = {
    // 中文简写
    '低': '初级', '简单': '初级',
    '中': '中级', '中等': '中级',
    '高': '高级', '困难': '高级',
    // 英文值
    'easy': '初级', 'low': '初级', 'beginner': '初级', 'basic': '初级',
    'medium': '中级', 'mid': '中级', 'intermediate': '中级', 'moderate': '中级',
    'hard': '中级', 'high': '高级', 'advanced': '高级', 'expert': '高级', 'difficult': '高级',
};

/**
 * 将各种 difficulty 值规范化为 Schema 合法的中文枚举值
 * @param {string|undefined|null} value - AI 返回的原始 difficulty 值
 * @returns {'初级'|'中级'|'高级'} 规范化后的合法值，默认 '中级'
 */
const normalizeDifficulty = (value) => {
    if (!value) return '中级';
    const str = String(value).trim();
    const lower = str.toLowerCase();

    // 精确匹配合法值
    if (VALID_DIFFICULTIES.includes(str)) return str;

    // 查找映射表
    const mapped = DIFFICULTY_MAP[lower] || DIFFICULTY_MAP[str];
    if (mapped) return mapped;

    // 包含匹配（如 "中级难度" 包含 "中级"）
    for (const valid of VALID_DIFFICULTIES) {
        if (str.includes(valid)) return valid;
    }

    return '中级';
};

module.exports = { normalizeDifficulty, VALID_DIFFICULTIES };
