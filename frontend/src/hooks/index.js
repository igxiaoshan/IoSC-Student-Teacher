/**
 * 常用自定义 React Hooks
 * 减少组件中的重复逻辑
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useDispatch } from 'react-redux';

// ============================================
// useApi - 统一 API 调用 Hook
// ============================================

/**
 * API 调用 Hook
 * @param {Function} apiFunc - API 调用函数
 * @param {Object} options - 配置选项
 */
export const useApi = (apiFunc, options = {}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const execute = useCallback(async (...args) => {
        setLoading(true);
        setError(null);

        try {
            const result = await apiFunc(...args);
            setData(result);
            options.onSuccess?.(result);
            return result;
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || '请求失败';
            setError(errorMessage);
            options.onError?.(err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [apiFunc, options]);

    const reset = useCallback(() => {
        setData(null);
        setError(null);
        setLoading(false);
    }, []);

    return { data, loading, error, execute, reset };
};

// ============================================
// useAsync - 异步操作 Hook
// ============================================

/**
 * 异步操作状态管理
 */
export const useAsync = (asyncFunction, immediate = false) => {
    const [status, setStatus] = useState('idle');
    const [value, setValue] = useState(null);
    const [error, setError] = useState(null);

    const execute = useCallback(async (...args) => {
        setStatus('pending');
        setValue(null);
        setError(null);

        try {
            const response = await asyncFunction(...args);
            setValue(response);
            setStatus('success');
            return response;
        } catch (err) {
            setError(err);
            setStatus('error');
            throw err;
        }
    }, [asyncFunction]);

    useEffect(() => {
        if (immediate) {
            execute();
        }
    }, [immediate, execute]);

    return { execute, status, value, error, isLoading: status === 'pending' };
};

// ============================================
// useDebounce - 防抖 Hook
// ============================================

/**
 * 防抖值
 * @param {*} value - 要防抖的值
 * @param {number} delay - 延迟时间（毫秒）
 */
export const useDebounce = (value, delay = 300) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

/**
 * 防抖函数
 * @param {Function} callback - 要防抖的函数
 * @param {number} delay - 延迟时间
 */
export const useDebouncedCallback = (callback, delay = 300) => {
    const timeoutRef = useRef();

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return useCallback((...args) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            callback(...args);
        }, delay);
    }, [callback, delay]);
};

// ============================================
// useThrottle - 节流 Hook
// ============================================

/**
 * 节流函数
 * @param {Function} callback - 要节流的函数
 * @param {number} delay - 间隔时间
 */
export const useThrottledCallback = (callback, delay = 300) => {
    const lastRunRef = useRef(0);

    return useCallback((...args) => {
        const now = Date.now();
        if (now - lastRunRef.current >= delay) {
            lastRunRef.current = now;
            callback(...args);
        }
    }, [callback, delay]);
};

// ============================================
// useLocalStorage - 本地存储 Hook
// ============================================

/**
 * 本地存储状态
 * @param {string} key - 存储键
 * @param {*} initialValue - 初始值
 */
export const useLocalStorage = (key, initialValue) => {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    const setValue = useCallback((value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    }, [key, storedValue]);

    const removeValue = useCallback(() => {
        try {
            window.localStorage.removeItem(key);
            setStoredValue(initialValue);
        } catch (error) {
            console.error(`Error removing localStorage key "${key}":`, error);
        }
    }, [key, initialValue]);

    return [storedValue, setValue, removeValue];
};

// ============================================
// useToggle - 切换状态 Hook
// ============================================

/**
 * 布尔值切换
 */
export const useToggle = (initialValue = false) => {
    const [value, setValue] = useState(initialValue);

    const toggle = useCallback(() => setValue(v => !v), []);
    const setTrue = useCallback(() => setValue(true), []);
    const setFalse = useCallback(() => setValue(false), []);

    return { value, toggle, setTrue, setFalse, setValue };
};

// ============================================
// usePrevious - 上一个值 Hook
// ============================================

/**
 * 获取上一个值
 */
export const usePrevious = (value) => {
    const ref = useRef();

    useEffect(() => {
        ref.current = value;
    }, [value]);

    return ref.current;
};

// ============================================
// useClickOutside - 点击外部 Hook
// ============================================

/**
 * 检测点击外部
 * @param {React.RefObject} ref - 元素引用
 * @param {Function} handler - 点击外部时的回调
 */
export const useClickOutside = (ref, handler) => {
    useEffect(() => {
        const listener = (event) => {
            if (!ref.current || ref.current.contains(event.target)) {
                return;
            }
            handler(event);
        };

        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);

        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, handler]);
};

// ============================================
// useMediaQuery - 媒体查询 Hook
// ============================================

/**
 * 响应式媒体查询
 * @param {string} query - 媒体查询字符串
 */
export const useMediaQuery = (query) => {
    const [matches, setMatches] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.matchMedia(query).matches;
        }
        return false;
    });

    useEffect(() => {
        const mediaQuery = window.matchMedia(query);
        const handler = (event) => setMatches(event.matches);

        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, [query]);

    return matches;
};

// 常用断点
export const useIsMobile = () => useMediaQuery('(max-width: 600px)');
export const useIsTablet = () => useMediaQuery('(max-width: 960px)');
export const useIsDesktop = () => useMediaQuery('(min-width: 961px)');

// ============================================
// useFetch - 数据获取 Hook（带缓存）
// ============================================

const cache = new Map();

/**
 * 数据获取 Hook
 * @param {string} url - 请求 URL
 * @param {Object} options - 配置选项
 */
export const useFetch = (url, options = {}) => {
    const {
        enabled = true,
        cacheKey,
        cacheTime = 5 * 60 * 1000, // 5 分钟
    } = options;

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const key = cacheKey || url;

    const fetchData = useCallback(async () => {
        if (!enabled) return;

        // 检查缓存
        const cached = cache.get(key);
        if (cached && Date.now() - cached.timestamp < cacheTime) {
            setData(cached.data);
            return cached.data;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();

            setData(result);
            cache.set(key, { data: result, timestamp: Date.now() });

            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [url, enabled, key, cacheTime]);

    useEffect(() => {
        if (enabled) {
            fetchData();
        }
    }, [fetchData, enabled]);

    const refetch = useCallback(() => {
        cache.delete(key);
        return fetchData();
    }, [key, fetchData]);

    return { data, loading, error, refetch };
};

// ============================================
// useForm - 表单状态管理 Hook
// ============================================

/**
 * 简易表单状态管理
 * @param {Object} initialValues - 初始值
 * @param {Function} onSubmit - 提交回调
 */
export const useForm = (initialValues, onSubmit) => {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        setValues(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    }, []);

    const handleBlur = useCallback((e) => {
        const { name } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
    }, []);

    const setFieldValue = useCallback((name, value) => {
        setValues(prev => ({ ...prev, [name]: value }));
    }, []);

    const setFieldError = useCallback((name, error) => {
        setErrors(prev => ({ ...prev, [name]: error }));
    }, []);

    const reset = useCallback(() => {
        setValues(initialValues);
        setErrors({});
        setTouched({});
        setIsSubmitting(false);
    }, [initialValues]);

    const handleSubmit = useCallback(async (e) => {
        e?.preventDefault();
        setIsSubmitting(true);

        try {
            await onSubmit(values);
        } catch (err) {
            console.error('Form submit error:', err);
        } finally {
            setIsSubmitting(false);
        }
    }, [values, onSubmit]);

    return {
        values,
        errors,
        touched,
        isSubmitting,
        handleChange,
        handleBlur,
        setFieldValue,
        setFieldError,
        setValues,
        setErrors,
        reset,
        handleSubmit,
    };
};

export default {
    useApi,
    useAsync,
    useDebounce,
    useDebouncedCallback,
    useThrottledCallback,
    useLocalStorage,
    useToggle,
    usePrevious,
    useClickOutside,
    useMediaQuery,
    useIsMobile,
    useIsTablet,
    useIsDesktop,
    useFetch,
    useForm,
};