/**
 * 管理员路由
 */
const router = require('express').Router();
const { adminRegister, adminLogIn, getAdminDetail } = require('../controllers/admin-controller.js');

router.post('/AdminReg', adminRegister);
router.post('/AdminLogin', adminLogIn);
router.get('/Admin/:id', getAdminDetail);

module.exports = router;
