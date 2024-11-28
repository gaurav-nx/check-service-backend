const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    country_code: {
        type: String,
        required: true,
    },
    state_code: {
        type: String,
        required: true,
    },
}, {
    timestamps: true, // Enable timestamps for createdAt and updatedAt fields
});

module.exports = mongoose.model('City', citySchema); // Capitalize model name and schema variable name
