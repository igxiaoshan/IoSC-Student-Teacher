/**
 * Multi-Model Workflow Service
 * 多模型协作工作流自动化服务
 *
 * 使用方式:
 * const workflow = require('./multiModelWorkflow');
 *
 * // 代码审查
 * await workflow.codeReview(filePath, issue);
 *
 * // 功能开发
 * await workflow.developFeature(description);
 *
 * // 问题调试
 * await workflow.debug(issue, errorLog);
 */

const { spawn } = require('child_process');
const path = require('path');

class MultiModelWorkflow {
    constructor() {
        this.geminiFlash = 'D:/core/app/dev/nodejs/gemini-flash.bat';
        this.projectRoot = path.resolve(__dirname, '../../');
    }

    /**
     * 执行 Gemini CLI 命令
     */
    async geminiExec(prompt, options = {}) {
        return new Promise((resolve, reject) => {
            const args = ['-p', prompt, '-o', options.format || 'text'];

            if (options.model) {
                args.unshift('-m', options.model);
            }

            const proc = spawn('cmd', ['/c', this.geminiFlash, ...args], {
                shell: true,
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let stdout = '';
            let stderr = '';

            proc.stdout.on('data', (data) => { stdout += data.toString(); });
            proc.stderr.on('data', (data) => { stderr += data.toString(); });

            proc.on('close', (code) => {
                if (code === 0) {
                    resolve(stdout);
                } else {
                    reject(new Error(stderr || `Exit code: ${code}`));
                }
            });

            proc.on('error', reject);
        });
    }

    /**
     * 代码审查工作流
     * 1. Ace-Tool 检索相关代码（通过 MCP）
     * 2. Gemini 分析并生成审查意见
     */
    async codeReview(context, issue = '') {
        const prompt = `你是代码审查专家。请审查以下代码问题：

${issue ? `问题描述: ${issue}\n` : ''}
上下文信息:
${context}

请提供:
1. 问题分析
2. 潜在风险
3. 改进建议
4. 示例代码（如果适用）`;

        const result = await this.geminiExec(prompt, { format: 'text' });
        return result;
    }

    /**
     * 功能开发工作流
     * 1. 理解需求和上下文
     * 2. 生成实现方案
     * 3. 提供代码示例
     */
    async developFeature(requirement, context = '') {
        const prompt = `你是 Node.js/Express 后端开发专家。请根据以下需求生成实现方案：

需求描述:
${requirement}

${context ? `项目上下文:\n${context}\n` : ''}
项目技术栈: Node.js, Express, MongoDB (Mongoose)

请提供:
1. 实现思路
2. 关键代码文件
3. API 设计建议
4. 示例代码`;

        const result = await this.geminiExec(prompt, { format: 'text' });
        return result;
    }

    /**
     * 问题调试工作流
     * 1. 理解错误信息
     * 2. 搜索可能原因
     * 3. 提供解决方案
     */
    async debug(issue, errorLog = '') {
        const prompt = `你是调试专家。请分析并解决以下问题：

问题描述:
${issue}

${errorLog ? `错误日志:\n\`\`\`\n${errorLog}\n\`\`\`\n` : ''}

请提供:
1. 可能原因分析
2. 排查步骤
3. 解决方案
4. 预防措施`;

        const result = await this.geminiExec(prompt, { format: 'text' });
        return result;
    }

    /**
     * API 设计工作流
     */
    async designAPI(resource, operations = []) {
        const prompt = `你是 API 设计专家。请为以下资源设计 RESTful API：

资源: ${resource}
操作: ${operations.join(', ') || 'CRUD'}

请提供:
1. 端点设计
2. 请求/响应格式
3. 状态码定义
4. 错误处理策略`;

        const result = await this.geminiExec(prompt, { format: 'text' });
        return result;
    }

    /**
     * 数据库设计工作流
     */
    async designSchema(entity, fields = []) {
        const prompt = `你是 MongoDB/Mongoose 数据建模专家。请设计以下实体的 Schema：

实体: ${entity}
字段: ${fields.join(', ') || '自行推断'}

请提供:
1. Mongoose Schema 定义
2. 索引设计
3. 验证规则
4. 关联关系`;

        const result = await this.geminiExec(prompt, { format: 'text' });
        return result;
    }

    /**
     * 测试用例生成
     */
    async generateTests(codePath, testType = 'unit') {
        const prompt = `你是测试工程师。请为以下代码生成测试用例：

代码路径: ${codePath}
测试类型: ${testType}

请使用 Jest 框架生成:
1. 测试用例覆盖
2. Mock 策略
3. 边界条件
4. 预期结果`;

        const result = await this.geminiExec(prompt, { format: 'text' });
        return result;
    }
}

module.exports = new MultiModelWorkflow();
