/**
 * AI服务前端工具类
 * 封装与后端AI API的交互
 */

import axios from 'axios';

class AIService {
    constructor() {
        this.baseURL = process.env.REACT_APP_BASE_URL || 'http://localhost:5000';
        this.apiClient = axios.create({
            baseURL: `${this.baseURL}/api/ai`,
            timeout: 30000, // 30秒超时
            headers: {
                'Content-Type': 'application/json',
            }
        });

        // 请求拦截器
        this.apiClient.interceptors.request.use(
            (config) => {
                // 可以在这里添加认证token
                const token = localStorage.getItem('authToken');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // 响应拦截器
        this.apiClient.interceptors.response.use(
            (response) => {
                return response;
            },
            (error) => {
                // 统一错误处理
                if (error.response?.status === 429) {
                    throw new Error('AI服务调用过于频繁，请稍后再试');
                } else if (error.response?.status === 500) {
                    throw new Error('AI服务暂时不可用，请稍后再试');
                } else if (error.code === 'ECONNABORTED') {
                    throw new Error('AI服务响应超时，请稍后再试');
                }
                throw error;
            }
        );
    }

    // ==================== 学生侧AI功能 ====================

    /**
     * 学生学习问答
     * @param {string} question - 学生问题
     * @param {string} studentId - 学生ID
     * @param {string} subject - 学科
     */
    async studentAskQuestion(question, studentId, subject = '') {
        try {
            const response = await this.apiClient.post('/student/ask-question', {
                question,
                studentId,
                subject
            });
            
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            console.error('学生问答服务错误:', error);
            return {
                success: false,
                error: error.response?.data?.error || error.message || '服务请求失败'
            };
        }
    }

    /**
     * 生成练习题
     * @param {string} requirements - 练习要求
     * @param {string} studentId - 学生ID
     * @param {string} subject - 学科
     * @param {number} difficulty - 难度等级
     */
    async generateExercise(requirements, studentId, subject = '', difficulty = 3) {
        try {
            const response = await this.apiClient.post('/student/generate-exercise', {
                requirements,
                studentId,
                subject,
                difficulty
            });
            
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            console.error('练习生成服务错误:', error);
            return {
                success: false,
                error: error.response?.data?.error || error.message || '服务请求失败'
            };
        }
    }

    /**
     * 检查学生答案
     * @param {string} question - 题目
     * @param {string} studentAnswer - 学生答案
     * @param {string} studentId - 学生ID
     * @param {string} correctAnswer - 正确答案（可选）
     * @param {string} subject - 学科
     */
    async checkStudentAnswer(question, studentAnswer, studentId, correctAnswer = '', subject = '') {
        try {
            const response = await this.apiClient.post('/student/check-answer', {
                question,
                studentAnswer,
                correctAnswer,
                studentId,
                subject
            });
            
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            console.error('答案检查服务错误:', error);
            return {
                success: false,
                error: error.response?.data?.error || error.message || '服务请求失败'
            };
        }
    }

    // ==================== 教师侧AI功能 ====================

    /**
     * 智能备课生成
     * @param {string} courseOutline - 课程大纲
     * @param {string} teacherId - 教师ID
     * @param {string} subject - 学科
     * @param {string} title - 备课标题
     */
    async generateLessonPlan(courseOutline, teacherId, subject = '', title = '') {
        try {
            const response = await this.apiClient.post('/teacher/generate-lesson-plan', {
                courseOutline,
                teacherId,
                subject,
                title
            });
            
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            console.error('备课生成服务错误:', error);
            return {
                success: false,
                error: error.response?.data?.error || error.message || '服务请求失败'
            };
        }
    }

    /**
     * 生成考核内容
     * @param {string} teachingContent - 教学内容
     * @param {string} teacherId - 教师ID
     * @param {string} examType - 考核类型
     * @param {string} subject - 学科
     * @param {string} title - 考核标题
     */
    async generateExam(teachingContent, teacherId, examType = 'mixed', subject = '', title = '') {
        try {
            const response = await this.apiClient.post('/teacher/generate-exam', {
                teachingContent,
                teacherId,
                examType,
                subject,
                title
            });
            
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            console.error('考核生成服务错误:', error);
            return {
                success: false,
                error: error.response?.data?.error || error.message || '服务请求失败'
            };
        }
    }

    /**
     * 分析学生表现
     * @param {Object} studentData - 学生数据
     * @param {string} teacherId - 教师ID
     */
    async analyzeStudentPerformance(studentData, teacherId) {
        try {
            const response = await this.apiClient.post('/teacher/analyze-performance', {
                studentData,
                teacherId
            });
            
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            console.error('学情分析服务错误:', error);
            return {
                success: false,
                error: error.response?.data?.error || error.message || '服务请求失败'
            };
        }
    }

    // ==================== 学习记录功能 ====================

    /**
     * 获取学生学习历史
     * @param {string} studentId - 学生ID
     * @param {Object} filters - 过滤条件
     */
    async getStudentLearningHistory(studentId, filters = {}) {
        try {
            const params = new URLSearchParams({
                studentId,
                ...filters
            });

            const response = await axios.get(
                `${this.baseURL}/api/student/learning-history?${params}`,
                { timeout: 10000 }
            );

            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            console.error('获取学习历史失败:', error);
            return {
                success: false,
                error: error.response?.data?.error || error.message || '获取学习历史失败'
            };
        }
    }

    // ==================== 资源管理功能 ====================

    /**
     * 获取教师资源列表
     * @param {string} teacherId - 教师ID
     * @param {Object} filters - 过滤条件
     */
    async getTeacherResources(teacherId, filters = {}) {
        try {
            const params = new URLSearchParams({
                teacherId,
                ...filters
            });

            const response = await axios.get(
                `${this.baseURL}/api/ai/teacher/resources?${params}`,
                { timeout: 10000 }
            );

            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            console.error('获取教师资源失败:', error);
            return {
                success: false,
                error: error.response?.data?.error || error.message || '获取教师资源失败'
            };
        }
    }

    // ==================== 管理员统计功能 ====================

    /**
     * 获取系统使用统计
     * @param {number} timeRange - 时间范围（天数）
     */
    async getUsageStats(timeRange = 30) {
        try {
            const response = await axios.get(
                `${this.baseURL}/api/admin/usage-stats?timeRange=${timeRange}`,
                { timeout: 10000 }
            );

            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            console.error('获取使用统计失败:', error);
            return {
                success: false,
                error: error.response?.data?.error || error.message || '获取使用统计失败'
            };
        }
    }

    // ==================== 通用功能 ====================

    /**
     * 检查AI服务健康状态
     */
    async checkHealth() {
        try {
            const response = await this.apiClient.get('/health');
            return response.data;
        } catch (error) {
            console.error('AI健康检查失败:', error);
            return {
                status: 'unhealthy',
                error: error.message
            };
        }
    }

    /**
     * 格式化AI回复内容
     * @param {string} content - AI回复内容
     */
    formatAIResponse(content) {
        if (!content) return '';
        
        // 处理换行符
        let formatted = content.replace(/\n/g, '<br>');
        
        // 处理列表项
        formatted = formatted.replace(/^\d+\.\s/gm, '<li>');
        formatted = formatted.replace(/^-\s/gm, '<li>');
        
        // 处理标题
        formatted = formatted.replace(/^#{1,3}\s(.+)$/gm, '<h3>$1</h3>');
        
        // 处理代码块
        formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
        
        // 处理行内代码
        formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        return formatted;
    }

    /**
     * 解析练习题内容
     * @param {string} exerciseContent - AI生成的练习题内容
     */
    parseExerciseContent(exerciseContent) {
        const exercises = [];
        
        try {
            // 简单的解析逻辑，可以根据实际AI回复格式调整
            const sections = exerciseContent.split(/题目\s*\d+[：:]/);
            
            sections.forEach((section, index) => {
                if (index === 0) return; // 跳过第一个空段
                
                const lines = section.trim().split('\n');
                const exercise = {
                    id: index,
                    question: '',
                    options: [],
                    answer: '',
                    explanation: ''
                };
                
                let currentSection = 'question';
                
                lines.forEach(line => {
                    line = line.trim();
                    if (!line) return;
                    
                    if (line.includes('选项') || line.match(/^[A-F][：:]/)) {
                        currentSection = 'options';
                    } else if (line.includes('答案') || line.includes('正确答案')) {
                        currentSection = 'answer';
                    } else if (line.includes('解析') || line.includes('解释')) {
                        currentSection = 'explanation';
                    }
                    
                    switch (currentSection) {
                        case 'question':
                            exercise.question += line + ' ';
                            break;
                        case 'options':
                            if (line.match(/^[A-F][：:]/)) {
                                exercise.options.push(line);
                            }
                            break;
                        case 'answer':
                            if (!line.includes('答案')) {
                                exercise.answer += line + ' ';
                            }
                            break;
                        case 'explanation':
                            if (!line.includes('解析')) {
                                exercise.explanation += line + ' ';
                            }
                            break;
                    }
                });
                
                // 清理空格
                exercise.question = exercise.question.trim();
                exercise.answer = exercise.answer.trim();
                exercise.explanation = exercise.explanation.trim();
                
                if (exercise.question) {
                    exercises.push(exercise);
                }
            });
        } catch (error) {
            console.error('解析练习题内容失败:', error);
        }
        
        return exercises;
    }

    /**
     * 获取错误提示信息
     * @param {string} errorCode - 错误代码
     */
    getErrorMessage(errorCode) {
        const errorMessages = {
            'RATE_LIMIT': 'AI服务调用过于频繁，请稍后再试',
            'SERVICE_UNAVAILABLE': 'AI服务暂时不可用，请稍后再试',
            'TIMEOUT': 'AI服务响应超时，请稍后再试',
            'INVALID_INPUT': '输入内容不符合要求，请检查后重试',
            'AUTHENTICATION_FAILED': '身份验证失败，请重新登录',
            'PERMISSION_DENIED': '没有权限访问此功能'
        };
        
        return errorMessages[errorCode] || '未知错误，请联系管理员';
    }
}

// 创建单例实例
const aiService = new AIService();

export default aiService;
