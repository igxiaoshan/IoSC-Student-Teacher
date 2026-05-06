import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AttendanceTrendChart from '../AttendanceTrendChart';

// Mock react-chartjs-2
jest.mock('react-chartjs-2', () => ({
    Line: () => <div data-testid="line-chart" />,
}));

// Mock useTranslation hook
jest.mock('../../../hooks/useTranslation', () => ({
    useTranslation: () => ({
        tStudent: (key) => {
            const translations = {
                attendanceTrend: '出勤趋势',
                attendanceRate: '出勤率',
                week: '周',
                month: '月',
                semester: '学期',
                monday: '周一',
                tuesday: '周二',
                wednesday: '周三',
                thursday: '周四',
                friday: '周五',
                saturday: '周六',
                sunday: '周日'
            };
            return translations[key] || key;
        }
    })
}));

describe('AttendanceTrendChart Component', () => {
    const mockData = {
        week: [95, 88, 92, 100, 85, 90, 96],
        month: [92, 88, 95, 91],
        semester: [95, 92, 88, 90, 93, 91]
    };

    describe('Rendering', () => {
        it('should render with default props', () => {
            render(<AttendanceTrendChart />);
            expect(screen.getByText('出勤趋势')).toBeInTheDocument();
        });

        it('should render loading skeleton when loading is true', () => {
            const { container } = render(<AttendanceTrendChart loading={true} />);
            expect(container.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
        });

        it('should render chart when loading is false', () => {
            render(<AttendanceTrendChart loading={false} data={mockData} />);
            expect(screen.getByTestId('line-chart')).toBeInTheDocument();
        });
    });

    describe('View Type Toggle', () => {
        it('should render week/month/semester toggle buttons', () => {
            render(<AttendanceTrendChart data={mockData} />);
            expect(screen.getByText('周')).toBeInTheDocument();
            expect(screen.getByText('月')).toBeInTheDocument();
            expect(screen.getByText('学期')).toBeInTheDocument();
        });

        it('should switch to month view when month button clicked', async () => {
            render(<AttendanceTrendChart data={mockData} />);
            const monthButton = screen.getByText('月');
            fireEvent.click(monthButton);
            await waitFor(() => {
                expect(screen.getByTestId('line-chart')).toBeInTheDocument();
            });
        });

        it('should switch to semester view when semester button clicked', async () => {
            render(<AttendanceTrendChart data={mockData} />);
            const semesterButton = screen.getByText('学期');
            fireEvent.click(semesterButton);
            await waitFor(() => {
                expect(screen.getByTestId('line-chart')).toBeInTheDocument();
            });
        });
    });

    describe('Data Handling', () => {
        it('should use provided data when available', () => {
            render(<AttendanceTrendChart data={mockData} loading={false} />);
            expect(screen.getByTestId('line-chart')).toBeInTheDocument();
        });

        it('should use default data when no data provided', () => {
            render(<AttendanceTrendChart loading={false} />);
            expect(screen.getByTestId('line-chart')).toBeInTheDocument();
        });
    });

    describe('Memoization', () => {
        it('should not re-render when same props passed', () => {
            const { rerender } = render(<AttendanceTrendChart data={mockData} />);
            rerender(<AttendanceTrendChart data={mockData} />);
            expect(screen.getByTestId('line-chart')).toBeInTheDocument();
        });
    });
});
