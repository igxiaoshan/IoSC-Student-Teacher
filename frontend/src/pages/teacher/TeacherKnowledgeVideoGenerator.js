import React, { useState } from 'react';
import {
    Box,
    Container,
    Typography,
    TextField,
    Button,
    Paper,
    Card,
    CircularProgress,
    Alert,
    Stack,
    Chip,
    Divider,
    IconButton,
    Fade,
    Tooltip,
    Dialog,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    Collapse,
} from '@mui/material';
import {
    VideoLibrary as VideoLibraryIcon,
    PlayArrow as PlayArrowIcon,
    Close as CloseIcon,
    Fullscreen as FullscreenIcon,
    School as SchoolIcon,
    Lightbulb as LightbulbIcon,
    History as HistoryIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { knowledgeVideoAPI } from '../../utils/knowledgeVideoAPI';
import { jimengAPI } from '../../utils/jimengAPI';

const TeacherKnowledgeVideoGenerator = () => {
    const { currentUser } = useSelector(state => state.user);

    const [keyword, setKeyword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [taskId, setTaskId] = useState(null);
    const [taskStatus, setTaskStatus] = useState('');
    const [knowledgeSource, setKnowledgeSource] = useState('');
    const [result, setResult] = useState(null);
    const [videoBlobUrl, setVideoBlobUrl] = useState(null);
    const [loadingVideo, setLoadingVideo] = useState(false);
    const [fullscreenVideo, setFullscreenVideo] = useState(null);

    // 历史记录状态
    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // 热门教学知识点示例
    const exampleKeywords = [
        '欧姆定律',
        '三角函数',
        '细胞分裂',
        '光的反射',
        '化学反应速率',
        '牛顿运动定律',
    ];

    // 加载历史记录
    const fetchHistory = async () => {
        if (!currentUser?._id) return;

        setLoadingHistory(true);
        try {
            const response = await knowledgeVideoAPI.getHistory(currentUser._id);
            if (response.data.success) {
                setHistory(response.data.history || []);
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

    // 处理视频播放
    const handlePlay = async (url) => {
        if (!url) return;
        setResult(url);

        // blob URL 直接使用
        if (url.startsWith('blob:')) {
            setVideoBlobUrl(url);
            return;
        }

        // CDN URL 或本地代理 URL：直接使用，让浏览器自动处理请求和 Referer
        // 不再通过 fetch 下载 blob，因为 CDN 链接会很快过期
        setVideoBlobUrl(null); // 清除之前的 blob URL
        setLoadingVideo(false);
    };

    // 轮询任务状态
    const pollTaskStatus = async (tid) => {
        console.log('[DEBUG] 开始轮询, taskId:', tid);

        const poll = async () => {
            try {
                const response = await knowledgeVideoAPI.getTaskStatus(tid, 'video');
                const data = response.data;

                console.log('[DEBUG] 轮询返回:', data.status, 'videoUrls:', data.videoUrls?.length);

                setTaskStatus(data.status);

                if (data.status === 'completed') {
                    console.log('[DEBUG] 任务完成, 调用handlePlay');
                    if (data.videoUrls && data.videoUrls.length > 0) {
                        handlePlay(data.videoUrls[0]);
                    }
                    // 立即显示成功消息和视频，不要做其他延迟操作
                    setSuccess('教学视频生成成功！请尽快播放，视频链接有时效性');
                    // 异步加载历史记录，不阻塞视频播放
                    if (showHistory) {
                        setTimeout(() => fetchHistory(), 100);
                    }
                    return;
                } else if (data.status === 'failed') {
                    setError(data.message || '视频生成失败');
                    return;
                }

                // 继续轮询
                if (['pending', 'processing', 'in_queue', 'generating'].includes(data.status)) {
                    console.log('[DEBUG] 继续轮询...');
                    setTimeout(poll, 5000);
                }
            } catch (err) {
                console.error('Polling error:', err);
                setTimeout(poll, 8000);
            }
        };

        poll();
    };

    // 生成教学视频
    const handleGenerate = async () => {
        if (!keyword.trim()) {
            setError('请输入知识点关键词');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');
        setTaskId(null);
        setResult(null);
        setVideoBlobUrl(null);
        setKnowledgeSource('');

        try {
            const response = await knowledgeVideoAPI.generateVideo(
                keyword,
                null,
                currentUser?._id,
                'Teacher'
            );
            const data = response.data;

            if (data.success) {
                setTaskId(data.taskId);
                setTaskStatus(data.status);
                setKnowledgeSource(data.knowledgeSource || 'none');

                setSuccess(data.mock ? '教学视频任务已提交(模拟模式)，正在加载...' : '正在生成教学视频，请稍候...');
                pollTaskStatus(data.taskId);
            } else {
                setError(data.message || '生成失败');
            }
        } catch (err) {
            console.error('生成错误:', err);
            setError(err.response?.data?.message || err.message || '生成失败');
        } finally {
            setLoading(false);
        }
    };

    // 点击示例关键词
    const handleExampleClick = (example) => {
        setKeyword(example);
    };

    // 点击历史记录
    const handleHistoryClick = (item) => {
        if (item.status !== 'completed') return;

        // 优先使用本地文件路径
        if (item.localFilePath) {
            handlePlay(`/api/knowledge/video/${item._id}`);
            return;
        }

        // 使用 resultUrl（可能是CDN URL或本地代理URL）
        if (item.resultUrl) {
            // 检查是否是CDN URL
            if (item.resultUrl.startsWith('http') && item.resultUrl.includes('aigc-cloud.com')) {
                // CDN URL 检查是否过期
                try {
                    const url = new URL(item.resultUrl);
                    const dyQ = url.searchParams.get('dy_q');
                    if (dyQ) {
                        const expireTime = parseInt(dyQ) * 1000;
                        const now = Date.now();
                        if (now > expireTime) {
                            setError('该视频链接已过期，请重新生成');
                            return;
                        }
                    }
                } catch (e) {}
            }
            handlePlay(item.resultUrl);
            return;
        }

        // 使用 playableUrl
        if (item.playableUrl) {
            handlePlay(item.playableUrl);
        }
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
                {/* 标题 */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Box sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <VideoLibraryIcon sx={{ color: '#fff', fontSize: 32 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h5" fontWeight="bold">
                            教学视频生成
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            输入教学知识点，AI自动为你生成教学视频
                        </Typography>
                    </Box>
                    {/* 历史记录按钮 */}
                    <Tooltip title="查看历史记录">
                        <IconButton onClick={toggleHistory} color={showHistory ? 'primary' : 'default'}>
                            <HistoryIcon />
                        </IconButton>
                    </Tooltip>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* 历史记录列表 */}
                <Collapse in={showHistory}>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                            历史记录
                        </Typography>
                        {loadingHistory ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                                <CircularProgress size={24} />
                            </Box>
                        ) : history.length > 0 ? (
                            <List dense sx={{ maxHeight: 200, overflow: 'auto', bgcolor: 'grey.50', borderRadius: 1 }}>
                                {history.map((item, index) => (
                                    <ListItem
                                        key={item._id || index}
                                        onClick={() => handleHistoryClick(item)}
                                        sx={{
                                            cursor: item.status === 'completed' ? 'pointer' : 'default',
                                            opacity: item.status === 'completed' ? 1 : 0.6,
                                            '&:hover': item.status === 'completed' ? { bgcolor: 'grey.200' } : {},
                                        }}
                                    >
                                        <PlayArrowIcon sx={{ fontSize: 20, mr: 1, color: 'success.main' }} />
                                        <ListItemText
                                            primary={item.prompt}
                                            secondary={item.params?.knowledgeSource === 'dify' ? 'Dify知识库' : '原生概念'}
                                            secondaryTypographyProps={{
                                                component: 'span',
                                                variant: 'caption',
                                                color: item.params?.knowledgeSource === 'dify' ? 'success' : 'textSecondary',
                                            }}
                                        />
                                        <Chip
                                            size="small"
                                            label={item.status === 'completed' ? '已完成' : '处理中'}
                                            color={item.status === 'completed' ? 'success' : 'warning'}
                                            variant="outlined"
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                                暂无历史记录
                            </Typography>
                        )}
                    </Box>
                    <Divider sx={{ my: 2 }} />
                </Collapse>

                {/* 输入区域 */}
                <Box sx={{ mb: 3 }}>
                    <TextField
                        fullWidth
                        label="输入教学知识点"
                        placeholder="例如：欧姆定律、三角函数、细胞分裂..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
                        disabled={loading}
                        InputProps={{
                            startAdornment: (
                                <LightbulbIcon sx={{ color: 'action.active', mr: 1 }} />
                            ),
                        }}
                    />
                </Box>

                {/* 示例 */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        试试这些教学知识点：
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {exampleKeywords.map((example) => (
                            <Chip
                                key={example}
                                label={example}
                                onClick={() => handleExampleClick(example)}
                                icon={<SchoolIcon sx={{ fontSize: 16 }} />}
                                variant="outlined"
                                size="small"
                                sx={{
                                    cursor: 'pointer',
                                    '&:hover': { bgcolor: 'success.light', color: 'success.contrastText' }
                                }}
                            />
                        ))}
                    </Stack>
                </Box>

                {/* 操作按钮 */}
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <Button
                        variant="contained"
                        color="success"
                        size="large"
                        onClick={handleGenerate}
                        disabled={loading || !keyword.trim()}
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <VideoLibraryIcon />}
                        sx={{ flex: 1, py: 1.5 }}
                    >
                        {loading ? '生成中...' : '生成教学视频'}
                    </Button>
                </Box>

                {/* 状态提示 */}
                {error && (
                    <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>
                        {success}
                    </Alert>
                )}

                {/* 知识来源 */}
                {knowledgeSource && (
                    <Box sx={{ mb: 2 }}>
                        <Chip
                            size="small"
                            label={knowledgeSource === 'dify' ? 'Dify知识库内容' : '原生概念'}
                            color={knowledgeSource === 'dify' ? 'success' : 'default'}
                            variant="outlined"
                        />
                    </Box>
                )}

                {/* 视频结果 */}
                {result && (
                    <Fade in>
                        <Box>
                            <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                                生成的视频
                            </Typography>
                            <Card sx={{ borderRadius: 2, overflow: 'hidden', bgcolor: '#000', position: 'relative' }}>
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
                                    style={{
                                        width: '100%',
                                        maxHeight: '400px',
                                        display: 'block',
                                    }}
                                />
                            </Card>

                            {/* 全屏按钮 */}
                            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                                <Tooltip title="全屏播放">
                                    <IconButton onClick={() => { handlePlay(result); setFullscreenVideo(result); }}>
                                        <FullscreenIcon />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Box>
                    </Fade>
                )}
            </Paper>

            {/* 全屏播放对话框 */}
            <Dialog
                open={!!fullscreenVideo}
                onClose={() => setFullscreenVideo(null)}
                maxWidth="xl"
                fullWidth
                PaperProps={{
                    sx: { bgcolor: 'black', borderRadius: 0 }
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

export default TeacherKnowledgeVideoGenerator;