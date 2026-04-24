/**
 * 通知和投诉路由
 */
const router = require('express').Router();
const { complainCreate, complainList } = require('../controllers/complain-controller.js');
const { noticeCreate, noticeList, deleteNotices, deleteNotice, updateNotice } = require('../controllers/notice-controller.js');

// 通知
router.post('/NoticeCreate', noticeCreate);
router.get('/NoticeList/:id', noticeList);
router.delete('/Notices/:id', deleteNotices);
router.delete('/Notice/:id', deleteNotice);
router.put('/Notice/:id', updateNotice);

// 投诉
router.post('/ComplainCreate', complainCreate);
router.get('/ComplainList/:id', complainList);

module.exports = router;
