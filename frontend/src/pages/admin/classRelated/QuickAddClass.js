import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Grid, FormControl, InputLabel,
    Select, MenuItem, Alert, CircularProgress, Box,
    Typography, Chip, IconButton
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { createClass } from '../../../redux/sclassRelated/sclassHandle';
import { BlueButton, GreenButton } from '../../../components/buttonStyles';

const QuickAddClass = ({ open, onClose, onSuccess }) => {
    const dispatch = useDispatch();
    const { currentUser } = useSelector(state => state.user);
    const { loading } = useSelector(state => state.sclass);

    const [formData, setFormData] = useState({
        sclassName: '',
        grade: '',
        maxStudents: 50,
        academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)
    });

    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState(false);

    // 年级选项
    const gradeOptions = [
        '一年级', '二年级', '三年级', '四年级', '五年级', '六年级',
        '初一', '初二', '初三',
        '高一', '高二', '高三'
    ];

    // 处理输入变化
    const handleChange = (field) => (event) => {
        setFormData(prev => ({
            ...prev,
            [field]: event.target.value
        }));

        // 清除错误
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: null
            }));
        }
    };

    // 验证表单
    const validateForm = () => {
        const newErrors = {};

        if (!formData.sclassName.trim()) {
            newErrors.sclassName = '班级名称不能为空';
        }

        if (formData.maxStudents < 1 || formData.maxStudents > 100) {
            newErrors.maxStudents = '最大学生数必须在1-100之间';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // 提交表单
    const handleSubmit = async () => {
        if (!validateForm()) return;

        const classData = {
            ...formData,
            adminID: currentUser._id,
            description: `${formData.grade} ${formData.sclassName}`,
            status: 'active'
        };

        try {
            const result = await dispatch(createClass(classData));
            
            if (result.success) {
                setSuccess(true);
                setTimeout(() => {
                    handleClose();
                    if (onSuccess) onSuccess(result.data);
                }, 1500);
            }
        } catch (err) {
            console.error('创建班级失败:', err);
        }
    };

    // 关闭对话框
    const handleClose = () => {
        setFormData({
            sclassName: '',
            grade: '',
            maxStudents: 50,
            academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)
        });
        setErrors({});
        setSuccess(false);
        onClose();
    };

    // 生成班级名称建议
    const generateClassNames = (grade) => {
        if (!grade) return [];
        return [
            `${grade}(1)班`,
            `${grade}(2)班`,
            `${grade}(3)班`,
            `${grade}(4)班`,
            `${grade}(5)班`
        ];
    };

    const suggestedNames = generateClassNames(formData.grade);

    return (
        <Dialog 
            open={open} 
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 2 }
            }}
        >
            <DialogTitle sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6">
                        快速创建班级
                    </Typography>
                    <IconButton onClick={handleClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent>
                {success ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                        <Typography variant="h6" color="success.main" gutterBottom>
                            ✅ 班级创建成功！
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            正在关闭对话框...
                        </Typography>
                    </Box>
                ) : (
                    <Grid container spacing={3} sx={{ mt: 1 }}>
                        {/* 年级选择 */}
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>年级 *</InputLabel>
                                <Select
                                    value={formData.grade}
                                    label="年级 *"
                                    onChange={handleChange('grade')}
                                    error={!!errors.grade}
                                >
                                    {gradeOptions.map((grade) => (
                                        <MenuItem key={grade} value={grade}>
                                            {grade}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* 班级名称建议 */}
                        {suggestedNames.length > 0 && (
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" gutterBottom>
                                    建议的班级名称：
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {suggestedNames.map((name) => (
                                        <Chip
                                            key={name}
                                            label={name}
                                            onClick={() => setFormData(prev => ({ ...prev, sclassName: name }))}
                                            variant={formData.sclassName === name ? 'filled' : 'outlined'}
                                            color={formData.sclassName === name ? 'primary' : 'default'}
                                            size="small"
                                            clickable
                                        />
                                    ))}
                                </Box>
                            </Grid>
                        )}

                        {/* 班级名称 */}
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="班级名称 *"
                                value={formData.sclassName}
                                onChange={handleChange('sclassName')}
                                error={!!errors.sclassName}
                                helperText={errors.sclassName || '例如：高一(1)班'}
                                placeholder="请输入班级名称"
                            />
                        </Grid>

                        {/* 最大学生数 */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="最大学生数"
                                type="number"
                                value={formData.maxStudents}
                                onChange={handleChange('maxStudents')}
                                error={!!errors.maxStudents}
                                helperText={errors.maxStudents}
                                inputProps={{ min: 1, max: 100 }}
                            />
                        </Grid>

                        {/* 学年 */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="学年"
                                value={formData.academicYear}
                                onChange={handleChange('academicYear')}
                                placeholder="2023-2024"
                                helperText="格式：YYYY-YYYY"
                            />
                        </Grid>

                        {/* 预览信息 */}
                        {formData.sclassName && formData.grade && (
                            <Grid item xs={12}>
                                <Alert severity="info" sx={{ mt: 2 }}>
                                    <Typography variant="subtitle2">
                                        预览：{formData.grade} {formData.sclassName}
                                    </Typography>
                                    <Typography variant="body2">
                                        最大容量：{formData.maxStudents} 人 | 学年：{formData.academicYear}
                                    </Typography>
                                </Alert>
                            </Grid>
                        )}
                    </Grid>
                )}
            </DialogContent>

            {!success && (
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={handleClose} disabled={loading}>
                        取消
                    </Button>
                    <GreenButton
                        onClick={handleSubmit}
                        disabled={loading || !formData.sclassName || !formData.grade}
                        startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
                    >
                        {loading ? '创建中...' : '创建班级'}
                    </GreenButton>
                </DialogActions>
            )}
        </Dialog>
    );
};

export default QuickAddClass;
