// frontend/src/utils/videoLessonAPI.js
import axios from 'axios';

const BASE = process.env.REACT_APP_BASE_URL || 'http://localhost:5000';
const API  = `${BASE}/api/video-lesson`;

/**
 * 上传视频（带进度回调）
 * @param {FormData} formData - 包含 video 文件 + 文本字段
 * @param {Function} onProgress - (percent: number) => void
 */
export const uploadVideo = (formData, onProgress) =>
    axios.post(`${API}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
            if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
        },
    }).then(r => r.data);

/** 获取教师视频列表 */
export const getTeacherVideos = (teacherId) =>
    axios.get(`${API}/list/${teacherId}`).then(r => r.data);

/** 获取视频详情（含字幕） */
export const getVideoDetail = (id) =>
    axios.get(`${API}/${id}`).then(r => r.data);

/** 删除视频 */
export const deleteVideo = (id) =>
    axios.delete(`${API}/${id}`).then(r => r.data);

/** 获取视频完整 URL */
export const getVideoUrl = (fileName) => `${BASE}/uploads/videos/${fileName}`;

/** 获取字幕下载/track URL（用于 <track src=...>） */
export const getSubtitleUrl = (id) => `${API}/${id}/subtitle.vtt`;

/** 获取 SSE 字幕流 URL */
export const getSubtitleEventsUrl = (id) => `${API}/${id}/subtitle-events`;
