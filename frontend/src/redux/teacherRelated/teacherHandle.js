import axios from 'axios';
import {
    getRequest,
    getSuccess,
    getFailed,
    getError,
    postDone,
    doneSuccess
} from './teacherSlice';

export const getAllTeachers = (id) => async (dispatch) => {
    dispatch(getRequest());

    try {
        const result = await axios.get(`${process.env.REACT_APP_BASE_URL}/Teachers/${id}`);

        // 处理新的API响应格式
        if (result.data.success === false) {
            dispatch(getFailed(result.data.message || '获取教师列表失败'));
        } else if (result.data.message && !result.data.success) {
            // 兼容旧格式的错误响应
            dispatch(getFailed(result.data.message));
        } else {
            // 成功响应
            dispatch(getSuccess(result.data));
        }
    } catch (error) {
        console.error('获取教师列表错误:', error);
        dispatch(getError(error.response?.data?.message || error.message || '网络错误'));
    }
}

export const getTeacherDetails = (id) => async (dispatch) => {
    dispatch(getRequest());

    try {
        const result = await axios.get(`${process.env.REACT_APP_BASE_URL}/Teacher/${id}`);
        if (result.data) {
            dispatch(doneSuccess(result.data));
        }
    } catch (error) {
        dispatch(getError(error));
    }
}

export const updateTeachSubject = (teacherId, teachSubject) => async (dispatch) => {
    dispatch(getRequest());

    try {
        await axios.put(`${process.env.REACT_APP_BASE_URL}/TeacherSubject`, { teacherId, teachSubject }, {
            headers: { 'Content-Type': 'application/json' },
        });
        dispatch(postDone());
    } catch (error) {
        dispatch(getError(error));
    }
}