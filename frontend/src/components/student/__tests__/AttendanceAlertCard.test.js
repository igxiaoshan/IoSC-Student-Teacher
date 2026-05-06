import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AttendanceAlertCard from '../AttendanceAlertCard';

// Mock studentAPI
jest.mock('../../../utils/apiClient', () => ({
    studentAPI: {
        getAttendanceAlerts: jest.fn()
    }
}));

const { studentAPI } = require('../../../utils/apiClient');

describe('AttendanceAlertCard Component', () => {
    const mockStudentId = 'student-123';

    const mockAlertsData = {
        alerts: [
            {
                type: 'consecutive_absence',
                severity: 'high',
                message: '连续缺勤 5 天',
                details: {
                    currentStreak: 5,
                    maxStreak: 7
                }
            },
            {
                type: 'subject_absence_rate',
                severity: 'medium',
                message: '数学 缺勤率达 35%',
                details: {
                    subjectId: 'subject-1',
                    subjectName: '数学',
                    absenceRate: 35,
                    present: 13,
                    absent: 7,
                    total: 20
                }
            }
        ],
        analysis: {
            subjects: [
                { subjectName: '数学', absenceRate: 35 },
                { subjectName: '英语', absenceRate: 45 }
            ],
            consecutive: {
                currentStreak: 5,
                maxStreak: 7
            }
        },
        period: 30
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Loading State', () => {
        it('should show loading state initially', async () => {
            studentAPI.getAttendanceAlerts.mockImplementation(() => new Promise(() => {}));
            render(<AttendanceAlertCard studentId={mockStudentId} />);
            expect(screen.getByText(/加载预警数据中/i)).toBeInTheDocument();
        });
    });

    describe('Success State - With Alerts', () => {
        it('should display alerts when data received', async () => {
            studentAPI.getAttendanceAlerts.mockResolvedValue({
                data: mockAlertsData
            });
            render(<AttendanceAlertCard studentId={mockStudentId} />);

            await waitFor(() => {
                expect(screen.getByText('出勤预警')).toBeInTheDocument();
            });
        });

        it('should show alert count badge', async () => {
            studentAPI.getAttendanceAlerts.mockResolvedValue({
                data: mockAlertsData
            });
            render(<AttendanceAlertCard studentId={mockStudentId} />);

            await waitFor(() => {
                expect(screen.getByText('2 条')).toBeInTheDocument();
            });
        });

        it('should display alert messages', async () => {
            studentAPI.getAttendanceAlerts.mockResolvedValue({
                data: mockAlertsData
            });
            render(<AttendanceAlertCard studentId={mockStudentId} />);

            await waitFor(() => {
                expect(screen.getByText(/连续缺勤 5 天/i)).toBeInTheDocument();
                expect(screen.getByText(/数学 缺勤率达 35%/i)).toBeInTheDocument();
            });
        });

        it('should show severity badges', async () => {
            studentAPI.getAttendanceAlerts.mockResolvedValue({
                data: mockAlertsData
            });
            render(<AttendanceAlertCard studentId={mockStudentId} />);

            await waitFor(() => {
                expect(screen.getByText('高危')).toBeInTheDocument();
                expect(screen.getByText('中等')).toBeInTheDocument();
            });
        });
    });

    describe('Success State - No Alerts', () => {
        it('should show success message when no alerts', async () => {
            studentAPI.getAttendanceAlerts.mockResolvedValue({
                data: { alerts: [], period: 30 }
            });
            render(<AttendanceAlertCard studentId={mockStudentId} />);

            await waitFor(() => {
                expect(screen.getByText(/出勤状态良好/i)).toBeInTheDocument();
            });
        });
    });

    describe('Error State', () => {
        it('should show error message on API failure', async () => {
            studentAPI.getAttendanceAlerts.mockRejectedValue(new Error('获取预警数据失败'));
            render(<AttendanceAlertCard studentId={mockStudentId} />);

            await waitFor(() => {
                expect(screen.getByText(/获取预警数据失败/i)).toBeInTheDocument();
            });
        });
    });

    describe('Expand/Collapse', () => {
        it('should toggle expanded state when button clicked', async () => {
            studentAPI.getAttendanceAlerts.mockResolvedValue({
                data: mockAlertsData
            });
            render(<AttendanceAlertCard studentId={mockStudentId} />);

            await waitFor(() => {
                expect(screen.getByText('出勤预警')).toBeInTheDocument();
            });

            const toggleButton = screen.getByRole('button', { name: /收起|展开/i });
            fireEvent.click(toggleButton);

            await waitFor(() => {
                expect(toggleButton).toBeInTheDocument();
            });
        });
    });

    describe('Props Handling', () => {
        it('should not fetch if no studentId', () => {
            render(<AttendanceAlertCard />);
            expect(studentAPI.getAttendanceAlerts).not.toHaveBeenCalled();
        });

        it('should pass days parameter to API', async () => {
            studentAPI.getAttendanceAlerts.mockResolvedValue({
                data: { alerts: [], period: 14 }
            });
            render(<AttendanceAlertCard studentId={mockStudentId} days={14} />);

            await waitFor(() => {
                expect(studentAPI.getAttendanceAlerts).toHaveBeenCalledWith(
                    mockStudentId,
                    { days: 14 }
                );
            });
        });
    });

    describe('Subject Summary', () => {
        it('should show subject absence rate when high risk subjects exist', async () => {
            const dataWithHighRisk = {
                ...mockAlertsData,
                analysis: {
                    ...mockAlertsData.analysis,
                    subjects: [
                        { subjectName: '数学', absenceRate: 45 },
                        { subjectName: '英语', absenceRate: 50 }
                    ]
                }
            };
            studentAPI.getAttendanceAlerts.mockResolvedValue({
                data: dataWithHighRisk
            });
            render(<AttendanceAlertCard studentId={mockStudentId} showDetails={true} />);

            await waitFor(() => {
                expect(screen.getByText(/科目缺勤率/i)).toBeInTheDocument();
            });
        });
    });
});
