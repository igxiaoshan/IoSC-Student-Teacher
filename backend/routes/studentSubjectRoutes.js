/**
 * 学生科目路由
 * 挂载到 /student
 */
const router = require('express').Router();
const {
    getStudentSubjects,
    getAvailableSubjects,
    selectSubject,
    unselectSubject,
    updateLearningPreferences,
    autoAssignClassSubjects,
    getSubjectTimeline
} = require('../controllers/studentSubject-controller.js');

// 科目选择
router.get('/:studentId/subjects', getStudentSubjects);
router.get('/:studentId/subjects/available', getAvailableSubjects);
router.post('/:studentId/subjects/select', selectSubject);
router.delete('/:studentId/subjects/:subjectId', unselectSubject);
router.put('/:studentId/subjects/:subjectId/preferences', updateLearningPreferences);
router.post('/:studentId/subjects/auto-assign', autoAssignClassSubjects);

// 科目时间线
router.get('/:studentId/subjects/:subjectId/timeline', getSubjectTimeline);

module.exports = router;