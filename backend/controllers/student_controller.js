const bcrypt = require('bcrypt');
const Student = require('../models/studentSchema.js');
const Subject = require('../models/subjectSchema.js');

const studentRegister = async (req, res) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPass = await bcrypt.hash(req.body.password, salt);

        const existingStudent = await Student.findOne({
            rollNum: req.body.rollNum,
            school: req.body.adminID,
            sclassName: req.body.sclassName,
        });

        if (existingStudent) {
            res.send({ message: 'Roll Number already exists' });
        }
        else {
            const student = new Student({
                ...req.body,
                school: req.body.adminID,
                password: hashedPass
            });

            let result = await student.save();

            result.password = undefined;
            res.send(result);
        }
    } catch (err) {
        res.status(500).json(err);
    }
};

const studentLogIn = async (req, res) => {
    try {
        let student = await Student.findOne({ rollNum: req.body.rollNum, name: req.body.studentName });
        if (student) {
            const validated = await bcrypt.compare(req.body.password, student.password);
            if (validated) {
                student = await student.populate("school", "schoolName")
                student = await student.populate("sclassName", "sclassName grade")

                // 处理学生数据，确保兼容性
                const studentData = student.toObject();
                studentData.password = undefined;
                studentData.examResult = undefined;
                studentData.attendance = undefined;

                res.send(studentData);
            } else {
                res.send({ message: "Invalid password" });
            }
        } else {
            res.send({ message: "Student not found" });
        }
    } catch (err) {
        res.status(500).json(err);
    }
};

const getStudents = async (req, res) => {
    try {
        let students = await Student.find({ school: req.params.id }).populate("sclassName", "sclassName");
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
};

const getStudentDetail = async (req, res) => {
    try {
        let student = await Student.findById(req.params.id)
            .populate("school", "schoolName")
            .populate("sclassName", "sclassName")
            .populate("examResult.subName", "subName")
            .populate("attendance.subName", "subName sessions");
        if (student) {
            student.password = undefined;
            res.send(student);
        }
        else {
            res.send({ message: "No student found" });
        }
    } catch (err) {
        res.status(500).json(err);
    }
}

const deleteStudent = async (req, res) => {
    try {
        const result = await Student.findByIdAndDelete(req.params.id)
        res.send(result)
    } catch (error) {
        res.status(500).json(err);
    }
}

const deleteStudents = async (req, res) => {
    try {
        const result = await Student.deleteMany({ school: req.params.id })
        if (result.deletedCount === 0) {
            res.send({ message: "No students found to delete" })
        } else {
            res.send(result)
        }
    } catch (error) {
        res.status(500).json(err);
    }
}

const deleteStudentsByClass = async (req, res) => {
    try {
        const result = await Student.deleteMany({ sclassName: req.params.id })
        if (result.deletedCount === 0) {
            res.send({ message: "No students found to delete" })
        } else {
            res.send(result)
        }
    } catch (error) {
        res.status(500).json(err);
    }
}

const updateStudent = async (req, res) => {
    try {
        if (req.body.password) {
            const salt = await bcrypt.genSalt(10)
            res.body.password = await bcrypt.hash(res.body.password, salt)
        }
        let result = await Student.findByIdAndUpdate(req.params.id,
            { $set: req.body },
            { new: true })

        result.password = undefined;
        res.send(result)
    } catch (error) {
        res.status(500).json(error);
    }
}

const updateExamResult = async (req, res) => {
    const { subName, marksObtained } = req.body;

    try {
        const student = await Student.findById(req.params.id);

        if (!student) {
            return res.send({ message: 'Student not found' });
        }

        const existingResult = student.examResult.find(
            (result) => result.subName.toString() === subName
        );

        if (existingResult) {
            existingResult.marksObtained = marksObtained;
        } else {
            student.examResult.push({ subName, marksObtained });
        }

        const result = await student.save();
        return res.send(result);
    } catch (error) {
        res.status(500).json(error);
    }
};

const studentAttendance = async (req, res) => {
    const { subName, status, date } = req.body;

    try {
        const student = await Student.findById(req.params.id);

        if (!student) {
            return res.send({ message: 'Student not found' });
        }

        const subject = await Subject.findById(subName);

        const existingAttendance = student.attendance.find(
            (a) =>
                a.date.toDateString() === new Date(date).toDateString() &&
                a.subName.toString() === subName
        );

        if (existingAttendance) {
            existingAttendance.status = status;
        } else {
            // Check if the student has already attended the maximum number of sessions
            const attendedSessions = student.attendance.filter(
                (a) => a.subName.toString() === subName
            ).length;

            if (attendedSessions >= subject.sessions) {
                return res.send({ message: 'Maximum attendance limit reached' });
            }

            student.attendance.push({ date, status, subName });
        }

        const result = await student.save();
        return res.send(result);
    } catch (error) {
        res.status(500).json(error);
    }
};

const clearAllStudentsAttendanceBySubject = async (req, res) => {
    const subName = req.params.id;

    try {
        const result = await Student.updateMany(
            { 'attendance.subName': subName },
            { $pull: { attendance: { subName } } }
        );
        return res.send(result);
    } catch (error) {
        res.status(500).json(error);
    }
};

const clearAllStudentsAttendance = async (req, res) => {
    const schoolId = req.params.id

    try {
        const result = await Student.updateMany(
            { school: schoolId },
            { $set: { attendance: [] } }
        );

        return res.send(result);
    } catch (error) {
        res.status(500).json(error);
    }
};

const removeStudentAttendanceBySubject = async (req, res) => {
    const studentId = req.params.id;
    const subName = req.body.subId

    try {
        const result = await Student.updateOne(
            { _id: studentId },
            { $pull: { attendance: { subName: subName } } }
        );

        return res.send(result);
    } catch (error) {
        res.status(500).json(error);
    }
};


const removeStudentAttendance = async (req, res) => {
    const studentId = req.params.id;

    try {
        const result = await Student.updateOne(
            { _id: studentId },
            { $set: { attendance: [] } }
        );

        return res.send(result);
    } catch (error) {
        res.status(500).json(error);
    }
};

// 批量考勤录入
const batchAttendance = async (req, res) => {
    const { students, subName, date } = req.body;
    // students: [{ studentId, status }, ...]

    try {
        const subject = await Subject.findById(subName);
        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        const results = [];
        const errors = [];

        for (const item of students) {
            try {
                const student = await Student.findById(item.studentId);
                if (!student) {
                    errors.push({ studentId: item.studentId, error: 'Student not found' });
                    continue;
                }

                const existingAttendance = student.attendance.find(
                    (a) =>
                        a.date.toDateString() === new Date(date).toDateString() &&
                        a.subName.toString() === subName
                );

                if (existingAttendance) {
                    existingAttendance.status = item.status;
                } else {
                    student.attendance.push({ date, status: item.status, subName });
                }

                await student.save();
                results.push({ studentId: item.studentId, success: true });
            } catch (err) {
                errors.push({ studentId: item.studentId, error: err.message });
            }
        }

        return res.json({
            success: true,
            processed: results.length,
            failed: errors.length,
            results,
            errors
        });
    } catch (error) {
        res.status(500).json(error);
    }
};

// 获取班级考勤统计
const getClassAttendanceStats = async (req, res) => {
    const { classId, subjectId, startDate, endDate } = req.query;

    try {
        const students = await Student.find({ sclassName: classId })
            .populate('attendance.subName', 'subName sessions');

        const stats = {
            totalStudents: students.length,
            totalPresent: 0,
            totalAbsent: 0,
            attendanceByDate: {},
            studentStats: []
        };

        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();

        for (const student of students) {
            let presentCount = 0;
            let absentCount = 0;

            for (const record of student.attendance) {
                const recordDate = new Date(record.date);
                if (recordDate >= start && recordDate <= end) {
                    if (!subjectId || record.subName._id.toString() === subjectId) {
                        if (record.status === 'Present') {
                            presentCount++;
                            stats.totalPresent++;
                        } else {
                            absentCount++;
                            stats.totalAbsent++;
                        }

                        const dateKey = recordDate.toISOString().split('T')[0];
                        if (!stats.attendanceByDate[dateKey]) {
                            stats.attendanceByDate[dateKey] = { present: 0, absent: 0 };
                        }
                        if (record.status === 'Present') {
                            stats.attendanceByDate[dateKey].present++;
                        } else {
                            stats.attendanceByDate[dateKey].absent++;
                        }
                    }
                }
            }

            stats.studentStats.push({
                studentId: student._id,
                name: student.name,
                rollNum: student.rollNum,
                presentCount,
                absentCount,
                attendanceRate: presentCount + absentCount > 0
                    ? Math.round((presentCount / (presentCount + absentCount)) * 100)
                    : 0
            });
        }

        stats.averageAttendanceRate = stats.totalPresent + stats.totalAbsent > 0
            ? Math.round((stats.totalPresent / (stats.totalPresent + stats.totalAbsent)) * 100)
            : 0;

        return res.json(stats);
    } catch (error) {
        res.status(500).json(error);
    }
};

// 获取班级成绩统计
const getClassGradeStats = async (req, res) => {
    const { classId, subjectId } = req.query;

    try {
        const students = await Student.find({ sclassName: classId })
            .populate('examResult.subName', 'subName');

        const grades = [];
        const stats = {
            totalStudents: students.length,
            average: 0,
            min: 100,
            max: 0,
            passCount: 0,
            failCount: 0,
            distribution: {
                excellent: 0, // 90+
                good: 0,      // 80-89
                average: 0,   // 70-79
                pass: 0,      // 60-69
                fail: 0       // <60
            },
            studentGrades: []
        };

        let totalScore = 0;
        let count = 0;

        for (const student of students) {
            let studentGrade = null;

            for (const result of student.examResult) {
                if (!subjectId || result.subName._id.toString() === subjectId) {
                    studentGrade = result.marksObtained;
                    grades.push(result.marksObtained);

                    totalScore += result.marksObtained;
                    count++;

                    if (result.marksObtained < stats.min) stats.min = result.marksObtained;
                    if (result.marksObtained > stats.max) stats.max = result.marksObtained;

                    if (result.marksObtained >= 60) {
                        stats.passCount++;
                    } else {
                        stats.failCount++;
                    }

                    // 分布统计
                    if (result.marksObtained >= 90) stats.distribution.excellent++;
                    else if (result.marksObtained >= 80) stats.distribution.good++;
                    else if (result.marksObtained >= 70) stats.distribution.average++;
                    else if (result.marksObtained >= 60) stats.distribution.pass++;
                    else stats.distribution.fail++;

                    break;
                }
            }

            stats.studentGrades.push({
                studentId: student._id,
                name: student.name,
                rollNum: student.rollNum,
                grade: studentGrade
            });
        }

        stats.average = count > 0 ? Math.round((totalScore / count) * 100) / 100 : 0;
        stats.passRate = count > 0 ? Math.round((stats.passCount / count) * 100) : 0;

        return res.json(stats);
    } catch (error) {
        res.status(500).json(error);
    }
};

// 获取学生进度追踪
const getStudentProgress = async (req, res) => {
    const { classId, subjectId } = req.query;

    try {
        const students = await Student.find({ sclassName: classId })
            .populate('attendance.subName', 'subName sessions')
            .populate('examResult.subName', 'subName');

        const progress = [];

        for (const student of students) {
            // 计算出勤率
            let attendanceRecords = student.attendance;
            if (subjectId) {
                attendanceRecords = attendanceRecords.filter(
                    a => a.subName._id.toString() === subjectId
                );
            }

            const presentCount = attendanceRecords.filter(a => a.status === 'Present').length;
            const totalSessions = attendanceRecords.length;
            const attendanceRate = totalSessions > 0
                ? Math.round((presentCount / totalSessions) * 100)
                : 0;

            // 获取成绩
            let grade = null;
            for (const result of student.examResult) {
                if (!subjectId || result.subName._id.toString() === subjectId) {
                    grade = result.marksObtained;
                    break;
                }
            }

            // 计算综合进度分数
            const progressScore = Math.round((attendanceRate * 0.3) + ((grade || 0) * 0.7));

            // 判断状态
            let status = 'good';
            let warnings = [];
            if (attendanceRate < 70) {
                status = 'warning';
                warnings.push('出勤率偏低');
            }
            if (grade !== null && grade < 60) {
                status = 'danger';
                warnings.push('成绩不及格');
            } else if (grade !== null && grade < 70) {
                status = 'warning';
                warnings.push('成绩需要提高');
            }

            progress.push({
                studentId: student._id,
                name: student.name,
                rollNum: student.rollNum,
                attendanceRate,
                grade,
                progressScore,
                status,
                warnings,
                totalSessions,
                presentCount
            });
        }

        // 按进度分数排序
        progress.sort((a, b) => a.progressScore - b.progressScore);

        return res.json({
            totalStudents: students.length,
            goodCount: progress.filter(p => p.status === 'good').length,
            warningCount: progress.filter(p => p.status === 'warning').length,
            dangerCount: progress.filter(p => p.status === 'danger').length,
            students: progress
        });
    } catch (error) {
        res.status(500).json(error);
    }
};


module.exports = {
    studentRegister,
    studentLogIn,
    getStudents,
    getStudentDetail,
    deleteStudents,
    deleteStudent,
    updateStudent,
    studentAttendance,
    deleteStudentsByClass,
    updateExamResult,

    clearAllStudentsAttendanceBySubject,
    clearAllStudentsAttendance,
    removeStudentAttendanceBySubject,
    removeStudentAttendance,

    batchAttendance,
    getClassAttendanceStats,
    getClassGradeStats,
    getStudentProgress,
};