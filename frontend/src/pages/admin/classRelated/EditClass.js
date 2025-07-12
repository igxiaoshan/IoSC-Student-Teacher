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
    Grid
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
                setClassData({
                    sclassName: response.data.sclassName,
                    school: response.data.school
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
