const Sclass = require('../models/sclassSchema.js');
const Student = require('../models/studentSchema.js');
const Subject = require('../models/subjectSchema.js');
const Teacher = require('../models/teacherSchema.js');
const mongoose = require('mongoose');

const sclassCreate = async (req, res) => {
    try {
        const { sclassName, adminID, description, grade, maxStudents, academicYear } = req.body;

        // 检查是否存在同名班级
        const existingSclassByName = await Sclass.findOne({
            sclassName: sclassName.trim(),
            school: adminID
        });

        if (existingSclassByName) {
            return res.status(400).json({
                success: false,
                message: '该学校已存在同名班级'
            });
        }

        // 创建新班级
        const sclass = new Sclass({
            sclassName: sclassName.trim(),
            school: adminID,
            description: description?.trim() || '',
            grade: grade?.trim() || '',
            maxStudents: maxStudents || 50,
            academicYear: academicYear?.trim() || ''
        });

        const result = await sclass.save();

        // 返回成功响应
        res.status(201).json({
            success: true,
            message: '班级创建成功',
            data: result
        });
    } catch (err) {
        console.error('创建班级错误:', err);

        // 处理MongoDB验证错误
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({
                success: false,
                message: '数据验证失败',
                errors: errors
            });
        }

        // 处理重复键错误
        if (err.code === 11000) {
            return res.status(400).json({
                success: false,
                message: '班级名称已存在'
            });
        }

        res.status(500).json({
            success: false,
            message: '创建班级失败',
            error: err.message
        });
    }
};

const sclassList = async (req, res) => {
    try {
        const schoolId = req.params.id;
        const {
            page = 1,
            limit = 10,
            search = '',
            grade = '',
            status = '',
            sortBy = 'sclassName',
            sortOrder = 'asc'
        } = req.query;

        // 构建查询条件
        const query = { school: schoolId };

        // 添加搜索条件
        if (search) {
            query.sclassName = { $regex: search, $options: 'i' };
        }

        // 添加年级筛选
        if (grade) {
            query.grade = grade;
        }

        // 添加状态筛选
        if (status) {
            query.status = status;
        }

        // 构建排序条件
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // 计算分页
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // 执行查询
        const [sclasses, total] = await Promise.all([
            Sclass.find(query)
                .populate('school', 'schoolName')
                .populate('classTeacher', 'name')
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit)),
            Sclass.countDocuments(query)
        ]);

        // 更新每个班级的学生数量
        for (let sclass of sclasses) {
            await sclass.updateStudentCount();
        }

        if (sclasses.length > 0) {
            res.json({
                success: true,
                data: sclasses,
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
                message: "未找到班级",
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
        console.error('获取班级列表错误:', err);
        res.status(500).json({
            success: false,
            message: '获取班级列表失败',
            error: err.message
        });
    }
};

const getSclassDetail = async (req, res) => {
    try {
        const classId = req.params.id;

        // 验证ID格式
        if (!mongoose.Types.ObjectId.isValid(classId)) {
            return res.status(400).json({
                success: false,
                message: '班级ID格式不正确'
            });
        }

        let sclass = await Sclass.findById(classId)
            .populate('school', 'schoolName')
            .populate('classTeacher', 'name email');

        if (sclass) {
            // 更新学生数量
            await sclass.updateStudentCount();

            // 获取班级统计信息
            const [subjectCount, studentList] = await Promise.all([
                Subject.countDocuments({ sclassName: classId }),
                Student.find({ sclassName: classId }).select('name studentNumber')
            ]);

            const classData = {
                ...sclass.toObject(),
                statistics: {
                    subjectCount,
                    studentCount: sclass.currentStudents,
                    remainingCapacity: sclass.remainingCapacity,
                    isFull: sclass.isFull
                },
                recentStudents: studentList.slice(0, 5) // 最近5个学生
            };

            res.json({
                success: true,
                data: classData
            });
        } else {
            res.status(404).json({
                success: false,
                message: "班级不存在"
            });
        }
    } catch (err) {
        console.error('获取班级详情错误:', err);
        res.status(500).json({
            success: false,
            message: '获取班级详情失败',
            error: err.message
        });
    }
}

const getSclassStudents = async (req, res) => {
    try {
        let students = await Student.find({ sclassName: req.params.id })
        if (students.length > 0) {
            let modifiedStudents = students.map((student) => {
                return { ...student._doc, password: undefined };
            });
            res.send(modifiedStudents);
        } else {
            res.send({ message: "No students found" });
        }
    } catch (err) {
        res.status(500).json(err);
    }
}

const deleteSclass = async (req, res) => {
    try {
        const deletedClass = await Sclass.findByIdAndDelete(req.params.id);
        if (!deletedClass) {
            return res.send({ message: "Class not found" });
        }
        const deletedStudents = await Student.deleteMany({ sclassName: req.params.id });
        const deletedSubjects = await Subject.deleteMany({ sclassName: req.params.id });
        const deletedTeachers = await Teacher.deleteMany({ teachSclass: req.params.id });
        res.send(deletedClass);
    } catch (error) {
        res.status(500).json(error);
    }
}

const deleteSclasses = async (req, res) => {
    try {
        const deletedClasses = await Sclass.deleteMany({ school: req.params.id });
        if (deletedClasses.deletedCount === 0) {
            return res.send({ message: "No classes found to delete" });
        }
        const deletedStudents = await Student.deleteMany({ school: req.params.id });
        const deletedSubjects = await Subject.deleteMany({ school: req.params.id });
        const deletedTeachers = await Teacher.deleteMany({ school: req.params.id });
        res.send(deletedClasses);
    } catch (error) {
        res.status(500).json(error);
    }
}


const updateSclass = async (req, res) => {
    try {
        const sclassId = req.params.id;
        const updateData = req.body;

        // 验证ID格式
        if (!mongoose.Types.ObjectId.isValid(sclassId)) {
            return res.status(400).json({
                success: false,
                message: '班级ID格式不正确'
            });
        }

        // 检查班级是否存在
        const existingClass = await Sclass.findById(sclassId);
        if (!existingClass) {
            return res.status(404).json({
                success: false,
                message: "班级不存在"
            });
        }

        // 如果更新班级名称，检查是否重复
        if (updateData.sclassName && updateData.sclassName !== existingClass.sclassName) {
            const duplicateClass = await Sclass.findOne({
                sclassName: updateData.sclassName.trim(),
                school: existingClass.school,
                _id: { $ne: sclassId }
            });

            if (duplicateClass) {
                return res.status(400).json({
                    success: false,
                    message: "该学校已存在同名班级"
                });
            }
        }

        // 准备更新数据
        const updateFields = {};
        if (updateData.sclassName) updateFields.sclassName = updateData.sclassName.trim();
        if (updateData.description !== undefined) updateFields.description = updateData.description.trim();
        if (updateData.grade) updateFields.grade = updateData.grade.trim();
        if (updateData.maxStudents) updateFields.maxStudents = updateData.maxStudents;
        if (updateData.status) updateFields.status = updateData.status;
        if (updateData.academicYear) updateFields.academicYear = updateData.academicYear.trim();
        if (updateData.classTeacher) updateFields.classTeacher = updateData.classTeacher;

        // 执行更新
        const updatedSclass = await Sclass.findByIdAndUpdate(
            sclassId,
            updateFields,
            {
                new: true,
                runValidators: true
            }
        ).populate('school', 'schoolName')
         .populate('classTeacher', 'name email');

        // 更新学生数量
        await updatedSclass.updateStudentCount();

        res.json({
            success: true,
            message: '班级更新成功',
            data: updatedSclass
        });
    } catch (error) {
        console.error('更新班级错误:', error);

        // 处理验证错误
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({
                success: false,
                message: '数据验证失败',
                errors: errors
            });
        }

        res.status(500).json({
            success: false,
            message: "更新班级失败",
            error: error.message
        });
    }
};

// 批量删除班级
const batchDeleteSclasses = async (req, res) => {
    try {
        const { classIds } = req.body;
        const schoolId = req.params.schoolId;

        // 验证输入
        if (!Array.isArray(classIds) || classIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: '请提供要删除的班级ID数组'
            });
        }

        // 验证所有ID格式
        const invalidIds = classIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
            return res.status(400).json({
                success: false,
                message: '存在无效的班级ID格式'
            });
        }

        // 检查班级是否属于指定学校
        const classesToDelete = await Sclass.find({
            _id: { $in: classIds },
            school: schoolId
        });

        if (classesToDelete.length !== classIds.length) {
            return res.status(400).json({
                success: false,
                message: '部分班级不存在或不属于该学校'
            });
        }

        // 开始事务
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // 删除相关数据
            await Promise.all([
                Sclass.deleteMany({ _id: { $in: classIds } }, { session }),
                Student.deleteMany({ sclassName: { $in: classIds } }, { session }),
                Subject.deleteMany({ sclassName: { $in: classIds } }, { session }),
                Teacher.updateMany(
                    { teachSclass: { $in: classIds } },
                    { $unset: { teachSclass: 1 } },
                    { session }
                )
            ]);

            await session.commitTransaction();

            res.json({
                success: true,
                message: `成功删除 ${classesToDelete.length} 个班级`,
                deletedCount: classesToDelete.length
            });
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    } catch (error) {
        console.error('批量删除班级错误:', error);
        res.status(500).json({
            success: false,
            message: '批量删除班级失败',
            error: error.message
        });
    }
};

// 获取班级统计信息
const getClassStatistics = async (req, res) => {
    try {
        const schoolId = req.params.id;

        const [
            totalClasses,
            activeClasses,
            inactiveClasses,
            archivedClasses,
            totalStudents,
            classesWithStudentCount
        ] = await Promise.all([
            Sclass.countDocuments({ school: schoolId }),
            Sclass.countDocuments({ school: schoolId, status: 'active' }),
            Sclass.countDocuments({ school: schoolId, status: 'inactive' }),
            Sclass.countDocuments({ school: schoolId, status: 'archived' }),
            Student.countDocuments({ school: schoolId }),
            Sclass.aggregate([
                { $match: { school: mongoose.Types.ObjectId(schoolId) } },
                {
                    $lookup: {
                        from: 'students',
                        localField: '_id',
                        foreignField: 'sclassName',
                        as: 'students'
                    }
                },
                {
                    $project: {
                        sclassName: 1,
                        maxStudents: 1,
                        studentCount: { $size: '$students' },
                        grade: 1,
                        status: 1
                    }
                }
            ])
        ]);

        // 计算平均班级规模
        const averageClassSize = classesWithStudentCount.length > 0
            ? classesWithStudentCount.reduce((sum, cls) => sum + cls.studentCount, 0) / classesWithStudentCount.length
            : 0;

        // 按年级统计
        const gradeStats = classesWithStudentCount.reduce((acc, cls) => {
            const grade = cls.grade || '未分配';
            if (!acc[grade]) {
                acc[grade] = { classCount: 0, studentCount: 0 };
            }
            acc[grade].classCount++;
            acc[grade].studentCount += cls.studentCount;
            return acc;
        }, {});

        res.json({
            success: true,
            data: {
                overview: {
                    totalClasses,
                    activeClasses,
                    inactiveClasses,
                    archivedClasses,
                    totalStudents,
                    averageClassSize: Math.round(averageClassSize * 100) / 100
                },
                gradeStatistics: gradeStats,
                classDetails: classesWithStudentCount
            }
        });
    } catch (error) {
        console.error('获取班级统计错误:', error);
        res.status(500).json({
            success: false,
            message: '获取班级统计失败',
            error: error.message
        });
    }
};

module.exports = {
    sclassCreate,
    sclassList,
    deleteSclass,
    deleteSclasses,
    getSclassDetail,
    getSclassStudents,
    updateSclass,
    batchDeleteSclasses,
    getClassStatistics
};