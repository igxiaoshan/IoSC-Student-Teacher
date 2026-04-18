/**
 * 即梦AI配置文件
 * 基于火山引擎(Volcengine)的视觉生成服务
 */

module.exports = {
    // API配置
    API_URL: process.env.JIMENG_API_URL || 'https://visual.volcengineapi.com',
    API_KEY: process.env.JIMENG_API_KEY || '',
    ACCESS_KEY: process.env.VOLC_ACCESS_KEY || '',
    SECRET_KEY: process.env.VOLC_SECRET_KEY || '',

    // 功能开关
    IMAGE_ENABLED: process.env.JIMENG_IMAGE_ENABLED !== 'false',
    VIDEO_ENABLED: process.env.JIMENG_VIDEO_ENABLED !== 'false',

    // 文生图4.0默认参数
    imageDefaults: {
        req_key: 'jimeng_t2i_v40',  // 即梦4.0模型
        prompt: '',
        width: 1024,
        height: 1024,
        scale: 0.7,  // 文本影响程度 (0-1)
        seed: -1,  // -1 表示随机种子
    },

    // 文生视频3.0默认参数
    videoDefaults: {
        req_key: 'jimeng_t2v_v30',  // 即梦3.0模型
        prompt: '',
        duration: 5,  // 5秒或10秒
        resolution: '720p',  // 720p或1080p
        aspect_ratio: '16:9',  // 支持 16:9, 4:3, 1:1, 3:4, 9:16, 21:9
    },

    // 任务轮询配置
    polling: {
        maxAttempts: 60,
        intervalMs: 5000,
        timeoutMs: 300000,
    },

    // 服务信息
    getServiceInfo() {
        return {
            name: '即梦AI (Jimeng AI)',
            provider: '火山引擎 (Volcengine)',
            apiUrl: this.API_URL,
            imageEnabled: this.IMAGE_ENABLED,
            videoEnabled: this.VIDEO_ENABLED,
            configured: !!(this.ACCESS_KEY && this.SECRET_KEY),
        };
    },

    isImageEnabled() {
        return this.IMAGE_ENABLED && !!(this.ACCESS_KEY && this.SECRET_KEY);
    },

    isVideoEnabled() {
        return this.VIDEO_ENABLED && !!(this.ACCESS_KEY && this.SECRET_KEY);
    },
};
