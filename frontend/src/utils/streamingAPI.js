/**
 * 流式AI API工具
 * 处理Server-Sent Events (SSE) 流式响应
 */

const REACT_APP_BASE_URL = process.env.REACT_APP_BASE_URL ?? "http://localhost:5000";

/**
 * 流式学习助手API调用
 * @param {string} studentId - 学生ID
 * @param {object} questionData - 问题数据
 * @param {function} onContent - 内容回调函数
 * @param {function} onComplete - 完成回调函数
 * @param {function} onError - 错误回调函数
 * @returns {function} 取消函数
 */
export const streamStudyAssistant = (studentId, questionData, onContent, onComplete, onError) => {
    const eventSource = new EventSource(
        `${REACT_APP_BASE_URL}/api/stream/study-assistant/${studentId}/stream`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(questionData)
        }
    );

    // 由于EventSource不支持POST，我们使用fetch + ReadableStream
    return fetchStreamingResponse(
        `${REACT_APP_BASE_URL}/api/stream/study-assistant/${studentId}/stream`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(questionData)
        },
        onContent,
        onComplete,
        onError
    );
};

/**
 * 流式学习伙伴API调用
 * @param {string} studentId - 学生ID
 * @param {string} message - 消息内容
 * @param {function} onContent - 内容回调函数
 * @param {function} onComplete - 完成回调函数
 * @param {function} onError - 错误回调函数
 * @returns {function} 取消函数
 */
export const streamLearningCompanion = (studentId, message, onContent, onComplete, onError) => {
    return fetchStreamingResponse(
        `${REACT_APP_BASE_URL}/api/stream/learning-companion/${studentId}/stream`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message })
        },
        onContent,
        onComplete,
        onError
    );
};

/**
 * 通用流式响应处理函数
 * @param {string} url - API URL
 * @param {object} options - fetch选项
 * @param {function} onContent - 内容回调函数
 * @param {function} onComplete - 完成回调函数
 * @param {function} onError - 错误回调函数
 * @returns {function} 取消函数
 */
const fetchStreamingResponse = async (url, options, onContent, onComplete, onError) => {
    let controller = new AbortController();
    
    try {
        console.log('[Streaming Request]:', { url, options });
        
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
                console.log('[Streaming Complete]');
                break;
            }

            // 解码数据
            buffer += decoder.decode(value, { stream: true });
            
            // 处理完整的行
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // 保留不完整的行

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        
                        console.log('[Streaming Data]:', data);
                        
                        if (data.type === 'content') {
                            // 内容更新
                            onContent && onContent(data.content, data.fullContent);
                        } else if (data.type === 'end') {
                            // 流式结束
                            onComplete && onComplete(data.fullContent, data);
                            return;
                        } else if (data.type === 'error') {
                            // 错误处理
                            onError && onError(new Error(data.error));
                            return;
                        }
                    } catch (parseError) {
                        console.error('[Parse Error]:', parseError, 'Line:', line);
                    }
                }
            }
        }
    } catch (error) {
        console.error('[Streaming Error]:', error);
        if (error.name !== 'AbortError') {
            onError && onError(error);
        }
    }

    // 返回取消函数
    return () => {
        console.log('[Streaming Cancelled]');
        controller.abort();
    };
};

/**
 * 流式消息状态管理Hook
 */
export const useStreamingMessage = () => {
    const [streamingContent, setStreamingContent] = React.useState('');
    const [isStreaming, setIsStreaming] = React.useState(false);
    const [streamingError, setStreamingError] = React.useState(null);

    const startStreaming = () => {
        setStreamingContent('');
        setIsStreaming(true);
        setStreamingError(null);
    };

    const updateContent = (newContent, fullContent) => {
        setStreamingContent(fullContent || newContent);
    };

    const completeStreaming = (finalContent, metadata) => {
        setStreamingContent(finalContent);
        setIsStreaming(false);
        return { content: finalContent, metadata };
    };

    const errorStreaming = (error) => {
        setStreamingError(error);
        setIsStreaming(false);
    };

    const resetStreaming = () => {
        setStreamingContent('');
        setIsStreaming(false);
        setStreamingError(null);
    };

    return {
        streamingContent,
        isStreaming,
        streamingError,
        startStreaming,
        updateContent,
        completeStreaming,
        errorStreaming,
        resetStreaming
    };
};

/**
 * 打字机效果Hook
 * @param {string} text - 要显示的文本
 * @param {number} speed - 打字速度(毫秒)
 * @returns {string} 当前显示的文本
 */
export const useTypewriter = (text, speed = 50) => {
    const [displayText, setDisplayText] = React.useState('');
    const [currentIndex, setCurrentIndex] = React.useState(0);

    React.useEffect(() => {
        if (currentIndex < text.length) {
            const timer = setTimeout(() => {
                setDisplayText(prev => prev + text[currentIndex]);
                setCurrentIndex(prev => prev + 1);
            }, speed);

            return () => clearTimeout(timer);
        }
    }, [currentIndex, text, speed]);

    React.useEffect(() => {
        // 当文本改变时重置
        setDisplayText('');
        setCurrentIndex(0);
    }, [text]);

    return displayText;
};

/**
 * 流式响应调试工具
 */
export const debugStreamingResponse = (data) => {
    console.group('🔄 Streaming Response Debug');
    console.log('Type:', data.type);
    console.log('Content:', data.content?.substring(0, 100) + '...');
    console.log('Full Content Length:', data.fullContent?.length);
    console.log('Timestamp:', new Date().toISOString());
    console.groupEnd();
};
