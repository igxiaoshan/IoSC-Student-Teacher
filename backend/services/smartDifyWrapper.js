/**
 * 智能Dify服务包装器
 * 提供更好的错误处理、超时管理和回退机制
 */

const DifyService = require('./difyService');

class SmartDifyWrapper {
    constructor() {
        this.difyService = DifyService;
        this.timeoutLevels = {
            quick: 30000,      // 30秒 - 快速响应
            normal: 120000,    // 2分钟 - 正常响应
            extended: 300000,  // 5分钟 - 扩展响应
            maximum: 600000    // 10分钟 - 最大响应
        };
        this.retryStrategies = {
            immediate: { retries: 1, delay: 0 },
            quick: { retries: 2, delay: 1000 },
            patient: { retries: 3, delay: 5000 }
        };
    }

    async generatePracticalExerciseWithFallback(inputData, options = {}) {
        console.log('🚀 启动智能实训练习生成...');
        
        const {
            timeoutLevel = 'extended',
            retryStrategy = 'patient',
            enableFallback = true
        } = options;

        // 设置超时时间
        const originalTimeout = this.difyService.timeout;
        this.difyService.timeout = this.timeoutLevels[timeoutLevel];
        
        console.log(`使用超时级别: ${timeoutLevel} (${this.difyService.timeout}ms)`);
        console.log(`使用重试策略: ${retryStrategy}`);

        try {
            // 尝试生成实训练习
            const result = await this.attemptGeneration(inputData, retryStrategy);
            
            // 恢复原始超时设置
            this.difyService.timeout = originalTimeout;
            
            return result;
            
        } catch (error) {
            console.log(`智能生成失败: ${error.message}`);
            
            // 恢复原始超时设置
            this.difyService.timeout = originalTimeout;
            
            if (enableFallback) {
                console.log('启用回退机制，使用本地模拟数据...');
                return this.generateFallbackData(inputData);
            } else {
                throw error;
            }
        }
    }

    async attemptGeneration(inputData, retryStrategy) {
        const strategy = this.retryStrategies[retryStrategy];
        let lastError;

        for (let attempt = 1; attempt <= strategy.retries; attempt++) {
            try {
                console.log(`尝试第 ${attempt}/${strategy.retries} 次生成...`);
                
                const result = await this.difyService.generatePracticalExercise(inputData);
                
                if (result.success) {
                    console.log(`✅ 第 ${attempt} 次尝试成功`);
                    return result;
                } else {
                    throw new Error('生成结果不成功');
                }
                
            } catch (error) {
                lastError = error;
                console.log(`第 ${attempt} 次尝试失败: ${error.message}`);
                
                // 分析错误并决定是否继续重试
                const shouldRetry = this.shouldRetry(error, attempt, strategy.retries);
                
                if (shouldRetry && attempt < strategy.retries) {
                    const delay = strategy.delay * attempt;
                    console.log(`等待 ${delay}ms 后重试...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    break;
                }
            }
        }

        throw lastError;
    }

    shouldRetry(error, attempt, maxRetries) {
        // 分析错误类型决定是否重试
        if (error.message.includes('timeout')) {
            // 超时错误：重试，但延长等待时间
            return attempt < maxRetries;
        } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
            // 连接错误：不重试
            return false;
        } else if (error.message.includes('401') || error.message.includes('403')) {
            // 认证错误：不重试
            return false;
        } else if (error.message.includes('429')) {
            // 频率限制：重试
            return attempt < maxRetries;
        } else {
            // 其他错误：重试
            return attempt < maxRetries;
        }
    }

    generateFallbackData(inputData) {
        console.log('生成高质量的本地模拟数据...');
        
        // 使用DifyService的模拟数据生成方法
        const mockResponse = this.difyService.generateMockPracticalExerciseResponse(inputData);
        
        // 增强模拟数据的质量
        if (mockResponse.data && mockResponse.data.questions) {
            mockResponse.data.questions = mockResponse.data.questions.map((question, index) => ({
                ...question,
                questionText: this.enhanceQuestionText(question.questionText, inputData),
                requirements: this.enhanceRequirements(question.requirements, inputData),
                codeTemplate: this.enhanceCodeTemplate(question.codeTemplate, inputData)
            }));
        }
        
        // 标记为智能回退数据
        mockResponse.source = 'smart_fallback';
        mockResponse.fallbackReason = 'Dify服务超时，使用智能本地生成';
        
        console.log('✅ 智能回退数据生成完成');
        return mockResponse;
    }

    enhanceQuestionText(originalText, inputData) {
        const { subject_name, difficulty, exercise_type } = inputData;
        
        // 根据输入参数增强题目描述
        if (originalText && originalText.length > 10) {
            return originalText;
        }
        
        const templates = {
            '实操题': `请完成一个${subject_name}的${difficulty}级别实操练习。要求：1) 理解基本概念；2) 完成实际操作；3) 验证结果正确性。`,
            '编程题': `编写一个${subject_name}程序，难度为${difficulty}。要求包含完整的代码实现、测试用例和注释说明。`,
            '案例分析': `分析一个${subject_name}相关的实际案例，难度为${difficulty}。需要从理论和实践两个角度进行深入分析。`
        };
        
        return templates[inputData.question_types?.[0]] || templates['实操题'];
    }

    enhanceRequirements(originalRequirements, inputData) {
        if (originalRequirements && originalRequirements.length > 0) {
            return originalRequirements;
        }
        
        // 生成基础的实训要求
        return [
            {
                step: 1,
                description: `准备${inputData.subject_name}开发环境`,
                expectedOutput: '环境配置完成，能够正常运行代码'
            },
            {
                step: 2,
                description: '理解题目要求并设计解决方案',
                expectedOutput: '清晰的解决思路和实现步骤'
            },
            {
                step: 3,
                description: '编写并测试代码实现',
                expectedOutput: '功能正确的代码和测试结果'
            }
        ];
    }

    enhanceCodeTemplate(originalTemplate, inputData) {
        if (originalTemplate && originalTemplate.template && originalTemplate.template.length > 10) {
            return originalTemplate;
        }
        
        const { subject_name } = inputData;
        
        const templates = {
            'Python': `# ${subject_name} 实训练习代码模板
# 请在此处编写您的代码

def main():
    """
    主函数 - 请实现具体功能
    """
    print("开始${subject_name}实训练习")
    
    # TODO: 在此处添加您的代码
    
    print("练习完成")

if __name__ == "__main__":
    main()`,
            
            'JavaScript': `// ${subject_name} 实训练习代码模板
// 请在此处编写您的代码

function main() {
    console.log("开始${subject_name}实训练习");
    
    // TODO: 在此处添加您的代码
    
    console.log("练习完成");
}

main();`,
            
            'Java': `// ${subject_name} 实训练习代码模板
public class PracticalExercise {
    public static void main(String[] args) {
        System.out.println("开始${subject_name}实训练习");
        
        // TODO: 在此处添加您的代码
        
        System.out.println("练习完成");
    }
}`
        };
        
        return {
            language: this.detectLanguage(subject_name),
            template: templates[this.detectLanguage(subject_name)] || templates['Python'],
            testCases: []
        };
    }

    detectLanguage(subjectName) {
        const languageMap = {
            'python': 'Python',
            'javascript': 'JavaScript',
            'js': 'JavaScript',
            'java': 'Java',
            'c++': 'C++',
            'c#': 'C#'
        };
        
        const lowerSubject = subjectName.toLowerCase();
        for (const [key, value] of Object.entries(languageMap)) {
            if (lowerSubject.includes(key)) {
                return value;
            }
        }
        
        return 'Python'; // 默认使用Python
    }

    // 获取服务状态
    async getServiceStatus() {
        try {
            const isHealthy = await this.difyService.checkHealth();
            return {
                healthy: isHealthy,
                service: 'dify',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                healthy: false,
                service: 'dify',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

// 导出单例
module.exports = new SmartDifyWrapper();
