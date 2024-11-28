const notificationSchema = require('../model/notification.modal');

const findNotification = async (req, res) => {
    try {
        const userId = req.body.user_id;
        if (!userId) {
            return res.status(200).json({ error: true, message: "Please provide user id", data: null });
        } else {
            const notification = await notificationSchema.find({ user_id: userId, status: 'active' }).sort({ createdAt: -1 });
            if (!notification) {
                return res.status(200).json({ error: true, message: "Notification not found", data: null });
            } else {
                return res.status(200).json({ error: false, message: "Notification successfully found", data: notification });
            }
        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Failed to find Notification", data: null });
    }
};

const notificationStatusUpdate = async (req, res) => {
    try {
        const userId = req.body._id;
        if (!userId) {
            return res.status(200).json({ error: true, message: "Please provide id", data: null });
        } else {
            const notificationUpdate = await notificationSchema.findByIdAndUpdate({ _id: userId }, req.body, { new: true, runValidators: true });
            if (!notificationUpdate) {
                return res.status(200).json({ error: true, message: "Not update", data: null });
            } else {
                return res.status(200).json({ error: false, message: "Successfully update", data: notificationUpdate });
            }
        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Failed to Notification Status Update", data: null });
    }
};

const findPreSalesNotification = async (req, res) => {
    try {
        const notification = await notificationSchema.find({ user_id: null, status: 'active' }).sort({ createdAt: -1 });
        if (!notification) {
            return res.status(200).json({ error: true, message: "Notification not found", data: null });
        } else {
            return res.status(200).json({ error: false, message: "Notification successfully found", data: notification });
        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Failed to find presales Notification", data: null });
    }
};

module.exports = { findNotification, findPreSalesNotification, notificationStatusUpdate };