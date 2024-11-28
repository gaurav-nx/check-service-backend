const campaignSchema = require('../model/campaign.modal');
const leadschema = require('../model/lead.modal');
const countrySchema = require('../model/country.modal');
const stateSchema = require('../model/state.modal');
const notificationSchema = require('../model/notification.modal');
const nodemailer = require('nodemailer');
const roleschema = require('../model/addrole.modal');
const { sendCampaginMail } = require('../middleware/mailSend');

const add = async (req, res) => {
    try {
        if (req.body.influencer == '') {
            console.log('-----------------------------------------');
            
            const newRole = new campaignSchema({
                user_id: req.body.user_id,
                campagin_name: req.body.campagin_name,
                start_date: req.body.start_date,
                end_date: req.body.end_date,
                notes: req.body.notes,
                url: req.body.url
            });
            newRole.url = newRole.url + `/?id=${newRole._id}`
            const savedRole = await newRole.save();
            if (savedRole == null) {
                return res.status(200).json({ error: true, message: "Not add", data: null });
            } else {
                return res.status(200).json({ error: false, message: "Sucessfully add", data: savedRole });
            }
        } else {
            console.log("====================================");
            
            const findInfluence = await roleschema.findOne({ _id: req.body.influencer });
            if (!findInfluence) {
                return res.status(404).json({ error: true, message: "Influencer not found", data: null });
            }
            const newRole = new campaignSchema({
                user_id: req.body.user_id,
                campagin_name: req.body.campagin_name,
                start_date: req.body.start_date,
                end_date: req.body.end_date,
                influencer_id: findInfluence._id,
                influencer_name: `${findInfluence.first_name} ${findInfluence.last_name}`,
                notes: req.body.notes,
                url: req.body.url
            });
            newRole.url = newRole.url + `/?id=${newRole._id}`
            const savedRole = await newRole.save();
            sendCampaginMail(findInfluence.first_name, findInfluence.last_name, newRole.url, findInfluence.email);
            if (savedRole == null) {
                return res.status(200).json({ error: true, message: "Not add", data: null });
            } else {
                return res.status(200).json({ error: false, message: "Sucessfully add", data: savedRole });
            }
        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "failed to add campagin", data: error });
    }
};

const listCampaignsByUserId = async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) {
            return res.status(400).json({ error: true, message: 'User ID is required', data: null });
        } else {
            const campaigns = await campaignSchema.find().sort({ createdAt: -1 });
            if (campaigns == null) {
                return res.status(200).json({ error: true, message: 'Campagin list not found', data: null });
            } else {
                return res.status(200).json({ error: false, message: 'Successfully compagin list found', data: campaigns });
            }
        }
    } catch (error) {
        res.status(500).json({ error: true, message: 'failed to list campagin', data: error });
    }
};

const listCampaignsById = async (req, res) => {
    try {
        const id = req.body.id;
        if (!id) {
            return res.status(400).json({ error: true, message: 'ID is required', data: null });
        } else {
            const campaigns = await campaignSchema.findById(id);
            if (campaigns == null) {
                return res.status(200).json({ error: true, message: 'Campagin list by id not found', data: null });
            } else {
                return res.status(200).json({ error: false, message: 'Successfully compagin list by id found', data: campaigns });
            }
        }
    } catch (error) {
        res.status(500).json({ error: true, message: 'failed to list campagin by id', data: error });
    }
};

const deleteCampaignById = async (req, res) => {
    try {
        const campaignId = req.body.id;
        const deletedCampaign = await campaignSchema.findByIdAndDelete(campaignId);
        if (deletedCampaign == null) {
            return res.status(200).json({ error: true, message: "Not delete", data: null });
        } else {
            return res.status(200).json({ error: false, message: "Successfully delete", data: deletedCampaign });
        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Failed to delete", data: null });
    }
};

const updateCampaignsById = async (req, res) => {
    try {
        const campaignId = req.body._id;
        const updatedCampaignDetails = await campaignSchema.findByIdAndUpdate(
            campaignId,
            req.body,
            { new: true, runValidators: true }
        );
        if (updatedCampaignDetails == null) {
            return res.status(200).json({ error: true, message: "Not Campaign Update", data: null });
        } else {
            return res.status(200).json({ error: false, message: "Successfully Campaign Update", data: updatedCampaignDetails });
        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Failed to update", data: null });
    }
};

const campaignLeadAdd = async (req, res) => {
    try {
        // const existingLead = await leadschema.findOne({ contact_number: req.body.contact_number });
        // if (existingLead) {
        //     return res.status(200).json({ error: true, message: "This Contact No. already exists", data: null });
        // }
        const findCampagin = await campaignSchema.findOne({ _id: req.body.campagin_id })
        const findCountry = await countrySchema.findOne({ short_name: req.body.country });
        const findState = await stateSchema.findOne({ $and: [{ short_name: req.body.state }, { country_code: req.body.country }] });
        req.body.Lead_Source = findCampagin.campagin_name;
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
    // console.log("Message sent: %s", info.messageId);
    // console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
};

const campaignLeadList = async (req, res) => {
    try {
        const { page, perPage, searchQuery, campagin_id } = req.body;
        if (campagin_id == '') {
            return res.status(200).json({ error: true, message: "Please provide the campagin data", data: null });
        } else {
            const filter = {};

            if (searchQuery) {
                filter.$or = Object.keys(leadschema.schema.paths)
                    .filter(field => leadschema.schema.paths[field].instance === 'String')
                    .map(field => ({ [field]: { $regex: searchQuery, $options: 'i' } }));

                filter.$or.push({ status_convert: { $elemMatch: { $regex: searchQuery, $options: 'i' } } });
            }

            const skip = (parseInt(page) - 1) * parseInt(perPage);

            const data = await leadschema.find({ ...filter, campagin_id: campagin_id })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(perPage));

            const totalRows = await leadschema.countDocuments({ ...filter, campagin_id: campagin_id });

            return res.status(200).json({ error: false, message: "Successfully campagin all leads", data: data, totalRows });

        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error", data: null })
    }
};

const campaginUpdatePayment = async (req, res) => {
    const { _id, status_payment } = req.query;
    if (_id === '' || status_payment === '') {
        const missingFields = [];
        if (_id === '') missingFields.push('Id');
        if (status_payment === '') missingFields.push('Status Payment');
        const error = `The following fields are required: ${missingFields.join(', ')}`;
        return res.status(200).json({ error: true, message: `${error}`, data: null })
    } else {
        const updatedCampaignDetails = await leadschema.findByIdAndUpdate(
            { _id },
            { status_payment },
            { new: true, runValidators: true }
        );
        if (!updatedCampaignDetails) {
            return res.status(200).json({ error: true, message: "not update", data: null })
        } else {
            return res.status(200).json({ error: false, message: "successfully update", data: updatedCampaignDetails })
        }
    }
};

const leadTransfer = async (req, res) => {
  try {
    const { old_campaign_id, new_campaign_id } = req.body;
    const updatedCampaignDetails = await leadschema.updateMany(
      { campagin_id: old_campaign_id }, // Filter: find all records with this campaign_id
      { campagin_id: new_campaign_id }, // Update: set campaign_id to the new ID
      { new: true, runValidators: true }
    );

    if (updatedCampaignDetails == null) {
      return res
        .status(200)
        .json({ error: true, message: "Not Campaign Update", data: null });
    } else {
      return res
        .status(200)
        .json({
          error: false,
          message: "Successfully Campaign Update",
          data: updatedCampaignDetails,
        });
    }
  } catch (error) {
    console.log('error: ', error);
    return res
      .status(500)
      .json({ error: true, message: "Failed to update", data: null });
  }
};

module.exports = { add, listCampaignsByUserId, listCampaignsById, updateCampaignsById, deleteCampaignById, campaignLeadAdd, campaignLeadList, campaginUpdatePayment, leadTransfer };