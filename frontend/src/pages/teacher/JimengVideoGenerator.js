import React, { useState, useCallback } from 'react';
import {
    Box,
    Container,
    Typography,
    TextField,
    Button,
    Paper,
    Grid,
    CircularProgress,
    Alert,
    Card,
    CardMedia,
    CardContent,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Divider,
    Stack,
    IconButton,
    Fade,
    Tooltip,
    LinearProgress,
    Dialog,
    DialogContent,
    DialogActions,
} from '@mui/material';
import {
    Videocam as VideocamIcon,
    History as HistoryIcon,
    PlayArrow as PlayArrowIcon,
    Refresh as RefreshIcon,
    Close as CloseIcon,
    Fullscreen as FullscreenIcon,
    TrendingUp as TrendingUpIcon,
    HighQuality as HighQualityIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { jimengAPI } from '../../utils/jimengAPI';
import useTranslation from '../../hooks/useTranslation';

const JimengVideoGenerator = () => {
    const { currentUser } = useSelector(state => state.user);
    const { tJimeng, tCommon } = useTranslation('teacher');
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [result, setResult] = useState(null);
    const [taskId, setTaskId] = useState(null);
    const [taskStatus, setTaskStatus] = useState('');
    const [progress, setProgress] = useState(0);
    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [videoUrls, setVideoUrls] = useState([]);
    const [fullscreenVideo, setFullscreenVideo] = useState(null);
    const [videoBlobUrl, setVideoBlobUrl] = useState(null);
    const [loadingVideo, setLoadingVideo] = useState(false);

    // 参数选项 - 即梦3.0视频版本
    const [options, setOptions] = useState({
        duration: 5,
        resolution: '720p',
        aspect_ratio: '16:9',
    });

    const durationOptions = [
        { value: 5 },
        { value: 10 },
    ];

    const resolutionOptions = [
        { value: '720p', icon: <VideocamIcon /> },
        { value: '1080p', icon: <HighQualityIcon /> },
    ];

    const aspectRatioOptions = [
        { value: '16:9' },
        { value: '4:3' },
        { value: '1:1' },
        { value: '3:4' },
        { value: '9:16' },
        { value: '21:9' },
    ];

    const handleOptionChange = (field, value) => {
        setOptions(prev => ({ ...prev, [field]: value }));
    };

    // 生成视频
    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError(tJimeng('videoDescription') + ' ' + tCommon('fieldRequired'));
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');
        setResult(null);
        setVideoUrls([]);
        setTaskId(null);
        setTaskStatus('pending');
        setProgress(0);

        try {
            const userId = currentUser?._id;
            const userType = currentUser?.role;
            const response = await jimengAPI.textToVideo(prompt, options, userId, userType);

            if (response.data.success) {
                setTaskId(response.data.taskId);
                setSuccess(tJimeng('videoGeneratingPleaseWait'));
                pollTaskStatus(response.data.taskId);
            } else {
                setError(response.data.message || tJimeng('generationFailed'));
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || tJimeng('generationFailed'));
        } finally {
            setLoading(false);
        }
    };

    // 播放视频 - 使用Blob URL避免跨域
    const handlePlay = async (url) => {
        if (!url) return;
        setResult(url);

        // 如果已经是Blob URL，直接使用
        if (url.startsWith('blob:')) {
            setVideoBlobUrl(url);
            return;
        }

        // 清理旧的Blob URL
        if (videoBlobUrl) {
            URL.revokeObjectURL(videoBlobUrl);
            setVideoBlobUrl(null);
        }

        setLoadingVideo(true);
        const proxyUrl = jimengAPI.getProxyUrl(url);
        try {
            const response = await fetch(proxyUrl);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            setVideoBlobUrl(blobUrl);
        } catch (err) {
            console.error('加载视频失败:', err);
            // 降级：直接使用代理URL
            setVideoBlobUrl(proxyUrl);
        } finally {
            setLoadingVideo(false);
        }
    };

    // 组件卸载时清理Blob URL
    React.useEffect(() => {
        return () => {
            if (videoBlobUrl && videoBlobUrl.startsWith('blob:')) {
                URL.revokeObjectURL(videoBlobUrl);
            }
        };
    }, [videoBlobUrl]);

    // 轮询任务状态
    const pollTaskStatus = useCallback(async (taskId) => {
        const poll = async () => {
            try {
                const response = await jimengAPI.getTaskStatus(taskId, 'video');
                const data = response.data;

                setTaskStatus(data.status);
                setProgress(data.progress || 0);

                if (data.status === 'completed') {
                    setVideoUrls(data.videoUrls || []);
                    if (data.videoUrls && data.videoUrls.length > 0) {
                        const videoUrl = data.videoUrls[0];
                        setResult(videoUrl);
                        // 触发加载 Blob URL 避免跨域
                        handlePlay(videoUrl);
                    }
                    setSuccess(tJimeng('generationSuccess'));
                    return;
                } else if (data.status === 'failed') {
                    setError(data.message || tJimeng('generationFailed'));
                    return;
                }

                // 继续轮询，视频生成时间较长
                if (data.status === 'pending' || data.status === 'processing' ||
                    data.status === 'in_queue' || data.status === 'generating') {
                    setTimeout(poll, 5000);
                }
            } catch (err) {
                console.error('Polling error:', err);
                setTimeout(poll, 8000);
            }
        };

        poll();
    }, []);

    // 获取历史记录
    const fetchHistory = async () => {
        if (!currentUser?._id) return;

        setLoadingHistory(true);
        try {
            const response = await jimengAPI.getUserHistory(currentUser._id, 'video');
            if (response.data.success) {
                setHistory(response.data.history);
            }
        } catch (err) {
            console.error('Failed to fetch history:', err);
        } finally {
            setLoadingHistory(false);
        }
    };

    // 切换历史记录显示
    const toggleHistory = () => {
        if (!showHistory) {
            fetchHistory();
        }
        setShowHistory(!showHistory);
    };

    // 示例提示词
    const examplePrompts = [
        tJimeng('examplePrompts.video1'),
        tJimeng('examplePrompts.video2'),
        tJimeng('examplePrompts.video3'),
        tJimeng('examplePrompts.video4'),
    ];

    return (
        <Container maxWidth="xl" sx={{ mt: 3, mb: 4 }}>
            {/* 页面标题 */}
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                    sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <VideocamIcon sx={{ color: 'white', fontSize: 28 }} />
                </Box>
                <Box>
                    <Typography variant="h5" fontWeight="bold">
                        {tJimeng('aiVideoGenerator')}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        {tJimeng('jimeng30')} · {tJimeng('generateWonderfulVideo')}
                    </Typography>
                </Box>
                <Chip
                    label={tJimeng('newVersion')}
                    size="small"
                    color="secondary"
                    variant="outlined"
                    sx={{ ml: 'auto' }}
                />
            </Box>

            <Grid container spacing={3}>
                {/* 左侧：输入区域 */}
                <Grid item xs={12} md={5}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        {/* 提示词输入 */}
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                {tJimeng('videoDescription')}
                            </Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                placeholder={tJimeng('inputDescriptionStartCreatingVideo')}
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                    }
                                }}
                            />
                        </Box>

                        {/* 示例提示词 */}
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                {tJimeng('exampleDescription')}
                            </Typography>
                            <Stack direction="row" flexWrap="wrap" gap={1}>
                                {examplePrompts.map((example, index) => (
                                    <Chip
                                        key={index}
                                        label={example}
                                        size="small"
                                        onClick={() => setPrompt(example)}
                                        sx={{
                                            cursor: 'pointer',
                                            '&:hover': { bgcolor: 'secondary.light', color: 'white' }
                                        }}
                                    />
                                ))}
                            </Stack>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        {/* 参数设置 */}
                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                            {tJimeng('generationParameters')}
                        </Typography>

                        <Stack spacing={3}>
                            {/* 分辨率 */}
                            <FormControl fullWidth size="small">
                                <InputLabel>{tJimeng('videoQuality')}</InputLabel>
                                <Select
                                    value={options.resolution}
                                    label={tJimeng('videoQuality')}
                                    onChange={(e) => handleOptionChange('resolution', e.target.value)}
                                >
                                    <MenuItem value="720p">
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <VideocamIcon />
                                            {tJimeng('hd720p')}
                                        </Box>
                                    </MenuItem>
                                    <MenuItem value="1080p">
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <HighQualityIcon />
                                            {tJimeng('hd1080p')}
                                        </Box>
                                    </MenuItem>
                                </Select>
                            </FormControl>

                            {/* 时长 */}
                            <FormControl fullWidth size="small">
                                <InputLabel>{tJimeng('videoDuration')}</InputLabel>
                                <Select
                                    value={options.duration}
                                    label={tJimeng('videoDuration')}
                                    onChange={(e) => handleOptionChange('duration', e.target.value)}
                                >
                                    <MenuItem value={5}>{tJimeng('fiveSeconds')}</MenuItem>
                                    <MenuItem value={10}>{tJimeng('tenSeconds')}</MenuItem>
                                </Select>
                            </FormControl>

                            {/* 宽高比 */}
                            <FormControl fullWidth size="small">
                                <InputLabel>{tJimeng('videoRatio')}</InputLabel>
                                <Select
                                    value={options.aspect_ratio}
                                    label={tJimeng('videoRatio')}
                                    onChange={(e) => handleOptionChange('aspect_ratio', e.target.value)}
                                >
                                    <MenuItem value="16:9">{tJimeng('ratio16x9')}</MenuItem>
                                    <MenuItem value="4:3">{tJimeng('ratio4x3')}</MenuItem>
                                    <MenuItem value="1:1">{tJimeng('ratio1x1')}</MenuItem>
                                    <MenuItem value="3:4">{tJimeng('ratio3x4')}</MenuItem>
                                    <MenuItem value="9:16">{tJimeng('ratio9x16')}</MenuItem>
                                    <MenuItem value="21:9">{tJimeng('ratio21x9')}</MenuItem>
                                </Select>
                            </FormControl>
                        </Stack>

                        <Divider sx={{ my: 3 }} />

                        {/* 操作按钮 */}
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button
                                variant="contained"
                                fullWidth
                                size="large"
                                onClick={handleGenerate}
                                disabled={loading || !prompt.trim()}
                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <VideocamIcon />}
                                sx={{
                                    py: 1.5,
                                    borderRadius: 2,
                                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #e063e8 0%, #e3375a 100%)',
                                    }
                                }}
                            >
                                {loading ? tJimeng('generating') : tJimeng('generateVideo')}
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={toggleHistory}
                                startIcon={<HistoryIcon />}
                                sx={{ borderRadius: 2 }}
                            >
                                {showHistory ? tJimeng('hideHistory') : tJimeng('viewHistory')}
                            </Button>
                        </Box>

                        {/* 进度显示 */}
                        {taskId && (taskStatus === 'pending' || taskStatus === 'processing' ||
                            taskStatus === 'in_queue' || taskStatus === 'generating') && (
                            <Fade in>
                                <Box sx={{ mt: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <CircularProgress size={16} sx={{ color: '#f5576c' }} />
                                        <Typography variant="body2" color="textSecondary">
                                            {taskStatus === 'in_queue' ? tJimeng('queue') :
                                             taskStatus === 'generating' ? tJimeng('generatingVideo') : tJimeng('processing')}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary" sx={{ ml: 'auto' }}>
                                            {Math.round(progress * 100)}%
                                        </Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={progress * 100}
                                        sx={{
                                            height: 6,
                                            borderRadius: 3,
                                            bgcolor: '#e0e0e0',
                                            '& .MuiLinearProgress-bar': {
                                                borderRadius: 3,
                                                background: 'linear-gradient(90deg, #f093fb 0%, #f5576c 100%)',
                                            }
                                        }}
                                    />
                                    <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                                        {tJimeng('videoGenerationTakesTime')}
                                    </Typography>
                                </Box>
                            </Fade>
                        )}
                    </Paper>
                </Grid>

                {/* 右侧：结果展示 */}
                <Grid item xs={12} md={7}>
                    <Paper sx={{ p: 3, height: '100%', minHeight: 500 }}>
                        {/* 错误/成功提示 */}
                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                                {error}
                            </Alert>
                        )}

                        {success && !result && (
                            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
                                {success}
                            </Alert>
                        )}

                        {/* 结果展示 */}
                        {result ? (
                            <Fade in>
                                <Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                        <TrendingUpIcon sx={{ color: 'secondary.main', fontSize: 20 }} />
                                        <Typography variant="subtitle2" color="textSecondary">
                                            {tJimeng('result')}
                                        </Typography>
                                        <Stack direction="row" spacing={1} sx={{ ml: 'auto' }}>
                                            <Tooltip title={tJimeng('fullscreenPlayback')}>
                                                <IconButton size="small" onClick={() => { handlePlay(result); setFullscreenVideo(result); }}>
                                                    <FullscreenIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title={tJimeng('regenerate')}>
                                                <IconButton size="small" onClick={handleGenerate} disabled={loading}>
                                                    <RefreshIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </Box>

                                    <Card
                                        sx={{
                                            borderRadius: 2,
                                            overflow: 'hidden',
                                            bgcolor: '#000',
                                            position: 'relative',
                                            paddingTop: '56.25%', // 16:9 aspect ratio
                                        }}
                                    >
                                        {loadingVideo && (
                                            <Box sx={{
                                                position: 'absolute',
                                                top: '50%',
                                                left: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                zIndex: 2,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: 1,
                                            }}>
                                                <CircularProgress size={40} sx={{ color: '#fff' }} />
                                                <Typography sx={{ color: '#fff', fontSize: 12 }}>加载视频中...</Typography>
                                            </Box>
                                        )}
                                        <video
                                            src={videoBlobUrl || result}
                                            controls
                                            autoPlay
                                            crossOrigin="anonymous"
                                            onError={(e) => {
                                                console.error('视频加载失败:', e);
                                            }}
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'contain',
                                            }}
                                        />
                                    </Card>

                                    {/* 多个视频结果 */}
                                    {videoUrls.length > 1 && (
                                        <Box sx={{ mt: 2 }}>
                                            <Typography variant="caption" color="textSecondary" gutterBottom>
                                                {tJimeng('otherResults')} ({videoUrls.length})
                                            </Typography>
                                            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                                {videoUrls.map((url, index) => (
                                                    <Chip
                                                        key={index}
                                                        icon={<PlayArrowIcon />}
                                                        label={`Video ${index + 1}`}
                                                        onClick={() => handlePlay(url)}
                                                        color={url === result ? 'secondary' : 'default'}
                                                        variant={url === result ? 'filled' : 'outlined'}
                                                        size="small"
                                                    />
                                                ))}
                                            </Stack>
                                        </Box>
                                    )}

                                    {/* 使用的提示词 */}
                                    <Box sx={{ mt: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 1 }}>
                                        <Typography variant="caption" color="textSecondary">
                                            {tJimeng('usedPrompt')}
                                        </Typography>
                                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                                            {prompt}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Fade>
                        ) : (
                            /* 空状态 */
                            <Box
                                sx={{
                                    height: '100%',
                                    minHeight: 400,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: '#f8f9fa',
                                    borderRadius: 2,
                                    border: '2px dashed #e0e0e0',
                                }}
                            >
                                <VideocamIcon sx={{ fontSize: 64, color: '#bdbdbd', mb: 2 }} />
                                <Typography variant="h6" color="textSecondary">
                                    {tJimeng('inputDescriptionStartCreatingVideo')}
                                </Typography>
                                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                                    {tJimeng('videoGenerationTakesTime')}
                                </Typography>
                            </Box>
                        )}

                        {/* 历史记录 */}
                        {showHistory && (
                            <Fade in>
                                <Box sx={{ mt: 3 }}>
                                    <Divider sx={{ my: 2 }} />
                                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                        {tJimeng('history')}
                                    </Typography>

                                    {loadingHistory ? (
                                        <Box textAlign="center" py={4}>
                                            <CircularProgress size={32} />
                                        </Box>
                                    ) : history.length > 0 ? (
                                        <Stack spacing={1.5}>
                                            {history.slice(0, 8).map((item, index) => (
                                                <Card
                                                    key={item._id || index}
                                                    sx={{
                                                        cursor: item.status === 'completed' ? 'pointer' : 'default',
                                                        opacity: item.status === 'completed' ? 1 : 0.6,
                                                        transition: 'all 0.2s',
                                                        '&:hover': item.status === 'completed' ? {
                                                            transform: 'translateX(4px)',
                                                            boxShadow: 2
                                                        } : {},
                                                    }}
                                                    onClick={() => item.status === 'completed' && item.videoUrls?.length > 0 && handlePlay(item.videoUrls[0])}
                                                >
                                                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <PlayArrowIcon sx={{ color: 'secondary.main', fontSize: 20 }} />
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    flex: 1,
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap',
                                                                }}
                                                            >
                                                                {item.prompt}
                                                            </Typography>
                                                            <Chip
                                                                size="small"
                                                                label={item.status === 'completed' ? tJimeng('status') : tJimeng('processing')}
                                                                color={item.status === 'completed' ? 'success' : 'warning'}
                                                                sx={{ height: 20, fontSize: '0.7rem' }}
                                                            />
                                                        </Box>
                                                        <Typography variant="caption" color="textSecondary" sx={{ ml: 3.5 }}>
                                                            {new Date(item.createdAt).toLocaleString()}
                                                        </Typography>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </Stack>
                                    ) : (
                                        <Typography color="textSecondary" textAlign="center" py={3}>
                                            {tJimeng('noHistory')}
                                        </Typography>
                                    )}
                                </Box>
                            </Fade>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* 全屏播放对话框 */}
            <Dialog
                open={!!fullscreenVideo}
                onClose={() => setFullscreenVideo(null)}
                maxWidth="xl"
                fullWidth
                PaperProps={{
                    sx: {
                        bgcolor: 'black',
                        borderRadius: 0,
                    }
                }}
            >
                <DialogActions sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
                    <IconButton color="inherit" onClick={() => setFullscreenVideo(null)}>
                        <CloseIcon />
                    </IconButton>
                </DialogActions>
                <DialogContent sx={{ p: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {fullscreenVideo && (
                        <video
                            src={videoBlobUrl || fullscreenVideo}
                            controls
                            autoPlay
                            style={{ maxWidth: '100%', maxHeight: '90vh', outline: 'none' }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </Container>
    );
};

export default JimengVideoGenerator;