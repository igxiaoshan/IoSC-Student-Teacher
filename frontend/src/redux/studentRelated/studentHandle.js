import api, { studentAPI } from '../../utils/apiClient';
import {
    getRequest,
    getSuccess,
    getFailed,
    getError,
    stuffDone
} from './studentSlice';

export const getAllStudents = (id) => async (dispatch) => {
    dispatch(getRequest());

    try {
        const result = await studentAPI.getAll(id);
        if (result.message) {
            dispatch(getFailed(result.message));
        } else {
            dispatch(getSuccess(result));
        }
    } catch (error) {
        console.error('获取学生列表错误:', error);
        dispatch(getError(error.response?.data?.message || error.message || '网络错误'));
    }
}

export const updateStudentFields = (id, fields, address) => async (dispatch) => {
    dispatch(getRequest());

    try {
        const result = await api.put(`/${address}/${id}`, fields);
        if (result.message) {
            dispatch(getFailed(result.message));
        } else {
            dispatch(stuffDone());
        }
    } catch (error) {
        console.error('更新学生字段错误:', error);
        dispatch(getError(error.response?.data?.message || error.message || '网络错误'));
    }
}

export const removeStuff = (id, address) => async (dispatch) => {
    dispatch(getRequest());

    try {
        const result = await api.put(`/${address}/${id}`);
        if (result.message) {
            dispatch(getFailed(result.message));
        } else {
            dispatch(stuffDone());
        }
    } catch (error) {
        console.error('删除操作错误:', error);
        dispatch(getError(error.response?.data?.message || error.message || '网络错误'));
    }
}
