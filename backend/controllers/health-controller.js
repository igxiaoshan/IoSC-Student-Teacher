const mongoose = require('mongoose');
const os = require('os');

/**
 * 健康检查控制器
 * 提供 /health, /ready, /metrics 端点用于运维监控
 */

/**
 * 基础健康检查
 * GET /health
 */
const healthCheck = async (req, res) => {
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0'
    };

    res.status(200).json(health);
};

/**
 * 详细健康检查（包含依赖服务状态）
 * GET /health/detail
 */
const detailedHealthCheck = async (req, res) => {
    const checks = {
        server: {
            status: 'ok',
            uptime: process.uptime(),
            memory: {
                used: process.memoryUsage().heapUsed,
                total: process.memoryUsage().heapTotal,
                usage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)
            },
            cpu: process.cpuUsage()
        },
        database: {
            status: 'unknown',
            connection: mongoose.connection.readyState,
            host: mongoose.connection.host || 'not connected'
        },
        system: {
            platform: os.platform(),
            cpus: os.cpus().length,
            freeMemory: os.freemem(),
            totalMemory: os.totalmem()
        }
    };

    // 检查数据库连接状态
    const dbState = mongoose.connection.readyState;
    checks.database.status = dbState === 1 ? 'ok' : 'error';
    checks.database.readyStateText = ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState];

    const allHealthy = checks.server.status === 'ok' && checks.database.status === 'ok';
    const statusCode = allHealthy ? 200 : 503;

    res.status(statusCode).json({
        status: allHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        checks
    });
};

/**
 * 就绪检查（用于 Kubernetes/容器编排）
 * GET /ready
 */
const readinessCheck = async (req, res) => {
    const dbReady = mongoose.connection.readyState === 1;

    if (!dbReady) {
        return res.status(503).json({
            status: 'not_ready',
            reason: 'Database not connected',
            timestamp: new Date().toISOString()
        });
    }

    res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString()
    });
};

/**
 * 存活性检查（用于 Kubernetes liveness probe）
 * GET /live
 */
const livenessCheck = (req, res) => {
    res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString()
    });
};

/**
 * 性能指标（Prometheus 格式）
 * GET /metrics
 */
const metrics = (req, res) => {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const metricsData = {
        timestamp: new Date().toISOString(),
        process: {
            uptime_seconds: process.uptime(),
            memory_heap_used_bytes: memoryUsage.heapUsed,
            memory_heap_total_bytes: memoryUsage.heapTotal,
            memory_rss_bytes: memoryUsage.rss,
            memory_external_bytes: memoryUsage.external,
            cpu_user_microseconds: cpuUsage.user,
            cpu_system_microseconds: cpuUsage.system
        },
        system: {
            cpu_count: os.cpus().length,
            free_memory_bytes: os.freemem(),
            total_memory_bytes: os.totalmem(),
            load_average_1m: os.loadavg()[0],
            load_average_5m: os.loadavg()[1],
            load_average_15m: os.loadavg()[2]
        },
        database: {
            connection_state: mongoose.connection.readyState,
            connection_pool_size: mongoose.connection.poolSize || 0
        },
        requests: {
            // 如果有请求计数器，可以在这里添加
            total: 0,
            active: 0,
            errors: 0
        }
    };

    // Prometheus 文本格式输出
    if (req.query.format === 'prometheus') {
        const prometheusText = `# HELP process_uptime_seconds Process uptime in seconds
# TYPE process_uptime_seconds gauge
process_uptime_seconds ${process.uptime()}

# HELP process_memory_heap_used_bytes Heap memory used in bytes
# TYPE process_memory_heap_used_bytes gauge
process_memory_heap_used_bytes ${memoryUsage.heapUsed}

# HELP process_memory_heap_total_bytes Heap memory total in bytes
# TYPE process_memory_heap_total_bytes gauge
process_memory_heap_total_bytes ${memoryUsage.heapTotal}

# HELP system_free_memory_bytes System free memory in bytes
# TYPE system_free_memory_bytes gauge
system_free_memory_bytes ${os.freemem()}

# HELP system_load_average_1m System load average 1 minute
# TYPE system_load_average_1m gauge
system_load_average_1m ${os.loadavg()[0]}

# HELP database_connection_state Database connection state
# TYPE database_connection_state gauge
database_connection_state ${mongoose.connection.readyState}`;

        res.set('Content-Type', 'text/plain');
        res.send(prometheusText);
    } else {
        res.json(metricsData);
    }
};

module.exports = {
    healthCheck,
    detailedHealthCheck,
    readinessCheck,
    livenessCheck,
    metrics
};