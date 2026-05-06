const request = require('supertest');
const express = require('express');

const Student = require('../models/studentSchema');
const Subject = require('../models/subjectSchema');
const {
    getStudentAttendanceTrend,
    getClassAttendanceTrend,
    getAttendanceAlerts,
    getStudentAttendanceAlerts,
    getStudentSubjectAbsence
} = require('../controllers/attendanceTrend-controller');

const createApp = () => {
    const app = express();
    app.use(express.json());

    app.get('/student/:studentId/attendance/trend', getStudentAttendanceTrend);
    app.get('/class/:classId/attendance/trend', getClassAttendanceTrend);
    app.get('/attendance/alerts/:classId?', getAttendanceAlerts);
    app.get('/StudentAttendanceAlerts/:studentId', getStudentAttendanceAlerts);
    app.get('/StudentSubjectAbsence/:studentId', getStudentSubjectAbsence);

    return app;
};

describe('Attendance Trend Controller', () => {
    const mockStudentId = 'student-123';
    const mockClassId = 'class-456';

    const mockStudent = {
        _id: mockStudentId,
        name: '张三',
        rollNum: 'STU001',
        sclassName: { sclassName: '高一1班' },
        attendance: [
            { date: new Date('2026-04-20'), status: 'Present', subName: { _id: 'sub-1', subName: '数学' } },
            { date: new Date('2026-04-21'), status: 'Present', subName: { _id: 'sub-1', subName: '数学' } },
            { date: new Date('2026-04-22'), status: 'Absent', subName: { _id: 'sub-1', subName: '数学' } },
            { date: new Date('2026-04-23'), status: 'Present', subName: { _id: 'sub-2', subName: '英语' } },
            { date: new Date('2026-04-24'), status: 'Present', subName: { _id: 'sub-2', subName: '英语' } }
        ]
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /student/:studentId/attendance/trend', () => {
        it('should return student attendance trend', async () => {
            const mockPopulate = jest.fn().mockResolvedValue(mockStudent);
            Student.findById = jest.fn().mockReturnValue({
                populate: mockPopulate
            });

            const app = createApp();
            const res = await request(app)
                .get(`/student/${mockStudentId}/attendance/trend`)
                .query({ days: 7 });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('studentId');
            expect(res.body.data).toHaveProperty('summary');
            expect(res.body.data).toHaveProperty('trend');
        });

        it('should return 404 if student not found', async () => {
            const mockPopulate = jest.fn().mockResolvedValue(null);
            Student.findById = jest.fn().mockReturnValue({
                populate: mockPopulate
            });

            const app = createApp();
            const res = await request(app)
                .get(`/student/${mockStudentId}/attendance/trend`);

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
        });

        it('should filter by subject if subjectId provided', async () => {
            const mockPopulate = jest.fn().mockResolvedValue(mockStudent);
            Student.findById = jest.fn().mockReturnValue({
                populate: mockPopulate
            });

            const app = createApp();
            const res = await request(app)
                .get(`/student/${mockStudentId}/attendance/trend`)
                .query({ days: 7, subjectId: 'sub-1' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe('GET /class/:classId/attendance/trend', () => {
        it('should return class attendance trend', async () => {
            Student.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue([mockStudent])
            });

            const app = createApp();
            const res = await request(app)
                .get(`/class/${mockClassId}/attendance/trend`)
                .query({ days: 7 });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('classId');
            expect(res.body.data).toHaveProperty('totalStudents');
        });

        it('should return 404 if no students found', async () => {
            Student.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue([])
            });

            const app = createApp();
            const res = await request(app)
                .get(`/class/${mockClassId}/attendance/trend`);

            expect(res.status).toBe(404);
        });
    });

    describe('GET /StudentAttendanceAlerts/:studentId', () => {
        it('should return student attendance alerts', async () => {
            const mockPopulate2 = jest.fn().mockResolvedValue(mockStudent);
            const mockPopulate1 = jest.fn().mockReturnValue({
                populate: mockPopulate2
            });
            Student.findById = jest.fn().mockReturnValue({
                populate: mockPopulate1
            });

            const app = createApp();
            const res = await request(app)
                .get(`/StudentAttendanceAlerts/${mockStudentId}`)
                .query({ days: 30 });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('alerts');
            expect(res.body.data).toHaveProperty('analysis');
        });

        it('should identify consecutive absences', async () => {
            const studentWithConsecutiveAbsence = {
                ...mockStudent,
                attendance: [
                    { date: new Date('2026-04-20'), status: 'Absent', subName: { _id: 'sub-1', subName: '数学' } },
                    { date: new Date('2026-04-21'), status: 'Absent', subName: { _id: 'sub-1', subName: '数学' } },
                    { date: new Date('2026-04-22'), status: 'Absent', subName: { _id: 'sub-1', subName: '数学' } },
                    { date: new Date('2026-04-23'), status: 'Absent', subName: { _id: 'sub-1', subName: '数学' } }
                ]
            };

            const mockPopulate2 = jest.fn().mockResolvedValue(studentWithConsecutiveAbsence);
            const mockPopulate1 = jest.fn().mockReturnValue({
                populate: mockPopulate2
            });
            Student.findById = jest.fn().mockReturnValue({
                populate: mockPopulate1
            });

            const app = createApp();
            const res = await request(app)
                .get(`/StudentAttendanceAlerts/${mockStudentId}`)
                .query({ consecutiveThreshold: 3 });

            expect(res.status).toBe(200);
            expect(res.body.data.alerts.length).toBeGreaterThan(0);
        });
    });

    describe('GET /StudentSubjectAbsence/:studentId', () => {
        it('should return subject absence analysis', async () => {
            const mockPopulate = jest.fn().mockResolvedValue(mockStudent);
            Student.findById = jest.fn().mockReturnValue({
                populate: mockPopulate
            });

            const app = createApp();
            const res = await request(app)
                .get(`/StudentSubjectAbsence/${mockStudentId}`)
                .query({ days: 30 });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('subjects');
            expect(res.body.data).toHaveProperty('riskCategories');
        });

        it('should categorize subjects by risk level', async () => {
            const mockPopulate = jest.fn().mockResolvedValue(mockStudent);
            Student.findById = jest.fn().mockReturnValue({
                populate: mockPopulate
            });

            const app = createApp();
            const res = await request(app)
                .get(`/StudentSubjectAbsence/${mockStudentId}`);

            expect(res.status).toBe(200);
            expect(res.body.data.riskCategories).toHaveProperty('high');
            expect(res.body.data.riskCategories).toHaveProperty('medium');
            expect(res.body.data.riskCategories).toHaveProperty('low');
            expect(res.body.data.riskCategories).toHaveProperty('healthy');
        });
    });

    describe('Error Handling', () => {
        it('should handle database errors gracefully', async () => {
            const mockPopulate = jest.fn().mockRejectedValue(new Error('Database error'));
            Student.findById = jest.fn().mockReturnValue({
                populate: mockPopulate
            });

            const app = createApp();
            const res = await request(app)
                .get(`/student/${mockStudentId}/attendance/trend`);

            expect(res.status).toBe(500);
            expect(res.body.success).toBe(false);
        });
    });
});
