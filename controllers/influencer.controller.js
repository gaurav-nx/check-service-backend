const roleschema = require('../model/addrole.modal');
const leadschema = require('../model/lead.modal');
const campaignSchema = require('../model/campaign.modal');
const serviceNameSchema = require('../model/service_name.modal');
const addroleschema = require("../model/addrole.modal");
const { sendInfluencerMail } = require('../middleware/mailSend');

const influencerList = async (req, res) => {
    try {
        const findInfluencer = await roleschema.find({ job_role: 'Influencer' });
        if (!findInfluencer) {
            return res.status(401).json({ error: true, message: "Infuencer Not Found", data: null });
        } else {
            return res.status(200).json({ error: false, message: "Successfully found Influencer", data: findInfluencer });
        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error", data: null });
    }
};

const influencerAllLeads = async (req, res) => {
    const { page, perPage, searchQuery, startDate, endDate, userId } = req.query;
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

    const findCampagin = await campaignSchema.find({ influencer_id: userId });

    if (findCampagin.length === 1) {
        const campaignId = findCampagin[0]._id;

        const data = await leadschema.find({ ...filter, campagin_id: campaignId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(perPage));

        const getServices = data.flatMap(campaign => {
            const servicesArray = Array.isArray(campaign.Services) ? campaign.Services : [campaign.Services];
            return servicesArray.map(service => ({ service_name: service }));
        });

        const walletCount = (await Promise.all(
            getServices.map(service => {
                return serviceNameSchema.find({ service_name: service.service_name });
            })
        )).flat();

        const updatedData = data.map(item => {
            const service = walletCount.find(service => service.service_name == item.Services);

            if (service && service.flat_discount) {
                return {
                    ...item._doc, // Access and spread only the _doc part
                    flat_discount: service.flat_discount // Add flat_discount here
                };
            }
            return item._doc;
        });

        const totalRows = await leadschema.countDocuments({ ...filter, campagin_id: campaignId });

        return res.status(200).json({ success: true, message: "Successfully all leads", data: updatedData, totalRows });
    } else if (findCampagin.length > 1) {
        const campaignIds = findCampagin.map(campaign => campaign._id);

        const data = await leadschema.find({ ...filter, campagin_id: { $in: campaignIds } })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(perPage));

        const getServices = data.flatMap(campaign => {
            const servicesArray = Array.isArray(campaign.Services) ? campaign.Services : [campaign.Services];
            return servicesArray.map(service => ({ service_name: service }));
        });

        const walletCount = (await Promise.all(
            getServices.map(service => {
                return serviceNameSchema.find({ service_name: service.service_name });
            })
        )).flat();

        const updatedData = data.map(item => {
            const service = walletCount.find(service => service.service_name == item.Services);

            if (service && service.flat_discount) {
                return {
                    ...item._doc, // Access and spread only the _doc part
                    flat_discount: service.flat_discount // Add flat_discount here
                };
            }
            return item._doc;
        });

        const totalRows = await leadschema.countDocuments({ ...filter, campagin_id: { $in: campaignIds } });

        return res.status(200).json({ success: true, message: "Successfully all leads", data: updatedData, totalRows });
    } else {
        return res.status(404).json({ success: false, message: "No campaigns found for this influencer" });
    }
};

const influencerWallet = async (req, res) => {
    const { userId } = req.query;
    if (userId == '') {
        return res.status(200).json({ error: true, message: "Please provide the id", data: null });
    } else {
        const findCampagin = await campaignSchema.find({ influencer_id: userId });

        if (findCampagin.length === 1) {
            const campaignId = findCampagin[0]._id;

            const data = await leadschema.find({
                campagin_id: campaignId, status: { $in: ["2", "3", "4"] }, Services: { $ne: null },
                $expr: {
                    $eq: [{ $arrayElemAt: ["$Amount_Due", -1] }, "0"]
                }
            });

            const services = data.flatMap(campaign => {
                const servicesArray = Array.isArray(campaign.Services) ? campaign.Services : [campaign.Services];
                return servicesArray.map(service => ({ service_name: service }));
            });

            const walletCount = (await Promise.all(
                services.map(service => {
                    return serviceNameSchema.find({ service_name: service.service_name });
                })
            )).flat();

            const totalFlatDiscount = walletCount.reduce((sum, campaign) => sum + (campaign.flat_discount || 0), 0).toLocaleString();

            return res.status(200).json({ error: false, message: "Successfully all leads", data: totalFlatDiscount });
        } else if (findCampagin.length > 1) {
            const campaignIds = findCampagin.map(campaign => campaign._id);

            const data = await leadschema.find({
                campagin_id: { $in: campaignIds }, status: { $in: ["2", "3", "4"] }, Services: { $ne: null },
                $expr: {
                    $eq: [{ $arrayElemAt: ["$Amount_Due", -1] }, "0"]
                }
            });

            const services = data.flatMap(campaign => {
                const servicesArray = Array.isArray(campaign.Services) ? campaign.Services : [campaign.Services];
                return servicesArray.map(service => ({ service_name: service }));
            });

            const walletCount = (await Promise.all(
                services.map(service => {
                    return serviceNameSchema.find({ service_name: service.service_name });
                })
            )).flat();

            const totalFlatDiscount = walletCount.reduce((sum, campaign) => sum + (campaign.flat_discount || 0), 0).toLocaleString();

            return res.status(200).json({ error: false, message: "Successfully all leads", data: totalFlatDiscount });
        } else {
            return res.status(404).json({ error: true, message: "No campaigns found for this influencer" });
        }
    }
};

const influencerLeadWallet = async (req, res) => {
    const { page, perPage, searchQuery, startDate, endDate, userId } = req.query;
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

    const findCampagin = await campaignSchema.find({ influencer_id: userId });

    if (findCampagin.length === 1) {
        const campaignId = findCampagin[0]._id;

        const data = await leadschema.find({
            ...filter,
            campagin_id: campaignId, $and: [{ status: { $in: ["2", "3", "4"] } }, { Services: { $ne: null } }, {
                $expr: {
                    $eq: [{ $arrayElemAt: ["$Amount_Due", -1] }, "0"]
                }
            }]
        }).sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(perPage));

        const getServices = data.flatMap(campaign => {
            const servicesArray = Array.isArray(campaign.Services) ? campaign.Services : [campaign.Services];
            return servicesArray.map(service => ({ service_name: service }));
        });

        const walletCount = (await Promise.all(
            getServices.map(service => {
                return serviceNameSchema.find({ service_name: service.service_name });
            })
        )).flat();

        const updatedData = data.map(item => {
            const service = walletCount.find(service => service.service_name == item.Services);

            if (service && service.flat_discount) {
                return {
                    ...item._doc, // Access and spread only the _doc part
                    flat_discount: service.flat_discount // Add flat_discount here
                };
            }
            return item._doc;
        });

        const totalRows = await leadschema.countDocuments({
            ...filter, campagin_id: campaignId, $and: [{ status: { $in: ["2", "3", "4"] } }, { Services: { $ne: null } }, {
                $expr: {
                    $eq: [{ $arrayElemAt: ["$Amount_Due", -1] }, "0"]
                }
            }]
        });

        return res.status(200).json({ error: false, message: "Successfully all leads", data: updatedData, totalRows });
    } else if (findCampagin.length > 1) {
        const campaignIds = findCampagin.map(campaign => campaign._id);

        const data = await leadschema.find({
            ...filter,
            campagin_id: { $in: campaignIds }, $and: [{ status: { $in: ["2", "3", "4"] } }, { Services: { $ne: null } }, {
                $expr: {
                    $eq: [{ $arrayElemAt: ["$Amount_Due", -1] }, "0"]
                }
            }]
        }).sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(perPage));

        const getServices = data.flatMap(campaign => {
            const servicesArray = Array.isArray(campaign.Services) ? campaign.Services : [campaign.Services];
            return servicesArray.map(service => ({ service_name: service }));
        });

        const walletCount = (await Promise.all(
            getServices.map(service => {
                return serviceNameSchema.find({ service_name: service.service_name });
            })
        )).flat();

        const updatedData = data.map(item => {
            const service = walletCount.find(service => service.service_name == item.Services);

            if (service && service.flat_discount) {
                return {
                    ...item._doc, // Access and spread only the _doc part
                    flat_discount: service.flat_discount // Add flat_discount here
                };
            }
            return item._doc;
        });

        const totalRows = await leadschema.countDocuments({
            ...filter, campagin_id: { $in: campaignIds }, $and: [{ status: { $in: ["2", "3", "4"] } }, { Services: { $ne: null } }, {
                $expr: {
                    $eq: [{ $arrayElemAt: ["$Amount_Due", -1] }, "0"]
                }
            }]
        });

        return res.status(200).json({ error: false, message: "Successfully all leads", data: updatedData, totalRows });
    } else {
        return res.status(404).json({ error: true, message: "No campaigns found for this influencer" });
    }
};

const influencerUnpaidWallet = async (req, res) => {
    const { userId } = req.query;
    if (userId == '') {
        return res.status(200).json({ error: true, message: "Please provide the id", data: null });
    } else {
        const findCampagin = await campaignSchema.find({ influencer_id: userId });

        if (findCampagin.length === 1) {
            const campaignId = findCampagin[0]._id;

            const data = await leadschema.find({
                campagin_id: campaignId, status: { $in: ["2", "3", "4"] }, Services: { $ne: null }, status_payment: "0",
                $expr: {
                    $eq: [{ $arrayElemAt: ["$Amount_Due", -1] }, "0"]
                }
            });

            const services = data.flatMap(campaign => {
                const servicesArray = Array.isArray(campaign.Services) ? campaign.Services : [campaign.Services];
                return servicesArray.map(service => ({ service_name: service }));
            });

            const walletCount = (await Promise.all(
                services.map(service => {
                    return serviceNameSchema.find({ service_name: service.service_name });
                })
            )).flat();

            const totalFlatDiscount = walletCount.reduce((sum, campaign) => sum + (campaign.flat_discount || 0), 0).toLocaleString();

            return res.status(200).json({ error: false, message: "Successfully all leads", data: totalFlatDiscount });
        } else if (findCampagin.length > 1) {
            const campaignIds = findCampagin.map(campaign => campaign._id);

            const data = await leadschema.find({
                campagin_id: { $in: campaignIds }, status: { $in: ["2", "3", "4"] }, Services: { $ne: null }, status_payment: "0",
                $expr: {
                    $eq: [{ $arrayElemAt: ["$Amount_Due", -1] }, "0"]
                }
            });

            const services = data.flatMap(campaign => {
                const servicesArray = Array.isArray(campaign.Services) ? campaign.Services : [campaign.Services];
                return servicesArray.map(service => ({ service_name: service }));
            });

            const walletCount = (await Promise.all(
                services.map(service => {
                    return serviceNameSchema.find({ service_name: service.service_name });
                })
            )).flat();

            const totalFlatDiscount = walletCount.reduce((sum, campaign) => sum + (campaign.flat_discount || 0), 0).toLocaleString();

            return res.status(200).json({ error: false, message: "Successfully all leads", data: totalFlatDiscount });
        } else {
            return res.status(404).json({ error: true, message: "No campaigns found for this influencer" });
        }
    }
};

const influencerLeadUnpaidWallet = async (req, res) => {
    const { page, perPage, searchQuery, startDate, endDate, userId } = req.query;
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

    const findCampagin = await campaignSchema.find({ influencer_id: userId });

    if (findCampagin.length === 1) {
        const campaignId = findCampagin[0]._id;

        const data = await leadschema.find({
            ...filter,
            campagin_id: campaignId, $and: [{ status: { $in: ["2", "3", "4"] } }, { Services: { $ne: null } }, { status_payment: "0" }, {
                $expr: {
                    $eq: [{ $arrayElemAt: ["$Amount_Due", -1] }, "0"]
                }
            }]
        }).sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(perPage));

        const getServices = data.flatMap(campaign => {
            const servicesArray = Array.isArray(campaign.Services) ? campaign.Services : [campaign.Services];
            return servicesArray.map(service => ({ service_name: service }));
        });

        const walletCount = (await Promise.all(
            getServices.map(service => {
                return serviceNameSchema.find({ service_name: service.service_name });
            })
        )).flat();

        const updatedData = data.map(item => {
            const service = walletCount.find(service => service.service_name == item.Services);

            if (service && service.flat_discount) {
                return {
                    ...item._doc, // Access and spread only the _doc part
                    flat_discount: service.flat_discount // Add flat_discount here
                };
            }
            return item._doc;
        });

        const totalRows = await leadschema.countDocuments({
            ...filter, campagin_id: campaignId, $and: [{ status: { $in: ["2", "3", "4"] } }, { Services: { $ne: null } }, { status_payment: "0" }, {
                $expr: {
                    $eq: [{ $arrayElemAt: ["$Amount_Due", -1] }, "0"]
                }
            }]
        });

        return res.status(200).json({ error: false, message: "Successfully all leads", data: updatedData, totalRows });
    } else if (findCampagin.length > 1) {
        const campaignIds = findCampagin.map(campaign => campaign._id);

        const data = await leadschema.find({
            ...filter,
            campagin_id: { $in: campaignIds }, $and: [{ status: { $in: ["2", "3", "4"] } }, { Services: { $ne: null } }, { status_payment: "0" }, {
                $expr: {
                    $eq: [{ $arrayElemAt: ["$Amount_Due", -1] }, "0"]
                }
            }]
        }).sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(perPage));

        const getServices = data.flatMap(campaign => {
            const servicesArray = Array.isArray(campaign.Services) ? campaign.Services : [campaign.Services];
            return servicesArray.map(service => ({ service_name: service }));
        });

        const walletCount = (await Promise.all(
            getServices.map(service => {
                return serviceNameSchema.find({ service_name: service.service_name });
            })
        )).flat();

        const updatedData = data.map(item => {
            const service = walletCount.find(service => service.service_name == item.Services);

            if (service && service.flat_discount) {
                return {
                    ...item._doc, // Access and spread only the _doc part
                    flat_discount: service.flat_discount // Add flat_discount here
                };
            }
            return item._doc;
        });

        const totalRows = await leadschema.countDocuments({
            ...filter, campagin_id: { $in: campaignIds }, $and: [{ status: { $in: ["2", "3", "4"] } }, { Services: { $ne: null } }, { status_payment: "0" }, {
                $expr: {
                    $eq: [{ $arrayElemAt: ["$Amount_Due", -1] }, "0"]
                }
            }]
        });

        return res.status(200).json({ error: false, message: "Successfully all leads", data: updatedData, totalRows });
    } else {
        return res.status(404).json({ error: true, message: "No campaigns found for this influencer" });
    }
};

const influencerPaidWallet = async (req, res) => {
    const { userId } = req.query;
    if (userId == '') {
        return res.status(200).json({ error: true, message: "Please provide the id", data: null });
    } else {
        const findCampagin = await campaignSchema.find({ influencer_id: userId });

        if (findCampagin.length === 1) {
            const campaignId = findCampagin[0]._id;

            const data = await leadschema.find({
                campagin_id: campaignId, status: { $in: ["2", "3", "4"] }, Services: { $ne: null }, status_payment: "1",
                $expr: {
                    $eq: [{ $arrayElemAt: ["$Amount_Due", -1] }, "0"]
                }
            });

            const services = data.flatMap(campaign => {
                const servicesArray = Array.isArray(campaign.Services) ? campaign.Services : [campaign.Services];
                return servicesArray.map(service => ({ service_name: service }));
            });

            const walletCount = (await Promise.all(
                services.map(service => {
                    return serviceNameSchema.find({ service_name: service.service_name });
                })
            )).flat();

            const totalFlatDiscount = walletCount.reduce((sum, campaign) => sum + (campaign.flat_discount || 0), 0).toLocaleString();

            return res.status(200).json({ error: false, message: "Successfully all leads", data: totalFlatDiscount });
        } else if (findCampagin.length > 1) {
            const campaignIds = findCampagin.map(campaign => campaign._id);

            const data = await leadschema.find({
                campagin_id: { $in: campaignIds }, status: { $in: ["2", "3", "4"] }, Services: { $ne: null }, status_payment: "1",
                $expr: {
                    $eq: [{ $arrayElemAt: ["$Amount_Due", -1] }, "0"]
                }
            });

            const services = data.flatMap(campaign => {
                const servicesArray = Array.isArray(campaign.Services) ? campaign.Services : [campaign.Services];
                return servicesArray.map(service => ({ service_name: service }));
            });

            const walletCount = (await Promise.all(
                services.map(service => {
                    return serviceNameSchema.find({ service_name: service.service_name });
                })
            )).flat();

            const totalFlatDiscount = walletCount.reduce((sum, campaign) => sum + (campaign.flat_discount || 0), 0).toLocaleString();

            return res.status(200).json({ error: false, message: "Successfully all leads", data: totalFlatDiscount });
        } else {
            return res.status(404).json({ error: true, message: "No campaigns found for this influencer" });
        }
    }
};

const influencerLeadPaidWallet = async (req, res) => {
    const { page, perPage, searchQuery, startDate, endDate, userId } = req.query;
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

    const findCampagin = await campaignSchema.find({ influencer_id: userId });

    if (findCampagin.length === 1) {
        const campaignId = findCampagin[0]._id;

        const data = await leadschema.find({
            ...filter,
            campagin_id: campaignId, $and: [{ status: { $in: ["2", "3", "4"] } }, { Services: { $ne: null } }, { status_payment: "1" }, {
                $expr: {
                    $eq: [{ $arrayElemAt: ["$Amount_Due", -1] }, "0"]
                }
            }]
        }).sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(perPage));

        const getServices = data.flatMap(campaign => {
            const servicesArray = Array.isArray(campaign.Services) ? campaign.Services : [campaign.Services];
            return servicesArray.map(service => ({ service_name: service }));
        });

        const walletCount = (await Promise.all(
            getServices.map(service => {
                return serviceNameSchema.find({ service_name: service.service_name });
            })
        )).flat();

        const updatedData = data.map(item => {
            const service = walletCount.find(service => service.service_name == item.Services);

            if (service && service.flat_discount) {
                return {
                    ...item._doc, // Access and spread only the _doc part
                    flat_discount: service.flat_discount // Add flat_discount here
                };
            }
            return item._doc;
        });

        const totalRows = await leadschema.countDocuments({
            ...filter, campagin_id: campaignId, $and: [{ status: { $in: ["2", "3", "4"] } }, { Services: { $ne: null } }, { status_payment: "1" }, {
                $expr: {
                    $eq: [{ $arrayElemAt: ["$Amount_Due", -1] }, "0"]
                }
            }]
        });

        return res.status(200).json({ error: false, message: "Successfully all leads", data: updatedData, totalRows });
    } else if (findCampagin.length > 1) {
        const campaignIds = findCampagin.map(campaign => campaign._id);

        const data = await leadschema.find({
            ...filter,
            campagin_id: { $in: campaignIds }, $and: [{ status: { $in: ["2", "3", "4"] } }, { Services: { $ne: null } }, { status_payment: "1" }, {
                $expr: {
                    $eq: [{ $arrayElemAt: ["$Amount_Due", -1] }, "0"]
                }
            }]
        }).sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(perPage));

        const getServices = data.flatMap(campaign => {
            const servicesArray = Array.isArray(campaign.Services) ? campaign.Services : [campaign.Services];
            return servicesArray.map(service => ({ service_name: service }));
        });

        const walletCount = (await Promise.all(
            getServices.map(service => {
                return serviceNameSchema.find({ service_name: service.service_name });
            })
        )).flat();

        const updatedData = data.map(item => {
            const service = walletCount.find(service => service.service_name == item.Services);

            if (service && service.flat_discount) {
                return {
                    ...item._doc, // Access and spread only the _doc part
                    flat_discount: service.flat_discount // Add flat_discount here
                };
            }
            return item._doc;
        });

        const totalRows = await leadschema.countDocuments({
            ...filter, campagin_id: { $in: campaignIds }, $and: [{ status: { $in: ["2", "3", "4"] } }, { Services: { $ne: null } }, { status_payment: "1" }, {
                $expr: {
                    $eq: [{ $arrayElemAt: ["$Amount_Due", -1] }, "0"]
                }
            }]
        });

        return res.status(200).json({ error: false, message: "Successfully all leads", data: updatedData, totalRows });
    } else {
        return res.status(404).json({ error: true, message: "No campaigns found for this influencer" });
    }
};

const influencerLeadCount = async (req, res) => {
    const { userId } = req.query;

    const findCampagin = await campaignSchema.find({ influencer_id: userId });

    if (findCampagin.length === 1) {
        const campaignId = findCampagin[0]._id;

        const allLeads = await leadschema.countDocuments({ campagin_id: campaignId })

        const pendingLeads = await leadschema.countDocuments({
            campagin_id: campaignId,
            $or: [
                { status: { $nin: ["2", "3", "4"] } },
                { $expr: { $eq: [{ $arrayElemAt: ["$status_convert", -1] }, "Pending"] } }
            ]
        })

        const convertLeads = await leadschema.countDocuments({
            campagin_id: campaignId, status: { $in: ["2", "3", "4"] },
            $expr: {
                $eq: [{ $arrayElemAt: ["$status_convert", -1] }, "Convert"]
            }
        })

        return res.status(200).json({ error: false, message: "Successfully all leads", data: allLeads, pendingLeads, convertLeads });
    } else if (findCampagin.length > 1) {
        const campaignIds = findCampagin.map(campaign => campaign._id);

        const allLeads = await leadschema.countDocuments({ campagin_id: { $in: campaignIds } });

        const pendingLeads = await leadschema.countDocuments({
            campagin_id: { $in: campaignIds }, $or: [
                { status: { $nin: ["2", "3", "4"] } },
                { $expr: { $eq: [{ $arrayElemAt: ["$status_convert", -1] }, "Pending"] } }
            ]
        })

        const convertLeads = await leadschema.countDocuments({
            campagin_id: {
                $in: campaignIds
            }, status: { $in: ["2", "3", "4"] },
            $expr: {
                $eq: [{ $arrayElemAt: ["$status_convert", -1] }, "Convert"]
            }
        })

        return res.status(200).json({ error: false, message: "Successfully all leads", data: allLeads, pendingLeads, convertLeads });
    } else {
        return res.status(404).json({ error: true, message: "No Leads found for this influencer" });
    }
};

const influencerLeadPending = async (req, res) => {
    const { page, perPage, searchQuery, startDate, endDate, userId } = req.query;
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

    const findCampagin = await campaignSchema.find({ influencer_id: userId });

    if (findCampagin.length === 1) {
        const campaignId = findCampagin[0]._id;

        const data = await leadschema.find({
            ...filter, campagin_id: campaignId, $or: [
                { status: { $nin: ["2", "3", "4"] } },
                { $expr: { $eq: [{ $arrayElemAt: ["$status_convert", -1] }, "Pending"] } }
            ]
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(perPage));

        const getServices = data.flatMap(campaign => {
            const servicesArray = Array.isArray(campaign.Services) ? campaign.Services : [campaign.Services];
            return servicesArray.map(service => ({ service_name: service }));
        });

        const walletCount = (await Promise.all(
            getServices.map(service => {
                return serviceNameSchema.find({ service_name: service.service_name });
            })
        )).flat();

        const updatedData = data.map(item => {
            const service = walletCount.find(service => service.service_name == item.Services);

            if (service && service.flat_discount) {
                return {
                    ...item._doc, // Access and spread only the _doc part
                    flat_discount: service.flat_discount // Add flat_discount here
                };
            }
            return item._doc;
        });

        const totalRows = await leadschema.countDocuments({
            ...filter, campagin_id: campaignId, $or: [
                { status: { $nin: ["2", "3", "4"] } },
                { $expr: { $eq: [{ $arrayElemAt: ["$status_convert", -1] }, "Pending"] } }
            ]
        });

        return res.status(200).json({ success: true, message: "Successfully all leads", data: updatedData, totalRows });
    } else if (findCampagin.length > 1) {
        const campaignIds = findCampagin.map(campaign => campaign._id);

        const data = await leadschema.find({
            ...filter, campagin_id: { $in: campaignIds }, $or: [
                { status: { $nin: ["2", "3", "4"] } },
                { $expr: { $eq: [{ $arrayElemAt: ["$status_convert", -1] }, "Pending"] } }
            ]
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(perPage));

        const getServices = data.flatMap(campaign => {
            const servicesArray = Array.isArray(campaign.Services) ? campaign.Services : [campaign.Services];
            return servicesArray.map(service => ({ service_name: service }));
        });

        const walletCount = (await Promise.all(
            getServices.map(service => {
                return serviceNameSchema.find({ service_name: service.service_name });
            })
        )).flat();

        const updatedData = data.map(item => {
            const service = walletCount.find(service => service.service_name == item.Services);

            if (service && service.flat_discount) {
                return {
                    ...item._doc, // Access and spread only the _doc part
                    flat_discount: service.flat_discount // Add flat_discount here
                };
            }
            return item._doc;
        });

        const totalRows = await leadschema.countDocuments({
            ...filter, campagin_id: { $in: campaignIds }, $or: [
                { status: { $nin: ["2", "3", "4"] } },
                { $expr: { $eq: [{ $arrayElemAt: ["$status_convert", -1] }, "Pending"] } }
            ]
        });

        return res.status(200).json({ success: true, message: "Successfully all leads", data: updatedData, totalRows });
    } else {
        return res.status(404).json({ success: false, message: "No campaigns found for this influencer" });
    }
};

const influencerLeadConvert = async (req, res) => {
    const { page, perPage, searchQuery, startDate, endDate, userId } = req.query;
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

    const findCampagin = await campaignSchema.find({ influencer_id: userId });

    if (findCampagin.length === 1) {
        const campaignId = findCampagin[0]._id;

        const data = await leadschema.find({
            ...filter, campagin_id: campaignId, $and: [{ status: { $in: ["2", "3", "4"] } }, {
                $expr: {
                    $eq: [{ $arrayElemAt: ["$status_convert", -1] }, "Convert"]
                }
            }]
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(perPage));

        const getServices = data.flatMap(campaign => {
            const servicesArray = Array.isArray(campaign.Services) ? campaign.Services : [campaign.Services];
            return servicesArray.map(service => ({ service_name: service }));
        });

        const walletCount = (await Promise.all(
            getServices.map(service => {
                return serviceNameSchema.find({ service_name: service.service_name });
            })
        )).flat();

        const updatedData = data.map(item => {
            const service = walletCount.find(service => service.service_name == item.Services);

            if (service && service.flat_discount) {
                return {
                    ...item._doc, // Access and spread only the _doc part
                    flat_discount: service.flat_discount // Add flat_discount here
                };
            }
            return item._doc;
        });

        const totalRows = await leadschema.countDocuments({
            ...filter, campagin_id: campaignId, $and: [{ status: { $in: ["2", "3", "4"] } }, {
                $expr: {
                    $eq: [{ $arrayElemAt: ["$status_convert", -1] }, "Convert"]
                }
            }]
        });

        return res.status(200).json({ success: true, message: "Successfully all leads", data: updatedData, totalRows });
    } else if (findCampagin.length > 1) {
        const campaignIds = findCampagin.map(campaign => campaign._id);

        const data = await leadschema.find({
            ...filter, campagin_id: { $in: campaignIds }, $and: [{ status: { $in: ["2", "3", "4"] } }, {
                $expr: {
                    $eq: [{ $arrayElemAt: ["$status_convert", -1] }, "Convert"]
                }
            }]
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(perPage));

        const getServices = data.flatMap(campaign => {
            const servicesArray = Array.isArray(campaign.Services) ? campaign.Services : [campaign.Services];
            return servicesArray.map(service => ({ service_name: service }));
        });

        const walletCount = (await Promise.all(
            getServices.map(service => {
                return serviceNameSchema.find({ service_name: service.service_name });
            })
        )).flat();

        const updatedData = data.map(item => {
            const service = walletCount.find(service => service.service_name == item.Services);

            if (service && service.flat_discount) {
                return {
                    ...item._doc, // Access and spread only the _doc part
                    flat_discount: service.flat_discount // Add flat_discount here
                };
            }
            return item._doc;
        });

        const totalRows = await leadschema.countDocuments({
            ...filter, campagin_id: { $in: campaignIds }, $and: [{ status: { $in: ["2", "3", "4"] } }, {
                $expr: {
                    $eq: [{ $arrayElemAt: ["$status_convert", -1] }, "Convert"]
                }
            }]
        });

        return res.status(200).json({ success: true, message: "Successfully all leads", data: updatedData, totalRows });
    } else {
        return res.status(404).json({ success: false, message: "No campaigns found for this influencer" });
    }
    
};
    // const getlist = async (req,res) => {
    //     try {
    //         const totalRows = await leadschema.find()
    //         let array = []
    //         let b = []

    //         for (const element of totalRows) {
    //             if (element.Filing_Process.length == 8 ) {
    //                 array.push(element)
    //                 if (element.Filing_Process[7]) {
    //                     b.push(element.Filing_Process[7])
    //                 }
    //                  leadschema.findOneAndUpdate(element._id)
    //             }
    //           }
    //         return res.status(404).json({ success: true, message: array,b });
    //     } catch (error) {
    //         return res.status(404).json({ success: false, message:error });
    //     }
    // }
    



const influencerAddRole = async (req, res) => {
    try {
        const missingFields = [];

        

        // General required fields validation
        if (!req.body.first_name) missingFields.push('First Name');
        if (!req.body.last_name) missingFields.push('Last Name');
        if (!req.body.email) missingFields.push('Email');
        if (!req.body.contact_number) missingFields.push('Contact Number');
        if (!req.body.password) missingFields.push('Password');
        if (!req.body.conpassword) missingFields.push('Confirm Password');
        if (!req.body.address) missingFields.push('Address');
        if (!req.body.gender) missingFields.push('Gender');
        if (!req.body.social_media_name) missingFields.push('Social Media Name');
        if (!req.body.social_media_link) missingFields.push('Social Media Link');
        if (!req.body.country) missingFields.push('Country');
        if (!req.body.agreement) missingFields.push('Agreement');

        // Conditional validation for India (IN)
        if (req.body.country === 'IN') {
            if (!req.body.bank_name) missingFields.push('Bank Name');
            if (!req.body.account_number) missingFields.push('Account Number');
            if (!req.body.ifsc_code) missingFields.push('IFSC Code');
            if (!req.body.name_of_person) missingFields.push('Name Of Person');
        }

        // Conditional validation for Canadas (CA)
        if (req.body.country === 'CA') {
            if (!req.body.bank_name) missingFields.push('Bank Name');
            if (!req.body.account_number) missingFields.push('Account Number');
            if (!req.body.institution_number) missingFields.push('Institution Number');
            if (!req.body.transit_no) missingFields.push('Transit No');
            if (!req.body.swift_code) missingFields.push('Swift Code');
        }

        // Check for missing fields
        if (missingFields.length > 0) {
            const errorMessage = `The following fields are required: ${missingFields.join(', ')}`;
            return res.status(200).json({ error: true, message: errorMessage, data: null });
        }

        // File validation
        if (!req.files || !req.files.cancelled_cheque || !req.files.cancelled_cheque[0]) {
            return res.status(200).json({ error: true, message: "Upload Copy Of Cancelled Cheque", data: null });
        }

        if (!req.files || !req.files.id_prrof || !req.files.id_prrof[0]) {
            return res.status(200).json({ error: true, message: "Please select aadhar card / passport photo", data: null });
        }

        const findAdmin = await addroleschema.findOne({ job_role: '' });
        const existingRole = await addroleschema.findOne({ email: req.body.email });
        if (existingRole) {
            return res.status(200).json({ error: true, message: "This email is already exists", data: null });
        }

        const newRoleData = {
            user_id: findAdmin._id,
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            email: req.body.email,
            contact_number: req.body.contact_number,
            alternate_number: req.body.alternate_number,
            password: req.body.password,
            address: req.body.address,
            gender: req.body.gender,
            social_media_name: req.body.social_media_name,
            social_media_link: req.body.social_media_link,
            country: req.body.country,
            cancelled_cheque: req.files.cancelled_cheque[0].filename,
            id_prrof: req.files.id_prrof[0].filename,
            agreement: req.body.agreement,
            job_role: req.body.job_role
        };
        
        console.log('newRoleData: ', newRoleData);
        // Additional fields if country is 'IN'
        if (req.body.country === 'IN') {
            newRoleData.bank_name = req.body.bank_name;
            newRoleData.account_number = req.body.account_number;
            newRoleData.ifsc_code = req.body.ifsc_code;
            newRoleData.name_of_person = req.body.name_of_person;
        } else {
            // Fields for other countries
            newRoleData.bank_name = req.body.bank_name;
            newRoleData.account_number = req.body.account_number;
            newRoleData.institution_number = req.body.institution_number;
            newRoleData.transit_no = req.body.transit_no;
            newRoleData.swift_code = req.body.swift_code;
        }

        try {
            // const newRole = new addroleschema(newRoleData);
            const newRole = new roleschema(newRoleData);
            const savedRole = await newRole.save()
            // console.log('savedRole: ', savedRole);

            if (!savedRole) {
                return res.status(200).json({ error: true, message: "Not added", data: null });
            }

            // sendInfluencerMail(req.body.first_name, req.body.last_name, req.body.email, req.body.password);
            return res.status(200).json({ error: false, message: "Successfully added", data: savedRole });

        } catch (error) {
            console.log('error: ', error);
            return res.status(500).json({ error: true, message: "Error adding Influencer", data: null });
        }
    } catch (error) {
        console.log('error: ', error);
        return res.status(500).json({ error: true, message: "Failed to add Influencer", data: null });
    }
};

const influencerAll = async (req, res) => {
    try {
        const { page, perPage, searchQuery, startDate, endDate } = req.query;
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
        const data = await roleschema.find({ ...filter, job_role: { $eq: 'Influencer' } })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(perPage));

        const totalRows = await roleschema.countDocuments({ ...filter, job_role: { $eq: 'Influencer' } });

        return res.status(200).json({ success: true, message: "Successfully all influencer", data: data, totalRows });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

const influencerById = async (req, res) => {
    try {
        const influencerId = req.body.id;
        const influencerDetails = await roleschema.findById(influencerId);
        if (!influencerDetails) {
            return res.status(404).json({ message: 'Lead not found' });
        }
        return res.json({ data: influencerDetails });
    } catch (error) {
        return res.status(500).json({ massage: 'Internal Server Error', error: error });

    }
};

const influencerByIdUpdateStatus = async (req, res) => {
    try {
      const id = req.body._id;
      const updatedStatus = await roleschema.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
      });
      if (updatedStatus == null) {
        return res
          .status(200)
          .json({ error: true, message: "Not update", data: null });
      } else {
        return res.status(200).json({
          error: false,
          message: "Successfully update",
          data: updatedStatus,
        });
      }
    } catch (error) {
      return res
        .status(500)
        .json({ error: true, message: "Internal Server Error", data: null });
    }
  };

module.exports = { influencerList, influencerAllLeads, influencerWallet, influencerLeadWallet, influencerUnpaidWallet, influencerLeadUnpaidWallet, influencerPaidWallet, influencerLeadPaidWallet, influencerLeadCount, influencerLeadPending, influencerLeadConvert, influencerAddRole, influencerAll, influencerById, influencerByIdUpdateStatus };