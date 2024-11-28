const mongoose = require('mongoose');

const roleschema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    first_name: {
        type: String,
        required: true
    },
    last_name: {
        type: String,
        default: null,
    },
    email: {
        type: String,
        default: null,
    },
    contact_number: {
        type: String,
        default: null,
    },
    alternate_number: {
        type: String,
        default: null,
    },
    password: {
        type: String,
        default: null,
    },
    address: {
        type: String,
        default: null,
    },
    gender: {
        type: String,
        default: null,
    },
    social_media_name: {
        type: String,
        default: null,
    },
    social_media_link: {
        type: String,
        default: null,
    },
    country: {
        type: String,
        default: null,
    },
    bank_name: {
        type: String,
        default: null,
    },
    account_number: {
        type: String,
        default: null,
    },
    ifsc_code: {
        type: String,
        default: null,
    },
    name_of_person: {
        type: String,
        default: null,
    },
    institution_number: {
        type: String,
        default: null,
    },
    transit_no: {
        type: String,
        default: null,
    },
    swift_code: {
        type: String,
        default: null,
    },
    cancelled_cheque: {
        type: String,
        default: null,
    },
    id_prrof: {
        type: String,
        default: null,
    },
    agreement: {
        type: String,
        default: null,
    },
    job_role: {
        type: String,
        default: null,
    },
    otp: {
        type: Number,
        default: null,
    },
    token: {
        type: String,
        default: null,
    },
    status: {
        type: String,
        enum: ['0', '1'], // Add your enum values here
        default: '1',
    }
}, {
    timestamps: true, // Move timestamps here
});

module.exports = mongoose.model('roleschema', roleschema);
