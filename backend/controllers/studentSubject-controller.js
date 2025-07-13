const Student = require('../models/studentSchema');
const Subject = require('../models/subjectSchema');
const Sclass = require('../models/sclassSchema');

/**
 * 获取学生的科目列表（包括班级科目和选修科目）
 */
const getStudentSubjects = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { includeClassSubjects = true, status = 'active' } = req.query;

        const student = await Student.findById(studentId)
            .populate('sclassName', 'sclassName grade')
            .populate('selectedSubjects.subject', 'subName subCode description subjectType credits isRequired status');

        if (!student) {
            return res.status(404).json({ message: '学生不存在' });
        }

        let allSubjects = [];

        // 获取班级必修科目
        if (includeClassSubjects && student.sclassName) {
            const classSubjects = await Subject.findByClass(student.sclassName._id);
            const classSubjectsFormatted = classSubjects
                .filter(subject => subject.status === 'active')
                .map(subject => ({
                    _id: subject._id,
                    subName: subject.subName,
                    subCode: subject.subCode,
                    description: subject.description,
                    subjectType: subject.subjectType,
                    credits: subject.credits,
                    isRequired: true,
                    status: 'active',
                    source: 'class',
                    enrollmentDate: student.createdAt,
                    learningPreferences: {
                        difficulty: 'intermediate',
                        studyGoals: [],
                        preferredLearningStyle: 'visual'
                    }
                }));
            allSubjects.push(...classSubjectsFormatted);
        }

        // 获取学生选择的科目
        const selectedSubjects = student.selectedSubjects
            .filter(sub => status === 'all' || sub.status === status)
            .map(sub => ({
                _id: sub.subject._id,
                subName: sub.subject.subName,
                subCode: sub.subject.subCode,
                description: sub.subject.description,
                subjectType: sub.subject.subjectType,
                credits: sub.subject.credits,
                isRequired: sub.isRequired,
                status: sub.status,
                source: 'selected',
                enrollmentDate: sub.enrollmentDate,
                learningPreferences: sub.learningPreferences
            }));

        allSubjects.push(...selectedSubjects);

        // 去重（优先保留选择的科目设置）
        const uniqueSubjects = [];
        const seenSubjects = new Set();

        for (const subject of allSubjects) {
            if (!seenSubjects.has(subject._id.toString())) {
                uniqueSubjects.push(subject);
                seenSubjects.add(subject._id.toString());
            }
        }

        res.json({
            success: true,
            data: {
                studentId: student._id,
                studentName: student.name,
                className: student.sclassName?.sclassName || '未分配班级',
                subjects: uniqueSubjects,
                totalSubjects: uniqueSubjects.length,
                requiredSubjects: uniqueSubjects.filter(s => s.isRequired).length,
                electiveSubjects: uniqueSubjects.filter(s => !s.isRequired).length
            }
        });

    } catch (error) {
        console.error('获取学生科目列表错误:', error);
        res.status(500).json({
            success: false,
            message: '获取学生科目列表失败',
            error: error.message
        });
    }
};

/**
 * 获取可选择的科目列表
 */
const getAvailableSubjects = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { subjectType = 'all', excludeSelected = true } = req.query;

        const student = await Student.findById(studentId)
            .populate('sclassName', 'sclassName')
            .populate('selectedSubjects.subject', '_id');

        if (!student) {
            return res.status(404).json({ message: '学生不存在' });
        }

        // 构建查询条件
        const query = { 
            school: student.school,
            status: 'active'
        };

        if (subjectType !== 'all') {
            query.subjectType = subjectType;
        }

        // 获取所有可用科目
        let availableSubjects = await Subject.find(query)
            .populate('sclassName', 'sclassName grade')
            .populate('teacher', 'name')
            .sort({ subjectType: 1, subName: 1 });

        // 排除已选择的科目
        if (excludeSelected) {
            const selectedSubjectIds = student.selectedSubjects.map(sub => sub.subject._id.toString());
            availableSubjects = availableSubjects.filter(
                subject => !selectedSubjectIds.includes(subject._id.toString())
            );
        }

        // 格式化响应数据
        const formattedSubjects = availableSubjects.map(subject => ({
            _id: subject._id,
            subName: subject.subName,
            subCode: subject.subCode,
            description: subject.description,
            subjectType: subject.subjectType,
            credits: subject.credits,
            isRequired: subject.isRequired,
            className: subject.sclassName?.sclassName || '未分配',
            teacherName: subject.teacher?.name || '未分配',
            sessions: subject.sessions
        }));

        res.json({
            success: true,
            data: {
                subjects: formattedSubjects,
                totalCount: formattedSubjects.length,
                subjectTypes: [...new Set(formattedSubjects.map(s => s.subjectType))]
            }
        });

    } catch (error) {
        console.error('获取可选科目列表错误:', error);
        res.status(500).json({
            success: false,
            message: '获取可选科目列表失败',
            error: error.message
        });
    }
};

/**
 * 学生选择科目
 */
const selectSubject = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { subjectId, learningPreferences = {} } = req.body;

        const student = await Student.findById(studentId);
        const subject = await Subject.findById(subjectId);

        if (!student) {
            return res.status(404).json({ message: '学生不存在' });
        }

        if (!subject) {
            return res.status(404).json({ message: '科目不存在' });
        }

        // 检查是否已经选择过该科目
        const existingSelection = student.selectedSubjects.find(
            sub => sub.subject.toString() === subjectId
        );

        if (existingSelection) {
            return res.status(400).json({ message: '已经选择过该科目' });
        }

        // 添加科目选择
        await student.addSubject(subjectId, {
            isRequired: false,
            learningPreferences: {
                difficulty: learningPreferences.difficulty || 'intermediate',
                studyGoals: learningPreferences.studyGoals || [],
                preferredLearningStyle: learningPreferences.preferredLearningStyle || 'visual'
            }
        });

        res.json({
            success: true,
            message: '科目选择成功',
            data: {
                studentId: student._id,
                subjectId: subject._id,
                subjectName: subject.subName
            }
        });

    } catch (error) {
        console.error('选择科目错误:', error);
        res.status(500).json({
            success: false,
            message: '选择科目失败',
            error: error.message
        });
    }
};

/**
 * 取消选择科目
 */
const unselectSubject = async (req, res) => {
    try {
        const { studentId, subjectId } = req.params;

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: '学生不存在' });
        }

        // 检查科目是否为必修课
        const subjectSelection = student.selectedSubjects.find(
            sub => sub.subject.toString() === subjectId
        );

        if (subjectSelection && subjectSelection.isRequired) {
            return res.status(400).json({ message: '必修课不能取消选择' });
        }

        await student.removeSubject(subjectId);

        res.json({
            success: true,
            message: '取消选择成功'
        });

    } catch (error) {
        console.error('取消选择科目错误:', error);
        res.status(500).json({
            success: false,
            message: '取消选择科目失败',
            error: error.message
        });
    }
};

/**
 * 更新学习偏好
 */
const updateLearningPreferences = async (req, res) => {
    try {
        const { studentId, subjectId } = req.params;
        const { learningPreferences } = req.body;

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: '学生不存在' });
        }

        const subjectSelection = student.selectedSubjects.find(
            sub => sub.subject.toString() === subjectId
        );

        if (!subjectSelection) {
            return res.status(404).json({ message: '未找到该科目选择记录' });
        }

        // 更新学习偏好
        subjectSelection.learningPreferences = {
            ...subjectSelection.learningPreferences,
            ...learningPreferences
        };

        await student.save();

        res.json({
            success: true,
            message: '学习偏好更新成功',
            data: subjectSelection.learningPreferences
        });

    } catch (error) {
        console.error('更新学习偏好错误:', error);
        res.status(500).json({
            success: false,
            message: '更新学习偏好失败',
            error: error.message
        });
    }
};

/**
 * 自动为学生分配班级必修科目
 */
const autoAssignClassSubjects = async (req, res) => {
    try {
        const { studentId } = req.params;

        const student = await Student.findById(studentId).populate('sclassName');
        if (!student) {
            return res.status(404).json({ message: '学生不存在' });
        }

        if (!student.sclassName) {
            return res.status(400).json({ message: '学生未分配班级' });
        }

        // 获取班级的所有科目
        const classSubjects = await Subject.findByClass(student.sclassName._id);
        
        let assignedCount = 0;
        for (const subject of classSubjects) {
            const existingSelection = student.selectedSubjects.find(
                sub => sub.subject.toString() === subject._id.toString()
            );

            if (!existingSelection) {
                await student.addSubject(subject._id, {
                    isRequired: true,
                    learningPreferences: {
                        difficulty: 'intermediate',
                        studyGoals: [],
                        preferredLearningStyle: 'visual'
                    }
                });
                assignedCount++;
            }
        }

        res.json({
            success: true,
            message: `成功分配 ${assignedCount} 门班级必修科目`,
            data: {
                assignedCount,
                totalClassSubjects: classSubjects.length
            }
        });

    } catch (error) {
        console.error('自动分配班级科目错误:', error);
        res.status(500).json({
            success: false,
            message: '自动分配班级科目失败',
            error: error.message
        });
    }
};

module.exports = {
    getStudentSubjects,
    getAvailableSubjects,
    selectSubject,
    unselectSubject,
    updateLearningPreferences,
    autoAssignClassSubjects
};
