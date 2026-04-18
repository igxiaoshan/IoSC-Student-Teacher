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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Slider,
    Chip,
    Divider,
    Stack,
    IconButton,
    Fade,
    Tooltip,
    Dialog,
    DialogContent,
    DialogActions,
} from '@mui/material';
import {
    AutoAwesome as AutoAwesomeIcon,
    History as HistoryIcon,
    Download as DownloadIcon,
    Refresh as RefreshIcon,
    Close as CloseIcon,
    Fullscreen as FullscreenIcon,
    TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { jimengAPI } from '../../utils/jimengAPI';
import useTranslation from '../../hooks/useTranslation';

const JimengImageGenerator = () => {
    const { currentUser } = useSelector(state => state.user);
    const { tStudent, tJimeng, tCommon } = useTranslation('student');
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
    const [fullscreenImage, setFullscreenImage] = useState(null);

    // 参数选项 - 即梦4.0版本
    const [options, setOptions] = useState({
        width: 1024,
        height: 1024,
        scale: 0.7,
        seed: -1,
    });

    const resolutionOptions = [
        { value: 'square', width: 1024, height: 1024 },
        { value: 'landscape', width: 1280, height: 720 },
        { value: 'portrait', width: 720, height: 1280 },
        { value: 'wide', width: 1152, height: 768 },
        { value: 'tall', width: 768, height: 1152 },
    ];

    const handleResolutionChange = (value) => {
        const resolution = resolutionOptions.find(r => r.value === value);
        if (resolution) {
            setOptions(prev => ({
                ...prev,
                width: resolution.width,
                height: resolution.height,
            }));
        }
    };

    const handleScaleChange = (_, newValue) => {
        setOptions(prev => ({ ...prev, scale: newValue / 100 }));
    };

    // 生成图片
    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError(tJimeng('imageDescription') + ' ' + tCommon('fieldRequired'));
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
                setSuccess(tJimeng('generatingPleaseWait'));
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

    // 轮询任务状态
    const pollTaskStatus = useCallback(async (taskId) => {
        const poll = async () => {
            try {
                const response = await jimengAPI.getTaskStatus(taskId);
                const data = response.data;

                setTaskStatus(data.status);
                setProgress(data.progress || 0);

                if (data.status === 'completed') {
                    setResult(data.resultUrl);
                    setSuccess(tJimeng('generationSuccess'));
                    return;
                } else if (data.status === 'failed') {
                    setError(data.message || tJimeng('generationFailed'));
                    return;
                }

                // 继续轮询
                if (data.status === 'pending' || data.status === 'processing' || data.status === 'in_queue' || data.status === 'generating') {
                    setTimeout(poll, 3000);
                }
            } catch (err) {
                console.error('Polling error:', err);
                setTimeout(poll, 5000);
            }
        };

        poll();
    }, []);

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

    // 下载图片
    const handleDownload = (url) => {
        if (!url) return;
        const link = document.createElement('a');
        link.href = url;
        link.download = `jimeng-image-${Date.now()}.png`;
        link.target = '_blank';
        link.click();
    };

    // 示例提示词
    const examplePrompts = [
        tJimeng('examplePrompts.img1'),
        tJimeng('examplePrompts.img2'),
        tJimeng('examplePrompts.img3'),
        tJimeng('examplePrompts.img4'),
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
                        background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <AutoAwesomeIcon sx={{ color: 'white', fontSize: 28 }} />
                </Box>
                <Box>
                    <Typography variant="h5" fontWeight="bold">
                        {tJimeng('aiImageGenerator')}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        {tJimeng('jimeng40')} · {tJimeng('basedOnTextDescription')}
                    </Typography>
                </Box>
                <Chip
                    label={tJimeng('newVersion')}
                    size="small"
                    color="success"
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
                                {tJimeng('imageDescription')}
                            </Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                placeholder={tJimeng('inputDescriptionStartCreating')}
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
                                            '&:hover': { bgcolor: 'success.light', color: 'white' }
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
                                <InputLabel>{tJimeng('aspectRatio')}</InputLabel>
                                <Select
                                    value={resolutionOptions.find(r => r.width === options.width && r.height === options.height)?.value || 'square'}
                                    label={tJimeng('aspectRatio')}
                                    onChange={(e) => handleResolutionChange(e.target.value)}
                                >
                                    <MenuItem value="square">{tJimeng('square')} (1024×1024)</MenuItem>
                                    <MenuItem value="landscape">{tJimeng('landscape')} (1280×720)</MenuItem>
                                    <MenuItem value="portrait">{tJimeng('portrait')} (720×1280)</MenuItem>
                                    <MenuItem value="wide">{tJimeng('wide')} (1152×768)</MenuItem>
                                    <MenuItem value="tall">{tJimeng('tall')} (768×1152)</MenuItem>
                                </Select>
                            </FormControl>

                            {/* 文本影响度 */}
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2" color="textSecondary">
                                        {tJimeng('textInfluence')}
                                    </Typography>
                                    <Typography variant="body2" fontWeight="bold">
                                        {Math.round(options.scale * 100)}%
                                    </Typography>
                                </Box>
                                <Slider
                                    value={options.scale * 100}
                                    onChange={handleScaleChange}
                                    aria-label={tJimeng('textInfluence')}
                                    valueLabelDisplay="auto"
                                    valueLabelFormat={(v) => `${v}%`}
                                    min={10}
                                    max={100}
                                    sx={{
                                        color: '#11998e',
                                        '& .MuiSlider-thumb': {
                                            backgroundColor: 'white',
                                            border: '2px solid #11998e',
                                        }
                                    }}
                                />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                                    <Typography variant="caption" color="textSecondary">{tJimeng('moreAccurate')}</Typography>
                                    <Typography variant="caption" color="textSecondary">{tJimeng('moreCreative')}</Typography>
                                </Box>
                            </Box>
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
                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AutoAwesomeIcon />}
                                sx={{
                                    py: 1.5,
                                    borderRadius: 2,
                                    background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #0e7c6f 0%, #2dd366 100%)',
                                    }
                                }}
                            >
                                {loading ? tJimeng('generating') : tJimeng('generateImage')}
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
                        {taskId && (taskStatus === 'pending' || taskStatus === 'processing' || taskStatus === 'in_queue' || taskStatus === 'generating') && (
                            <Fade in>
                                <Box sx={{ mt: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <CircularProgress size={16} />
                                        <Typography variant="body2" color="textSecondary">
                                            {taskStatus === 'in_queue' ? tJimeng('queue') :
                                             taskStatus === 'generating' ? tJimeng('generatingVideo') : tJimeng('processing')}
                                        </Typography>
                                    </Box>
                                    <Box
                                        sx={{
                                            height: 4,
                                            bgcolor: '#e0e0e0',
                                            borderRadius: 2,
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                height: '100%',
                                                width: `${Math.round(progress * 100)}%`,
                                                bgcolor: '#38ef7d',
                                                borderRadius: 2,
                                                transition: 'width 0.3s ease',
                                            }}
                                        />
                                    </Box>
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
                                        <TrendingUpIcon sx={{ color: 'success.main', fontSize: 20 }} />
                                        <Typography variant="subtitle2" color="textSecondary">
                                            {tJimeng('result')}
                                        </Typography>
                                        <Stack direction="row" spacing={1} sx={{ ml: 'auto' }}>
                                            <Tooltip title={tJimeng('fullscreenPreview')}>
                                                <IconButton size="small" onClick={() => setFullscreenImage(result)}>
                                                    <FullscreenIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title={tJimeng('downloadImage')}>
                                                <IconButton size="small" onClick={() => handleDownload(result)}>
                                                    <DownloadIcon />
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
                                            cursor: 'pointer',
                                            transition: 'transform 0.2s',
                                            '&:hover': { transform: 'scale(1.01)' }
                                        }}
                                        onClick={() => setFullscreenImage(result)}
                                    >
                                        <CardMedia
                                            component="img"
                                            image={result}
                                            alt="Generated Image"
                                            sx={{
                                                maxHeight: 450,
                                                objectFit: 'contain',
                                                bgcolor: '#f5f5f5',
                                            }}
                                        />
                                    </Card>

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
                                <AutoAwesomeIcon sx={{ fontSize: 64, color: '#bdbdbd', mb: 2 }} />
                                <Typography variant="h6" color="textSecondary">
                                    {tJimeng('inputDescriptionStartCreating')}
                                </Typography>
                                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                                    {tJimeng('moreDetailsBetter')}
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
                                        <Grid container spacing={1.5}>
                                            {history.slice(0, 12).map((item, index) => (
                                                <Grid item xs={4} sm={3} key={item._id || index}>
                                                    <Card
                                                        sx={{
                                                            cursor: item.status === 'completed' ? 'pointer' : 'default',
                                                            opacity: item.status === 'completed' ? 1 : 0.5,
                                                            transition: 'all 0.2s',
                                                            '&:hover': item.status === 'completed' ? {
                                                                transform: 'scale(1.05)',
                                                                boxShadow: 3
                                                            } : {},
                                                        }}
                                                        onClick={() => item.status === 'completed' && setResult(item.resultUrl)}
                                                    >
                                                        {item.resultUrl ? (
                                                            <CardMedia
                                                                component="img"
                                                                image={item.resultUrl}
                                                                alt="History"
                                                                sx={{ height: 100, objectFit: 'cover' }}
                                                            />
                                                        ) : (
                                                            <Box
                                                                sx={{
                                                                    height: 100,
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    bgcolor: '#e0e0e0',
                                                                }}
                                                            >
                                                                <CircularProgress size={24} />
                                                            </Box>
                                                        )}
                                                    </Card>
                                                </Grid>
                                            ))}
                                        </Grid>
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

            {/* 全屏预览对话框 */}
            <Dialog
                open={!!fullscreenImage}
                onClose={() => setFullscreenImage(null)}
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
                    <IconButton color="inherit" onClick={() => setFullscreenImage(null)}>
                        <CloseIcon />
                    </IconButton>
                </DialogActions>
                <DialogContent sx={{ p: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {fullscreenImage && (
                        <img
                            src={fullscreenImage}
                            alt="Fullscreen"
                            style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain' }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </Container>
    );
};

export default JimengImageGenerator;