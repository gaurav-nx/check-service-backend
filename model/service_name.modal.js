const mongoose = require('mongoose');

const serviceNameSchema = new mongoose.Schema({
    service_name: {
        type: String,
        required: true,
    },
    flat_discount: {
        type: Number,
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

module.exports = mongoose.model('service_name', serviceNameSchema); // Capitalize model name and schema variable name
