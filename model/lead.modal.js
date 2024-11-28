const mongoose = require('mongoose');

const leadschema = new mongoose.Schema({
    pre_sales_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'roleschema',
        default: null,
    },
    campagin_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Campaign',
        default: null,
    },
    prefix: {
        type: String,
        default: null,
    },
    first_name: {
        type: String,
        required: true
    },
    last_name: {
        type: String,
        default: null,
    },
    gender: {
        type: String,
        default: null,
    },
    DOB: {
        type: Date,
        default: null,
    },
    age: {
        type: String,
        default: null,
    },
    email: {
        type: String,
        default: null,
    },
    education: {
        type: String,
        default: null,
    },
    contact_number: {
        type: String,
        default: null,
    },
    alt_contact_number: {
        type: String,
        default: null,
    },
    country: {
        type: String,
        default: null,
    },
    country_name: {
        type: String,
        default: null,
    },
    state: {
        type: String,
        default: null,
    },
    state_name: {
        type: String,
        default: null,
    },
    note: {
        type: String,
        default: null,
    },
    other_note:[],
    Upload_File: {
        type: String,
        default: null,
    },
    Proficiency_Test: {
        type: String,
        default: null,
    },
    proficiencyLevel: {
        type: String,
        default: null,
    },
    Reading_score: {
        type: String,
        default: null,
    },
    Writing_score: {
        type: String,
        default: null,
    },
    Listening_score: {
        type: String,
        default: null,
    },
    Speaking_score: {
        type: String,
        default: null,
    },
    over_all: {
        type: String,
        default: null,
    },
    Lead_Type: {
        type: String,
        default: null,
    },
    Lead_Source: {
        type: String,
        default: null,
    },
    Lead_Assign: {
        type: String,
        default: null,
    },
    Lead_AssignID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'roleschema',
    },
    Filing_ManagerID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'roleschema',
    },
    Filing_ManagerName: {
        type: String,
        default: null,
    },
    Filing_TeamID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'roleschema',
    },
    Filing_TeamName: {
        type: String,
        default: null,
    },
    Lead_AssignName: {
        type: String,
        default: null,
    },
    Services: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['1', '2', '3', '4'], // Add your enum values here
        default: '1',
    },
    status_payment: {
        type: String,
        enum: ['0', '1'], // Add your enum values here
        default: '0',
    },
    status_convert: [{
        type: String,
        enum: ['Close', 'Convert', 'Pending'], // Add your enum values here
        default: '0',
    }],
    term_condition_status: {
        type: String,
        enum: ['true', 'false'], // Assuming status '1' means active and '2' means inactive, provide meaningful enum values
        default: 'false', // Default status set to 'active'
    },
    Followup_Date: [{
        type: String,
        default: null,
    }],
    Next_Followup_Date: [{
        type: String,
        default: null,
    }],
    Notes_sales: [{
        type: String,
        default: null,
    }],
    Total_Amount: [{
        type: String,
        default: null,
    }],
    Amount_Paid: [{
        type: String,
        default: null,
    }],
    Amount_Due: [{
        type: String,
        default: null,
    }],
    Upload_Payment_Proof: [{
        type: String,
        default: null,
    }],
    Payment_Proof_Date: [{
        type: Date,
        default: null,
    }],
    Filing_Process: [{
        caseInitiated: String,
        fileIntiated: String,
        docsReceived: String,
        sopprepration: String,
        sopletters: String,
        confirmrecieved: String,
        filesent: String,
        filessubmitted: String,
        visaapproved: String,
        visarefusal: String,
        createdAt: { type: Date, default: Date.now }
    }],
    Notes_fiiling_team: [{
        type: String,
        default: null,
    }],
    Followup_Date_fiiling_team: [{
        type: Date,
        default: null,
    }],
    Filing_Team_Status: [{
        type: String,
    }],
    Next_Followup_Date_fiiling_team: [{
        type: Date,
        // required: true
        default: null,
    }],
    Notes_process_fiiling_team: [{
        type: String,
        default: null,
    }],
    Filing_TeamID_process: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'roleschema',
    }
},
    {
        timestamps: true, // Move timestamps here
    });

module.exports = mongoose.model('leadschema', leadschema);
