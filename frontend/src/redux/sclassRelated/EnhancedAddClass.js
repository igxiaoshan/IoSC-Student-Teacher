import React, { useState } from "react";
import {
    Box, Button, CircularProgress, Stack, TextField, Typography,
    Paper, Alert, MenuItem, FormControl, InputLabel, Select,
    Grid, Card, CardContent, Stepper, Step, StepLabel
} from "@mui/material";
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createClass, clearClassError } from '../../../redux/sclassRelated/sclassHandle';
import { BlueButton, GreenButton } from "../../../components/buttonStyles";
import Classroom from "../../../assets/classroom.png";
import styled from "styled-components";
import {
    School as SchoolIcon,
    Class as ClassIcon,
    Group as GroupIcon,
    CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

const EnhancedAddClass = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { currentUser } = useSelector(state => state.user);
    const { loading, error } = useSelector(state => state.sclass);

    // 表单数据状态
    const [formData, setFormData] = useState({
        sclassName: "",
        description: "",
        grade: "",
        maxStudents: 50,
        academicYear: "",
        status: "active"
    });

    // UI状态
    const [activeStep, setActiveStep] = useState(0);
    const [validationErrors, setValidationErrors] = useState({});
    const [success, setSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    // 步骤配置
    const steps = ['基本信息', '详细配置', '确认创建'];

    // 年级选项
    const gradeOptions = [
        '一年级', '二年级', '三年级', '四年级', '五年级', '六年级',
        '初一', '初二', '初三',
        '高一', '高二', '高三'
    ];

    // 处理输入变化
    const handleInputChange = (field) => (event) => {
        const value = event.target.value;
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // 清除该字段的验证错误
        if (validationErrors[field]) {
            setValidationErrors(prev => ({
                ...prev,
                [field]: null
            }));
        }
    };

    // 表单验证
    const validateForm = () => {
        const errors = {};

        if (!formData.sclassName.trim()) {
            errors.sclassName = '班级名称不能为空';
        } else if (formData.sclassName.length < 2) {
            errors.sclassName = '班级名称至少需要2个字符';
        } else if (formData.sclassName.length > 50) {
            errors.sclassName = '班级名称不能超过50个字符';
        }

        if (formData.description && formData.description.length > 500) {
            errors.description = '班级描述不能超过500个字符';
        }

        if (formData.grade && formData.grade.length > 20) {
            errors.grade = '年级不能超过20个字符';
        }

        if (formData.maxStudents < 1 || formData.maxStudents > 100) {
            errors.maxStudents = '最大学生数必须在1-100之间';
        }

        if (formData.academicYear && !/^\d{4}-\d{4}$/.test(formData.academicYear)) {
            errors.academicYear = '学年格式应为：YYYY-YYYY，如2023-2024';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // 下一步
    const handleNext = () => {
        if (activeStep === 0 && !validateForm()) {
            return;
        }
        setActiveStep(prev => prev + 1);
    };

    // 上一步
    const handleBack = () => {
        setActiveStep(prev => prev - 1);
    };

    // 提交表单
    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        const classData = {
            ...formData,
            adminID: currentUser._id
        };

        try {
            const result = await dispatch(createClass(classData));
            
            if (result.success) {
                setSuccess(true);
                setSuccessMessage(result.message || '班级创建成功！');
                
                // 3秒后跳转到班级列表
                setTimeout(() => {
                    navigate('/Admin/classes');
                }, 3000);
            }
        } catch (err) {
            console.error('创建班级失败:', err);
        }
    };

    // 清除错误
    const handleClearError = () => {
        dispatch(clearClassError());
    };

    // 渲染步骤内容
    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="班级名称 *"
                                value={formData.sclassName}
                                onChange={handleInputChange('sclassName')}
                                error={!!validationErrors.sclassName}
                                helperText={validationErrors.sclassName || "例如：高一(1)班"}
                                placeholder="请输入班级名称"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>年级</InputLabel>
                                <Select
                                    value={formData.grade}
                                    label="年级"
                                    onChange={handleInputChange('grade')}
                                    error={!!validationErrors.grade}
                                >
                                    <MenuItem value="">
                                        <em>请选择年级</em>
                                    </MenuItem>
                                    {gradeOptions.map((grade) => (
                                        <MenuItem key={grade} value={grade}>
                                            {grade}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="学年"
                                value={formData.academicYear}
                                onChange={handleInputChange('academicYear')}
                                error={!!validationErrors.academicYear}
                                helperText={validationErrors.academicYear || "格式：YYYY-YYYY，如2023-2024"}
                                placeholder="2023-2024"
                            />
                        </Grid>
                    </Grid>
                );

            case 1:
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="班级描述"
                                value={formData.description}
                                onChange={handleInputChange('description')}
                                error={!!validationErrors.description}
                                helperText={validationErrors.description || "班级的简要描述（可选）"}
                                multiline
                                rows={4}
                                placeholder="请输入班级描述..."
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="最大学生数"
                                type="number"
                                value={formData.maxStudents}
                                onChange={handleInputChange('maxStudents')}
                                error={!!validationErrors.maxStudents}
                                helperText={validationErrors.maxStudents || "班级可容纳的最大学生数量（1-100）"}
                                inputProps={{ min: 1, max: 100 }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>班级状态</InputLabel>
                                <Select
                                    value={formData.status}
                                    label="班级状态"
                                    onChange={handleInputChange('status')}
                                >
                                    <MenuItem value="active">活跃</MenuItem>
                                    <MenuItem value="inactive">非活跃</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                );

            case 2:
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            确认班级信息
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="subtitle2" color="textSecondary">
                                            班级名称
                                        </Typography>
                                        <Typography variant="body1">
                                            {formData.sclassName || '未填写'}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="subtitle2" color="textSecondary">
                                            年级
                                        </Typography>
                                        <Typography variant="body1">
                                            {formData.grade || '未选择'}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="subtitle2" color="textSecondary">
                                            学年
                                        </Typography>
                                        <Typography variant="body1">
                                            {formData.academicYear || '未填写'}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="subtitle2" color="textSecondary">
                                            最大学生数
                                        </Typography>
                                        <Typography variant="body1">
                                            {formData.maxStudents} 人
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            {formData.description && (
                                <Grid item xs={12}>
                                    <Card variant="outlined">
                                        <CardContent>
                                            <Typography variant="subtitle2" color="textSecondary">
                                                班级描述
                                            </Typography>
                                            <Typography variant="body1">
                                                {formData.description}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            )}
                        </Grid>
                    </Box>
                );

            default:
                return null;
        }
    };

    if (success) {
        return (
            <StyledContainer>
                <StyledBox>
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                        <Typography variant="h4" gutterBottom>
                            创建成功！
                        </Typography>
                        <Typography variant="body1" color="textSecondary" gutterBottom>
                            {successMessage}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            即将跳转到班级列表...
                        </Typography>
                        <Box sx={{ mt: 3 }}>
                            <Button
                                variant="outlined"
                                onClick={() => navigate('/Admin/classes')}
                            >
                                立即跳转
                            </Button>
                        </Box>
                    </Box>
                </StyledBox>
            </StyledContainer>
        );
    }

    return (
        <StyledContainer>
            <StyledBox>
                {/* 标题和图标 */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <img
                        src={Classroom}
                        alt="classroom"
                        style={{ width: '60%', maxWidth: '200px' }}
                    />
                    <Typography variant="h4" gutterBottom>
                        创建新班级
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        请按步骤填写班级信息
                    </Typography>
                </Box>

                {/* 步骤指示器 */}
                <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {/* 错误提示 */}
                {error && (
                    <Alert 
                        severity="error" 
                        sx={{ mb: 3 }}
                        onClose={handleClearError}
                    >
                        {error}
                    </Alert>
                )}

                {/* 步骤内容 */}
                <Box sx={{ mb: 4 }}>
                    {renderStepContent(activeStep)}
                </Box>

                {/* 操作按钮 */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Button
                        disabled={activeStep === 0}
                        onClick={handleBack}
                        variant="outlined"
                    >
                        上一步
                    </Button>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant="outlined"
                            onClick={() => navigate('/Admin/classes')}
                        >
                            取消
                        </Button>

                        {activeStep === steps.length - 1 ? (
                            <GreenButton
                                variant="contained"
                                onClick={handleSubmit}
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={20} /> : <ClassIcon />}
                            >
                                {loading ? '创建中...' : '创建班级'}
                            </GreenButton>
                        ) : (
                            <BlueButton
                                variant="contained"
                                onClick={handleNext}
                            >
                                下一步
                            </BlueButton>
                        )}
                    </Box>
                </Box>
            </StyledBox>
        </StyledContainer>
    );
};

export default EnhancedAddClass;

const StyledContainer = styled(Box)`
    flex: 1 1 auto;
    align-items: center;
    display: flex;
    justify-content: center;
    padding: 2rem;
`;

const StyledBox = styled(Paper)`
    max-width: 800px;
    width: 100%;
    padding: 3rem;
    background-color: white;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    border-radius: 12px;
`;
