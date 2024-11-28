const leadSourceSchema = require('../model/leadsource.modal');

const addLeadSource = async (req, res) => {
    try {
        if (req.body.lead_source == '') {
            return res.status(200).json({ error: true, message: "Please Enter The Lead Source", data: null });
        } else {
            const findLead = await leadSourceSchema.findOne({ lead_source: req.body.lead_source });
            if (findLead) {
                return res.status(200).json({ error: true, message: "This lead source is already exists", data: null });
            }
            const newLeadType = new leadSourceSchema(req.body);
            const saveLeadType = await newLeadType.save();
            if (saveLeadType == null) {
                return res.status(200).json({ error: true, message: "Not add", data: null });
            } else {
                return res.status(200).json({ error: false, message: "Sucessfully add", data: saveLeadType });
            }
        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error", data: null });
    }
};

const listLeadSource = async (req, res) => {
    try {
        let page = req.query.page
        console.log('page: ', page);
        let perPage = req.query.per
        const skip = (parseInt(page) - 1) * parseInt(perPage);
        const findLeads = await leadSourceSchema.find()
        // .sort({ createdAt: -1 }) 
        // .skip(skip)
        // .limit(parseInt(perPage));;
        return res.status(200).json({ error: false, message: "Leads Successfully Found", data: findLeads });
        
            
        
        if (findLeads == null) {
            return res.status(200).json({ error: true, message: "Leads Not Found", data: null });
        } else {
            return res.status(200).json({ error: false, message: "Leads Successfully Found", data: findLeads });
        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error", data: null });
    }
}

const listLeadSourceById = async (req, res) => {
    try {
        const id = req.body.id;
        if (id == '') {
            return res.status(200).json({ error: true, message: 'Please Provide The Id', data: null });
        } else {
            const findById = await leadSourceSchema.findById(id);
            if (findById == null) {
                return res.status(200).json({ error: true, message: "Found Lead By Id", data: null });
            } else {
                return res.status(200).json({ error: false, message: "Successfully Lead By Id", data: findById });
            }
        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error", data: null });
    }
}

const updateLeadSourceById = async (req, res) => {
    try {
        const user = req.body;
        if (user.lead_source == '') {
            return res.status(200).json({ error: true, message: "Please enter the lead source", data: null });
        } else {
            const findById = await leadSourceSchema.find({ lead_source: user.lead_source });
            if (findById.length > 1) {
                return res.status(200).json({ error: true, message: "This lead source is already exists", data: null });
            }
            if (findById.length > 0) {
                if (findById[0]._id == user.id) {
                    const updateLeadType = await leadSourceSchema.findByIdAndUpdate(
                        user.id,
                        { lead_source: user.lead_source },
                        { new: true, runValidators: true }
                    );
                    if (updateLeadType == null) {
                        return res.status(200).json({ error: true, message: "Not Update", data: null });
                    } else {
                        return res.status(200).json({ error: false, message: "Successfully Update", data: updateLeadType });
                    }
                } else {
                    return res.status(200).json({ error: true, message: "This lead source is already exists", data: null });
                }
            } else {
                const updateLeadType = await leadSourceSchema.findByIdAndUpdate(
                    user.id,
                    { lead_source: user.lead_source },
                    { new: true, runValidators: true }
                );
                if (updateLeadType == null) {
                    return res.status(200).json({ error: true, message: "Not Update", data: null });
                } else {
                    return res.status(200).json({ error: false, message: "Successfully Update", data: updateLeadType });
                }
            }
        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error", data: null });
    }
}

const deleteLeadSourceById = async (req, res) => {
    try {
        const id = req.body.id;
        if (id == '') {
            return res.status(200).json({ error: true, message: "Please Provide The Id", data: null });
        } else {
            const DeleteById = await leadSourceSchema.findByIdAndDelete(id);
            if (DeleteById == null) {
                return res.status(200).json({ error: true, message: "Lead Not Delete", data: null });
            } else {
                return res.status(200).json({ error: false, message: "Successfully Delete", data: DeleteById });
            }
        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error", data: null });
    }
}

module.exports = { addLeadSource, listLeadSource, listLeadSourceById, updateLeadSourceById, deleteLeadSourceById };