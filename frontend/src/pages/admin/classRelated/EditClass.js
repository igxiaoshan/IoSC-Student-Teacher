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
    MenuItem
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';

const EditClass = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { currentUser } = useSelector(state => state.user);
    
    const [classData, setClassData] = useState({
        sclassName: '',
        description: '',
        grade: '',
        maxStudents: 50,
        status: 'active',
        academicYear: '',
        school: currentUser?._id || ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchClassData();
    }, [id]);

    const fetchClassData = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/Sclass/${id}`);
            
            if (response.data && !response.data.message) {
                const data = response.data.data || response.data;
                setClassData({
                    sclassName: data.sclassName || '',
                    description: data.description || '',
                    grade: data.grade || '',
                    maxStudents: data.maxStudents || 50,
                    status: data.status || 'active',
                    academicYear: data.academicYear || '',
                    school: data.school
                });
            } else {
                setError('班级不存在');
            }
        } catch (err) {
            setError('获取班级信息失败：' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setClassData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!classData.sclassName.trim()) {
            setError('班级名称不能为空');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await axios.put(`${process.env.REACT_APP_BASE_URL}/Sclass/${id}`, {
                sclassName: classData.sclassName.trim(),
                description: classData.description.trim(),
                grade: classData.grade.trim(),
                maxStudents: classData.maxStudents,
                status: classData.status,
                academicYear: classData.academicYear.trim(),
                school: currentUser._id
            });

            if (response.data && !response.data.message) {
                setSuccess('班级更新成功！');
                setTimeout(() => {
                    navigate('/Admin/classes');
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

    if (loading && !classData.sclassName) {
        return (
            <Container maxWidth="sm" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    return (
        <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 4 }}>
                <Typography variant="h4" gutterBottom textAlign="center">
                    编辑班级
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
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="班级名称"
                                name="sclassName"
                                value={classData.sclassName}
                                onChange={handleInputChange}
                                required
                                disabled={loading}
                                placeholder="例如：高一(1)班"
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="班级描述"
                                name="description"
                                value={classData.description}
                                onChange={handleInputChange}
                                disabled={loading}
                                multiline
                                rows={3}
                                placeholder="班级的简要描述（可选）"
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="年级"
                                name="grade"
                                value={classData.grade}
                                onChange={handleInputChange}
                                disabled={loading}
                                placeholder="例如：一年级、高一"
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="最大学生数"
                                name="maxStudents"
                                type="number"
                                value={classData.maxStudents}
                                onChange={handleInputChange}
                                disabled={loading}
                                inputProps={{ min: 1, max: 100 }}
                                helperText="班级可容纳的最大学生数量（1-100）"
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                select
                                label="状态"
                                name="status"
                                value={classData.status}
                                onChange={handleInputChange}
                                disabled={loading}
                            >
                                <MenuItem value="active">活跃</MenuItem>
                                <MenuItem value="inactive">非活跃</MenuItem>
                                <MenuItem value="archived">已归档</MenuItem>
                            </TextField>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="学年"
                                name="academicYear"
                                value={classData.academicYear}
                                onChange={handleInputChange}
                                disabled={loading}
                                placeholder="例如：2023-2024"
                                helperText="格式：YYYY-YYYY"
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={loading}
                                    sx={{ minWidth: 120 }}
                                >
                                    {loading ? <CircularProgress size={24} /> : '更新班级'}
                                </Button>

                                <Button
                                    variant="outlined"
                                    onClick={() => navigate('/Admin/classes')}
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

export default EditClass;
