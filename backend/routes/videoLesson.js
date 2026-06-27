// backend/routes/videoLesson.js
const router = require('express').Router();
const ctrl = require('../controllers/videoLesson-controller');

// 上传视频（multipart/form-data，字段名 video）
router.post('/upload', ctrl.upload.single('video'), ctrl.uploadVideo);

// 教师视频列表
router.get('/list/:teacherId', ctrl.getTeacherVideos);

// 下载 VTT 字幕文件（必须在 /:id 路由前注册，避免被覆盖）
router.get('/:id/subtitle.vtt', ctrl.downloadSubtitle);

// SSE 流式字幕生成（必须在 /:id 路由前注册）
router.get('/:id/subtitle-events', ctrl.streamSubtitleSSE);

// 视频详情（含字幕）
router.get('/:id', ctrl.getVideoDetail);

// 删除视频
router.delete('/:id', ctrl.deleteVideo);

module.exports = router;
