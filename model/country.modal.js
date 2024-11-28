const mongoose = require('mongoose');

const countrySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    short_name: {
        type: String,
        required: true,
    },
}, {
    timestamps: true, // Enable timestamps for createdAt and updatedAt fields
});

module.exports = mongoose.model('Country', countrySchema); // Capitalize model name and schema variable name
