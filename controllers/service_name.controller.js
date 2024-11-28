const serviceNameSchema = require('../model/service_name.modal');

const addServiceName = async (req, res) => {
    try {
        console.log(req.body);

        if (req.body.service_name == '' || req.body.flat_discount === '') {
            const missingFields = [];
            if (req.body.service_name === '') missingFields.push('Service Name');
            if (req.body.flat_discount === '') missingFields.push('Flat Discount');
            const error = `The following fields are required: ${missingFields.join(', ')}`;
            return res.status(200).json({ error: true, message: `${error}`, data: null });
        } else {
            const findLead = await serviceNameSchema.findOne({ service_name: req.body.service_name });
            if (findLead) {
                return res.status(200).json({ error: true, message: "This service name is already exists", data: null });
            }
            const newLeadType = new serviceNameSchema(req.body);
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

const listServiceName = async (req, res) => {
    try {
        const findLeads = await serviceNameSchema.find().sort({ createdAt: -1 });
        if (findLeads == null) {
            return res.status(200).json({ error: true, message: "Service Name Not Found", data: null });
        } else {
            return res.status(200).json({ error: false, message: "Service Name Successfully Found", data: findLeads });
        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error", data: null });
    }
}

const listServiceNameById = async (req, res) => {
    try {
        const id = req.body.id;
        if (id == '') {
            return res.status(200).json({ error: true, message: 'Please Provide The Id', data: null });
        } else {
            const findById = await serviceNameSchema.findById(id);
            if (findById == null) {
                return res.status(200).json({ error: true, message: "Found Service Name By Id", data: null });
            } else {
                return res.status(200).json({ error: false, message: "Successfully Service Name By Id", data: findById });
            }
        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error", data: null });
    }
}

const updateServiceNameById = async (req, res) => {
    try {
        const user = req.body;
        if (user.service_name == '' || user.flat_discount === '') {
            const missingFields = [];
            if (user.service_name === '') missingFields.push('Service Name');
            if (user.flat_discount === '') missingFields.push('Flat Discount');
            const error = `The following fields are required: ${missingFields.join(', ')}`;
            return res.status(200).json({ error: true, message: `${error}`, data: null });
        } else {
            const findById = await serviceNameSchema.find({ service_name: user.service_name });
            if (findById.length > 1) {
                return res.status(200).json({ error: true, message: "This service name is already exists", data: null });
            }
            if (findById.length > 0) {
                if (findById[0]._id == user.id) {
                    const updateLeadType = await serviceNameSchema.findByIdAndUpdate(
                        user.id,
                        { service_name: user.service_name, flat_discount: user.flat_discount },
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
                const updateLeadType = await serviceNameSchema.findByIdAndUpdate(
                    user.id,
                    { service_name: user.service_name, flat_discount: user.flat_discount },
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

const deleteServiceNameById = async (req, res) => {
    try {
        const id = req.body.id;
        if (id == '') {
            return res.status(200).json({ error: true, message: "Please Provide The Id", data: null });
        } else {
            const DeleteById = await serviceNameSchema.findByIdAndDelete(id);
            if (DeleteById == null) {
                return res.status(200).json({ error: true, message: "Service Name Not Delete", data: null });
            } else {
                return res.status(200).json({ error: false, message: "Successfully Delete", data: DeleteById });
            }
        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error", data: null });
    }
}

module.exports = { addServiceName, listServiceName, listServiceNameById, updateServiceNameById, deleteServiceNameById };