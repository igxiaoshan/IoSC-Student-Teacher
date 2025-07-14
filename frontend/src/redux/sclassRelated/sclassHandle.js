import axios from 'axios';
import {
    getRequest,
    getSuccess,
    getFailed,
    getError,
    getStudentsSuccess,
    getTeachersSuccess,
    detailsSuccess,
    getFailedTwo,
    getSubjectsSuccess,
    getSubDetailsSuccess,
    getSubDetailsRequest,
    getStatsRequest,
    getStatsSuccess,
    getBatchRequest,
    getBatchSuccess,
    setFilters,
    clearError
} from './sclassSlice';
import { handleReduxError } from '../../utils/errorHandler';

export const getAllSclasses = (id, address, filters = {}) => async (dispatch) => {
    dispatch(getRequest());

    try {
        // 构建查询参数
        const queryParams = new URLSearchParams();
        if (filters.page) queryParams.append('page', filters.page);
        if (filters.limit) queryParams.append('limit', filters.limit);
        if (filters.search) queryParams.append('search', filters.search);
        if (filters.grade) queryParams.append('grade', filters.grade);
        if (filters.status) queryParams.append('status', filters.status);
        if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
        if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);

        const url = `${process.env.REACT_APP_BASE_URL}/${address}List/${id}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        const result = await axios.get(url);

        if (result.data.success === false || result.data.message) {
            dispatch(getFailedTwo(result.data.message || '获取班级列表失败'));
        } else {
            dispatch(getSuccess(result.data));
        }
    } catch (error) {
        console.error('获取班级列表错误:', error);
        dispatch(getError(handleReduxError(error)));
    }
}

export const getClassStudents = (id) => async (dispatch) => {
    dispatch(getRequest());

    try {
        const result = await axios.get(`${process.env.REACT_APP_BASE_URL}/Sclass/Students/${id}`);
        if (result.data.message) {
            dispatch(getFailedTwo(result.data.message));
        } else {
            dispatch(getStudentsSuccess(result.data));
        }
    } catch (error) {
        console.error('获取班级学生错误:', error);
        dispatch(getError(error.response?.data?.message || error.message || '网络错误'));
    }
}

export const getClassTeachers = (id) => async (dispatch) => {
    dispatch(getRequest());

    try {
        const result = await axios.get(`${process.env.REACT_APP_BASE_URL}/Sclass/Teachers/${id}`);
        if (result.data.success === false || result.data.message) {
            dispatch(getFailedTwo(result.data.message || '获取班级教师失败'));
        } else {
            dispatch(getTeachersSuccess(result.data));
        }
    } catch (error) {
        console.error('获取班级教师错误:', error);
        dispatch(getError(handleReduxError(error)));
    }
}

export const getClassDetails = (id, address) => async (dispatch) => {
    dispatch(getRequest());

    try {
        const result = await axios.get(`${process.env.REACT_APP_BASE_URL}/${address}/${id}`);
        if (result.data) {
            dispatch(detailsSuccess(result.data));
        }
    } catch (error) {
        console.error('获取班级详情错误:', error);
        dispatch(getError(error.response?.data?.message || error.message || '网络错误'));
    }
}

export const getSubjectList = (id, address) => async (dispatch) => {
    dispatch(getRequest());

    try {
        const result = await axios.get(`${process.env.REACT_APP_BASE_URL}/${address}/${id}`);
        if (result.data.message) {
            dispatch(getFailed(result.data.message));
        } else {
            dispatch(getSubjectsSuccess(result.data));
        }
    } catch (error) {
        console.error('获取科目列表错误:', error);
        dispatch(getError(error.response?.data?.message || error.message || '网络错误'));
    }
}

export const getTeacherFreeClassSubjects = (id) => async (dispatch) => {
    dispatch(getRequest());

    try {
        const result = await axios.get(`${process.env.REACT_APP_BASE_URL}/FreeSubjectList/${id}`);
        if (result.data.message) {
            dispatch(getFailed(result.data.message));
        } else {
            dispatch(getSubjectsSuccess(result.data));
        }
    } catch (error) {
        console.error('获取教师空闲班级科目错误:', error);
        dispatch(getError(error.response?.data?.message || error.message || '网络错误'));
    }
}

export const getSubjectDetails = (id, address) => async (dispatch) => {
    dispatch(getSubDetailsRequest());

    try {
        const result = await axios.get(`${process.env.REACT_APP_BASE_URL}/${address}/${id}`);
        if (result.data) {
            dispatch(getSubDetailsSuccess(result.data));
        }
    } catch (error) {
        dispatch(getError(error.response?.data?.message || error.message || '网络错误'));
    }
}

// 获取班级统计信息
export const getClassStatistics = (schoolId) => async (dispatch) => {
    dispatch(getStatsRequest());

    try {
        const result = await axios.get(`${process.env.REACT_APP_BASE_URL}/SclassStats/${schoolId}`);
        if (result.data.success) {
            dispatch(getStatsSuccess(result.data));
        } else {
            dispatch(getError(result.data.message || '获取统计信息失败'));
        }
    } catch (error) {
        console.error('获取班级统计错误:', error);
        dispatch(getError(error.response?.data?.message || error.message || '网络错误'));
    }
}

// 批量删除班级
export const batchDeleteClasses = (schoolId, classIds) => async (dispatch) => {
    dispatch(getBatchRequest());

    try {
        const result = await axios.delete(`${process.env.REACT_APP_BASE_URL}/SclassBatch/${schoolId}`, {
            data: { classIds }
        });

        if (result.data.success) {
            dispatch(getBatchSuccess(result.data));
        } else {
            dispatch(getError(result.data.message || '批量删除失败'));
        }
    } catch (error) {
        console.error('批量删除班级错误:', error);
        dispatch(getError(error.response?.data?.message || error.message || '网络错误'));
    }
}

// 更新筛选条件
export const updateFilters = (filters) => (dispatch) => {
    dispatch(setFilters(filters));
}

// 创建班级
export const createClass = (classData) => async (dispatch) => {
    dispatch(getRequest());

    try {
        const result = await axios.post(`${process.env.REACT_APP_BASE_URL}/SclassCreate`, classData, {
            headers: { 'Content-Type': 'application/json' },
        });

        if (result.data.success) {
            dispatch(getSuccess({ data: [result.data.data] })); // 将新创建的班级添加到列表
            return { success: true, data: result.data.data, message: result.data.message };
        } else {
            dispatch(getError(result.data.message || '创建班级失败'));
            return { success: false, message: result.data.message };
        }
    } catch (error) {
        console.error('创建班级错误:', error);
        const errorMessage = error.response?.data?.message || error.message || '网络错误';
        dispatch(getError(errorMessage));
        return { success: false, message: errorMessage, errors: error.response?.data?.errors };
    }
};

// 清除错误信息
export const clearClassError = () => (dispatch) => {
    dispatch(clearError());
}