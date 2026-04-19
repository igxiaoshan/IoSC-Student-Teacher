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
    Divider,
} from '@mui/material';
import {
    PlayArrow as PlayArrowIcon,
    VideoLibrary as VideoLibraryIcon,
} from '@mui/icons-material';
import { jimengAPI } from '../../utils/jimengAPI';

const VideoProxyDemo = () => {
    const [videoUrl, setVideoUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [proxyUrl, setProxyUrl] = useState('');

    const handleTestProxy = async () => {
        if (!videoUrl.trim()) {
            setError('请输入视频URL');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // 生成代理URL
            const url = jimengAPI.getProxyUrl(videoUrl);
            setProxyUrl(url);
            console.log('[DEBUG] 代理URL:', url);
        } catch (err) {
            console.error('生成代理URL失败:', err);
            setError('生成代理URL失败');
        } finally {
            setLoading(false);
        }
    };

    const handleDirectPlay = () => {
        if (!videoUrl.trim()) {
            setError('请输入视频URL');
            return;
        }
        setProxyUrl(videoUrl);
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
                        background: 'linear-gradient(135deg, #e91e63 0%, #9c27b0 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <VideoLibraryIcon sx={{ color: '#fff', fontSize: 32 }} />
                    </Box>
                    <Box>
                        <Typography variant="h5" fontWeight="bold">
                            视频代理测试
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            输入视频URL，通过后端代理播放（节省API额度）
                        </Typography>
                    </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* URL输入 */}
                <Box sx={{ mb: 3 }}>
                    <TextField
                        fullWidth
                        label="视频URL"
                        placeholder="粘贴视频URL，例如: https://v11-aiop.aigc-cloud.com/..."
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        multiline
                        rows={3}
                    />
                </Box>

                {/* 操作按钮 */}
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        onClick={handleTestProxy}
                        disabled={loading || !videoUrl.trim()}
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
                    >
                        生成代理URL并播放
                    </Button>
                    <Button
                        variant="outlined"
                        color="secondary"
                        size="large"
                        onClick={handleDirectPlay}
                        disabled={!videoUrl.trim()}
                    >
                        直接播放
                    </Button>
                </Box>

                {/* 错误提示 */}
                {error && (
                    <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* 代理URL显示 */}
                {proxyUrl && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                            代理URL:
                        </Typography>
                        <Paper sx={{ p: 2, bgcolor: 'grey.100', wordBreak: 'break-all' }}>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                {proxyUrl}
                            </Typography>
                        </Paper>
                    </Box>
                )}

                {/* 视频播放器 */}
                {proxyUrl && (
                    <Box>
                        <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                            视频预览:
                        </Typography>
                        <Card sx={{ borderRadius: 2, overflow: 'hidden', bgcolor: '#000' }}>
                            <video
                                src={proxyUrl}
                                controls
                                autoPlay
                                crossOrigin="anonymous"
                                style={{
                                    width: '100%',
                                    maxHeight: '400px',
                                    display: 'block',
                                }}
                            />
                        </Card>
                    </Box>
                )}

                {/* 示例URL */}
                <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                        示例视频URL（可直接粘贴测试）:
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                        <Typography
                            variant="body2"
                            sx={{
                                fontFamily: 'monospace',
                                fontSize: '0.75rem',
                                wordBreak: 'break-all',
                                cursor: 'pointer',
                                '&:hover': { color: 'primary.main' }
                            }}
                            onClick={() => setVideoUrl('https://v11-aiop.aigc-cloud.com/cfb85269400f8a59edcf55c7e27d66b8/69e454bd/video/tos/cn/tos-cn-v-242bcc/07ac0523fb0143ba8432a233a468294a/?a=764792&ch=0&cr=0&dr=0&er=0&lr=default&cd=0%7C0%7C0%7C0&br=3984&bt=3984&cs=0&ds=3&ft=GbtG6uO3pyygZmo0PgcOjRkVQ9w6x&mime_type=video_mp4&qs=13&rc=amprZTVrbzo3OjgzNGczM0BpamprZTVrbzo3OjgzNGczM0BzZzM0cWcvYWZhLS1kXjBzYSNzZzM0cWcvYWZhLS1kXjBzcw%3D%3D&btag=80000e00008000&dy_q=1776567976&l=2026041911061660E98B73E37EBE93F024')}
                        >
                            点击使用示例URL
                        </Typography>
                    </Paper>
                </Box>
            </Paper>
        </Container>
    );
};

export default VideoProxyDemo;