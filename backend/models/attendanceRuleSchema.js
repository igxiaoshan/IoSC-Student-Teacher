const mongoose = require('mongoose');

/**
 * Attendance Rule Schema
 * Defines rules for attendance alerts (consecutive absences, subject absence rate)
 */
const attendanceRuleSchema = new mongoose.Schema({
    // Rule type
    ruleType: {
        type: String,
        enum: ['consecutive_absence', 'subject_absence_rate', 'overall_absence_rate'],
        required: true
    },
    // Threshold value (days for consecutive, percentage for rate)
    threshold: {
        type: Number,
        required: true
    },
    // Alert severity level
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    // Whether the rule is active
    isActive: {
        type: Boolean,
        default: true
    },
    // School this rule applies to
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin'
    },
    // Subject filter (null means applies to all subjects)
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'subject'
    },
    // Alert message template
    messageTemplate: {
        type: String,
        default: ''
    },
    // Notification settings
    notifications: {
        email: { type: Boolean, default: false },
        sms: { type: Boolean, default: false },
        inApp: { type: Boolean, default: true }
    }
}, {
    timestamps: true
});

// Index for efficient queries
attendanceRuleSchema.index({ school: 1, ruleType: 1, isActive: 1 });
attendanceRuleSchema.index({ ruleType: 1, threshold: 1 });

// Static method: Get active rules for a school
attendanceRuleSchema.statics.getActiveRules = async function(schoolId) {
    return this.find({
        $or: [
            { school: schoolId },
            { school: null } // Global rules
        ],
        isActive: true
    }).sort({ severity: -1 });
};

// Static method: Get default rules
attendanceRuleSchema.statics.getDefaultRules = function() {
    return [
        { ruleType: 'consecutive_absence', threshold: 3, severity: 'medium' },
        { ruleType: 'consecutive_absence', threshold: 5, severity: 'high' },
        { ruleType: 'consecutive_absence', threshold: 7, severity: 'critical' },
        { ruleType: 'subject_absence_rate', threshold: 30, severity: 'low' },
        { ruleType: 'subject_absence_rate', threshold: 40, severity: 'medium' },
        { ruleType: 'subject_absence_rate', threshold: 50, severity: 'high' },
        { ruleType: 'overall_absence_rate', threshold: 20, severity: 'medium' }
    ];
};

module.exports = mongoose.model('AttendanceRule', attendanceRuleSchema);
