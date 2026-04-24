import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { getSubjectDetails } from '../../../redux/sclassRelated/sclassHandle';
import Popup from '../../../components/Popup';
import { registerUser } from '../../../redux/userRelated/userHandle';
import { underControl } from '../../../redux/userRelated/userSlice';
import {
    Container, Paper, Typography, Grid, TextField, MenuItem,
    FormControl, InputLabel, Select, Button, CircularProgress,
    Divider, Box
} from '@mui/material';
import { useTranslation } from '../../../hooks/useTranslation';

const AddTeacher = () => {
    const params = useParams()
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { tTeacher, tCommon } = useTranslation();

    const subjectID = params.id

    const { status, response, error } = useSelector(state => state.user);
    const { subjectDetails } = useSelector((state) => state.sclass);

    useEffect(() => {
        dispatch(getSubjectDetails(subjectID, "Subject"));
    }, [dispatch, subjectID]);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        address: '',
        qualification: '',
        experience: '',
        teacherType: 'full-time',
        position: 'teacher',
    });

    const [showPopup, setShowPopup] = useState(false);
    const [message, setMessage] = useState("");
    const [loader, setLoader] = useState(false)

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const role = "Teacher"
    const school = subjectDetails && subjectDetails.school
    const teachSubject = subjectDetails && subjectDetails._id
    const teachSclass = subjectDetails && subjectDetails.sclassName && subjectDetails.sclassName._id

    const submitHandler = (event) => {
        event.preventDefault()
        setLoader(true)
        const fields = {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            phone: formData.phone,
            address: formData.address,
            qualification: formData.qualification,
            experience: parseInt(formData.experience) || 0,
            teacherType: formData.teacherType,
            position: formData.position,
            role,
            school,
            teachSubject,
            teachSclass
        }
        dispatch(registerUser(fields, role))
    }

    useEffect(() => {
        if (status === 'added') {
            dispatch(underControl())
            navigate("/Admin/teachers")
        }
        else if (status === 'failed') {
            setMessage(response)
            setShowPopup(true)
            setLoader(false)
        }
        else if (status === 'error') {
            setMessage(tCommon('error'))
            setShowPopup(true)
            setLoader(false)
        }
    }, [status, navigate, error, response, dispatch]);

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                    {tTeacher('addTeacher')}
                </Typography>
                <Divider sx={{ mb: 3 }} />

                {/* 显示分配信息 */}
                <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                                {tTeacher('subject')}:
                            </Typography>
                            <Typography variant="body1" fontWeight="medium">
                                {subjectDetails && subjectDetails.subName}
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                                {tTeacher('myClasses')}:
                            </Typography>
                            <Typography variant="body1" fontWeight="medium">
                                {subjectDetails && subjectDetails.sclassName && subjectDetails.sclassName.sclassName}
                            </Typography>
                        </Grid>
                    </Grid>
                </Box>

                <form onSubmit={submitHandler}>
                    <Grid container spacing={3}>
                        {/* 基本信息 */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                                {tTeacher('teacherInfo')}
                            </Typography>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label={tCommon('name')}
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder={tTeacher('teacherName')}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label={tCommon('email')}
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label={tCommon('password')}
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label={tCommon('phone')}
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label={tCommon('address')}
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                multiline
                                rows={2}
                            />
                        </Grid>

                        {/* 专业信息 */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 2, mb: 2 }}>
                                {tTeacher('specialization')}
                            </Typography>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label={tTeacher('qualification')}
                                name="qualification"
                                value={formData.qualification}
                                onChange={handleChange}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label={tTeacher('experience')}
                                name="experience"
                                type="number"
                                value={formData.experience}
                                onChange={handleChange}
                                InputProps={{ inputProps: { min: 0 } }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>{tTeacher('teacherType')}</InputLabel>
                                <Select
                                    name="teacherType"
                                    value={formData.teacherType}
                                    onChange={handleChange}
                                    label={tTeacher('teacherType')}
                                >
                                    <MenuItem value="full-time">{tTeacher('fullTime')}</MenuItem>
                                    <MenuItem value="part-time">{tTeacher('partTime')}</MenuItem>
                                    <MenuItem value="substitute">{tTeacher('substitute')}</MenuItem>
                                    <MenuItem value="guest">{tTeacher('guest')}</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>{tTeacher('position')}</InputLabel>
                                <Select
                                    name="position"
                                    value={formData.position}
                                    onChange={handleChange}
                                    label={tTeacher('position')}
                                >
                                    <MenuItem value="teacher">{tTeacher('teacherInfo')}</MenuItem>
                                    <MenuItem value="head-teacher">班主任</MenuItem>
                                    <MenuItem value="department-head">教研组长</MenuItem>
                                    <MenuItem value="principal">校长</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* 提交按钮 */}
                        <Grid item xs={12}>
                            <Box sx={{ mt: 3 }}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    type="submit"
                                    disabled={loader}
                                    fullWidth
                                    size="large"
                                >
                                    {loader ? (
                                        <CircularProgress size={24} color="inherit" />
                                    ) : (
                                        tCommon('submit')
                                    )}
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
            <Popup message={message} setShowPopup={setShowPopup} showPopup={showPopup} />
        </Container>
    )
}

export default AddTeacher