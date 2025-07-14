import { useTranslation as useI18nTranslation } from 'react-i18next';

// 自定义翻译Hook，提供更便捷的使用方式
export const useTranslation = (namespace = 'common') => {
  const { t, i18n } = useI18nTranslation();

  // 带命名空间的翻译函数
  const translate = (key, options = {}) => {
    // 如果key包含命名空间，直接使用
    if (key.includes('.')) {
      return t(key, options);
    }
    // 否则添加默认命名空间
    return t(`${namespace}.${key}`, options);
  };

  // 常用翻译函数
  const tCommon = (key, options = {}) => t(`common.${key}`, options);
  const tAuth = (key, options = {}) => t(`auth.${key}`, options);
  const tNav = (key, options = {}) => t(`navigation.${key}`, options);
  const tDashboard = (key, options = {}) => t(`dashboard.${key}`, options);
  const tAdmin = (key, options = {}) => t(`admin.${key}`, options);
  const tStudent = (key, options = {}) => t(`student.${key}`, options);
  const tTeacher = (key, options = {}) => t(`teacher.${key}`, options);
  const tClass = (key, options = {}) => t(`class.${key}`, options);
  const tSubject = (key, options = {}) => t(`subject.${key}`, options);

  // 语言切换函数
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  // 获取当前语言
  const currentLanguage = i18n.language;

  // 判断是否为中文
  const isChinese = currentLanguage.startsWith('zh');

  return {
    t: translate,
    tCommon,
    tAuth,
    tNav,
    tDashboard,
    tAdmin,
    tStudent,
    tTeacher,
    tClass,
    tSubject,
    changeLanguage,
    currentLanguage,
    isChinese,
    i18n
  };
};

export default useTranslation;
