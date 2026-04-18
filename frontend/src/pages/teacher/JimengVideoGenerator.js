import React, { useState } from 'react';
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
    LinearProgress,
    List,
    ListItem,
    ListItemText,
    Chip,
    Divider,
} from '@mui/material';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import RefreshIcon from '@mui/icons-material/Refresh';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import HistoryIcon from '@mui/icons-material/History';
import { useSelector } from 'react-redux';
import { jimengAPI } from '../../utils/jimengAPI';

const JimengVideoGenerator = () => {
    const { currentUser } = useSelector(state => state.user);
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

    // 参数选项
    const [options, setOptions] = useState({
        duration: 5,
        resolution: '720p',
        fps: 24,
    });

    const durationOptions = [
        { value: 5, label: '5秒' },
        { value: 10, label: '10秒' },
    ];

    const resolutionOptions = [
        { value: '720p', label: '720p (HD)' },
        { value: '1080p', label: '1080p (Full HD)' },
    ];

    const handleOptionChange = (field, value) => {
        setOptions(prev => ({ ...prev, [field]: value }));
    };

    // 生成视频
    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('请输入描述文本');
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
            const response = await jimengAPI.textToVideo(prompt, options);

            if (response.data.success) {
                setTaskId(response.data.taskId);
                setSuccess('视频生成任务已提交，视频生成需要较长时间，请耐心等待...');
                // 开始轮询状态
                pollTaskStatus(response.data.taskId);
            } else {
                setError(response.data.message || '生成失败');
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || '生成失败');
        } finally {
            setLoading(false);
        }
    };

    // 轮询任务状态
    const pollTaskStatus = async (taskId) => {
        const poll = async () => {
            try {
                const response = await jimengAPI.getTaskStatus(taskId);
                const data = response.data;

                setTaskStatus(data.status);
                setProgress(data.progress || 0);

                if (data.status === 'completed') {
                    setVideoUrls(data.videoUrls || []);
                    if (data.videoUrls && data.videoUrls.length > 0) {
                        setResult(data.videoUrls[0]);
                    }
                    setSuccess('视频生成成功！');
                    fetchHistory();
                    return;
                } else if (data.status === 'failed') {
                    setError(data.message || '生成失败');
                    return;
                }

                // 继续轮询
                if (data.status === 'pending' || data.status === 'processing') {
                    setTimeout(poll, 5000); // 视频生成时间较长，间隔5秒
                }
            } catch (err) {
                console.error('轮询错误:', err);
                setTimeout(poll, 8000);
            }
        };

        poll();
    };

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
            console.error('获取历史记录失败:', err);
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

    // 播放视频
    const handlePlay = (url) => {
        if (!url) return;
        setResult(url);
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <VideoLibraryIcon fontSize="large" />
                AI文生视频
            </Typography>
            <Typography variant="body1" color="textSecondary" paragraph>
                使用即梦AI根据文本描述生成视频（生成可能需要几分钟，请耐心等待）
            </Typography>

            <Paper sx={{ p: 3 }}>
                {/* 提示词输入 */}
                <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="视频描述"
                    placeholder="描述你想要的视频内容，例如：一只橘猫在草地上奔跑，阳光明媚，背景是蓝天白云"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    sx={{ mb: 3 }}
                />

                {/* 参数设置 */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={4}>
                        <FormControl fullWidth>
                            <InputLabel>视频时长</InputLabel>
                            <Select
                                value={options.duration}
                                label="视频时长"
                                onChange={(e) => handleOptionChange('duration', e.target.value)}
                            >
                                {durationOptions.map(opt => (
                                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <FormControl fullWidth>
                            <InputLabel>分辨率</InputLabel>
                            <Select
                                value={options.resolution}
                                label="分辨率"
                                onChange={(e) => handleOptionChange('resolution', e.target.value)}
                            >
                                {resolutionOptions.map(opt => (
                                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <FormControl fullWidth>
                            <InputLabel>帧率</InputLabel>
                            <Select
                                value={options.fps}
                                label="帧率"
                                onChange={(e) => handleOptionChange('fps', e.target.value)}
                            >
                                <MenuItem value={24}>24 fps</MenuItem>
                                <MenuItem value={30}>30 fps</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>

                {/* 操作按钮 */}
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleGenerate}
                        disabled={loading || !prompt.trim()}
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                    >
                        {loading ? '生成中...' : '生成视频'}
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={toggleHistory}
                        startIcon={<HistoryIcon />}
                    >
                        {showHistory ? '隐藏历史' : '查看历史'}
                    </Button>
                </Box>

                {/* 进度显示 */}
                {taskId && (taskStatus === 'pending' || taskStatus === 'processing') && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                            任务ID: {taskId}
                        </Typography>
                        <LinearProgress variant="determinate" value={progress * 100} sx={{ mb: 1 }} />
                        <Typography variant="body2" color="textSecondary">
                            状态: {taskStatus === 'pending' ? '排队中...' : '生成中...'} {Math.round(progress * 100)}%
                        </Typography>
                    </Box>
                )}

                {/* 错误提示 */}
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                {/* 成功提示 */}
                {success && !result && (
                    <Alert severity="info" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
                        {success}
                    </Alert>
                )}

                <Divider sx={{ my: 3 }} />

                {/* 结果展示 */}
                {result && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" gutterBottom>生成结果</Typography>
                        <Card>
                            <CardMedia
                                component="video"
                                src={result}
                                controls
                                sx={{ maxHeight: 500, objectFit: 'contain' }}
                            />
                            <CardContent>
                                <Typography variant="body2" color="textSecondary">
                                    当前播放: {videoUrls.indexOf(result) + 1} / {videoUrls.length}
                                </Typography>
                            </CardContent>
                        </Card>
                        {videoUrls.length > 1 && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>其他生成结果：</Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    {videoUrls.map((url, index) => (
                                        <Chip
                                            key={index}
                                            icon={<PlayArrowIcon />}
                                            label={`视频 ${index + 1}`}
                                            onClick={() => handlePlay(url)}
                                            color={url === result ? 'primary' : 'default'}
                                            variant={url === result ? 'filled' : 'outlined'}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        )}
                    </Box>
                )}

                {/* 历史记录 */}
                {showHistory && (
                    <Box>
                        <Typography variant="h6" gutterBottom>历史记录</Typography>
                        {loadingHistory ? (
                            <Box textAlign="center" py={3}>
                                <CircularProgress />
                            </Box>
                        ) : history.length > 0 ? (
                            <List>
                                {history.map((item, index) => (
                                    <ListItem
                                        key={item._id || index}
                                        sx={{
                                            border: '1px solid #e0e0e0',
                                            borderRadius: 1,
                                            mb: 1,
                                            opacity: item.status === 'completed' ? 1 : 0.6,
                                        }}
                                    >
                                        <ListItemText
                                            primary={
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                        maxWidth: 400,
                                                    }}
                                                >
                                                    {item.prompt}
                                                </Typography>
                                            }
                                            secondary={
                                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
                                                    <Chip
                                                        size="small"
                                                        label={item.status === 'completed' ? '已完成' : '处理中'}
                                                        color={item.status === 'completed' ? 'success' : 'warning'}
                                                    />
                                                    <Typography variant="caption">
                                                        {new Date(item.createdAt).toLocaleString()}
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                        {item.status === 'completed' && item.videoUrls && item.videoUrls.length > 0 && (
                                            <Button
                                                size="small"
                                                startIcon={<PlayArrowIcon />}
                                                onClick={() => handlePlay(item.videoUrls[0])}
                                            >
                                                播放
                                            </Button>
                                        )}
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Typography color="textSecondary">暂无历史记录</Typography>
                        )}
                    </Box>
                )}
            </Paper>
        </Container>
    );
};

export default JimengVideoGenerator;
