import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    teachersList: [],
    teacherDetails: [],
    pagination: null,
    loading: false,
    error: null,
    response: null,
};

const teacherSlice = createSlice({
    name: 'teacher',
    initialState,
    reducers: {
        getRequest: (state) => {
            state.loading = true;
        },
        doneSuccess: (state, action) => {
            state.teacherDetails = action.payload;
            state.loading = false;
            state.error = null;
            state.response = null;
        },
        getSuccess: (state, action) => {
            // 处理新的API响应格式
            if (action.payload && action.payload.success && action.payload.data) {
                state.teachersList = action.payload.data;
                state.pagination = action.payload.pagination;
            } else if (Array.isArray(action.payload)) {
                // 兼容旧格式
                state.teachersList = action.payload;
            } else {
                state.teachersList = [];
            }
            state.loading = false;
            state.error = null;
            state.response = null;
        },
        getFailed: (state, action) => {
            state.response = action.payload;
            state.loading = false;
            state.error = null;
        },
        getError: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },
        postDone: (state) => {
            state.loading = false;
            state.error = null;
            state.response = null;
        }
    },
});

export const {
    getRequest,
    getSuccess,
    getFailed,
    getError,
    doneSuccess,
    postDone
} = teacherSlice.actions;

export const teacherReducer = teacherSlice.reducer;