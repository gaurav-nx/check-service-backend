const leadschema = require('../model/lead.modal')

const GetByIdLead = async (req, res) => {
    try {
        const leadId = req.body.id;

        // Use Mongoose to find the document by ID
        const leadDetails = await leadschema.findById(leadId).sort({ createdAt: -1 });

        if (!leadDetails) {
            return res.status(404).json({ message: 'Role not found' });
        }
        const extractedData = {
            followupDate: leadDetails.Followup_Date,
            notesSales: leadDetails.Notes_sales,
            totalAmount: leadDetails.Total_Amount,
            status_convert: leadDetails.status_convert,
            amountDue: leadDetails.Amount_Due,
            Next_Followup_Date: leadDetails.Next_Followup_Date
            // Add more fields as needed
        };
        return res.json({ data: extractedData });
    } catch (error) {
        return res.status(500).json({ massage: 'Internal Server Error', error: error });

    }
};

module.exports = { GetByIdLead }
