const Student = require('../models/studentSchema');
const Answer = require('../models/answerSchema');
const PracticeRecord = require('../models/practiceRecordSchema');
const KnowledgeBase = require('../models/knowledgeBaseSchema');
const LearningPath = require('../models/learningPathSchema');
const aiService = require('./aiService');

class LearningPathService {
    constructor() {
        this.LEARNING_STYLES = {
            visual: { priority: ['video', 'image', 'document'], pace: 'moderate' },
            auditory: { priority: ['video', 'audio', 'document'], pace: 'moderate' },
            reading: { priority: ['document', 'text', 'link'], pace: 'fast' },
            kinesthetic: { priority: ['interactive', 'practice', 'project'], pace: 'slow' }
        };

        this.DIFFICULTY_ADJUSTMENT = {
            beginner: { success: 0.6, fail: 0.3 },
            intermediate: { success: 0.75, fail: 0.5 },
            advanced: { success: 0.85, fail: 0.65 }
        };

        this.RECOMMENDATION_RULES = [
            { name: 'weakness_focus', weight: 0.35 },
            { name: 'learning_style', weight: 0.25 },
            { name: 'time_optimization', weight: 0.20 },
            { name: 'progress_momentum', weight: 0.20 }
        ];
    }

    async extractStudentFeatures(studentId, subjectId, options = {}) {
        const { daysBack = 90 } = options;
        const cutoffDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

        const [answers, practices, student, knowledgeBase] = await Promise.all([
            Answer.find({
                student: studentId,
                submitTime: { $gte: cutoffDate }
            }).populate('question', 'knowledgePoints difficulty type subject')
              .lean(),

            PracticeRecord.find({
                student: studentId,
                status: 'completed',
                endTime: { $gte: cutoffDate }
            }).lean(),

            Student.findById(studentId)
                .populate('sclassName', 'sclassName')
                .lean(),

            KnowledgeBase.find({ subject: subjectId, isActive: true }).lean()
        ]);

        const subjectAnswers = answers.filter(a =>
            a.question?.subject?.toString() === subjectId?.toString()
        );

        const features = {
            studentId,
            subjectId,
            performance: this._analyzePerformance(subjectAnswers, practices),
            knowledgeProfile: this._buildKnowledgeProfile(subjectAnswers),
            learningStyle: this._detectLearningStyle(practices, student),
            studyPatterns: this._analyzeStudyPatterns(practices, subjectAnswers),
            engagement: this._calculateEngagement(subjectAnswers, practices),
            difficulty: this._assessDifficulty(subjectAnswers, practices),
            strengths: [],
            weaknesses: [],
            recentTrend: 'stable'
        };

        features.strengths = this._identifyStrengths(features.knowledgeProfile);
        features.weaknesses = this._identifyWeaknesses(features.knowledgeProfile);
        features.recentTrend = this._calculateTrend(subjectAnswers.slice(-20));

        return features;
    }

    _analyzePerformance(answers, practices) {
        if (answers.length === 0 && practices.length === 0) {
            return { averageScore: 0, consistency: 0, improvement: 0 };
        }

        const scores = answers.map(a => a.maxScore > 0 ? (a.score / a.maxScore) : 0);
        const practiceScores = practices.map(p => p.percentage / 100);
        const allScores = [...scores, ...practiceScores];

        const avg = allScores.length > 0 ?
            allScores.reduce((sum, s) => sum + s, 0) / allScores.length : 0;

        const variance = allScores.length > 1 ?
            allScores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / allScores.length : 0;
        const consistency = Math.max(0, 1 - Math.sqrt(variance));

        const recentScores = allScores.slice(-10);
        const olderScores = allScores.slice(0, -10);
        const recentAvg = recentScores.length > 0 ?
            recentScores.reduce((s, a) => s + a, 0) / recentScores.length : 0;
        const olderAvg = olderScores.length > 0 ?
            olderScores.reduce((s, a) => s + a, 0) / olderScores.length : recentAvg;
        const improvement = recentAvg - olderAvg;

        return {
            averageScore: Math.round(avg * 100),
            consistency: Math.round(consistency * 100),
            improvement: Math.round(improvement * 100),
            totalAttempts: allScores.length,
            recentAverage: Math.round(recentAvg * 100)
        };
    }

    _buildKnowledgeProfile(answers) {
        const profile = {};

        answers.forEach(answer => {
            const points = answer.question?.knowledgePoints || [];
            points.forEach(point => {
                if (!profile[point]) {
                    profile[point] = { total: 0, correct: 0, attempts: [] };
                }
                profile[point].total++;
                if (answer.isCorrect) profile[point].correct++;
                profile[point].attempts.push({
                    score: answer.maxScore > 0 ? answer.score / answer.maxScore : 0,
                    date: answer.submitTime
                });
            });
        });

        Object.keys(profile).forEach(point => {
            const p = profile[point];
            p.mastery = p.total > 0 ? Math.round((p.correct / p.total) * 100) : 0;
        });

        return profile;
    }

    _detectLearningStyle(practices, student) {
        if (student?.selectedSubjects?.[0]?.learningPreferences?.preferredLearningStyle) {
            return student.selectedSubjects[0].learningPreferences.preferredLearningStyle;
        }

        const avgTime = practices.length > 0 ?
            practices.reduce((sum, p) => sum + (p.totalTime || 0), 0) / practices.length : 0;

        const hintUsage = practices.reduce((sum, p) => {
            const hintsUsed = p.answers?.reduce((h, a) => h + (a.hints?.length || 0), 0) || 0;
            return sum + hintsUsed;
        }, 0);

        if (hintUsage > practices.length * 2) return 'reading';
        if (avgTime > 1800) return 'kinesthetic';
        if (avgTime > 900) return 'visual';
        return 'auditory';
    }

    _analyzeStudyPatterns(practices, answers) {
        const timeSlots = { morning: 0, afternoon: 0, evening: 0, night: 0 };

        [...practices, ...answers].forEach(item => {
            const date = item.endTime || item.submitTime;
            if (date) {
                const hour = new Date(date).getHours();
                if (hour >= 6 && hour < 12) timeSlots.morning++;
                else if (hour >= 12 && hour < 18) timeSlots.afternoon++;
                else if (hour >= 18 && hour < 22) timeSlots.evening++;
                else timeSlots.night++;
            }
        });

        const total = Object.values(timeSlots).reduce((s, v) => s + v, 0) || 1;
        const peakTime = Object.entries(timeSlots)
            .sort((a, b) => b[1] - a[1])[0][0];

        const durations = practices.map(p => p.totalTime || 0).filter(d => d > 0);
        const avgDuration = durations.length > 0 ?
            durations.reduce((s, d) => s + d, 0) / durations.length : 0;

        return {
            peakStudyTime: peakTime,
            timeDistribution: {
                morning: Math.round(timeSlots.morning / total * 100),
                afternoon: Math.round(timeSlots.afternoon / total * 100),
                evening: Math.round(timeSlots.evening / total * 100),
                night: Math.round(timeSlots.night / total * 100)
            },
            averageSessionDuration: Math.round(avgDuration / 60),
            frequency: practices.length
        };
    }

    _calculateEngagement(answers, practices) {
        const totalActivities = answers.length + practices.length;
        if (totalActivities === 0) return { score: 50, level: 'low' };

        const recentCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentActivities = answers.filter(a => a.submitTime >= recentCutoff).length +
            practices.filter(p => p.endTime >= recentCutoff).length;

        const consistency = Math.min(recentActivities / 7, 1);
        const completionRate = practices.length > 0 ?
            practices.filter(p => p.status === 'completed').length / practices.length : 1;

        const score = Math.round((consistency * 0.6 + completionRate * 0.4) * 100);

        return {
            score,
            level: score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low',
            recentActivityCount: recentActivities,
            completionRate: Math.round(completionRate * 100)
        };
    }

    _assessDifficulty(answers, practices) {
        const correctRates = answers.map(a =>
            a.maxScore > 0 ? a.score / a.maxScore : (a.isCorrect ? 1 : 0)
        );

        if (correctRates.length === 0) return { level: 'intermediate', confidence: 0 };

        const avgRate = correctRates.reduce((s, r) => s + r, 0) / correctRates.length;

        let level = 'intermediate';
        if (avgRate >= 0.8) level = 'advanced';
        else if (avgRate < 0.5) level = 'beginner';

        return { level, confidence: Math.round(avgRate * 100) };
    }

    _identifyStrengths(knowledgeProfile) {
        return Object.entries(knowledgeProfile)
            .filter(([_, data]) => data.mastery >= 70)
            .map(([point, data]) => ({ point, mastery: data.mastery }))
            .sort((a, b) => b.mastery - a.mastery)
            .slice(0, 5)
            .map(s => s.point);
    }

    _identifyWeaknesses(knowledgeProfile) {
        return Object.entries(knowledgeProfile)
            .filter(([_, data]) => data.mastery < 60 && data.total >= 2)
            .map(([point, data]) => ({ point, mastery: data.mastery }))
            .sort((a, b) => a.mastery - b.mastery)
            .slice(0, 5)
            .map(w => w.point);
    }

    _calculateTrend(recentAnswers) {
        if (recentAnswers.length < 5) return 'stable';

        const mid = Math.floor(recentAnswers.length / 2);
        const firstHalf = recentAnswers.slice(0, mid);
        const secondHalf = recentAnswers.slice(mid);

        const avgFirst = firstHalf.reduce((s, a) =>
            s + (a.maxScore > 0 ? a.score / a.maxScore : 0), 0) / firstHalf.length;
        const avgSecond = secondHalf.reduce((s, a) =>
            s + (a.maxScore > 0 ? a.score / a.maxScore : 0), 0) / secondHalf.length;

        const diff = avgSecond - avgFirst;
        if (diff > 0.1) return 'improving';
        if (diff < -0.1) return 'declining';
        return 'stable';
    }

    async generateRuleBasedRecommendations(features, context = {}) {
        const recommendations = [];

        if (features.weaknesses.length > 0) {
            recommendations.push({
                type: 'content',
                title: '重点攻克薄弱知识点',
                description: `建议优先学习：${features.weaknesses.slice(0, 3).join('、')}`,
                priority: 'high',
                reason: `当前掌握率低于60%，需要加强练习`,
                weight: 0.35
            });
        }

        if (features.strengths.length > 0) {
            recommendations.push({
                type: 'content',
                title: '巩固优势领域',
                description: `继续深化：${features.strengths.slice(0, 2).join('、')}`,
                priority: 'medium',
                reason: '保持优势，防止遗忘',
                weight: 0.15
            });
        }

        const styleConfig = this.LEARNING_STYLES[features.learningStyle] || this.LEARNING_STYLES.visual;
        recommendations.push({
            type: 'study_method',
            title: `推荐${this._getStyleName(features.learningStyle)}学习方式`,
            description: `建议使用${styleConfig.priority.join('、')}类型资源`,
            priority: 'medium',
            reason: '根据学习风格分析得出',
            weight: 0.20
        });

        if (features.studyPatterns.peakStudyTime) {
            recommendations.push({
                type: 'timing',
                title: '最佳学习时段建议',
                description: `推荐在${this._getTimeSlotName(features.studyPatterns.peakStudyTime)}学习`,
                priority: 'low',
                reason: '基于历史学习数据分析',
                weight: 0.15
            });
        }

        if (features.recentTrend === 'declining') {
            recommendations.push({
                type: 'review',
                title: '建议进行复习巩固',
                description: '近期学习效果有所下滑，建议回顾已学内容',
                priority: 'high',
                reason: '检测到学习趋势下降',
                weight: 0.25
            });
        }

        if (features.engagement.level === 'low') {
            recommendations.push({
                type: 'study_method',
                title: '提高学习参与度',
                description: '建议设置小目标，逐步建立学习习惯',
                priority: 'high',
                reason: '近期学习活动较少',
                weight: 0.20
            });
        }

        recommendations.forEach((r, i) => {
            r.id = `rule_${i + 1}`;
            r.source = 'rule';
        });

        return recommendations;
    }

    async enhanceWithAI(features, ruleRecommendations, context = {}) {
        try {
            const prompt = this._buildAIEnhancementPrompt(features, ruleRecommendations, context);

            const aiResult = await aiService.queryKnowledgeBase(prompt, null, {
                type: 'learning_path_enhancement',
                studentLevel: features.difficulty.level,
                subject: context.subjectName
            });

            if (!aiResult.success) {
                return { enhanced: false, recommendations: ruleRecommendations, reason: aiResult.error };
            }

            const aiRecommendations = this._parseAIRecommendations(aiResult.answer);

            const merged = this._mergeRecommendations(ruleRecommendations, aiRecommendations);

            return {
                enhanced: true,
                recommendations: merged,
                aiContributions: aiRecommendations.length,
                confidence: aiResult.confidence || 0.8
            };
        } catch (error) {
            console.error('AI增强失败:', error.message);
            return {
                enhanced: false,
                recommendations: ruleRecommendations,
                reason: error.message
            };
        }
    }

    _buildAIEnhancementPrompt(features, ruleRecommendations, context) {
        return `基于学生特征和规则推荐，生成增强学习建议。

学生特征：
- 整体表现：${features.performance.averageScore}%，趋势：${features.recentTrend}
- 薄弱点：${features.weaknesses.join('、') || '无'}
- 优势点：${features.strengths.join('、') || '无'}
- 学习风格：${this._getStyleName(features.learningStyle)}
- 参与度：${features.engagement.level}

规则推荐：
${ruleRecommendations.map(r => `- [${r.priority}] ${r.title}: ${r.description}`).join('\n')}

请补充以下建议（JSON格式）：
1. 具体学习资源和内容建议
2. 难度递进建议
3. 个性化学习策略
4. 短期可达成的小目标

返回格式：
{
  "additionalRecommendations": [
    {"type": "content|method|timing|goal", "title": "...", "description": "...", "priority": "high|medium|low"}
  ],
  "learningSequence": ["第一步", "第二步", ...],
  "weeklyGoals": ["目标1", "目标2"]
}`;
    }

    _parseAIRecommendations(response) {
        try {
            const parsed = typeof response === 'string' ? JSON.parse(response) : response;
            const recommendations = parsed.additionalRecommendations || [];

            return recommendations.map((r, i) => ({
                ...r,
                id: `ai_${i + 1}`,
                source: 'ai',
                weight: 0.3
            }));
        } catch (error) {
            console.error('解析AI推荐失败:', error.message);
            return [];
        }
    }

    _mergeRecommendations(ruleRecs, aiRecs) {
        const merged = [...ruleRecs];
        const existingTypes = new Set(ruleRecs.map(r => r.type));

        aiRecs.forEach(aiRec => {
            const existing = merged.find(r => r.type === aiRec.type);
            if (existing) {
                existing.description = `${existing.description}。AI补充：${aiRec.description}`;
                existing.aiEnhanced = true;
            } else {
                merged.push(aiRec);
            }
        });

        return merged.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    }

    async generateDailyRecommendations(studentId, subjectId, options = {}) {
        const features = await this.extractStudentFeatures(studentId, subjectId);
        const existingPath = await LearningPath.findActiveByStudentSubject(studentId, subjectId);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let recommendations = await this.generateRuleBasedRecommendations(features, options);

        if (options.useAI !== false) {
            const aiResult = await this.enhanceWithAI(features, recommendations, options);
            if (aiResult.enhanced) {
                recommendations = aiResult.recommendations;
            }
        }

        const activities = this._buildDailyActivities(recommendations, features, existingPath);

        const dailyRecommendation = {
            date: today,
            activities,
            generatedAt: new Date(),
            source: recommendations.some(r => r.source === 'ai') ? 'hybrid' : 'rule'
        };

        if (existingPath) {
            await existingPath.addDailyRecommendation(dailyRecommendation);
        }

        return {
            date: today,
            activities,
            features: {
                performance: features.performance,
                engagement: features.engagement,
                trend: features.recentTrend
            },
            source: dailyRecommendation.source
        };
    }

    _buildDailyActivities(recommendations, features, existingPath) {
        const activities = [];
        let totalEstimatedTime = 0;
        const maxDailyTime = 90; // 分钟

        const currentPhase = existingPath?.getCurrentPhase();

        if (currentPhase && currentPhase.topics?.length > 0) {
            const remainingTopics = currentPhase.topics.filter(t =>
                !features.strengths.includes(t)
            );

            if (remainingTopics.length > 0) {
                activities.push({
                    type: 'lesson',
                    title: `继续学习：${currentPhase.name}`,
                    description: `重点内容：${remainingTopics.slice(0, 2).join('、')}`,
                    estimatedTime: 30,
                    priority: 1,
                    phaseId: currentPhase.id
                });
                totalEstimatedTime += 30;
            }
        }

        if (features.weaknesses.length > 0 && totalEstimatedTime < maxDailyTime) {
            activities.push({
                type: 'practice',
                title: '针对性练习',
                description: `练习薄弱点：${features.weaknesses.slice(0, 2).join('、')}`,
                estimatedTime: 20,
                priority: 2
            });
            totalEstimatedTime += 20;
        }

        if (features.performance.averageScore > 60 && totalEstimatedTime < maxDailyTime) {
            activities.push({
                type: 'review',
                title: '知识回顾',
                description: '复习近期学习内容，巩固记忆',
                estimatedTime: 15,
                priority: 3
            });
            totalEstimatedTime += 15;
        }

        recommendations.slice(0, 2).forEach(rec => {
            if (totalEstimatedTime < maxDailyTime && !activities.some(a => a.title === rec.title)) {
                activities.push({
                    type: this._mapRecommendationType(rec.type),
                    title: rec.title,
                    description: rec.description,
                    estimatedTime: 15,
                    priority: rec.priority === 'high' ? 1 : rec.priority === 'medium' ? 2 : 3
                });
                totalEstimatedTime += 15;
            }
        });

        return activities.sort((a, b) => a.priority - b.priority);
    }

    _mapRecommendationType(type) {
        const mapping = {
            content: 'lesson',
            study_method: 'practice',
            timing: 'lesson',
            review: 'review',
            goal: 'practice'
        };
        return mapping[type] || 'lesson';
    }

    _getStyleName(style) {
        const names = {
            visual: '视觉型',
            auditory: '听觉型',
            reading: '阅读型',
            kinesthetic: '动手型'
        };
        return names[style] || '视觉型';
    }

    _getTimeSlotName(slot) {
        const names = {
            morning: '上午(6-12点)',
            afternoon: '下午(12-18点)',
            evening: '晚间(18-22点)',
            night: '夜间(22-6点)'
        };
        return names[slot] || '任意时间';
    }

    async createLearningPath(studentId, subjectId, options = {}) {
        const features = await this.extractStudentFeatures(studentId, subjectId);

        const recommendations = await this.generateRuleBasedRecommendations(features, options);

        let finalRecommendations = recommendations;
        let aiGenerated = false;

        if (options.useAI !== false) {
            const aiResult = await this.enhanceWithAI(features, recommendations, options);
            if (aiResult.enhanced) {
                finalRecommendations = aiResult.recommendations;
                aiGenerated = true;
            }
        }

        const phases = this._buildPhases(features, finalRecommendations, options);

        const learningPath = new LearningPath({
            student: studentId,
            subject: subjectId,
            phases,
            personalizedElements: {
                focusAreas: features.weaknesses,
                strengthAreas: features.strengths,
                learningStyle: features.learningStyle,
                difficulty: features.difficulty.level,
                preferredResourceTypes: this.LEARNING_STYLES[features.learningStyle]?.priority || []
            },
            recommendations: finalRecommendations.map(r => ({
                ...r,
                applied: false
            })),
            aiGenerated,
            totalDuration: phases.reduce((sum, p) => sum + (p.duration || 0), 0),
            estimatedCompletion: this._calculateEstimatedCompletion(phases, options.timeframe)
        });

        return await learningPath.save();
    }

    _buildPhases(features, recommendations, options) {
        const weaknesses = features.weaknesses;
        const strengths = features.strengths;
        const level = features.difficulty.level;

        const phases = [
            {
                id: 1,
                name: '基础诊断与巩固',
                description: '评估当前水平，巩固基础知识',
                duration: level === 'beginner' ? 40 : 25,
                topics: weaknesses.length > 0 ? weaknesses.slice(0, 3) : ['基础知识回顾'],
                activities: ['诊断测试', '基础复习', '针对性练习'],
                resources: [],
                status: 'not_started',
                progress: 0
            },
            {
                id: 2,
                name: '核心内容学习',
                description: '系统学习核心知识点',
                duration: 50,
                topics: ['核心概念', '重点知识', '关键技能'],
                activities: ['视频学习', '笔记整理', '课后练习'],
                resources: [],
                status: 'not_started',
                progress: 0
            },
            {
                id: 3,
                name: '能力提升训练',
                description: '提升应用能力和解题技巧',
                duration: level === 'advanced' ? 25 : 35,
                topics: strengths.length > 0 ? strengths.slice(0, 2) : ['综合应用'],
                activities: ['综合练习', '错题分析', '技巧训练'],
                resources: [],
                status: 'not_started',
                progress: 0
            },
            {
                id: 4,
                name: '巩固与拓展',
                description: '巩固学习成果，适度拓展',
                duration: 10,
                topics: ['复习巩固', '拓展提升'],
                activities: ['阶段测试', '总结回顾', '拓展学习'],
                resources: [],
                status: 'not_started',
                progress: 0
            }
        ];

        if (recommendations) {
            const contentRecs = recommendations.filter(r => r.type === 'content');
            if (contentRecs.length > 0) {
                phases[1].topics = [...new Set([...phases[1].topics, ...contentRecs.slice(0, 2).map(r => r.title)])];
            }
        }

        return phases;
    }

    _calculateEstimatedCompletion(phases, timeframe) {
        const totalHours = phases.reduce((sum, p) => sum + (p.duration || 0), 0);
        const weeklyHours = timeframe?.weeklyHours || 10;
        const weeks = Math.ceil(totalHours / weeklyHours);

        const startDate = new Date();
        const completionDate = new Date(startDate.getTime() + weeks * 7 * 24 * 60 * 60 * 1000);

        return {
            estimatedWeeks: weeks,
            estimatedHours: totalHours,
            startDate,
            completionDate,
            lastCalculated: new Date()
        };
    }
}

module.exports = new LearningPathService();