const router = require('express').Router();
const {
    healthCheck,
    detailedHealthCheck,
    readinessCheck,
    livenessCheck,
    metrics
} = require('../controllers/health-controller');

/**
 * 运维监控路由
 * 用于健康检查、就绪检查和性能指标收集
 */

// 基础健康检查
router.get('/health', healthCheck);

// 详细健康检查（包含依赖服务）
router.get('/health/detail', detailedHealthCheck);

// 就绪检查（Kubernetes readiness probe）
router.get('/ready', readinessCheck);

// 存活检查（Kubernetes liveness probe）
router.get('/live', livenessCheck);

// 性能指标
router.get('/metrics', metrics);

module.exports = router;