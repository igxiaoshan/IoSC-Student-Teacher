const mongoose = require('mongoose');

const learningPathSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'student',
        required: true
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'subject',
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'paused', 'completed', 'archived'],
        default: 'active'
    },
    generatedAt: {
        type: Date,
        default: Date.now
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    aiGenerated: {
        type: Boolean,
        default: false
    },
    progress: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    totalDuration: {
        type: Number,
        default: 120
    },
    phases: [{
        id: Number,
        name: String,
        description: String,
        duration: Number,
        topics: [String],
        activities: [String],
        resources: [{
            type: String,
            title: String,
            url: String,
            priority: Number
        }],
        progress: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },
        status: {
            type: String,
            enum: ['not_started', 'in_progress', 'completed'],
            default: 'not_started'
        },
        startDate: Date,
        endDate: Date,
        completedActivities: Number,
        totalActivities: Number
    }],
    personalizedElements: {
        focusAreas: [String],
        strengthAreas: [String],
        learningStyle: String,
        difficulty: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced'],
            default: 'intermediate'
        },
        preferredResourceTypes: [String]
    },
    recommendations: [{
        type: {
            type: String,
            enum: ['study_method', 'resource', 'timing', 'content', 'review']
        },
        title: String,
        description: String,
        priority: {
            type: String,
            enum: ['high', 'medium', 'low'],
            default: 'medium'
        },
        reason: String,
        applied: {
            type: Boolean,
            default: false
        },
        appliedAt: Date
    }],
    dailyRecommendations: [{
        date: Date,
        activities: [{
            type: String,
            title: String,
            description: String,
            estimatedTime: Number,
            priority: Number,
            completed: {
                type: Boolean,
                default: false
            }
        }],
        generatedAt: Date,
        source: {
            type: String,
            enum: ['rule', 'ai', 'hybrid'],
            default: 'rule'
        }
    }],
    learningActivities: [{
        date: Date,
        activityType: {
            type: String,
            enum: ['lesson', 'practice', 'review', 'test', 'project']
        },
        content: String,
        duration: Number,
        outcome: {
            type: String,
            enum: ['success', 'partial', 'failed']
        },
        score: Number,
        phaseId: Number,
        notes: String
    }],
    updateHistory: [{
        updatedAt: Date,
        updateType: String,
        reason: String,
        previousState: mongoose.Schema.Types.Mixed,
        newState: mongoose.Schema.Types.Mixed
    }],
    estimatedCompletion: {
        estimatedWeeks: Number,
        estimatedHours: Number,
        startDate: Date,
        completionDate: Date,
        lastCalculated: Date
    },
    effectivenessMetrics: {
        learningVelocity: String,
        retentionRate: Number,
        engagementLevel: String,
        averageScore: Number,
        timeEfficiency: Number,
        lastCalculated: Date
    }
}, {
    timestamps: true
});

learningPathSchema.index({ student: 1, subject: 1 }, { unique: true });
learningPathSchema.index({ student: 1, status: 1 });
learningPathSchema.index({ status: 1, generatedAt: -1 });
learningPathSchema.index({ 'dailyRecommendations.date': 1 });

learningPathSchema.methods.calculateProgress = function() {
    if (!this.phases || this.phases.length === 0) return 0;

    const completedPhases = this.phases.filter(p => p.status === 'completed').length;
    const inProgressPhase = this.phases.find(p => p.status === 'in_progress');

    let progress = (completedPhases / this.phases.length) * 100;
    if (inProgressPhase) {
        progress += (inProgressPhase.progress / this.phases.length);
    }

    this.progress = Math.min(Math.round(progress), 100);
    return this.progress;
};

learningPathSchema.methods.getCurrentPhase = function() {
    return this.phases.find(p => p.status === 'in_progress') ||
           this.phases.find(p => p.status === 'not_started');
};

learningPathSchema.methods.getNextPhase = function() {
    const currentIndex = this.phases.findIndex(p => p.status === 'in_progress');
    if (currentIndex >= 0 && currentIndex < this.phases.length - 1) {
        return this.phases[currentIndex + 1];
    }
    return null;
};

learningPathSchema.methods.addActivity = function(activity) {
    this.learningActivities.push(activity);
    this.lastUpdated = new Date();
    return this.save();
};

learningPathSchema.methods.addDailyRecommendation = function(recommendation) {
    const existingDate = this.dailyRecommendations.find(
        r => r.date.toDateString() === recommendation.date.toDateString()
    );
    if (existingDate) {
        existingDate.activities = recommendation.activities;
        existingDate.generatedAt = new Date();
        existingDate.source = recommendation.source;
    } else {
        this.dailyRecommendations.push(recommendation);
    }
    return this.save();
};

learningPathSchema.statics.findActiveByStudent = function(studentId) {
    return this.find({
        student: studentId,
        status: 'active'
    }).populate('subject', 'subName subCode');
};

learningPathSchema.statics.findActiveByStudentSubject = function(studentId, subjectId) {
    return this.findOne({
        student: studentId,
        subject: subjectId,
        status: { $in: ['active', 'paused'] }
    });
};

module.exports = mongoose.model('learningPath', learningPathSchema);