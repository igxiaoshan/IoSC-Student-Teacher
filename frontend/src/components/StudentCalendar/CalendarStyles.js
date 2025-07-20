import { styled } from '@mui/material/styles';
import { Box, Paper, Card } from '@mui/material';

// 日历容器样式
export const CalendarContainer = styled(Box)(({ theme }) => ({
    padding: theme.spacing(3),
    minHeight: '100vh',
    backgroundColor: theme.palette.grey[50],
    
    // 响应式设计
    [theme.breakpoints.down('md')]: {
        padding: theme.spacing(2),
    },
    [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(1),
    }
}));

// 日历头部样式
export const CalendarHeader = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    elevation: 1,
    borderRadius: theme.spacing(1),
    
    '& .calendar-nav': {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: theme.spacing(2),
        
        [theme.breakpoints.down('md')]: {
            flexDirection: 'column',
            gap: theme.spacing(1),
        }
    },
    
    '& .date-navigation': {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1),
        
        '& .date-title': {
            minWidth: 200,
            textAlign: 'center',
            fontWeight: 600,
            
            [theme.breakpoints.down('sm')]: {
                minWidth: 150,
                fontSize: '1rem',
            }
        }
    },
    
    '& .view-controls': {
        '& .MuiButtonGroup-root': {
            '& .MuiButton-root': {
                minWidth: 60,
                
                [theme.breakpoints.down('sm')]: {
                    minWidth: 40,
                    fontSize: '0.75rem',
                }
            }
        }
    },
    
    '& .action-controls': {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1),
        
        [theme.breakpoints.down('md')]: {
            width: '100%',
            justifyContent: 'center',
        },
        
        '& .search-field': {
            width: 200,
            
            [theme.breakpoints.down('sm')]: {
                width: '100%',
                maxWidth: 250,
            }
        }
    }
}));

// 统计卡片样式
export const StatsCard = styled(Card)(({ theme }) => ({
    height: '100%',
    elevation: 1,
    borderRadius: theme.spacing(1),
    transition: 'all 0.3s ease',
    
    '&:hover': {
        elevation: 4,
        transform: 'translateY(-2px)',
    },
    
    '& .stats-content': {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        
        '& .stats-info': {
            '& .stats-label': {
                fontSize: '0.875rem',
                color: theme.palette.text.secondary,
                marginBottom: theme.spacing(0.5),
            },
            
            '& .stats-value': {
                fontSize: '2rem',
                fontWeight: 700,
                lineHeight: 1.2,
                
                [theme.breakpoints.down('sm')]: {
                    fontSize: '1.5rem',
                }
            }
        },
        
        '& .stats-icon': {
            '& .MuiAvatar-root': {
                width: 48,
                height: 48,
                
                [theme.breakpoints.down('sm')]: {
                    width: 40,
                    height: 40,
                }
            }
        }
    }
}));

// 月视图样式
export const MonthViewContainer = styled(Paper)(({ theme }) => ({
    overflow: 'hidden',
    elevation: 1,
    borderRadius: theme.spacing(1),
    
    '& .month-header': {
        backgroundColor: theme.palette.grey[50],
        
        '& .weekday-label': {
            padding: theme.spacing(2),
            fontWeight: 600,
            color: theme.palette.text.secondary,
            textAlign: 'center',
            
            [theme.breakpoints.down('sm')]: {
                padding: theme.spacing(1),
                fontSize: '0.75rem',
            }
        }
    },
    
    '& .month-grid': {
        '& .day-cell': {
            minHeight: 120,
            padding: theme.spacing(1),
            cursor: 'pointer',
            borderRight: `1px solid ${theme.palette.divider}`,
            borderBottom: `1px solid ${theme.palette.divider}`,
            transition: 'background-color 0.2s ease',
            
            [theme.breakpoints.down('md')]: {
                minHeight: 100,
            },
            [theme.breakpoints.down('sm')]: {
                minHeight: 80,
                padding: theme.spacing(0.5),
            },
            
            '&:hover': {
                backgroundColor: theme.palette.grey[50],
            },
            
            '&.today': {
                backgroundColor: theme.palette.primary.light + '20',
            },
            
            '&.selected': {
                backgroundColor: theme.palette.primary.light + '40',
            },
            
            '&.other-month': {
                backgroundColor: theme.palette.grey[25],
                color: theme.palette.text.disabled,
            },
            
            '& .day-number': {
                fontSize: '0.875rem',
                fontWeight: 500,
                
                '&.today': {
                    color: theme.palette.primary.main,
                    fontWeight: 700,
                },
                
                '&.other-month': {
                    color: theme.palette.text.disabled,
                }
            },
            
            '& .events-container': {
                marginTop: theme.spacing(0.5),
                
                '& .event-chip': {
                    fontSize: '0.65rem',
                    height: 20,
                    marginBottom: theme.spacing(0.25),
                    color: 'white',
                    transition: 'all 0.2s ease',
                    
                    [theme.breakpoints.down('sm')]: {
                        height: 16,
                        fontSize: '0.6rem',
                    },
                    
                    '&:hover': {
                        opacity: 0.8,
                        transform: 'scale(1.02)',
                    },
                    
                    '& .MuiChip-label': {
                        paddingLeft: theme.spacing(0.5),
                        paddingRight: theme.spacing(0.5),
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }
                },
                
                '& .more-events': {
                    fontSize: '0.6rem',
                    textAlign: 'center',
                    color: theme.palette.text.secondary,
                }
            }
        }
    }
}));

// 周视图和日视图样式
export const TimeViewContainer = styled(Paper)(({ theme }) => ({
    overflow: 'auto',
    maxHeight: 600,
    elevation: 1,
    borderRadius: theme.spacing(1),
    
    '& .time-header': {
        position: 'sticky',
        top: 0,
        backgroundColor: theme.palette.background.paper,
        zIndex: 2,
        borderBottom: `1px solid ${theme.palette.divider}`,
        
        '& .day-header': {
            height: 60,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderRight: `1px solid ${theme.palette.divider}`,
            
            '&.today': {
                backgroundColor: theme.palette.primary.light + '20',
            },
            
            '& .day-name': {
                fontSize: '0.75rem',
                color: theme.palette.text.secondary,
            },
            
            '& .day-number': {
                fontSize: '1.25rem',
                fontWeight: 500,
                
                '&.today': {
                    color: theme.palette.primary.main,
                    fontWeight: 700,
                }
            }
        }
    },
    
    '& .time-column': {
        width: 80,
        backgroundColor: theme.palette.grey[50],
        position: 'sticky',
        left: 0,
        zIndex: 1,
        
        '& .hour-slot': {
            height: 60,
            borderBottom: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            
            '& .hour-label': {
                fontSize: '0.75rem',
                color: theme.palette.text.secondary,
            }
        }
    },
    
    '& .time-grid': {
        position: 'relative',
        
        '& .hour-slot': {
            height: 60,
            borderBottom: `1px solid ${theme.palette.divider}`,
            borderRight: `1px solid ${theme.palette.divider}`,
        },
        
        '& .event-overlay': {
            position: 'absolute',
            left: 4,
            right: 4,
            borderRadius: theme.spacing(0.5),
            padding: theme.spacing(0.5),
            cursor: 'pointer',
            overflow: 'hidden',
            transition: 'all 0.2s ease',
            color: 'white',
            
            '&:hover': {
                opacity: 0.8,
                transform: 'scale(1.02)',
            },
            
            '& .event-title': {
                fontSize: '0.75rem',
                fontWeight: 600,
                marginBottom: theme.spacing(0.25),
            },
            
            '& .event-time': {
                fontSize: '0.65rem',
                opacity: 0.9,
            }
        }
    }
}));

// 侧边栏样式
export const SidebarContainer = styled(Box)(({ theme }) => ({
    '& .sidebar-card': {
        elevation: 1,
        borderRadius: theme.spacing(1),
        marginBottom: theme.spacing(2),
        
        '& .card-header': {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: theme.spacing(2),
            
            '& .card-title': {
                fontSize: '1.125rem',
                fontWeight: 600,
            }
        },
        
        '& .event-list': {
            '& .event-item': {
                borderRadius: theme.spacing(0.5),
                marginBottom: theme.spacing(0.5),
                transition: 'background-color 0.2s ease',
                
                '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                },
                
                '& .event-icon': {
                    minWidth: 36,
                    
                    '& .MuiAvatar-root': {
                        width: 24,
                        height: 24,
                    }
                },
                
                '& .event-content': {
                    '& .event-title': {
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        marginBottom: theme.spacing(0.25),
                    },
                    
                    '& .event-time': {
                        fontSize: '0.75rem',
                        color: theme.palette.text.secondary,
                    },
                    
                    '& .event-relative-time': {
                        fontSize: '0.75rem',
                        color: theme.palette.text.secondary,
                        marginLeft: theme.spacing(1),
                    }
                }
            }
        },
        
        '& .empty-state': {
            textAlign: 'center',
            padding: theme.spacing(3),
            
            '& .empty-icon': {
                fontSize: 48,
                color: theme.palette.text.disabled,
                marginBottom: theme.spacing(1),
            },
            
            '& .empty-text': {
                fontSize: '0.875rem',
                color: theme.palette.text.secondary,
            }
        }
    },
    
    '& .quick-actions': {
        '& .action-button': {
            marginBottom: theme.spacing(1),
            
            '&:last-child': {
                marginBottom: 0,
            }
        }
    }
}));

// 对话框样式
export const DialogContainer = styled(Box)(({ theme }) => ({
    '& .dialog-header': {
        paddingBottom: theme.spacing(1),
        
        '& .dialog-title': {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            
            '& .title-content': {
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing(1),
                
                '& .title-text': {
                    fontSize: '1.25rem',
                    fontWeight: 600,
                }
            }
        }
    },
    
    '& .dialog-content': {
        '& .form-section': {
            marginBottom: theme.spacing(2),
            
            '&:last-child': {
                marginBottom: 0,
            }
        },
        
        '& .form-grid': {
            '& .form-item': {
                marginBottom: theme.spacing(2),
                
                '&:last-child': {
                    marginBottom: 0,
                }
            }
        }
    },
    
    '& .dialog-actions': {
        padding: theme.spacing(2, 3),
        
        '& .action-button': {
            minWidth: 80,
        }
    }
}));

// 动画样式
export const AnimationStyles = {
    fadeIn: {
        '@keyframes fadeIn': {
            from: { opacity: 0, transform: 'translateY(10px)' },
            to: { opacity: 1, transform: 'translateY(0)' }
        },
        animation: 'fadeIn 0.3s ease-out'
    },
    
    slideIn: {
        '@keyframes slideIn': {
            from: { transform: 'translateX(-100%)' },
            to: { transform: 'translateX(0)' }
        },
        animation: 'slideIn 0.3s ease-out'
    },
    
    rotate: {
        '@keyframes rotate': {
            from: { transform: 'rotate(0deg)' },
            to: { transform: 'rotate(360deg)' }
        },
        animation: 'rotate 1s linear infinite'
    },
    
    pulse: {
        '@keyframes pulse': {
            '0%': { transform: 'scale(1)' },
            '50%': { transform: 'scale(1.05)' },
            '100%': { transform: 'scale(1)' }
        },
        animation: 'pulse 2s ease-in-out infinite'
    }
};
