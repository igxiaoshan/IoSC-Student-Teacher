/**
 * 班级路由
 */
const router = require('express').Router();
const {
    sclassCreate, sclassList, deleteSclass, deleteSclasses,
    getSclassDetail, getSclassStudents, getSclassTeachers,
    updateSclass, batchDeleteSclasses, getClassStatistics
} = require('../controllers/class-controller.js');
const {
    createClassValidation, updateClassValidation,
    getClassValidation, getClassListValidation,
    batchDeleteValidation, handleValidationErrors
} = require('../validation/classValidation.js');

// CRUD
router.post('/SclassCreate', createClassValidation, handleValidationErrors, sclassCreate);
router.get('/SclassList/:id', getClassListValidation, handleValidationErrors, sclassList);
router.get('/Sclass/:id', getClassValidation, handleValidationErrors, getSclassDetail);
router.put('/Sclass/:id', updateClassValidation, handleValidationErrors, updateSclass);
router.delete('/Sclass/:id', getClassValidation, handleValidationErrors, deleteSclass);
router.delete('/Sclasses/:id', getClassListValidation, handleValidationErrors, deleteSclasses);
router.delete('/SclassBatch/:schoolId', batchDeleteValidation, handleValidationErrors, batchDeleteSclasses);

// 关联数据
router.get('/Sclass/Students/:id', getClassValidation, handleValidationErrors, getSclassStudents);
router.get('/Sclass/Teachers/:id', getClassValidation, handleValidationErrors, getSclassTeachers);
router.get('/SclassStats/:id', getClassListValidation, handleValidationErrors, getClassStatistics);

module.exports = router;
