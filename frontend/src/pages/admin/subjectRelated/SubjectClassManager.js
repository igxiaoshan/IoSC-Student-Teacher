import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    List, ListItem, ListItemText, ListItemSecondaryAction,
    IconButton, Chip, Typography, Box, Alert, Divider,
    FormControl, InputLabel, Select, MenuItem, CircularProgress
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Add as AddIcon,
    Class as ClassIcon
} from '@mui/icons-material';
import { getAllSclasses } from '../../../redux/sclassRelated/sclassHandle';
import axios from 'axios';

const SubjectClassManager = ({ open, onClose, subject, onUpdate }) => {
    const dispatch = useDispatch();
    const { sclassesList } = useSelector((state) => state.sclass);
    const { currentUser } = useSelector(state => state.user);

    const [loading, setLoading] = useState(false);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('info');

    useEffect(() => {
        if (open && currentUser?._id) {
            dispatch(getAllSclasses(currentUser._id, "Sclass"));
        }
    }, [open, currentUser, dispatch]);

    // 获取可添加的班级列表（排除已关联的班级）
    const getAvailableClasses = () => {
        if (!sclassesList || !subject) return [];
        
        const associatedClassIds = [
            subject.sclassID,
            ...(subject.additionalClasses?.map(cls => cls._id || cls) || [])
        ].filter(Boolean);

        return sclassesList.filter(cls => !associatedClassIds.includes(cls._id));
    };

    // 添加班级关联
    const handleAddClass = async () => {
        if (!selectedClassId) {
            setMessage('请选择要添加的班级');
            setMessageType('warning');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/Subject/addClass`, {
                subjectId: subject.id,
                classId: selectedClassId
            });

            if (response.data.success) {
                setMessage('班级关联添加成功');
                setMessageType('success');
                setSelectedClassId('');
                if (onUpdate) onUpdate();
            } else {
                setMessage(response.data.message || '添加失败');
                setMessageType('error');
            }
        } catch (error) {
            setMessage(error.response?.data?.message || '添加班级关联失败');
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    // 移除班级关联
    const handleRemoveClass = async (classId) => {
        if (classId === subject.sclassID) {
            setMessage('不能移除主班级关联');
            setMessageType('warning');
            return;
        }

        if (!window.confirm('确定要移除这个班级关联吗？')) {
            return;
        }

        setLoading(true);
        try {
            const response = await axios.delete(`${process.env.REACT_APP_BASE_URL}/Subject/removeClass`, {
                data: {
                    subjectId: subject.id,
                    classId: classId
                }
            });

            if (response.data.success) {
                setMessage('班级关联移除成功');
                setMessageType('success');
                if (onUpdate) onUpdate();
            } else {
                setMessage(response.data.message || '移除失败');
                setMessageType('error');
            }
        } catch (error) {
            setMessage(error.response?.data?.message || '移除班级关联失败');
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    const availableClasses = getAvailableClasses();

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ClassIcon />
                    管理科目班级关联 - {subject?.subName}
                </Box>
            </DialogTitle>
            
            <DialogContent>
                {message && (
                    <Alert severity={messageType} sx={{ mb: 2 }} onClose={() => setMessage('')}>
                        {message}
                    </Alert>
                )}

                {/* 当前关联的班级 */}
                <Typography variant="h6" gutterBottom>
                    当前关联的班级
                </Typography>
                
                <List>
                    {/* 主班级 */}
                    <ListItem>
                        <ListItemText
                            primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {subject?.sclassName || '未知班级'}
                                    <Chip label="主班级" color="primary" size="small" />
                                </Box>
                            }
                            secondary="这是科目的主要关联班级，不能移除"
                        />
                    </ListItem>

                    {/* 附加班级 */}
                    {subject?.additionalClasses?.map((classItem, index) => (
                        <ListItem key={index}>
                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {classItem?.sclassName || '未知班级'}
                                        <Chip label="关联班级" color="secondary" size="small" />
                                    </Box>
                                }
                                secondary={`年级: ${classItem?.grade || '未设置'}`}
                            />
                            <ListItemSecondaryAction>
                                <IconButton
                                    edge="end"
                                    onClick={() => handleRemoveClass(classItem._id || classItem)}
                                    disabled={loading}
                                    color="error"
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                </List>

                <Divider sx={{ my: 2 }} />

                {/* 添加新的班级关联 */}
                <Typography variant="h6" gutterBottom>
                    添加班级关联
                </Typography>

                {availableClasses.length > 0 ? (
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <FormControl sx={{ minWidth: 200, flexGrow: 1 }}>
                            <InputLabel>选择班级</InputLabel>
                            <Select
                                value={selectedClassId}
                                label="选择班级"
                                onChange={(e) => setSelectedClassId(e.target.value)}
                                disabled={loading}
                            >
                                {availableClasses.map((classItem) => (
                                    <MenuItem key={classItem._id} value={classItem._id}>
                                        {classItem.sclassName} {classItem.grade && `(${classItem.grade})`}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        
                        <Button
                            variant="contained"
                            startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
                            onClick={handleAddClass}
                            disabled={loading || !selectedClassId}
                        >
                            {loading ? '添加中...' : '添加关联'}
                        </Button>
                    </Box>
                ) : (
                    <Alert severity="info">
                        没有可添加的班级。所有班级都已经与此科目关联。
                    </Alert>
                )}

                {/* 统计信息 */}
                <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        关联统计
                    </Typography>
                    <Typography variant="body2">
                        总关联班级数: {1 + (subject?.additionalClasses?.length || 0)}
                    </Typography>
                    <Typography variant="body2">
                        可添加班级数: {availableClasses.length}
                    </Typography>
                </Box>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} disabled={loading}>
                    关闭
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SubjectClassManager;
