import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getTeacherDetails } from '../../../redux/teacherRelated/teacherHandle';
import { updateUser } from '../../../redux/userRelated/userHandle';
import { getAllSclasses } from '../../../redux/sclassRelated/sclassHandle';
import { getSubjectList } from '../../../redux/sclassRelated/sclassHandle';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Alert,
    Card,
    CardContent,
    Divider,
    Chip
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { BlueButton } from '../../../components/buttonStyles';
import { safeGet } from '../../../utils/safeAccess';
import Popup from '../../../components/Popup';

const EditTeacher = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const params = useParams();
    
    const { teacherDetails, loading } = useSelector((state) => state.teacher);
    const { sclassesList } = useSelector((state) => state.sclass);
    const { subjectsList } = useSelector((state) => state.sclass);
    const { currentUser, status, error } = useSelector(state => state.user);

    const [teacherData, setTeacherData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        qualification: '',
        experience: '',
        teachSclass: '',
        teachSubject: '',
        teacherType: 'full-time',
        position: 'teacher',
        status: 'active'
    });

    const [submitLoading, setSubmitLoading] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [message, setMessage] = useState('');

    const teacherId = params.id;
    const adminId = safeGet(currentUser, '_id');

    useEffect(() => {
        if (teacherId) {
            dispatch(getTeacherDetails(teacherId));
        }
        if (adminId) {
            dispatch(getAllSclasses(adminId, "Sclass"));
        }
    }, [dispatch, teacherId, adminId]);

    useEffect(() => {
        if (teacherDetails && teacherDetails._id === teacherId) {
            setTeacherData({
                name: safeGet(teacherDetails, 'name', ''),
                email: safeGet(teacherDetails, 'email', ''),
                phone: safeGet(teacherDetails, 'phone', ''),
                address: safeGet(teacherDetails, 'address', ''),
                qualification: safeGet(teacherDetails, 'qualification', ''),
                experience: safeGet(teacherDetails, 'experience', ''),
                teachSclass: safeGet(teacherDetails, 'teachSclass._id', ''),
                teachSubject: safeGet(teacherDetails, 'teachSubject._id', ''),
                teacherType: safeGet(teacherDetails, 'teacherType', 'full-time'),
                position: safeGet(teacherDetails, 'position', 'teacher'),
                status: safeGet(teacherDetails, 'status', 'active')
            });

            // 获取选中班级的科目列表
            const classId = safeGet(teacherDetails, 'teachSclass._id');
            if (classId) {
                dispatch(getSubjectList(classId, "ClassSubjects"));
            }
        }
    }, [teacherDetails, teacherId, dispatch]);

    // 当班级改变时，获取对应的科目列表
    useEffect(() => {
        if (teacherData.teachSclass) {
            dispatch(getSubjectList(teacherData.teachSclass, "ClassSubjects"));
        }
    }, [teacherData.teachSclass, dispatch]);

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setTeacherData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        
        if (!teacherData.name || !teacherData.email) {
            setMessage('请填写必填字段');
            setShowPopup(true);
            return;
        }

        setSubmitLoading(true);
        
        try {
            const updateData = {
                name: teacherData.name,
                email: teacherData.email,
                phone: teacherData.phone,
                address: teacherData.address,
                qualification: teacherData.qualification,
                experience: parseInt(teacherData.experience) || 0,
                teachSclass: teacherData.teachSclass,
                teachSubject: teacherData.teachSubject,
                teacherType: teacherData.teacherType,
                position: teacherData.position,
                status: teacherData.status
            };

            await dispatch(updateUser(updateData, teacherId, "Teacher"));
            setMessage('教师信息更新成功！');
            setShowPopup(true);
            
            setTimeout(() => {
                navigate('/Admin/teachers');
            }, 2000);
        } catch (error) {
            setMessage('更新失败：' + (error.message || '未知错误'));
            setShowPopup(true);
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/Admin/teachers');
    };

    const getSelectedClassName = () => {
        if (!teacherData.teachSclass || !sclassesList) return '';
        const selectedClass = sclassesList.find(cls => cls._id === teacherData.teachSclass);
        return selectedClass ? selectedClass.sclassName : '';
    };

    const getSelectedSubjectName = () => {
        if (!teacherData.teachSubject || !subjectsList) return '';
        const selectedSubject = subjectsList.find(sub => sub._id === teacherData.teachSubject);
        return selectedSubject ? selectedSubject.subName : '';
    };

    if (loading) {
        return (
            <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <Typography>加载教师信息中...</Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom align="center">
                    编辑教师信息
                </Typography>

                {teacherDetails && (
                    <Card sx={{ mb: 3, bgcolor: 'grey.50' }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                当前教师信息
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2">
                                        <strong>教师ID:</strong> {teacherDetails._id}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2">
                                        <strong>当前班级:</strong> {safeGet(teacherDetails, 'teachSclass.sclassName', '未分配班级')}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2">
                                        <strong>当前科目:</strong> {safeGet(teacherDetails, 'teachSubject.subName', '未分配科目')}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2">
                                        <strong>班级数量:</strong> {safeGet(teacherDetails, 'classCount', 1)}
                                    </Typography>
                                </Grid>
                                {teacherDetails.allClasses && teacherDetails.allClasses.length > 1 && (
                                    <Grid item xs={12}>
                                        <Typography variant="body2">
                                            <strong>所有班级:</strong> {safeGet(teacherDetails, 'classNames', '')}
                                        </Typography>
                                    </Grid>
                                )}
                            </Grid>
                        </CardContent>
                    </Card>
                )}

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
                    <Grid container spacing={3}>
                        {/* 基本信息 */}
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>
                                基本信息
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                required
                                fullWidth
                                label="教师姓名"
                                name="name"
                                value={teacherData.name}
                                onChange={handleInputChange}
                                disabled={submitLoading}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                required
                                fullWidth
                                label="邮箱"
                                name="email"
                                type="email"
                                value={teacherData.email}
                                onChange={handleInputChange}
                                disabled={submitLoading}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="电话"
                                name="phone"
                                value={teacherData.phone}
                                onChange={handleInputChange}
                                disabled={submitLoading}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="工作经验(年)"
                                name="experience"
                                type="number"
                                value={teacherData.experience}
                                onChange={handleInputChange}
                                disabled={submitLoading}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="地址"
                                name="address"
                                multiline
                                rows={2}
                                value={teacherData.address}
                                onChange={handleInputChange}
                                disabled={submitLoading}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="学历/资质"
                                name="qualification"
                                value={teacherData.qualification}
                                onChange={handleInputChange}
                                disabled={submitLoading}
                            />
                        </Grid>

                        {/* 教学信息 */}
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                                教学信息
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>主要班级</InputLabel>
                                <Select
                                    name="teachSclass"
                                    value={teacherData.teachSclass}
                                    label="主要班级"
                                    onChange={handleInputChange}
                                    disabled={submitLoading}
                                >
                                    <MenuItem value="">
                                        <em>请选择班级</em>
                                    </MenuItem>
                                    {sclassesList && sclassesList.map((classItem) => (
                                        <MenuItem key={classItem._id} value={classItem._id}>
                                            {classItem.sclassName}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>任教科目</InputLabel>
                                <Select
                                    name="teachSubject"
                                    value={teacherData.teachSubject}
                                    label="任教科目"
                                    onChange={handleInputChange}
                                    disabled={submitLoading || !teacherData.teachSclass}
                                >
                                    <MenuItem value="">
                                        <em>请选择科目</em>
                                    </MenuItem>
                                    {subjectsList && subjectsList.map((subject) => (
                                        <MenuItem key={subject._id} value={subject._id}>
                                            {subject.subName}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* 职位信息 */}
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                                职位信息
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                        </Grid>

                        <Grid item xs={12} sm={4}>
                            <FormControl fullWidth>
                                <InputLabel>教师类型</InputLabel>
                                <Select
                                    name="teacherType"
                                    value={teacherData.teacherType}
                                    label="教师类型"
                                    onChange={handleInputChange}
                                    disabled={submitLoading}
                                >
                                    <MenuItem value="full-time">全职</MenuItem>
                                    <MenuItem value="part-time">兼职</MenuItem>
                                    <MenuItem value="substitute">代课</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={4}>
                            <FormControl fullWidth>
                                <InputLabel>职位</InputLabel>
                                <Select
                                    name="position"
                                    value={teacherData.position}
                                    label="职位"
                                    onChange={handleInputChange}
                                    disabled={submitLoading}
                                >
                                    <MenuItem value="teacher">教师</MenuItem>
                                    <MenuItem value="head-teacher">班主任</MenuItem>
                                    <MenuItem value="department-head">教研组长</MenuItem>
                                    <MenuItem value="vice-principal">副校长</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={4}>
                            <FormControl fullWidth>
                                <InputLabel>状态</InputLabel>
                                <Select
                                    name="status"
                                    value={teacherData.status}
                                    label="状态"
                                    onChange={handleInputChange}
                                    disabled={submitLoading}
                                >
                                    <MenuItem value="active">在职</MenuItem>
                                    <MenuItem value="inactive">离职</MenuItem>
                                    <MenuItem value="suspended">停职</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>

                    <Box sx={{ display: 'flex', gap: 2, mt: 4, justifyContent: 'center' }}>
                        <BlueButton
                            variant="outlined"
                            onClick={handleCancel}
                            disabled={submitLoading}
                        >
                            取消
                        </BlueButton>
                        <LoadingButton
                            type="submit"
                            variant="contained"
                            loading={submitLoading}
                            loadingPosition="start"
                            startIcon={<></>}
                        >
                            {submitLoading ? '更新中...' : '更新教师信息'}
                        </LoadingButton>
                    </Box>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                    </Alert>
                )}
            </Paper>

            <Popup message={message} setShowPopup={setShowPopup} showPopup={showPopup} />
        </Container>
    );
};

export default EditTeacher;
