import React, { useEffect } from 'react';
import { getTeacherDetails } from '../../../redux/teacherRelated/teacherHandle';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Container, Typography } from '@mui/material';
import { safeGet } from '../../../utils/safeAccess';

const TeacherDetails = () => {
    const navigate = useNavigate();
    const params = useParams();
    const dispatch = useDispatch();
    const { loading, teacherDetails, error } = useSelector((state) => state.teacher);

    const teacherID = params.id;

    useEffect(() => {
        dispatch(getTeacherDetails(teacherID));
    }, [dispatch, teacherID]);

    if (error) {
        console.log(error);
    }

    const isSubjectNamePresent = safeGet(teacherDetails, 'teachSubject.subName');

    const handleAddSubject = () => {
        const classId = safeGet(teacherDetails, 'teachSclass._id');
        const teacherId = safeGet(teacherDetails, '_id');
        navigate(`/Admin/teachers/choosesubject/${classId}/${teacherId}`);
    };

    return (
        <>
            {loading ? (
                <div>加载中...</div>
            ) : (
                <Container>
                    <Typography variant="h4" align="center" gutterBottom>
                        教师详情
                    </Typography>
                    <Typography variant="h6" gutterBottom>
                        教师姓名: {safeGet(teacherDetails, 'name', '未知教师')}
                    </Typography>
                    <Typography variant="h6" gutterBottom>
                        班级名称: {safeGet(teacherDetails, 'teachSclass.sclassName', '未分配班级')}
                    </Typography>
                    {isSubjectNamePresent ? (
                        <>
                            <Typography variant="h6" gutterBottom>
                                科目名称: {safeGet(teacherDetails, 'teachSubject.subName', '未知科目')}
                            </Typography>
                            <Typography variant="h6" gutterBottom>
                                科目学期: {safeGet(teacherDetails, 'teachSubject.sessions', 0)}
                            </Typography>
                        </>
                    ) : (
                        <Button variant="contained" onClick={handleAddSubject}>
                            添加科目
                        </Button>
                    )}
                </Container>
            )}
        </>
    );
};

export default TeacherDetails;