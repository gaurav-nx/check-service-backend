const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
    },
    notification: {
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

module.exports = mongoose.model('notification', campaignSchema);