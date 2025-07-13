import React from 'react';
import { Box, Typography, Button, Alert, Paper } from '@mui/material';
import { Refresh as RefreshIcon, Home as HomeIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            hasError: false, 
            error: null, 
            errorInfo: null 
        };
    }

    static getDerivedStateFromError(error) {
        // 更新 state 使下一次渲染能够显示降级后的 UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // 你同样可以将错误日志上报给服务器
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
    }

    render() {
        if (this.state.hasError) {
            return <ErrorFallback 
                error={this.state.error} 
                errorInfo={this.state.errorInfo}
                onRetry={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            />;
        }

        return this.props.children;
    }
}

const ErrorFallback = ({ error, errorInfo, onRetry }) => {
    const navigate = useNavigate();

    const handleRefresh = () => {
        window.location.reload();
    };

    const handleGoHome = () => {
        navigate('/Admin/dashboard');
    };

    const isNullReferenceError = error?.message?.includes('Cannot read properties of null');
    const isUndefinedReferenceError = error?.message?.includes('Cannot read properties of undefined');
    const isDataError = isNullReferenceError || isUndefinedReferenceError;

    return (
        <Box sx={{ p: 3, maxWidth: 800, mx: 'auto', mt: 4 }}>
            <Paper sx={{ p: 4 }}>
                <Alert severity="error" sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        页面加载出错
                    </Typography>
                    
                    {isDataError ? (
                        <Typography variant="body1" gutterBottom>
                            数据加载异常，可能是由于：
                        </Typography>
                    ) : (
                        <Typography variant="body1" gutterBottom>
                            页面运行时出现错误
                        </Typography>
                    )}
                </Alert>

                {isDataError && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            可能的原因：
                        </Typography>
                        <ul>
                            <li>数据库中的关联数据缺失</li>
                            <li>后端API返回的数据结构不完整</li>
                            <li>网络连接问题导致数据加载失败</li>
                            <li>数据同步问题</li>
                        </ul>
                        
                        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                            建议解决方案：
                        </Typography>
                        <ul>
                            <li>刷新页面重新加载数据</li>
                            <li>检查相关的班级、科目、学生数据是否完整</li>
                            <li>联系管理员检查数据库状态</li>
                        </ul>
                    </Box>
                )}

                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <Button
                        variant="contained"
                        startIcon={<RefreshIcon />}
                        onClick={handleRefresh}
                        color="primary"
                    >
                        刷新页面
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<HomeIcon />}
                        onClick={handleGoHome}
                    >
                        返回首页
                    </Button>
                    <Button
                        variant="text"
                        onClick={onRetry}
                    >
                        重试
                    </Button>
                </Box>

                {process.env.NODE_ENV === 'development' && (
                    <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            错误详情（开发模式）：
                        </Typography>
                        <Paper sx={{ p: 2, bgcolor: 'grey.100', overflow: 'auto' }}>
                            <Typography variant="body2" component="pre" sx={{ fontSize: '0.8rem' }}>
                                {error?.toString()}
                                {errorInfo?.componentStack}
                            </Typography>
                        </Paper>
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

// 高阶组件，用于包装可能出错的组件
export const withErrorBoundary = (Component, fallbackComponent = null) => {
    return function WrappedComponent(props) {
        return (
            <ErrorBoundary fallback={fallbackComponent}>
                <Component {...props} />
            </ErrorBoundary>
        );
    };
};

// Hook 用于在函数组件中处理错误
export const useErrorHandler = () => {
    const [error, setError] = React.useState(null);

    const resetError = () => setError(null);

    const handleError = React.useCallback((error) => {
        console.error('Handled error:', error);
        setError(error);
    }, []);

    React.useEffect(() => {
        if (error) {
            throw error;
        }
    }, [error]);

    return { handleError, resetError };
};

export default ErrorBoundary;
