const router = require('express').Router();
const multiModelWorkflow = require('../services/multiModelWorkflow');

/**
 * Multi-Model Workflow Routes
 * 多模型协作工作流路由
 */

/**
 * 代码审查
 * POST /api/workflow/code-review
 */
router.post('/code-review', async (req, res) => {
    try {
        const { context, issue } = req.body;

        if (!context) {
            return res.status(400).json({
                success: false,
                error: 'context is required'
            });
        }

        const result = await multiModelWorkflow.codeReview(context, issue);

        res.json({
            success: true,
            workflow: 'code-review',
            result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * 功能开发
 * POST /api/workflow/develop
 */
router.post('/develop', async (req, res) => {
    try {
        const { requirement, context } = req.body;

        if (!requirement) {
            return res.status(400).json({
                success: false,
                error: 'requirement is required'
            });
        }

        const result = await multiModelWorkflow.developFeature(requirement, context);

        res.json({
            success: true,
            workflow: 'develop',
            result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * 问题调试
 * POST /api/workflow/debug
 */
router.post('/debug', async (req, res) => {
    try {
        const { issue, errorLog } = req.body;

        if (!issue) {
            return res.status(400).json({
                success: false,
                error: 'issue is required'
            });
        }

        const result = await multiModelWorkflow.debug(issue, errorLog);

        res.json({
            success: true,
            workflow: 'debug',
            result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * API 设计
 * POST /api/workflow/design-api
 */
router.post('/design-api', async (req, res) => {
    try {
        const { resource, operations } = req.body;

        if (!resource) {
            return res.status(400).json({
                success: false,
                error: 'resource is required'
            });
        }

        const result = await multiModelWorkflow.designAPI(resource, operations);

        res.json({
            success: true,
            workflow: 'design-api',
            result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * 数据库 Schema 设计
 * POST /api/workflow/design-schema
 */
router.post('/design-schema', async (req, res) => {
    try {
        const { entity, fields } = req.body;

        if (!entity) {
            return res.status(400).json({
                success: false,
                error: 'entity is required'
            });
        }

        const result = await multiModelWorkflow.designSchema(entity, fields);

        res.json({
            success: true,
            workflow: 'design-schema',
            result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * 测试用例生成
 * POST /api/workflow/generate-tests
 */
router.post('/generate-tests', async (req, res) => {
    try {
        const { codePath, testType } = req.body;

        if (!codePath) {
            return res.status(400).json({
                success: false,
                error: 'codePath is required'
            });
        }

        const result = await multiModelWorkflow.generateTests(codePath, testType);

        res.json({
            success: true,
            workflow: 'generate-tests',
            result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * 工作流状态检查
 * GET /api/workflow/status
 */
router.get('/status', (req, res) => {
    res.json({
        success: true,
        workflows: [
            { name: 'code-review', description: '代码审查' },
            { name: 'develop', description: '功能开发' },
            { name: 'debug', description: '问题调试' },
            { name: 'design-api', description: 'API 设计' },
            { name: 'design-schema', description: '数据库 Schema 设计' },
            { name: 'generate-tests', description: '测试用例生成' }
        ]
    });
});

module.exports = router;
