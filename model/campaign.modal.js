const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    campagin_name: {
        type: String,
        required: true,
    },
    start_date: {
        type: String,
        required: true,
    },
    end_date: {
        type: String,
        required: true,
    },
    influencer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'roleschema',
        default: null
    },
    influencer_name: {
        type: String,
        default: null
    },
    notes: {
        type: String,
        required: true,
    },
    url: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['active', 'inactive'], // Assuming status '1' means active and '2' means inactive, provide meaningful enum values
        default: 'active', // Default status set to 'active'
    }
}, {
    timestamps: true, // Enable timestamps for createdAt and updatedAt fields
});

module.exports = mongoose.model('Campaign', campaignSchema); // Capitalize model name and schema variable name
