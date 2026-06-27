# 教师端视频上传+播放+AI字幕生成 实施计划

**目标：** 教师可上传本地视频，系统调用 Gemini AI 自动生成时间轴字幕，前端播放器同步展示字幕。

**架构：**
视频文件通过 multer 存储到 `backend/uploads/videos/`，由 Express 静态服务提供流式访问。字幕生成分两步：先提取音频描述（Gemini 文本推断或直接提示词生成），输出标准 WebVTT 格式存入 MongoDB；前端使用 HTML5 `<video>` + `<track>` 标签原生渲染字幕，无需第三方播放器。

**技术栈：** multer（已有）、GeminiService（已有）、Mongoose、HTML5 Video API、WebVTT、React MUI

---

## 需求分析与约束

### 字幕生成策略
> 浏览器端无法直接做语音转文字（需后端 ASR），项目无 Whisper/Azure Speech 等 ASR 服务。
> **选用方案：** 教师上传视频时，同时输入「视频内容描述/讲稿」文本，Gemini 根据描述生成带时间戳的 WebVTT 字幕。这是最小可行、零额外依赖的实现。

### 文件访问
`backend/index.js:33` 已配置 `/videos` 静态路由，上传目录 `backend/videos/` 可直接访问。

---

## 任务列表

| 任务 | 内容 | 依赖 |
|------|------|------|
| T1 | 数据模型 VideoLesson | — |
| T2 | 后端视频上传接口 | T1 |
| T3 | 后端 AI 字幕生成接口 | T1 |
| T4 | 后端路由注册 | T2, T3 |
| T5 | 前端 API 封装 | T4 |
| T6 | 前端视频管理页面 | T5 |
| T7 | TeacherDashboard 路由 + SideBar 导航 | T6 |
| T8 | i18n 词条 | — |

---

## 任务 T1: 数据模型 VideoLesson

**文件：**
- 创建: `backend/models/videoLessonSchema.js`

**步骤 1: 创建 Mongoose Schema**

```javascript
// backend/models/videoLessonSchema.js
const mongoose = require('mongoose');

const subtitleCueSchema = new mongoose.Schema({
    startTime: { type: String, required: true }, // "00:00:05.000"
    endTime:   { type: String, required: true }, // "00:00:10.000"
    text:      { type: String, required: true },
}, { _id: false });

const videoLessonSchema = new mongoose.Schema({
    teacherId:    { type: mongoose.Schema.Types.ObjectId, ref: 'teacher', required: true },
    title:        { type: String, required: true, trim: true },
    description:  { type: String, default: '' },
    // 视频文件
    fileName:     { type: String, required: true },   // 磁盘文件名
    originalName: { type: String, required: true },   // 原始文件名
    fileSize:     { type: Number },                   // bytes
    duration:     { type: Number, default: 0 },       // 秒，前端传入
    mimeType:     { type: String },
    // 字幕
    subtitleStatus: {
        type: String,
        enum: ['none', 'generating', 'done', 'failed'],
        default: 'none'
    },
    subtitleCues:   { type: [subtitleCueSchema], default: [] },
    subtitleVtt:    { type: String, default: '' },    // 完整 WebVTT 内容（冗余存储，方便直接下载）
    // 教师输入的内容描述（用于 AI 字幕生成）
    contentScript:  { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('videoLesson', videoLessonSchema);
```

**步骤 2: 验证模型可被 require**
```bash
cd backend && node -e "require('./models/videoLessonSchema'); console.log('OK')"
# 预期输出: OK
```

---

## 任务 T2: 后端视频上传接口

**文件：**
- 创建: `backend/controllers/videoLesson-controller.js`

```javascript
// backend/controllers/videoLesson-controller.js
const path = require('path');
const fs = require('fs-extra');
const multer = require('multer');
const VideoLesson = require('../models/videoLessonSchema');

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
                _id:         lesson._id,
                title:       lesson.title,
                fileName:    lesson.fileName,
                fileSize:    lesson.fileSize,
                videoUrl:    `/uploads/videos/${lesson.fileName}`,
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

module.exports = { upload, uploadVideo, getTeacherVideos, getVideoDetail, deleteVideo };
```

---

## 任务 T3: 后端 AI 字幕生成接口

在 `backend/controllers/videoLesson-controller.js` 末尾追加以下函数，并更新 `module.exports`：

```javascript
// ─── AI 字幕生成 POST /api/video-lesson/:id/generate-subtitle ─
const geminiService = require('../services/geminiService');

const generateSubtitle = async (req, res) => {
    try {
        const lesson = await VideoLesson.findById(req.params.id);
        if (!lesson) return res.status(404).json({ success: false, message: '视频不存在' });
        if (lesson.subtitleStatus === 'generating') {
            return res.status(409).json({ success: false, message: '字幕正在生成中，请稍候' });
        }

        // 更新状态为生成中
        lesson.subtitleStatus = 'generating';
        await lesson.save();

        const script = lesson.contentScript || `视频标题：${lesson.title}，时长约 ${lesson.duration} 秒`;
        const durationSec = lesson.duration || 60;

        const prompt = `你是一名字幕生成专家。根据以下视频信息，生成一段 WebVTT 格式的字幕文件。

视频标题：${lesson.title}
视频时长：${durationSec} 秒
视频内容描述/讲稿：
${script}

要求：
1. 输出标准 WebVTT 格式，第一行必须是 "WEBVTT"
2. 每条字幕时长 4~8 秒，字幕条数与视频时长匹配
3. 每条字幕不超过 30 个汉字（或 60 个英文字符）
4. 时间戳格式：HH:MM:SS.mmm --> HH:MM:SS.mmm
5. 只输出 WebVTT 内容，不要任何解释文字

示例格式：
WEBVTT

1
00:00:00.000 --> 00:00:05.000
这是第一条字幕内容

2
00:00:05.000 --> 00:00:10.000
这是第二条字幕内容`;

        geminiService.initialize();
        const result = await geminiService.chat(
            [{ role: 'user', content: prompt }],
            { temperature: 0.3, max_tokens: 4000 }
        );

        const vttRaw = (result.content || '').trim();

        // 解析 WebVTT 为结构化数组
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

        lesson.subtitleVtt    = vttRaw;
        lesson.subtitleCues   = cues;
        lesson.subtitleStatus = cues.length > 0 ? 'done' : 'failed';
        await lesson.save();

        res.json({
            success: true,
            message: `字幕生成完成，共 ${cues.length} 条`,
            subtitleStatus: lesson.subtitleStatus,
            subtitleVtt: lesson.subtitleVtt,
            subtitleCues: lesson.subtitleCues,
        });
    } catch (err) {
        // 生成失败，回写状态
        await VideoLesson.findByIdAndUpdate(req.params.id, { subtitleStatus: 'failed' }).catch(() => {});
        console.error('[VideoLesson] 字幕生成失败:', err);
        res.status(500).json({ success: false, message: '字幕生成失败', error: err.message });
    }
};

// ─── 下载 VTT 文件 GET /api/video-lesson/:id/subtitle.vtt ─────
const downloadSubtitle = async (req, res) => {
    const lesson = await VideoLesson.findById(req.params.id).select('subtitleVtt title');
    if (!lesson?.subtitleVtt) return res.status(404).send('字幕不存在');
    res.setHeader('Content-Type', 'text/vtt; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(lesson.title)}.vtt"`);
    res.send(lesson.subtitleVtt);
};

// 更新 module.exports（替换原有的）
module.exports = {
    upload,
    uploadVideo,
    getTeacherVideos,
    getVideoDetail,
    deleteVideo,
    generateSubtitle,
    downloadSubtitle,
};
```

---

## 任务 T4: 路由注册

**文件：**
- 创建: `backend/routes/videoLesson.js`
- 修改: `backend/routes/route.js`（在 `第三方服务路由` 注释前插入）

**创建路由文件：**

```javascript
// backend/routes/videoLesson.js
const router = require('express').Router();
const ctrl = require('../controllers/videoLesson-controller');

// 上传视频（multipart/form-data，字段名 video）
router.post('/upload', ctrl.upload.single('video'), ctrl.uploadVideo);

// 教师视频列表
router.get('/list/:teacherId', ctrl.getTeacherVideos);

// 视频详情（含字幕）
router.get('/:id', ctrl.getVideoDetail);

// AI 字幕生成
router.post('/:id/generate-subtitle', ctrl.generateSubtitle);

// 下载 VTT 字幕文件
router.get('/:id/subtitle.vtt', ctrl.downloadSubtitle);

// 删除视频
router.delete('/:id', ctrl.deleteVideo);

module.exports = router;
```

**在 `backend/routes/route.js` 第 79 行（`// 即梦 AI` 前）插入：**

```javascript
// 视频课程（上传+字幕）
router.use('/video-lesson', require('./videoLesson'));
```

**验证路由注册：**
```bash
cd backend && node -e "require('./routes/route.js'); console.log('路由加载 OK')"
# 预期输出: 路由加载 OK
```

---

## 任务 T5: 前端 API 封装

**文件：**
- 创建: `frontend/src/utils/videoLessonAPI.js`

```javascript
// frontend/src/utils/videoLessonAPI.js
import axios from 'axios';

const BASE = process.env.REACT_APP_BASE_URL || 'http://localhost:5000';
const API  = `${BASE}/api/video-lesson`;

/**
 * 上传视频（带进度回调）
 * @param {FormData} formData - 包含 video 文件 + 文本字段
 * @param {Function} onProgress - (percent: number) => void
 */
export const uploadVideo = (formData, onProgress) =>
    axios.post(`${API}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
            if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
        },
    }).then(r => r.data);

/** 获取教师视频列表 */
export const getTeacherVideos = (teacherId) =>
    axios.get(`${API}/list/${teacherId}`).then(r => r.data);

/** 获取视频详情（含字幕） */
export const getVideoDetail = (id) =>
    axios.get(`${API}/${id}`).then(r => r.data);

/** 触发 AI 字幕生成 */
export const generateSubtitle = (id) =>
    axios.post(`${API}/${id}/generate-subtitle`).then(r => r.data);

/** 删除视频 */
export const deleteVideo = (id) =>
    axios.delete(`${API}/${id}`).then(r => r.data);

/** 获取视频完整 URL */
export const getVideoUrl = (fileName) => `${BASE}/uploads/videos/${fileName}`;

/** 获取字幕下载 URL（用于 <track src=> ） */
export const getSubtitleUrl = (id) => `${API}/${id}/subtitle.vtt`;
```

---

## 任务 T6: 前端视频管理页面

**文件：**
- 创建: `frontend/src/pages/teacher/TeacherVideoManager.js`

这是核心 UI，拆为三个区域：上传表单、视频列表、播放器弹窗（含字幕）。

```jsx
// frontend/src/pages/teacher/TeacherVideoManager.js
import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Container, Typography, Button, TextField, Paper,
    LinearProgress, Alert, Grid, Card, CardContent, CardActions,
    Chip, IconButton, Dialog, DialogContent, DialogTitle,
    CircularProgress, Tooltip, Stack, Divider,
} from '@mui/material';
import {
    CloudUpload as UploadIcon,
    PlayCircle as PlayIcon,
    Delete as DeleteIcon,
    Subtitles as SubtitlesIcon,
    Download as DownloadIcon,
    Close as CloseIcon,
    VideoLibrary as VideoLibraryIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import {
    uploadVideo, getTeacherVideos, getVideoDetail,
    generateSubtitle, deleteVideo, getVideoUrl, getSubtitleUrl,
} from '../../utils/videoLessonAPI';

// ─── 状态徽章 ────────────────────────────────────────────────
const StatusChip = ({ status }) => {
    const map = {
        none:       { label: '无字幕',   color: 'default' },
        generating: { label: '生成中…', color: 'warning' },
        done:       { label: '字幕就绪', color: 'success' },
        failed:     { label: '生成失败', color: 'error'   },
    };
    const { label, color } = map[status] || map.none;
    return <Chip label={label} color={color} size="small" />;
};

// ─── 视频播放器弹窗 ──────────────────────────────────────────
const VideoPlayerDialog = ({ open, lesson, onClose }) => {
    const videoRef = useRef(null);
    const [subtitleUrl, setSubtitleUrl] = useState('');

    useEffect(() => {
        if (!lesson) return;
        // 字幕就绪时设置 track src；用时间戳避免浏览器缓存旧 VTT
        if (lesson.subtitleStatus === 'done') {
            setSubtitleUrl(`${getSubtitleUrl(lesson._id)}?t=${Date.now()}`);
        } else {
            setSubtitleUrl('');
        }
    }, [lesson]);

    if (!lesson) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" noWrap sx={{ maxWidth: '80%' }}>{lesson.title}</Typography>
                <IconButton onClick={onClose}><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ position: 'relative', bgcolor: '#000', borderRadius: 1, overflow: 'hidden' }}>
                    <video
                        ref={videoRef}
                        controls
                        style={{ width: '100%', maxHeight: '60vh', display: 'block' }}
                        src={getVideoUrl(lesson.fileName)}
                        crossOrigin="anonymous"
                    >
                        {subtitleUrl && (
                            <track
                                kind="subtitles"
                                src={subtitleUrl}
                                srcLang="zh"
                                label="中文字幕"
                                default
                            />
                        )}
                    </video>
                </Box>
                {lesson.subtitleStatus !== 'done' && (
                    <Alert severity="info" sx={{ mt: 1 }}>
                        {lesson.subtitleStatus === 'none' && '此视频暂无字幕，可在列表中点击「生成字幕」'}
                        {lesson.subtitleStatus === 'generating' && '字幕生成中，请稍候后刷新列表'}
                        {lesson.subtitleStatus === 'failed' && '字幕生成失败，可重试'}
                    </Alert>
                )}
                {lesson.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {lesson.description}
                    </Typography>
                )}
            </DialogContent>
        </Dialog>
    );
};

// ─── 主页面组件 ──────────────────────────────────────────────
const TeacherVideoManager = () => {
    const { currentUser } = useSelector(state => state.user);
    const teacherId = currentUser?._id;

    // 上传表单
    const [title, setTitle]               = useState('');
    const [description, setDescription]   = useState('');
    const [contentScript, setScript]      = useState('');
    const [videoFile, setVideoFile]       = useState(null);
    const [uploadProgress, setProgress]   = useState(0);
    const [uploading, setUploading]       = useState(false);

    // 列表 & 弹窗
    const [videos, setVideos]             = useState([]);
    const [listLoading, setListLoading]   = useState(false);
    const [playLesson, setPlayLesson]     = useState(null);
    const [generatingId, setGeneratingId] = useState(null);

    // 消息
    const [alert, setAlert] = useState(null); // { type, msg }

    const showAlert = (type, msg) => {
        setAlert({ type, msg });
        setTimeout(() => setAlert(null), 5000);
    };

    // ── 加载列表
    const fetchVideos = async () => {
        if (!teacherId) return;
        setListLoading(true);
        try {
            const data = await getTeacherVideos(teacherId);
            if (data.success) setVideos(data.lessons);
        } catch {
            showAlert('error', '获取视频列表失败');
        } finally {
            setListLoading(false);
        }
    };

    useEffect(() => { fetchVideos(); }, [teacherId]);

    // ── 上传视频
    const handleUpload = async () => {
        if (!videoFile || !title.trim()) {
            showAlert('warning', '请选择视频文件并填写标题');
            return;
        }
        const fd = new FormData();
        fd.append('video', videoFile);
        fd.append('teacherId', teacherId);
        fd.append('title', title.trim());
        fd.append('description', description);
        fd.append('contentScript', contentScript);
        // 获取视频时长（由 input 元素读取）
        if (videoFile._duration) fd.append('duration', videoFile._duration);

        setUploading(true);
        setProgress(0);
        try {
            const res = await uploadVideo(fd, setProgress);
            if (res.success) {
                showAlert('success', '视频上传成功！');
                setTitle(''); setDescription(''); setScript(''); setVideoFile(null);
                await fetchVideos();
            } else {
                showAlert('error', res.message || '上传失败');
            }
        } catch (err) {
            showAlert('error', err.response?.data?.message || '上传失败');
        } finally {
            setUploading(false);
        }
    };

    // ── 生成字幕
    const handleGenerateSubtitle = async (lesson) => {
        setGeneratingId(lesson._id);
        try {
            const res = await generateSubtitle(lesson._id);
            if (res.success) {
                showAlert('success', res.message);
                await fetchVideos();
            } else {
                showAlert('error', res.message || '字幕生成失败');
            }
        } catch (err) {
            showAlert('error', err.response?.data?.message || '字幕生成请求失败');
        } finally {
            setGeneratingId(null);
        }
    };

    // ── 播放（加载最新字幕）
    const handlePlay = async (lesson) => {
        try {
            const detail = await getVideoDetail(lesson._id);
            setPlayLesson(detail.success ? detail.lesson : lesson);
        } catch {
            setPlayLesson(lesson);
        }
    };

    // ── 删除
    const handleDelete = async (id) => {
        if (!window.confirm('确认删除此视频？此操作不可恢复')) return;
        try {
            await deleteVideo(id);
            showAlert('success', '视频已删除');
            await fetchVideos();
        } catch {
            showAlert('error', '删除失败');
        }
    };

    // ── 文件选择（同时读取时长）
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        const v = document.createElement('video');
        v.onloadedmetadata = () => {
            file._duration = Math.round(v.duration);
            URL.revokeObjectURL(url);
        };
        v.src = url;
        setVideoFile(file);
    };

    const formatSize = (bytes) =>
        bytes ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : '—';

    return (
        <Container maxWidth="lg" sx={{ py: 3 }}>
            {alert && (
                <Alert severity={alert.type} sx={{ mb: 2 }} onClose={() => setAlert(null)}>
                    {alert.msg}
                </Alert>
            )}

            {/* ── 上传表单 */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <UploadIcon /> 上传教学视频
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            label="视频标题 *"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            fullWidth
                            disabled={uploading}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Button
                            component="label"
                            variant="outlined"
                            startIcon={<VideoLibraryIcon />}
                            fullWidth
                            sx={{ height: 56 }}
                            disabled={uploading}
                        >
                            {videoFile ? videoFile.name : '选择视频文件（MP4/WebM，≤500MB）'}
                            <input type="file" hidden accept="video/mp4,video/webm,video/ogg,video/quicktime" onChange={handleFileChange} />
                        </Button>
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            label="视频简介"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            fullWidth
                            multiline
                            rows={2}
                            disabled={uploading}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            label="视频内容描述/讲稿（AI 将根据此内容生成字幕，越详细越准确）"
                            value={contentScript}
                            onChange={e => setScript(e.target.value)}
                            fullWidth
                            multiline
                            rows={4}
                            disabled={uploading}
                            placeholder="例如：本节课讲解 Python 列表操作，首先介绍列表的创建方式...（0-60秒），然后演示增删改查...（60-120秒）"
                        />
                    </Grid>
                    {uploading && (
                        <Grid item xs={12}>
                            <LinearProgress variant="determinate" value={uploadProgress} />
                            <Typography variant="caption" color="text.secondary">
                                上传进度 {uploadProgress}%
                            </Typography>
                        </Grid>
                    )}
                    <Grid item xs={12}>
                        <Button
                            variant="contained"
                            startIcon={uploading ? <CircularProgress size={18} color="inherit" /> : <UploadIcon />}
                            onClick={handleUpload}
                            disabled={uploading || !videoFile || !title.trim()}
                        >
                            {uploading ? '上传中…' : '上传视频'}
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* ── 视频列表 */}
            <Typography variant="h6" gutterBottom>
                我的视频 {videos.length > 0 && `(${videos.length})`}
            </Typography>
            {listLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            ) : videos.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                    <VideoLibraryIcon sx={{ fontSize: 64, opacity: 0.3 }} />
                    <Typography>暂无上传的视频</Typography>
                </Paper>
            ) : (
                <Grid container spacing={2}>
                    {videos.map(v => (
                        <Grid item xs={12} sm={6} md={4} key={v._id}>
                            <Card>
                                <CardContent>
                                    <Typography variant="subtitle1" fontWeight={600} noWrap>
                                        {v.title}
                                    </Typography>
                                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                        <StatusChip status={v.subtitleStatus} />
                                        <Chip label={formatSize(v.fileSize)} size="small" variant="outlined" />
                                    </Stack>
                                    {v.description && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }} noWrap>
                                            {v.description}
                                        </Typography>
                                    )}
                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                        {new Date(v.createdAt).toLocaleDateString()}
                                    </Typography>
                                </CardContent>
                                <CardActions>
                                    <Tooltip title="播放">
                                        <IconButton color="primary" onClick={() => handlePlay(v)}>
                                            <PlayIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title={v.subtitleStatus === 'done' ? '重新生成字幕' : '生成字幕'}>
                                        <span>
                                            <IconButton
                                                color="secondary"
                                                onClick={() => handleGenerateSubtitle(v)}
                                                disabled={generatingId === v._id || v.subtitleStatus === 'generating'}
                                            >
                                                {generatingId === v._id
                                                    ? <CircularProgress size={20} />
                                                    : <SubtitlesIcon />}
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                    {v.subtitleStatus === 'done' && (
                                        <Tooltip title="下载 VTT 字幕">
                                            <IconButton
                                                component="a"
                                                href={getSubtitleUrl(v._id)}
                                                download
                                                color="info"
                                            >
                                                <DownloadIcon />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                    <Tooltip title="删除">
                                        <IconButton color="error" onClick={() => handleDelete(v._id)} sx={{ ml: 'auto' }}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </Tooltip>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* ── 播放器弹窗 */}
            <VideoPlayerDialog
                open={!!playLesson}
                lesson={playLesson}
                onClose={() => setPlayLesson(null)}
            />
        </Container>
    );
};

export default TeacherVideoManager;
```

---

## 任务 T7: 路由注册 + 侧边栏导航

### 7.1 TeacherDashboard.js

在 `frontend/src/pages/teacher/TeacherDashboard.js` 中：

**import 新增（在第 36 行附近，现有 import 末尾）：**
```javascript
import TeacherVideoManager from './TeacherVideoManager';
```

**Route 新增（在 `/Teacher/knowledge-video` 路由后插入）：**
```jsx
<Route path="/Teacher/video-manager" element={<TeacherVideoManager />} />
```

### 7.2 TeacherSideBar.js

在 `frontend/src/pages/teacher/TeacherSideBar.js` 的 `aiNavItems` 数组中追加：

**import 新增（顶部 icon imports 末尾）：**
```javascript
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
```

**aiNavItems 数组追加：**
```javascript
{ path: '/Teacher/video-manager', icon: <VideoLibraryIcon />, label: '视频课堂' },
```

---

## 任务 T8: i18n 词条（可选，当前硬编码中文，后续国际化时补充）

如需国际化，在 `frontend/src/i18n/locales/zh-CN.json` 的 `"teacher"` 节点追加：
```json
"videoManager": "视频课堂",
"uploadVideo": "上传教学视频",
"generateSubtitle": "生成字幕",
"subtitleReady": "字幕就绪",
"subtitleGenerating": "生成中",
"subtitleFailed": "生成失败"
```

---

## 验收测试步骤

```bash
# 1. 启动后端
cd backend && npm start

# 2. 启动前端
cd frontend && npm start

# 3. 浏览器访问教师端
# → 侧边栏出现「视频课堂」菜单项
# → 选择 MP4 文件，填写标题和内容描述，点击上传
# → 上传成功后出现视频卡片
# → 点击字幕图标 → 等待 AI 字幕生成 → 状态变为「字幕就绪」
# → 点击播放图标 → 视频播放，底部显示字幕
# → 点击下载图标 → 下载 .vtt 文件，内容以 WEBVTT 开头
```

---

## 关键注意点

1. **跨域字幕**：`<video crossOrigin="anonymous">` 是必须的，否则 `<track>` 无法加载同域但经静态服务返回的 VTT 文件。
2. **字幕缓存**：浏览器会缓存 VTT，重新生成后前端需加 `?t=timestamp` 参数强制刷新（已在 `VideoPlayerDialog` 中处理）。
3. **大文件上传**：后端 `express.json limit: 10mb`（`index.js:28`）与视频上传无关，视频走 `multipart/form-data`，multer 独立处理。
4. **Gemini 超时**：字幕生成是同步等待 Gemini 响应，长视频+长讲稿可能耗时 10-30 秒，前端已用 `generatingId` 状态禁用按钮防重复点击。
5. **目录权限**：`uploads/videos/` 由 `fs-extra.ensureDirSync` 自动创建，无需手动 mkdir。
