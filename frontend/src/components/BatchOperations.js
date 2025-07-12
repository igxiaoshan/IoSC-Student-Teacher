import React, { useState } from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    List,
    ListItem,
    ListItemText,
    Checkbox,
    FormControlLabel,
    Alert,
    CircularProgress,
    Divider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';

const BatchOperations = ({ 
    selectedItems = [], 
    onBatchDelete, 
    onBatchEdit, 
    onExport, 
    onImport,
    itemType = "项目",
    showExport = true,
    showImport = true 
}) => {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const handleBatchDelete = async () => {
        if (!confirmDelete) {
            alert('请确认删除操作');
            return;
        }

        setLoading(true);
        try {
            await onBatchDelete(selectedItems);
            setDeleteDialogOpen(false);
            setConfirmDelete(false);
        } catch (error) {
            console.error('批量删除失败:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (selectedItems.length === 0) {
            alert('请先选择要导出的项目');
            return;
        }
        onExport(selectedItems);
    };

    const handleImport = (event) => {
        const file = event.target.files[0];
        if (file) {
            onImport(file);
        }
        // 重置文件输入
        event.target.value = '';
    };

    return (
        <Box sx={{ mb: 2 }}>
            {selectedItems.length > 0 && (
                <Box sx={{ 
                    p: 2, 
                    bgcolor: 'primary.light', 
                    borderRadius: 1, 
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <Typography variant="body2" color="primary.contrastText">
                        已选择 {selectedItems.length} 个{itemType}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {/* 批量编辑 */}
                        {onBatchEdit && (
                            <Button
                                size="small"
                                variant="contained"
                                color="secondary"
                                startIcon={<EditIcon />}
                                onClick={() => onBatchEdit(selectedItems)}
                            >
                                批量编辑
                            </Button>
                        )}

                        {/* 批量删除 */}
                        {onBatchDelete && (
                            <Button
                                size="small"
                                variant="contained"
                                color="error"
                                startIcon={<DeleteIcon />}
                                onClick={() => setDeleteDialogOpen(true)}
                            >
                                批量删除
                            </Button>
                        )}

                        {/* 导出 */}
                        {showExport && onExport && (
                            <Button
                                size="small"
                                variant="outlined"
                                startIcon={<DownloadIcon />}
                                onClick={handleExport}
                                sx={{ color: 'primary.contrastText', borderColor: 'primary.contrastText' }}
                            >
                                导出
                            </Button>
                        )}
                    </Box>
                </Box>
            )}

            {/* 导入按钮 */}
            {showImport && onImport && (
                <Box sx={{ mb: 2 }}>
                    <input
                        accept=".csv,.xlsx,.xls"
                        style={{ display: 'none' }}
                        id="import-file-input"
                        type="file"
                        onChange={handleImport}
                    />
                    <label htmlFor="import-file-input">
                        <Button
                            variant="outlined"
                            component="span"
                            startIcon={<UploadIcon />}
                        >
                            导入{itemType}
                        </Button>
                    </label>
                </Box>
            )}

            {/* 删除确认对话框 */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    确认批量删除
                </DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        此操作将永久删除选中的{itemType}，且无法恢复！
                    </Alert>
                    
                    <Typography variant="body2" gutterBottom>
                        您即将删除以下 {selectedItems.length} 个{itemType}：
                    </Typography>
                    
                    <List dense sx={{ maxHeight: 200, overflow: 'auto', bgcolor: 'grey.50' }}>
                        {selectedItems.slice(0, 10).map((item, index) => (
                            <ListItem key={index}>
                                <ListItemText 
                                    primary={item.name || item.title || item.sclassName || item.subName || `${itemType} ${index + 1}`}
                                    secondary={item.id || item._id}
                                />
                            </ListItem>
                        ))}
                        {selectedItems.length > 10 && (
                            <ListItem>
                                <ListItemText 
                                    primary={`... 还有 ${selectedItems.length - 10} 个${itemType}`}
                                />
                            </ListItem>
                        )}
                    </List>

                    <Divider sx={{ my: 2 }} />

                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={confirmDelete}
                                onChange={(e) => setConfirmDelete(e.target.checked)}
                                color="error"
                            />
                        }
                        label={`我确认要删除这些${itemType}`}
                    />
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={() => setDeleteDialogOpen(false)}
                        disabled={loading}
                    >
                        取消
                    </Button>
                    <Button 
                        onClick={handleBatchDelete}
                        color="error"
                        variant="contained"
                        disabled={!confirmDelete || loading}
                        startIcon={loading ? <CircularProgress size={16} /> : <DeleteIcon />}
                    >
                        {loading ? '删除中...' : '确认删除'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default BatchOperations;
