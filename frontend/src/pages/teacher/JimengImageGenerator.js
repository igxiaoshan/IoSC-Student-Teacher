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
    CardActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    IconButton,
    Divider,
    List,
    ListItem,
    ListItemText,
    LinearProgress,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import ImageIcon from '@mui/icons-material/Image';
import HistoryIcon from '@mui/icons-material/History';
import { useSelector } from 'react-redux';
import { jimengAPI } from '../../utils/jimengAPI';

const JimengImageGenerator = () => {
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

    // 参数选项
    const [options, setOptions] = useState({
        width: 1024,
        height: 1024,
        steps: 20,
        guidance_scale: 7.5,
        num_images: 1,
    });

    const resolutionOptions = [
        { value: '512-512', label: '512x512', width: 512, height: 512 },
        { value: '768-768', label: '768x768', width: 768, height: 768 },
        { value: '1024-1024', label: '1024x1024', width: 1024, height: 1024 },
        { value: '1024-768', label: '1024x768 横版', width: 1024, height: 768 },
        { value: '768-1024', label: '768x1024 竖版', width: 768, height: 1024 },
    ];

    const handleOptionChange = (field, value) => {
        const resolution = resolutionOptions.find(r => r.value === value);
        if (resolution) {
            setOptions(prev => ({
                ...prev,
                width: resolution.width,
                height: resolution.height,
            }));
        } else {
            setOptions(prev => ({ ...prev, [field]: value }));
        }
    };

    // 生成图片
    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('请输入描述文本');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');
        setResult(null);
        setTaskId(null);
        setTaskStatus('pending');
        setProgress(0);

        try {
            const response = await jimengAPI.textToImage(prompt, options);

            if (response.data.success) {
                setTaskId(response.data.taskId);
                setSuccess('图片生成任务已提交，请稍候...');
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
                    setResult(data.resultUrl);
                    setSuccess('图片生成成功！');
                    // 获取历史记录
                    fetchHistory();
                    return;
                } else if (data.status === 'failed') {
                    setError(data.message || '生成失败');
                    return;
                }

                // 继续轮询
                if (data.status === 'pending' || data.status === 'processing') {
                    setTimeout(poll, 3000);
                }
            } catch (err) {
                console.error('轮询错误:', err);
                setTimeout(poll, 5000);
            }
        };

        poll();
    };

    // 获取历史记录
    const fetchHistory = async () => {
        if (!currentUser?._id) return;

        setLoadingHistory(true);
        try {
            const response = await jimengAPI.getUserHistory(currentUser._id, 'image');
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

    // 下载图片
    const handleDownload = (url) => {
        if (!url) return;
        const link = document.createElement('a');
        link.href = url;
        link.download = `jimeng-image-${Date.now()}.png`;
        link.target = '_blank';
        link.click();
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ImageIcon fontSize="large" />
                AI文生图
            </Typography>
            <Typography variant="body1" color="textSecondary" paragraph>
                使用即梦AI根据文本描述生成图片
            </Typography>

            <Paper sx={{ p: 3 }}>
                {/* 提示词输入 */}
                <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="图片描述"
                    placeholder="描述你想要的图片内容，例如：一只可爱的橘猫在阳光下打盹，背景是花园"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    sx={{ mb: 3 }}
                />

                {/* 参数设置 */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={4}>
                        <FormControl fullWidth>
                            <InputLabel>分辨率</InputLabel>
                            <Select
                                value={`${options.width}-${options.height}`}
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
                        <TextField
                            fullWidth
                            type="number"
                            label="生成数量"
                            value={options.num_images}
                            onChange={(e) => handleOptionChange('num_images', parseInt(e.target.value))}
                            inputProps={{ min: 1, max: 4 }}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            type="number"
                            label="迭代步数"
                            value={options.steps}
                            onChange={(e) => handleOptionChange('steps', parseInt(e.target.value))}
                            inputProps={{ min: 10, max: 50 }}
                        />
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
                        {loading ? '生成中...' : '生成图片'}
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
                    <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
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
                                component="img"
                                image={result}
                                alt="Generated Image"
                                sx={{ maxHeight: 500, objectFit: 'contain' }}
                            />
                            <CardActions>
                                <Button
                                    size="small"
                                    startIcon={<DownloadIcon />}
                                    onClick={() => handleDownload(result)}
                                >
                                    下载图片
                                </Button>
                                <Button
                                    size="small"
                                    startIcon={<RefreshIcon />}
                                    onClick={handleGenerate}
                                >
                                    重新生成
                                </Button>
                            </CardActions>
                        </Card>
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
                            <Grid container spacing={2}>
                                {history.map((item, index) => (
                                    <Grid item xs={6} md={3} key={item._id || index}>
                                        <Card
                                            sx={{
                                                cursor: 'pointer',
                                                opacity: item.status === 'completed' ? 1 : 0.6,
                                            }}
                                            onClick={() => item.status === 'completed' && setResult(item.resultUrl)}
                                        >
                                            {item.resultUrl ? (
                                                <CardMedia
                                                    component="img"
                                                    image={item.resultUrl}
                                                    alt="History Image"
                                                    sx={{ height: 150, objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <Box
                                                    sx={{
                                                        height: 150,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        backgroundColor: '#f0f0f0',
                                                    }}
                                                >
                                                    <CircularProgress size={24} />
                                                </Box>
                                            )}
                                            <CardContent sx={{ py: 1 }}>
                                                <Typography variant="caption" color="textSecondary">
                                                    {new Date(item.createdAt).toLocaleString()}
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    {item.prompt}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        ) : (
                            <Typography color="textSecondary">暂无历史记录</Typography>
                        )}
                    </Box>
                )}
            </Paper>
        </Container>
    );
};

export default JimengImageGenerator;
