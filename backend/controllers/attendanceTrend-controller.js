/**
 * 出勤趋势分析控制器
 */
const Student = require('../models/studentSchema.js');
const Subject = require('../models/subjectSchema.js');

// ============================================
// Helper Functions
// ============================================

/**
 * Detect consecutive absences for a student
 * @param {Array} attendance - Student attendance records
 * @param {Number} minDays - Minimum consecutive days to trigger alert
 * @returns {Object} Consecutive absence analysis
 */
const detectConsecutiveAbsences = (attendance, minDays = 3) => {
    // Sort attendance by date
    const sortedAttendance = [...attendance].sort((a, b) =>
        new Date(a.date) - new Date(b.date)
    );

    const streaks = [];
    let currentStreak = {
        startDate: null,
        endDate: null,
        days: 0,
        subjects: []
    };

    // Group by date and check for absences
    const dateMap = new Map();
    sortedAttendance.forEach(record => {
        const dateKey = new Date(record.date).toISOString().split('T')[0];
        if (!dateMap.has(dateKey)) {
            dateMap.set(dateKey, { present: 0, absent: 0, subjects: [] });
        }
        const dayData = dateMap.get(dateKey);
        if (record.status === 'Present') {
            dayData.present++;
        } else {
            dayData.absent++;
            dayData.subjects.push(record.subName);
        }
    });

    // Find consecutive absent days (all subjects absent on that day)
    const sortedDates = Array.from(dateMap.keys()).sort();
    let consecutiveDays = 0;
    let streakStart = null;
    const consecutiveStreaks = [];

    sortedDates.forEach((date, index) => {
        const dayData = dateMap.get(date);
        const isFullAbsent = dayData.absent > 0 && dayData.present === 0;

        if (isFullAbsent) {
            if (consecutiveDays === 0) {
                streakStart = date;
            }
            consecutiveDays++;
        } else {
            if (consecutiveDays >= minDays) {
                consecutiveStreaks.push({
                    startDate: streakStart,
                    endDate: sortedDates[index - 1],
                    days: consecutiveDays
                });
            }
            consecutiveDays = 0;
            streakStart = null;
        }
    });

    // Check last streak
    if (consecutiveDays >= minDays) {
        consecutiveStreaks.push({
            startDate: streakStart,
            endDate: sortedDates[sortedDates.length - 1],
            days: consecutiveDays
        });
    }

    // Find current ongoing streak
    let currentOngoingStreak = 0;
    for (let i = sortedDates.length - 1; i >= 0; i--) {
        const dayData = dateMap.get(sortedDates[i]);
        const isFullAbsent = dayData.absent > 0 && dayData.present === 0;
        if (isFullAbsent) {
            currentOngoingStreak++;
        } else {
            break;
        }
    }

    return {
        streaks: consecutiveStreaks,
        currentStreak: currentOngoingStreak,
        maxStreak: consecutiveStreaks.length > 0 ? Math.max(...consecutiveStreaks.map(s => s.days)) : 0
    };
};

/**
 * Calculate subject-wise absence rate
 * @param {Array} attendance - Student attendance records
 * @param {Number} days - Number of days to analyze
 * @returns {Array} Subject absence analysis
 */
const calculateSubjectAbsenceRate = (attendance, days = 30) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const subjectStats = new Map();

    attendance.forEach(record => {
        const recordDate = new Date(record.date);
        if (recordDate >= startDate) {
            const subjectId = record.subName?._id?.toString() || record.subName?.toString();
            if (!subjectId) return;

            if (!subjectStats.has(subjectId)) {
                subjectStats.set(subjectId, {
                    subjectId,
                    subjectName: record.subName?.subName || 'Unknown',
                    present: 0,
                    absent: 0,
                    total: 0
                });
            }

            const stats = subjectStats.get(subjectId);
            stats.total++;
            if (record.status === 'Present') {
                stats.present++;
            } else {
                stats.absent++;
            }
        }
    });

    const results = [];
    subjectStats.forEach((stats, subjectId) => {
        const absenceRate = stats.total > 0 ? Math.round((stats.absent / stats.total) * 100) : 0;
        const attendanceRate = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 100;

        results.push({
            subjectId,
            subjectName: stats.subjectName,
            present: stats.present,
            absent: stats.absent,
            total: stats.total,
            absenceRate,
            attendanceRate
        });
    });

    return results.sort((a, b) => b.absenceRate - a.absenceRate);
};

/**
 * Generate alerts based on rules
 * @param {Object} student - Student object with attendance
 * @param {Object} options - Analysis options
 * @returns {Array} Generated alerts
 */
const generateStudentAlerts = async (student, options = {}) => {
    const { days = 30, consecutiveThreshold = 3, rateThreshold = 30 } = options;
    const alerts = [];

    // 1. Check consecutive absences
    const consecutiveAnalysis = detectConsecutiveAbsences(student.attendance, consecutiveThreshold);

    if (consecutiveAnalysis.currentStreak >= consecutiveThreshold) {
        let severity = 'medium';
        if (consecutiveAnalysis.currentStreak >= 7) severity = 'critical';
        else if (consecutiveAnalysis.currentStreak >= 5) severity = 'high';

        alerts.push({
            type: 'consecutive_absence',
            severity,
            message: `连续缺勤 ${consecutiveAnalysis.currentStreak} 天`,
            details: {
                currentStreak: consecutiveAnalysis.currentStreak,
                maxStreak: consecutiveAnalysis.maxStreak,
                streaks: consecutiveAnalysis.streaks
            }
        });
    }

    // 2. Check subject absence rates
    const subjectAnalysis = calculateSubjectAbsenceRate(student.attendance, days);

    subjectAnalysis.forEach(subject => {
        if (subject.absenceRate >= rateThreshold) {
            let severity = 'low';
            if (subject.absenceRate >= 50) severity = 'high';
            else if (subject.absenceRate >= 40) severity = 'medium';

            alerts.push({
                type: 'subject_absence_rate',
                severity,
                message: `${subject.subjectName} 缺勤率达 ${subject.absenceRate}%`,
                details: {
                    subjectId: subject.subjectId,
                    subjectName: subject.subjectName,
                    absenceRate: subject.absenceRate,
                    present: subject.present,
                    absent: subject.absent,
                    total: subject.total
                }
            });
        }
    });

    // 3. Check overall attendance rate
    const totalPresent = student.attendance.reduce((sum, r) =>
        sum + (r.status === 'Present' ? 1 : 0), 0
    );
    const totalRecords = student.attendance.length;
    const overallRate = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 100;

    if (overallRate < 80) {
        let severity = 'low';
        if (overallRate < 60) severity = 'high';
        else if (overallRate < 70) severity = 'medium';

        alerts.push({
            type: 'overall_absence_rate',
            severity,
            message: `总体出勤率仅 ${overallRate}%`,
            details: {
                overallRate,
                totalPresent,
                totalAbsent: totalRecords - totalPresent,
                totalRecords
            }
        });
    }

    // Sort by severity
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return alerts;
};

// ============================================
// API Controllers
// ============================================

// 获取单个学生出勤趋势
const getStudentAttendanceTrend = async (req, res) => {
    const { studentId } = req.params;
    const { days = 30, subjectId } = req.query;

    try {
        const student = await Student.findById(studentId)
            .populate('attendance.subName', 'subName');

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        const trend = [];
        const dailyStats = {};

        // 生成日期序列
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dateKey = currentDate.toISOString().split('T')[0];
            dailyStats[dateKey] = { present: 0, absent: 0, total: 0 };
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // 统计考勤数据
        for (const record of student.attendance) {
            const recordDate = new Date(record.date);
            if (recordDate >= startDate && recordDate <= endDate) {
                if (!subjectId || record.subName?._id?.toString() === subjectId) {
                    const dateKey = recordDate.toISOString().split('T')[0];
                    if (dailyStats[dateKey]) {
                        dailyStats[dateKey].total++;
                        if (record.status === 'Present') {
                            dailyStats[dateKey].present++;
                        } else {
                            dailyStats[dateKey].absent++;
                        }
                    }
                }
            }
        }

        // 转换为趋势数组
        let totalPresent = 0;
        let totalAbsent = 0;
        let streakDays = 0;
        let currentStreak = 0;

        for (const [date, stats] of Object.entries(dailyStats)) {
            const rate = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : null;
            trend.push({
                date,
                present: stats.present,
                absent: stats.absent,
                total: stats.total,
                rate
            });

            totalPresent += stats.present;
            totalAbsent += stats.absent;

            // 计算连续出勤天数
            if (stats.total > 0 && stats.present === stats.total) {
                currentStreak++;
            } else if (stats.total > 0) {
                currentStreak = 0;
            }
        }

        // 计算周对比
        const halfPoint = Math.floor(trend.length / 2);
        const firstHalfPresent = trend.slice(0, halfPoint).reduce((sum, d) => sum + d.present, 0);
        const firstHalfTotal = trend.slice(0, halfPoint).reduce((sum, d) => sum + d.total, 0);
        const secondHalfPresent = trend.slice(halfPoint).reduce((sum, d) => sum + d.present, 0);
        const secondHalfTotal = trend.slice(halfPoint).reduce((sum, d) => sum + d.total, 0);

        const firstHalfRate = firstHalfTotal > 0 ? (firstHalfPresent / firstHalfTotal) * 100 : 0;
        const secondHalfRate = secondHalfTotal > 0 ? (secondHalfPresent / secondHalfTotal) * 100 : 0;

        return res.json({
            success: true,
            data: {
                studentId: student._id,
                name: student.name,
                rollNum: student.rollNum,
                period: { start: startDate, end: endDate, days: parseInt(days) },
                summary: {
                    totalPresent,
                    totalAbsent,
                    totalRecords: totalPresent + totalAbsent,
                    attendanceRate: (totalPresent + totalAbsent) > 0
                        ? Math.round((totalPresent / (totalPresent + totalAbsent)) * 100)
                        : 0,
                    currentStreak
                },
                comparison: {
                    firstHalfRate: Math.round(firstHalfRate),
                    secondHalfRate: Math.round(secondHalfRate),
                    change: Math.round(secondHalfRate - firstHalfRate)
                },
                trend
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 获取班级出勤趋势
const getClassAttendanceTrend = async (req, res) => {
    const { classId } = req.params;
    const { days = 30, subjectId } = req.query;

    try {
        const students = await Student.find({ sclassName: classId })
            .populate('attendance.subName', 'subName');

        if (students.length === 0) {
            return res.status(404).json({ success: false, message: 'No students found' });
        }

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        const dailyStats = {};
        const dateSequence = [];

        // 生成日期序列
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dateKey = currentDate.toISOString().split('T')[0];
            dailyStats[dateKey] = {
                date: dateKey,
                present: 0,
                absent: 0,
                total: 0,
                studentCount: 0
            };
            dateSequence.push(dateKey);
            currentDate.setDate(currentDate.getDate() + 1);
        }

        let totalPresent = 0;
        let totalAbsent = 0;

        for (const student of students) {
            const studentDailyPresent = {};

            for (const record of student.attendance) {
                const recordDate = new Date(record.date);
                if (recordDate >= startDate && recordDate <= endDate) {
                    if (!subjectId || record.subName?._id?.toString() === subjectId) {
                        const dateKey = recordDate.toISOString().split('T')[0];
                        if (dailyStats[dateKey]) {
                            if (record.status === 'Present') {
                                dailyStats[dateKey].present++;
                                totalPresent++;
                            } else {
                                dailyStats[dateKey].absent++;
                                totalAbsent++;
                            }
                            dailyStats[dateKey].total++;
                        }
                    }
                }
            }
        }

        // 转换为趋势数组并计算比率
        const trend = dateSequence.map(date => {
            const stats = dailyStats[date];
            return {
                date: stats.date,
                present: stats.present,
                absent: stats.absent,
                total: stats.total,
                rate: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0
            };
        });

        // 计算周对比
        const halfPoint = Math.floor(trend.length / 2);
        const firstHalfPresent = trend.slice(0, halfPoint).reduce((sum, d) => sum + d.present, 0);
        const firstHalfTotal = trend.slice(0, halfPoint).reduce((sum, d) => sum + d.total, 0);
        const secondHalfPresent = trend.slice(halfPoint).reduce((sum, d) => sum + d.present, 0);
        const secondHalfTotal = trend.slice(halfPoint).reduce((sum, d) => sum + d.total, 0);

        const firstHalfRate = firstHalfTotal > 0 ? (firstHalfPresent / firstHalfTotal) * 100 : 0;
        const secondHalfRate = secondHalfTotal > 0 ? (secondHalfPresent / secondHalfTotal) * 100 : 0;

        // 识别问题学生
        const problemStudents = [];
        for (const student of students) {
            let studentPresent = 0;
            let studentAbsent = 0;

            for (const record of student.attendance) {
                const recordDate = new Date(record.date);
                if (recordDate >= startDate && recordDate <= endDate) {
                    if (!subjectId || record.subName?._id?.toString() === subjectId) {
                        if (record.status === 'Present') {
                            studentPresent++;
                        } else {
                            studentAbsent++;
                        }
                    }
                }
            }

            const studentRate = (studentPresent + studentAbsent) > 0
                ? Math.round((studentPresent / (studentPresent + studentAbsent)) * 100)
                : 100;

            if (studentRate < 70) {
                problemStudents.push({
                    studentId: student._id,
                    name: student.name,
                    rollNum: student.rollNum,
                    attendanceRate: studentRate,
                    absentCount: studentAbsent
                });
            }
        }

        return res.json({
            success: true,
            data: {
                classId,
                totalStudents: students.length,
                period: { start: startDate, end: endDate, days: parseInt(days) },
                summary: {
                    totalPresent,
                    totalAbsent,
                    totalRecords: totalPresent + totalAbsent,
                    averageAttendanceRate: (totalPresent + totalAbsent) > 0
                        ? Math.round((totalPresent / (totalPresent + totalAbsent)) * 100)
                        : 0
                },
                comparison: {
                    firstHalfRate: Math.round(firstHalfRate),
                    secondHalfRate: Math.round(secondHalfRate),
                    change: Math.round(secondHalfRate - firstHalfRate)
                },
                trend,
                problemStudents: problemStudents.sort((a, b) => a.attendanceRate - b.attendanceRate)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 获取出勤预警列表
const getAttendanceAlerts = async (req, res) => {
    const { classId } = req.params;
    const { threshold = 70, days = 14 } = req.query;

    try {
        const query = classId ? { sclassName: classId } : {};
        const students = await Student.find(query)
            .populate('sclassName', 'sclassName')
            .populate('attendance.subName', 'subName');

        const alerts = [];
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        for (const student of students) {
            let present = 0;
            let absent = 0;
            const recentAbsences = [];

            for (const record of student.attendance) {
                const recordDate = new Date(record.date);
                if (recordDate >= startDate) {
                    if (record.status === 'Present') {
                        present++;
                    } else {
                        absent++;
                        recentAbsences.push({
                            date: record.date,
                            subject: record.subName.subName
                        });
                    }
                }
            }

            const rate = (present + absent) > 0
                ? Math.round((present / (present + absent)) * 100)
                : 100;

            if (rate < parseInt(threshold)) {
                alerts.push({
                    studentId: student._id,
                    name: student.name,
                    rollNum: student.rollNum,
                    className: student.sclassName?.sclassName || 'Unknown',
                    attendanceRate: rate,
                    absentCount: absent,
                    recentAbsences: recentAbsences.slice(-5),
                    severity: rate < 50 ? 'high' : (rate < 60 ? 'medium' : 'low')
                });
            }
        }

        return res.json({
            success: true,
            data: {
                totalAlerts: alerts.length,
                threshold: parseInt(threshold),
                period: parseInt(days),
                alerts: alerts.sort((a, b) => a.attendanceRate - b.attendanceRate)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get student-specific attendance alerts (student dimension)
const getStudentAttendanceAlerts = async (req, res) => {
    const { studentId } = req.params;
    const { days = 30, consecutiveThreshold = 3, rateThreshold = 30 } = req.query;

    try {
        const student = await Student.findById(studentId)
            .populate('attendance.subName', 'subName')
            .populate('sclassName', 'sclassName');

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const alerts = await generateStudentAlerts(student, {
            days: parseInt(days),
            consecutiveThreshold: parseInt(consecutiveThreshold),
            rateThreshold: parseInt(rateThreshold)
        });

        // Get consecutive absence analysis
        const consecutiveAnalysis = detectConsecutiveAbsences(student.attendance, parseInt(consecutiveThreshold));

        // Get subject absence analysis
        const subjectAnalysis = calculateSubjectAbsenceRate(student.attendance, parseInt(days));

        // Overall statistics
        const totalPresent = student.attendance.filter(r => r.status === 'Present').length;
        const totalAbsent = student.attendance.filter(r => r.status === 'Absent').length;
        const totalRecords = totalPresent + totalAbsent;

        return res.json({
            success: true,
            data: {
                studentId: student._id,
                name: student.name,
                rollNum: student.rollNum,
                className: student.sclassName?.sclassName || 'Unknown',
                alerts,
                analysis: {
                    consecutive: {
                        currentStreak: consecutiveAnalysis.currentStreak,
                        maxStreak: consecutiveAnalysis.maxStreak,
                        streaks: consecutiveAnalysis.streaks
                    },
                    subjects: subjectAnalysis,
                    overall: {
                        totalPresent,
                        totalAbsent,
                        totalRecords,
                        attendanceRate: totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 100
                    }
                },
                period: parseInt(days),
                thresholds: {
                    consecutive: parseInt(consecutiveThreshold),
                    rate: parseInt(rateThreshold)
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get student subject-wise absence details
const getStudentSubjectAbsence = async (req, res) => {
    const { studentId } = req.params;
    const { days = 30 } = req.query;

    try {
        const student = await Student.findById(studentId)
            .populate('attendance.subName', 'subName subCode');

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const subjectAnalysis = calculateSubjectAbsenceRate(student.attendance, parseInt(days));

        // Categorize by risk level
        const highRisk = subjectAnalysis.filter(s => s.absenceRate >= 50);
        const mediumRisk = subjectAnalysis.filter(s => s.absenceRate >= 30 && s.absenceRate < 50);
        const lowRisk = subjectAnalysis.filter(s => s.absenceRate > 0 && s.absenceRate < 30);
        const healthy = subjectAnalysis.filter(s => s.absenceRate === 0);

        return res.json({
            success: true,
            data: {
                studentId: student._id,
                name: student.name,
                subjects: subjectAnalysis,
                riskCategories: {
                    high: highRisk,
                    medium: mediumRisk,
                    low: lowRisk,
                    healthy
                },
                summary: {
                    totalSubjects: subjectAnalysis.length,
                    highRiskCount: highRisk.length,
                    mediumRiskCount: mediumRisk.length
                },
                period: parseInt(days)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getStudentAttendanceTrend,
    getClassAttendanceTrend,
    getAttendanceAlerts,
    getStudentAttendanceAlerts,
    getStudentSubjectAbsence
};
