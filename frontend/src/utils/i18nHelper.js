// 国际化辅助工具
import { useTranslation } from '../hooks/useTranslation';

// 常用英文到中文的映射
export const commonTranslations = {
  // 基础操作
  'Add': '添加',
  'Edit': '编辑',
  'Delete': '删除',
  'Save': '保存',
  'Cancel': '取消',
  'Submit': '提交',
  'Search': '搜索',
  'Filter': '筛选',
  'Reset': '重置',
  'Refresh': '刷新',
  'Export': '导出',
  'Import': '导入',
  'Upload': '上传',
  'Download': '下载',
  'View': '查看',
  'Details': '详情',
  'Back': '返回',
  'Next': '下一步',
  'Previous': '上一步',
  'Close': '关闭',
  'Confirm': '确认',
  'Yes': '是',
  'No': '否',
  'OK': '确定',
  
  // 状态
  'Active': '活跃',
  'Inactive': '非活跃',
  'Pending': '待处理',
  'Approved': '已批准',
  'Rejected': '已拒绝',
  'Completed': '已完成',
  'In Progress': '进行中',
  'Draft': '草稿',
  'Published': '已发布',
  'Archived': '已归档',
  
  // 表单字段
  'Name': '姓名',
  'Email': '邮箱',
  'Password': '密码',
  'Phone': '电话',
  'Address': '地址',
  'Date': '日期',
  'Time': '时间',
  'Description': '描述',
  'Title': '标题',
  'Content': '内容',
  'Category': '分类',
  'Type': '类型',
  'Status': '状态',
  'Priority': '优先级',
  'Tags': '标签',
  
  // 学校相关
  'Student': '学生',
  'Teacher': '教师',
  'Admin': '管理员',
  'Class': '班级',
  'Subject': '科目',
  'Grade': '年级',
  'Attendance': '考勤',
  'Schedule': '课程表',
  'Exam': '考试',
  'Assignment': '作业',
  'Homework': '家庭作业',
  'Quiz': '测验',
  'Test': '测试',
  'Score': '分数',
  'Mark': '成绩',
  'Result': '结果',
  'Report': '报告',
  'Certificate': '证书',
  'Diploma': '文凭',
  
  // 时间相关
  'Today': '今天',
  'Yesterday': '昨天',
  'Tomorrow': '明天',
  'This Week': '本周',
  'Last Week': '上周',
  'Next Week': '下周',
  'This Month': '本月',
  'Last Month': '上月',
  'Next Month': '下月',
  'This Year': '今年',
  'Last Year': '去年',
  'Next Year': '明年',
  
  // 数量相关
  'Total': '总计',
  'Count': '数量',
  'Number': '编号',
  'Amount': '金额',
  'Quantity': '数量',
  'Sum': '总和',
  'Average': '平均',
  'Maximum': '最大值',
  'Minimum': '最小值',
  
  // 消息提示
  'Success': '成功',
  'Error': '错误',
  'Warning': '警告',
  'Info': '信息',
  'Loading': '加载中',
  'Please wait': '请稍候',
  'No data': '暂无数据',
  'No results': '无结果',
  'Not found': '未找到',
  'Access denied': '访问被拒绝',
  'Permission denied': '权限不足',
  'Invalid input': '输入无效',
  'Required field': '必填字段',
  'Optional field': '可选字段',
  
  // 导航相关
  'Dashboard': '仪表盘',
  'Home': '首页',
  'Profile': '个人资料',
  'Settings': '设置',
  'Help': '帮助',
  'About': '关于',
  'Contact': '联系我们',
  'FAQ': '常见问题',
  'Terms': '条款',
  'Privacy': '隐私政策',
  'Logout': '退出登录',
  'Login': '登录',
  'Register': '注册',
  'Sign In': '登录',
  'Sign Up': '注册',
  'Sign Out': '退出',
  
  // 表格相关
  'Actions': '操作',
  'Select': '选择',
  'Select All': '全选',
  'Deselect All': '取消全选',
  'Sort': '排序',
  'Sort by': '排序方式',
  'Order': '顺序',
  'Ascending': '升序',
  'Descending': '降序',
  'Page': '页',
  'Per Page': '每页',
  'Show': '显示',
  'Hide': '隐藏',
  'Expand': '展开',
  'Collapse': '收起',
  
  // 文件相关
  'File': '文件',
  'Folder': '文件夹',
  'Document': '文档',
  'Image': '图片',
  'Video': '视频',
  'Audio': '音频',
  'Size': '大小',
  'Format': '格式',
  'Extension': '扩展名',
  'Created': '创建时间',
  'Modified': '修改时间',
  'Accessed': '访问时间'
};

// 自动翻译函数
export const autoTranslate = (text) => {
  if (!text || typeof text !== 'string') return text;
  
  // 直接匹配
  if (commonTranslations[text]) {
    return commonTranslations[text];
  }
  
  // 忽略大小写匹配
  const lowerText = text.toLowerCase();
  for (const [key, value] of Object.entries(commonTranslations)) {
    if (key.toLowerCase() === lowerText) {
      return value;
    }
  }
  
  // 部分匹配（包含关键词）
  for (const [key, value] of Object.entries(commonTranslations)) {
    if (text.includes(key) || key.includes(text)) {
      return value;
    }
  }
  
  // 如果没有找到翻译，返回原文
  return text;
};

// 翻译组件的高阶组件
export const withTranslation = (WrappedComponent) => {
  return function TranslatedComponent(props) {
    const translation = useTranslation();
    return <WrappedComponent {...props} {...translation} />;
  };
};

// 批量替换文本的工具函数
export const batchTranslate = (obj, translateFn) => {
  if (typeof obj === 'string') {
    return translateFn(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => batchTranslate(item, translateFn));
  }
  
  if (obj && typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = batchTranslate(value, translateFn);
    }
    return result;
  }
  
  return obj;
};
