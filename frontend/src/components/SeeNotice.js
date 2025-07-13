import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { getAllNotices } from '../redux/noticeRelated/noticeHandle';
import { Paper } from '@mui/material';
import TableViewTemplate from './TableViewTemplate';
import { safeGet } from '../utils/safeAccess';

const SeeNotice = () => {
    const dispatch = useDispatch();

    const { currentUser, currentRole } = useSelector(state => state.user);
    const { noticesList, loading, error, response } = useSelector((state) => state.notice);

    useEffect(() => {
        if (currentRole === "Admin") {
            const adminId = safeGet(currentUser, '_id');
            if (adminId) {
                dispatch(getAllNotices(adminId, "Notice"));
            }
        }
        else {
            const schoolId = safeGet(currentUser, 'school._id');
            if (schoolId) {
                dispatch(getAllNotices(schoolId, "Notice"));
            }
        }
    }, [dispatch, currentUser, currentRole]);

    if (error) {
        console.log(error);
    }

    const noticeColumns = [
        { id: 'title', label: '标题', minWidth: 170 },
        { id: 'details', label: '详情', minWidth: 100 },
        { id: 'date', label: '日期', minWidth: 170 },
    ];

    const noticeRows = noticesList.map((notice) => {
        const date = new Date(notice.date);
        const dateString = date.toString() !== "Invalid Date" ? date.toISOString().substring(0, 10) : "Invalid Date";
        return {
            title: notice.title,
            details: notice.details,
            date: dateString,
            id: notice._id,
        };
    });
    return (
        <div style={{ marginTop: '50px', marginRight: '20px' }}>
            {loading ? (
                <div style={{ fontSize: '20px' }}>加载中...</div>
            ) : response ? (
                <div style={{ fontSize: '20px' }}>暂无通知</div>
            ) : (
                <>
                    <h3 style={{ fontSize: '30px', marginBottom: '40px' }}>通知</h3>
                    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                        {Array.isArray(noticesList) && noticesList.length > 0 &&
                            <TableViewTemplate columns={noticeColumns} rows={noticeRows} />
                        }
                    </Paper>
                </>
            )}
        </div>

    )
}

export default SeeNotice