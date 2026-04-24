/**
 * 科目路由
 */
const router = require('express').Router();
const {
    subjectCreate, classSubjects, deleteSubjectsByClass, getSubjectDetail,
    deleteSubject, freeSubjectList, allSubjects, deleteSubjects,
    updateSubject, addClassToSubject, removeClassFromSubject, getSubjectStatistics
} = require('../controllers/subject-controller.js');

// CRUD
router.post('/SubjectCreate', subjectCreate);
router.get('/AllSubjects/:id', allSubjects);
router.get('/ClassSubjects/:id', classSubjects);
router.get('/FreeSubjectList/:id', freeSubjectList);
router.get('/Subject/:id', getSubjectDetail);
router.get('/Subject/Detail/:id', getSubjectDetail);
router.get('/SubjectStats/:id', getSubjectStatistics);
router.put('/Subject/:id', updateSubject);

// 班级关联
router.post('/Subject/addClass', addClassToSubject);
router.delete('/Subject/removeClass', removeClassFromSubject);

// 删除
router.delete('/Subject/:id', deleteSubject);
router.delete('/Subjects/:id', deleteSubjects);
router.delete('/SubjectsClass/:id', deleteSubjectsByClass);

module.exports = router;
