const addroleschema = require('../model/addrole.modal')
const Adminschema = require('../model/admin.modal')
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const leadschema = require('../model/lead.modal');

const AddRole = async (req, res) => {
    try {
        if (req.body.job_role === 'Admin') {
            req.body.job_role = ''; // Modify job_role if it is 'Admin'
        }
        const existingRole = await addroleschema.findOne({ email: req.body.email, user_id: req.body.user_id });
        if (existingRole) {
            return res.status(200).json({ error: true, message: "This email is already exists", data: null });
        }
        const newRole = new addroleschema(req.body);
        const savedRole = await newRole.save();
        if (savedRole == null) {
            return res.status(200).json({ error: true, message: "Not add", data: null });
        } else {
            return res.status(200).json({ error: false, message: "Sucessfully add", data: savedRole });
        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Failed to add employee", data: null });
    }

};

const GetAllRole = async (req, res) => {
    try {
        const userId = req.body.user_id;
        
        const allRoles = await addroleschema.find({ last_name: { $ne: '' }, job_role: { $ne: 'Influencer' } }).sort({ createdAt: -1 });
        if (allRoles == null) {
            return res.status(200).json({ error: true, message: "Data not found", data: null });
        } else {
            return res.status(200).json({ 
                error: false, 
                message: "Successfully data found",
                 data: allRoles });
        }
    } catch (err) {
        return res.status(500).json({ error: true, message: "Failed to data found", data: null });
    }
};

const UpdateRole = async (req, res) => {
    try {
        const companyId = req.body.id;
        const updatedCompanyDetails = await addroleschema.findByIdAndUpdate(
            companyId,
            req.body,
            { new: true, runValidators: true }
        );
        if (updatedCompanyDetails == null) {
            return res.status(200).json({ error: true, message: "Not update", data: null });
        } else {
            return res.status(200).json({ error: false, message: "Successfully Update", data: updatedCompanyDetails });
        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Failed to data update", data: null });
    }
};

const DeleteRole = async (req, res) => {
    try {
        const companyId = req.body.id;
        const deletedCompanyDetails = await addroleschema.findByIdAndDelete(companyId);
        if (deletedCompanyDetails == null) {
            return res.status(200).json({ error: true, message: "Not delete", data: null });
        } else {
            return res.status(200).json({ error: false, message: "Successfully delete", data: deletedCompanyDetails });
        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Failed to delete", data: null });
    }
};

const GetByIdRole = async (req, res) => {
    try {
        const companyId = req.body.id;
        const companyDetails = await addroleschema.findById(companyId);
        if (companyDetails == null) {
            return res.status(200).json({ error: true, message: "Not found by id", data: null });
        } else {
            return res.status(200).json({ error: false, message: "Successfully found by id", data: companyDetails });
        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Failed to find by id", data: null });
    }
};

const addadmin = async (req, res) => {
    try {
        const existingRole = await Adminschema.findOne({ email: req.body.email });

        if (existingRole) {
            return res.status(200).json({ error: true, message: "this email already exists", data: null });
        }
        const newRole = new Adminschema(req.body);
        const savedRole = await newRole.save();
        if (savedRole == null) {
            return res.status(200).json({ error: true, message: "Not insert", data: null });
        } else {
            return res.status(200).json({ error: false, message: "Sucessfully insert", data: savedRole });
        }
    } catch (error) {
        return res.status(500).json({ massage: 'Internal Server Error', error: error });
    }
};

const adminLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await Adminschema.findOne({ email });
        // console.log(user);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (password !== user.password) {
            return res.status(401).json({ message: 'Invalid password' });
        }
        const Admintoken = jwt.sign({ userId: user._id }, 'secretKey', { expiresIn: '1h' });

        res.status(200).json({ Admintoken });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const findByEmail = async (req, res) => {
    try {
        const { email } = req.body;
        if (email == '') {
            return res.status(200).json({ error: true, message: "Please enter the email", data: null });
        } else {
            const findUser = await addroleschema.findOne({ email });
            if (findUser == null) {
                return res.status(200).json({ error: true, message: "The provided email is incorrect", data: null });
            } else {
                const otp = Math.floor(100000 + Math.random() * 900000).toString();
                const updateOtp = await addroleschema.findOneAndUpdate(
                    { email: findUser.email }, // Find user by email
                    { otp: otp }, // Update OTP
                    { new: true, runValidators: true } // Options
                );
                if (!updateOtp) {
                    return res.status(200).json({ error: true, message: "OTP not send successfully", data: null });
                } else {
                    await sendOtpInEmail(otp, email);
                    return res.status(200).json({ error: false, message: "OTP send successfully", data: updateOtp });
                }
            }
        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error", data: null });
    }
};

const sendOtpInEmail = async (otp, email) => {
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
        subject: "Your OTP for Check Check Services", // Subject line
        text: `Dear user, your OTP for Check Check Services is ${otp}`,
    });
    // console.log("Message sent: %s", info.messageId);
    // console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
};

const otpVerify = async (req, res) => {
    try {
        const { id, otp } = req.body;
        if (id == '' || otp == '') {
            const missingFields = [];
            if (id === '') missingFields.push('Id');
            if (otp === '') missingFields.push('Otp');
            const error = `The following fields are required: ${missingFields.join(', ')}`;
            return res.status(200).json({ error: true, message: `${error}`, data: null })
        } else {
            const companyDetails = await addroleschema.findOne({ _id: id, otp: otp });
            if (companyDetails == null) {
                return res.status(200).json({ error: true, message: "The provided otp is incorrect", data: null });
            } else {
                return res.status(200).json({ error: false, message: "Otp Successfully Match", data: companyDetails });
            }
        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error", data: null });
    }
};

const updatePassword = async (req, res) => {
    try {
        const { id, password, confirm_passord } = req.body;
        if (id == '' || password == '' || confirm_passord == '') {
            const missingFields = [];
            if (id === '') missingFields.push('Id');
            if (password === '') missingFields.push('Password');
            if (confirm_passord === '') missingFields.push('Confirm Password');
            const error = `The following fields are required: ${missingFields.join(', ')}`;
            return res.status(200).json({ error: true, message: `${error}`, data: null })
        }
        if (password == confirm_passord) {
            const updatePassword = await addroleschema.findOneAndUpdate(
                { _id: id }, // Find user by email
                { password: password }, // Update OTP
                { new: true, runValidators: true } // Options
            );
            if (updatePassword == null) {
                return res.status(200).json({ error: true, message: "The provided password not update", data: null });
            } else {
                return res.status(200).json({ error: false, message: "Password Successfully Update", data: updatePassword });
            }
        } else {
            return res.status(200).json({ error: true, message: "The provided password and confirm password not match", data: null });
        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Interval Server Error", data: null });
    }
};

const specificLeads = async (req, res) => {
    try {
        const { page, perPage, searchQuery, startDate, endDate, _id } = req.body;
        if (_id == '') {
            return res.status(200).json({ error: true, message: "Provide the id", data: null });
        } else {
            const findUser = await addroleschema.findById(_id);
            if (findUser == null) {
                return res.status(200).json({ error: true, message: "User not found", data: null });
            } else {
                if (findUser.job_role == 'Pre-Sales') {
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

                    const findLeads = await leadschema.find({ ...filter, pre_sales_id: _id }).sort({ createdAt: -1 }).skip(skip)
                        .limit(parseInt(perPage));

                    const totalRows = await leadschema.countDocuments({ ...filter, pre_sales_id: _id });

                    if (findLeads == null) {
                        return res.status(200).json({ error: true, message: "Leads Not Found", data: null });
                    } else {
                        return res.status(200).json({ error: false, message: "Successfully Leads", data: findLeads, totalRows });
                    }
                }
                if (findUser.job_role == 'Sales') {
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

                    const findLeads = await leadschema.find({ ...filter, Lead_AssignID: _id }).sort({ createdAt: -1 }).skip(skip)
                        .limit(parseInt(perPage));

                    const totalRows = await leadschema.countDocuments({ ...filter, Lead_AssignID: _id });

                    if (findLeads == null) {
                        return res.status(200).json({ error: true, message: "Leads Not Found", data: null });
                    } else {
                        return res.status(200).json({ error: false, message: "Successfully Leads", data: findLeads, totalRows });
                    }
                }
                if (findUser.job_role == 'Filing Manager') {
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

                    const findLeads = await leadschema.find({ ...filter, Filing_ManagerID: _id }).sort({ createdAt: -1 }).skip(skip)
                        .limit(parseInt(perPage));

                    const totalRows = await leadschema.countDocuments({ ...filter, Filing_ManagerID: _id });

                    if (findLeads == null) {
                        return res.status(200).json({ error: true, message: "Leads Not Found", data: null });
                    } else {
                        return res.status(200).json({ error: false, message: "Successfully Leads", data: findLeads, totalRows });
                    }
                }
                if (findUser.job_role == 'Filing Team') {
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

                    const findLeads = await leadschema.find({ ...filter, Filing_TeamID: _id }).sort({ createdAt: -1 }).skip(skip)
                        .limit(parseInt(perPage));

                    const totalRows = await leadschema.countDocuments({ ...filter, Filing_TeamID: _id });

                    if (findLeads == null) {
                        return res.status(200).json({ error: true, message: "Leads Not Found", data: null });
                    } else {
                        return res.status(200).json({ error: false, message: "Successfully Leads", data: findLeads, totalRows });
                    }
                }
            }
        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error", data: null });
    }
};

const updateStatus = async (req, res) => {
    try {
        const id = req.body._id;
        const updatedStatus = await addroleschema.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true }
        );
        if (updatedStatus == null) {
            return res.status(200).json({ error: true, message: "Not update", data: null });
        } else {
            return res.status(200).json({ error: false, message: "Successfully update", data: updatedStatus });
        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error", data: null });
    }
}

module.exports = { AddRole, GetAllRole, UpdateRole, DeleteRole, GetByIdRole, adminLogin, addadmin, findByEmail, otpVerify, updatePassword, specificLeads, updateStatus };




