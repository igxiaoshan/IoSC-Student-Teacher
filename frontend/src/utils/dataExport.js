/**
 * 数据导出工具函数
 */

/**
 * 将对象数组转换为CSV格式
 * @param {Array} data - 数据数组
 * @param {Array} headers - 表头数组
 * @returns {string} CSV字符串
 */
export const convertToCSV = (data, headers) => {
    if (!data || data.length === 0) return '';
    
    // 如果没有提供headers，使用第一个对象的键作为表头
    if (!headers) {
        headers = Object.keys(data[0]);
    }
    
    // 创建CSV表头
    const csvHeaders = headers.join(',');
    
    // 创建CSV数据行
    const csvRows = data.map(row => {
        return headers.map(header => {
            const value = row[header];
            // 处理包含逗号、引号或换行符的值
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value || '';
        }).join(',');
    });
    
    return [csvHeaders, ...csvRows].join('\n');
};

/**
 * 下载CSV文件
 * @param {string} csvContent - CSV内容
 * @param {string} filename - 文件名
 */
export const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};

/**
 * 导出仪表板数据为多个CSV文件的ZIP包
 * @param {Object} dashboardData - 仪表板数据
 * @param {string} timeRange - 时间范围
 */
export const exportDashboardData = (dashboardData, timeRange) => {
    if (!dashboardData) return;
    
    const timestamp = new Date().toISOString().split('T')[0];
    
    // 导出用户行为数据
    if (dashboardData.userBehavior?.dailyActiveUsers) {
        const userActivityData = dashboardData.userBehavior.dailyActiveUsers.map(item => ({
            日期: item._id?.date || item._id,
            活跃用户数: item.count || item.activeUsers || 0
        }));
        
        const csvContent = convertToCSV(userActivityData);
        downloadCSV(csvContent, `用户活跃度-${timeRange}-${timestamp}.csv`);
    }
    
    // 导出业务指标数据
    if (dashboardData.business) {
        const businessData = [{
            考试完成率: `${dashboardData.business.examCompletionRate?.toFixed(2) || 0}%`,
            平均考试分数: dashboardData.business.averageExamScore?.toFixed(2) || 0,
            考试通过率: `${dashboardData.business.examPassRate?.toFixed(2) || 0}%`,
            总考试数: dashboardData.business.totalExams || 0,
            平均教师工作负载: dashboardData.business.teacherWorkload?.average?.toFixed(2) || 0,
            教师总数: dashboardData.business.teacherWorkload?.totalTeachers || 0
        }];
        
        const csvContent = convertToCSV(businessData);
        downloadCSV(csvContent, `业务指标-${timeRange}-${timestamp}.csv`);
    }
    
    // 导出科目受欢迎程度数据
    if (dashboardData.business?.subjectPopularity) {
        const subjectData = dashboardData.business.subjectPopularity.map(item => ({
            科目名称: item.subName,
            学生数量: item.studentCount,
            课程数量: item.sessions || 0
        }));
        
        const csvContent = convertToCSV(subjectData);
        downloadCSV(csvContent, `科目统计-${timeRange}-${timestamp}.csv`);
    }
    
    // 导出系统性能数据
    if (dashboardData.system) {
        const systemData = [{
            运行时间_秒: Math.round(dashboardData.system.uptime || 0),
            内存使用率: `${dashboardData.system.memory?.usagePercentage?.toFixed(2) || 0}%`,
            CPU使用率: `${dashboardData.system.cpu?.usage?.toFixed(2) || 0}%`,
            响应时间_毫秒: dashboardData.system.performance?.responseTime || 0,
            错误率: `${dashboardData.system.performance?.errorRate || 0}%`,
            系统平台: dashboardData.system.system?.platform || 'Unknown',
            Node版本: dashboardData.system.system?.nodeVersion || 'Unknown'
        }];
        
        const csvContent = convertToCSV(systemData);
        downloadCSV(csvContent, `系统性能-${timeRange}-${timestamp}.csv`);
    }
};

/**
 * 导出JSON格式的完整数据
 * @param {Object} dashboardData - 仪表板数据
 * @param {string} timeRange - 时间范围
 */
export const exportDashboardJSON = (dashboardData, timeRange) => {
    if (!dashboardData) return;
    
    const timestamp = new Date().toISOString().split('T')[0];
    const exportData = {
        exportInfo: {
            exportTime: new Date().toISOString(),
            timeRange: timeRange,
            dataVersion: '1.0'
        },
        data: dashboardData
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `仪表板数据-${timeRange}-${timestamp}.json`;
    link.click();
    URL.revokeObjectURL(url);
};

/**
 * 格式化数字为千分位格式
 * @param {number} num - 数字
 * @returns {string} 格式化后的字符串
 */
export const formatNumber = (num) => {
    if (typeof num !== 'number') return '0';
    return num.toLocaleString();
};

/**
 * 格式化百分比
 * @param {number} value - 数值
 * @param {number} decimals - 小数位数
 * @returns {string} 格式化后的百分比字符串
 */
export const formatPercentage = (value, decimals = 1) => {
    if (typeof value !== 'number') return '0%';
    return `${value.toFixed(decimals)}%`;
};

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的文件大小
 */
export const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

/**
 * 格式化时间持续时间
 * @param {number} seconds - 秒数
 * @returns {string} 格式化后的时间字符串
 */
export const formatDuration = (seconds) => {
    if (!seconds) return '0秒';
    
    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (days > 0) {
        return `${days}天 ${hours}小时`;
    } else if (hours > 0) {
        return `${hours}小时 ${minutes}分钟`;
    } else if (minutes > 0) {
        return `${minutes}分钟 ${secs}秒`;
    } else {
        return `${secs}秒`;
    }
};
