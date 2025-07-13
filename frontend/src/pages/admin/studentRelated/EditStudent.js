import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getUserDetails, updateUser } from '../../../redux/userRelated/userHandle';
import { getAllSclasses } from '../../../redux/sclassRelated/sclassHandle';
import { underControl } from '../../../redux/userRelated/userSlice';
import {
    Box,
    Container,
    Typography,
    TextField,
    Paper,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Card,
    CardContent,
    Divider
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { BlueButton, GreenButton } from '../../../components/buttonStyles';
import Popup from '../../../components/Popup';
import { safeGet } from '../../../utils/safeAccess';

const EditStudent = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const params = useParams();
    
    const { status, error, userDetails } = useSelector(state => state.user);
    const { sclassesList } = useSelector((state) => state.sclass);
    const { currentUser } = useSelector(state => state.user);

    const [studentData, setStudentData] = useState({
        name: '',
        rollNum: '',
        sclassName: '',
        email: '',
        phone: '',
        address: ''
    });

    const [loader, setLoader] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [message, setMessage] = useState('');
    const [originalClass, setOriginalClass] = useState('');

    const studentID = params.id;
    const adminID = safeGet(currentUser, '_id');

    useEffect(() => {
        if (studentID) {
            dispatch(getUserDetails(studentID, "Student"));
        }
        if (adminID) {
            dispatch(getAllSclasses(adminID, "Sclass"));
        }
    }, [dispatch, studentID, adminID]);

    useEffect(() => {
        if (userDetails && userDetails._id === studentID) {
            setStudentData({
                name: userDetails.name || '',
                rollNum: userDetails.rollNum || '',
                sclassName: safeGet(userDetails, 'sclassName._id', ''),
                email: userDetails.email || '',
                phone: userDetails.phone || '',
                address: userDetails.address || ''
            });
            setOriginalClass(safeGet(userDetails, 'sclassName._id', ''));
        }
    }, [userDetails, studentID]);

    useEffect(() => {
        if (status === 'added') {
            setLoader(false);
            setMessage('学生信息更新成功！');
            setShowPopup(true);
            dispatch(underControl());
            setTimeout(() => {
                navigate('/Admin/students');
            }, 2000);
        } else if (status === 'failed') {
            setLoader(false);
            setMessage('更新失败');
            setShowPopup(true);
            dispatch(underControl());
        } else if (status === 'error') {
            setLoader(false);
            setMessage('网络错误');
            setShowPopup(true);
            dispatch(underControl());
        }
    }, [status, navigate, dispatch]);

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setStudentData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        
        if (!studentData.name || !studentData.rollNum || !studentData.sclassName) {
            setMessage('请填写所有必填字段');
            setShowPopup(true);
            return;
        }

        setLoader(true);
        
        const updateData = {
            name: studentData.name,
            rollNum: studentData.rollNum,
            sclassName: studentData.sclassName,
            email: studentData.email,
            phone: studentData.phone,
            address: studentData.address
        };

        dispatch(updateUser(updateData, studentID, "Student"));
    };

    const handleCancel = () => {
        navigate('/Admin/students');
    };

    const getSelectedClassName = () => {
        if (!studentData.sclassName || !sclassesList) return '';
        const selectedClass = sclassesList.find(cls => cls._id === studentData.sclassName);
        return selectedClass ? selectedClass.sclassName : '';
    };

    const getOriginalClassName = () => {
        if (!originalClass || !sclassesList) return '';
        const originalClassObj = sclassesList.find(cls => cls._id === originalClass);
        return originalClassObj ? originalClassObj.sclassName : '';
    };

    const isClassChanged = () => {
        return originalClass !== studentData.sclassName && originalClass !== '';
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom align="center">
                    编辑学生信息
                </Typography>
                
                {userDetails && (
                    <Card sx={{ mb: 3, bgcolor: 'grey.50' }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                当前学生信息
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2">
                                        <strong>学生ID:</strong> {userDetails._id}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2">
                                        <strong>当前班级:</strong> {safeGet(userDetails, 'sclassName.sclassName', '未分配班级')}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2">
                                        <strong>注册时间:</strong> {userDetails.createdAt ? new Date(userDetails.createdAt).toLocaleDateString() : '未知'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2">
                                        <strong>最后更新:</strong> {userDetails.updatedAt ? new Date(userDetails.updatedAt).toLocaleDateString() : '未知'}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                )}

                {isClassChanged() && (
                    <Alert severity="warning" sx={{ mb: 3 }}>
                        <Typography variant="body2">
                            <strong>班级变更提醒:</strong> 您正在将学生从 "{getOriginalClassName()}" 转移到 "{getSelectedClassName()}"。
                            这将影响学生的课程安排和考勤记录。
                        </Typography>
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                required
                                fullWidth
                                label="学生姓名"
                                name="name"
                                value={studentData.name}
                                onChange={handleInputChange}
                                disabled={loader}
                            />
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            <TextField
                                required
                                fullWidth
                                label="学号"
                                name="rollNum"
                                type="number"
                                value={studentData.rollNum}
                                onChange={handleInputChange}
                                disabled={loader}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <FormControl fullWidth required>
                                <InputLabel>班级</InputLabel>
                                <Select
                                    name="sclassName"
                                    value={studentData.sclassName}
                                    label="班级"
                                    onChange={handleInputChange}
                                    disabled={loader}
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

                        <Grid item xs={12}>
                            <Divider sx={{ my: 2 }}>
                                <Typography variant="body2" color="textSecondary">
                                    可选信息
                                </Typography>
                            </Divider>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="邮箱"
                                name="email"
                                type="email"
                                value={studentData.email}
                                onChange={handleInputChange}
                                disabled={loader}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="电话"
                                name="phone"
                                value={studentData.phone}
                                onChange={handleInputChange}
                                disabled={loader}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="地址"
                                name="address"
                                multiline
                                rows={3}
                                value={studentData.address}
                                onChange={handleInputChange}
                                disabled={loader}
                            />
                        </Grid>
                    </Grid>

                    <Box sx={{ display: 'flex', gap: 2, mt: 4, justifyContent: 'center' }}>
                        <BlueButton
                            variant="outlined"
                            onClick={handleCancel}
                            disabled={loader}
                        >
                            取消
                        </BlueButton>
                        <LoadingButton
                            type="submit"
                            variant="contained"
                            loading={loader}
                            loadingPosition="start"
                            startIcon={<></>}
                        >
                            {loader ? '更新中...' : '更新学生信息'}
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

export default EditStudent;
