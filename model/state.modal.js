const mongoose = require('mongoose');

const stateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    short_name: {
        type: String,
        required: true,
    },
    country_code: {
        type: String,
        required: true,
    },
}, {
    timestamps: true, // Enable timestamps for createdAt and updatedAt fields
});

module.exports = mongoose.model('State', stateSchema); // Capitalize model name and schema variable name
