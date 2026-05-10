/**
 * 学生日历路由
 * 挂载到 /student
 */
const router = require('express').Router();
const {
    getStudentCalendar,
    syncCoursesToCalendar,
    syncExamsToCalendar,
    addPersonalEvent,
    updateEventStatus,
    getCalendarStatistics,
    generateAIStudyPlan
} = require('../controllers/studentCalendar-controller.js');

// 日历
router.get('/:studentId/calendar', getStudentCalendar);
router.post('/:studentId/calendar/sync/courses', syncCoursesToCalendar);
router.post('/:studentId/calendar/sync/exams', syncExamsToCalendar);
router.post('/:studentId/calendar/events', addPersonalEvent);
router.put('/:studentId/calendar/events/:eventId/status', updateEventStatus);
router.get('/:studentId/calendar/statistics', getCalendarStatistics);
router.post('/:studentId/calendar/ai/study-plan', generateAIStudyPlan);

module.exports = router;