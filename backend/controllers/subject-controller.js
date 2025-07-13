const Subject = require('../models/subjectSchema.js');
const Teacher = require('../models/teacherSchema.js');
const Student = require('../models/studentSchema.js');

const subjectCreate = async (req, res) => {
    try {
        const subjects = req.body.subjects.map((subject) => ({
            subName: subject.subName,
            subCode: subject.subCode,
            sessions: subject.sessions,
        }));

        const existingSubjectBySubCode = await Subject.findOne({
            'subjects.subCode': subjects[0].subCode,
            school: req.body.adminID,
        });

        if (existingSubjectBySubCode) {
            res.send({ message: 'Sorry this subcode must be unique as it already exists' });
        } else {
            const newSubjects = subjects.map((subject) => ({
                ...subject,
                sclassName: req.body.sclassName,
                school: req.body.adminID,
            }));

            const result = await Subject.insertMany(newSubjects);
            res.send(result);
        }
    } catch (err) {
        res.status(500).json(err);
    }
};

const allSubjects = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', subjectType = '', status = 'active' } = req.query;

        // 构建查询条件
        const query = { school: req.params.id };

        if (search) {
            query.$or = [
                { subName: { $regex: search, $options: 'i' } },
                { subCode: { $regex: search, $options: 'i' } }
            ];
        }

        if (subjectType) {
            query.subjectType = subjectType;
        }

        if (status) {
            query.status = status;
        }

        // 计算分页
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // 执行查询
        const [subjects, total] = await Promise.all([
            Subject.find(query)
                .populate("sclassName", "sclassName grade")
                .populate("additionalClasses", "sclassName grade")
                .populate("teacher", "name")
                .sort({ subName: 1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Subject.countDocuments(query)
        ]);

        if (subjects.length > 0) {
            // 处理科目数据，合并所有关联的班级
            const processedSubjects = subjects.map(subject => {
                const subjectObj = subject.toObject();

                // 合并主班级和附加班级
                const allClasses = [subjectObj.sclassName];
                if (subjectObj.additionalClasses && subjectObj.additionalClasses.length > 0) {
                    allClasses.push(...subjectObj.additionalClasses);
                }

                return {
                    ...subjectObj,
                    allClasses: allClasses,
                    classCount: allClasses.length,
                    classNames: allClasses.map(cls => cls?.sclassName || '未知班级').join(', ')
                };
            });

            res.json({
                success: true,
                data: processedSubjects,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalItems: total,
                    itemsPerPage: parseInt(limit)
                }
            });
        } else {
            res.json({
                success: true,
                message: "No subjects found",
                data: [],
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: 0,
                    totalItems: 0,
                    itemsPerPage: parseInt(limit)
                }
            });
        }
    } catch (err) {
        console.error('获取科目列表错误:', err);
        res.status(500).json({
            success: false,
            message: '获取科目列表失败',
            error: err.message
        });
    }
};

const classSubjects = async (req, res) => {
    try {
        let subjects = await Subject.find({ sclassName: req.params.id })
        if (subjects.length > 0) {
            res.send(subjects)
        } else {
            res.send({ message: "No subjects found" });
        }
    } catch (err) {
        res.status(500).json(err);
    }
};

const freeSubjectList = async (req, res) => {
    try {
        let subjects = await Subject.find({ sclassName: req.params.id, teacher: { $exists: false } });
        if (subjects.length > 0) {
            res.send(subjects);
        } else {
            res.send({ message: "No subjects found" });
        }
    } catch (err) {
        res.status(500).json(err);
    }
};

const getSubjectDetail = async (req, res) => {
    try {
        let subject = await Subject.findById(req.params.id);
        if (subject) {
            subject = await subject.populate("sclassName", "sclassName")
            subject = await subject.populate("teacher", "name")
            res.send(subject);
        }
        else {
            res.send({ message: "No subject found" });
        }
    } catch (err) {
        res.status(500).json(err);
    }
}

const deleteSubject = async (req, res) => {
    try {
        const deletedSubject = await Subject.findByIdAndDelete(req.params.id);

        // Set the teachSubject field to null in teachers
        await Teacher.updateOne(
            { teachSubject: deletedSubject._id },
            { $unset: { teachSubject: "" }, $unset: { teachSubject: null } }
        );

        // Remove the objects containing the deleted subject from students' examResult array
        await Student.updateMany(
            {},
            { $pull: { examResult: { subName: deletedSubject._id } } }
        );

        // Remove the objects containing the deleted subject from students' attendance array
        await Student.updateMany(
            {},
            { $pull: { attendance: { subName: deletedSubject._id } } }
        );

        res.send(deletedSubject);
    } catch (error) {
        res.status(500).json(error);
    }
};

const deleteSubjects = async (req, res) => {
    try {
        const deletedSubjects = await Subject.deleteMany({ school: req.params.id });

        // Set the teachSubject field to null in teachers
        await Teacher.updateMany(
            { teachSubject: { $in: deletedSubjects.map(subject => subject._id) } },
            { $unset: { teachSubject: "" }, $unset: { teachSubject: null } }
        );

        // Set examResult and attendance to null in all students
        await Student.updateMany(
            {},
            { $set: { examResult: null, attendance: null } }
        );

        res.send(deletedSubjects);
    } catch (error) {
        res.status(500).json(error);
    }
};

const deleteSubjectsByClass = async (req, res) => {
    try {
        const deletedSubjects = await Subject.deleteMany({ sclassName: req.params.id });

        // Set the teachSubject field to null in teachers
        await Teacher.updateMany(
            { teachSubject: { $in: deletedSubjects.map(subject => subject._id) } },
            { $unset: { teachSubject: "" }, $unset: { teachSubject: null } }
        );

        // Set examResult and attendance to null in all students
        await Student.updateMany(
            {},
            { $set: { examResult: null, attendance: null } }
        );

        res.send(deletedSubjects);
    } catch (error) {
        res.status(500).json(error);
    }
};


const updateSubject = async (req, res) => {
    try {
        const { subName, subCode, sessions, sclassName, school } = req.body;
        const subjectId = req.params.id;

        // 验证输入
        if (!subName || !subCode || !sessions || !sclassName) {
            return res.status(400).json({ message: "所有字段都是必填的" });
        }

        // 检查是否存在同样的科目代码（排除当前科目）
        const existingSubject = await Subject.findOne({
            subCode: subCode.trim(),
            school: school,
            _id: { $ne: subjectId }
        });

        if (existingSubject) {
            return res.status(400).json({ message: "该学校已存在相同的科目代码" });
        }

        // 更新科目
        const updatedSubject = await Subject.findByIdAndUpdate(
            subjectId,
            {
                subName: subName.trim(),
                subCode: subCode.trim(),
                sessions: sessions.trim(),
                sclassName: sclassName,
                school: school
            },
            { new: true, runValidators: true }
        ).populate("sclassName", "sclassName");

        if (!updatedSubject) {
            return res.status(404).json({ message: "科目不存在" });
        }

        res.json(updatedSubject);
    } catch (error) {
        console.error('更新科目错误:', error);
        res.status(500).json({ message: "更新科目失败", error: error.message });
    }
};

// 为科目添加班级关联
const addClassToSubject = async (req, res) => {
    try {
        const { subjectId, classId } = req.body;

        const subject = await Subject.findById(subjectId);
        if (!subject) {
            return res.status(404).json({
                success: false,
                message: '科目不存在'
            });
        }

        await subject.addClassAssociation(classId);

        const updatedSubject = await Subject.findById(subjectId)
            .populate("sclassName additionalClasses", "sclassName grade");

        res.json({
            success: true,
            message: '班级关联添加成功',
            data: updatedSubject
        });
    } catch (error) {
        console.error('添加班级关联错误:', error);
        res.status(500).json({
            success: false,
            message: '添加班级关联失败',
            error: error.message
        });
    }
};

// 从科目中移除班级关联
const removeClassFromSubject = async (req, res) => {
    try {
        const { subjectId, classId } = req.body;

        const subject = await Subject.findById(subjectId);
        if (!subject) {
            return res.status(404).json({
                success: false,
                message: '科目不存在'
            });
        }

        await subject.removeClassAssociation(classId);

        const updatedSubject = await Subject.findById(subjectId)
            .populate("sclassName additionalClasses", "sclassName grade");

        res.json({
            success: true,
            message: '班级关联移除成功',
            data: updatedSubject
        });
    } catch (error) {
        console.error('移除班级关联错误:', error);
        res.status(500).json({
            success: false,
            message: '移除班级关联失败',
            error: error.message
        });
    }
};

// 获取科目统计信息
const getSubjectStatistics = async (req, res) => {
    try {
        const schoolId = req.params.id;

        const [
            totalSubjects,
            activeSubjects,
            subjectsByType,
            subjectsWithMultipleClasses
        ] = await Promise.all([
            Subject.countDocuments({ school: schoolId }),
            Subject.countDocuments({ school: schoolId, status: 'active' }),
            Subject.aggregate([
                { $match: { school: mongoose.Types.ObjectId(schoolId) } },
                { $group: { _id: '$subjectType', count: { $sum: 1 } } }
            ]),
            Subject.countDocuments({
                school: schoolId,
                additionalClasses: { $exists: true, $not: { $size: 0 } }
            })
        ]);

        res.json({
            success: true,
            data: {
                overview: {
                    totalSubjects,
                    activeSubjects,
                    subjectsWithMultipleClasses
                },
                subjectsByType: subjectsByType.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {})
            }
        });
    } catch (error) {
        console.error('获取科目统计错误:', error);
        res.status(500).json({
            success: false,
            message: '获取科目统计失败',
            error: error.message
        });
    }
};

module.exports = {
    subjectCreate,
    freeSubjectList,
    classSubjects,
    getSubjectDetail,
    deleteSubjectsByClass,
    deleteSubjects,
    deleteSubject,
    allSubjects,
    updateSubject,
    addClassToSubject,
    removeClassFromSubject,
    getSubjectStatistics
};