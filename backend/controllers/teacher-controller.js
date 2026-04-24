const bcrypt = require('bcrypt');
const Teacher = require('../models/teacherSchema.js');
const Subject = require('../models/subjectSchema.js');

const teacherRegister = async (req, res) => {
    const {
        name, email, password, role, school, teachSubject, teachSclass,
        phone, address, qualification, experience, teacherType, position
    } = req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPass = await bcrypt.hash(password, salt);

        const teacher = new Teacher({
            name,
            email,
            password: hashedPass,
            role,
            school,
            teachSubject,
            teachSclass,
            phone: phone || '',
            address: address || '',
            qualification: qualification || '',
            experience: experience || 0,
            teacherType: teacherType || 'full-time',
            position: position || 'teacher'
        });

        const existingTeacherByEmail = await Teacher.findOne({ email });

        if (existingTeacherByEmail) {
            res.send({ message: '邮箱已存在' });
        }
        else {
            let result = await teacher.save();
            await Subject.findByIdAndUpdate(teachSubject, { teacher: teacher._id });
            result.password = undefined;
            res.send(result);
        }
    } catch (err) {
        res.status(500).json(err);
    }
};

const teacherLogIn = async (req, res) => {
    try {
        let teacher = await Teacher.findOne({ email: req.body.email });
        if (teacher) {
            const validated = await bcrypt.compare(req.body.password, teacher.password);
            if (validated) {
                teacher = await teacher.populate("teachSubject", "subName sessions")
                teacher = await teacher.populate("school", "schoolName")
                teacher = await teacher.populate("teachSclass", "sclassName grade")
                teacher = await teacher.populate("additionalClasses", "sclassName grade")

                // 处理教师数据，确保兼容性
                const teacherData = teacher.toObject();
                teacherData.password = undefined;

                // 合并所有任教班级信息
                const allClasses = [teacherData.teachSclass];
                if (teacherData.additionalClasses && teacherData.additionalClasses.length > 0) {
                    allClasses.push(...teacherData.additionalClasses);
                }

                teacherData.allClasses = allClasses;
                teacherData.classCount = allClasses.length;
                teacherData.classNames = allClasses.map(cls => cls?.sclassName || '未知班级').join(', ');

                res.send(teacherData);
            } else {
                res.send({ message: "无效密码" });
            }
        } else {
            res.send({ message: "教师未找到" });
        }
    } catch (err) {
        console.error('教师登录错误:', err);
        res.status(500).json(err);
    }
};

const getTeachers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', teacherType = '', status = 'active' } = req.query;

        // 构建查询条件
        const query = { school: req.params.id };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        if (teacherType) {
            query.teacherType = teacherType;
        }

        if (status) {
            query.status = status;
        }

        // 计算分页
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // 执行查询
        const [teachers, total] = await Promise.all([
            Teacher.find(query)
                .populate("teachSubject", "subName")
                .populate("teachSclass", "sclassName grade")
                .populate("additionalClasses", "sclassName grade")
                .sort({ name: 1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Teacher.countDocuments(query)
        ]);

        if (teachers.length > 0) {
            // 处理教师数据，合并所有任教班级
            const processedTeachers = teachers.map(teacher => {
                const teacherObj = teacher.toObject();

                // 合并主班级和附加班级
                const allClasses = [teacherObj.teachSclass];
                if (teacherObj.additionalClasses && teacherObj.additionalClasses.length > 0) {
                    allClasses.push(...teacherObj.additionalClasses);
                }

                return {
                    ...teacherObj,
                    password: undefined,
                    allClasses: allClasses,
                    classCount: allClasses.length,
                    classNames: allClasses.map(cls => cls?.sclassName || '未知班级').join(', ')
                };
            });

            res.json({
                success: true,
                data: processedTeachers,
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
                message: "没有找到教师",
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
        console.error('获取教师列表错误:', err);
        res.status(500).json({
            success: false,
            message: '获取教师列表失败',
            error: err.message
        });
    }
};

const getTeacherDetail = async (req, res) => {
    try {
        let teacher = await Teacher.findById(req.params.id)
            .populate("teachSubject", "subName sessions")
            .populate("school", "schoolName")
            .populate("teachSclass", "sclassName grade")
            .populate("additionalClasses", "sclassName grade")
        if (teacher) {
            const teacherData = teacher.toObject();
            teacherData.password = undefined;

            // 合并所有任教班级信息
            const allClasses = [teacherData.teachSclass];
            if (teacherData.additionalClasses && teacherData.additionalClasses.length > 0) {
                allClasses.push(...teacherData.additionalClasses);
            }

            teacherData.allClasses = allClasses;
            teacherData.classCount = allClasses.length;
            teacherData.classNames = allClasses.map(cls => cls?.sclassName || '未知班级').join(', ');

            res.send(teacherData);
        }
        else {
            res.send({ message: "没有找到教师" });
        }
    } catch (err) {
        console.error('获取教师详情错误:', err);
        res.status(500).json(err);
    }
}

const updateTeacherSubject = async (req, res) => {
    const { teacherId, teachSubject } = req.body;
    try {
        const updatedTeacher = await Teacher.findByIdAndUpdate(
            teacherId,
            { teachSubject },
            { new: true }
        );

        await Subject.findByIdAndUpdate(teachSubject, { teacher: updatedTeacher._id });

        res.send(updatedTeacher);
    } catch (error) {
        res.status(500).json(error);
    }
};

const deleteTeacher = async (req, res) => {
    try {
        const deletedTeacher = await Teacher.findByIdAndDelete(req.params.id);

        await Subject.updateOne(
            { teacher: deletedTeacher._id, teacher: { $exists: true } },
            { $unset: { teacher: 1 } }
        );

        res.send(deletedTeacher);
    } catch (error) {
        res.status(500).json(error);
    }
};

const deleteTeachers = async (req, res) => {
    try {
        const deletionResult = await Teacher.deleteMany({ school: req.params.id });

        const deletedCount = deletionResult.deletedCount || 0;

        if (deletedCount === 0) {
            res.send({ message: "No teachers found to delete" });
            return;
        }

        const deletedTeachers = await Teacher.find({ school: req.params.id });

        await Subject.updateMany(
            { teacher: { $in: deletedTeachers.map(teacher => teacher._id) }, teacher: { $exists: true } },
            { $unset: { teacher: "" }, $unset: { teacher: null } }
        );

        res.send(deletionResult);
    } catch (error) {
        res.status(500).json(error);
    }
};

const deleteTeachersByClass = async (req, res) => {
    try {
        const deletionResult = await Teacher.deleteMany({ sclassName: req.params.id });

        const deletedCount = deletionResult.deletedCount || 0;

        if (deletedCount === 0) {
            res.send({ message: "No teachers found to delete" });
            return;
        }

        const deletedTeachers = await Teacher.find({ sclassName: req.params.id });

        await Subject.updateMany(
            { teacher: { $in: deletedTeachers.map(teacher => teacher._id) }, teacher: { $exists: true } },
            { $unset: { teacher: "" }, $unset: { teacher: null } }
        );

        res.send(deletionResult);
    } catch (error) {
        res.status(500).json(error);
    }
};

const teacherAttendance = async (req, res) => {
    const { status, date } = req.body;

    try {
        const teacher = await Teacher.findById(req.params.id);

        if (!teacher) {
            return res.send({ message: '教师未找到' });
        }

        const existingAttendance = teacher.attendance.find(
            (a) =>
                a.date.toDateString() === new Date(date).toDateString()
        );

        if (existingAttendance) {
            existingAttendance.status = status;
        } else {
            teacher.attendance.push({ date, status });
        }

        const result = await teacher.save();
        return res.send(result);
    } catch (error) {
        res.status(500).json(error)
    }
};

// 为教师添加班级关联
const addClassToTeacher = async (req, res) => {
    try {
        const { teacherId, classId } = req.body;

        const teacher = await Teacher.findById(teacherId);
        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: '教师不存在'
            });
        }

        await teacher.addClassAssociation(classId);

        const updatedTeacher = await Teacher.findById(teacherId)
            .populate("teachSclass additionalClasses", "sclassName grade");

        res.json({
            success: true,
            message: '班级关联添加成功',
            data: updatedTeacher
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

// 从教师中移除班级关联
const removeClassFromTeacher = async (req, res) => {
    try {
        const { teacherId, classId } = req.body;

        const teacher = await Teacher.findById(teacherId);
        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: '教师不存在'
            });
        }

        await teacher.removeClassAssociation(classId);

        const updatedTeacher = await Teacher.findById(teacherId)
            .populate("teachSclass additionalClasses", "sclassName grade");

        res.json({
            success: true,
            message: '班级关联移除成功',
            data: updatedTeacher
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

// 获取教师统计信息
const getTeacherStatistics = async (req, res) => {
    try {
        const schoolId = req.params.id;

        const [
            totalTeachers,
            activeTeachers,
            teachersByType,
            teachersWithMultipleClasses
        ] = await Promise.all([
            Teacher.countDocuments({ school: schoolId }),
            Teacher.countDocuments({ school: schoolId, status: 'active' }),
            Teacher.aggregate([
                { $match: { school: mongoose.Types.ObjectId(schoolId) } },
                { $group: { _id: '$teacherType', count: { $sum: 1 } } }
            ]),
            Teacher.countDocuments({
                school: schoolId,
                additionalClasses: { $exists: true, $not: { $size: 0 } }
            })
        ]);

        res.json({
            success: true,
            data: {
                overview: {
                    totalTeachers,
                    activeTeachers,
                    teachersWithMultipleClasses
                },
                teachersByType: teachersByType.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {})
            }
        });
    } catch (error) {
        console.error('获取教师统计错误:', error);
        res.status(500).json({
            success: false,
            message: '获取教师统计失败',
            error: error.message
        });
    }
};

module.exports = {
    teacherRegister,
    teacherLogIn,
    getTeachers,
    getTeacherDetail,
    updateTeacherSubject,
    deleteTeacher,
    deleteTeachers,
    deleteTeachersByClass,
    teacherAttendance,
    addClassToTeacher,
    removeClassFromTeacher,
    getTeacherStatistics
};