import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Alert,
    CircularProgress,
    Chip,
    Grid,
    Divider
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import CloudIcon from '@mui/icons-material/Cloud';
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from 'axios';

const DifyStatus = () => {
    const [loading, setLoading] = useState(false);
    const [serviceInfo, setServiceInfo] = useState(null);
    const [testResult, setTestResult] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchServiceInfo();
    }, []);

    const fetchServiceInfo = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/dify/info`);
            if (response.data.success) {
                setServiceInfo(response.data.serviceInfo);
            }
        } catch (err) {
            console.error('获取Dify服务信息失败:', err);
        }
    };

    const testConnection = async () => {
        setLoading(true);
        setError('');
        setTestResult(null);

        try {
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/dify/test`);
            setTestResult(response.data);
        } catch (err) {
            setError('连接测试失败: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        if (status === '已配置' && testResult?.success) return 'success';
        if (status === '已配置') return 'warning';
        return 'error';
    };

    const getStatusIcon = (status) => {
        if (status === '已配置' && testResult?.success) return <CheckCircleIcon />;
        return <ErrorIcon />;
    };

    return (
        <Card sx={{ mb: 3 }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <CloudIcon color="primary" />
                    <Typography variant="h6">
                        Dify云服务状态
                    </Typography>
                </Box>

                {serviceInfo && (
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="body2" color="textSecondary">
                                服务类型
                            </Typography>
                            <Typography variant="body1">
                                {serviceInfo.serviceType}
                            </Typography>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <Typography variant="body2" color="textSecondary">
                                API地址
                            </Typography>
                            <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                                {serviceInfo.apiUrl}
                            </Typography>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <Typography variant="body2" color="textSecondary">
                                API密钥
                            </Typography>
                            <Typography variant="body1">
                                {serviceInfo.apiKey}
                            </Typography>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <Typography variant="body2" color="textSecondary">
                                配置状态
                            </Typography>
                            <Chip
                                icon={getStatusIcon(serviceInfo.status)}
                                label={serviceInfo.status}
                                color={getStatusColor(serviceInfo.status)}
                                size="small"
                            />
                        </Grid>
                    </Grid>
                )}

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                    <Button
                        variant="contained"
                        onClick={testConnection}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
                    >
                        {loading ? '测试中...' : '测试连接'}
                    </Button>
                    
                    {testResult && (
                        <Chip
                            icon={testResult.success ? <CheckCircleIcon /> : <ErrorIcon />}
                            label={testResult.success ? '连接正常' : '连接失败'}
                            color={testResult.success ? 'success' : 'error'}
                        />
                    )}
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {testResult && testResult.success && (
                    <Alert severity="success">
                        <Typography variant="subtitle2">
                            连接测试成功！
                        </Typography>
                        <Typography variant="body2">
                            {testResult.message}
                        </Typography>
                        {testResult.testResponse && (
                            <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                                测试响应: {JSON.stringify(testResult.testResponse, null, 2).substring(0, 200)}...
                            </Typography>
                        )}
                    </Alert>
                )}

                {testResult && !testResult.success && (
                    <Alert severity="error">
                        <Typography variant="subtitle2">
                            连接测试失败
                        </Typography>
                        <Typography variant="body2">
                            {testResult.message}
                        </Typography>
                    </Alert>
                )}

                <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="textSecondary">
                        提示：确保Dify云服务API密钥正确，并且网络连接正常。
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
};

export default DifyStatus;
