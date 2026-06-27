// backend/controllers/videoLesson-controller.js
const path = require('path');
const fs = require('fs-extra');
const multer = require('multer');
const http = require('http');
const VideoLesson = require('../models/videoLessonSchema');

// Whisper 常驻服务地址（由 whisper_server.py 提供）
const WHISPER_SERVER_PORT = parseInt(process.env.WHISPER_SERVER_PORT || '8765', 10);
const WHISPER_SERVER_URL  = `http://127.0.0.1:${WHISPER_SERVER_PORT}`;

// ─── multer 配置 ────────────────────────────────────────────
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dest = path.join(__dirname, '../uploads/videos');
        fs.ensureDirSync(dest);
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `video-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
    },
});

const videoFilter = (req, file, cb) => {
    const allowed = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    allowed.includes(file.mimetype)
        ? cb(null, true)
        : cb(new Error('仅支持 MP4/WebM/OGG/MOV 格式'), false);
};

const upload = multer({
    storage,
    fileFilter: videoFilter,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
});

// ─── 工具：解析 WebVTT Cue 块 ───────────────────────────────
function parseVttCues(vttRaw) {
    const cues = [];
    const cueBlocks = vttRaw.split(/\n{2,}/);
    for (const block of cueBlocks) {
        const lines = block.trim().split('\n');
        const timeLine = lines.find(l => l.includes('-->'));
        if (!timeLine) continue;
        const [startTime, endTime] = timeLine.split('-->').map(s => s.trim());
        const textLines = lines.filter(l => !l.includes('-->') && !/^\d+$/.test(l.trim()));
        const text = textLines.join('\n').trim();
        if (text) cues.push({ startTime, endTime, text });
    }
    return cues;
}

// ─── 工具：将 JSON segments 组装为 WebVTT 字符串 ─────────────
function buildVttFromSegments(segments) {
    const lines = ['WEBVTT', ''];
    segments.forEach((seg, i) => {
        lines.push(String(i + 1));
        lines.push(`${seg.startFmt} --> ${seg.endFmt}`);
        lines.push(seg.text);
        lines.push('');
    });
    return lines.join('\n');
}

// ─── 上传视频 POST /api/video-lesson/upload ──────────────────
const uploadVideo = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: '未收到视频文件' });
        }
        const { teacherId, title, description = '', contentScript = '', duration = 0 } = req.body;
        if (!teacherId || !title) {
            await fs.remove(req.file.path);
            return res.status(400).json({ success: false, message: 'teacherId 和 title 为必填项' });
        }

        const lesson = await VideoLesson.create({
            teacherId,
            title,
            description,
            contentScript,
            duration: Number(duration),
            fileName:     req.file.filename,
            originalName: req.file.originalname,
            fileSize:     req.file.size,
            mimeType:     req.file.mimetype,
        });

        res.json({
            success: true,
            message: '视频上传成功',
            lesson: {
                _id:            lesson._id,
                title:          lesson.title,
                fileName:       lesson.fileName,
                fileSize:       lesson.fileSize,
                videoUrl:       `/uploads/videos/${lesson.fileName}`,
                subtitleStatus: lesson.subtitleStatus,
            },
        });
    } catch (err) {
        if (req.file?.path) await fs.remove(req.file.path).catch(() => {});
        console.error('[VideoLesson] 上传失败:', err);
        res.status(500).json({ success: false, message: '视频上传失败', error: err.message });
    }
};

// ─── 获取教师的视频列表 GET /api/video-lesson/list/:teacherId ──
const getTeacherVideos = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const lessons = await VideoLesson.find({ teacherId })
            .select('-subtitleVtt -subtitleCues')
            .sort({ createdAt: -1 });
        res.json({ success: true, lessons });
    } catch (err) {
        res.status(500).json({ success: false, message: '获取列表失败', error: err.message });
    }
};

// ─── 获取单个视频详情（含字幕）GET /api/video-lesson/:id ──────
const getVideoDetail = async (req, res) => {
    try {
        const lesson = await VideoLesson.findById(req.params.id);
        if (!lesson) return res.status(404).json({ success: false, message: '视频不存在' });
        res.json({
            success: true,
            lesson: {
                ...lesson.toObject(),
                videoUrl: `/uploads/videos/${lesson.fileName}`,
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: '获取失败', error: err.message });
    }
};

// ─── 删除视频 DELETE /api/video-lesson/:id ───────────────────
const deleteVideo = async (req, res) => {
    try {
        const lesson = await VideoLesson.findById(req.params.id);
        if (!lesson) return res.status(404).json({ success: false, message: '视频不存在' });

        const filePath = path.join(__dirname, '../uploads/videos', lesson.fileName);
        await fs.remove(filePath).catch(() => {});
        await VideoLesson.deleteOne({ _id: req.params.id });

        res.json({ success: true, message: '视频已删除' });
    } catch (err) {
        res.status(500).json({ success: false, message: '删除失败', error: err.message });
    }
};

// ─── SSE 字幕生成 GET /api/video-lesson/:id/subtitle-events ──
// 建立 SSE 连接后立即启动 Python --stream 模式，
// 每识别一条字幕立即推送事件，前端无需轮询
const streamSubtitleSSE = async (req, res) => {
    // 禁用 Nagle 算法，确保每次 write 立即发送，不积攒在 TCP 缓冲区
    if (req.socket) req.socket.setNoDelay(true);

    // 设置 SSE 响应头
    res.writeHead(200, {
        'Content-Type':      'text/event-stream; charset=utf-8',
        'Cache-Control':     'no-cache',
        'Connection':        'keep-alive',
        'X-Accel-Buffering': 'no',
    });
    res.flushHeaders();

    // SSE 辅助函数：写完立即 flush socket
    const sendEvent = (event, data) => {
        try {
            res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
            // 强制冲刷 socket 缓冲，确保浏览器立即收到
            if (req.socket && !req.socket.destroyed) req.socket.flush?.();
        } catch (_) { /* 连接已关闭 */ }
    };
    const sendKeepAlive = () => {
        try { res.write(': keep-alive\n\n'); } catch (_) {}
    };

    let lesson;
    try {
        lesson = await VideoLesson.findById(req.params.id);
    } catch (err) {
        sendEvent('error', { message: '数据库查询失败' });
        return res.end();
    }

    if (!lesson) {
        sendEvent('error', { message: '视频不存在' });
        return res.end();
    }

    // 若已有字幕，重放历史数据后直接关闭
    if (lesson.subtitleStatus === 'done' && lesson.subtitleCues?.length > 0) {
        lesson.subtitleCues.forEach((cue, i) => {
            sendEvent('segment', {
                index:    i + 1,
                startFmt: cue.startTime,
                endFmt:   cue.endTime,
                text:     cue.text,
            });
        });
        sendEvent('done', { total: lesson.subtitleCues.length, cached: true });
        return res.end();
    }

    // 若正在生成中，拒绝重复连接
    if (lesson.subtitleStatus === 'generating') {
        sendEvent('error', { message: '字幕正在生成中，请勿重复操作' });
        return res.end();
    }

    // 检查视频文件
    const videoPath = path.join(__dirname, '../uploads/videos', lesson.fileName);
    if (!await fs.pathExists(videoPath)) {
        sendEvent('error', { message: '视频文件不存在，请重新上传' });
        return res.end();
    }

    // 标记为生成中
    await VideoLesson.findByIdAndUpdate(req.params.id, { subtitleStatus: 'generating' });
    console.log(`[VideoLesson] SSE 流式 ASR 启动: ${lesson.fileName}`);

    // keep-alive 定时器（防止 Nginx/代理 60s 断连）
    const keepAliveTimer = setInterval(sendKeepAlive, 15000);

    const allSegments = [];
    let lineBuffer = '';
    let closed = false;

    const cleanup = (status) => {
        if (closed) return;
        closed = true;
        clearInterval(keepAliveTimer);
        if (!res.writableEnded) res.end();
        if (status) {
            VideoLesson.findByIdAndUpdate(req.params.id, { subtitleStatus: status }).catch(() => {});
        }
    };

    // 客户端断开时，继续后台处理（转录结果仍写库）
    req.on('close', () => {
        closed = true;
        clearInterval(keepAliveTimer);
    });

    // ── 调用 Whisper 常驻服务（模型已在内存，无冷启动等待）
    const postBody = JSON.stringify({ video_path: videoPath, chunk_secs: 5 });
    const whisperReq = http.request({
        hostname: '127.0.0.1',
        port:     WHISPER_SERVER_PORT,
        path:     '/transcribe',
        method:   'POST',
        headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postBody) },
    }, (whisperRes) => {
        // 禁用 Nagle，让每个数据块立即从 Whisper 服务传到 Node.js
        if (whisperRes.socket) whisperRes.socket.setNoDelay(true);
        whisperRes.setEncoding('utf8');

        whisperRes.on('data', (chunk) => {
            lineBuffer += chunk;
            const lines = lineBuffer.split('\n');
            lineBuffer = lines.pop();

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;
                try {
                    const obj = JSON.parse(trimmed);

                    if (obj.done) {
                        const vttRaw = buildVttFromSegments(allSegments);
                        const cues = allSegments.map(s => ({
                            startTime: s.startFmt,
                            endTime:   s.endFmt,
                            text:      s.text,
                        }));
                        VideoLesson.findByIdAndUpdate(req.params.id, {
                            subtitleVtt:    vttRaw,
                            subtitleCues:   cues,
                            subtitleStatus: cues.length > 0 ? 'done' : 'failed',
                        }).catch(err => console.error('[VideoLesson] 存库失败:', err));
                        if (!closed) sendEvent('done', { total: obj.total });
                        cleanup(null);

                    } else if (obj.error) {
                        console.error('[VideoLesson] Whisper 服务错误:', obj.error);
                        if (!closed) sendEvent('error', { message: obj.error });
                        cleanup('failed');

                    } else if (obj.index !== undefined) {
                        allSegments.push(obj);
                        if (!closed) sendEvent('segment', obj);
                    }
                } catch (e) {
                    console.warn('[VideoLesson] JSON 解析失败:', trimmed);
                }
            }
        });

        whisperRes.on('end', () => {
            // 处理残余 buffer
            if (lineBuffer.trim()) {
                try {
                    const obj = JSON.parse(lineBuffer.trim());
                    if (obj.done && !closed) sendEvent('done', { total: obj.total });
                } catch (_) {}
            }
            cleanup(null);
        });
    });

    whisperReq.on('error', (err) => {
        const msg = err.code === 'ECONNREFUSED'
            ? 'Whisper 服务未启动，请先运行 whisper_server.py'
            : `连接 Whisper 服务失败: ${err.message}`;
        console.error('[VideoLesson]', msg);
        if (!closed) sendEvent('error', { message: msg });
        cleanup('failed');
    });

    whisperReq.write(postBody);
    whisperReq.end();
};

// ─── 下载 VTT 文件 GET /api/video-lesson/:id/subtitle.vtt ─────
const downloadSubtitle = async (req, res) => {
    try {
        const lesson = await VideoLesson.findById(req.params.id).select('subtitleVtt title');
        if (!lesson?.subtitleVtt) return res.status(404).send('字幕不存在');
        res.setHeader('Content-Type', 'text/vtt; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(lesson.title)}.vtt"`);
        res.send(lesson.subtitleVtt);
    } catch (err) {
        res.status(500).send('获取字幕失败');
    }
};

module.exports = {
    upload,
    uploadVideo,
    getTeacherVideos,
    getVideoDetail,
    deleteVideo,
    streamSubtitleSSE,
    downloadSubtitle,
};
