import React from 'react';
import { Alert, Slide, Button } from '@mui/material';
import { useTranslation } from '../../hooks/useTranslation';

/**
 * 教师端通用消息提示组件
 * 统一所有页面的操作结果反馈
 *
 * @param {Object} props
 * @param {string} props.type - 消息类型: 'success' | 'error' | 'warning' | 'info'
 * @param {string} props.text - 消息文本
 * @param {Function} props.onClose - 关闭回调
 * @param {boolean} props.autoHide - 是否自动消失
 * @param {number} props.autoHideDuration - 自动消失时间(ms)
 */
const TeacherMessage = ({
    type,
    text,
    onClose,
    autoHide = true,
    autoHideDuration = 4000
}) => {
    const { tCommon } = useTranslation();

    return (
        <Alert
            severity={type}
            onClose={onClose}
            sx={{ mb: 3 }}
            TransitionComponent={Slide}
            action={
                !autoHide && (
                    <Button
                        color="inherit"
                        size="small"
                        onClick={onClose}
                    >
                        {tCommon('close') || '关闭'}
                    </Button>
                )
            }
        >
            {text}
        </Alert>
    );
};

export default TeacherMessage;