// frontend/src/pages/teacher/TeacherVideoManager.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    deleteVideo, getVideoUrl, getSubtitleUrl, getSubtitleEventsUrl,
} from '../../utils/videoLessonAPI';

// ─── 字幕状态徽章 ─────────────────────────────────────────────
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

// ─── 解析 "HH:MM:SS.mmm" → 秒数 ─────────────────────────────
function vttTimeToSeconds(timeStr) {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    if (parts.length === 3) {
        return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
    }
    if (parts.length === 2) {
        return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
    }
    return parseFloat(timeStr);
}

// ─── 视频播放器弹窗 ──────────────────────────────────────────
const VideoPlayerDialog = React.forwardRef(({ open, lesson, onClose, onGenerateSubtitle, generatingId }, ref) => {
    const videoRef = useRef(null);
    const trackRef = useRef(null);   // <track> DOM 元素（静态 VTT 用）

    // 懒获取/创建 live TextTrack，保证随时可用
    const getLiveTrack = () => {
        const video = videoRef.current;
        if (!video) return null;
        let track = Array.from(video.textTracks).find(t => t.label === '__live__');
        if (!track) {
            track = video.addTextTrack('subtitles', '__live__', 'zh');
        }
        track.mode = 'showing';
        return track;
    };

    // 暴露给父组件的方法
    React.useImperativeHandle(ref, () => ({
        addCue(startFmt, endFmt, text) {
            const track = getLiveTrack();
            if (!track) {
                console.warn('[Player] addCue: video not mounted yet, startFmt=', startFmt);
                return;
            }
            const start = vttTimeToSeconds(startFmt);
            const end   = vttTimeToSeconds(endFmt);
            // 防重复
            if (track.cues) {
                for (let i = 0; i < track.cues.length; i++) {
                    if (Math.abs(track.cues[i].startTime - start) < 0.01) return;
                }
            }
            try {
                track.addCue(new VTTCue(start, end, text));
                console.log(`[Player] addCue OK: ${startFmt} "${text.slice(0,15)}"`);
            } catch (e) {
                console.warn('[Player] addCue 失败:', e.message);
            }
        },
        clearCues() {
            const track = getLiveTrack();
            if (!track || !track.cues) return;
            while (track.cues.length > 0) track.removeCue(track.cues[0]);
        },
        loadStaticVtt(url) {
            // 禁用 live track
            const video = videoRef.current;
            if (video) {
                Array.from(video.textTracks).forEach(t => {
                    if (t.label === '__live__') t.mode = 'disabled';
                });
            }
            // 激活静态 <track>
            if (trackRef.current) {
                trackRef.current.src = url;
                trackRef.current.track.mode = 'showing';
            }
        },
    }));

    if (!lesson) return null;

    const isGenerating = generatingId === lesson._id || lesson.subtitleStatus === 'generating';
    const isDone = lesson.subtitleStatus === 'done';

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {/* component="div" 避免 DialogTitle(h2) > Typography(h6) 的嵌套警告 */}
                <Typography component="div" variant="h6" noWrap sx={{ maxWidth: '80%' }}>{lesson.title}</Typography>
                <IconButton onClick={onClose}><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 0 }}>
                <Box sx={{ bgcolor: '#000' }}>
                    <video
                        ref={videoRef}
                        controls
                        style={{ width: '100%', maxHeight: '60vh', display: 'block' }}
                        src={getVideoUrl(lesson.fileName)}
                        crossOrigin="anonymous"
                    >
                        {/* 静态 VTT 轨道（字幕完成后使用） */}
                        <track
                            ref={trackRef}
                            kind="subtitles"
                            srcLang="zh"
                            label="中文字幕"
                        />
                    </video>
                </Box>

                {/* ── 字幕操作栏 */}
                <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <SubtitlesIcon color={isDone ? 'success' : 'action'} fontSize="small" />
                    <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
                        {isDone        && '字幕就绪 · 播放时自动显示'}
                        {isGenerating  && '正在识别字幕，稍后自动显示…'}
                        {!isDone && !isGenerating && lesson.subtitleStatus === 'none'   && '暂无字幕'}
                        {!isDone && !isGenerating && lesson.subtitleStatus === 'failed'  && '字幕生成失败'}
                    </Typography>

                    {/* 生成/重新生成按钮 */}
                    <Button
                        size="small"
                        variant={isDone ? 'outlined' : 'contained'}
                        startIcon={isGenerating
                            ? <CircularProgress size={14} color="inherit" />
                            : <SubtitlesIcon fontSize="small" />}
                        onClick={() => onGenerateSubtitle(lesson)}
                        disabled={isGenerating}
                        color={isDone ? 'secondary' : 'primary'}
                    >
                        {isGenerating ? '识别中…' : isDone ? '重新生成' : '生成字幕'}
                    </Button>

                    {/* 下载按钮（字幕就绪时显示）*/}
                    {isDone && (
                        <Tooltip title="下载 VTT 字幕文件">
                            <IconButton
                                size="small"
                                component="a"
                                href={getSubtitleUrl(lesson._id)}
                                download
                                color="info"
                            >
                                <DownloadIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>

                {lesson.description && (
                    <Box sx={{ px: 2, py: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            {lesson.description}
                        </Typography>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
});

// ─── 主页面组件 ──────────────────────────────────────────────
const TeacherVideoManager = () => {
    const { currentUser } = useSelector(state => state.user);
    const teacherId = currentUser?._id;

    // 上传表单状态
    const [title, setTitle]             = useState('');
    const [description, setDescription] = useState('');
    const [contentScript, setScript]    = useState('');
    const [videoFile, setVideoFile]     = useState(null);
    const [uploadProgress, setProgress] = useState(0);
    const [uploading, setUploading]     = useState(false);

    // 列表 & 弹窗状态
    const [videos, setVideos]           = useState([]);
    const [listLoading, setListLoading] = useState(false);
    const [playLesson, setPlayLesson]   = useState(null);
    const [generatingId, setGeneratingId] = useState(null);

    // 播放器 ref（用于调用 addCue / loadStaticVtt）
    const playerRef = useRef(null);

    // SSE 相关 refs
    const eventSourceRef = useRef({}); // { [lessonId]: EventSource }

    // 缓存播放器未打开时收到的 cues，等播放器挂载后补注入
    const pendingCuesRef = useRef({}); // { [lessonId]: segment[] }

    // 轮询降级（刷新后 status=generating 时使用）
    const pollingRef = useRef({});

    // 通知消息
    const [alert, setAlert] = useState(null);

    const showAlert = (type, msg) => {
        setAlert({ type, msg });
        setTimeout(() => setAlert(null), 5000);
    };

    // ── 加载视频列表
    const fetchVideos = useCallback(async () => {
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
    }, [teacherId]);

    // ── 更新单条视频状态
    const updateVideoStatus = useCallback((lessonId, status) => {
        setVideos(prev => prev.map(v =>
            v._id === lessonId ? { ...v, subtitleStatus: status } : v
        ));
        setPlayLesson(prev =>
            prev?._id === lessonId ? { ...prev, subtitleStatus: status } : prev
        );
    }, []);

    // ── 停止 SSE
    const stopSSE = useCallback((lessonId) => {
        if (eventSourceRef.current[lessonId]) {
            eventSourceRef.current[lessonId].close();
            delete eventSourceRef.current[lessonId];
        }
    }, []);

    // ── 停止轮询
    const stopPolling = useCallback((lessonId) => {
        if (pollingRef.current[lessonId]) {
            clearInterval(pollingRef.current[lessonId]);
            delete pollingRef.current[lessonId];
        }
    }, []);

    // ── 启动 SSE 流式字幕
    const startSSE = useCallback((lessonId) => {
        if (eventSourceRef.current[lessonId]) return;

        // 初始化该视频的 pending 缓存
        pendingCuesRef.current[lessonId] = [];

        const es = new EventSource(getSubtitleEventsUrl(lessonId));
        eventSourceRef.current[lessonId] = es;

        // 收到字幕 segment
        es.addEventListener('segment', (e) => {
            try {
                const seg = JSON.parse(e.data);
                if (playerRef.current) {
                    // 播放器已打开：直接注入
                    playerRef.current.addCue(seg.startFmt, seg.endFmt, seg.text);
                } else {
                    // 播放器未打开：缓存起来，等打开时补注入
                    if (!pendingCuesRef.current[lessonId]) {
                        pendingCuesRef.current[lessonId] = [];
                    }
                    pendingCuesRef.current[lessonId].push(seg);
                }
            } catch (_) {}
        });

        // 转录完成 → 切换到服务器静态 VTT
        es.addEventListener('done', () => {
            stopSSE(lessonId);
            delete pendingCuesRef.current[lessonId];
            updateVideoStatus(lessonId, 'done');
            setGeneratingId(prev => prev === lessonId ? null : prev);
            showAlert('success', '字幕生成完成！');
            if (playerRef.current) {
                playerRef.current.loadStaticVtt(
                    `${getSubtitleUrl(lessonId)}?t=${Date.now()}`
                );
            }
        });

        // 错误
        es.addEventListener('error', (e) => {
            let msg = '字幕生成失败，请重试';
            try { msg = JSON.parse(e.data).message || msg; } catch (_) {}
            stopSSE(lessonId);
            delete pendingCuesRef.current[lessonId];
            updateVideoStatus(lessonId, 'failed');
            setGeneratingId(prev => prev === lessonId ? null : prev);
            showAlert('error', msg);
        });

        es.onerror = () => {
            if (es.readyState === EventSource.CLOSED) stopSSE(lessonId);
        };
    }, [stopSSE, updateVideoStatus]);

    // ── 轮询降级
    const startPolling = useCallback((lessonId) => {
        if (pollingRef.current[lessonId]) return;
        const timer = setInterval(async () => {
            try {
                const data = await getTeacherVideos(teacherId);
                if (!data.success) return;
                const found = data.lessons.find(v => v._id === lessonId);
                if (!found) { stopPolling(lessonId); return; }
                setVideos(data.lessons);
                if (found.subtitleStatus !== 'generating') {
                    stopPolling(lessonId);
                    setGeneratingId(prev => prev === lessonId ? null : prev);
                    if (found.subtitleStatus === 'done') showAlert('success', '字幕生成完成！');
                    else if (found.subtitleStatus === 'failed') showAlert('error', '字幕生成失败，请重试');
                }
            } catch { /* 忽略抖动 */ }
        }, 5000);
        pollingRef.current[lessonId] = timer;
    }, [teacherId, stopPolling]);

    // 卸载清理
    useEffect(() => {
        return () => {
            Object.values(eventSourceRef.current).forEach(es => es.close());
            Object.values(pollingRef.current).forEach(clearInterval);
        };
    }, []);

    useEffect(() => { fetchVideos(); }, [fetchVideos]);

    // 列表加载后恢复 generating 状态的轮询降级
    useEffect(() => {
        videos.forEach(v => {
            if (v.subtitleStatus === 'generating' && !eventSourceRef.current[v._id]) {
                setGeneratingId(v._id);
                startPolling(v._id);
            }
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

    // ── 生成 AI 字幕（SSE 流式，边播放边显示）
    const handleGenerateSubtitle = (lesson) => {
        if (generatingId === lesson._id || lesson.subtitleStatus === 'generating') {
            showAlert('warning', '字幕正在生成中，请稍候');
            return;
        }
        setGeneratingId(lesson._id);
        updateVideoStatus(lesson._id, 'generating');

        // 先打开播放器（让用户立即开始看视频），同步启动识别
        if (!playLesson || playLesson._id !== lesson._id) {
            setPlayLesson({ ...lesson, subtitleStatus: 'generating' });
        } else {
            // 播放器已打开，清空旧 cue 重新识别
            if (playerRef.current) playerRef.current.clearCues();
            updateVideoStatus(lesson._id, 'generating');
        }

        startSSE(lesson._id);
    };

    // ── 播放（先拉最新详情）
    const handlePlay = async (lesson) => {
        try {
            const detail = await getVideoDetail(lesson._id);
            setPlayLesson(detail.success ? detail.lesson : lesson);
        } catch {
            setPlayLesson(lesson);
        }
    };

    // 播放器打开后：补注入缓存 cue，或加载静态 VTT
    useEffect(() => {
        if (!playLesson || !playerRef.current) return;
        const id = playLesson._id;

        setTimeout(() => {
            if (!playerRef.current) return;

            if (playLesson.subtitleStatus === 'done') {
                // 字幕已完成：加载静态 VTT
                playerRef.current.loadStaticVtt(
                    `${getSubtitleUrl(id)}?t=${Date.now()}`
                );
            } else if (playLesson.subtitleStatus === 'generating') {
                // 生成中：把 SSE 期间缓存的 cue 补注入
                const pending = pendingCuesRef.current[id] || [];
                pending.forEach(seg => {
                    playerRef.current?.addCue(seg.startFmt, seg.endFmt, seg.text);
                });
                pendingCuesRef.current[id] = []; // 清空，后续直接注入
            }
        }, 150); // 等待播放器 DOM 和 TextTrack 初始化完成
    }, [playLesson]);

    // ── 删除视频
    const handleDelete = async (id) => {
        if (!window.confirm('确认删除此视频？此操作不可恢复')) return;
        stopSSE(id);
        stopPolling(id);
        try {
            await deleteVideo(id);
            showAlert('success', '视频已删除');
            await fetchVideos();
        } catch {
            showAlert('error', '删除失败');
        }
    };

    // ── 选择文件（读取视频时长）
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const blobUrl = URL.createObjectURL(file);
        const v = document.createElement('video');
        v.onloadedmetadata = () => {
            file._duration = Math.round(v.duration);
            URL.revokeObjectURL(blobUrl);
        };
        v.src = blobUrl;
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
                    <UploadIcon color="primary" /> 上传教学视频
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
                            <Typography noWrap sx={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {videoFile ? videoFile.name : '选择视频文件（MP4/WebM，≤500MB）'}
                            </Typography>
                            <input
                                type="file"
                                hidden
                                accept="video/mp4,video/webm,video/ogg,video/quicktime"
                                onChange={handleFileChange}
                            />
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
                            label="视频内容描述 / 讲稿（选填，有助于提升识别准确率）"
                            value={contentScript}
                            onChange={e => setScript(e.target.value)}
                            fullWidth
                            multiline
                            rows={3}
                            disabled={uploading}
                            placeholder="例如：本节课讲解 Python 列表操作，首先介绍列表的创建方式..."
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
                我的视频{videos.length > 0 && `（${videos.length}）`}
            </Typography>

            {listLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            ) : videos.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                    <VideoLibraryIcon sx={{ fontSize: 64, opacity: 0.3, display: 'block', mx: 'auto', mb: 1 }} />
                    <Typography>暂无上传的视频，请在上方上传第一个视频</Typography>
                </Paper>
            ) : (
                <Grid container spacing={2}>
                    {videos.map(v => (
                        <Grid item xs={12} sm={6} md={4} key={v._id}>
                            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Typography variant="subtitle1" fontWeight={600} noWrap title={v.title}>
                                        {v.title}
                                    </Typography>
                                    <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 0.5 }}>
                                        <StatusChip status={v.subtitleStatus} />
                                        <Chip label={formatSize(v.fileSize)} size="small" variant="outlined" />
                                    </Stack>
                                    {v.description && (
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ mt: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                                        >
                                            {v.description}
                                        </Typography>
                                    )}
                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                        {new Date(v.createdAt).toLocaleDateString()}
                                    </Typography>
                                </CardContent>
                                <CardActions>
                                    <Tooltip title="播放视频（可在播放器内生成字幕）">
                                        <IconButton color="primary" onClick={() => handlePlay(v)}>
                                            <PlayIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="删除视频">
                                        <IconButton
                                            color="error"
                                            onClick={() => handleDelete(v._id)}
                                            sx={{ ml: 'auto' }}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Tooltip>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* ── 播放器弹窗（生成字幕按钮在弹窗内） */}
            <VideoPlayerDialog
                ref={playerRef}
                open={!!playLesson}
                lesson={playLesson}
                onClose={() => setPlayLesson(null)}
                onGenerateSubtitle={handleGenerateSubtitle}
                generatingId={generatingId}
            />
        </Container>
    );
};

export default TeacherVideoManager;
