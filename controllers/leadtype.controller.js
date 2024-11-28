const leadTypeSchema = require('../model/leadtype.modal');

const addLeadType = async (req, res) => {
    try {
        if (req.body.lead_type == '') {
            return res.status(200).json({ error: true, message: "Please Enter The Lead Type", data: null });
        } else {
            const findLead = await leadTypeSchema.findOne({ lead_type: req.body.lead_type });
            if (findLead) {
                return res.status(200).json({ error: true, message: "This lead type is already exists", data: null });
            }
            const newLeadType = new leadTypeSchema(req.body);
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

const listLeadType = async (req, res) => {
    try {
        const findLeads = await leadTypeSchema.find().sort({ createdAt: -1 });
        if (findLeads == null) {
            return res.status(200).json({ error: true, message: "Leads Not Found", data: null });
        } else {
            return res.status(200).json({ error: false, message: "Leads Successfully Found", data: findLeads });
        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error", data: null });
    }
}

const listLeadTypeById = async (req, res) => {
    try {
        const id = req.body.id;
        if (id == '') {
            return res.status(200).json({ error: true, message: 'Please Provide The Id', data: null });
        } else {
            const findById = await leadTypeSchema.findById(id);
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

const updateLeadTypeById = async (req, res) => {
    try {
        const user = req.body;
        if (user.lead_type == '') {
            return res.status(200).json({ error: true, message: "Please enter the lead type", data: null });
        } else {
            const findById = await leadTypeSchema.find({ lead_type: user.lead_type });
            if (findById.length > 1) {
                return res.status(200).json({ error: true, message: "This lead type is already exists", data: null });
            }
            if (findById.length > 0) {
                if (findById[0]._id == user.id) {
                    const updateLeadType = await leadTypeSchema.findByIdAndUpdate(
                        user.id,
                        { lead_type: user.lead_type },
                        { new: true, runValidators: true }
                    );
                    if (updateLeadType == null) {
                        return res.status(200).json({ error: true, message: "Not Update", data: null });
                    } else {
                        return res.status(200).json({ error: false, message: "Successfully Update", data: updateLeadType });
                    }
                } else {
                    return res.status(200).json({ error: true, message: "This lead type is already exists", data: null });
                }
            } else {
                const updateLeadType = await leadTypeSchema.findByIdAndUpdate(
                    user.id,
                    { lead_type: user.lead_type },
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

const deleteLeadTypeById = async (req, res) => {
    try {
        const id = req.body.id;
        if (id == '') {
            return res.status(200).json({ error: true, message: "Please Provide The Id", data: null });
        } else {
            const DeleteById = await leadTypeSchema.findByIdAndDelete(id);
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

module.exports = { addLeadType, listLeadType, listLeadTypeById, updateLeadTypeById, deleteLeadTypeById };