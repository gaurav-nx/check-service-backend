const leadschema = require('../model/lead.modal');
const roleschema = require('../model/addrole.modal');
const countrySchema = require('../model/country.modal');
const stateSchema = require('../model/state.modal');
const notificationSchema = require('../model/notification.modal');
const nodemailer = require('nodemailer');
const { default: mongoose } = require('mongoose');

const AddLead = async (req, res) => {
    try {
        const existingLead = await leadschema.findOne({ contact_number: req.body.contact_number });
        if (existingLead) {
            return res.status(200).json({ error: true, message: "This Contact No. already exists", data: null });
        }
        const findCountry = await countrySchema.findOne({ short_name: req.body.country });
        const findState = await stateSchema.findOne({ $and: [{ short_name: req.body.state }, { country_code: req.body.country }] });
        req.body.country_name = findCountry.name;
        req.body.state_name = findState.name;
        const newLead = new leadschema(req.body);
        if (req.files && req.files.Upload_File && req.files.Upload_File[0] && req.files.Upload_File[0].filename) {
            newLead.Upload_File = req.files.Upload_File[0].filename
        }
        const savedLead = await newLead.save();
        if (savedLead == null) {
            return res.status(200).json({ error: true, message: "Not lead add", data: null });
        } else {
            await sendEmailForLeadAdd(req.body.email, req.body.first_name, req.body.last_name, savedLead);
            if (!req.body.pre_sales_id) {
                const data = {
                    notification: "A New Lead Add By Campagin",
                }
                const addNotification = new notificationSchema(data);
                const savedNotification = await addNotification.save();
            }
            return res.status(200).json({ error: false, message: "Sucessfully lead add", data: savedLead });
        }
    } catch (error) {
        return res.status(500).json({ massage: 'Internal Server Error', error: error });
    }
};

const sendEmailForLeadAdd = async (email, first_name, last_name, savedLead) => {
    let transporter = nodemailer.createTransport({
        host: "mail.checkcheckservices.in",
        port: 587,
        secure: false, // use SSL/TLS if true for port 465
        auth: {
            user: 'no-reply@checkcheckservices.in',
            pass: 'no-reply@112233'
        },
        tls: {
            rejectUnauthorized: false, // Disable certificate validation
        }
    });

    let info = await transporter.sendMail({
        from: 'no-reply@checkcheckservices.in', // sender address
        to: `${email}`, // list of receivers
        subject: "Registration Confirmation -Check Check Services", // Subject line
        text: `Dear ${first_name}  ${last_name},


        Thank you for registering with CheckCheck Services. We are pleased to offer our assistance to you. Our advisor will connect with you shortly.
        
        
        If you have any questions or need further assistance, feel free to contact our support team at apply@checkcheckservices.com

        Best regards,
        Team Johny Hans
        Check Check Services
        `,

    });
    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
};

const GetAllLead = async (req, res) => {
    try {
        const allrole = await leadschema.find().sort({ createdAt: -1 });
        res.send({ data: allrole })
        // return res.status(200).json({ success: true, message: "Successfully retrieved all leads", data: allrole });
    } catch (err) {
        return res.status(500).json({ massage: 'Internal Server Error', error: err });
    }
};

const allLeadCount = async (req, res) => {
    try {
        const allLeadCount = await leadschema.countDocuments();
        return res.status(200).json({ error: false, message: "Successfully found lead count", data: allLeadCount });
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error", data: null });
    }
}

const preSalesFreshCount = async (req, res) => {
    try {
        const allLeadCount = await leadschema.find({ status: 1 }).countDocuments();
        return res.status(200).json({ error: false, message: "Successfully fetched lead count", data: allLeadCount });
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error", data: null });
    }
}

const listAllLeads = async (req, res) => {
    try {
        const { page, perPage, searchQuery, startDate, endDate, status } = req.query;
        if (status == '') {
            const filter = {};

            // Apply search query filter
            if (searchQuery) {
                filter.$or = Object.keys(leadschema.schema.paths)
                    .filter(field => leadschema.schema.paths[field].instance === 'String')
                    .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
            }

            // Apply date range filter
            if (startDate && endDate) {
                filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
            }

            const skip = (parseInt(page) - 1) * parseInt(perPage);

            // Fetch data with pagination and filtering
            const data = await leadschema.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(perPage));

            const totalRows = await leadschema.countDocuments(filter);

            return res.status(200).json({ success: true, message: "Successfully all leads", data: data, totalRows });
        } else {
            const filter = {};

            // Apply search query filter
            if (searchQuery) {
                filter.$or = Object.keys(leadschema.schema.paths)
                    .filter(field => leadschema.schema.paths[field].instance === 'String')
                    .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
            }

            // Apply date range filter
            if (startDate && endDate) {
                filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
            }

            if (status) {
                filter.status = status;
            }

            const skip = (parseInt(page) - 1) * parseInt(perPage);

            // Fetch data with pagination and filtering
            const data = await leadschema.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(perPage));

            const totalRows = await leadschema.countDocuments(filter);

            return res.status(200).json({ success: true, message: "Successfully all leads", data: data, totalRows });
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const UpdateLead = async (req, res) => {
    try {
        const { _id, id, first_name, last_name, gender, age, email, education, country, state, note, Proficiency_Test, proficiencyLevel, Lead_Type, Lead_Source, DOB, contact_number, alt_contact_number, Reading_score, Writing_score, Listening_score, Speaking_score } = req.body;
        if (_id === '' || req.body.status_convert === "Follow" || req.body.status_convert === 'Convert' || req.body.status_convert === 'Close') {
            const findLead = await leadschema.findOne({ _id: id })
            if (req.body.status_convert == 'Close') {
                const companyI = id;
                const data = {
                    $push: {
                        status_convert: req.body.status_convert,
                        Followup_Date: req.body.Followup_Date,
                        Notes_sales: req.body.Notes_sales + ' - Updated by ' + findLead.Lead_AssignName,
                        Next_Followup_Date: "",
                        // Total_Amount: "",
                        // Amount_Paid: "",
                        // Amount_Due: "",
                    }
                };
                const updatedCompanyDetails = await leadschema.findByIdAndUpdate(companyI, data, { new: true, runValidators: true });
                if (!updatedCompanyDetails) {
                    return res.status(404).json({ error: true, message: "Lead not found", data: null });
                } else {
                    return res.status(200).json({ error: false, message: "update", data: updatedCompanyDetails });
                }
            }
            if (req.body.status_convert == 'Follow') {
                const companyI = id;
                const data = {
                    $push: {
                        status_convert: "Pending",
                        Followup_Date: req.body.Followup_Date,
                        Notes_sales: req.body.Notes_sales + ' - Updated by ' + findLead.Lead_AssignName,
                        Next_Followup_Date: req.body.Next_Followup_Date,
                        // Total_Amount: "",
                        // Amount_Paid: "",
                        // Amount_Due: "",
                    }
                };
                const updatedCompanyDetails = await leadschema.findByIdAndUpdate(
                    companyI,
                    data,
                    { new: true, runValidators: true }
                );
                if (!updatedCompanyDetails) {
                    return res.status(404).json({ error: true, message: "Lead not found", data: null })
                } else {
                    return res.status(200).json({ error: false, message: "update", data: updatedCompanyDetails });
                }
            }
            if (req.body.status_convert === 'Convert') {
                if (req.body.Amount_Due >= 0) {
                    const companyI = id;
                    let uploadFilename = null;
                    if (req.files && req.files.Upload_Payment_Proof && req.files.Upload_Payment_Proof[0] && req.files.Upload_Payment_Proof[0].filename) {
                        uploadFilename = req.files.Upload_Payment_Proof[0].filename;
                    }
                    const data = {
                        $push: {
                            status_convert: req.body.status_convert,
                            Followup_Date: req.body.Followup_Date,
                            Next_Followup_Date: req.body.Next_Followup_Date,
                            Notes_sales: req.body.Notes_sales + ' - Updated by ' + findLead.Lead_AssignName,
                            Total_Amount: req.body.Total_Amount,
                            Amount_Paid: req.body.Amount_Paid,
                            Amount_Due: req.body.Amount_Due,
                            Upload_Payment_Proof: [uploadFilename],
                            Payment_Proof_Date: req.body.Followup_Date
                        }
                    }
                    const updatedCompanyDetails = await leadschema.findByIdAndUpdate(
                        companyI,
                        data,
                        { new: true, runValidators: true }
                    );
                    if (!updatedCompanyDetails) {
                        return res.status(404).json({ error: true, message: 'Lead not found', data: null });
                    } else {
                        await sendEmailForPayementConfirm(companyI);
                        return res.status(200).json({ error: false, message: "update", data: updatedCompanyDetails });
                    }
                } else {
                    return res.status(404).json({ error: true, message: "Your due amount is less then of zero", data: null });
                }
            }
        } else {
            const updatedData = {
                first_name: first_name,
                last_name: last_name,
                gender: gender,
                DOB: DOB,
                age: age,
                email: email,
                education: education,
                contact_number: contact_number,
                alt_contact_number: alt_contact_number,
                country: country,
                state: state,
                note: note,
                Proficiency_Test: Proficiency_Test,
                proficiencyLevel: proficiencyLevel,
                Reading_score: Reading_score,
                Writing_score: Writing_score,
                Listening_score: Listening_score,
                Speaking_score: Speaking_score,
                Lead_Type: Lead_Type,
                Lead_Source: Lead_Source,
            }
            try {
                const foundDocument = await leadschema.findById(_id);
                if (!foundDocument) {
                    return res.status(404).json({ error: true, message: "Data not found for this lead ID", data: null });
                }
                if (req.files && Object.keys(req.files).length !== 0) {
                    updatedData.Upload_File = req.files.Upload_File[0].filename;
                }
                const findCountry = await countrySchema.findOne({ short_name: country });
                const findState = await stateSchema.findOne({ $and: [{ short_name: state }, { country_code: country }] });
                updatedData.country_name = findCountry.name;
                updatedData.state_name = findState.name;
                foundDocument.set(updatedData);
                const updatedDocument = await leadschema.findByIdAndUpdate({ _id: foundDocument._id }, foundDocument, { new: true, runValidators: true });
                if (!updatedDocument) {
                    return res.status(500).json({ error: true, message: "Lead not updated", data: null });
                }
                return res.status(200).json({ error: false, message: "Lead successfully updated", data: updatedDocument });
            } catch (error) {
                return res.status(500).json({ error: true, message: "Error updating lead", data: null });
            }
        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Failed Lead update", data: null });
    }
};

const leadUpdateById = async (req, res) => {
    try {
        const { _id, prefix, first_name, last_name, gender, age, email, education, country, state, note, Proficiency_Test, proficiencyLevel, Lead_Type, Lead_Source, DOB, contact_number, alt_contact_number, Reading_score, Writing_score, Listening_score, Speaking_score } = req.body;
        const updatedData = {
            prefix: prefix,
            first_name: first_name,
            last_name: last_name,
            gender: gender,
            DOB: DOB,
            age: age,
            email: email,
            education: education,
            contact_number: contact_number,
            alt_contact_number: alt_contact_number,
            country: country,
            state: state,
            note: note,
            Proficiency_Test: Proficiency_Test,
            proficiencyLevel: proficiencyLevel,
            Reading_score: Reading_score,
            Writing_score: Writing_score,
            Listening_score: Listening_score,
            Speaking_score: Speaking_score,
            Lead_Type: Lead_Type,
            Lead_Source: Lead_Source,
        }
        try {
            const foundDocument = await leadschema.findById(_id);
            if (!foundDocument) {
                return res.status(404).json({ error: true, message: "Data not found for this lead ID", data: null });
            }
            if (req.files && Object.keys(req.files).length !== 0) {
                updatedData.Upload_File = req.files.Upload_File[0].filename;
            }
            const findCountry = await countrySchema.findOne({ short_name: country });
            const findState = await stateSchema.findOne({ $and: [{ short_name: state }, { country_code: country }] });
            updatedData.country_name = findCountry.name;
            updatedData.state_name = findState.name;
            foundDocument.set(updatedData);
            const updatedDocument = await leadschema.findByIdAndUpdate({ _id: foundDocument._id }, foundDocument, { new: true, runValidators: true });
            if (!updatedDocument) {
                return res.status(500).json({ error: true, message: "Lead not updated", data: null });
            }
            return res.status(200).json({ error: false, message: "Lead successfully updated", data: updatedDocument });
        } catch (error) {
            return res.status(500).json({ error: true, message: "Error updating lead", data: null });
        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Failed Lead update", data: null });
    }
};

const sendEmailForPayementConfirm = async (ID) => {
    const companyDetails = await leadschema.findById(ID);
    if (companyDetails.term_condition_status == "true") {
        console.log("Already Accepted");
    } else {
        let transporter = nodemailer.createTransport({
            host: "mail.checkcheckservices.in",
            port: 587,
            secure: false, // use SSL/TLS if true for port 465
            auth: {
                user: 'no-reply@checkcheckservices.in',
                pass: 'no-reply@112233'
            },
            tls: {
                rejectUnauthorized: false, // Disable certificate validation
            }
        });

        let info = await transporter.sendMail({
            from: 'no-reply@checkcheckservices.in', // sender address
            to: `${companyDetails.email}`, // list of receivers
            subject: "Payment Confirmation -Check Check Services", // Subject line
            text: `Dear ${companyDetails.first_name}  ${companyDetails.last_name},

        Thank you for making the payment. Our filing will connect with you shortly for further process.

        If you have any questions or need further assistance, feel free to contact your assigned advisor.

        <a href=https://checkcheckservices.in/term&condition?id=${companyDetails._id} style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px;">For Term & Condition Accept</a>

        Best regards,
        Team Johny Hans
        Check Check Services        
        `,

        });
        console.log("Message sent: %s", info.messageId);
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
};

const DeleteLead = async (req, res) => {
    try {
        const companyId = req.body.id;
        const deletedCompanyDetails = await leadschema.findByIdAndDelete(companyId);
        if (deletedCompanyDetails == '') {
            return res.status(200).json({ error: true, message: "Not delete", data: null })
        } else {
            return res.status(200).json({ error: false, message: "Successfully delete", data: deletedCompanyDetails })
        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Failed to lead delete", data: null })
    }
};

const GetByIdLead = async (req, res) => {
    try {
        const companyId = req.body.id;
        const companyDetails = await leadschema.findById(companyId);
        if (!companyDetails) {
            return res.status(404).json({ message: 'Lead not found' });
        }
        return res.json({ data: companyDetails });
    } catch (error) {
        return res.status(500).json({ massage: 'Internal Server Error', error: error });

    }
};

const GetAllSales = async (req, res) => {
    try {
        // const salesLeads = await roleschema.find({ job_role: 'Sales' });
        // const salesLeads = await roleschema.find({ $ne: null, $ne: "Pre-Sales" });

        const salesLeads = await roleschema.find({
            job_role: "Sales"
        }).sort({ createdAt: -1 });

        // Extract full names from the salesLeads array
        const salesLeadsWithNames = salesLeads.map((lead) => ({
            full_name: `${lead.first_name} ${lead.last_name || ''}`,
        }));
        return res.json({ data: salesLeads });
    } catch (err) {
        return res.status(500).json({ message: 'Internal Server Error', error: err });
    }
};

const GetAllFillinfManager = async (req, res) => {
    try {
        // const salesLeads = await roleschema.find({ job_role: 'Sales' });
        // const salesLeads = await roleschema.find({ $ne: null, $ne: "Pre-Sales" });

        const salesLeads = await roleschema.find({
            job_role: "Filing Manager"
        }).sort({ createdAt: -1 });

        // Extract full names from the salesLeads array
        const salesLeadsWithNames = salesLeads.map((lead) => ({
            full_name: `${lead.first_name} ${lead.last_name || ''}`,
        }));
        return res.json({ data: salesLeads });
    } catch (err) {
        return res.status(500).json({ message: 'Internal Server Error', error: err });
    }
};

const GetAllFillinfTeam = async (req, res) => {
    try {

        const salesLeads = await roleschema.find({
            job_role: "Filing Team"
        }).sort({ createdAt: -1 });

        const salesLeadsWithNames = salesLeads.map((lead) => ({
            full_name: `${lead.first_name} ${lead.last_name || ''}`,
        }));
        return res.json({ data: salesLeads });
    } catch (err) {
        return res.status(500).json({ message: 'Internal Server Error', error: err });
    }
};

const UpdateLeadAssign = async (req, res) => {
    try {
        const companyIds = req.body.id;
        if (req.body.Services != '') {
            for (const companyId of companyIds) {
                const updatedCompanyDetails = await leadschema.findByIdAndUpdate(
                    companyId,
                    req.body,
                    { new: true, runValidators: true }
                );
                if (!updatedCompanyDetails) {
                    console.error(`Lead with ID ${companyId} not found after updating status`);
                    continue;
                }
                if (req.body.Filing_TeamID != '') {
                    const data = {
                        user_id: req.body.Filing_TeamID,
                        notification: "A New Lead Has Been Assigned",
                    }
                    const addNotification = new notificationSchema(data);
                    const savedNotification = await addNotification.save();
                    if (!savedNotification) {
                        console.error(`Lead with ID ${companyId} not add for notification`);
                        continue;
                    }
                }
                const data = {
                    user_id: req.body.Lead_AssignID,
                    notification: "A New Lead Has Been Assigned",
                }
                const addNotification = new notificationSchema(data);
                const savedNotification = await addNotification.save();
                if (!savedNotification) {
                    console.error(`Lead with ID ${companyId} not add for notification`);
                    continue;
                }
            }
            return res.status(200).json({ error: false, message: "Successfully Assign", data: companyIds });
        } else {
            for (const companyId of companyIds) {
                const findLead = await leadschema.findById(companyId);
                if (findLead == null) {
                    return res.status(200).json({ error: true, message: `Lead not found`, data: null });
                } else if (findLead.Services == null) {
                    return res.status(200).json({ error: true, message: `This lead service is null`, data: null });
                } else {
                    const updatedCompanyDetails = await leadschema.findByIdAndUpdate(
                        companyId,
                        req.body,
                        { new: true, runValidators: true }
                    );
                    if (!updatedCompanyDetails) {
                        console.error(`Lead with ID ${companyId} not found after updating status`);
                        continue;
                    }
                }
            }
            return res.status(200).json({ error: false, message: "Successfully Assign", data: companyIds });
        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Failed to lead assign", data: null });
    }
};

const fillingManagerLeadAssign = async (req, res) => {
    try {
        const companyIds = req.body.id;
        for (const companyId of companyIds) {
            const data = await leadschema.findById(companyId);
            if (data.status_convert.includes('Convert')) {
                const updatedCompanyDetails = await leadschema.findByIdAndUpdate(
                    companyId,
                    req.body,
                    { new: true, runValidators: true }
                );
                if (!updatedCompanyDetails) {
                    console.error(`Lead with ID ${companyId} not found after updating status`);
                    continue;
                }
                const data = {
                    user_id: req.body.Filing_ManagerID,
                    notification: "A New Lead Has Been Assigned",
                }
                const addNotification = new notificationSchema(data);
                const savedNotification = await addNotification.save();
                if (!savedNotification) {
                    console.error(`Lead with ID ${companyId} not add for notification`);
                    continue;
                }
            } else {
                return res.status(200).json({ error: true, message: "Leads not eligible for assign.", data: null });
            }
        }
        return res.status(200).json({ error: false, message: "Leads successfully assigned.", data: null });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: true, message: "Failed to assign leads.", data: null });
    }
};

const UpdateLeadAssignprocess = async (req, res) => {
    try {
        const companyIds = req.body.id;
        const data = { $push: { Filing_Process: req.body.Filing_Process } };
        console.log('>>>>>>>>>>>>>>>>> 584 >>>>>>>>>>>>', companyIds);
        console.log('>>>>>>>>>>>>>>>>> 585 >>>>>>>>>>>>', req.body.Filing_Process);

        const updatedCompanyDetails = await leadschema.findByIdAndUpdate(
            companyIds,
            data,
            { new: true, runValidators: true }
        );

        console.log('>>>>>>>>>>>>593>>>>>>>>>>>', updatedCompanyDetails);

        if (!updatedCompanyDetails) {
            console.error(`Lead with ID  not found after updating status`);
        }
        return res.send({ message: 'Leads updated successfully.' });
    } catch (error) {
        console.log('error', error);
        return res.status(500).send({ error: 'Internal Server Error' });
    }
};

const GetAllLeadSAleRole = async (req, res) => {
    try {
        const { page, perPage, searchQuery, startDate, endDate, leadStatus, roleid } = req.body;
        if (!roleid) {
            return res.status(400).json({ message: 'Role ID is required in the request body.' });
        }

        const filter = {};

        if (searchQuery) {
            filter.$or = Object.keys(leadschema.schema.paths)
                .filter(field => leadschema.schema.paths[field].instance === 'String')
                .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
        }

        if (startDate == '' && endDate == '' && leadStatus == " ") {
            filter.Lead_AssignID = roleid;
            const skip = (parseInt(page) - 1) * parseInt(perPage);

            // Fetch data with pagination and filtering
            const data = await leadschema.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(perPage));

            const totalRows = await leadschema.countDocuments(filter);

            return res.send({ data: data, totalRows });
        }

        if ((startDate == '' && endDate == '') || leadStatus != " ") {
            filter.Lead_AssignID = roleid;
            if (leadStatus != " ") {
                filter.status_convert = leadStatus;
            }

            const skip = (parseInt(page) - 1) * parseInt(perPage);

            // Fetch data with pagination and filtering
            const data = await leadschema.find({
                ...filter,
                $expr: { $eq: [{ $arrayElemAt: ['$status_convert', -1] }, leadStatus] }
            })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(perPage));

            const totalRows = await leadschema.countDocuments({
                ...filter,
                $expr: { $eq: [{ $arrayElemAt: ['$status_convert', -1] }, leadStatus] }
            });

            return res.send({ data: data, totalRows });
        }

        if (startDate != '' && endDate != '' && leadStatus == " ") {
            filter.Lead_AssignID = roleid;
            if (startDate && endDate) {
                filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
            }
            const skip = (parseInt(page) - 1) * parseInt(perPage);

            // Fetch data with pagination and filtering
            const data = await leadschema.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(perPage));

            const totalRows = await leadschema.countDocuments(filter);

            return res.send({ data: data, totalRows });
        }

        if (startDate != '' && endDate != '' && leadStatus != " ") {
            filter.Lead_AssignID = roleid;

            if (startDate && endDate && leadStatus != " ") {
                filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                filter.status_convert = leadStatus;
            }

            const skip = (parseInt(page) - 1) * parseInt(perPage);

            // Fetch data with pagination and filtering
            const data = await leadschema.find({
                ...filter,
                $expr: { $eq: [{ $arrayElemAt: ['$status_convert', -1] }, leadStatus] }
            })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(perPage));

            const totalRows = await leadschema.countDocuments({
                ...filter,
                $expr: { $eq: [{ $arrayElemAt: ['$status_convert', -1] }, leadStatus] }
            });

            return res.send({ data: data, totalRows });
        }
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ message: 'Internal Server Error', error: err });
    }
};

const getFillingManagerLead = async (req, res) => {
    try {
        const { page, perPage, searchQuery, roll_id } = req.body;

        if (!roll_id) {
            return res.status(400).json({ error: true, message: "Please Provide The Id", data: null });
        }

        const filter = { Filing_ManagerID: roll_id };

        if (searchQuery) {
            filter.$or = Object.keys(leadschema.schema.paths)
                .filter(field => leadschema.schema.paths[field].instance === 'String')
                .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
        }

        const skip = (parseInt(page) - 1) * parseInt(perPage);

        const data = await leadschema.find(filter)

            // const data = await leadschema.find({
            //     ...filter,
            //     // Filing_ManagerID: id,
            //     status: {$ne: 4},
            //     visaapproved: { $ne: "Visa approved" },
            //     $expr: {
            //         $and: [
            //             { $ne: [{ $arrayElemAt: ["$Filing_Process.visaapproved", -1] }, "Visa approved"] },
            //             { $ne: [{ $arrayElemAt: ["$Filing_Process.visarefusal", -1] }, "Visa refusal"] }
            //         ]
            //     }
            // })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(perPage));

        const totalRows = await leadschema.countDocuments(filter);

        return res.status(200).json({ error: false, message: "Successfully found lead", data: data, totalRows });
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error", data: null });
    }
};

const getFillingTeamLead = async (req, res) => {
    try {
        const { page, perPage, searchQuery, roll_id } = req.body;

        if (!roll_id) {
            return res.status(400).json({ error: true, message: "Please Provide The Id", data: null });
        }

        const filter = { Filing_TeamID: roll_id };

        if (searchQuery) {
            filter.$or = Object.keys(leadschema.schema.paths)
                .filter(field => leadschema.schema.paths[field].instance === 'String')
                .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
        }

        const skip = (parseInt(page) - 1) * parseInt(perPage);

        const data = await leadschema.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(perPage));

        const totalRows = await leadschema.countDocuments(filter);

        return res.status(200).json({ error: false, message: "Successfully found lead", data: data, totalRows });
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error", data: null });
    }
};

const updatefilingteam = async (req, res) => {
    try {
        var companyIds = req.body.id;
        const Filing_Team_Status = req.body.Filing_Team_Status
        let status = "Default Status";
        if (Filing_Team_Status.length > 0) {
            for (let i = Filing_Team_Status.length - 1; i >= 0; i--) {
                const val = Filing_Team_Status[i];
                if (val.caseInitiated == 'Case Initiated') {
                    status = "File Initiated or docs checklist sent";
                    break;
                }
                if (val.caseInitiated == "true" && val.fileIntiated == 'File Initiated or docs checklist sent') {
                    status = "Docs received & Pending docs sent";
                    break;
                }
                if (val.caseInitiated == 'true' && val.fileIntiated == 'true' && val.docsReceived == 'Docs received & Pending docs sent') {
                    status = "Sop Or letters prepration & Forms prep";
                    break;
                }
                if (val.caseInitiated == "true" && val.fileIntiated == "true" && val.docsReceived == "true" && val.sopprepration == 'Sop Or letters prepration & Forms prep') {
                    status = "SOP or Letters sent to client";
                    break;
                }
                if (val.caseInitiated == 'true' && val.fileIntiated == 'true' && val.docsReceived == 'true' && val.sopprepration == 'true' && val.sopletters == 'SOP or Letters sent to client') {
                    status = "Confirmation received on SOP, letters and docs, Forms confirmation";
                    break;
                }
                if (val.caseInitiated == 'true' && val.fileIntiated == 'true' && val.docsReceived == 'true' && val.sopprepration == 'true' && val.sopletters == 'true' && val.confirmrecieved == 'Confirmation received on SOP, letters and docs, Forms confirmation') {
                    status = "File sent for Upload or submission";
                    break;
                }
                if (val.caseInitiated == 'true' && val.fileIntiated == 'true' && val.docsReceived == 'true' && val.sopprepration == 'true' && val.sopletters == 'true' && val.confirmrecieved == 'true' && val.filesent == 'File sent for Upload or submission') {
                    status = "Files Submitted";
                    break;
                }
                if (val.caseInitiated == 'true' && val.fileIntiated == 'true' && val.docsReceived == 'true' && val.sopprepration == 'true' && val.sopletters == 'true' && val.confirmrecieved == 'true' && val.filesent == 'true' && val.filesusubmitted == 'Files Submitted') {
                    status = "Visa approved";
                    break;
                }
                if (val.caseInitiated == 'true' && val.fileIntiated == 'true' && val.docsReceived == 'true' && val.sopprepration == 'true' && val.sopletters == 'true' && val.confirmrecieved == 'true' && val.filesent == 'true' && val.filessubmitted == 'true' && val.visaapproved == 'Visa approved') {
                    status = "Visa refusal";
                    break;
                }
            }
        } else {
            status = "Case Initiated"
        }
        const findLead = await leadschema.findOne({ _id: req.body.id })
        if (req.body.fillingUser == 'Manager') {
            const data = {
                $push: {
                    Filing_Team_Status: status,
                    Followup_Date_fiiling_team: req.body.data.Followup_Date_fiiling_team,
                    Notes_fiiling_team: req.body.data.Notes_fiiling_team + ' - Updated by ' + findLead.Filing_ManagerName,
                    Next_Followup_Date_fiiling_team: req.body.data.Next_Followup_Date_fiiling_team,

                }
            };
            const updatedCompanyDetails = await leadschema.findByIdAndUpdate(
                companyIds,
                data,
                { new: true, runValidators: true }
            );
            if (!updatedCompanyDetails) {
                return res.send({ message: 'Leads updated successfully.' })
            }
            return res.send({ message: 'Leads updated successfully.' });
        } else {
            const data = {
                $push: {
                    Filing_Team_Status: status,
                    Followup_Date_fiiling_team: req.body.data.Followup_Date_fiiling_team,
                    Notes_fiiling_team: req.body.data.Notes_fiiling_team + ' - Updated by ' + findLead.Filing_TeamName,
                    Next_Followup_Date_fiiling_team: req.body.data.Next_Followup_Date_fiiling_team,

                }
            };
            const updatedCompanyDetails = await leadschema.findByIdAndUpdate(
                companyIds,
                data,
                { new: true, runValidators: true }
            );
            if (!updatedCompanyDetails) {
                return res.send({ message: 'Leads updated successfully.' })
            }
            return res.send({ message: 'Leads updated successfully.' });
        }
    } catch (error) {
        return res.status(500).send({ error: 'Internal Server Error', data: error });
    }
};

const updateTermCondition = async (req, res) => {
    try {
        const leadId = req.body._id;
        const updatedCompanyDetails = await leadschema.findByIdAndUpdate(
            leadId,
            req.body,
            { new: true, runValidators: true }
        );
        if (updatedCompanyDetails == null) {
            return res.status(200).json({ error: true, message: `Not accept`, data: null });
        } else {
            return res.status(200).json({ error: false, message: `Successfully accept`, data: updatedCompanyDetails });
        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Failed to term and condition", data: null });
    }
};

const leadUnclose = async (req, res) => {
    try {
        if (req.body._id == '') {
            return res.status(200).json({ error: true, message: "Provide the unClose id", data: null });
        } else {
            const findData = await leadschema.findById(req.body._id);
            if (!findData) {
                return res.status(200).json({ error: true, message: "Lead not found", data: null });
            } else {
                findData.status_convert.pop(); // Remove the last element
                findData.Followup_Date.pop();
                findData.Next_Followup_Date.pop();
                findData.Notes_sales.pop();
                const updatedData = await findData.save();
                return res.status(200).json({ error: false, message: "Lead unClosed successfully", data: updatedData });
            }
        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error", data: null });
    }
};

const deletePaymentById = async (req, res) => {
    try {
        if (req.body._id == '') {
            return res.status(200).json({ error: true, message: "Provide the id", data: null });
        } else {
            const findData = await leadschema.findById(req.body._id);
            if (findData.Total_Amount.length > 0) {
                // while (findData.Total_Amount.length > 0) {
                findData.Total_Amount.pop();
                findData.Amount_Paid.pop();
                findData.Amount_Due.pop();
                findData.Upload_Payment_Proof.pop();
                findData.Payment_Proof_Date.pop();
                findData.Notes_sales.pop();
                findData.Next_Followup_Date.pop();
                findData.Followup_Date.pop();
                findData.status_convert.pop();
                // }
                const findAndUpdate = await leadschema.findByIdAndUpdate(
                    req.body._id,
                    findData,
                    { new: true, runValidators: true }
                );
                if (findAndUpdate == null) {
                    return res.status(200).json({ error: true, message: "Payment not delete", data: null });
                } else {
                    return res.status(200).json({ error: false, message: "Payment successfully delete", data: findAndUpdate });
                }
            }
        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error", data: null });
    }
};

const leaderBoard = async (req, res) => {
    try {
        const findRole = await roleschema.find({ job_role: "Sales" });
        if (!findRole || findRole.length === 0) {
            return res.status(200).json({ error: true, message: "Role not found", data: null });
        } else {
            const findLeadArray = [];
            for (const val of findRole) {
                const findLeadPromise = await leadschema.find({
                    Lead_AssignID: val._id,
                    $expr: {
                        $eq: [{ $arrayElemAt: ["$status_convert", -1] }, "Convert"]
                    },
                    Payment_Proof_Date: {
                        $elemMatch: {
                            $gte: new Date(req.body.start_date),
                            $lte: new Date(req.body.end_date)
                        }
                    }
                }).then(leads => ({ role: val, leads }));;
                findLeadArray.push(findLeadPromise);
            }
            const allLeads = await Promise.all(findLeadArray);
            return res.status(200).json({ error: false, message: "LeadBoard successfully Found", data: allLeads });
        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error", data: null });
    }
};

const getLeadstatusCount = async (req, res) => {
    try {
        const { start_date, end_date, current_date, id } = req.body;
        if (!id) {
            if (start_date && end_date) {
                var undefinedCount = await leadschema.countDocuments({
                    createdAt: { $gte: new Date(start_date), $lte: new Date(end_date) },
                    status: 2,
                    $or: [
                        { $expr: { $eq: [{ $size: "$status_convert" }, 0] } }, // Check if the array is empty
                        { $expr: { $eq: [{ $arrayElemAt: ["$status_convert", -1] }, ""] } } // Check if the last element is an empty string
                    ]
                });

                var pendingCount = await leadschema.countDocuments({
                    createdAt: { $gte: new Date(start_date), $lte: new Date(end_date) },
                    status: 2,
                    $expr: {
                        $eq: [{ $arrayElemAt: ["$status_convert", -1] }, "Pending"]
                    }
                });

                var closeCount = await leadschema.countDocuments({
                    createdAt: { $gte: new Date(start_date), $lte: new Date(end_date) },
                    status: 2,
                    $expr: {
                        $eq: [{ $arrayElemAt: ["$status_convert", -1] }, "Close"]
                    }
                });

                function formatDate(dateString) {
                    const date = new Date(dateString);
                    const month = String(date.getMonth() + 1).padStart(2, '0'); // Ensures two digits for month
                    const day = String(date.getDate()).padStart(2, '0'); // Ensures two digits for day
                    const year = date.getFullYear();
                    return `${month}/${day}/${year}`;
                }

                var todayFollowup = await leadschema.find({
                    status: 2,
                    $expr: {
                        $eq: [{ $arrayElemAt: ["$status_convert", -1] }, "Pending"]
                    }
                });

                var todayFollowupCount = todayFollowup.filter(lead => {
                    const formattedDates = lead.Next_Followup_Date.map(date => formatDate(date));
                    const latestFormattedDate = formattedDates.pop();
                    return new Date(latestFormattedDate) <= new Date(current_date);
                }).length;
            }

            return res.status(200).json({ error: false, message: "Successfully fetched leads", data: undefinedCount, pendingCount, closeCount, todayFollowupCount });
        } else {
            if (start_date && end_date) {
                var undefinedCount = await leadschema.countDocuments({
                    createdAt: { $gte: new Date(start_date), $lte: new Date(end_date) },
                    Lead_AssignID: id,
                    $or: [
                        { $expr: { $eq: [{ $size: "$status_convert" }, 0] } }, // Check if the array is empty
                        { $expr: { $eq: [{ $arrayElemAt: ["$status_convert", -1] }, ""] } } // Check if the last element is an empty string
                    ]
                });

                var pendingCount = await leadschema.countDocuments({
                    createdAt: { $gte: new Date(start_date), $lte: new Date(end_date) },
                    Lead_AssignID: id,
                    $expr: {
                        $eq: [{ $arrayElemAt: ["$status_convert", -1] }, "Pending"]
                    }
                });

                var closeCount = await leadschema.countDocuments({
                    createdAt: { $gte: new Date(start_date), $lte: new Date(end_date) },
                    Lead_AssignID: id,
                    $expr: {
                        $eq: [{ $arrayElemAt: ["$status_convert", -1] }, "Close"]
                    }
                });

                function formatDate(dateString) {
                    const date = new Date(dateString);
                    const month = String(date.getMonth() + 1).padStart(2, '0'); // Ensures two digits for month
                    const day = String(date.getDate()).padStart(2, '0'); // Ensures two digits for day
                    const year = date.getFullYear();
                    return `${month}/${day}/${year}`;
                }

                var todayFollowup = await leadschema.find({
                    Lead_AssignID: id,
                    $expr: {
                        $eq: [{ $arrayElemAt: ["$status_convert", -1] }, "Pending"]
                    }
                });

                var todayFollowupCount = todayFollowup.filter(lead => {
                    const formattedDates = lead.Next_Followup_Date.map(date => formatDate(date));
                    const latestFormattedDate = formattedDates.pop();
                    return new Date(latestFormattedDate) <= new Date(current_date);
                }).length;
            }
            return res.status(200).json({ error: false, message: "Successfully fetched leads", data: undefinedCount, pendingCount, closeCount, todayFollowupCount });
        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error", data: null });
    }
};

const getLeadStatus = async (req, res) => {
    try {
        const { id, page, perPage, startDate, endDate, current_date, searchQuery, status } = req.query;
        if (id == '') {
            if (startDate && endDate) {
                if (status == "Fresh") {
                    const filter = {};

                    if (searchQuery) {
                        filter.$or = Object.keys(leadschema.schema.paths)
                            .filter(field => leadschema.schema.paths[field].instance === 'String')
                            .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                    }

                    if (startDate && endDate) {
                        filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                    }

                    const skip = (parseInt(page) - 1) * parseInt(perPage);

                    let data = await leadschema.find({
                        ...filter, status: 2, $expr: { $eq: [{ $ifNull: [{ $arrayElemAt: ["$status_convert", 0] }, null] }, null] }
                    }).sort({ createdAt: -1 })
                        .skip(skip)
                        .limit(parseInt(perPage));

                    const totalLeads = await leadschema.countDocuments({
                        ...filter,
                        status: 2, $expr: { $eq: [{ $ifNull: [{ $arrayElemAt: ["$status_convert", 0] }, null] }, null] }
                    });

                    return res.status(200).json({ error: false, message: "Successfully find fresh lead", data: data, totalLeads })
                }
                if (status == "Pending") {
                    const filter = {};

                    if (searchQuery) {
                        filter.$or = Object.keys(leadschema.schema.paths)
                            .filter(field => leadschema.schema.paths[field].instance === 'String')
                            .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                    }

                    if (startDate && endDate) {
                        filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                    }

                    const skip = (parseInt(page) - 1) * parseInt(perPage);

                    let data = await leadschema.find({
                        ...filter, status: 2, $expr: { $eq: [{ $arrayElemAt: ["$status_convert", -1] }, "Pending"] }
                    }).sort({ createdAt: -1 })
                        .skip(skip)
                        .limit(parseInt(perPage));

                    const totalLeads = await leadschema.countDocuments({
                        ...filter,
                        status: 2, $expr: { $eq: [{ $arrayElemAt: ["$status_convert", -1] }, "Pending"] }
                    });

                    return res.status(200).json({ error: false, message: "Successfully find pending lead", data: data, totalLeads });
                }
                if (status == "Close") {
                    const filter = {};

                    if (searchQuery) {
                        filter.$or = Object.keys(leadschema.schema.paths)
                            .filter(field => leadschema.schema.paths[field].instance === 'String')
                            .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                    }

                    if (startDate && endDate) {
                        filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                    }

                    const skip = (parseInt(page) - 1) * parseInt(perPage);

                    let data = await leadschema.find({
                        ...filter, status: 2, $expr: { $eq: [{ $arrayElemAt: ["$status_convert", -1] }, "Close"] }
                    }).sort({ createdAt: -1 })
                        .skip(skip)
                        .limit(parseInt(perPage));

                    const totalLeads = await leadschema.countDocuments({
                        ...filter,
                        status: 2, $expr: { $eq: [{ $arrayElemAt: ["$status_convert", -1] }, "Close"] }
                    });

                    return res.status(200).json({ error: false, message: "Successfully find close lead", data: data, totalLeads });
                }
                if (status == "Convert") {
                    const filter = {};

                    if (searchQuery) {
                        filter.$or = Object.keys(leadschema.schema.paths)
                            .filter(field => leadschema.schema.paths[field].instance === 'String')
                            .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                    }

                    if (startDate && endDate) {
                        filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                    }

                    const skip = (parseInt(page) - 1) * parseInt(perPage);

                    let data = await leadschema.find({
                        ...filter, status: 2, $expr: { $eq: [{ $arrayElemAt: ["$status_convert", -1] }, "Convert"] }
                    }).sort({ createdAt: -1 })
                        .skip(skip)
                        .limit(parseInt(perPage));

                    const totalLeads = await leadschema.countDocuments({
                        ...filter,
                        status: 2, $expr: { $eq: [{ $arrayElemAt: ["$status_convert", -1] }, "Convert"] }
                    });

                    return res.status(200).json({ error: false, message: "Successfully find close lead", data: data, totalLeads });
                }
            }

            if (status == "Today") {

                function formatDate(dateString) {
                    const date = new Date(dateString);
                    const month = String(date.getMonth() + 1).padStart(2, '0'); // Ensures two digits for month
                    const day = String(date.getDate()).padStart(2, '0'); // Ensures two digits for day
                    const year = date.getFullYear();
                    return `${month}/${day}/${year}`;
                }

                var todayFollowup = await leadschema.find({
                    status: 2,
                    $expr: {
                        $eq: [{ $arrayElemAt: ["$status_convert", -1] }, "Pending"]
                    }
                }).sort({ createdAt: -1 });

                var todayFollowup = todayFollowup.filter(lead => {
                    const formattedDates = lead.Next_Followup_Date.map(date => formatDate(date));
                    const latestFormattedDate = formattedDates.pop();
                    return new Date(latestFormattedDate) <= new Date(current_date);
                });

                return res.status(200).json({ error: false, message: "Successfully find close lead", data: todayFollowup });
            }
        } else {
            if (startDate && endDate) {
                if (status == "Fresh") {
                    const filter = {};

                    if (searchQuery) {
                        filter.$or = Object.keys(leadschema.schema.paths)
                            .filter(field => leadschema.schema.paths[field].instance === 'String')
                            .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                    }

                    if (startDate && endDate) {
                        filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                    }

                    const skip = (parseInt(page) - 1) * parseInt(perPage);

                    let data = await leadschema.find({
                        ...filter, Lead_AssignID: id, $expr: { $eq: [{ $ifNull: [{ $arrayElemAt: ["$status_convert", 0] }, null] }, null] }
                    }).sort({ createdAt: -1 })
                        .skip(skip)
                        .limit(parseInt(perPage));

                    const totalLeads = await leadschema.countDocuments({
                        ...filter,
                        Lead_AssignID: id, $expr: { $eq: [{ $ifNull: [{ $arrayElemAt: ["$status_convert", 0] }, null] }, null] }
                    });

                    return res.status(200).json({ error: false, message: "Successfully find fresh lead", data: data, totalLeads })
                }
                if (status == "Pending") {
                    const filter = {};

                    if (searchQuery) {
                        filter.$or = Object.keys(leadschema.schema.paths)
                            .filter(field => leadschema.schema.paths[field].instance === 'String')
                            .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                    }

                    if (startDate && endDate) {
                        filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                    }

                    const skip = (parseInt(page) - 1) * parseInt(perPage);

                    let data = await leadschema.find({
                        ...filter, Lead_AssignID: id, $expr: { $eq: [{ $arrayElemAt: ["$status_convert", -1] }, "Pending"] }
                    }).sort({ createdAt: -1 })
                        .skip(skip)
                        .limit(parseInt(perPage));

                    const totalLeads = await leadschema.countDocuments({
                        ...filter,
                        Lead_AssignID: id, $expr: { $eq: [{ $arrayElemAt: ["$status_convert", -1] }, "Pending"] }
                    });

                    return res.status(200).json({ error: false, message: "Successfully find pending lead", data: data, totalLeads });
                }
                if (status == "Close") {
                    const filter = {};

                    if (searchQuery) {
                        filter.$or = Object.keys(leadschema.schema.paths)
                            .filter(field => leadschema.schema.paths[field].instance === 'String')
                            .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                    }

                    if (startDate && endDate) {
                        filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                    }

                    const skip = (parseInt(page) - 1) * parseInt(perPage);

                    let data = await leadschema.find({
                        ...filter, Lead_AssignID: id, $expr: { $eq: [{ $arrayElemAt: ["$status_convert", -1] }, "Close"] }
                    }).sort({ createdAt: -1 })
                        .skip(skip)
                        .limit(parseInt(perPage));

                    const totalLeads = await leadschema.countDocuments({
                        ...filter,
                        Lead_AssignID: id, $expr: { $eq: [{ $arrayElemAt: ["$status_convert", -1] }, "Close"] }
                    });

                    return res.status(200).json({ error: false, message: "Successfully find close lead", data: data, totalLeads });
                }
                if (status == "Convert") {
                    const filter = {};

                    if (searchQuery) {
                        filter.$or = Object.keys(leadschema.schema.paths)
                            .filter(field => leadschema.schema.paths[field].instance === 'String')
                            .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                    }

                    if (startDate && endDate) {
                        filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                    }

                    const skip = (parseInt(page) - 1) * parseInt(perPage);

                    let data = await leadschema.find({
                        ...filter, Lead_AssignID: id, $expr: { $eq: [{ $arrayElemAt: ["$status_convert", -1] }, "Convert"] }
                    }).sort({ createdAt: -1 })
                        .skip(skip)
                        .limit(parseInt(perPage));

                    const totalLeads = await leadschema.countDocuments({
                        ...filter,
                        Lead_AssignID: id, $expr: { $eq: [{ $arrayElemAt: ["$status_convert", -1] }, "Convert"] }
                    });

                    return res.status(200).json({ error: false, message: "Successfully find close lead", data: data, totalLeads });
                }
            }

            const formatLeadDate = (dateString) => {
                const date = new Date(dateString);
                const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                const month = monthNames[date.getMonth()];
                const day = String(date.getDate()).padStart(2, '0'); // Ensures two digits for day
                const year = date.getFullYear();
                const hours = '00';
                const minutes = '00';
                const seconds = '00';
                const timezoneOffset = '+0530'; // India Standard Time

                return `${month} ${day} ${year} ${hours}:${minutes}:${seconds} GMT${timezoneOffset}`;
            };

            if (status == "Today") {
                function formatDate(dateString) {
                    const date = new Date(dateString);
                    const month = String(date.getMonth() + 1).padStart(2, '0'); // Ensures two digits for month
                    const day = String(date.getDate()).padStart(2, '0'); // Ensures two digits for day
                    const year = date.getFullYear();
                    return `${month}/${day}/${year}`;
                }

                var todayFollowup = await leadschema.find({
                    Lead_AssignID: id,
                    $expr: {
                        $eq: [{ $arrayElemAt: ["$status_convert", -1] }, "Pending"]
                    }
                }).sort({ createdAt: -1 });

                var todayFollowup = todayFollowup.filter(lead => {
                    const formattedDates = lead.Next_Followup_Date.map(date => formatDate(date));
                    const latestFormattedDate = formattedDates.pop();
                    return new Date(latestFormattedDate) <= new Date(current_date);
                });

                return res.status(200).json({ error: false, message: "Successfully find close lead", data: todayFollowup });
            }
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ error: true, message: "Internal Server Error", data: null });
    }
};

const getLeadTodayCount = async (req, res) => {
    try {
        const { id, page, perPage, searchQuery, status } = req.query;
        if (id == '') {
            const filter = {};

            if (searchQuery) {
                filter.$or = Object.keys(leadschema.schema.paths)
                    .filter(field => leadschema.schema.paths[field].instance === 'String')
                    .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
            }

            const skip = (parseInt(page) - 1) * parseInt(perPage);

            const data = await leadschema.find({ ...filter, status: 2, $expr: { $eq: [{ $arrayElemAt: ["$status_convert", -1] }, "Pending"] } })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(perPage));

            const totalRows = await leadschema.countDocuments({ ...filter, status: 2, $expr: { $eq: [{ $arrayElemAt: ["$status_convert", -1] }, "Pending"] } });

            return res.status(200).json({ error: false, message: "Successfully find today followups lead", data: data, totalRows });
        } else {
            const filter = {};

            if (searchQuery) {
                filter.$or = Object.keys(leadschema.schema.paths)
                    .filter(field => leadschema.schema.paths[field].instance === 'String')
                    .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
            }

            filter.Lead_AssignID = id;

            const skip = (parseInt(page) - 1) * parseInt(perPage);

            let data = await leadschema.find({ ...filter, $expr: { $eq: [{ $arrayElemAt: ["$status_convert", -1] }, "Pending"] } })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(perPage));

            const totalRows = await leadschema.countDocuments({ ...filter, $expr: { $eq: [{ $arrayElemAt: ["$status_convert", -1] }, "Pending"] } });

            return res.status(200).json({ error: false, message: "Successfully find today followups lead", data: data, totalRows });
        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error", data: null });
    }
};

const getLeadFillingManagerCount = async (req, res) => {
    try {
        const { id } = req.query;
        if (id == '') {
            const freshLeadsCount = await leadschema.find({ status: 3 }).countDocuments();
            const studentVisaFreshCount = await leadschema.find({ $or: [{ status: 3 }, { status: 4 }], Services: "Student Visa - Fresh" }).countDocuments();
            const studentVisaRefusalCount = await leadschema.find({ $or: [{ status: 3 }, { status: 4 }], Services: "Student Visa - Refusal" }).countDocuments();
            const spousalOpenWorkPermitFreshCount = await leadschema.find({ $or: [{ status: 3 }, { status: 4 }], Services: "Spousal Open Work Permit - Fresh" }).countDocuments();
            const spousalOpenWorkPermitRefusalCount = await leadschema.find({ $or: [{ status: 3 }, { status: 4 }], Services: "Spousal Open Work Permit - Refusal" }).countDocuments();
            const spousalSponsorshipFreshCount = await leadschema.find({ $or: [{ status: 3 }, { status: 4 }], Services: "Spousal Sponsorship - Fresh" }).countDocuments();
            const spousalSponsorshipRefusalCount = await leadschema.find({ $or: [{ status: 3 }, { status: 4 }], Services: "Spousal Sponsorship - Refusal" }).countDocuments();
            const workPermitFreshCount = await leadschema.find({ $or: [{ status: 3 }, { status: 4 }], Services: "Work Permit - Fresh" }).countDocuments();
            const workPermitRefusalCount = await leadschema.find({ $or: [{ status: 3 }, { status: 4 }], Services: "Work Permit - Refusal" }).countDocuments();
            const touristVisaFreshCount = await leadschema.find({ $or: [{ status: 3 }, { status: 4 }], Services: "Tourist Visa - Fresh" }).countDocuments();
            const touristVisaRefusalCount = await leadschema.find({ $or: [{ status: 3 }, { status: 4 }], Services: "Tourist Visa - Refusal" }).countDocuments();
            const RNIPFreshCount = await leadschema.find({ $or: [{ status: 3 }, { status: 4 }], Services: "RNIP (Rural and Northern Immigration Pilot) - Fresh" }).countDocuments();
            const RNIPRefusalCount = await leadschema.find({ $or: [{ status: 3 }, { status: 4 }], Services: "RNIP (Rural and Northern Immigration Pilot) - Refusal" }).countDocuments();
            const visaExtensionsFreshCount = await leadschema.find({ $or: [{ status: 3 }, { status: 4 }], Services: "Visa Extensions - Fresh" }).countDocuments();
            const visaExtensionsRefusalCount = await leadschema.find({ $or: [{ status: 3 }, { status: 4 }], Services: "Visa Extensions - Refusal" }).countDocuments();
            const federalFilingFreshCount = await leadschema.find({ $or: [{ status: 3 }, { status: 4 }], Services: "Federal Filing - Fresh" }).countDocuments();
            const federalFilingRefusalCount = await leadschema.find({ $or: [{ status: 3 }, { status: 4 }], Services: "Federal Filing - Refusal" }).countDocuments();
            const PNPFreshCount = await leadschema.find({ $or: [{ status: 3 }, { status: 4 }], Services: "PNP (Provincial Nominee Program) Application. - Fresh" }).countDocuments();
            const PNPRefusalCount = await leadschema.find({ $or: [{ status: 3 }, { status: 4 }], Services: "PNP (Provincial Nominee Program) Application. - Refusal" }).countDocuments();

            const data = {
                freshLeadsCount: freshLeadsCount,
                studentVisaFreshCount: studentVisaFreshCount,
                studentVisaRefusalCount: studentVisaRefusalCount,
                spousalOpenWorkPermitFreshCount: spousalOpenWorkPermitFreshCount,
                spousalOpenWorkPermitRefusalCount: spousalOpenWorkPermitRefusalCount,
                spousalSponsorshipFreshCount: spousalSponsorshipFreshCount,
                spousalSponsorshipRefusalCount: spousalSponsorshipRefusalCount,
                workPermitFreshCount: workPermitFreshCount,
                workPermitRefusalCount: workPermitRefusalCount,
                touristVisaFreshCount: touristVisaFreshCount,
                touristVisaRefusalCount: touristVisaRefusalCount,
                RNIPFreshCount: RNIPFreshCount,
                RNIPRefusalCount: RNIPRefusalCount,
                visaExtensionsFreshCount: visaExtensionsFreshCount,
                visaExtensionsRefusalCount: visaExtensionsRefusalCount,
                federalFilingFreshCount: federalFilingFreshCount,
                federalFilingRefusalCount: federalFilingRefusalCount,
                PNPFreshCount: PNPFreshCount,
                PNPRefusalCount: PNPRefusalCount
            }
            return res.status(200).json({
                error: false, message: "Successfully filling manager count", data: data
            })
        } else {
            const freshLeadsCount = await leadschema.find({ Filing_ManagerID: id, status: 3 }).countDocuments();
            const studentVisaFreshCount = await leadschema.find({ Filing_ManagerID: id, Services: "Student Visa - Fresh" }).countDocuments();
            const studentVisaRefusalCount = await leadschema.find({ Filing_ManagerID: id, Services: "Student Visa - Refusal" }).countDocuments();
            const spousalOpenWorkPermitFreshCount = await leadschema.find({ Filing_ManagerID: id, Services: "Spousal Open Work Permit - Fresh" }).countDocuments();
            const spousalOpenWorkPermitRefusalCount = await leadschema.find({ Filing_ManagerID: id, Services: "Spousal Open Work Permit - Refusal" }).countDocuments();
            const spousalSponsorshipFreshCount = await leadschema.find({ Filing_ManagerID: id, Services: "Spousal Sponsorship - Fresh" }).countDocuments();
            const spousalSponsorshipRefusalCount = await leadschema.find({ Filing_ManagerID: id, Services: "Spousal Sponsorship - Refusal" }).countDocuments();
            const workPermitFreshCount = await leadschema.find({ Filing_ManagerID: id, Services: "Work Permit - Fresh" }).countDocuments();
            const workPermitRefusalCount = await leadschema.find({ Filing_ManagerID: id, Services: "Work Permit - Refusal" }).countDocuments();
            const touristVisaFreshCount = await leadschema.find({ Filing_ManagerID: id, Services: "Tourist Visa - Fresh" }).countDocuments();
            const touristVisaRefusalCount = await leadschema.find({ Filing_ManagerID: id, Services: "Tourist Visa - Refusal" }).countDocuments();
            const RNIPFreshCount = await leadschema.find({ Filing_ManagerID: id, Services: "RNIP (Rural and Northern Immigration Pilot) - Fresh" }).countDocuments();
            const RNIPRefusalCount = await leadschema.find({ Filing_ManagerID: id, Services: "RNIP (Rural and Northern Immigration Pilot) - Refusal" }).countDocuments();
            const visaExtensionsFreshCount = await leadschema.find({ Filing_ManagerID: id, Services: "Visa Extensions - Fresh" }).countDocuments();
            const visaExtensionsRefusalCount = await leadschema.find({ Filing_ManagerID: id, Services: "Visa Extensions - Refusal" }).countDocuments();
            const federalFilingFreshCount = await leadschema.find({ Filing_ManagerID: id, Services: "Federal Filing - Fresh" }).countDocuments();
            const federalFilingRefusalCount = await leadschema.find({ Filing_ManagerID: id, Services: "Federal Filing - Refusal" }).countDocuments();
            const PNPFreshCount = await leadschema.find({ Filing_ManagerID: id, Services: "PNP (Provincial Nominee Program) Application. - Fresh" }).countDocuments();
            const PNPRefusalCount = await leadschema.find({ Filing_ManagerID: id, Services: "PNP (Provincial Nominee Program) Application. - Refusal" }).countDocuments();
            const caseInitiateCount = await leadschema.find({ Filing_ManagerID: id, $expr: { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "Case Initiated"] } }).countDocuments();
            const fileInitiateCount = await leadschema.countDocuments({
                Filing_ManagerID: id, $expr: {
                    $and: [
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "File Initiated or docs checklist sent"] }
                    ]
                }
            });
            const docsReceivedCount = await leadschema.countDocuments({
                Filing_ManagerID: id, $expr: {
                    $and: [
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "Docs received & Pending docs sent"] }
                    ]
                }
            });
            const sopPreprationCount = await leadschema.countDocuments({
                Filing_ManagerID: id, $expr: {
                    $and: [
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "Sop Or letters prepration & Forms prep"] }
                    ]
                }
            });
            const sopLettersCount = await leadschema.countDocuments({
                Filing_ManagerID: id, $expr: {
                    $and: [
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.sopletters", -1] }, "SOP or Letters sent to client"] }
                    ]
                }
            });
            const confirmRecievedCount = await leadschema.countDocuments({
                Filing_ManagerID: id, $expr: {
                    $and: [
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.sopletters", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.confirmrecieved", -1] }, "Confirmation received on SOP, letters and docs, Forms confirmation"] }
                    ]
                }
            });
            const fileSentCount = await leadschema.countDocuments({
                Filing_ManagerID: id, $expr: {
                    $and: [
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.sopletters", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.confirmrecieved", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.filesent", -1] }, "File sent for Upload or submission"] }
                    ]
                }
            });
            const visaApprovedCount = await leadschema.countDocuments({
                Filing_ManagerID: id, $expr: {
                    $and: [
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.sopletters", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.confirmrecieved", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.filesent", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.visaapproved", -1] }, "Visa approved"] }
                    ]
                }
            });
            const visaRefusalCount = await leadschema.countDocuments({
                Filing_ManagerID: id, $expr: {
                    $and: [
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.sopletters", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.confirmrecieved", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.filesent", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.visaapproved", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.visarefusal", -1] }, "Visa refusal"] }
                    ]
                }
            });

            const data = {
                freshLeadsCount: freshLeadsCount,
                studentVisaFreshCount: studentVisaFreshCount,
                studentVisaRefusalCount: studentVisaRefusalCount,
                spousalOpenWorkPermitFreshCount: spousalOpenWorkPermitFreshCount,
                spousalOpenWorkPermitRefusalCount: spousalOpenWorkPermitRefusalCount,
                spousalSponsorshipFreshCount: spousalSponsorshipFreshCount,
                spousalSponsorshipRefusalCount: spousalSponsorshipRefusalCount,
                workPermitFreshCount: workPermitFreshCount,
                workPermitRefusalCount: workPermitRefusalCount,
                touristVisaFreshCount: touristVisaFreshCount,
                touristVisaRefusalCount: touristVisaRefusalCount,
                RNIPFreshCount: RNIPFreshCount,
                RNIPRefusalCount: RNIPRefusalCount,
                visaExtensionsFreshCount: visaExtensionsFreshCount,
                visaExtensionsRefusalCount: visaExtensionsRefusalCount,
                federalFilingFreshCount: federalFilingFreshCount,
                federalFilingRefusalCount: federalFilingRefusalCount,
                PNPFreshCount: PNPFreshCount,
                PNPRefusalCount: PNPRefusalCount,
                caseInitiateCount: caseInitiateCount,
                fileInitiateCount: fileInitiateCount,
                docsReceivedCount: docsReceivedCount,
                sopPreprationCount: sopPreprationCount,
                sopLettersCount: sopLettersCount,
                confirmRecievedCount: confirmRecievedCount,
                fileSentCount: fileSentCount,
                visaApprovedCount: visaApprovedCount,
                visaRefusalCount: visaRefusalCount
            }

            return res.status(200).json({
                error: false, message: "Successfully filling manager count", data: data
            })

        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error", data: null });
    }
};

const getLeadFillingManager = async (req, res) => {
    try {
        const { page, perPage, searchQuery, startDate, endDate, id, status } = req.query;
        if (id == '') {
            if (status == "") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({ ...filter, status: 3 })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({ ...filter, status: 3 });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "Student Visa - Fresh") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({ ...filter, $or: [{ status: 3 }, { status: 4 }], Services: "Student Visa - Fresh" })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({ ...filter, $or: [{ status: 3 }, { status: 4 }], Services: "Student Visa - Fresh" });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "Student Visa - Refusal") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({ ...filter, $or: [{ status: 3 }, { status: 4 }], Services: "Student Visa - Refusal" })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({ ...filter, $or: [{ status: 3 }, { status: 4 }], Services: "Student Visa - Refusal" });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "Spousal Open Work Permit - Fresh") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({ ...filter, $or: [{ status: 3 }, { status: 4 }], Services: "Spousal Open Work Permit - Fresh" })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({ ...filter, $or: [{ status: 3 }, { status: 4 }], Services: "Spousal Open Work Permit - Fresh" });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "Spousal Open Work Permit - Refusal") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({ ...filter, $or: [{ status: 3 }, { status: 4 }], Services: "Spousal Open Work Permit - Refusal" })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({ ...filter, $or: [{ status: 3 }, { status: 4 }], Services: "Spousal Open Work Permit - Refusal" });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "Spousal Sponsorship - Fresh") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({ ...filter, $or: [{ status: 3 }, { status: 4 }], Services: "Spousal Sponsorship - Fresh" })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({ ...filter, $or: [{ status: 3 }, { status: 4 }], Services: "Spousal Sponsorship - Fresh" });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "Spousal Sponsorship - Refusal") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({ ...filter, $or: [{ status: 3 }, { status: 4 }], Services: "Spousal Sponsorship - Refusal" })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({ ...filter, $or: [{ status: 3 }, { status: 4 }], Services: "Spousal Sponsorship - Refusal" });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "Work Permit - Fresh") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({ ...filter, $or: [{ status: 3 }, { status: 4 }], Services: "Work Permit - Fresh" })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({ ...filter, $or: [{ status: 3 }, { status: 4 }], Services: "Work Permit - Fresh" });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "Work Permit - Refusal") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({ ...filter, $or: [{ status: 3 }, { status: 4 }], Services: "Work Permit - Refusal" })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({ ...filter, $or: [{ status: 3 }, { status: 4 }], Services: "Work Permit - Refusal" });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "Tourist Visa - Fresh") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({ ...filter, $or: [{ status: 3 }, { status: 4 }], Services: "Tourist Visa - Fresh" })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({ ...filter, $or: [{ status: 3 }, { status: 4 }], Services: "Tourist Visa - Fresh" });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "Tourist Visa - Refusal") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({ ...filter, $or: [{ status: 3 }, { status: 4 }], Services: "Tourist Visa - Refusal" })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({ ...filter, $or: [{ status: 3 }, { status: 4 }], Services: "Tourist Visa - Refusal" });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "RNIP (Rural and Northern Immigration Pilot) - Fresh") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({ ...filter, $or: [{ status: 3 }, { status: 4 }], Services: "RNIP (Rural and Northern Immigration Pilot) - Fresh" })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({ ...filter, $or: [{ status: 3 }, { status: 4 }], Services: "RNIP (Rural and Northern Immigration Pilot) - Fresh" });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "RNIP (Rural and Northern Immigration Pilot) - Refusal") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({ ...filter, $or: [{ status: 3 }, { status: 4 }], Services: "RNIP (Rural and Northern Immigration Pilot) - Refusal" })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({ ...filter, $or: [{ status: 3 }, { status: 4 }], Services: "RNIP (Rural and Northern Immigration Pilot) - Refusal" });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "Visa Extensions - Fresh") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({ ...filter, $or: [{ status: 3 }, { status: 4 }], Services: "Visa Extensions - Fresh" })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({ ...filter, $or: [{ status: 3 }, { status: 4 }], Services: "Visa Extensions - Fresh" });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "Visa Extensions - Refusal") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({ ...filter, $or: [{ status: 3 }, { status: 4 }], Services: "Visa Extensions - Refusal" })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({ ...filter, $or: [{ status: 3 }, { status: 4 }], Services: "Visa Extensions - Refusal" });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "Federal Filing - Fresh") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({ ...filter, $or: [{ status: 3 }, { status: 4 }], Services: "Federal Filing - Fresh" })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({ ...filter, $or: [{ status: 3 }, { status: 4 }], Services: "Federal Filing - Fresh" });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "Federal Filing - Refusal") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({ ...filter, $or: [{ status: 3 }, { status: 4 }], Services: "Federal Filing - Refusal" })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({ ...filter, $or: [{ status: 3 }, { status: 4 }], Services: "Federal Filing - Refusal" });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "PNP (Provincial Nominee Program) Application. - Fresh") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({ ...filter, $or: [{ status: 3 }, { status: 4 }], Services: "PNP (Provincial Nominee Program) Application. - Fresh" })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({ ...filter, $or: [{ status: 3 }, { status: 4 }], Services: "PNP (Provincial Nominee Program) Application. - Fresh" });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "PNP (Provincial Nominee Program) Application. - Refusal") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({ ...filter, $or: [{ status: 3 }, { status: 4 }], Services: "PNP (Provincial Nominee Program) Application. - Refusal" })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({ ...filter, $or: [{ status: 3 }, { status: 4 }], Services: "PNP (Provincial Nominee Program) Application. - Refusal" });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
        } else {
            if (status == "") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({ ...filter, Filing_ManagerID: id, status: 3 })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({ ...filter, Filing_ManagerID: id, status: 3 });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "Student Visa - Fresh") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({ ...filter, Filing_ManagerID: id, Services: "Student Visa - Fresh" })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({ ...filter, Filing_ManagerID: id, Services: "Student Visa - Fresh" });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "Student Visa - Refusal") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({ ...filter, Filing_ManagerID: id, Services: "Student Visa - Refusal" })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({ ...filter, Filing_ManagerID: id, Services: "Student Visa - Refusal" });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "Spousal Open Work Permit - Fresh") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({ ...filter, Filing_ManagerID: id, Services: "Spousal Open Work Permit - Fresh" })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({ ...filter, Filing_ManagerID: id, Services: "Spousal Open Work Permit - Fresh" });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "Spousal Open Work Permit - Refusal") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({ ...filter, Filing_ManagerID: id, Services: "Spousal Open Work Permit - Refusal" })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({ ...filter, Filing_ManagerID: id, Services: "Spousal Open Work Permit - Refusal" });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "Spousal Sponsorship - Fresh") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({ ...filter, Filing_ManagerID: id, Services: "Spousal Sponsorship - Fresh" })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({ ...filter, Filing_ManagerID: id, Services: "Spousal Sponsorship - Fresh" });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "Spousal Sponsorship - Refusal") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({ ...filter, Filing_ManagerID: id, Services: "Spousal Sponsorship - Refusal" })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({ ...filter, Filing_ManagerID: id, Services: "Spousal Sponsorship - Refusal" });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "Work Permit - Fresh") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({ ...filter, Filing_ManagerID: id, Services: "Work Permit - Fresh" })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({ ...filter, Filing_ManagerID: id, Services: "Work Permit - Fresh" });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "Work Permit - Refusal") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({ ...filter, Filing_ManagerID: id, Services: "Work Permit - Refusal" })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({ ...filter, Filing_ManagerID: id, Services: "Work Permit - Refusal" });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "Tourist Visa - Fresh") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({ ...filter, Filing_ManagerID: id, Services: "Tourist Visa - Fresh" })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({ ...filter, Filing_ManagerID: id, Services: "Tourist Visa - Fresh" });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "Tourist Visa - Refusal") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({ ...filter, Filing_ManagerID: id, Services: "Tourist Visa - Refusal" })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({ ...filter, Filing_ManagerID: id, Services: "Tourist Visa - Refusal" });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "RNIP (Rural and Northern Immigration Pilot) - Fresh") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({ ...filter, Filing_ManagerID: id, Services: "RNIP (Rural and Northern Immigration Pilot) - Fresh" })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({ ...filter, Filing_ManagerID: id, Services: "RNIP (Rural and Northern Immigration Pilot) - Fresh" });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "RNIP (Rural and Northern Immigration Pilot) - Refusal") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({ ...filter, Filing_ManagerID: id, Services: "RNIP (Rural and Northern Immigration Pilot) - Refusal" })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({ ...filter, Filing_ManagerID: id, Services: "RNIP (Rural and Northern Immigration Pilot) - Refusal" });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "Visa Extensions - Fresh") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({ ...filter, Filing_ManagerID: id, Services: "Visa Extensions - Fresh" })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({ ...filter, Filing_ManagerID: id, Services: "Visa Extensions - Fresh" });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "Visa Extensions - Refusal") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({ ...filter, Filing_ManagerID: id, Services: "Visa Extensions - Refusal" })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({ ...filter, Filing_ManagerID: id, Services: "Visa Extensions - Refusal" });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "Federal Filing - Fresh") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({ ...filter, Filing_ManagerID: id, Services: "Federal Filing - Fresh" })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({ ...filter, Filing_ManagerID: id, Services: "Federal Filing - Fresh" });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "Federal Filing - Refusal") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({ ...filter, Filing_ManagerID: id, Services: "Federal Filing - Refusal" })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({ ...filter, Filing_ManagerID: id, Services: "Federal Filing - Refusal" });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "PNP (Provincial Nominee Program) Application. - Fresh") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({ ...filter, Filing_ManagerID: id, Services: "PNP (Provincial Nominee Program) Application. - Fresh" })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({ ...filter, Filing_ManagerID: id, Services: "PNP (Provincial Nominee Program) Application. - Fresh" });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "PNP (Provincial Nominee Program) Application. - Refusal") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({ ...filter, Filing_ManagerID: id, Services: "PNP (Provincial Nominee Program) Application. - Refusal" })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({ ...filter, Filing_ManagerID: id, Services: "PNP (Provincial Nominee Program) Application. - Refusal" });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "Case Initiated") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({ ...filter, Filing_ManagerID: id, $expr: { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "Case Initiated"] } })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({ ...filter, Filing_ManagerID: id, $expr: { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "Case Initiated"] } });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "File Initiated or docs checklist sent") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({
                    ...filter, Filing_ManagerID: id, $expr: {
                        $and: [
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "File Initiated or docs checklist sent"] }
                        ]
                    }
                })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({
                    ...filter, Filing_ManagerID: id, $expr: {
                        $and: [
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "File Initiated or docs checklist sent"] }
                        ]
                    }
                });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "Docs received & Pending docs sent") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({
                    ...filter, Filing_ManagerID: id, $expr: {
                        $and: [
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "Docs received & Pending docs sent"] }
                        ]
                    }
                })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({
                    ...filter, Filing_ManagerID: id, $expr: {
                        $and: [
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "Docs received & Pending docs sent"] }
                        ]
                    }
                });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "Sop Or letters prepration & Forms prep") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({
                    ...filter, Filing_ManagerID: id, $expr: {
                        $and: [
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "Sop Or letters prepration & Forms prep"] }
                        ]
                    }
                })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({
                    ...filter, Filing_ManagerID: id, $expr: {
                        $and: [
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "Sop Or letters prepration & Forms prep"] }
                        ]
                    }
                });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "SOP or Letters sent to client") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({
                    ...filter, Filing_ManagerID: id, $expr: {
                        $and: [
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopletters", -1] }, "SOP or Letters sent to client"] }
                        ]
                    }
                })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({
                    ...filter, Filing_ManagerID: id, $expr: {
                        $and: [
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopletters", -1] }, "SOP or Letters sent to client"] }
                        ]
                    }
                });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "Confirmation received on SOP, letters and docs, Forms confirmation") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({
                    ...filter, Filing_ManagerID: id, $expr: {
                        $and: [
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopletters", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.confirmrecieved", -1] }, "Confirmation received on SOP, letters and docs, Forms confirmation"] }
                        ]
                    }
                })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({
                    ...filter, Filing_ManagerID: id, $expr: {
                        $and: [
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopletters", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.confirmrecieved", -1] }, "Confirmation received on SOP, letters and docs, Forms confirmation"] }
                        ]
                    }
                });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "File sent for Upload or submission") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({
                    ...filter, Filing_ManagerID: id, $expr: {
                        $and: [
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopletters", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.confirmrecieved", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.filesent", -1] }, "File sent for Upload or submission"] }
                        ]
                    }
                })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({
                    ...filter, Filing_ManagerID: id, $expr: {
                        $and: [
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopletters", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.confirmrecieved", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.filesent", -1] }, "File sent for Upload or submission"] }
                        ]
                    }
                });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "Visa approved") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({
                    ...filter, Filing_ManagerID: id, $expr: {
                        $and: [
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopletters", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.confirmrecieved", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.filesent", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.visaapproved", -1] }, "Visa approved"] }
                        ]
                    }
                })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({
                    ...filter, Filing_ManagerID: id, $expr: {
                        $and: [
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopletters", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.confirmrecieved", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.filesent", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.visaapproved", -1] }, "Visa approved"] }
                        ]
                    }
                });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "Visa refusal") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({
                    ...filter, Filing_ManagerID: id, $expr: {
                        $and: [
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopletters", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.confirmrecieved", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.filesent", -1] }, "true"] },
                            // { $eq: [{ $arrayElemAt: ["$Filing_Process.visaapproved", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.visarefusal", -1] }, "Visa refusal"] }
                        ]
                    }
                })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({
                    ...filter, Filing_ManagerID: id, $expr: {
                        $and: [
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopletters", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.confirmrecieved", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.filesent", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.visaapproved", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.visarefusal", -1] }, "Visa refusal"] }
                        ]
                    }
                });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error", data: null });
    }
};

const getLeadFillingCaseCount = async (req, res) => {
    try {
        const { id } = req.query;
        if (id == '') {
            const caseInitiateCount = await leadschema.find({ status: 4, $expr: { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "Case Initiated"] } }).countDocuments();
            const fileInitiateCount = await leadschema.countDocuments({
                status: 4, $expr: {
                    $and: [
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "File Initiated or docs checklist sent"] }
                    ]
                }
            });
            const docsReceivedCount = await leadschema.countDocuments({
                status: 4, $expr: {
                    $and: [
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "Docs received & Pending docs sent"] }
                    ]
                }
            });
            const sopPreprationCount = await leadschema.countDocuments({
                status: 4, $expr: {
                    $and: [
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "Sop Or letters prepration & Forms prep"] }
                    ]
                }
            });
            const sopLettersCount = await leadschema.countDocuments({
                status: 4, $expr: {
                    $and: [
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.sopletters", -1] }, "SOP or Letters sent to client"] }
                    ]
                }
            });
            const confirmRecievedCount = await leadschema.countDocuments({
                status: 4, $expr: {
                    $and: [
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.sopletters", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.confirmrecieved", -1] }, "Confirmation received on SOP, letters and docs, Forms confirmation"] }
                    ]
                }
            });
            const fileSentCount = await leadschema.countDocuments({
                status: 4, $expr: {
                    $and: [
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.sopletters", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.confirmrecieved", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.filesent", -1] }, "File sent for Upload or submission"] }
                    ]
                }
            });

            const filesSubmittedCount = await leadschema.countDocuments({
                status: 4, $expr: {
                    $and: [
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.sopletters", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.confirmrecieved", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.filesent", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.filessubmitted", -1] }, "Files Submitted"] }
                    ]
                }
            });

            const visaApprovedCount = await leadschema.countDocuments({
                status: 4, $expr: {
                    $and: [
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.sopletters", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.confirmrecieved", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.filesent", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.visaapproved", -1] }, "Visa approved"] }
                    ]
                }
            });

            const visaRefusalCount = await leadschema.countDocuments({
                status: 4, $expr: {
                    $and: [
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.sopletters", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.confirmrecieved", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.filesent", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.visaapproved", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.visarefusal", -1] }, "Visa refusal"] }
                    ]
                }
            });

            const data = {
                caseInitiateCount: caseInitiateCount,
                fileInitiateCount: fileInitiateCount,
                docsReceivedCount: docsReceivedCount,
                sopPreprationCount: sopPreprationCount,
                sopLettersCount: sopLettersCount,
                confirmRecievedCount: confirmRecievedCount,
                fileSentCount: fileSentCount,
                visaApprovedCount: visaApprovedCount,
                filesSubmittedCount: filesSubmittedCount,
                visaRefusalCount: visaRefusalCount
            }

            return res.status(200).json({
                error: false, message: "Successfully filling manager count", data: data
            })

        } else {
            const caseInitiateCount = await leadschema.find({ Filing_TeamID: id, $expr: { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "Case Initiated"] } }).countDocuments();
            const fileInitiateCount = await leadschema.countDocuments({
                Filing_TeamID: id, $expr: {
                    $and: [
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "File Initiated or docs checklist sent"] }
                    ]
                }
            });
            const docsReceivedCount = await leadschema.countDocuments({
                Filing_TeamID: id, $expr: {
                    $and: [
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "Docs received & Pending docs sent"] }
                    ]
                }
            });
            const sopPreprationCount = await leadschema.countDocuments({
                Filing_TeamID: id, $expr: {
                    $and: [
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "Sop Or letters prepration & Forms prep"] }
                    ]
                }
            });
            const sopLettersCount = await leadschema.countDocuments({
                Filing_TeamID: id, $expr: {
                    $and: [
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.sopletters", -1] }, "SOP or Letters sent to client"] }
                    ]
                }
            });
            const confirmRecievedCount = await leadschema.countDocuments({
                Filing_TeamID: id, $expr: {
                    $and: [
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.sopletters", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.confirmrecieved", -1] }, "Confirmation received on SOP, letters and docs, Forms confirmation"] }
                    ]
                }
            });
            const fileSentCount = await leadschema.countDocuments({
                Filing_TeamID: id, $expr: {
                    $and: [
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.sopletters", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.confirmrecieved", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.filesent", -1] }, "File sent for Upload or submission"] }
                    ]
                }
            });
            const filesSubmittedCount = await leadschema.countDocuments({
                Filing_TeamID: id, $expr: {
                    $and: [
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.sopletters", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.confirmrecieved", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.filesent", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.filessubmitted", -1] }, "Files Submitted"] }
                    ]
                }
            });
            const visaApprovedCount = await leadschema.countDocuments({
                Filing_TeamID: id, $expr: {
                    $and: [
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.sopletters", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.confirmrecieved", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.filesent", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.visaapproved", -1] }, "Visa approved"] }
                    ]
                }
            });
            const visaRefusalCount = await leadschema.countDocuments({
                Filing_TeamID: id, $expr: {
                    $and: [
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.sopletters", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.confirmrecieved", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.filesent", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.visaapproved", -1] }, "true"] },
                        { $eq: [{ $arrayElemAt: ["$Filing_Process.visarefusal", -1] }, "Visa refusal"] }
                    ]
                }
            });

            const data = {
                caseInitiateCount: caseInitiateCount,
                fileInitiateCount: fileInitiateCount,
                docsReceivedCount: docsReceivedCount,
                sopPreprationCount: sopPreprationCount,
                sopLettersCount: sopLettersCount,
                confirmRecievedCount: confirmRecievedCount,
                fileSentCount: fileSentCount,
                filesSubmittedCount: filesSubmittedCount,
                visaApprovedCount: visaApprovedCount,
                visaRefusalCount: visaRefusalCount
            }

            return res.status(200).json({
                error: false, message: "Successfully filling manager count", data: data
            })

        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error", data: null });
    }
};

const otherNotesLeadUpdate = async(req,res) => {
    try {

        let otherNotes = req.body.otherNotes
        let id = req.body.id
        // console.log("-------------------",req.body);


        let data = await leadschema.findByIdAndUpdate(id, {other_note: otherNotes })
        data = await leadschema.findById(id)
        // console.log('data: ', data);

        return res.status(200).json({error: false, message: data.other_note})

    } catch (error) {
        return res.status(400).json({error: true, message: "somthing went to wrong"+error})
    }
}

const otherNoeDataGet = async(req,res) => {
    try {
        let data = req.query.data
        // let page=req.query.page
        // let perPage=req.query.perPage

        console.log('data------------: ', data);

        let filter = {};
        // const skip = (parseInt(page) - 1) * parseInt(perPage);

        filter.$or = Object.keys(leadschema.schema.paths)
            .filter(field => leadschema.schema.paths[field].instance === 'String')
            .map(field => ({ [field]: { $regex: data, $options: 'i' } }));

        const datas = await leadschema.find({ ...filter})
            .sort({ createdAt: -1 })
        // .skip(skip)
        // .limit(parseInt(perPage));
        return res.status(200).json({error: false, message: datas})

    } catch (error) {
        return res.status(400).json({error: true, message: "somthing went to wrong"})
    }
}

const getLeadFillingCase = async (req, res) => {
    try {
        const { page, perPage, searchQuery, startDate, endDate, id, status } = req.query;
        if (id == '') {
            if (status == "Case Initiated") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({ ...filter, status: 4, $expr: { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "Case Initiated"] } })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({ ...filter, status: 4, $expr: { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "Case Initiated"] } });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "File Initiated or docs checklist sent") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({
                    ...filter, status: 4, $expr: {
                        $and: [
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "File Initiated or docs checklist sent"] }
                        ]
                    }
                })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({
                    ...filter, status: 4, $expr: {
                        $and: [
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "File Initiated or docs checklist sent"] }
                        ]
                    }
                });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "Docs received & Pending docs sent") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({
                    ...filter, status: 4, $expr: {
                        $and: [
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "Docs received & Pending docs sent"] }
                        ]
                    }
                })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({
                    ...filter, status: 4, $expr: {
                        $and: [
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "Docs received & Pending docs sent"] }
                        ]
                    }
                });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "Sop Or letters prepration & Forms prep") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({
                    ...filter, status: 4, $expr: {
                        $and: [
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "Sop Or letters prepration & Forms prep"] }
                        ]
                    }
                })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({
                    ...filter, status: 4, $expr: {
                        $and: [
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "Sop Or letters prepration & Forms prep"] }
                        ]
                    }
                });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "SOP or Letters sent to client") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({
                    ...filter, status: 4, $expr: {
                        $and: [
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopletters", -1] }, "SOP or Letters sent to client"] }
                        ]
                    }
                })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({
                    ...filter, status: 4, $expr: {
                        $and: [
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopletters", -1] }, "SOP or Letters sent to client"] }
                        ]
                    }
                });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "Confirmation received on SOP, letters and docs, Forms confirmation") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({
                    ...filter, status: 4, $expr: {
                        $and: [
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopletters", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.confirmrecieved", -1] }, "Confirmation received on SOP, letters and docs, Forms confirmation"] }
                        ]
                    }
                })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({
                    ...filter, status: 4, $expr: {
                        $and: [
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopletters", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.confirmrecieved", -1] }, "Confirmation received on SOP, letters and docs, Forms confirmation"] }
                        ]
                    }
                });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "File sent for Upload or submission") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({
                    ...filter, status: 4, $expr: {
                        $and: [
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopletters", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.confirmrecieved", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.filesent", -1] }, "File sent for Upload or submission"] }
                        ]
                    }
                })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({
                    ...filter, status: 4, $expr: {
                        $and: [
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopletters", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.confirmrecieved", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.filesent", -1] }, "File sent for Upload or submission"] }
                        ]
                    }
                });

                // console.log('data: ', data);
                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "File submission") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({
                    ...filter, status: 4, $expr: {
                        $and: [
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopletters", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.confirmrecieved", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.filesent", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.filessubmitted", -1] }, "Files Submitted"]}
                        ]
                    }
                })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({
                    ...filter, status: 4, $expr: {
                        $and: [
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopletters", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.confirmrecieved", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.filesent", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.filessubmitted", -1] }, "Files Submitted"]}
                        ]
                    }
                });

                console.log('>>>>>>>>>>>>> data at 3555 : ', data);
                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            // if (status == "File submission") {
            //     const filter = {};

            //     if (searchQuery) {
            //         filter.$or = Object.keys(leadschema.schema.paths)
            //             .filter(field => leadschema.schema.paths[field].instance === 'String')
            //             .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
            //     }

            //     if (startDate && endDate) {
            //         filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
            //     }

            //     const skip = (parseInt(page) - 1) * parseInt(perPage);

            //     const data = await leadschema.find({
            //         ...filter, status: 4, $expr: {
            //             $and: [
            //                 { $eq: [{ $arrayElemAt: ["$Filing_Process.filesent", -1] }, "File sent for Upload or submission"] }
            //             ]
            //         }
            //     })
            //         .sort({ createdAt: -1 })
            //         .skip(skip)
            //         .limit(parseInt(perPage));

            //     const totalRows = await leadschema.countDocuments({
            //         ...filter, status: 4, $expr: {
            //             $and: [
            //                 { $eq: [{ $arrayElemAt: ["$Filing_Process.filesent", -1] }, "File sent for Upload or submission"] }
            //             ]
            //         }
            //     });

            //     console.log('data: ', data);
            //     return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            // }
            if (status == "Visa approved") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({
                    ...filter, status: 4, $expr: {
                        $and: [
                            // { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            // { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                            // { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                            // { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "true"] },
                            // { $eq: [{ $arrayElemAt: ["$Filing_Process.sopletters", -1] }, "true"] },
                            // { $eq: [{ $arrayElemAt: ["$Filing_Process.confirmrecieved", -1] }, "true"] },
                            // { $eq: [{ $arrayElemAt: ["$Filing_Process.filesent", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.visaapproved", -1] }, "Visa approved"] }
                        ]
                    }
                })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({
                    ...filter, status: 4, $expr: {
                        $and: [
                            // { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            // { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                            // { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                            // { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "true"] },
                            // { $eq: [{ $arrayElemAt: ["$Filing_Process.sopletters", -1] }, "true"] },
                            // { $eq: [{ $arrayElemAt: ["$Filing_Process.confirmrecieved", -1] }, "true"] },
                            // { $eq: [{ $arrayElemAt: ["$Filing_Process.filesent", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.visaapproved", -1] }, "Visa approved"] }
                        ]
                    }
                });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "Visa refusal") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({
                    ...filter, $expr: {
                        $and: [
                            // { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            // { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                            // { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                            // { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "true"] },
                            // { $eq: [{ $arrayElemAt: ["$Filing_Process.sopletters", -1] }, "true"] },
                            // { $eq: [{ $arrayElemAt: ["$Filing_Process.confirmrecieved", -1] }, "true"] },
                            // { $eq: [{ $arrayElemAt: ["$Filing_Process.filesent", -1] }, "true"] },
                            // { $eq: [{ $arrayElemAt: ["$Filing_Process.filessubmitted", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.visarefusal", -1] }, "Visa refusal"] }
                        ]
                    }
                })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({
                    ...filter, status: 4, $expr: {
                        $and: [
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopletters", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.confirmrecieved", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.filesent", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.visaapproved", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.visarefusal", -1] }, "Visa refusal"] }
                        ]
                    }
                });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
        } else {
            if (status == "Case Initiated") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({ ...filter, Filing_TeamID: id, $expr: { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "Case Initiated"] } })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({ ...filter, Filing_TeamID: id, $expr: { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "Case Initiated"] } });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "File Initiated or docs checklist sent") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({
                    ...filter, Filing_TeamID: id, $expr: {
                        $and: [
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "File Initiated or docs checklist sent"] }
                        ]
                    }
                })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({
                    ...filter, Filing_TeamID: id, $expr: {
                        $and: [
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "File Initiated or docs checklist sent"] }
                        ]
                    }
                });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "Docs received & Pending docs sent") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({
                    ...filter, Filing_TeamID: id, $expr: {
                        $and: [
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "Docs received & Pending docs sent"] }
                        ]
                    }
                })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({
                    ...filter, Filing_TeamID: id, $expr: {
                        $and: [
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "Docs received & Pending docs sent"] }
                        ]
                    }
                });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "Sop Or letters prepration & Forms prep") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({
                    ...filter, Filing_TeamID: id, $expr: {
                        $and: [
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "Sop Or letters prepration & Forms prep"] }
                        ]
                    }
                })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({
                    ...filter, Filing_TeamID: id, $expr: {
                        $and: [
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "Sop Or letters prepration & Forms prep"] }
                        ]
                    }
                });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "SOP or Letters sent to client") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({
                    ...filter, Filing_TeamID: id, $expr: {
                        $and: [
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopletters", -1] }, "SOP or Letters sent to client"] }
                        ]
                    }
                })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({
                    ...filter, Filing_TeamID: id, $expr: {
                        $and: [
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopletters", -1] }, "SOP or Letters sent to client"] }
                        ]
                    }
                });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "Confirmation received on SOP, letters and docs, Forms confirmation") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({
                    ...filter, Filing_TeamID: id, $expr: {
                        $and: [
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopletters", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.confirmrecieved", -1] }, "Confirmation received on SOP, letters and docs, Forms confirmation"] }
                        ]
                    }
                })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({
                    ...filter, Filing_TeamID: id, $expr: {
                        $and: [
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopletters", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.confirmrecieved", -1] }, "Confirmation received on SOP, letters and docs, Forms confirmation"] }
                        ]
                    }
                });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "File sent for Upload or submission") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({
                    ...filter, Filing_TeamID: id, $expr: {
                        $and: [
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopletters", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.confirmrecieved", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.filesent", -1] }, "File sent for Upload or submission"] }
                        ]
                    }
                })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({
                    ...filter, Filing_TeamID: id, $expr: {
                        $and: [
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopletters", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.confirmrecieved", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.filesent", -1] }, "File sent for Upload or submission"] }
                        ]
                    }
                });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "Visa approved") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({
                    ...filter, Filing_TeamID: id, $expr: {
                        $and: [
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopletters", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.confirmrecieved", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.filesent", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.visaapproved", -1] }, "Visa approved"] }
                        ]
                    }
                })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({
                    ...filter, Filing_TeamID: id, $expr: {
                        $and: [
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopletters", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.confirmrecieved", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.filesent", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.visaapproved", -1] }, "Visa approved"] }
                        ]
                    }
                });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
            if (status == "Visa refusal") {
                const filter = {};

                if (searchQuery) {
                    filter.$or = Object.keys(leadschema.schema.paths)
                        .filter(field => leadschema.schema.paths[field].instance === 'String')
                        .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
                }

                if (startDate && endDate) {
                    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }

                const skip = (parseInt(page) - 1) * parseInt(perPage);

                const data = await leadschema.find({
                    ...filter, Filing_TeamID: id, $expr: {
                        $and: [
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopletters", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.confirmrecieved", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.filesent", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.visaapproved", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.visarefusal", -1] }, "Visa refusal"] }
                        ]
                    }
                })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(perPage));

                const totalRows = await leadschema.countDocuments({
                    ...filter, Filing_TeamID: id, $expr: {
                        $and: [
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.caseInitiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.fileIntiated", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.docsReceived", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopprepration", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.sopletters", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.confirmrecieved", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.filesent", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.visaapproved", -1] }, "true"] },
                            { $eq: [{ $arrayElemAt: ["$Filing_Process.visarefusal", -1] }, "Visa refusal"] }
                        ]
                    }
                });

                return res.status(200).json({ error: false, message: "Successfully find file case", data: data, totalRows });
            }
        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error", data: null });
    }
};

const getRevenueBoardCount = async (req, res) => {
    try {
        const { startDate, endDate, id } = req.query;
        if (id == '') {
            return res.status(200).json({ error: true, message: "Please provide the id", data: null });
        } else {
            const filter = {};

            if (startDate && endDate) {
                filter.Payment_Proof_Date = {
                    $elemMatch: {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate)
                    }
                };
            }

            const data = await leadschema.find({
                ...filter, Lead_AssignID: id,
                $expr: {
                    $eq: [{ $arrayElemAt: ["$status_convert", -1] }, "Convert"]
                }
            });

            const totalLeads = await leadschema.countDocuments({
                ...filter, Lead_AssignID: id,
                $expr: {
                    $eq: [{ $arrayElemAt: ["$status_convert", -1] }, "Convert"]
                }
            });

            return res.status(200).json({ error: false, message: "Successfully find revenue board count", data: data, totalLeads });
        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error", data: null })
    }
};

const getAdminRevenueBoardCount = async (req, res) => {
    try {
        const { startDate, endDate, id } = req.query;
        const filter = {};

        if (startDate && endDate) {
            filter.Payment_Proof_Date = {
                $elemMatch: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            };
        }

        const data = await leadschema.find({
            ...filter,
            $expr: {
                $eq: [{ $arrayElemAt: ["$status_convert", -1] }, "Convert"]
            }
        });

        const totalLeads = await leadschema.countDocuments({
            ...filter,
            $expr: {
                $eq: [{ $arrayElemAt: ["$status_convert", -1] }, "Convert"]
            }
        });

        return res.status(200).json({ error: false, message: "Successfully find revenue board count", data: data, totalLeads });
    } catch (error) {
        console.log("error =>", error);
        return res.status(500).json({ error: true, message: "Internal Server Error", data: null })
    }
};

const getRevenueBoardLead = async (req, res) => {
    try {
        const { page, perPage, searchQuery, startDate, endDate, id } = req.query;
        if (id == '') {
            const filter = {};

            if (searchQuery) {
                filter.$or = Object.keys(leadschema.schema.paths)
                    .filter(field => leadschema.schema.paths[field].instance === 'String')
                    .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
            }

            if (startDate && endDate) {
                filter.Payment_Proof_Date = {
                    $elemMatch: {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate)
                    }
                };
            }

            const skip = (parseInt(page) - 1) * parseInt(perPage);

            const data = await leadschema.find({
                ...filter,
                $expr: {
                    $eq: [{ $arrayElemAt: ["$status_convert", -1] }, "Convert"]
                }
            }).sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(perPage));

            const totalLeads = await leadschema.countDocuments({
                ...filter,
                $expr: {
                    $eq: [{ $arrayElemAt: ["$status_convert", -1] }, "Convert"]
                }
            });

            return res.status(200).json({ error: false, message: "Successfully find revenue board lead", data: data, totalLeads });
        } else {
            const filter = {};

            if (searchQuery) {
                filter.$or = Object.keys(leadschema.schema.paths)
                    .filter(field => leadschema.schema.paths[field].instance === 'String')
                    .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));
            }

            if (startDate && endDate) {
                filter.Payment_Proof_Date = {
                    $elemMatch: {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate)
                    }
                };
            }

            const skip = (parseInt(page) - 1) * parseInt(perPage);

            const data = await leadschema.find({
                ...filter, Lead_AssignID: id,
                $expr: {
                    $eq: [{ $arrayElemAt: ["$status_convert", -1] }, "Convert"]
                }
            }).sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(perPage));

            const totalLeads = await leadschema.countDocuments({
                ...filter, Lead_AssignID: id,
                $expr: {
                    $eq: [{ $arrayElemAt: ["$status_convert", -1] }, "Convert"]
                }
            });

            return res.status(200).json({ error: false, message: "Successfully find revenue board lead", data: data, totalLeads });
        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error", data: null });
    }
};

const getAnalyticsCount = async (req, res) => {
    try {
        const { gender, education, country, Proficiency_Test, Lead_Type, Lead_Source } = req.query;

        if (!gender && !education && !country && !Proficiency_Test && !Lead_Type && !Lead_Source) {
            const count = await leadschema.countDocuments();
            return res.status(200).json({ error: false, message: "Successfully find analytics", data: count });
        } else {
            const query = {};
            if (gender) query.gender = gender;
            if (education) query.education = education;
            if (country) query.country = country;
            if (Proficiency_Test) query.Proficiency_Test = Proficiency_Test;
            if (Lead_Type) query.Lead_Type = Lead_Type;
            if (Lead_Source) query.Lead_Source = Lead_Source;

            const count = await leadschema.countDocuments(query);
            return res.status(200).json({ error: false, message: "Successfully find analytics", data: count });
        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error", data: null });
    }
};

const getAnalyticsLeads = async (req, res) => {
    try {
        const { page, perPage, searchQuery, startDate, endDate, gender, education, country, Proficiency_Test, Lead_Type, Lead_Source } = req.query;
        console.log(req.query);

        if (!gender && !education && !country && !Proficiency_Test && !Lead_Type && !Lead_Source) {
            const filter = {};

            // Apply search query filter
            if (searchQuery) {
                filter.$or = Object.keys(leadschema.schema.paths)
                    .filter(field => leadschema.schema.paths[field].instance === 'String')
                    .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));

                filter.$or.push({ status_convert: { $elemMatch: { $regex: searchQuery, $options: 'i' } } });
            }

            // Apply date range filter
            if (startDate && endDate) {
                filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
            }

            const skip = (parseInt(page) - 1) * parseInt(perPage);

            // Fetch data with pagination and filtering
            const data = await leadschema.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(perPage));

            const totalRows = await leadschema.countDocuments(filter);

            return res.status(200).json({ error: false, message: "Successfully find analytics", data: data, totalRows });
        } else {
            const query = {};
            if (gender) query.gender = gender;
            if (education) query.education = education;
            if (country) query.country = country;
            if (Proficiency_Test) query.Proficiency_Test = Proficiency_Test;
            if (Lead_Type) query.Lead_Type = Lead_Type;
            if (Lead_Source) query.Lead_Source = Lead_Source;

            const filter = {};

            // Apply search query filter
            if (searchQuery) {
                filter.$or = Object.keys(leadschema.schema.paths)
                    .filter(field => leadschema.schema.paths[field].instance === 'String')
                    .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));

                filter.$or.push({ status_convert: { $elemMatch: { $regex: searchQuery, $options: 'i' } } });
            }

            // Apply date range filter
            if (startDate && endDate) {
                filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
            }

            const mergedFilter = {
                ...query,
                ...filter
            };

            const skip = (parseInt(page) - 1) * parseInt(perPage);

            // Fetch data with pagination and filtering
            const data = await leadschema.find(mergedFilter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(perPage));

            const totalRows = await leadschema.countDocuments(mergedFilter);

            return res.status(200).json({ error: false, message: "Successfully find analytics", data: data, totalRows });
        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error", data: null });
    }
};

const getCaseTodayCount = async (req, res) => {
    try {
        const { id, role, current_date } = req.body;
        if (role == 'manager') {
            function formatDate(dateString) {
                const date = new Date(dateString);
                const month = String(date.getMonth() + 1).padStart(2, '0'); // Ensures two digits for month
                const day = String(date.getDate()).padStart(2, '0'); // Ensures two digits for day
                const year = date.getFullYear();
                return `${month}/${day}/${year}`;
            }

            var todayFollowup = await leadschema.find({
                Filing_ManagerID: id,
                $expr: {
                    $eq: [{ $arrayElemAt: ["$status_convert", -1] }, "Convert"]
                }
            });

            const todayFollowupCount = todayFollowup.filter(lead => {
                const formattedDates = lead.Next_Followup_Date_fiiling_team.map(date => formatDate(date));
                const latestFormattedDate = formattedDates.pop();
                return new Date(latestFormattedDate) <= new Date(current_date);
            }).length;

            return res.status(200).json({ error: false, message: "Successfully fetched leads", data: todayFollowupCount });
        }
        if (role == 'team') {
            function formatDate(dateString) {
                const date = new Date(dateString);
                const month = String(date.getMonth() + 1).padStart(2, '0'); // Ensures two digits for month
                const day = String(date.getDate()).padStart(2, '0'); // Ensures two digits for day
                const year = date.getFullYear();
                return `${month}/${day}/${year}`;
            }

            var todayFollowup = await leadschema.find({
                Filing_TeamID: id,
                $expr: {
                    $eq: [{ $arrayElemAt: ["$status_convert", -1] }, "Convert"]
                }
            });

            const todayFollowupCount = todayFollowup.filter(lead => {
                const formattedDates = lead.Next_Followup_Date_fiiling_team.map(date => formatDate(date));
                const latestFormattedDate = formattedDates.pop();
                return new Date(latestFormattedDate) <= new Date(current_date);
            }).length;

            return res.status(200).json({ error: false, message: "Successfully fetched leads", data: todayFollowupCount });
        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error", data: null });
    }
};

const getCaseTodayLead = async (req, res) => {
    try {
        const { id, current_date, role } = req.body;
        if (role == 'manager') {
            function formatDate(dateString) {
                const date = new Date(dateString);
                const month = String(date.getMonth() + 1).padStart(2, '0'); // Ensures two digits for month
                const day = String(date.getDate()).padStart(2, '0'); // Ensures two digits for day
                const year = date.getFullYear();
                return `${month}/${day}/${year}`;
            }

            var todayFollowup = await leadschema.find({
                Filing_ManagerID: id,
                $expr: {
                    $eq: [{ $arrayElemAt: ["$status_convert", -1] }, "Convert"]
                }
            });

            const todayFollowupLead = todayFollowup.filter(lead => {
                const formattedDates = lead.Next_Followup_Date_fiiling_team.map(date => formatDate(date));
                const latestFormattedDate = formattedDates.pop();
                return new Date(latestFormattedDate) <= new Date(current_date);
            });

            return res.status(200).json({ error: false, message: "Successfully fetched leads", data: todayFollowupLead });
        }
        if (role == 'team') {
            function formatDate(dateString) {
                const date = new Date(dateString);
                const month = String(date.getMonth() + 1).padStart(2, '0'); // Ensures two digits for month
                const day = String(date.getDate()).padStart(2, '0'); // Ensures two digits for day
                const year = date.getFullYear();
                return `${month}/${day}/${year}`;
            }

            var todayFollowup = await leadschema.find({
                Filing_TeamID: id,
                $expr: {
                    $eq: [{ $arrayElemAt: ["$status_convert", -1] }, "Convert"]
                }
            });

            const todayFollowupLead = todayFollowup.filter(lead => {
                const formattedDates = lead.Next_Followup_Date_fiiling_team.map(date => formatDate(date));
                const latestFormattedDate = formattedDates.pop();
                return new Date(latestFormattedDate) <= new Date(current_date);
            });

            return res.status(200).json({ error: false, message: "Successfully fetched leads", data: todayFollowupLead });
        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error", data: null });
    }
};


const UpdateStatus = async (req, res) => {
    try {
        const { id } = req.body;
        console.log('Received ID:', id);

        if (!id) {
            return res.status(400).json({ error: true, message: "Lead ID is required" });
        }

        let lead = await leadschema.findById(id);
        console.log('Lead found:', lead);

        if (!lead) {
            return res.status(404).json({ error: true, message: 'Lead not found' });
        }

        // if (lead.status !== '4') {
        //     return res.status(400).json({ error: true, message: 'Lead status is not 4 (Refusal), cannot update' });
        // }

        lead.status = '4';
        console.log('Updating status to:', lead.status);

        await leadschema.findByIdAndUpdate(
            id,  // Replace with your document ID
            {
                $set: {
                    Filing_Process: [],  // Empties the Filing_Process array
                   // status: newStatus    // Updates the status field
                }
            }
        );
        console.log('Updated Lead:', lead);
        return res.status(200).json({ error: false, message: 'Status updated successfully', lead });

    } catch (error) {
        console.error('Error while updating status:', error);
        return res.status(500).json({ error: true, message: 'Internal Server Error', data: null });
    }
};

const LeadsTransfer = async (req, res) => {
    try {
        const { Old_teamID, Filing_TeamID, Filing_TeamName } = req.body;

        const filterConditions = {
            $expr: { $ne: [{ $arrayElemAt: ["$status_convert", -1] }, "Close"]},
        };

        const query = {
            $or: [
                { Filing_ManagerID: new mongoose.Types.ObjectId(Old_teamID) },
                { Filing_TeamID: new mongoose.Types.ObjectId(Old_teamID) },
                { Lead_AssignID: new mongoose.Types.ObjectId(Old_teamID) },
                { pre_sales_id: new mongoose.Types.ObjectId(Old_teamID) },
            ],
            ...filterConditions
        };

        const updatedCampaignDetails = await leadschema.updateMany(
            query, // Filter: find all records with this campaign_id
            {
                $set: {
                    Filing_ManagerID: new mongoose.Types.ObjectId(Filing_TeamID),
                    Filing_TeamName: Filing_TeamName,
                    Filing_TeamID: new mongoose.Types.ObjectId(Filing_TeamID),
                    Lead_AssignID: new mongoose.Types.ObjectId(Filing_TeamID),
                }
            },
            { new: true, runValidators: true }
        );

        return res.status(200).json({ error: false, message: 'Status updated successfully', updatedCampaignDetails });
    } catch (error) {
        console.error('Error while updating status:', error);
        return res.status(500).json({ error: true, message: 'Internal Server Error', data: null });
    }
}


module.exports = { otherNoeDataGet, otherNotesLeadUpdate, GetAllFillinfTeam, GetAllFillinfManager, AddLead, GetAllLead, allLeadCount, preSalesFreshCount, listAllLeads, UpdateLead, leadUpdateById, DeleteLead, GetByIdLead, GetAllSales, UpdateLeadAssign, fillingManagerLeadAssign, GetAllLeadSAleRole, getFillingManagerLead, getFillingTeamLead, UpdateLeadAssignprocess, updatefilingteam, updateTermCondition, leadUnclose, deletePaymentById, leaderBoard, getLeadstatusCount, getLeadStatus, getLeadTodayCount, getLeadFillingManagerCount, getLeadFillingManager, getLeadFillingCaseCount, getLeadFillingCase, getRevenueBoardCount, getAdminRevenueBoardCount, getRevenueBoardLead, getAnalyticsCount, getAnalyticsLeads, getCaseTodayCount, getCaseTodayLead, UpdateStatus, LeadsTransfer };