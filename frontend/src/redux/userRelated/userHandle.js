import axios from 'axios';
import {
    authRequest,
    stuffAdded,
    authSuccess,
    authFailed,
    authError,
    authLogout,
    doneSuccess,
    getDeleteSuccess,
    getRequest,
    getFailed,
    getError,
} from './userSlice';

export const loginUser = (fields, role) => async (dispatch) => {
    dispatch(authRequest());

    try {
        const result = await axios.post(`${process.env.REACT_APP_BASE_URL}/${role}Login`, fields, {
            headers: { 'Content-Type': 'application/json' },
        });
        if (result.data.role) {
            dispatch(authSuccess(result.data));
        } else {
            dispatch(authFailed(result.data.message));
        }
    } catch (error) {
        console.error('登录错误:', error);
        dispatch(authError(error.response?.data?.message || error.message || '网络错误'));
    }
};

export const registerUser = (fields, role) => async (dispatch) => {
    dispatch(authRequest());

    try {
        const result = await axios.post(`${process.env.REACT_APP_BASE_URL}/${role}Reg`, fields, {
            headers: { 'Content-Type': 'application/json' },
        });
        if (result.data.schoolName) {
            dispatch(authSuccess(result.data));
        }
        else if (result.data.school) {
            dispatch(stuffAdded());
        }
        else {
            dispatch(authFailed(result.data.message));
        }
    } catch (error) {
        console.error('注册错误:', error);
        dispatch(authError(error.response?.data?.message || error.message || '网络错误'));
    }
};

export const logoutUser = () => (dispatch) => {
    dispatch(authLogout());
};

export const getUserDetails = (id, address) => async (dispatch) => {
    dispatch(getRequest());

    try {
        const result = await axios.get(`${process.env.REACT_APP_BASE_URL}/${address}/${id}`);
        if (result.data) {
            dispatch(doneSuccess(result.data));
        }
    } catch (error) {
        console.error('获取用户详情错误:', error);
        dispatch(getError(error.response?.data?.message || error.message || '网络错误'));
    }
}

// export const deleteUser = (id, address) => async (dispatch) => {
//     dispatch(getRequest());

//     try {
//         const result = await axios.delete(`${process.env.REACT_APP_BASE_URL}/${address}/${id}`);
//         if (result.data.message) {
//             dispatch(getFailed(result.data.message));
//         } else {
//             dispatch(getDeleteSuccess());
//         }
//     } catch (error) {
//         dispatch(getError(error));
//     }
// }


export const deleteUser = (id, address) => async (dispatch) => {
    dispatch(getRequest());
    dispatch(getFailed("Sorry the delete function has been disabled for now."));
}

export const updateUser = (fields, id, address) => async (dispatch) => {
    dispatch(getRequest());

    try {
        const result = await axios.put(`${process.env.REACT_APP_BASE_URL}/${address}/${id}`, fields, {
            headers: { 'Content-Type': 'application/json' },
        });
        if (result.data.schoolName) {
            dispatch(authSuccess(result.data));
        }
        else {
            dispatch(doneSuccess(result.data));
        }
    } catch (error) {
        console.error('更新用户错误:', error);
        dispatch(getError(error.response?.data?.message || error.message || '网络错误'));
    }
}

export const addStuff = (fields, address) => async (dispatch) => {
    dispatch(authRequest());

    try {
        const result = await axios.post(`${process.env.REACT_APP_BASE_URL}/${address}Create`, fields, {
            headers: { 'Content-Type': 'application/json' },
        });

        if (result.data.message) {
            dispatch(authFailed(result.data.message));
        } else {
            dispatch(stuffAdded(result.data));
        }
    } catch (error) {
        dispatch(authError(error));
    }
};