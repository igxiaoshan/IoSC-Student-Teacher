/**
 * SSE 响应辅助工具
 */

const setSSEHeaders = (res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
        'X-Accel-Buffering': 'no'
    });
};

const sendSSEEvent = (res, type, data) => {
    if (res.writableEnded) return;
    res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
};

const sendSSEError = (res, message) => {
    sendSSEEvent(res, 'error', { message });
    if (!res.writableEnded) {
        res.end();
    }
};

module.exports = { setSSEHeaders, sendSSEEvent, sendSSEError };
