/**
 * Word文档生成工具
 * 支持生成实训练习、考核题目等类型的Word文档
 */

const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, UnderlineType } = require('docx');

/**
 * 生成Word文档
 * @param {Object} data - 文档数据
 * @param {string} type - 文档类型 ('practical-exercise', 'assessment', 'courseware')
 * @returns {Buffer} Word文档缓冲区
 */
const generateWordDocument = async (data, type = 'practical-exercise') => {
    let doc;

    switch (type) {
        case 'practical-exercise':
            doc = await generatePracticalExerciseDocument(data);
            break;
        case 'assessment':
            doc = await generateAssessmentDocument(data);
            break;
        case 'courseware':
            doc = await generateCoursewareDocument(data);
            break;
        default:
            throw new Error(`不支持的文档类型: ${type}`);
    }

    return await Packer.toBuffer(doc);
};

/**
 * 生成实训练习Word文档
 */
const generatePracticalExerciseDocument = async (data) => {
    const children = [];

    // 标题
    children.push(new Paragraph({
        children: [
            new TextRun({
                text: data.title || '实训练习',
                bold: true,
                size: 32,
                color: "2E74B5"
            })
        ],
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
    }));

    // 基本信息
    children.push(new Paragraph({
        children: [
            new TextRun({
                text: "实训练习基本信息",
                bold: true,
                size: 24,
                underline: { type: UnderlineType.SINGLE }
            })
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 200 }
    }));

    // 添加基本信息段落
    const basicInfo = [
        { label: "科目", value: data.subject || '未知科目' },
        { label: "教师", value: data.teacher || '未知教师' },
        { label: "课件", value: data.courseware || '无关联课件' },
        { label: "难度", value: data.difficulty || '中级' },
        { label: "时长", value: `${data.duration || 60}分钟` },
        { label: "练习类型", value: data.exerciseType || '综合实训' },
        { label: "总分", value: `${data.totalPoints || 100}分` },
        { label: "创建时间", value: new Date(data.createdAt || Date.now()).toLocaleString() }
    ];

    basicInfo.forEach(info => {
        children.push(new Paragraph({
            children: [
                new TextRun({ text: `${info.label}：`, bold: true }),
                new TextRun({ text: info.value })
            ],
            spacing: { after: 100 }
        }));
    });

    // 描述
    if (data.description) {
        children.push(new Paragraph({
            children: [
                new TextRun({ text: "练习描述：", bold: true }),
                new TextRun({ text: data.description })
            ],
            spacing: { after: 200 }
        }));
    }

    // 目标技能
    if (data.targetSkills && data.targetSkills.length > 0) {
        children.push(new Paragraph({
            children: [
                new TextRun({
                    text: "目标技能",
                    bold: true,
                    size: 20,
                    underline: { type: UnderlineType.SINGLE }
                })
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 }
        }));

        data.targetSkills.forEach((skill, index) => {
            children.push(new Paragraph({
                children: [
                    new TextRun({ text: `${index + 1}. ${skill}` })
                ],
                spacing: { after: 50 }
            }));
        });
    }

    // 题目详情
    if (data.questions && data.questions.length > 0) {
        children.push(new Paragraph({
            children: [
                new TextRun({
                    text: "题目详情",
                    bold: true,
                    size: 20,
                    underline: { type: UnderlineType.SINGLE }
                })
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 200 }
        }));

        data.questions.forEach((question, index) => {
            // 题目标题
            children.push(new Paragraph({
                children: [
                    new TextRun({
                        text: `题目 ${question.questionNumber || index + 1}`,
                        bold: true,
                        size: 18,
                        color: "2E74B5"
                    })
                ],
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 200, after: 100 }
            }));

            // 题目描述
            if (question.questionText) {
                children.push(new Paragraph({
                    children: [
                        new TextRun({ text: "题目描述：", bold: true }),
                        new TextRun({ text: question.questionText })
                    ],
                    spacing: { after: 100 }
                }));
            }

            // 要求
            if (question.requirements && question.requirements.length > 0) {
                children.push(new Paragraph({
                    children: [new TextRun({ text: "要求：", bold: true })],
                    spacing: { after: 50 }
                }));

                question.requirements.forEach((req, reqIndex) => {
                    const reqText = typeof req === 'string' ? req : req.description || req;
                    children.push(new Paragraph({
                        children: [new TextRun({ text: `${reqIndex + 1}. ${reqText}` })],
                        spacing: { after: 50 }
                    }));
                });
            }

            // 参考答案
            if (question.referenceAnswer) {
                children.push(new Paragraph({
                    children: [new TextRun({ text: "参考答案：", bold: true })],
                    spacing: { before: 100, after: 50 }
                }));

                if (Array.isArray(question.referenceAnswer)) {
                    question.referenceAnswer.forEach((answer, ansIndex) => {
                        children.push(new Paragraph({
                            children: [new TextRun({ text: `${ansIndex + 1}. ${answer}` })],
                            spacing: { after: 30 }
                        }));
                    });
                } else {
                    children.push(new Paragraph({
                        children: [new TextRun({ text: question.referenceAnswer })],
                        spacing: { after: 50 }
                    }));
                }
            }

            // 代码模板
            if (question.codeTemplate && question.codeTemplate.template) {
                children.push(new Paragraph({
                    children: [new TextRun({ text: "代码模板：", bold: true })],
                    spacing: { before: 100, after: 50 }
                }));

                children.push(new Paragraph({
                    children: [new TextRun({ 
                        text: question.codeTemplate.template.replace(/\\n/g, '\n'),
                        font: "Consolas"
                    })],
                    spacing: { after: 100 }
                }));
            }

            // 评分标准
            if (question.gradingCriteria && question.gradingCriteria.length > 0) {
                children.push(new Paragraph({
                    children: [new TextRun({ text: "评分标准：", bold: true })],
                    spacing: { before: 100, after: 50 }
                }));

                question.gradingCriteria.forEach((criteria, critIndex) => {
                    const criteriaText = typeof criteria === 'string' ? criteria : 
                                       `${criteria.criterion} (${criteria.points || 10}分)`;
                    children.push(new Paragraph({
                        children: [new TextRun({ text: `${critIndex + 1}. ${criteriaText}` })],
                        spacing: { after: 30 }
                    }));
                });
            }

            // 知识点说明
            if (question.explanation || question.knowledgePoints) {
                const explanation = question.explanation || 
                                  (Array.isArray(question.knowledgePoints) ? 
                                   question.knowledgePoints.join('; ') : 
                                   question.knowledgePoints);
                
                children.push(new Paragraph({
                    children: [
                        new TextRun({ text: "知识点说明：", bold: true }),
                        new TextRun({ text: explanation })
                    ],
                    spacing: { before: 100, after: 100 }
                }));
            }

            // 环境要求
            if (question.environmentRequirements) {
                const env = question.environmentRequirements;
                const envText = typeof env === 'string' ? env : 
                               `软件：${env.software || 'Python 3.7+'}, 硬件：${env.hardware || '标准配置'}, 网络：${env.network || '无特殊要求'}`;
                
                children.push(new Paragraph({
                    children: [
                        new TextRun({ text: "环境要求：", bold: true }),
                        new TextRun({ text: envText })
                    ],
                    spacing: { after: 200 }
                }));
            }

            // 题目分隔线
            if (index < data.questions.length - 1) {
                children.push(new Paragraph({
                    children: [new TextRun({ text: "─".repeat(50), color: "CCCCCC" })],
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 100, after: 100 }
                }));
            }
        });
    }

    // 页脚信息
    children.push(new Paragraph({
        children: [
            new TextRun({
                text: "本实训练习由AI智能生成，仅供教学参考使用。",
                italics: true,
                size: 18,
                color: "666666"
            })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 }
    }));

    return new Document({
        sections: [{
            properties: {},
            children: children
        }]
    });
};

/**
 * 生成考核题目Word文档
 */
const generateAssessmentDocument = async (data) => {
    // 这里可以添加考核题目的特定格式
    // 暂时使用实训练习的格式作为基础
    return await generatePracticalExerciseDocument(data);
};

/**
 * 生成课件Word文档
 */
const generateCoursewareDocument = async (data) => {
    // 这里可以添加课件的特定格式
    // 暂时使用实训练习的格式作为基础
    return await generatePracticalExerciseDocument(data);
};

/**
 * 安全处理文件名，避免HTTP头部编码错误
 * @param {string} title - 原始标题
 * @param {string} prefix - 文件名前缀
 * @param {string} extension - 文件扩展名
 * @returns {object} 包含安全文件名和编码文件名的对象
 */
const createSafeFilename = (title, prefix = '', extension = '.docx') => {
    // 移除特殊字符，只保留字母、数字、空格和连字符
    const safeTitle = title ? title.replace(/[^\w\s-]/g, '').substring(0, 50) : '文档';
    const timestamp = Date.now();
    const filename = prefix ? `${prefix}_${safeTitle}_${timestamp}${extension}` : `${safeTitle}_${timestamp}${extension}`;
    const encodedFilename = encodeURIComponent(filename);

    return {
        filename,
        encodedFilename,
        contentDisposition: `attachment; filename*=UTF-8''${encodedFilename}`
    };
};

module.exports = {
    generateWordDocument,
    generatePracticalExerciseDocument,
    generateAssessmentDocument,
    generateCoursewareDocument,
    createSafeFilename
};
