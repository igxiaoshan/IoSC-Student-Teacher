import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    TextField,
    Button,
    Paper,
    Alert,
    CircularProgress,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';

const EditSubject = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { currentUser } = useSelector(state => state.user);
    
    const [subjectData, setSubjectData] = useState({
        subName: '',
        subCode: '',
        sessions: '',
        sclassName: '',
        school: currentUser?._id || ''
    });
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchSubjectData();
        fetchClasses();
    }, [id]);

    const fetchSubjectData = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/Subject/Detail/${id}`);
            
            if (response.data && !response.data.message) {
                setSubjectData({
                    subName: response.data.subName || '',
                    subCode: response.data.subCode || '',
                    sessions: response.data.sessions || 0,
                    sclassName: response.data.sclassName?._id || response.data.sclassName || '',
                    school: response.data.school || ''
                });
            } else {
                setError('科目不存在');
            }
        } catch (err) {
            setError('获取科目信息失败：' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchClasses = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/SclassList/${currentUser._id}`);
            if (response.data && response.data.success !== false) {
                // 处理分页数据结构
                const classesData = response.data.data || response.data;
                setClasses(Array.isArray(classesData) ? classesData : []);
            } else {
                console.error('获取班级列表失败:', response.data.message);
                setClasses([]);
            }
        } catch (err) {
            console.error('获取班级列表失败:', err);
            setClasses([]);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSubjectData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!subjectData.subName.trim() || !subjectData.subCode.trim() || !subjectData.sessions.trim()) {
            setError('请填写所有必填字段');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await axios.put(`${process.env.REACT_APP_BASE_URL}/Subject/${id}`, {
                subName: subjectData.subName.trim(),
                subCode: subjectData.subCode.trim(),
                sessions: subjectData.sessions.trim(),
                sclassName: subjectData.sclassName,
                school: currentUser._id
            });

            if (response.data && !response.data.message) {
                setSuccess('科目更新成功！');
                setTimeout(() => {
                    navigate('/Admin/subjects');
                }, 2000);
            } else {
                setError(response.data.message || '更新失败');
            }
        } catch (err) {
            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError('更新失败：' + err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading && !subjectData.subName) {
        return (
            <Container maxWidth="sm" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 4 }}>
                <Typography variant="h4" gutterBottom textAlign="center">
                    编辑科目
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        {success}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="科目名称"
                                name="subName"
                                value={subjectData.subName}
                                onChange={handleInputChange}
                                required
                                disabled={loading}
                                placeholder="例如：数学"
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="科目代码"
                                name="subCode"
                                value={subjectData.subCode}
                                onChange={handleInputChange}
                                required
                                disabled={loading}
                                placeholder="例如：MATH001"
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="课时数"
                                name="sessions"
                                value={subjectData.sessions}
                                onChange={handleInputChange}
                                required
                                disabled={loading}
                                placeholder="例如：40"
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required>
                                <InputLabel>所属班级</InputLabel>
                                <Select
                                    name="sclassName"
                                    value={subjectData.sclassName}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                    label="所属班级"
                                >
                                    {classes.map((classItem) => (
                                        <MenuItem key={classItem._id} value={classItem._id}>
                                            {classItem.sclassName}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={loading}
                                    sx={{ minWidth: 120 }}
                                >
                                    {loading ? <CircularProgress size={24} /> : '更新科目'}
                                </Button>
                                
                                <Button
                                    variant="outlined"
                                    onClick={() => navigate('/Admin/subjects')}
                                    disabled={loading}
                                    sx={{ minWidth: 120 }}
                                >
                                    取消
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            </Paper>
        </Container>
    );
};

export default EditSubject;
