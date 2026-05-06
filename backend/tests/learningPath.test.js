const request = require('supertest');
const express = require('express');

const Student = require('../models/studentSchema');
const Subject = require('../models/subjectSchema');
const Answer = require('../models/answerSchema');
const PracticeRecord = require('../models/practiceRecordSchema');
const KnowledgeBase = require('../models/knowledgeBaseSchema');
const LearningPath = require('../models/learningPathSchema');
const learningPathService = require('../services/learningPathService');
const {
    generateLearningPath,
    getLearningPathProgress,
    updateLearningPath,
    getLearningRecommendations,
    getKnowledgeMap,
    recordLearningActivity,
    getDailyRecommendations,
    getStudentLearningPaths,
    toggleLearningPathStatus
} = require('../controllers/learningPath-controller');

const createApp = () => {
    const app = express();
    app.use(express.json());

    app.post('/student/:studentId/learning-path', generateLearningPath);
    app.get('/student/:studentId/learning-path/progress', getLearningPathProgress);
    app.put('/student/:studentId/learning-path', updateLearningPath);
    app.get('/student/:studentId/learning-path/recommendations', getLearningRecommendations);
    app.get('/student/:studentId/learning-path/knowledge-map', getKnowledgeMap);
    app.post('/student/:studentId/learning-path/activity', recordLearningActivity);
    app.get('/student/:studentId/learning-path/daily', getDailyRecommendations);
    app.get('/student/:studentId/learning-paths', getStudentLearningPaths);
    app.put('/student/:studentId/learning-path/:pathId/status', toggleLearningPathStatus);

    return app;
};

describe('Learning Path Controller', () => {
    const mockStudentId = 'student-123';
    const mockSubjectId = 'subject-456';
    const mockPathId = 'path-789';

    const mockStudent = {
        _id: mockStudentId,
        name: '张三',
        sclassName: { sclassName: '高一1班' },
        school: { schoolName: '第一中学' }
    };

    const mockLearningPath = {
        _id: mockPathId,
        student: mockStudentId,
        subject: mockSubjectId,
        status: 'active',
        progress: 30,
        totalDuration: 10,
        aiGenerated: true,
        phases: [
            { id: 'phase-1', name: '基础学习', status: 'completed', progress: 100 },
            { id: 'phase-2', name: '进阶练习', status: 'in_progress', progress: 20 }
        ],
        personalizedElements: { difficulty: 'intermediate' },
        learningActivities: [],
        updateHistory: [],
        generatedAt: new Date(),
        lastUpdated: new Date(),
        calculateProgress: jest.fn().mockReturnValue(30),
        getCurrentPhase: jest.fn().mockReturnValue({ id: 'phase-2', name: '进阶练习' }),
        addActivity: jest.fn(),
        save: jest.fn().mockResolvedValue(true)
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /student/:studentId/learning-path', () => {
        it('should generate learning path successfully', async () => {
            const mockPopulate2 = jest.fn().mockResolvedValue(mockStudent);
            const mockPopulate1 = jest.fn().mockReturnValue({
                populate: mockPopulate2
            });
            Student.findById = jest.fn().mockReturnValue({
                populate: mockPopulate1
            });
            LearningPath.findActiveByStudentSubject = jest.fn().mockResolvedValue(null);
            learningPathService.createLearningPath = jest.fn().mockResolvedValue(mockLearningPath);
            LearningPath.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockLearningPath)
            });

            const app = createApp();
            const res = await request(app)
                .post(`/student/${mockStudentId}/learning-path`)
                .send({
                    subject: mockSubjectId,
                    learningGoals: ['掌握基础', '提高成绩'],
                    timeframe: 30,
                    useAI: true
                });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('学习路径生成成功');
            expect(res.body.data).toHaveProperty('learningPath');
        });

        it('should return 404 if student not found', async () => {
            const mockPopulate2 = jest.fn().mockResolvedValue(null);
            const mockPopulate1 = jest.fn().mockReturnValue({
                populate: mockPopulate2
            });
            Student.findById = jest.fn().mockReturnValue({
                populate: mockPopulate1
            });

            const app = createApp();
            const res = await request(app)
                .post(`/student/${mockStudentId}/learning-path`)
                .send({ subject: mockSubjectId });

            expect(res.status).toBe(404);
        });
    });

    describe('GET /student/:studentId/learning-path/progress', () => {
        it('should return learning path progress', async () => {
            Student.findById = jest.fn().mockResolvedValue(mockStudent);
            LearningPath.findActiveByStudentSubject = jest.fn().mockResolvedValue(mockLearningPath);

            const app = createApp();
            const res = await request(app)
                .get(`/student/${mockStudentId}/learning-path/progress`)
                .query({ subject: mockSubjectId });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('currentPath');
            expect(res.body).toHaveProperty('progress');
            expect(res.body).toHaveProperty('effectiveness');
        });

        it('should return 404 if no active learning path', async () => {
            Student.findById = jest.fn().mockResolvedValue(mockStudent);
            LearningPath.findActiveByStudentSubject = jest.fn().mockResolvedValue(null);

            const app = createApp();
            const res = await request(app)
                .get(`/student/${mockStudentId}/learning-path/progress`)
                .query({ subject: mockSubjectId });

            expect(res.status).toBe(404);
        });
    });

    describe('PUT /student/:studentId/learning-path', () => {
        it('should update learning path', async () => {
            Student.findById = jest.fn().mockResolvedValue(mockStudent);
            LearningPath.findById = jest.fn().mockResolvedValue({
                ...mockLearningPath,
                student: mockStudentId,
                updateHistory: [],
                save: jest.fn().mockResolvedValue(true)
            });

            const app = createApp();
            const res = await request(app)
                .put(`/student/${mockStudentId}/learning-path`)
                .send({
                    pathId: mockPathId,
                    updates: { totalDuration: 15 },
                    reason: '调整学习时间'
                });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('学习路径更新成功');
        });

        it('should return 404 if path not found', async () => {
            Student.findById = jest.fn().mockResolvedValue(mockStudent);
            LearningPath.findById = jest.fn().mockResolvedValue(null);

            const app = createApp();
            const res = await request(app)
                .put(`/student/${mockStudentId}/learning-path`)
                .send({ pathId: mockPathId, updates: {} });

            expect(res.status).toBe(404);
        });
    });

    describe('GET /student/:studentId/learning-paths', () => {
        it('should return all learning paths for student', async () => {
            Student.findById = jest.fn().mockResolvedValue(mockStudent);
            LearningPath.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    sort: jest.fn().mockResolvedValue([mockLearningPath])
                })
            });

            const app = createApp();
            const res = await request(app)
                .get(`/student/${mockStudentId}/learning-paths`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('paths');
            expect(Array.isArray(res.body.paths)).toBe(true);
        });

        it('should filter by status if provided', async () => {
            Student.findById = jest.fn().mockResolvedValue(mockStudent);
            LearningPath.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    sort: jest.fn().mockResolvedValue([mockLearningPath])
                })
            });

            const app = createApp();
            const res = await request(app)
                .get(`/student/${mockStudentId}/learning-paths`)
                .query({ status: 'active' });

            expect(res.status).toBe(200);
        });
    });

    describe('PUT /student/:studentId/learning-path/:pathId/status', () => {
        it('should pause learning path', async () => {
            const mockPath = {
                ...mockLearningPath,
                save: jest.fn().mockResolvedValue(true)
            };
            LearningPath.findById = jest.fn().mockResolvedValue(mockPath);

            const app = createApp();
            const res = await request(app)
                .put(`/student/${mockStudentId}/learning-path/${mockPathId}/status`)
                .send({ action: 'pause' });

            expect(res.status).toBe(200);
            expect(res.body.message).toContain('暂停');
        });

        it('should resume learning path', async () => {
            const mockPath = {
                ...mockLearningPath,
                save: jest.fn().mockResolvedValue(true)
            };
            LearningPath.findById = jest.fn().mockResolvedValue(mockPath);

            const app = createApp();
            const res = await request(app)
                .put(`/student/${mockStudentId}/learning-path/${mockPathId}/status`)
                .send({ action: 'resume' });

            expect(res.status).toBe(200);
            expect(res.body.message).toContain('恢复');
        });

        it('should complete learning path', async () => {
            const mockPath = {
                ...mockLearningPath,
                save: jest.fn().mockResolvedValue(true)
            };
            LearningPath.findById = jest.fn().mockResolvedValue(mockPath);

            const app = createApp();
            const res = await request(app)
                .put(`/student/${mockStudentId}/learning-path/${mockPathId}/status`)
                .send({ action: 'complete' });

            expect(res.status).toBe(200);
            expect(res.body.message).toContain('完成');
        });
    });

    describe('POST /student/:studentId/learning-path/activity', () => {
        it('should record learning activity', async () => {
            Student.findById = jest.fn().mockResolvedValue(mockStudent);
            LearningPath.findActiveByStudentSubject = jest.fn().mockResolvedValue(mockLearningPath);

            const app = createApp();
            const res = await request(app)
                .post(`/student/${mockStudentId}/learning-path/activity`)
                .send({
                    subject: mockSubjectId,
                    activityType: 'practice',
                    content: '完成练习题',
                    duration: 30,
                    outcome: 'success',
                    score: 85
                });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('学习活动记录成功');
        });
    });

    describe('Error Handling', () => {
        it('should handle service errors gracefully', async () => {
            const mockPopulate2 = jest.fn().mockRejectedValue(new Error('Database error'));
            const mockPopulate1 = jest.fn().mockReturnValue({
                populate: mockPopulate2
            });
            Student.findById = jest.fn().mockReturnValue({
                populate: mockPopulate1
            });

            const app = createApp();
            const res = await request(app)
                .post(`/student/${mockStudentId}/learning-path`)
                .send({ subject: mockSubjectId });

            expect(res.status).toBe(500);
            expect(res.body).toHaveProperty('error');
        });
    });
});
