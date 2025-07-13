const mongoose = require('mongoose');
const Student = require('../models/studentSchema');
const Subject = require('../models/subjectSchema');

// 连接数据库
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/school', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('数据库连接成功');
    } catch (error) {
        console.error('数据库连接失败:', error);
        process.exit(1);
    }
};

// 为现有学生自动分配班级科目
const migrateStudentSubjects = async () => {
    try {
        console.log('开始迁移学生科目数据...');

        // 获取所有学生
        const students = await Student.find({}).populate('sclassName');
        console.log(`找到 ${students.length} 名学生`);

        let processedCount = 0;
        let errorCount = 0;

        for (const student of students) {
            try {
                // 检查学生是否已有科目选择
                if (student.selectedSubjects && student.selectedSubjects.length > 0) {
                    console.log(`学生 ${student.name} 已有科目选择，跳过`);
                    continue;
                }

                // 检查学生是否有班级
                if (!student.sclassName) {
                    console.log(`学生 ${student.name} 未分配班级，跳过`);
                    continue;
                }

                // 获取班级的所有科目
                const classSubjects = await Subject.findByClass(student.sclassName._id);
                
                if (classSubjects.length === 0) {
                    console.log(`班级 ${student.sclassName.sclassName} 没有科目，跳过学生 ${student.name}`);
                    continue;
                }

                // 为学生添加班级科目
                const selectedSubjects = [];
                for (const subject of classSubjects) {
                    selectedSubjects.push({
                        subject: subject._id,
                        enrollmentDate: student.createdAt || new Date(),
                        status: 'active',
                        isRequired: true,
                        learningPreferences: {
                            difficulty: 'intermediate',
                            studyGoals: [],
                            preferredLearningStyle: 'visual'
                        }
                    });
                }

                // 更新学生记录
                student.selectedSubjects = selectedSubjects;
                await student.save();

                console.log(`✅ 学生 ${student.name} 成功分配 ${classSubjects.length} 门科目`);
                processedCount++;

            } catch (error) {
                console.error(`❌ 处理学生 ${student.name} 时出错:`, error.message);
                errorCount++;
            }
        }

        console.log('\n迁移完成！');
        console.log(`成功处理: ${processedCount} 名学生`);
        console.log(`错误数量: ${errorCount}`);

    } catch (error) {
        console.error('迁移过程中出错:', error);
    }
};

// 验证迁移结果
const validateMigration = async () => {
    try {
        console.log('\n开始验证迁移结果...');

        const totalStudents = await Student.countDocuments({});
        const studentsWithSubjects = await Student.countDocuments({
            'selectedSubjects.0': { $exists: true }
        });
        const studentsWithoutClass = await Student.countDocuments({
            sclassName: { $exists: false }
        });

        console.log(`总学生数: ${totalStudents}`);
        console.log(`有科目选择的学生: ${studentsWithSubjects}`);
        console.log(`未分配班级的学生: ${studentsWithoutClass}`);

        // 统计科目分配情况
        const subjectStats = await Student.aggregate([
            { $match: { 'selectedSubjects.0': { $exists: true } } },
            { $unwind: '$selectedSubjects' },
            { $group: { 
                _id: '$selectedSubjects.subject',
                studentCount: { $sum: 1 }
            }},
            { $lookup: {
                from: 'subjects',
                localField: '_id',
                foreignField: '_id',
                as: 'subject'
            }},
            { $unwind: '$subject' },
            { $project: {
                subjectName: '$subject.subName',
                studentCount: 1
            }},
            { $sort: { studentCount: -1 } }
        ]);

        console.log('\n科目选择统计:');
        subjectStats.forEach(stat => {
            console.log(`${stat.subjectName}: ${stat.studentCount} 名学生`);
        });

    } catch (error) {
        console.error('验证过程中出错:', error);
    }
};

// 主函数
const main = async () => {
    await connectDB();
    
    console.log('学生科目数据迁移工具');
    console.log('====================');
    
    const args = process.argv.slice(2);
    
    if (args.includes('--validate-only')) {
        await validateMigration();
    } else if (args.includes('--help')) {
        console.log('使用方法:');
        console.log('node migrateStudentSubjects.js           # 执行迁移');
        console.log('node migrateStudentSubjects.js --validate-only  # 仅验证结果');
        console.log('node migrateStudentSubjects.js --help    # 显示帮助');
    } else {
        await migrateStudentSubjects();
        await validateMigration();
    }
    
    await mongoose.connection.close();
    console.log('数据库连接已关闭');
};

// 运行脚本
if (require.main === module) {
    main().catch(error => {
        console.error('脚本执行失败:', error);
        process.exit(1);
    });
}

module.exports = {
    migrateStudentSubjects,
    validateMigration
};
