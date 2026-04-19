/**
 * 视频下载工具类
 * 模拟浏览器请求，支持重试和进度显示
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class VideoDownloader {
    constructor(options = {}) {
        this.timeout = options.timeout || 300000; // 默认5分钟
        this.retries = options.retries || 3;
        // 即梦/剪映CDN允许的Referer
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Encoding': 'identity;q=1, *;q=0',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Referer': 'https://jimeng.jianying.com/',
            'Origin': 'https://jimeng.jianying.com',
            'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'Sec-Fetch-Dest': 'video',
            'Sec-Fetch-Mode': 'no-cors',
            'Sec-Fetch-Site': 'cross-site',
            'Range': 'bytes=0-'
        };
    }

    /**
     * 下载视频到本地
     * @param {string} videoUrl - 即梦返回的视频URL
     * @param {string} saveDir - 保存目录
     * @param {string} fileName - 文件名（不含扩展名）
     * @returns {Promise<{success: boolean, filePath: string, size: number}>}
     */
    async download(videoUrl, saveDir = './videos', fileName = null) {
        // 确保目录存在
        if (!fs.existsSync(saveDir)) {
            fs.mkdirSync(saveDir, { recursive: true });
        }

        // 生成文件名
        const finalFileName = fileName || `video_${Date.now()}`;
        const filePath = path.join(saveDir, `${finalFileName}.mp4`);

        let lastError = null;

        for (let attempt = 1; attempt <= this.retries; attempt++) {
            try {
                console.log(`[下载尝试 ${attempt}/${this.retries}] ${videoUrl}`);

                const response = await axios({
                    method: 'get',
                    url: videoUrl,
                    responseType: 'stream',
                    timeout: this.timeout,
                    headers: this.headers,
                    maxRedirects: 5,
                    decompress: false
                });

                // 获取文件大小
                const contentLength = response.headers['content-length'];
                console.log(`[下载开始] Content-Length: ${contentLength || 'unknown'}`);

                const writer = fs.createWriteStream(filePath);

                // 使用pipeline确保流正确关闭
                await new Promise((resolve, reject) => {
                    let downloadedBytes = 0;

                    response.data.on('data', (chunk) => {
                        downloadedBytes += chunk.length;
                        // 每10MB打印一次进度
                        if (downloadedBytes % (10 * 1024 * 1024) < chunk.length) {
                            console.log(`[下载进度] ${(downloadedBytes / 1024 / 1024).toFixed(2)} MB`);
                        }
                    });

                    response.data.pipe(writer);

                    writer.on('finish', () => {
                        const stats = fs.statSync(filePath);
                        resolve({
                            success: true,
                            filePath,
                            size: stats.size
                        });
                    });

                    writer.on('error', reject);
                    response.data.on('error', reject);
                });

                return {
                    success: true,
                    filePath,
                    size: fs.statSync(filePath).size
                };

            } catch (error) {
                lastError = error;
                console.error(`[下载失败 尝试${attempt}]`, error.message);

                // 清理未完成的文件
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }

                // 403错误不再重试，直接抛出
                if (error.response?.status === 403) {
                    throw new Error(`下载被禁止(403): 可能是Referer限制或链接已过期. URL: ${videoUrl}`);
                }

                // 最后一次尝试失败
                if (attempt === this.retries) {
                    break;
                }

                // 指数退避重试
                await new Promise(r => setTimeout(r, 1000 * attempt));
            }
        }

        throw new Error(`下载失败(已重试${this.retries}次): ${lastError.message}`);
    }

    /**
     * 流式下载并返回给客户端（用于API中转）
     * @param {string} videoUrl
     * @param {object} res - Express response对象
     */
    async pipeToResponse(videoUrl, res) {
        try {
            const response = await axios({
                method: 'get',
                url: videoUrl,
                responseType: 'stream',
                timeout: this.timeout,
                headers: this.headers,
                maxRedirects: 5,
                decompress: false
            });

            // 透传必要的响应头
            const headersToForward = ['content-type', 'content-length', 'accept-ranges', 'etag'];
            headersToForward.forEach(h => {
                if (response.headers[h]) {
                    res.setHeader(h, response.headers[h]);
                }
            });

            // 设置文件名（用于前端保存）
            res.setHeader('Content-Disposition', `attachment; filename="video_${Date.now()}.mp4"`);

            response.data.pipe(res);

            return new Promise((resolve, reject) => {
                response.data.on('end', resolve);
                response.data.on('error', reject);
            });

        } catch (error) {
            console.error('[流式下载失败]', error.message);
            if (!res.headersSent) {
                res.status(500).json({ error: '视频下载失败', message: error.message });
            }
        }
    }
}

// 创建默认实例
const videoDownloader = new VideoDownloader();

/**
 * 下载视频到指定目录（便捷函数）
 * @param {string} videoUrl - 视频URL
 * @param {string} saveDir - 保存目录
 * @param {string} fileName - 文件名（不含扩展名）
 */
const downloadVideo = async (videoUrl, saveDir, fileName) => {
    return videoDownloader.download(videoUrl, saveDir, fileName);
};

module.exports = {
    VideoDownloader,
    downloadVideo,
    videoDownloader
};