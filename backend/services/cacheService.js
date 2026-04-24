/**
 * 改进的 AI 缓存服务
 * 支持 Redis 缓存、内容 Hash 缓存键、缓存失效策略
 */

const crypto = require('crypto');

// 缓存配置
const CACHE_CONFIG = {
    enabled: process.env.AI_CACHE_ENABLED !== 'false',
    ttl: parseInt(process.env.AI_CACHE_TTL) || 3600, // 默认 1 小时
    maxSize: parseInt(process.env.AI_CACHE_MAX_SIZE) || 1000,
    // 不同类型请求的 TTL
    ttlByType: {
        lessonPlan: 7200,      // 2 小时
        questionGeneration: 3600, // 1 小时
        answerAnalysis: 1800,  // 30 分钟
        practice: 1800,        // 30 分钟
        chatbot: 300,          // 5 分钟（对话缓存时间短）
        default: 3600,
    },
};

// 内存缓存（备用）
class MemoryCache {
    constructor(maxSize = 1000) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0,
        };
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) {
            this.stats.misses++;
            return null;
        }

        // 检查是否过期
        if (Date.now() > item.expiresAt) {
            this.cache.delete(key);
            this.stats.misses++;
            return null;
        }

        this.stats.hits++;
        return item.value;
    }

    set(key, value, ttl) {
        // LRU 淘汰策略
        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
            this.stats.evictions++;
        }

        this.cache.set(key, {
            value,
            expiresAt: Date.now() + (ttl * 1000),
            createdAt: Date.now(),
        });
    }

    delete(key) {
        return this.cache.delete(key);
    }

    clear() {
        this.cache.clear();
    }

    getStats() {
        const hitRate = this.stats.hits + this.stats.misses > 0
            ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
            : 0;

        return {
            ...this.stats,
            size: this.cache.size,
            hitRate: `${hitRate}%`,
        };
    }
}

// Redis 缓存客户端（可选）
let redisClient = null;

/**
 * 初始化 Redis 连接
 */
const initRedis = async () => {
    if (process.env.REDIS_URL) {
        try {
            const redis = require('redis');
            redisClient = redis.createClient({ url: process.env.REDIS_URL });
            await redisClient.connect();
            console.log('✅ AI Cache: Redis connected');
        } catch (error) {
            console.warn('⚠️ AI Cache: Redis connection failed, using memory cache');
            redisClient = null;
        }
    }
};

// 内存缓存实例
const memoryCache = new MemoryCache(CACHE_CONFIG.maxSize);

/**
 * 生成内容 Hash 作为缓存键
 * @param {string} prefix - 缓存键前缀
 * @param {Object} content - 要哈希的内容
 * @returns {string} 缓存键
 */
const generateContentHash = (prefix, content) => {
    const contentStr = JSON.stringify(content);
    const hash = crypto
        .createHash('sha256')
        .update(contentStr)
        .digest('hex')
        .substring(0, 16); // 取前 16 位

    return `${prefix}:${hash}`;
};

/**
 * 智能缓存键生成器
 * 根据请求类型和内容生成最优缓存键
 */
const generateCacheKey = {
    // 课件生成
    lessonPlan: (req) => {
        const content = {
            subject: req.body.subject,
            topic: req.body.topic,
            grade: req.body.grade,
            difficulty: req.body.difficulty,
        };
        return generateContentHash('lesson', content);
    },

    // 题目生成
    questionGeneration: (req) => {
        const content = {
            subject: req.body.subject,
            type: req.body.questionType,
            difficulty: req.body.difficulty,
            count: req.body.count,
            topic: req.body.topic,
        };
        return generateContentHash('question', content);
    },

    // 答案分析
    answerAnalysis: (req) => {
        const content = {
            questionId: req.params.questionId || req.body.questionId,
            answer: req.body.answer?.substring(0, 100), // 只取答案前 100 字符
        };
        return generateContentHash('analysis', content);
    },

    // 练习生成
    practice: (req) => {
        const content = {
            studentId: req.params.studentId,
            subject: req.body.subject,
            difficulty: req.body.difficulty,
            count: req.body.count,
        };
        return generateContentHash('practice', content);
    },

    // 对话（短缓存）
    chatbot: (req) => {
        const content = {
            userId: req.user?.id || 'anonymous',
            message: req.body.message?.substring(0, 50), // 只取消息前 50 字符
        };
        return generateContentHash('chat', content);
    },

    // 通用
    default: (req) => {
        const content = {
            path: req.path,
            body: req.body,
            query: req.query,
        };
        return generateContentHash('default', content);
    },
};

/**
 * 获取缓存
 * @param {string} key - 缓存键
 * @returns {Promise<any>} 缓存值
 */
const getCache = async (key) => {
    if (!CACHE_CONFIG.enabled) return null;

    // 优先使用 Redis
    if (redisClient) {
        try {
            const cached = await redisClient.get(key);
            if (cached) {
                return JSON.parse(cached);
            }
        } catch (error) {
            console.error('Redis get error:', error);
        }
    }

    // 回退到内存缓存
    return memoryCache.get(key);
};

/**
 * 设置缓存
 * @param {string} key - 缓存键
 * @param {any} value - 缓存值
 * @param {string} type - 缓存类型（用于确定 TTL）
 * @returns {Promise<void>}
 */
const setCache = async (key, value, type = 'default') => {
    if (!CACHE_CONFIG.enabled) return;

    const ttl = CACHE_CONFIG.ttlByType[type] || CACHE_CONFIG.ttl;

    // Redis 缓存
    if (redisClient) {
        try {
            await redisClient.setEx(key, ttl, JSON.stringify(value));
        } catch (error) {
            console.error('Redis set error:', error);
        }
    }

    // 同时更新内存缓存
    memoryCache.set(key, value, ttl);
};

/**
 * 删除缓存
 * @param {string} key - 缓存键
 * @param {boolean} pattern - 是否按模式删除
 */
const deleteCache = async (key, pattern = false) => {
    if (redisClient) {
        if (pattern) {
            // 按模式删除（需要 Redis SCAN）
            const keys = await redisClient.keys(key);
            if (keys.length > 0) {
                await redisClient.del(keys);
            }
        } else {
            await redisClient.del(key);
        }
    }

    memoryCache.delete(key);
};

/**
 * 清除所有缓存
 */
const clearAllCache = async () => {
    if (redisClient) {
        await redisClient.flushDb();
    }
    memoryCache.clear();
};

/**
 * AI 缓存中间件
 * @param {string} type - 缓存类型
 * @param {Function} keyGenerator - 自定义键生成器
 */
const aiCacheMiddleware = (type, keyGenerator) => {
    return async (req, res, next) => {
        if (!CACHE_CONFIG.enabled) {
            return next();
        }

        try {
            // 生成缓存键
            const cacheKey = typeof keyGenerator === 'function'
                ? keyGenerator(req)
                : generateCacheKey[type]?.(req) || generateCacheKey.default(req);

            req.cacheKey = cacheKey;

            // 尝试获取缓存
            const cached = await getCache(cacheKey);
            if (cached) {
                console.log(`[Cache HIT] ${cacheKey}`);
                return res.json({
                    ...cached,
                    _cached: true,
                    _cacheKey: cacheKey,
                });
            }

            console.log(`[Cache MISS] ${cacheKey}`);

            // 拦截响应以缓存结果
            const originalJson = res.json.bind(res);
            res.json = async (data) => {
                // 只缓存成功的响应
                if (data && data.success !== false && !data.error) {
                    await setCache(cacheKey, data, type);
                }
                return originalJson(data);
            };

            next();
        } catch (error) {
            console.error('Cache middleware error:', error);
            next();
        }
    };
};

/**
 * 缓存预热
 * 预先加载常用数据到缓存
 */
const warmupCache = async () => {
    console.log('🔥 Warming up AI cache...');
    // 可以在这里预加载常用的 AI 配置、模板等
    console.log('✅ AI cache warmup complete');
};

// 初始化
initRedis().catch(console.error);

module.exports = {
    aiCacheMiddleware,
    generateCacheKey,
    generateContentHash,
    getCache,
    setCache,
    deleteCache,
    clearAllCache,
    getCacheStats: () => memoryCache.getStats(),
    warmupCache,
    CACHE_CONFIG,
};